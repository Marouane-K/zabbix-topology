@echo off
echo ========================================
echo TRANSMAP Zabbix Topology - Lancement
echo ========================================
echo.

cd "%USERPROFILE%\zabbix-topology"

REM Start backend in new window
echo [INFO] Demarrage du backend...
start "TRANSMAP Backend" cmd /k "cd /d %USERPROFILE%\zabbix-topology\backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo [INFO] Demarrage du frontend...
start "TRANSMAP Frontend" cmd /k "cd /d %USERPROFILE%\zabbix-topology\frontend && npm run dev"

echo.
echo ========================================
echo Application lancee!
echo ========================================
echo.
echo Backend API: http://localhost:8000
echo Frontend: http://localhost:4173
echo.
echo Documentation API: http://localhost:8000/docs
echo.
echo Pour arreter:
echo - Fermez les fenetres ouvertes
echo - Ou appuyez sur Ctrl+C dans chaque fenetre
echo.
pause
