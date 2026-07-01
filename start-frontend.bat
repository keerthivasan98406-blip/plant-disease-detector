@echo off
chcp 65001
echo Starting Leonux AI Frontend...
npm --prefix "%~dp0frontend" run dev
pause
