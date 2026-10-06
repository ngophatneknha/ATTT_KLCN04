import os
import sys
import time
import hashlib
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import numpy as np
import joblib

# Fix numpy int compatibility for older code
if not hasattr(np, "int"):
    np.int = int

import lief
import ember.features
from ember.features import PEFeatureExtractor

app = FastAPI(
    title="KLCN04 Malware Detection API",
    description="Backend API for Windows PE Static Malware Detection using EMBER 2018",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# Global State & Lazy Loaders
# -------------------------------------------------------------
BUNDLE_PATH = Path("klcn04_models_bundle.joblib")
SAMPLES_PATH = Path("sample_test_vectors.npz")
DEMO_DIR = Path("demo_samples")
FRONTEND_DIST = Path("frontend/dist")

bundle = None
extractor = None
sample_vectors = None

def get_bundle():
    global bundle
    if bundle is None:
        if not BUNDLE_PATH.exists():
            raise RuntimeError(f"Bundle not found at {BUNDLE_PATH}")
        bundle = joblib.load(BUNDLE_PATH)
    return bundle

def get_extractor():
    global extractor
    if extractor is None:
        extractor = PEFeatureExtractor(feature_version=2)
    return extractor

def get_sample_vectors():
    global sample_vectors
    if sample_vectors is None and SAMPLES_PATH.exists():
        data = np.load(SAMPLES_PATH)
        sample_vectors = {
            "vectors": data["vectors"],
            "names": data["names"],
            "sha256s": data["sha256s"],
            "labels": data["labels"]
        }
    return sample_vectors

# -------------------------------------------------------------
# Pydantic Schemas
# -------------------------------------------------------------
class SampleScanRequest(BaseModel):
    sample_id: str
    model: str = "LightGBM"
    threshold: float = 0.50

# -------------------------------------------------------------
# Diagnostic Helpers
# -------------------------------------------------------------
def analyze_pe_raw(bytez: bytes, vector: np.ndarray, model_name: str, threshold: float, filename: str):
    t_start = time.perf_counter()
    b = get_bundle()
    x = vector.reshape(1, -1)

    t_inf_start = time.perf_counter()
    if "LightGBM" in model_name:
        prob = float(b["lgb_model"].predict_proba(x)[0, 1])
        actual_model = "LightGBM (Refit 600k)"
    elif "XGBoost" in model_name:
        prob = float(b["xgb_model"].predict_proba(x)[0, 1])
        actual_model = "XGBoost (Refit 600k)"
    else:
        p1 = float(b["lgb_model"].predict_proba(x)[0, 1])
        p2 = float(b["xgb_model"].predict_proba(x)[0, 1])
        prob = (p1 + p2) / 2.0
        actual_model = "Ensemble Blending (SoftVoting LGBM + XGB)"
    inf_time_ms = (time.perf_counter() - t_inf_start) * 1000.0

    is_malware = (prob >= threshold)
    
    if prob < 0.10:
        risk_level = "VERY_LOW"
        risk_label = "Rất An Toàn (Clean Binary)"
    elif prob < 0.40:
        risk_level = "LOW"
        risk_label = "Rủi Ro Thấp (Low Risk)"
    elif prob < 0.70:
        risk_level = "SUSPICIOUS"
        risk_label = "Nghi Vấn Khả Nghi (Suspicious)"
    elif prob < 0.90:
        risk_level = "HIGH"
        risk_label = "Nguy Cơ Cao (High Risk Malware)"
    else:
        risk_level = "CRITICAL"
        risk_label = "Nguy Hiểm Nghiêm Trọng (Critical Threat)"

    # XAI Group importance
    group_stats = []
    for g_key, g_info in b["feature_groups"].items():
        s, e = g_info["slice"]
        sub_vec = np.abs(vector[s:e])
        energy = float(np.linalg.norm(sub_vec))
        group_stats.append({
            "key": g_key,
            "name": g_info["name"],
            "dim": g_info["dim"],
            "energy": round(energy, 4)
        })
    group_stats.sort(key=lambda item: item["energy"], reverse=True)

    # Byte histogram (first 256 values)
    byte_histogram = [float(v) for v in vector[:256]]

    # Parse sections and imports via LIEF or Raw if available
    sections_info = []
    imports_info = []
    
    if bytez and len(bytez) > 100 and bytez[:2] == b"MZ":
        try:
            ext = get_extractor()
            raw = ext.raw_features(bytez)
            if "section" in raw and "sections" in raw["section"]:
                for s in raw["section"]["sections"]:
                    entropy = float(s.get("entropy", 0.0))
                    props = s.get("props", [])
                    is_wx = ("MEM_WRITE" in props and "MEM_EXECUTE" in props)
                    is_high_entropy = (entropy > 7.0)
                    
                    sec_status = "Bình thường"
                    if is_wx:
                        sec_status = "Khả nghi: Phân vùng W+X (Self-modifying / Unpacked)"
                    elif is_high_entropy:
                        sec_status = "Khả nghi: Entropy > 7.0 (Nén/Mã hóa)"

                    sections_info.append({
                        "name": str(s.get("name", "")),
                        "virtual_size": int(s.get("vsize", 0)),
                        "raw_size": int(s.get("size", 0)),
                        "entropy": round(entropy, 3),
                        "props": props,
                        "status": sec_status,
                        "warning": is_wx or is_high_entropy
                    })
            
            if "imports" in raw:
                for dll, funcs in raw["imports"].items():
                    imports_info.append({
                        "dll": str(dll),
                        "api_count": len(funcs),
                        "sample_apis": funcs[:5]
                    })
        except Exception as e:
            print("Error parsing sections/imports with LIEF:", e)

    total_time_ms = (time.perf_counter() - t_start) * 1000.0

    return {
        "file_name": filename,
        "size_bytes": len(bytez) if bytez else len(vector) * 4,
        "sha256": hashlib.sha256(bytez).hexdigest() if bytez else "EMBER_PRECOMPUTED",
        "md5": hashlib.md5(bytez).hexdigest() if bytez else "EMBER_PRECOMPUTED",
        "model_used": actual_model,
        "threshold": threshold,
        "malware_score": round(prob, 6),
        "malware_percent": round(prob * 100.0, 2),
        "is_malware": is_malware,
        "verdict": "MALICIOUS" if is_malware else "BENIGN",
        "risk_level": risk_level,
        "risk_label": risk_label,
        "latency_inference_ms": round(inf_time_ms, 2),
        "latency_total_ms": round(total_time_ms, 2),
        "sections": sections_info,
        "imports": imports_info,
        "byte_histogram": byte_histogram,
        "xai_groups": group_stats
    }

# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------
@app.get("/api/info")
def get_system_info():
    b = get_bundle()
    return {
        "project": "ATTT_KLCN04 — Phát hiện mã độc PE Windows",
        "dataset": "EMBER 2018 v2 (1.100.000 mẫu)",
        "features_dim": 2381,
        "models_available": [
            {
                "id": "LightGBM",
                "name": "LightGBM (Refit 600k)",
                "description": "Siêu nhanh, tối ưu Low-FPR (TPR@FPR=0.1% đạt 86.02%, ROC-AUC 0.9954)",
                "recommended": True
            },
            {
                "id": "XGBoost",
                "name": "XGBoost (Refit 600k)",
                "description": "Độ chính xác cao, TPR@FPR=1.0% đạt 95.29%, ROC-AUC 0.9953"
            },
            {
                "id": "Ensemble",
                "name": "Ensemble Blending (SoftVoting LGBM + XGB)",
                "description": "Kết hợp bình quân xác suất của 2 thuật toán boosting mạnh nhất"
            }
        ],
        "threshold_presets": {
            "balanced": {"value": 0.5000, "label": "Cân bằng F1 tối ưu (0.500)"},
            "low_fpr": {"value": round(float(b["thresholds"]["low_fpr_001"]), 4), "label": "Khắt khe chống báo động giả FPR ≤ 0.1% (0.914)"}
        }
    }

@app.get("/api/samples")
def list_demo_samples():
    samples = []
    
    # Check local Windows benign samples
    if DEMO_DIR.exists():
        for f in DEMO_DIR.glob("*.exe"):
            samples.append({
                "id": f"local:{f.name}",
                "name": f"Windows System: {f.name}",
                "category": "BENIGN",
                "source": "Local System32 Clean Binary"
            })

    # Check precomputed EMBER samples
    sv = get_sample_vectors()
    if sv:
        for idx in range(len(sv["names"])):
            samples.append({
                "id": f"ember:{idx}",
                "name": str(sv["names"][idx]),
                "category": str(sv["labels"][idx]),
                "source": "EMBER 2018 Test Set (200k samples)"
            })

    return {"samples": samples}

@app.post("/api/scan/file")
async def scan_pe_file(
    file: UploadFile = File(...),
    model: str = Form("LightGBM"),
    threshold: float = Form(0.50)
):
    contents = await file.read()
    if len(contents) < 64:
        raise HTTPException(status_code=400, detail="Tệp quá nhỏ để là một tệp thực thi PE Windows hợp lệ.")

    if contents[:2] != b"MZ":
        raise HTTPException(status_code=400, detail="Tệp không có chữ ký DOS Header 'MZ'. Không phải tệp Portable Executable.")

    try:
        ext = get_extractor()
        vector = np.asarray(ext.feature_vector(contents), dtype=np.float32)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi trích xuất đặc trưng PE: {str(e)}")

    analysis = analyze_pe_raw(
        bytez=contents,
        vector=vector,
        model_name=model,
        threshold=threshold,
        filename=file.filename or "uploaded.exe"
    )
    return analysis

@app.post("/api/scan/sample")
def scan_demo_sample(req: SampleScanRequest):
    if req.sample_id.startswith("local:"):
        fname = req.sample_id.split(":", 1)[1]
        p = DEMO_DIR / fname
        if not p.exists():
            raise HTTPException(status_code=404, detail="Không tìm thấy tệp mẫu cục bộ.")
        bytez = p.read_bytes()
        ext = get_extractor()
        vector = np.asarray(ext.feature_vector(bytez), dtype=np.float32)
        return analyze_pe_raw(bytez, vector, req.model, req.threshold, fname)

    elif req.sample_id.startswith("ember:"):
        idx = int(req.sample_id.split(":", 1)[1])
        sv = get_sample_vectors()
        if not sv or idx >= len(sv["names"]):
            raise HTTPException(status_code=404, detail="Không tìm thấy mẫu EMBER.")
        
        vector = sv["vectors"][idx]
        name = str(sv["names"][idx])
        label = str(sv["labels"][idx])
        res = analyze_pe_raw(b"MZ" + b"\x00"*100, vector, req.model, req.threshold, name)
        res["true_label_hint"] = label
        return res

    else:
        raise HTTPException(status_code=400, detail="Mã mẫu không hợp lệ.")

@app.get("/api/benchmark")
def get_benchmark_comparison():
    return {
        "models": [
            {"group": "Ensemble", "name": "SoftVoting (LGBM + XGB + RF)", "roc_auc": 0.995408, "avg_prec": 0.996071, "tpr_fpr_001": 84.36, "tpr_fpr_01": 95.32, "accuracy": 97.39, "f1": 0.973865, "rank": "🏆 Quán quân"},
            {"group": "Gradient Boosting", "name": "LightGBM (Refit 600k)", "roc_auc": 0.995368, "avg_prec": 0.996012, "tpr_fpr_001": 86.02, "tpr_fpr_01": 94.80, "accuracy": 97.26, "f1": 0.972551, "rank": "🥈 Á quân 1"},
            {"group": "Gradient Boosting", "name": "XGBoost (Refit 600k)", "roc_auc": 0.995310, "avg_prec": 0.995996, "tpr_fpr_001": 84.93, "tpr_fpr_01": 95.29, "accuracy": 97.27, "f1": 0.972687, "rank": "🥉 Á quân 2"},
            {"group": "Gradient Boosting", "name": "CatBoost", "roc_auc": 0.990427, "avg_prec": 0.991573, "tpr_fpr_001": 66.19, "tpr_fpr_01": 88.81, "accuracy": 95.47, "f1": 0.955112, "rank": "Top 5"},
            {"group": "Bagging / Trees", "name": "Random Forest (Refit 600k)", "roc_auc": 0.990492, "avg_prec": 0.991352, "tpr_fpr_001": 69.78, "tpr_fpr_01": 86.09, "accuracy": 95.37, "f1": 0.953521, "rank": "Top 6"},
            {"group": "Bagging / Trees", "name": "Extra Trees", "roc_auc": 0.991729, "avg_prec": 0.992541, "tpr_fpr_001": 72.14, "tpr_fpr_01": 89.39, "accuracy": 95.82, "f1": 0.957833, "rank": "Top 4"},
            {"group": "Gradient Boosting", "name": "HistGradientBoosting", "roc_auc": 0.991221, "avg_prec": 0.992447, "tpr_fpr_001": 74.75, "tpr_fpr_01": 90.77, "accuracy": 95.61, "f1": 0.956318, "rank": "Top 7"},
            {"group": "Tabular Deep Learning", "name": "RealMLP", "roc_auc": 0.987281, "avg_prec": 0.982111, "tpr_fpr_001": 2.13, "tpr_fpr_01": 94.50, "accuracy": 97.28, "f1": 0.972792, "rank": "DL Top 1"},
            {"group": "Tabular Deep Learning", "name": "ResNet-Tabular", "roc_auc": 0.987327, "avg_prec": 0.989475, "tpr_fpr_001": 64.98, "tpr_fpr_01": 87.71, "accuracy": 95.04, "f1": 0.950485, "rank": "DL Top 2"},
            {"group": "Tabular Deep Learning", "name": "MLP (Wide 1024-512-256)", "roc_auc": 0.987961, "avg_prec": 0.988964, "tpr_fpr_001": 64.69, "tpr_fpr_01": 85.38, "accuracy": 94.92, "f1": 0.949166, "rank": "DL Top 3"},
            {"group": "Tabular Deep Learning", "name": "MLP Tiêu chuẩn (512-256)", "roc_auc": 0.984853, "avg_prec": 0.987034, "tpr_fpr_001": 62.64, "tpr_fpr_01": 87.39, "accuracy": 94.98, "f1": 0.949473, "rank": "DL Baseline"},
            {"group": "Ensemble", "name": "Weighted Blending (Hill Climbing)", "roc_auc": 0.990071, "avg_prec": 0.990986, "tpr_fpr_001": 63.10, "tpr_fpr_01": 86.22, "accuracy": 95.08, "f1": 0.951833, "rank": "Ensemble"},
            {"group": "Ensemble", "name": "Logistic Stacking", "roc_auc": 0.988089, "avg_prec": 0.981927, "tpr_fpr_001": 0.58, "tpr_fpr_01": 83.48, "accuracy": 95.11, "f1": 0.952238, "rank": "Stacking"},
            {"group": "Mô hình Cổ điển", "name": "Logistic Regression", "roc_auc": 0.957000, "avg_prec": 0.956215, "tpr_fpr_001": 5.46, "tpr_fpr_01": 55.76, "accuracy": 88.07, "f1": 0.885971, "rank": "Tuyến tính"},
            {"group": "Mô hình Cổ điển", "name": "Decision Tree (Max Depth=20)", "roc_auc": 0.947467, "avg_prec": 0.924068, "tpr_fpr_001": 0.00, "tpr_fpr_01": 0.00, "accuracy": 91.87, "f1": 0.919964, "rank": "Cây đơn lẻ"}
        ]
    }

# -------------------------------------------------------------
# Static files mounting for React frontend (production bundle)
# -------------------------------------------------------------
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="static")
