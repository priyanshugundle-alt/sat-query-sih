@echo off
title SatQuery AI - Shutdown
echo =========================================================
echo       Stopping All SatQuery AI Services...
echo =========================================================
echo.

powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5000, 8080, 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Write-Host '[OK] Ports 5000, 8080, and 5173 terminated.'"

echo.
echo All SatQuery AI servers (Python, Java Backend, React) have been stopped.
echo =========================================================
ping -n 3 127.0.0.1 >nul
