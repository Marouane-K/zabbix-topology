@echo off
echo ========================================
echo TRANSMAP Zabbix Topology - Installation Complete
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

REM Configure npm proxy
echo [INFO] Configuration du proxy npm...
npm config set proxy http://10.22.16.30:3128
npm config set https-proxy http://10.22.16.30:3128
echo [OK] Proxy npm configure
echo.

REM Clone or update the repository
if exist "%USERPROFILE%\zabbix-topology" (
    echo [INFO] Le dossier existe deja, mise a jour...
    cd "%USERPROFILE%\zabbix-topology"
    git pull
    if %errorlevel% neq 0 (
        echo [WARNING] Git pull a echoue, mise a jour manuelle necessaire
    )
    cd ..
) else (
    echo [INFO] Clonage du depot depuis GitHub...
    cd "%USERPROFILE%"
    git clone https://github.com/Marouane-K/zabbix-topology.git
    if %errorlevel% neq 0 (
        echo [WARNING] Git clone a echoue, telechargement manuel necessaire
        echo.
        echo Instructions manuelles:
        echo 1. Allez sur https://github.com/Marouane-K/zabbix-topology
        echo 2. Telechargez le ZIP
        echo 3. Extrayez dans %USERPROFILE%\zabbix-topology
        echo 4. Relancez ce script
        echo.
        pause
        exit /b 1
    )
)

echo [OK] Depot clone ou mis a jour
echo.

REM Install Python dependencies
echo [INFO] Installation des dependances Python...
cd "%USERPROFILE%\zabbix-topology\backend"
python -m pip install --upgrade pip
pip install fastapi uvicorn httpx pydantic pydantic-settings python-multipart aiosqlite

if %errorlevel% neq 0 (
    echo [ERREUR] Echec de l'installation des dependances Python.
    pause
    exit /b 1
)

echo [OK] Dependances Python installees
echo.

REM Install Node.js dependencies
echo [INFO] Installation des dependances Node.js...
cd "%USERPROFILE%\zabbix-topology\frontend"
call npm install

if %errorlevel% neq 0 (
    echo [ERREUR] Echec de l'installation des dependances Node.js.
    pause
    exit /b 1
)

echo [OK] Dependances Node.js installees
echo.

REM Build frontend
echo [INFO] Construction du frontend...
call npm run build

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
echo - Double-cliquez sur: TRANSMAP_Start.bat
echo - Ou executez: TRANSMAP_Launcher.bat
echo.
echo Access a l'application:
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:8000
echo - Documentation: http://localhost:8000/docs
echo.
echo ========================================
echo Contact developpeur
echo ========================================
echo Developpe par: Marouane KRIR
echo GitHub: https://github.com/Marouane-K/zabbix-topology
echo LinkedIn: https://www.linkedin.com/in/marouane-krir/
echo.
pause
