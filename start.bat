@echo off
echo Starting PlantGuard backend...
start "PlantGuard Backend" cmd /k "node backend\server.js"

timeout /t 2 /nobreak >nul

echo Starting PlantGuard frontend...
start "PlantGuard Frontend" cmd /k "npm --prefix frontend run dev"

echo.
echo PlantGuard is starting up!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000

