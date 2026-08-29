# PowerShell script to start SatQuery AI Backend and Frontend
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

Write-Host "Starting SatQuery AI Backend and Frontend..." -ForegroundColor Green

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; .\mvnw.cmd exec:java"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; pnpm run dev"

Write-Host "Both Backend and Frontend terminal windows have been launched!" -ForegroundColor Cyan
