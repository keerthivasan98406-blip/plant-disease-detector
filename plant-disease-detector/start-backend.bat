@echo off
chcp 65001
echo Starting Leonux AI Backend...
C:\node-v24.13.1-win-x64\node.exe "%~dp0backend\server.js"
pause
