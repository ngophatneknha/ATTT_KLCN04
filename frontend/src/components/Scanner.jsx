import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileCheck2,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Cpu,
  Shield,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

import VerdictCard from './VerdictCard';
import FileDetails from './FileDetails';
import SectionsTable from './SectionsTable';
import ImportsTable from './ImportsTable';
import ByteHistogramChart from './ByteHistogramChart';
import XaiGroupChart from './XaiGroupChart';

export default function Scanner() {
  const [model, setModel] = useState('LightGBM');
  const [thresholdMode, setThresholdMode] = useState('balanced');
  const [thresholdValue, setThresholdValue] = useState(0.50);
  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState('');

  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [result, setResult] = useState(null);

  // Fetch samples and system info on mount
  useEffect(() => {
    fetch('/api/samples')
      .then((res) => res.json())
      .then((data) => {
        if (data.samples) setSamples(data.samples);
      })
      .catch((err) => console.error('Error fetching samples:', err));
  }, []);

  // Update threshold based on policy
  const handleThresholdModeChange = (mode) => {
    setThresholdMode(mode);
    if (mode === 'balanced') {
      setThresholdValue(0.5000);
    } else if (mode === 'strict') {
      setThresholdValue(0.9141);
    }
  };

  // Run scan for local upload
  const handleScanFile = async () => {
    if (!uploadedFile) return;
    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', uploadedFile);
    formData.append('model', model);
    formData.append('threshold', thresholdValue);

    try {
      const res = await fetch('/api/scan/file', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Không thể phân tích tệp.');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run scan for selected demo sample
  const handleScanSample = async (sampleId) => {
    if (!sampleId) return;
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setUploadedFile(null);

    try {
      const res = await fetch('/api/scan/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sample_id: sampleId,
          model: model,
          threshold: thresholdValue,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Không thể phân tích mẫu thử nghiệm.');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setUploadedFile(file);
      setSelectedSample('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
      setSelectedSample('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Config Card */}
      <div className="bg-[#111827]/90 rounded-2xl p-5 border border-gray-800 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Thuật Toán Học Máy (Inference Engine)</span>
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700/80 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="LightGBM">LightGBM (Refit 600k — Nhanh & Tối ưu)</option>
              <option value="XGBoost">XGBoost (Refit 600k — Chuẩn xác)</option>
              <option value="Ensemble">Ensemble Blending (SoftVoting LGBM + XGB)</option>
            </select>
            <p className="text-[11px] text-gray-400">
              * Huấn luyện trên 600.000 mẫu EMBER 2018, AUC &gt; 0.995.
            </p>
          </div>

          {/* Threshold Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <span>Chính Sách Ngưỡng Quyết Định</span>
              </span>
              <span className="font-mono text-cyan-400 font-bold">
                {thresholdValue.toFixed(4)}
              </span>
            </label>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleThresholdModeChange('balanced')}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  thresholdMode === 'balanced'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Cân Bằng F1 (0.50)
              </button>
              <button
                type="button"
                onClick={() => handleThresholdModeChange('strict')}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  thresholdMode === 'strict'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                title="Khắt khe chống báo động sai (FPR <= 0.1%, Precision 99.95%)"
              >
                Low-FPR (0.914)
              </button>
              <button
                type="button"
                onClick={() => setThresholdMode('custom')}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  thresholdMode === 'custom'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Tùy Chỉnh
              </button>
            </div>

            {thresholdMode === 'custom' && (
              <input
                type="range"
                min="0.01"
                max="0.99"
                step="0.01"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-2"
              />
            )}
          </div>

          {/* Quick Demo Preloaded Sample Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>Nạp Mẫu Sẵn Để Trình Diễn Nhanh</span>
            </label>
            <select
              value={selectedSample}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedSample(val);
                if (val) handleScanSample(val);
              }}
              className="w-full bg-gray-900 border border-gray-700/80 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">-- Chọn mẫu thử nghiệm có sẵn --</option>
              <optgroup label="Hệ thống Windows sạch (Benign Clean)">
                {samples
                  .filter((s) => s.id.startsWith('local:'))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Tập kiểm thử EMBER 2018 (Malware / Benign)">
                {samples
                  .filter((s) => s.id.startsWith('ember:'))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.category}] {s.name}
                    </option>
                  ))}
              </optgroup>
            </select>
            <p className="text-[11px] text-gray-400">
              * Thử nghiệm ngay không cần upload tệp thủ công.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-gray-800 bg-[#111827]/40 hover:border-gray-700 hover:bg-[#111827]/60'
        }`}
      >
        <input
          type="file"
          id="fileUpload"
          onChange={handleFileChange}
          accept=".exe,.dll,.sys,.ocx,.scr"
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-950/60 border border-blue-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <label
              htmlFor="fileUpload"
              className="cursor-pointer text-base font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
            >
              Chọn tệp PE từ máy tính
            </label>
            <span className="text-gray-400 text-sm"> hoặc kéo thả file vào đây</span>
          </div>

          <p className="text-xs text-gray-500">
            Hỗ trợ các định dạng PE Windows: <span className="font-mono text-gray-400">.exe, .dll, .sys, .ocx, .scr</span> (Phân tích tĩnh an toàn, không thực thi binary)
          </p>

          {uploadedFile && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-gray-800/80">
              <FileCheck2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-semibold text-gray-200">
                {uploadedFile.name}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                ({(uploadedFile.size / 1024).toFixed(1)} KB)
              </span>

              <button
                type="button"
                onClick={handleScanFile}
                disabled={loading}
                className="ml-3 flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold shadow-lg shadow-blue-500/30 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Quét Ngay</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="p-12 text-center space-y-3 bg-[#111827]/40 rounded-2xl border border-gray-800">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto"></div>
          <div className="text-sm font-semibold text-gray-300">
            Đang trích xuất 2.381 chiều đặc trưng & chạy mô hình suy luận...
          </div>
          <div className="text-xs text-gray-500 font-mono">
            PE Header • Section Entropies • Imports Hashing • Byte Histogram
          </div>
        </div>
      )}

      {/* Diagnosis Results */}
      {result && (
        <div className="space-y-6 pt-2">
          {/* Main Verdict & Metrics */}
          <VerdictCard result={result} />

          {/* File Identifiers */}
          <FileDetails result={result} />

          {/* Two-Column Forensics View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionsTable sections={result.sections} />
            <ImportsTable imports={result.imports} />
          </div>

          {/* Charts View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ByteHistogramChart histogram={result.byte_histogram} />
            <XaiGroupChart groups={result.xai_groups} />
          </div>
        </div>
      )}
    </div>
  );
}
