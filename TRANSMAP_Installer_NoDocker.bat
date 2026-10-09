@echo off
echo ========================================
echo TRANSMAP Zabbix Topology - Installation (Sans Docker)
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Python n'est pas installe.
    echo.
    echo Veuillez installer Python 3.11 depuis:
    echo https://www.python.org/downloads/
    echo.
    echo IMPORTANT: Cochez "Add Python to PATH" lors de l'installation
    echo.
    pause
    exit /b 1
)

echo [OK] Python est installe
python --version
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe.
    echo.
    echo Veuillez installer Node.js 20 depuis:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js est installe
node --version
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

REM Install Python dependencies
echo [INFO] Installation des dependances Python...
cd "%USERPROFILE%\zabbix-topology\backend"
python -m pip install --upgrade pip
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo [ERREUR] Echec de l'installation des dependances Python.
    pause
    exit /b 1
)

echo [OK] Dependances Python installees
echo.

REM Install Node.js dependencies
echo [INFO] Installation des dependances Node.js...
cd /d "%~dp0frontend"
npm install

if %errorlevel% neq 0 (
    echo [ERREUR] Echec de l'installation des dependances Node.js.
    pause
    exit /b 1
)

echo [OK] Dependances Node.js installees
echo.

REM Build frontend
echo [INFO] Construction du frontend...
npm run build

if %errorlevel% neq 0 (
    echo [ERREUR] Echec de la construction du frontend.
    pause
    exit /b 1
)

echo [OK] Frontend construit
echo.

echo ========================================
echo Installation terminee!
echo ========================================
echo.
echo Pour lancer l'application:
echo 1. Backend: cd %%USERPROFILE%%\zabbix-topology\backend ^&^& python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
echo 2. Frontend: cd %%USERPROFILE%%\zabbix-topology\frontend ^&^& npm run preview
echo.
echo Ou executez le script: TRANSMAP_Launcher.bat
echo.
echo ========================================
echo Contact developpeur
echo ========================================
echo Developpe par: Marouane KRIR
echo GitHub: https://github.com/Marouane-K/zabbix-topology
echo LinkedIn: https://www.linkedin.com/in/marouane-krir/
echo.
pause
