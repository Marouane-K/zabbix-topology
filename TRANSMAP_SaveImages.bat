@echo off
echo ========================================
echo TRANSMAP - Sauvegarde des images Docker pour offline
echo ========================================
echo.
echo Ce script telecharge les images Docker necessaires et les sauvegarde dans un fichier tar.
echo Utilisez ce fichier sur un PC sans internet pour charger les images.
echo.

echo [INFO] Telechargement de python:3.11-slim...
docker pull python:3.11-slim
if %errorlevel% neq 0 (
    echo [ERREUR] Echec du telechargement de python:3.11-slim
    pause
    exit /b 1
)

echo [OK] python:3.11-slim telecharge
echo.

echo [INFO] Telechargement de node:20-alpine...
docker pull node:20-alpine
if %errorlevel% neq 0 (
    echo [ERREUR] Echec du telechargement de node:20-alpine
    pause
    exit /b 1
)

echo [OK] node:20-alpine telecharge
echo.

echo [INFO] Telechargement de nginx:alpine...
docker pull nginx:alpine
if %errorlevel% neq 0 (
    echo [ERREUR] Echec du telechargement de nginx:alpine
    pause
    exit /b 1
)

echo [OK] nginx:alpine telecharge
echo.

echo [INFO] Sauvegarde des images dans images.tar...
docker save python:3.11-slim node:20-alpine nginx:alpine -o images.tar

if %errorlevel% neq 0 (
    echo [ERREUR] Echec de la sauvegarde des images.
    pause
    exit /b 1
)

echo.
echo [OK] Images sauvegardees dans images.tar
echo.
echo ========================================
echo Instructions:
echo ========================================
echo.
echo 1. Transferez le fichier images.tar vers le PC sans internet
echo 2. Sur le PC sans internet, executez: TRANSMAP_LoadImages.bat
echo 3. Lancez l'installation normale: TRANSMAP_Installer.bat
echo.
pause
