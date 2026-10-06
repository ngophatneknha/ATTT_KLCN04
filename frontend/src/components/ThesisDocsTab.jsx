import React from 'react';
import { BookOpen, ShieldCheck, Database, Layers, CheckCircle2 } from 'lucide-react';

export default function ThesisDocsTab() {
  const featureGroups = [
    { name: 'Byte Histogram', dim: 256, desc: 'Phân bố tần suất xuất hiện của các byte (0-255) trong tệp PE.' },
    { name: 'Byte-Entropy Histogram', dim: 256, desc: 'Đo lường độ hỗn loạn thông tin kết hợp giá trị byte (phát hiện nén/mã hóa).' },
    { name: 'Section Information', dim: 255, desc: 'Kích thước, entropy, thuộc tính đọc/ghi/thực thi của các phân vùng PE.' },
    { name: 'Imports (DLLs & APIs)', dim: 1280, desc: 'Hashed feature vector của các thư viện liên kết động và Windows API.' },
    { name: 'Exports', dim: 128, desc: 'Danh sách các hàm được xuất khẩu (thường gặp ở tệp DLL).' },
    { name: 'General File Info', dim: 10, desc: 'Dung lượng file, số section, số symbol, compile timestamp...' },
    { name: 'PE Header', dim: 62, desc: 'Thông tin COFF header, Optional header, Subsystem, DLL characteristics.' },
    { name: 'Strings Statistics', dim: 104, desc: 'Thống kê số chuỗi ký tự, độ dài chuỗi, URL, IP, registry key regex.' },
    { name: 'Data Directories', dim: 30, desc: 'Kích thước và địa chỉ ảo của các thư mục dữ liệu Data Directory.' },
  ];

  const experiments = [
    { code: 'E0', title: 'Cấu hình & Môi trường', desc: 'Thiết lập phần cứng TPU/GPU, seed cố định, chống ngẫu nhiên.' },
    { code: 'E1', title: 'Dataset & Kiểm tra chất lượng', desc: 'Kiểm tra Checksum SHA-256 dữ liệu EMBER 2018, missing/inf, phân bố nhãn.' },
    { code: 'E2', title: 'Thiết kế phân chia thời gian', desc: 'Temporal Train/Val/Test bảo toàn thứ tự appeared date, chống rò rỉ dữ liệu.' },
    { code: 'E3', title: 'Tiền xử lý & Benchmark', desc: 'VarianceThreshold + SelectKBest K=256; benchmark 5 thuật toán cơ sở.' },
    { code: 'E3b', title: 'Mở rộng 19 mô hình', desc: 'Bổ sung Tabular DL (ResNet, RealMLP, TabM), CatBoost, Stacking, Ensembles.' },
    { code: 'E4', title: 'Ablation & Tối ưu Ngưỡng', desc: 'Thử nghiệm giảm chiều đặc trưng (256, 512, 1024, 2381) & Threshold tuning.' },
    { code: 'E5', title: 'Explainable AI (XAI)', desc: 'SHAP TreeExplainer & Permutation Importance, gom nhóm theo 9 nhóm đặc trưng.' },
    { code: 'E6', title: 'Temporal Test & Final Test', desc: 'Đánh giá độ suy giảm theo thời gian và kiểm thử độc lập trên 200.000 mẫu test.' },
    { code: 'E7', title: 'External Validation Hook', desc: 'Móc nối kiểm thử trên tập dữ liệu ngoài độc lập.' },
    { code: 'E8', title: 'Phân tích tĩnh PE mới', desc: 'Đọc byte tĩnh tệp thực thi PE -> LIEF extractor -> 2.381 chiều -> dự đoán an toàn.' },
    { code: 'E9', title: 'Đóng gói Model Artifact', desc: 'Lưu trữ model + threshold + feature schema + metadata cho Chương 3.' },
    { code: 'E10', title: 'Ứng dụng Web Dashboard', desc: 'Xây dựng giao diện Web cho phép người dùng upload tệp PE để chẩn đoán.' },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-[#111827]/90 rounded-2xl p-6 border border-gray-800 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-gray-100">
            Tổng Quan Đề Tài & Kiến Trúc Thực Nghiệm Khóa Luận
          </h2>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          <strong>Đề tài:</strong> Nghiên cứu các kỹ thuật phân tích tĩnh và ứng dụng thuật toán học máy trong phát hiện mã độc Windows (Mã hiệu: <code className="text-cyan-300 bg-gray-900 px-1.5 py-0.5 rounded">ATTT_KLCN04</code>).
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          Nghiên cứu giải quyết bài toán phát hiện mã độc Windows ở tốc độ thời gian thực mà không cần thực thi file trong môi trường ảo sandbox, dựa trên không gian đặc trưng tĩnh chuẩn hóa của tập dữ liệu công nghiệp <strong className="text-gray-200">EMBER 2018 v2 (1.100.000 mẫu PE)</strong>.
        </p>
      </div>

      {/* Anti-Leakage Principles */}
      <div className="bg-[#111827]/90 rounded-2xl p-6 border border-gray-800 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-gray-100">
            Nguyên Tắc Thiết Kế Thực Nghiệm & Chống Rò Rỉ Dữ Liệu (Anti-Leakage)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-200">Bảo toàn dòng thời gian (Temporal Split):</span>
              <p className="text-gray-400 mt-0.5">80% mẫu labeled đầu làm train, 20% mẫu sau làm validation theo ngày xuất hiện (appeared date).</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-200">Cô lập hoàn toàn Preprocessing:</span>
              <p className="text-gray-400 mt-0.5">Bộ chọn đặc trưng và Scaler chỉ fit trên tập huấn luyện, tuyệt đối không fit trên tập test.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-200">Tối ưu ngưỡng trên Validation:</span>
              <p className="text-gray-400 mt-0.5">Ngưỡng quyết định (0.500 và 0.914) được khóa trên tập validation trước khi chạy final test.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-200">Tách biệt tập Unlabeled:</span>
              <p className="text-gray-400 mt-0.5">300.000 mẫu unlabeled (nhãn -1) được cô lập, chỉ dùng trong thí nghiệm bán giám sát mở rộng.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 9 Feature Groups Table */}
      <div className="bg-[#111827]/90 rounded-2xl p-6 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-gray-100">
              Không Gian Đặc Trưng Tĩnh EMBER 2018 (2.381 Chiều)
            </h3>
          </div>
          <span className="text-xs text-cyan-400 font-mono font-bold">
            Tổng cộng: 2.381 features
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="py-2.5 px-3 font-semibold">Nhóm Đặc Trưng</th>
                <th className="py-2.5 px-3 font-semibold">Số Chiều</th>
                <th className="py-2.5 px-3 font-semibold">Mô Tả Ý Nghĩa Kỹ Thuật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {featureGroups.map((g, i) => (
                <tr key={i} className="hover:bg-gray-800/30">
                  <td className="py-2.5 px-3 font-bold text-cyan-300 font-mono">
                    {g.name}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-amber-300 font-bold">
                    {g.dim}
                  </td>
                  <td className="py-2.5 px-3 text-gray-300">
                    {g.desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 11 Experimental Stages */}
      <div className="bg-[#111827]/90 rounded-2xl p-6 border border-gray-800 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-gray-100">
            Quy Trình 11 Mô-đun Thực Nghiệm (E0 — E10)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {experiments.map((e, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-500/30 text-blue-300 font-mono text-xs font-bold">
                  {e.code}
                </span>
                <span className="text-xs text-gray-500 font-mono">Stage #{idx + 1}</span>
              </div>
              <h4 className="font-bold text-gray-200 text-xs pt-1">{e.title}</h4>
              <p className="text-[11px] text-gray-400 leading-normal">{e.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
