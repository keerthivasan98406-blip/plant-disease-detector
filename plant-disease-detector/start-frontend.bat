@echo off
chcp 65001
echo Starting Leonux AI Frontend...
C:\node-v24.13.1-win-x64\npm.cmd --prefix "%~dp0frontend" run dev
pause
