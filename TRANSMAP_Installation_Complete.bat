@echo off
echo ========================================
echo TRANSMAP Zabbix Topology - Installation Complete
echo ========================================
echo.
echo [INFO] Demarrage du script d'installation...
echo.
timeout /t 2 /nobreak >nul

REM Check what needs to be installed
set NEED_PYTHON=0
set NEED_NODE=0
set NEED_GIT=0

echo [INFO] Verification de Python...
python --version >nul 2>&1
if %errorlevel% neq 0 set NEED_PYTHON=1
if %NEED_PYTHON%==0 echo [OK] Python trouve. else echo [INFO] Python non trouve, installation necessaire.

echo [INFO] Verification de Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 set NEED_NODE=1
if %NEED_NODE%==0 echo [OK] Node.js trouve. else echo [INFO] Node.js non trouve, installation necessaire.

echo [INFO] Verification de Git...
git --version >nul 2>&1
if %errorlevel% neq 0 set NEED_GIT=1
if %NEED_GIT%==0 echo [OK] Git trouve. else echo [INFO] Git non trouve, installation necessaire.

echo.

REM If everything is installed, skip the installation prompt
if %NEED_PYTHON%==0 if %NEED_NODE%==0 if %NEED_GIT%==0 (
    echo [OK] Tous les outils requis sont deja installes.
    echo.
    echo Appuyez sur ENTREE pour continuer l'installation des dependances...
    pause
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
echo Appuyez sur ENTREE pour continuer, ou FERMER cette fenetre pour annuler.
echo [DEBUG] En attente de ENTRÉE...
pause
echo [DEBUG] ENTRÉE reçu, continuation...
echo.

echo.
echo [INFO] Debut de l'installation automatique...
echo.

REM Install Python if needed
if %NEED_PYTHON%==1 (
    echo [INFO] Installation de Python 3.11...
    winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo [INFO] Winget a echoue ou l'outil est deja installe. Verification...
    )
    REM Verify Python is working - try multiple methods
    python --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Python est operationnel (via 'python').
    ) else (
        python3 --version >nul 2>&1
        if %errorlevel% equ 0 (
            echo [OK] Python est operationnel (via 'python3').
        ) else (
            py --version >nul 2>&1
            if %errorlevel% equ 0 (
                echo [OK] Python est operationnel (via 'py').
            ) else (
                echo [INFO] Python a ete installe mais le PATH n'est pas encore a jour.
                echo [INFO] Veuillez fermer cette fenetre et relancer le script.
                echo.
                echo Le PATH sera mis a jour apres le redemarrage de la fenetre.
                pause
                exit /b 0
            )
        )
    )
    echo.
    echo [INFO] Python installation terminee. Appuyez sur ENTREE pour continuer...
    pause
)

REM Install Node.js if needed
if %NEED_NODE%==1 (
    echo [INFO] Installation de Node.js 20 LTS...
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo [INFO] Winget a echoue ou l'outil est deja installe. Verification...
    )
    REM Verify Node.js is working regardless of winget result
    node --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Node.js est operationnel.
    ) else (
        echo [INFO] Node.js a ete installe mais le PATH n'est pas encore a jour.
        echo [INFO] Veuillez fermer cette fenetre et relancer le script.
        echo.
        echo Le PATH sera mis a jour apres le redemarrage de la fenetre.
        pause
        exit /b 0
    )
    echo.
    echo [INFO] Node.js installation terminee. Appuyez sur ENTREE pour continuer...
    pause
)

REM Install Git if needed
if %NEED_GIT%==1 (
    echo [INFO] Installation de Git...
    winget install Git.Git --silent --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo [INFO] Winget a echoue ou l'outil est deja installe. Verification...
    )
    REM Verify Git is working regardless of winget result
    git --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Git est operationnel.
    ) else (
        echo [WARNING] Git ne fonctionne pas. Tentative d'installation alternative...
        echo [INFO] Veuillez installer Git manuellement depuis:
        echo https://git-scm.com/download/win
        pause
    )
    echo.
    echo [INFO] Git installation terminee. Appuyez sur ENTREE pour continuer...
    pause
)

REM Refresh environment variables
echo [INFO] Mise a jour des variables d'environnement...
call refreshenv >nul 2>&1
for /f "usebackq tokens=*" %%i in (`cmd /c "echo %PATH%"`) do set NEW_PATH=%%i
set PATH=%NEW_PATH%
timeout /t 5 /nobreak >nul
echo [OK] Variables d'environnement mises a jour.
echo.
echo [INFO] Appuyez sur ENTREE pour continuer l'installation des dependances...
pause
echo.

:continue_installation
echo [OK] Verification des outils installes...

REM Find working Python command
python --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=python
) else (
    python3 --version >nul 2>&1
    if %errorlevel% equ 0 (
        set PYTHON_CMD=python3
    ) else (
        py --version >nul 2>&1
        if %errorlevel% equ 0 (
            set PYTHON_CMD=py
        ) else (
            echo [ERREUR] Python non fonctionnel. Installation necessaire.
            pause
            exit /b 1
        )
    )
)

echo [OK] Python est operationnel
%PYTHON_CMD% --version
echo.

echo [OK] Node.js est operationnel
node --version
echo.

echo [OK] Git est operationnel
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
%PYTHON_CMD% -m pip install --upgrade pip
%PYTHON_CMD% -m pip install fastapi uvicorn httpx pydantic pydantic-settings python-multipart aiosqlite

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
