import React, { useState } from 'react';
import { FileCode, Hash, HardDrive, Copy, Check, FileCheck } from 'lucide-react';

export default function FileDetails({ result }) {
  if (!result) return null;

  const [copied, setCopied] = useState(false);

  const copyHash = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-[#111827]/80 rounded-2xl p-5 border border-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <FileCode className="w-5 h-5 text-cyan-400" />
        <h3 className="font-bold text-gray-200 text-base">Thông Tin Tệp & Thuộc Tính Tĩnh</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-400">Tên Tệp Đang Phân Tích</div>
            <div className="font-semibold text-gray-100 flex items-center gap-1.5 mt-0.5">
              <FileCheck className="w-4 h-4 text-blue-400" />
              <span className="truncate">{result.file_name}</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-400">Dung Lượng File</div>
            <div className="font-semibold text-gray-200 flex items-center gap-1.5 mt-0.5">
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span>
                {formatBytes(result.size_bytes)} ({result.size_bytes.toLocaleString()} bytes)
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-400">Mã Băm SHA-256</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs text-cyan-300 bg-gray-900/90 border border-gray-800 px-2 py-1 rounded truncate">
                {result.sha256}
              </span>
              <button
                onClick={() => copyHash(result.sha256)}
                className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
                title="Copy SHA-256"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-400">Mã Băm MD5</div>
            <div className="font-mono text-xs text-gray-300 bg-gray-900/90 border border-gray-800 px-2 py-1 rounded truncate mt-0.5">
              {result.md5}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
