@echo off
cd /d "%~dp0"
echo ===========================================================================
echo Running SatQuery Model Verification Suite...
echo ===========================================================================
".\model_server\venv\Scripts\python.exe" verify_all_models.py
pause
