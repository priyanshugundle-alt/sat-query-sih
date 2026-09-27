@echo off
setlocal enabledelayedexpansion
title SatQuery AI - Launcher

echo =========================================================
echo       SatQuery AI - Full System Launcher
echo =========================================================
echo.

REM Detect and set JAVA_HOME automatically
set "DETECTED_JAVA="
if defined JAVA_HOME if exist "%JAVA_HOME%\bin\java.exe" set "DETECTED_JAVA=%JAVA_HOME%"
if "%DETECTED_JAVA%"=="" if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" set "DETECTED_JAVA=C:\Program Files\Android\Android Studio\jbr"
if "%DETECTED_JAVA%"=="" if exist "C:\Program Files\Java\jdk-26.0.1\bin\java.exe" set "DETECTED_JAVA=C:\Program Files\Java\jdk-26.0.1"
if "%DETECTED_JAVA%"=="" if exist "C:\Program Files\Java\jdk-21.0.12.1\bin\java.exe" set "DETECTED_JAVA=C:\Program Files\Java\jdk-21.0.12.1"
if "%DETECTED_JAVA%"=="" if exist "%USERPROFILE%\.java\jdk-26.0.1\bin\java.exe" set "DETECTED_JAVA=%USERPROFILE%\.java\jdk-26.0.1"

if "%DETECTED_JAVA%"=="" (
    for /d %%d in ("C:\Program Files\Microsoft\jdk-21*") do (
        if exist "%%d\bin\java.exe" set "DETECTED_JAVA=%%d"
    )
)
if "%DETECTED_JAVA%"=="" (
    for /d %%d in ("C:\Program Files\Eclipse Adoptium\jdk-21*") do (
        if exist "%%d\bin\java.exe" set "DETECTED_JAVA=%%d"
    )
)
if "%DETECTED_JAVA%"=="" (
    for /d %%d in ("C:\Program Files\Java\jdk*") do (
        if exist "%%d\bin\java.exe" set "DETECTED_JAVA=%%d"
    )
)

if "%DETECTED_JAVA%"=="" (
    echo [ERROR] No valid JDK installation found!
    echo Please ensure Java 21 or Java 26 is installed.
    pause
    exit /b 1
)


set "JAVA_HOME=%DETECTED_JAVA%"
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo [OK] JAVA_HOME set to: %JAVA_HOME%
echo.

REM 1. Check and start Python Model Server on Port 5000
netstat -ano | findstr /C:":5000 " | findstr /I "LISTENING" >nul
if %errorlevel% neq 0 (
    echo [1/3] Starting Python Model Server on Port 5000...
    if exist "%~dp0.venv\Scripts\python.exe" (
        start "SatQuery Model Server" cmd /k "cd /d %~dp0model_server && ..\.venv\Scripts\python.exe main.py"
    ) else (
        start "SatQuery Model Server" cmd /k "cd /d %~dp0model_server && .\venv\Scripts\python.exe main.py"
    )
) else (
    echo [1/3] Python Model Server is already active on Port 5000.
)

REM 2. Check and start Java Backend on Port 8080
netstat -ano | findstr /C:":8080 " | findstr /I "LISTENING" >nul
if %errorlevel% neq 0 (
    echo [2/3] Starting Java Backend on Port 8080...
    start "SatQuery Java Backend" cmd /k "set \"JAVA_HOME=%JAVA_HOME%\" && cd /d %~dp0backend && .\mvnw.cmd exec:java"
) else (
    echo [2/3] Java Backend is already active on Port 8080.
)

REM 3. Check and start React Frontend on Port 5173
netstat -ano | findstr /C:":5173 " | findstr /I "LISTENING" >nul
if %errorlevel% neq 0 (
    echo [3/3] Starting React Frontend on Port 5173...
    start "SatQuery Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
) else (
    echo [3/3] React Frontend UI is already active on Port 5173.
)

echo.
echo =========================================================
echo All SatQuery AI Services Launched!
echo   Frontend Web UI : http://localhost:5173/
echo   Java Backend API: http://localhost:8080/
echo   Model Server API: http://localhost:5000/
echo =========================================================
echo.
ping -n 3 127.0.0.1 >nul
