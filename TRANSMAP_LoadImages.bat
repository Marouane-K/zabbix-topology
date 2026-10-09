@echo off
echo ========================================
echo TRANSMAP - Chargement des images Docker offline
echo ========================================
echo.

if not exist "images.tar" (
    echo [ERREUR] Fichier images.tar non trouve.
    echo.
    echo Ce script doit etre execute dans le meme dossier que le fichier images.tar
    echo.
    echo Pour creer images.tar sur un PC avec internet:
    echo   docker pull python:3.11-slim
    echo   docker pull node:20-alpine
    echo   docker pull nginx:alpine
    echo   docker save python:3.11-slim node:20-alpine nginx:alpine -o images.tar
    echo.
    pause
    exit /b 1
)

echo [INFO] Chargement des images depuis images.tar...
docker load -i images.tar

if %errorlevel% neq 0 (
    echo [ERREUR] Echec du chargement des images.
    pause
    exit /b 1
)

echo.
echo [OK] Images chargees avec succes!
echo.
echo Vous pouvez maintenant lancer l'installation avec:
echo   TRANSMAP_Installer.bat
echo.
pause
