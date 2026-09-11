@echo off
echo ==================================================
echo Starting SatQuery Agentic PyTorch Model Server...
echo ==================================================

cd /d %~dp0model_server

if exist "%~dp0.venv\Scripts\activate.bat" (
    echo Activating project virtual environment from .venv...
    call "%~dp0.venv\Scripts\activate.bat"
) else if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

echo Launching FastAPI Server on Port 5000...
python main.py

pause
