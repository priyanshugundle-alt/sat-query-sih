@echo off
echo Starting SatQuery AI (Java Backend, Vite Frontend ^& Python Model Server)...

start "SatQuery Backend" cmd /k "cd /d %~dp0backend && mvnw.cmd exec:java"
start "SatQuery Frontend" cmd /k "cd /d %~dp0frontend && pnpm run dev"
start "SatQuery Model Server" cmd /k "cd /d %~dp0 && start_python.bat"

echo SatQuery AI started successfully!
