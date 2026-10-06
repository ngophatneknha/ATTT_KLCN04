import streamlit as st
import numpy as np
import pandas as pd
import joblib
import hashlib
import time
import os
from pathlib import Path

# Compatibility for numpy.int in older libraries
if not hasattr(np, "int"):
    np.int = int

import lief
import ember.features
from ember.features import PEFeatureExtractor

# ---------------------------------------------------------
# Page Configuration & Styling
# ---------------------------------------------------------
st.set_page_config(
    page_title="KLCN04 — Windows PE Malware Detector",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for high-tech Cybersecurity aesthetics
st.markdown("""
<style>
    .main-title {
        font-size: 2.2rem;
        font-weight: 700;
        color: #1E3A8A;
        margin-bottom: 0.2rem;
    }
    .sub-title {
        font-size: 1.05rem;
        color: #4B5563;
        margin-bottom: 1.2rem;
    }
    .verdict-box-benign {
        background: linear-gradient(135deg, #065F46 0%, #047857 100%);
        color: white;
        padding: 24px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 4px 14px rgba(4, 120, 87, 0.25);
        margin-bottom: 16px;
    }
    .verdict-box-malware {
        background: linear-gradient(135deg, #991B1B 0%, #DC2626 100%);
        color: white;
        padding: 24px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 4px 14px rgba(220, 38, 38, 0.25);
        margin-bottom: 16px;
    }
    .verdict-title {
        font-size: 2rem;
        font-weight: 800;
        letter-spacing: 1.5px;
        margin-bottom: 6px;
    }
    .metric-card {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        padding: 14px;
        text-align: center;
    }
    .metric-label {
        font-size: 0.85rem;
        color: #64748B;
        font-weight: 600;
    }
    .metric-val {
        font-size: 1.25rem;
        font-weight: 700;
        color: #0F172A;
    }
    .alert-banner {
        padding: 12px 18px;
        border-radius: 8px;
        font-size: 0.92rem;
        margin-bottom: 15px;
    }
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# Resource Caching
# ---------------------------------------------------------
@st.cache_resource(show_spinner=False)
def load_model_bundle():
    bundle_path = Path("klcn04_models_bundle.joblib")
    if not bundle_path.exists():
        st.error(f"Không tìm thấy model bundle tại: {bundle_path}")
        st.stop()
    return joblib.load(bundle_path)

@st.cache_resource(show_spinner=False)
def get_feature_extractor():
    return PEFeatureExtractor(feature_version=2)

@st.cache_data(show_spinner=False)
def load_sample_vectors():
    path = Path("sample_test_vectors.npz")
    if path.exists():
        data = np.load(path)
        return {
            "vectors": data["vectors"],
            "names": data["names"],
            "sha256s": data["sha256s"],
            "labels": data["labels"]
        }
    return None

# Load resources
bundle = load_model_bundle()
extractor = get_feature_extractor()
sample_vectors = load_sample_vectors()

# ---------------------------------------------------------
# Sidebar Controls
# ---------------------------------------------------------
with st.sidebar:
    st.image("https://img.icons8.com/fluency/96/shield.png", width=72)
    st.markdown("### ⚙️ Cấu hình Hệ thống AI")
    
    model_choice = st.selectbox(
        "Mô hình AI dự đoán:",
        options=[
            "LightGBM (Refit 600k — Tối ưu tốc độ & low-FPR)",
            "XGBoost (Refit 600k — Cực kỳ chuẩn xác)",
            "Ensemble Blending (SoftVoting LGBM + XGB)"
        ],
        index=0
    )
    
    st.markdown("---")
    st.markdown("### 🎯 Chính sách Ngưỡng (Threshold)")
    threshold_policy = st.radio(
        "Chế độ quyết định:",
        [
            "Cân bằng F1 tối ưu (Threshold = 0.500)",
            "Khắt khe chống báo động giả (FPR ≤ 0.1%, Threshold = 0.914)",
            "Tùy chỉnh thủ công"
        ],
        index=0
    )
    
    if threshold_policy == "Cân bằng F1 tối ưu (Threshold = 0.500)":
        threshold = 0.5000
    elif "Khắt khe" in threshold_policy:
        threshold = float(bundle["thresholds"]["low_fpr_001"])
    else:
        threshold = st.slider("Ngưỡng phân loại:", min_value=0.01, max_value=0.99, value=0.50, step=0.01)
        
    st.caption(f"Ngưỡng kích hoạt: **{threshold:.4f}**")
    
    st.markdown("---")
    st.markdown("### 📌 Thông tin Đồ án")
    st.markdown("""
    * **Đề tài:** Phát hiện mã độc PE Windows qua phân tích tĩnh.
    * **Mã đồ án:** `ATTT_KLCN04`
    * **Dataset:** EMBER 2018 v2 (1.1 triệu mẫu)
    * **Số chiều đặc trưng:** 2.381 features
    * **Cơ chế an toàn:** Đọc byte tĩnh, tuyệt đối không thực thi binary.
    """)

# ---------------------------------------------------------
# Main UI Layout
# ---------------------------------------------------------
st.markdown('<div class="main-title">🛡️ KLCN04 — HỆ THỐNG PHÁT HIỆN MÃ ĐỘC WINDOWS PE</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-title">Khóa luận Cử nhân An toàn Thông tin — Ứng dụng Phân tích tĩnh & Học máy chuyên sâu trên tập dữ liệu chuẩn EMBER 2018</div>', unsafe_allow_html=True)

st.info("🔒 **Nguyên tắc an toàn thực nghiệm:** Ứng dụng thực hiện phân tích tĩnh (Static Analysis) thuần túy thông qua trích xuất đặc trưng PE Header, Sections, Imports, Byte Entropy. Binary tải lên **không được thực thi**, không tạo tiến trình, không gây nguy hiểm cho hệ thống.")

tab_scanner, tab_benchmark, tab_about = st.tabs([
    "🔍 Quét & Phân tích Tệp PE (Live Scanner)",
    "📊 Đối sánh Benchmark 19 Mô hình (Chương 3)",
    "📖 Kiến trúc & Phương pháp luận Đồ án"
])

# ---------------------------------------------------------
# Tab 1: Live Scanner
# ---------------------------------------------------------
with tab_scanner:
    col_input1, col_input2 = st.columns([3, 2])
    
    file_bytes = None
    file_name = None
    precomputed_vector = None
    true_label_hint = None
    
    with col_input1:
        st.markdown("#### 📂 1. Tải lên tệp PE cần kiểm tra (.exe, .dll, .sys)")
        uploaded_file = st.file_uploader(
            "Chọn tệp nhị phân Windows PE từ máy tính:",
            type=["exe", "dll", "sys", "ocx", "scr"],
            help="Hỗ trợ các định dạng Portable Executable 32-bit và 64-bit."
        )
        if uploaded_file is not None:
            file_bytes = uploaded_file.getvalue()
            file_name = uploaded_file.name

    with col_input2:
        st.markdown("#### 🧪 2. Hoặc chọn mẫu thử nghiệm nhanh")
        demo_choice = st.selectbox(
            "Mẫu nạp sẵn để trình diễn demo:",
            options=[
                "-- Tự tải tệp lên ở bên trái --",
                "Mẫu Windows Benign: notepad.exe (System32)",
                "Mẫu Windows Benign: regedt32.exe (System32)",
                "EMBER Test: Malware Sample #0 (Appeared 2018-11)",
                "EMBER Test: Benign Sample #1 (Appeared 2018-11)",
                "EMBER Test: Malware Sample #2 (Appeared 2018-11)",
                "EMBER Test: Benign Sample #3 (Appeared 2018-11)"
            ]
        )
        
        if demo_choice == "Mẫu Windows Benign: notepad.exe (System32)":
            p = Path("demo_samples/notepad.exe")
            if p.exists():
                file_bytes = p.read_bytes()
                file_name = "notepad.exe (Windows Clean)"
                true_label_hint = "BENIGN (Mẫu hệ thống chuẩn Windows)"
        elif demo_choice == "Mẫu Windows Benign: regedt32.exe (System32)":
            p = Path("demo_samples/regedt32.exe")
            if p.exists():
                file_bytes = p.read_bytes()
                file_name = "regedt32.exe (Windows Clean)"
                true_label_hint = "BENIGN (Mẫu hệ thống chuẩn Windows)"
        elif "EMBER Test:" in demo_choice and sample_vectors is not None:
            idx = 0
            if "#0" in demo_choice: idx = 0
            elif "#1" in demo_choice: idx = 5
            elif "#2" in demo_choice: idx = 1
            elif "#3" in demo_choice: idx = 6
            
            precomputed_vector = sample_vectors["vectors"][idx]
            file_name = sample_vectors["names"][idx]
            true_label_hint = sample_vectors["labels"][idx]
            file_bytes = b"MZ" # Mock header for vector mode
            demo_sha256 = sample_vectors["sha256s"][idx]

    # Processing block
    if file_bytes is not None:
        st.markdown("---")
        st.markdown("### 🔬 Kết quả Chẩn đoán & Phân tích Chuyên sâu")
        
        # Check MZ header
        if file_bytes[:2] != b"MZ":
            st.error("❌ Tệp được chọn không có chữ ký hợp lệ của định dạng PE (thiếu chữ ký DOS Header 'MZ').")
            st.stop()
            
        t_start = time.perf_counter()
        
        # Extract features or use precomputed
        raw_features = None
        if precomputed_vector is not None:
            vector = precomputed_vector
            sha256_hash = demo_sha256
            md5_hash = "Đã trích xuất từ tập kiểm thử độc lập EMBER 2018"
            file_size_bytes = len(vector) * 4
            extract_time_ms = 0.5
        else:
            sha256_hash = hashlib.sha256(file_bytes).hexdigest()
            md5_hash = hashlib.md5(file_bytes).hexdigest()
            file_size_bytes = len(file_bytes)
            
            t_ext_0 = time.perf_counter()
            vector = np.asarray(extractor.feature_vector(file_bytes), dtype=np.float32)
            raw_features = extractor.raw_features(file_bytes)
            extract_time_ms = (time.perf_counter() - t_ext_0) * 1000.0

        # Predict
        t_pred_0 = time.perf_counter()
        x_in = vector.reshape(1, -1)
        
        if "LightGBM" in model_choice:
            malware_prob = float(bundle["lgb_model"].predict_proba(x_in)[0, 1])
            model_used_name = "LightGBM (Refit 600k)"
        elif "XGBoost" in model_choice:
            malware_prob = float(bundle["xgb_model"].predict_proba(x_in)[0, 1])
            model_used_name = "XGBoost (Refit 600k)"
        else:
            p_lgb = float(bundle["lgb_model"].predict_proba(x_in)[0, 1])
            p_xgb = float(bundle["xgb_model"].predict_proba(x_in)[0, 1])
            malware_prob = (p_lgb + p_xgb) / 2.0
            model_used_name = "Ensemble Blending (LightGBM + XGBoost)"
            
        pred_time_ms = (time.perf_counter() - t_pred_0) * 1000.0
        total_time_ms = (time.perf_counter() - t_start) * 1000.0
        
        is_malware = (malware_prob >= threshold)
        
        # Display Verdict
        col_verdict, col_metrics = st.columns([1, 1])
        
        with col_verdict:
            if is_malware:
                st.markdown(f"""
                <div class="verdict-box-malware">
                    <div style="font-size: 2.5rem;">⚠️</div>
                    <div class="verdict-title">MÃ ĐỘC (MALICIOUS)</div>
                    <div style="font-size: 1.15rem; font-weight: 500;">
                        Xác suất độc hại: <b>{malware_prob * 100:.2f}%</b> (Vượt ngưỡng {threshold * 100:.2f}%)
                    </div>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div class="verdict-box-benign">
                    <div style="font-size: 2.5rem;">✅</div>
                    <div class="verdict-title">AN TOÀN (BENIGN)</div>
                    <div style="font-size: 1.15rem; font-weight: 500;">
                        Xác suất độc hại: <b>{malware_prob * 100:.2f}%</b> (Dưới ngưỡng {threshold * 100:.2f}%)
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
            # Risk gauge
            st.write(f"**Thước đo nguy cơ độc hại:** `{malware_prob * 100:.2f}%` / `100%`")
            st.progress(float(malware_prob))
            
            if true_label_hint:
                st.info(f"🏷️ **Nhãn kiểm chứng gốc trong Dataset:** `{true_label_hint}`")

        with col_metrics:
            st.markdown("#### ⚡ Thông số Đánh giá & Hiệu năng")
            m1, m2 = st.columns(2)
            m1.metric("Mô hình AI", model_used_name)
            m2.metric("Ngưỡng phân loại", f"{threshold:.4f}")
            
            m3, m4 = st.columns(2)
            m3.metric("Thời gian trích xuất", f"{extract_time_ms:.1f} ms")
            m4.metric("Thời gian suy luận AI", f"{pred_time_ms:.2f} ms")
            
            # Risk Level evaluation
            if malware_prob < 0.10:
                risk_level = "🟢 Rất An Toàn (Clean Binary)"
            elif malware_prob < 0.40:
                risk_level = "🟡 Rủi ro Thấp (Low Risk)"
            elif malware_prob < 0.70:
                risk_level = "🟠 Nghi vấn Khả nghi (Suspicious)"
            elif malware_prob < 0.90:
                risk_level = "🔴 Nguy cơ Cao (High Risk Malware)"
            else:
                risk_level = "☠️ Mã độc Cực kỳ Nguy hiểm (Critical Malware)"
            st.metric("Mức độ Rủi ro (Risk Tier)", risk_level)

        # File Static Summary
        st.markdown("#### 📋 Thông tin Định danh & Thuộc tính Tĩnh")
        meta_df = pd.DataFrame([
            {"Thuộc tính": "Tên tệp", "Giá trị": file_name},
            {"Thuộc tính": "Kích thước dung lượng", "Giá trị": f"{file_size_bytes:,} bytes ({file_size_bytes / (1024*1024):.2f} MB)"},
            {"Thuộc tính": "Mã băm SHA-256", "Giá trị": sha256_hash},
            {"Thuộc tính": "Mã băm MD5", "Giá trị": md5_hash},
            {"Thuộc tính": "Số chiều đặc trưng EMBER trích xuất", "Giá trị": f"{len(vector):,} features (Float32)"}
        ])
        st.dataframe(meta_df, use_container_width=True, hide_index=True)

        # Technical Forensics (Sections, Imports, Strings, Byte Histogram)
        st.markdown("#### 🔍 Chi tiết Phân tích Tĩnh (Forensics Analysis)")
        
        c_forensic1, c_forensic2 = st.columns([1, 1])
        
        with c_forensic1:
            st.markdown("##### 🗂️ Phân tích các Phân vùng (PE Sections)")
            if raw_features and "section" in raw_features and "sections" in raw_features["section"]:
                sec_list = raw_features["section"]["sections"]
                if len(sec_list) > 0:
                    sec_rows = []
                    for s in sec_list:
                        is_suspicious_entropy = s.get("entropy", 0.0) > 7.0
                        props = ", ".join(s.get("props", []))
                        is_wx = ("MEM_WRITE" in props and "MEM_EXECUTE" in props)
                        
                        status = "Bình thường"
                        if is_wx: status = "⚠️ W+X (Khả nghi unpacked/packer)"
                        elif is_suspicious_entropy: status = "⚠️ Entropy cao (>7.0 - nén/mã hóa)"
                        
                        sec_rows.append({
                            "Tên Section": s.get("name", "N/A"),
                            "Kích thước ảo (VSize)": f"{s.get('vsize', 0):,}",
                            "Kích thước thô (RawSize)": f"{s.get('size', 0):,}",
                            "Entropy (0-8)": f"{s.get('entropy', 0.0):.3f}",
                            "Trạng thái": status
                        })
                    st.dataframe(pd.DataFrame(sec_rows), use_container_width=True, hide_index=True)
                else:
                    st.write("Không tìm thấy section nào.")
            else:
                st.write("Tệp chạy từ vector nạp sẵn trong bộ nhớ kiểm thử EMBER 2018 (255 chiều section đã mã hóa feature).")

        with c_forensic2:
            st.markdown("##### 📚 Thư viện Liên kết & API (Import Table)")
            if raw_features and "imports" in raw_features:
                imp_dict = raw_features["imports"]
                if len(imp_dict) > 0:
                    imp_rows = []
                    for dll, funcs in imp_dict.items():
                        imp_rows.append({
                            "DLL Liên kết": dll,
                            "Số hàm API nhập": len(funcs),
                            "Các API tiêu biểu": ", ".join(funcs[:5]) + ("..." if len(funcs) > 5 else "")
                        })
                    st.dataframe(pd.DataFrame(imp_rows), use_container_width=True, hide_index=True)
                else:
                    st.write("Tệp không khai báo bảng Import hoặc đã bị pack / stripped.")
            else:
                st.write("Dữ liệu Imports được mã hóa trong 1.280 chiều Hashed Feature của EMBER.")

        # Byte Histogram Chart
        st.markdown("##### 📊 Phân bố Byte Histogram (0 — 255)")
        byte_hist = vector[:256]
        hist_df = pd.DataFrame({"Byte Value": list(range(256)), "Tần suất (Normalized)": byte_hist})
        st.bar_chart(hist_df, x="Byte Value", y="Tần suất (Normalized)", height=220)

        # XAI Feature Group Contribution
        st.markdown("##### 🧠 Giải thích Mô hình AI: Phân bố Trọng số theo 9 Nhóm Đặc trưng")
        group_weights = []
        for g_id, g_info in bundle["feature_groups"].items():
            start, end = g_info["slice"]
            g_vec = np.abs(vector[start:end])
            group_weights.append({
                "Nhóm đặc trưng": g_info["name"],
                "Số chiều": g_info["dim"],
                "Độ biến thiên năng lượng (L2 Norm)": float(np.linalg.norm(g_vec))
            })
        gw_df = pd.DataFrame(group_weights).sort_values("Độ biến thiên năng lượng (L2 Norm)", ascending=False)
        st.dataframe(gw_df, use_container_width=True, hide_index=True)

# ---------------------------------------------------------
# Tab 2: Benchmark Đối sánh 19 Mô hình
# ---------------------------------------------------------
with tab_benchmark:
    st.markdown("### 📊 Bảng Đối sánh Hiệu năng Thực nghiệm (Chương 3 Khóa luận)")
    st.markdown("""
    Toàn bộ số liệu dưới đây được trích xuất trực tiếp từ các lượt huấn luyện và kiểm thử quy mô lớn trên **600.000 mẫu train** và **200.000 mẫu test độc lập** của cơ sở dữ liệu EMBER 2018.
    """)
    
    benchmark_data = [
        {"Nhóm": "Ensemble", "Mô hình": "SoftVoting (LGBM + XGB + RF)", "ROC-AUC": 0.995408, "Avg Precision": 0.996071, "TPR @ FPR=0.1%": "84.36%", "TPR @ FPR=1.0%": "95.32%", "Accuracy": "97.39%", "F1-Score": 0.973865, "Xếp hạng": "🏆 Quán quân"},
        {"Nhóm": "Gradient Boosting", "Mô hình": "LightGBM (Refit 600k)", "ROC-AUC": 0.995368, "Avg Precision": 0.996012, "TPR @ FPR=0.1%": "86.02%", "TPR @ FPR=1.0%": "94.80%", "Accuracy": "97.26%", "F1-Score": 0.972551, "Xếp hạng": "🥈 Á quân 1"},
        {"Nhóm": "Gradient Boosting", "Mô hình": "XGBoost (Refit 600k)", "ROC-AUC": 0.995310, "Avg Precision": 0.995996, "TPR @ FPR=0.1%": "84.93%", "TPR @ FPR=1.0%": "95.29%", "Accuracy": "97.27%", "F1-Score": 0.972687, "Xếp hạng": "🥉 Á quân 2"},
        {"Nhóm": "Gradient Boosting", "Mô hình": "CatBoost", "ROC-AUC": 0.990427, "Avg Precision": 0.991573, "TPR @ FPR=0.1%": "66.19%", "TPR @ FPR=1.0%": "88.81%", "Accuracy": "95.47%", "F1-Score": 0.955112, "Xếp hạng": "Top 5"},
        {"Nhóm": "Bagging / Trees", "Mô hình": "Random Forest (Refit 600k)", "ROC-AUC": 0.990492, "Avg Precision": 0.991352, "TPR @ FPR=0.1%": "69.78%", "TPR @ FPR=1.0%": "86.09%", "Accuracy": "95.37%", "F1-Score": 0.953521, "Xếp hạng": "Top 6"},
        {"Nhóm": "Bagging / Trees", "Mô hình": "Extra Trees", "ROC-AUC": 0.991729, "Avg Precision": 0.992541, "TPR @ FPR=0.1%": "72.14%", "TPR @ FPR=1.0%": "89.39%", "Accuracy": "95.82%", "F1-Score": 0.957833, "Xếp hạng": "Top 4"},
        {"Nhóm": "Gradient Boosting", "Mô hình": "HistGradientBoosting", "ROC-AUC": 0.991221, "Avg Precision": 0.992447, "TPR @ FPR=0.1%": "74.75%", "TPR @ FPR=1.0%": "90.77%", "Accuracy": "95.61%", "F1-Score": 0.956318, "Xếp hạng": "Top 7"},
        {"Nhóm": "Tabular Deep Learning", "Mô hình": "RealMLP", "ROC-AUC": 0.987281, "Avg Precision": 0.982111, "TPR @ FPR=0.1%": "2.13%", "TPR @ FPR=1.0%": "94.50%", "Accuracy": "97.28%", "F1-Score": 0.972792, "Xếp hạng": "DL Top 1"},
        {"Nhóm": "Tabular Deep Learning", "Mô hình": "ResNet-Tabular", "ROC-AUC": 0.987327, "Avg Precision": 0.989475, "TPR @ FPR=0.1%": "64.98%", "TPR @ FPR=1.0%": "87.71%", "Accuracy": "95.04%", "F1-Score": 0.950485, "Xếp hạng": "DL Top 2"},
        {"Nhóm": "Tabular Deep Learning", "Mô hình": "MLP (Wide 1024-512-256)", "ROC-AUC": 0.987961, "Avg Precision": 0.988964, "TPR @ FPR=0.1%": "64.69%", "TPR @ FPR=1.0%": "85.38%", "Accuracy": "94.92%", "F1-Score": 0.949166, "Xếp hạng": "DL Top 3"},
        {"Nhóm": "Tabular Deep Learning", "Mô hình": "MLP Chuẩn (512-256)", "ROC-AUC": 0.984853, "Avg Precision": 0.987034, "TPR @ FPR=0.1%": "62.64%", "TPR @ FPR=1.0%": "87.39%", "Accuracy": "94.98%", "F1-Score": 0.949473, "Xếp hạng": "DL Baseline"},
        {"Nhóm": "Ensemble", "Mô hình": "Weighted Blending (Hill Climbing)", "ROC-AUC": 0.990071, "Avg Precision": 0.990986, "TPR @ FPR=0.1%": "63.10%", "TPR @ FPR=1.0%": "86.22%", "Accuracy": "95.08%", "F1-Score": 0.951833, "Xếp hạng": "Ensemble"},
        {"Nhóm": "Ensemble", "Mô hình": "Logistic Stacking", "ROC-AUC": 0.988089, "Avg Precision": 0.981927, "TPR @ FPR=0.1%": "0.58%", "TPR @ FPR=1.0%": "83.48%", "Accuracy": "95.11%", "F1-Score": 0.952238, "Xếp hạng": "Stacking"},
        {"Nhóm": "Mô hình Cổ điển", "Mô hình": "Logistic Regression", "ROC-AUC": 0.957000, "Avg Precision": 0.956215, "TPR @ FPR=0.1%": "5.46%", "TPR @ FPR=1.0%": "55.76%", "Accuracy": "88.07%", "F1-Score": 0.885971, "Xếp hạng": "Baseline Tuyến tính"},
        {"Nhóm": "Mô hình Cổ điển", "Mô hình": "Decision Tree (Max Depth=20)", "ROC-AUC": 0.947467, "Avg Precision": 0.924068, "TPR @ FPR=0.1%": "0.00%", "TPR @ FPR=1.0%": "0.00%", "Accuracy": "91.87%", "F1-Score": 0.919964, "Xếp hạng": "Cây đơn lẻ"}
    ]
    
    st.dataframe(pd.DataFrame(benchmark_data), use_container_width=True, hide_index=True)
    
    st.markdown("#### 📈 So sánh Trực quan Giữa các Nhóm Thuật toán")
    c_b1, c_b2 = st.columns(2)
    with c_b1:
        st.write("**Chỉ số ROC-AUC (Đo lường năng lực phân loại tổng thể):**")
        roc_chart_data = pd.DataFrame({
            "Mô hình": [b["Mô hình"] for b in benchmark_data[:8]],
            "ROC-AUC": [b["ROC-AUC"] for b in benchmark_data[:8]]
        })
        st.bar_chart(roc_chart_data, x="Mô hình", y="ROC-AUC", height=280)
        
    with c_b2:
        st.write("**Khả năng phát hiện mã độc ở mức báo động giả khắt khe (TPR @ FPR=0.1%):**")
        fpr_chart_data = pd.DataFrame({
            "Mô hình": [b["Mô hình"] for b in benchmark_data[:8]],
            "TPR (0.1% FPR)": [float(b["TPR @ FPR=0.1%"].replace("%","")) for b in benchmark_data[:8]]
        })
        st.bar_chart(fpr_chart_data, x="Mô hình", y="TPR (0.1% FPR)", height=280)

# ---------------------------------------------------------
# Tab 3: About & Architecture
# ---------------------------------------------------------
with tab_about:
    st.markdown("### 📖 Kiến trúc Hệ thống & Phương pháp Thực nghiệm Khóa luận")
    st.markdown("""
    #### 1. Đặt vấn đề & Mục tiêu
    * Các giải pháp Antivirus truyền thống dựa trên chữ ký (Signature-based) ngày càng gặp khó khăn trước các biến thể mã độc đa hình (*polymorphic*), biến hình (*metamorphic*) và các công cụ nén/làm rối (*packers/obfuscators*).
    * Phân tích động (Dynamic Analysis/Sandbox) đòi hỏi môi trường cách ly tốn kém tài nguyên và tiềm ẩn nguy cơ mã độc phát hiện môi trường ảo (*sandbox evasion*).
    * **Giải pháp của đồ án:** Áp dụng kỹ thuật trích xuất đặc trưng tĩnh học sâu kết hợp thuật toán Boosting và Ensemble trên tập dữ liệu quy mô lớn EMBER 2018 để phát hiện mã độc với tốc độ thời gian thực (< 10 ms/file) và độ chính xác vượt trội (> 97.3%).

    #### 2. Nguyên tắc Thiết kế & Chống Data Leakage
    1. **Bảo toàn tính thời gian (Temporal Split):** Dữ liệu được chia theo thời gian xuất hiện (`appeared`), 80% thời gian đầu làm train, 20% thời gian sau làm validation; kiểm tra final trên tập test độc lập.
    2. **Cô lập bộ tiền xử lý:** Bộ chọn lọc đặc trưng (`VarianceThreshold`, `SelectKBest`) chỉ được fit trên tập huấn luyện, không fit trên test.
    3. **Tối ưu ngưỡng trên Validation:** Ngưỡng quyết định $0.50$ và $0.914$ được tìm ra trên tập validation trước khi áp dụng vào final test.
    4. **Không trộn tập Unlabeled:** 300.000 mẫu unlabeled (`label = -1`) được tách biệt hoàn toàn, chỉ dùng trong thử nghiệm mở rộng Pseudo-Labeling.
    """)

# Footer
st.markdown("---")
st.caption("Khóa luận tốt nghiệp Cử nhân ngành An toàn Thông tin | Học máy & Phân tích tĩnh phát hiện mã độc Windows PE.")
