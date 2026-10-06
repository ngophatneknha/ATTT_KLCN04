import React from 'react';
import { Brain, Zap } from 'lucide-react';

export default function XaiGroupChart({ groups }) {
  if (!groups || groups.length === 0) return null;

  const maxEnergy = Math.max(...groups.map((g) => g.energy), 0.001);

  return (
    <div className="bg-[#111827]/80 rounded-2xl p-5 border border-gray-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-gray-200 text-base">
            Giải Thích AI: Đóng Góp 9 Nhóm Đặc Trưng EMBER (XAI Overview)
          </h3>
        </div>
        <span className="text-xs text-gray-400 font-mono">
          Tổng số: 2.381 chiều đặc trưng
        </span>
      </div>

      <div className="space-y-2.5">
        {groups.map((g, idx) => {
          const ratio = Math.min(100, (g.energy / maxEnergy) * 100);

          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                  <span className="text-gray-500 font-mono">#{idx + 1}</span>
                  <span>{g.name}</span>
                  <span className="text-[11px] text-gray-500 font-mono">
                    ({g.dim} features)
                  </span>
                </span>
                <span className="font-mono text-cyan-400 font-semibold">
                  {g.energy.toFixed(3)}
                </span>
              </div>

              <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden border border-gray-900">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${ratio}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-400 pt-1">
        * Đo lường độ biến thiên năng lượng chuẩn L2 Norm trên từng phân đoạn vector 2.381 chiều, cho biết mô hình khai thác trọng số từ nhóm đặc trưng nào nhiều nhất đối với tệp này.
      </p>
    </div>
  );
}
