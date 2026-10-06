@echo off
title KLCN04 - Windows PE Malware Detection Launcher
echo ===============================================================
echo   KLCN04 - HE THONG PHAT HIEN MA DOC WINDOWS PE STATIC ANALYSIS
echo   EMBER 2018 v2 (2,381 Features) - LightGBM, XGBoost, Ensembles
echo ===============================================================
echo.
echo [1/2] Khoi dong Backend FastAPI tai http://localhost:8000...
start "KLCN04-Backend" cmd /c "uvicorn backend.server:app --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

echo [2/2] Khoi dong Frontend React + Vite tai http://localhost:5173...
cd frontend
start "KLCN04-Frontend" cmd /c "npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo ===============================================================
echo   He thong da khoi dong thanh cong!
echo   * Giao dien Web React UI : http://localhost:5173
echo   * Backend REST API Docs  : http://localhost:8000/docs
echo ===============================================================
echo.
pause
