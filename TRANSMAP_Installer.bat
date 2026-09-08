@echo off
echo ========================================
echo TRANSMAP Zabbix Topology - Installation
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Docker n'est pas installe.
    echo.
    echo Veuillez installer Docker Desktop depuis:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

echo [OK] Docker est installe
docker --version
echo.

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Git n'est pas installe.
    echo.
    echo Veuillez installer Git depuis:
    echo https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo [OK] Git est installe
git --version
echo.

REM Clone or update the repository
if exist "%USERPROFILE%\zabbix-topology" (
    echo [INFO] Le dossier existe deja, mise a jour...
    cd "%USERPROFILE%\zabbix-topology"
    git pull
    cd ..
) else (
    echo [INFO] Clonage du depot depuis GitHub...
    cd "%USERPROFILE%"
    git clone https://github.com/Marouane-K/zabbix-topology.git
)

if %errorlevel% neq 0 (
    echo [ERREUR] Echec du clonage du depot.
    pause
    exit /b 1
)

echo [OK] Depot clone ou mis a jour
echo.

REM Build and start with Docker Compose
echo [INFO] Construction et demarrage de l'application...
echo Cela peut prendre plusieurs minutes...
echo.
cd "%USERPROFILE%\zabbix-topology"
docker-compose up --build

echo.
echo ========================================
echo Installation terminee!
echo ========================================
echo.
echo Pour acceder a l'application:
echo - Frontend: http://localhost
echo - Backend API: http://localhost:8000
echo.
echo Pour arreter l'application:
echo - Appuyez sur Ctrl+C dans cette fenetre
echo - Ou executez: docker-compose down
echo.
echo ========================================
echo Contact developpeur
echo ========================================
echo Developpe par: Marouane KRIR
echo GitHub: https://github.com/Marouane-K/zabbix-topology
echo LinkedIn: https://www.linkedin.com/in/marouane-krir/
echo.
pause
