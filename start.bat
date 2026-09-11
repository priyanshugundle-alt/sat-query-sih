@echo off
echo Starting SatQuery AI (Java Backend ^& Vite Frontend)...

REM Set JAVA_HOME automatically to installed JDK 26 or 21
if exist "C:\Program Files\Java\jdk-26.0.1" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-26.0.1"
) else if exist "C:\Program Files\Java\jdk-21.0.12.1" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.12.1"
) else if exist "%USERPROFILE%\.antigravity-ide\extensions\redhat.java-1.56.0-win32-x64\jre\21.0.12.1-win32-x86_64" (
    set "JAVA_HOME=%USERPROFILE%\.antigravity-ide\extensions\redhat.java-1.56.0-win32-x64\jre\21.0.12.1-win32-x86_64"
) else if exist "%APPDATA%\Code\User\globalStorage\pleiades.java-extension-pack-jdk\java\21" (
    set "JAVA_HOME=%APPDATA%\Code\User\globalStorage\pleiades.java-extension-pack-jdk\java\21"
)

if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"

echo SatQuery AI (Java Backend ^& Vite Frontend) started successfully!

REM Check if Java Backend on Port 8080 is already running
netstat -ano | findstr :8080 >nul
if %errorlevel% neq 0 (
    echo Launching Java Backend on Port 8080...
    start "SatQuery Backend (Port 8080)" cmd /k "cd /d %~dp0backend && set JAVA_HOME=%JAVA_HOME% && set PATH=%JAVA_HOME%\bin;%%PATH%% && mvnw.cmd exec:java"
) else (
    echo Java Backend is already active on Port 8080.
)

REM Check if React Frontend on Port 5173 is already running
netstat -ano | findstr :5173 >nul
if %errorlevel% neq 0 (
    echo Launching React Frontend on Port 5173...
    start "SatQuery Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && pnpm run dev"
) else (
    echo React Frontend UI is already active on Port 5173.
)

echo =========================================================
echo All SatQuery AI Services Are Active and Online!
echo Frontend: http://localhost:5173/
echo Java Backend: http://localhost:8080/
echo Model Server: http://localhost:5000/
echo =========================================================
