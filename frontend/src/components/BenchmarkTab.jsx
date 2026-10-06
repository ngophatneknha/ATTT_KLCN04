import React, { useState, useEffect } from 'react';
import { BarChart3, Trophy, Filter, ArrowUpDown } from 'lucide-react';

export default function BenchmarkTab() {
  const [benchmarkData, setBenchmarkData] = useState([]);
  const [filterGroup, setFilterGroup] = useState('ALL');
  const [sortField, setSortField] = useState('roc_auc');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetch('/api/benchmark')
      .then((res) => res.json())
      .then((data) => {
        if (data.models) setBenchmarkData(data.models);
      })
      .catch((err) => console.error('Error fetching benchmark:', err));
  }, []);

  const groups = ['ALL', 'Ensemble', 'Gradient Boosting', 'Bagging / Trees', 'Tabular Deep Learning', 'Mô hình Cổ điển'];

  const filtered = benchmarkData
    .filter((m) => filterGroup === 'ALL' || m.group === filterGroup)
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortAsc ? valA - valB : valB - valA;
    });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-[#111827]/90 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-bold text-gray-100">
            Bảng Đối Sánh Hiệu Năng Thực Nghiệm 19 Mô Hình (Chương 3 Khóa Luận)
          </h2>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          Số liệu đối sánh toàn diện giữa các trường phái học máy trên tập kiểm thử chuẩn gồm{' '}
          <span className="text-cyan-300 font-semibold font-mono">200.000 mẫu độc lập</span> của cơ sở dữ liệu EMBER 2018 (sau khi huấn luyện trên 600.000 mẫu có nhãn). Đánh giá đồng thời ROC-AUC, F1-Score, và năng lực phát hiện mã độc ở mức báo động sai khắt khe (<span className="text-amber-300 font-mono">TPR @ FPR = 0.1%</span>).
        </p>

        {/* Group Filter Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-800">
          <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Lọc nhóm:
          </span>
          {groups.map((grp) => (
            <button
              key={grp}
              onClick={() => setFilterGroup(grp)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterGroup === grp
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-800/80 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }`}
            >
              {grp}
            </button>
          ))}
        </div>
      </div>

      {/* Main Comparison Table */}
      <div className="bg-[#111827]/90 rounded-2xl p-5 border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 font-semibold">
                <th className="py-3 px-3">Xếp Hạng</th>
                <th className="py-3 px-3">Mô Hình / Thuật Toán</th>
                <th className="py-3 px-3">Nhóm Kiến Trúc</th>
                <th
                  onClick={() => handleSort('roc_auc')}
                  className="py-3 px-3 cursor-pointer hover:text-cyan-300"
                >
                  <div className="flex items-center gap-1">
                    <span>ROC-AUC</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('avg_prec')}
                  className="py-3 px-3 cursor-pointer hover:text-cyan-300"
                >
                  <div className="flex items-center gap-1">
                    <span>Avg Prec</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('tpr_fpr_001')}
                  className="py-3 px-3 cursor-pointer hover:text-cyan-300"
                >
                  <div className="flex items-center gap-1">
                    <span>TPR @ FPR=0.1%</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('tpr_fpr_01')}
                  className="py-3 px-3 cursor-pointer hover:text-cyan-300"
                >
                  <div className="flex items-center gap-1">
                    <span>TPR @ FPR=1.0%</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('accuracy')}
                  className="py-3 px-3 cursor-pointer hover:text-cyan-300"
                >
                  <div className="flex items-center gap-1">
                    <span>Độ Chính Xác</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('f1')}
                  className="py-3 px-3 cursor-pointer hover:text-cyan-300"
                >
                  <div className="flex items-center gap-1">
                    <span>F1-Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono">
              {filtered.map((item, idx) => {
                const isChampion = item.rank && item.rank.includes('Quán quân');
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-gray-800/40 transition-colors ${
                      isChampion ? 'bg-amber-950/20 font-bold' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-sans text-xs">
                      <span
                        className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                          isChampion
                            ? 'bg-amber-900/60 text-amber-300 border border-amber-500/40'
                            : 'text-gray-400'
                        }`}
                      >
                        {item.rank}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-cyan-200 font-bold font-sans">
                      {item.name}
                    </td>
                    <td className="py-3 px-3 text-gray-400 font-sans text-[11px]">
                      {item.group}
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      {item.roc_auc.toFixed(6)}
                    </td>
                    <td className="py-3 px-3 text-gray-300">
                      {item.avg_prec.toFixed(6)}
                    </td>
                    <td className="py-3 px-3 text-amber-400 font-bold">
                      {item.tpr_fpr_001.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-blue-300">
                      {item.tpr_fpr_01.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-gray-200 font-sans">
                      {item.accuracy.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-cyan-300 font-bold">
                      {item.f1.toFixed(6)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Bar Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111827]/90 rounded-2xl p-5 border border-gray-800 space-y-3">
          <h3 className="font-bold text-gray-200 text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Xếp Hạng ROC-AUC (Top Mô Hình)</span>
          </h3>
          <div className="space-y-2">
            {benchmarkData.slice(0, 7).map((m, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">{m.name}</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {m.roc_auc.toFixed(6)}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden border border-gray-900">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${((m.roc_auc - 0.94) / 0.06) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111827]/90 rounded-2xl p-5 border border-gray-800 space-y-3">
          <h3 className="font-bold text-gray-200 text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Tỷ Lệ Bắt Mã Độc Tại FPR Cực Thấp (TPR @ 0.1% FPR)</span>
          </h3>
          <div className="space-y-2">
            {benchmarkData.slice(0, 7).map((m, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">{m.name}</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {m.tpr_fpr_001.toFixed(2)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden border border-gray-900">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(m.tpr_fpr_001 / 100) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
