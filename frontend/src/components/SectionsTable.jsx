import React from 'react';
import { Layers, AlertCircle, CheckCircle } from 'lucide-react';

export default function SectionsTable({ sections }) {
  if (!sections || sections.length === 0) {
    return (
      <div className="bg-[#111827]/80 rounded-2xl p-5 border border-gray-800 text-sm text-gray-400">
        Không có dữ liệu phân vùng hoặc mẫu chạy từ đặc trưng nạp sẵn.
      </div>
    );
  }

  return (
    <div className="bg-[#111827]/80 rounded-2xl p-5 border border-gray-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-gray-200 text-base">
            Phân Tích Phân Vùng PE ({sections.length} Sections)
          </h3>
        </div>
        <span className="text-xs text-gray-400 font-mono">
          Threshold Entropy báo động: &gt; 7.00
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="py-2.5 px-3 font-semibold">Tên Section</th>
              <th className="py-2.5 px-3 font-semibold">Kích Thước Ảo (VSize)</th>
              <th className="py-2.5 px-3 font-semibold">Kích Thước Thô (Raw)</th>
              <th className="py-2.5 px-3 font-semibold">Entropy (0-8)</th>
              <th className="py-2.5 px-3 font-semibold">Quyền Hạn (Props)</th>
              <th className="py-2.5 px-3 font-semibold">Trạng Thái Chẩn Đoán</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-mono">
            {sections.map((sec, idx) => {
              const isAlert = sec.warning;
              const entropyHigh = sec.entropy > 7.0;

              return (
                <tr
                  key={idx}
                  className={`hover:bg-gray-800/30 transition-colors ${
                    isAlert ? 'bg-red-950/20' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-cyan-300">
                    {sec.name || '(unnamed)'}
                  </td>
                  <td className="py-2.5 px-3 text-gray-300">
                    {sec.virtual_size.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-gray-300">
                    {sec.raw_size.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded font-semibold ${
                        entropyHigh
                          ? 'bg-red-900/60 text-red-300 border border-red-500/40'
                          : 'bg-gray-800 text-gray-200'
                      }`}
                    >
                      {sec.entropy.toFixed(3)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-400 text-[11px]">
                    {sec.props && sec.props.length > 0
                      ? sec.props.join(', ')
                      : 'N/A'}
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    {isAlert ? (
                      <span className="flex items-center gap-1.5 text-red-400 text-xs font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {sec.status}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        Bình thường
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
