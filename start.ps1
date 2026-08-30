# PowerShell script to start SatQuery AI VLM Server, Java Backend, and Frontend
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "Starting SatQuery AI VLM Server, Java Backend, and Frontend..." -ForegroundColor Green

if (-not (Test-Path "$scriptDir\frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location "$scriptDir\frontend"
    pnpm install
    Pop-Location
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; python qwen_vlm_server.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; .\mvnw.cmd exec:java"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; pnpm run dev"

Write-Host "All three tier terminals (Qwen2-VL Server, Java Backend, Vite Frontend) have been launched!" -ForegroundColor Cyan


