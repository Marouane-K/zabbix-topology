@echo off
echo ========================================
echo TRANSMAP Zabbix Topology - Demarrage
echo ========================================
echo.
echo Lancement de l'application...
echo.

cd C:\Users\admin\zabbix-topology

REM Start backend in new window
start "TRANSMAP Backend" cmd /k "cd /d C:\Users\admin\zabbix-topology\backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "TRANSMAP Frontend" cmd /k "cd /d C:\Users\admin\zabbix-topology\frontend && npm run dev"

echo.
echo ========================================
echo Application lancee!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000
echo Documentation: http://localhost:8000/docs
echo.
echo Pour arreter: Fermez les fenetres ouvertes
echo.
timeout /t 5
