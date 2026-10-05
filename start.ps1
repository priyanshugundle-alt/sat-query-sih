# PowerShell script to start SatQuery AI Java Backend, Python Model Server, and Frontend
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

$candidateJdkPaths = @(
    "C:\Program Files\Android\Android Studio\jbr",
    "C:\Program Files\Microsoft\jdk-21",
    "C:\Program Files\Java\jdk-21.0.12.1",
    "C:\Program Files\Java\jdk-26.0.1",
    "$env:USERPROFILE\.antigravity-ide\extensions\redhat.java-1.56.0-win32-x64\jre\21.0.12.1-win32-x86_64",
    "$env:APPDATA\Code\User\globalStorage\pleiades.java-extension-pack-jdk\java\21"
)
foreach ($jdk in $candidateJdkPaths) {
    if (Test-Path $jdk) {
        $env:JAVA_HOME = $jdk
        $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
        break
    }
}

Write-Host "Starting SatQuery AI Workstation..." -ForegroundColor Green

if (-not (Test-Path "$scriptDir\frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location "$scriptDir\frontend"
    pnpm install
    Pop-Location
}

# Auto-create model_server\.env from .env.example if missing
if (-not (Test-Path "$scriptDir\model_server\.env")) {
    if (Test-Path "$scriptDir\model_server\.env.example") {
        Write-Host "Auto-creating missing model_server\.env from template..." -ForegroundColor Cyan
        Copy-Item "$scriptDir\model_server\.env.example" "$scriptDir\model_server\.env"
    }
}

# Check Port 5000 (Agentic PyTorch Model Server)
$port5000Active = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if (-not $port5000Active) {
    Write-Host "Launching Python Agentic Model Server on Port 5000..." -ForegroundColor Cyan
    $pythonExe = if (Test-Path "$scriptDir\.venv\Scripts\python.exe") { "$scriptDir\.venv\Scripts\python.exe" } else { "python" }
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\model_server'; & '$pythonExe' main.py"
} else {
    Write-Host "Python Model Server is already active on Port 5000." -ForegroundColor Yellow
}

# Check Port 8080 (Java Backend)
$port8080Active = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if (-not $port8080Active) {
    Write-Host "Launching Java Core Backend on Port 8080..." -ForegroundColor Cyan
    $javaBin = "$($env:JAVA_HOME)\bin"
    $backendCmd = "cd '$scriptDir\backend'; `$env:JAVA_HOME = '$($env:JAVA_HOME)'; `$env:PATH = '$javaBin;' + `$env:PATH; .\mvnw.cmd exec:java"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
} else {
    Write-Host "Java Core Backend is already active on Port 8080." -ForegroundColor Yellow
}

# Check Port 5173 (React Frontend)
$port5173Active = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if (-not $port5173Active) {
    Write-Host "Launching React Frontend UI on Port 5173..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; pnpm run dev"
} else {
    Write-Host "React Frontend UI is already active on Port 5173." -ForegroundColor Yellow
}

Write-Host "=========================================================" -ForegroundColor Green
Write-Host "All SatQuery AI Services Are Active & Online!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173/" -ForegroundColor Cyan
Write-Host "Java Backend: http://localhost:8080/" -ForegroundColor Cyan
Write-Host "Model Server: http://localhost:5000/" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Green
