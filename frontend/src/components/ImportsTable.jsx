import React, { useState } from 'react';
import { Database, Search } from 'lucide-react';

export default function ImportsTable({ imports }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!imports || imports.length === 0) {
    return (
      <div className="bg-[#111827]/80 rounded-2xl p-5 border border-gray-800 text-sm text-gray-400">
        Không có bảng thư viện liên kết (Imports Table) hoặc tệp đã bị packed/stripped.
      </div>
    );
  }

  const filtered = imports.filter(
    (item) =>
      item.dll.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sample_apis.some((api) => api.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalApis = imports.reduce((acc, curr) => acc + curr.api_count, 0);

  return (
    <div className="bg-[#111827]/80 rounded-2xl p-5 border border-gray-800 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-gray-200 text-base">
            Thư Viện Liên Kết & Windows API ({imports.length} DLLs, {totalApis} APIs)
          </h3>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Tìm DLL hoặc hàm API..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 w-full sm:w-56"
          />
        </div>
      </div>

      <div className="overflow-x-auto max-h-72 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-[#111827] border-b border-gray-800 text-gray-400">
            <tr>
              <th className="py-2.5 px-3 font-semibold">Tên DLL</th>
              <th className="py-2.5 px-3 font-semibold">Số Lượng API</th>
              <th className="py-2.5 px-3 font-semibold">Các Hàm Tiêu Biểu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-mono">
            {filtered.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-cyan-300">
                  {item.dll}
                </td>
                <td className="py-2.5 px-3 text-amber-300 font-bold">
                  {item.api_count}
                </td>
                <td className="py-2.5 px-3 text-gray-400 text-[11px] truncate max-w-md">
                  {item.sample_apis && item.sample_apis.length > 0 ? (
                    <span className="flex flex-wrap gap-1">
                      {item.sample_apis.map((api, i) => (
                        <span
                          key={i}
                          className="bg-gray-900/90 text-gray-300 border border-gray-800 px-1.5 py-0.5 rounded text-[10px]"
                        >
                          {api}
                        </span>
                      ))}
                      {item.api_count > item.sample_apis.length && (
                        <span className="text-gray-500 text-[10px] self-center">
                          +{item.api_count - item.sample_apis.length} hàm khác
                        </span>
                      )}
                    </span>
                  ) : (
                    'Không liệt kê tên'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
