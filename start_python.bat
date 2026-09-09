@echo off
echo ==================================================
echo Starting SatQuery Agentic PyTorch Model Server...
echo ==================================================

cd /d %~dp0model_server

echo Checking if virtual environment exists...
IF NOT EXIST "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing required ML packages...
pip install -r requirements.txt

echo Launching FastAPI Server on Port 5000...
python main.py

pause
