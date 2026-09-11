@echo off
echo Starting SatQuery AI (Java Backend & Vite Frontend)...

start "SatQuery Backend" cmd /k "cd /d %~dp0backend && mvnw.cmd exec:java"
start "SatQuery Frontend" cmd /k "cd /d %~dp0frontend && npx --no-install vite --host"

echo SatQuery AI (Java Backend & Vite Frontend) started successfully!

