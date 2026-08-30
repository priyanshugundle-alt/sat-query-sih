@echo off
echo Starting SatQuery AI Backend and Frontend...

start "SatQuery Backend" cmd /k "cd /d %~dp0backend && mvnw.cmd exec:java"
start "SatQuery Frontend" cmd /k "cd /d %~dp0frontend && pnpm run dev"

echo Both Frontend and Backend are starting up!

