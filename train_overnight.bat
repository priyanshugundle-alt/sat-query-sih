@echo off
title SatQuery AI - Overnight QLoRA Training
color 0A

echo ======================================================================
echo          SATQUERY AI -- OVERNIGHT QLoRA MODEL FINE-TUNING
echo ======================================================================
echo.

:: 1. Prevent Windows from sleeping or turning off screen when plugged in
echo [1/3] Disabling Windows Sleep and Screen Timeout (Plugged in)...
powercfg /change standby-timeout-ac 0
powercfg /change monitor-timeout-ac 0
powercfg /change hibernate-timeout-ac 0

:: 2. Activate Python Virtual Environment
echo [2/3] Activating Virtual Environment (.venv)...
call "%~dp0.venv\Scripts\activate.bat"

:: 3. Choose sample count or default overnight
echo.
echo [3/3] Ready to start training!
echo.
echo Select Training Mode:
echo   [1] Fast Training (30,000 QA pairs, ~2 to 2.5 hours)
echo   [2] Full Overnight 96k (96,000 QA pairs, ~6 to 7 hours -- Perfect for Sleeping!)
echo   [3] All Samples (-1 for entire dataset) or Custom
echo.

set /p MODE="Enter your choice (1, 2, or 3) [Default: 2]: "
if "%MODE%"=="" set MODE=2

if "%MODE%"=="1" (
    echo.
    echo Starting 30,000 Samples Training...
    python "%~dp0agent\train_bigearthnet_txt_qlora.py" --samples 30000 --batch_size 2 --grad_accum 8 --epochs 1
) else if "%MODE%"=="2" (
    echo.
    echo Starting 96,000 (96k) Samples Overnight Training...
    python "%~dp0agent\train_bigearthnet_txt_qlora.py" --samples 96000 --batch_size 2 --grad_accum 8 --epochs 1
) else (
    set /p CUSTOM_SAMPLES="Enter number of samples (-1 for all): "
    python "%~dp0agent\train_bigearthnet_txt_qlora.py" --samples %CUSTOM_SAMPLES% --batch_size 2 --grad_accum 8 --epochs 1
)

echo.
echo ======================================================================
echo Training Completed! You can now test the model.
echo ======================================================================
pause
