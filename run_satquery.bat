@echo off
:: ============================================================
:: SatQuery AI — One-Click System Launcher
:: SIH 2025 Problem Statement 26167 / ISRO SAC
:: ============================================================
title SatQuery AI — Launching...
color 0A

echo.
echo  ===================================================
echo    SatQuery AI v1.0 — ISRO SAC Agentic EO System
echo    Smart India Hackathon 2025 - PS 26167
echo  ===================================================
echo.

:: Check we are in the right directory
if not exist ".venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found at .venv\Scripts\python.exe
    echo         Please run this script from D:\SIH\sat-query-sih\
    pause
    exit /b 1
)

:: Check FastAPI / Uvicorn are installed
.venv\Scripts\python.exe -c "import fastapi, uvicorn" 2>nul
if errorlevel 1 (
    echo [SETUP] Installing FastAPI and Uvicorn...
    .venv\Scripts\pip.exe install fastapi uvicorn python-multipart httpx --quiet
)

:: Confirm GPU status
echo [STATUS] Checking compute device...
.venv\Scripts\python.exe -c "import torch; print('  GPU: ' + (torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU mode (no GPU detected)'))"

echo.
echo [INFO]  API Endpoint:  http://localhost:8000
echo [INFO]  Dashboard:     http://localhost:8000
echo [INFO]  API Docs:      http://localhost:8000/docs
echo [INFO]  Health Check:  http://localhost:8000/api/health
echo [INFO]  Demo Presets:  http://localhost:8000/api/demo-presets
echo.
echo [INFO]  Press CTRL+C to stop the server.
echo.

:: Allow browser to open after 3-second startup delay
start "" /B cmd /C "timeout /t 3 /nobreak >nul && start http://localhost:8000"

:: Start the FastAPI server using uvicorn
.venv\Scripts\python.exe -m uvicorn api.server:app --host 0.0.0.0 --port 8000 --reload

if errorlevel 1 (
    echo.
    echo [ERROR] Server exited with an error. See output above.
    pause
)
