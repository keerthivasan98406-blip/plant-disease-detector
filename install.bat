@echo off
echo Installing frontend dependencies...
D:\node-v24.13.1-win-x64\npm.cmd install --prefix frontend

echo.
echo Installing backend dependencies...
D:\node-v24.13.1-win-x64\npm.cmd install --prefix backend

echo.
echo Done! Run start.bat to launch the app.
