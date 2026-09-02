# PowerShell script to start SatQuery AI Java Backend and Frontend
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "Starting SatQuery AI Java Backend and Frontend..." -ForegroundColor Green

if (-not (Test-Path "$scriptDir\frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location "$scriptDir\frontend"
    pnpm install
    Pop-Location
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; .\mvnw.cmd exec:java"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; npx --no-install vite --host"

Write-Host "SatQuery AI Backend & Frontend launched!" -ForegroundColor Cyan


