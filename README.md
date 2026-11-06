# ATTT_KLCN04 — Nghiên Cứu Các Kỹ Thuật Phân Tích Tĩnh Và Ứng Dụng Thuật Toán Học Máy Trong Phát Hiện Mã Độc Windows

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF.svg)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![Dataset](https://img.shields.io/badge/Dataset-EMBER%202018%20v2-orange.svg)](https://github.com/elastic/ember)

Khóa luận Cử nhân ngành **An toàn Thông tin** (Mã hiệu: `ATTT_KLCN04`).
Tác giả: Lê Thị Huyền Nhung & Trương Ngô Phát

---

## 📌 1. Giới Thiệu Đề Tài
Phát hiện mã độc dựa trên chữ ký truyền thống ngày càng bộc lộ nhiều hạn chế trước các kỹ thuật đa hình (*polymorphism*), biến hình (*metamorphism*) và các công cụ đóng gói/làm rối (*packers/obfuscators*). Trong khi đó, phân tích động (Sandbox) tiêu tốn nhiều tài nguyên và dễ bị mã độc né tránh (*sandbox evasion*).

Đồ án này nghiên cứu giải pháp **phân tích tĩnh (Static Analysis) thuần túy kết hợp học máy và học sâu dạng bảng (Tabular Deep Learning)** trên tập dữ liệu công nghiệp chuẩn hóa **EMBER 2018 v2** (1.100.000 mẫu PE Windows).

### Nguyên tắc thiết kế:
* 🛡️ **An toàn tuyệt đối:** Chỉ đọc mảng byte tĩnh và trích xuất cấu trúc PE Header, Phân vùng (Sections), Thư viện (Imports) và Byte Entropy. Tuyệt đối không tạo tiến trình và không thực thi binary.
* ⏳ **Chống rò rỉ dữ liệu (Anti-Leakage):** Phân chia tập dữ liệu nghiêm ngặt theo dòng thời gian (`appeared date`), bộ tiền xử lý và chọn lọc đặc trưng chỉ fit trên tập huấn luyện, ngưỡng phân loại chỉ tối ưu trên validation.
* ⚡ **Độ trễ thời gian thực:** Thời gian trích xuất và suy luận AI dưới **10 mili-giây/tệp**.

---

## 📊 2. Kết Quả Thực Nghiệm Nổi Bật (Chương 3)

Đánh giá độc lập trên **200.000 mẫu test** (sau khi huấn luyện trên 600.000 mẫu train có nhãn):

| Thuật Toán / Mô Hình | Nhóm Kiến Trúc | ROC-AUC | Avg Precision | TPR @ FPR=0.1% | TPR @ FPR=1.0% | Accuracy | F1-Score | Xếp Hạng |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **SoftVoting (LGBM+XGB+RF)** | Ensemble | **0.995408** | **0.996071** | 84.36% | **95.32%** | **97.39%** | **0.973865** | 🏆 **Quán quân** |
| **LightGBM (Refit 600k)** | Gradient Boosting | 0.995368 | 0.996012 | **86.02%** | 94.80% | 97.26% | 0.972551 | 🥈 **Á quân 1** |
| **XGBoost (Refit 600k)** | Gradient Boosting | 0.995310 | 0.995996 | 84.93% | 95.29% | 97.27% | 0.972687 | 🥉 **Á quân 2** |
| **Extra Trees** | Bagging | 0.991729 | 0.992541 | 72.14% | 89.39% | 95.82% | 0.957833 | Top 4 |
| **CatBoost** | Gradient Boosting | 0.990427 | 0.991573 | 66.19% | 88.81% | 95.47% | 0.955112 | Top 5 |
| **Random Forest** | Bagging | 0.990492 | 0.991352 | 69.78% | 86.09% | 95.37% | 0.953521 | Top 6 |
| **RealMLP** | Tabular Deep Learning | 0.987281 | 0.982111 | 2.13% | 94.50% | 97.28% | 0.972792 | DL Top 1 |
| **ResNet-Tabular** | Tabular Deep Learning | 0.987327 | 0.989475 | 64.98% | 87.71% | 95.04% | 0.950485 | DL Top 2 |

> **Điểm sáng học thuật:** Kết quả của mô hình **SoftVoting** và **LightGBM** vượt mốc baseline $92.9\%$ được công bố trong bài báo gốc của tập dữ liệu EMBER 2018 (*Anderson & Roth, arXiv:1804.04637*).

---

## 🏗️ 3. Không Gian Đặc Trưng Tĩnh (2.381 Chiều)
Trích xuất bằng thư viện LIEF và bộ `PEFeatureExtractor` của EMBER gồm 9 nhóm:
1. **Byte Histogram (256):** Tần suất phân bố byte giá trị 0–255.
2. **Byte-Entropy Histogram (256):** Ma trận đo lường độ hỗn loạn thông tin kết hợp giá trị byte.
3. **Section Information (255):** Kích thước ảo/thô, entropy phân vùng, thuộc tính Read/Write/Execute.
4. **Imports (1.280):** Hashed feature vector của các thư viện DLL và hàm Windows API.
5. **Exports (128):** Danh sách các hàm export (đối với DLL).
6. **General File Info (10):** Kích thước file, số section, số symbol, compile timestamp...
7. **PE Header (62):** COFF header, Optional header, Subsystem, DLL characteristics.
8. **Strings Statistics (104):** Thống kê số lượng chuỗi ký tự, độ dài chuỗi, URL, IP, registry key.
9. **Data Directories (30):** Kích thước và địa chỉ ảo của các thư mục dữ liệu Data Directory.

---

## 💻 4. Cấu Trúc Mã Nguồn

```
├── backend/
│   └── server.py                   # FastAPI REST API Backend
├── frontend/                       # React 18 + Vite + TailwindCSS Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Thanh điều hướng Cyber Threat Intel
│   │   │   ├── Scanner.jsx         # Khu vực kéo-thả upload & chẩn đoán
│   │   │   ├── VerdictCard.jsx     # Thẻ kết luận chẩn đoán lớn, Risk Gauge
│   │   │   ├── FileDetails.jsx     # Thuộc tính tệp, mã băm SHA-256 / MD5
│   │   │   ├── SectionsTable.jsx   # Bảng phân tích phân vùng PE & Entropy cảnh báo
│   │   │   ├── ImportsTable.jsx    # Bảng DLL & Windows APIs (tìm kiếm tức thì)
│   │   │   ├── ByteHistogramChart.jsx # Biểu đồ Canvas 256 giá trị byte
│   │   │   ├── XaiGroupChart.jsx   # Biểu đồ XAI đóng góp 9 nhóm đặc trưng
│   │   │   ├── BenchmarkTab.jsx    # Bảng đối sánh 19 mô hình (lọc & sắp xếp)
│   │   │   └── ThesisDocsTab.jsx   # Tài liệu kiến trúc & quy trình thực nghiệm
│   │   └── App.jsx
│   └── vite.config.js              # Cấu hình proxy tự động /api -> port 8000
├── demo_samples/                   # Mẫu PE an toàn để kiểm thử nhanh
├── ATTT_KLCN04_Chuong2_Colab_Full_Pipeline_NEK.ipynb # Notebook thực nghiệm E0-E10
├── start_app.bat                   # Kịch bản 1-click khởi động toàn bộ hệ thống
└── README.md
```

---

## 🚀 5. Hướng Dẫn Cài Đặt & Khởi Chạy

### Cách 1: Khởi động 1-Click (Khuyên dùng trên Windows)
Chỉ cần nhấp đúp vào tệp:
```bash
start_app.bat
```
Hệ thống sẽ tự động khởi động đồng thời cả Backend FastAPI và Frontend React.

### Cách 2: Khởi động thủ công

#### Bước 1: Khởi động Backend API
```bash
uvicorn backend.server:app --host 127.0.0.1 --port 8000
```
Backend sẽ chạy tại: `http://localhost:8000` (API Docs tại `http://localhost:8000/docs`).

#### Bước 2: Khởi động Frontend React + Vite
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
Giao diện Web sẽ chạy tại: `http://localhost:5173`.
