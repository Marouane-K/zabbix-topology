@echo off
echo ========================================
echo TRANSMAP Zabbix Topology - Installation
echo ========================================
echo.

REM Check Python
echo [1/3] Verification de Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Python est installe.
    python --version
) else (
    echo [INFO] Python non trouve. Installation en cours...
    winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    echo [OK] Python installe.
)
echo.

REM Check Node.js
echo [2/3] Verification de Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js est installe.
    node --version
) else (
    echo [INFO] Node.js non trouve. Installation en cours...
    winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
    echo [OK] Node.js installe.
)
echo.

REM Check Git
echo [3/3] Verification de Git...
git --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Git est installe.
    git --version
) else (
    echo [INFO] Git non trouve. Installation en cours...
    winget install Git.Git --silent --accept-package-agreements --accept-source-agreements
    echo [OK] Git installe.
)
echo.

REM Refresh PATH
echo [INFO] Mise a jour des variables d'environnement...
timeout /t 5 /nobreak >nul
echo [OK] Variables mises a jour.
echo.

REM Use direct paths to executables instead of relying on PATH
echo [INFO] Utilisation des chemins directs vers les executables...

REM Set Python path
if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    set PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python311\python.exe
) else if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python312\python.exe
) else if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" (
    set PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python313\python.exe
) else if exist "%LOCALAPPDATA%\Programs\Python\Python314\python.exe" (
    set PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python314\python.exe
) else if exist "C:\Python311\python.exe" (
    set PYTHON_CMD=C:\Python311\python.exe
) else if exist "C:\Python312\python.exe" (
    set PYTHON_CMD=C:\Python312\python.exe
) else if exist "C:\Python313\python.exe" (
    set PYTHON_CMD=C:\Python313\python.exe
) else if exist "C:\Python314\python.exe" (
    set PYTHON_CMD=C:\Python314\python.exe
) else (
    echo [INFO] Recherche de Python via PATH...
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
                echo [ERREUR] Python introuvable.
                pause
                exit /b 1
            )
        )
    )
)

echo [OK] Python: %PYTHON_CMD%

REM Set Node.js path
if exist "%APPDATA%\npm\node_modules\npm\bin\npm.cmd" (
    set NPM_CMD=%APPDATA%\npm\node_modules\npm\bin\npm.cmd
) else if exist "%ProgramFiles%\nodejs\npm.cmd" (
    set NPM_CMD=%ProgramFiles%\nodejs\npm.cmd
) else if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" (
    set NPM_CMD=%ProgramFiles(x86)%\nodejs\npm.cmd
) else (
    echo [INFO] Recherche de npm via PATH...
    npm --version >nul 2>&1
    if %errorlevel% equ 0 (
        set NPM_CMD=npm
    ) else (
        echo [ERREUR] npm introuvable.
        pause
        exit /b 1
    )
)

echo [OK] npm: %NPM_CMD%

REM Set Git path
if exist "%ProgramFiles%\Git\cmd\git.exe" (
    set GIT_CMD=%ProgramFiles%\Git\cmd\git.exe
) else if exist "%ProgramFiles(x86)%\Git\cmd\git.exe" (
    set GIT_CMD=%ProgramFiles(x86)%\Git\cmd\git.exe
) else if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" (
    set GIT_CMD=%LOCALAPPDATA%\Programs\Git\cmd\git.exe
) else (
    echo [INFO] Recherche de git via PATH...
    git --version >nul 2>&1
    if %errorlevel% equ 0 (
        set GIT_CMD=git
    ) else (
        echo [ERREUR] git introuvable.
        pause
        exit /b 1
    )
)

echo [OK] Git: %GIT_CMD%
echo.

REM Clone or update repository
echo [INFO] Clonage ou mise a jour du depot...
if exist "%USERPROFILE%\zabbix-topology" (
    cd "%USERPROFILE%\zabbix-topology"
    "%GIT_CMD%" pull >nul 2>&1
    cd ..
) else (
    cd "%USERPROFILE%"
    "%GIT_CMD%" clone https://github.com/Marouane-K/zabbix-topology.git
)
echo [OK] Depot pret.
echo.

REM Install Python dependencies
echo [INFO] Installation des dependances Python...
cd "%USERPROFILE%\zabbix-topology\backend"
"%PYTHON_CMD%" -m pip install --upgrade pip >nul 2>&1
"%PYTHON_CMD%" -m pip install fastapi uvicorn httpx pydantic pydantic-settings python-multipart aiosqlite
echo [OK] Dependances Python installees.
echo.

REM Install Node.js dependencies
echo [INFO] Installation des dependances Node.js...
cd "%USERPROFILE%\zabbix-topology\frontend"
call "%NPM_CMD%" install
echo [OK] Dependances Node.js installees.
echo.

REM Build frontend
echo [INFO] Construction du frontend...
call "%NPM_CMD%" run build
echo [OK] Frontend construit.
echo.

echo ========================================
echo Installation terminee avec succes!
echo ========================================
echo.
echo Pour lancer l'application:
echo   Double-cliquez sur: TRANSMAP_Start.bat
echo.
echo Access: http://localhost:5173
echo.
echo Appuyez sur ENTREE pour fermer...
pause >nul
