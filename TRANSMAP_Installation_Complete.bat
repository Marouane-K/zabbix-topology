@echo off
echo ========================================
echo TRANSMAP Zabbix Topology - Installation Complete
echo ========================================
echo.

REM Check what needs to be installed
set NEED_PYTHON=0
set NEED_NODE=0
set NEED_GIT=0

python --version >nul 2>&1
if %errorlevel% neq 0 set NEED_PYTHON=1

node --version >nul 2>&1
if %errorlevel% neq 0 set NEED_NODE=1

git --version >nul 2>&1
if %errorlevel% neq 0 set NEED_GIT=1

REM If everything is installed, skip the installation prompt
if %NEED_PYTHON%==0 if %NEED_NODE%==0 if %NEED_GIT%==0 (
    echo [OK] Tous les outils requis sont deja installes.
    echo.
    goto :continue_installation
)

REM Display what needs to be installed
echo [INFO] Certains outils necessaires ne sont pas installes.
echo.
echo Outils a installer:
if %NEED_PYTHON%==1 echo   - Python 3.11 (~500 MB)
if %NEED_NODE%==1 echo   - Node.js 20 LTS (~300 MB)
if %NEED_GIT%==1 echo   - Git (~100 MB)
echo.
echo Espace disque total necessaire: ~900 MB
echo.
echo L'installation sera effectuee automatiquement via Windows Package Manager (winget).
echo Ceci peut prendre plusieurs minutes.
echo.
set /p CONFIRM="Souhaitez-vous proceder a l'installation automatique? (O/N): "
if /i not "%CONFIRM%"=="O" (
    echo [ERREUR] Installation annulee par l'utilisateur.
    pause
    exit /b 1
)

echo.
echo [INFO] Debut de l'installation automatique...
echo.

REM Install Python if needed
if %NEED_PYTHON%==1 (
    echo [INFO] Installation de Python 3.11...
    winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo [ERREUR] Echec de l'installation de Python.
        pause
        exit /b 1
    )
    echo [OK] Python installe avec succes.
    echo.
)

REM Install Node.js if needed
if %NEED_NODE%==1 (
    echo [INFO] Installation de Node.js 20 LTS...
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo [ERREUR] Echec de l'installation de Node.js.
        pause
        exit /b 1
    )
    echo [OK] Node.js installe avec succes.
    echo.
)

REM Install Git if needed
if %NEED_GIT%==1 (
    echo [INFO] Installation de Git...
    winget install Git.Git --silent --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo [ERREUR] Echec de l'installation de Git.
        pause
        exit /b 1
    )
    echo [OK] Git installe avec succes.
    echo.
)

REM Refresh environment variables
echo [INFO] Mise a jour des variables d'environnement...
call refreshenv >nul 2>&1
timeout /t 3 /nobreak >nul
echo [OK] Variables d'environnement mises a jour.
echo.

:continue_installation
echo [OK] Python est installe
python --version
echo.

echo [OK] Node.js est installe
node --version
echo.

echo [OK] Git est installe
git --version
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
