import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Clock, Cpu, Sliders, Layers } from 'lucide-react';

export default function VerdictCard({ result }) {
  if (!result) return null;

  const isMalware = result.is_malware;
  const scorePercent = result.malware_percent;
  const thresholdPercent = (result.threshold * 100).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Big Verdict Banner */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 border transition-all ${
          isMalware
            ? 'bg-gradient-to-r from-red-950/80 via-red-900/40 to-slate-900/90 border-red-500/50 shadow-2xl shadow-red-500/20'
            : 'bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-slate-900/90 border-emerald-500/50 shadow-2xl shadow-emerald-500/20'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border ${
                isMalware
                  ? 'bg-red-500/20 border-red-400/40 text-red-400'
                  : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400'
              }`}
            >
              {isMalware ? (
                <ShieldAlert className="w-9 h-9 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-9 h-9" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-mono text-gray-400">
                  Phán đoán hệ thống
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    isMalware
                      ? 'bg-red-900/60 text-red-300 border-red-600/40'
                      : 'bg-emerald-900/60 text-emerald-300 border-emerald-600/40'
                  }`}
                >
                  {result.risk_label}
                </span>
              </div>
              <h2
                className={`text-2xl sm:text-3xl font-extrabold tracking-wide mt-1 ${
                  isMalware ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {isMalware ? 'PHÁT HIỆN MÃ ĐỘC (MALICIOUS)' : 'TỆP AN TOÀN (BENIGN)'}
              </h2>
              <p className="text-sm text-gray-300 mt-1">
                {isMalware
                  ? `Mẫu có hành vi tĩnh trùng khớp cấu trúc mã độc với xác suất ${scorePercent}% (vượt ngưỡng kích hoạt ${thresholdPercent}%).`
                  : `Mẫu có đặc trưng tương đồng phần mềm hợp lệ với xác suất độc hại chỉ ${scorePercent}% (thấp hơn ngưỡng ${thresholdPercent}%).`}
              </p>
            </div>
          </div>

          {/* Probability score large badge */}
          <div className="text-right sm:border-l sm:border-gray-800 sm:pl-6 shrink-0">
            <span className="text-xs text-gray-400 uppercase font-mono">Malware Score</span>
            <div
              className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                isMalware ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {scorePercent}%
            </div>
            <span className="text-xs text-gray-500 font-mono">
              Threshold: {thresholdPercent}%
            </span>
          </div>
        </div>

        {/* Risk meter progress bar with threshold indicator */}
        <div className="mt-6 pt-4 border-t border-gray-800/80">
          <div className="flex justify-between text-xs font-mono text-gray-400 mb-1.5">
            <span>0% (Clean)</span>
            <span className="text-cyan-400 font-semibold">
              Ngưỡng quyết định: {thresholdPercent}%
            </span>
            <span>100% (Critical)</span>
          </div>
          <div className="relative w-full h-3 bg-gray-950 rounded-full overflow-hidden border border-gray-800">
            {/* The progress fill */}
            <div
              className={`h-full transition-all duration-700 rounded-full ${
                isMalware
                  ? 'bg-gradient-to-r from-amber-500 to-red-500 shadow-lg shadow-red-500/50'
                  : 'bg-gradient-to-r from-blue-500 to-emerald-500 shadow-lg shadow-emerald-500/50'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, scorePercent))}%` }}
            />
          </div>
          {/* Threshold indicator tick */}
          <div className="relative w-full h-0">
            <div
              className="absolute -top-3 w-1 h-3 bg-white shadow-sm ring-1 ring-cyan-400"
              style={{ left: `${thresholdPercent}%` }}
              title={`Ngưỡng: ${thresholdPercent}%`}
            />
          </div>
        </div>
      </div>

      {/* Latency & Model Performance Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800/80">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Mô Hình AI</span>
          </div>
          <div className="font-semibold text-sm text-gray-200 truncate" title={result.model_used}>
            {result.model_used}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800/80">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ngưỡng Áp Dụng</span>
          </div>
          <div className="font-semibold text-sm text-cyan-300 font-mono">
            {result.threshold.toFixed(4)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800/80">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Độ Trễ Suy Luận</span>
          </div>
          <div className="font-semibold text-sm text-amber-300 font-mono">
            {result.latency_inference_ms} ms
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800/80">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Tổng Thời Gian</span>
          </div>
          <div className="font-semibold text-sm text-purple-300 font-mono">
            {result.latency_total_ms} ms
          </div>
        </div>
      </div>
    </div>
  );
}
