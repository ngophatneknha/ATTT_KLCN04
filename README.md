# ATTT_KLCN04 — Nghiên Cứu Các Kỹ Thuật Phân Tích Tĩnh Và Ứng Dụng Thuật Toán Học Máy Trong Phát Hiện Mã Độc Windows

Khóa luận Cử nhân ngành An toàn Thông tin.

## 📌 Tổng Quan Đề Tài
* **Mã đồ án:** `ATTT_KLCN04`
* **Mục tiêu:** Nghiên cứu và xây dựng hệ thống phát hiện mã độc Windows PE thời gian thực dựa trên kỹ thuật phân tích tĩnh (Static Analysis) và các thuật toán học máy / học sâu hiện đại.
* **Cơ sở dữ liệu:** EMBER 2018 v2 (1.100.000 mẫu PE, không gian 2.381 chiều đặc trưng).
* **Kết quả đạt được:** Mô hình Ensemble đạt **Accuracy 97.39%**, **ROC-AUC 0.9954**, và **TPR @ FPR 1% đạt 95.32%** (vượt chuẩn baseline của bài báo gốc EMBER 2018).

## 🛠️ Kiến Trúc Hệ Thống
* **Core Machine Learning:** LightGBM, XGBoost, Random Forest, ResNet-Tabular, RealMLP, SoftVoting Ensemble.
* **Backend:** FastAPI (Python 3.11, LIEF 0.12.3, EMBER Extractor).
* **Frontend:** React + Vite + TailwindCSS (Cyber Threat Intelligence Dashboard).
