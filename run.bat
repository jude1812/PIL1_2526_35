@echo off
title IFRI_MentorLink - Backend

echo ========================================
echo   IFRI_MentorLink - Lancement du backend
echo ========================================
echo.

echo [1/2] Installation des dependances...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo.
    echo ❌ Erreur lors de l'installation des dependances
    pause
    exit /b %errorlevel%
)

echo.
echo ✅ Dependances installees avec succes
echo.

echo [2/2] Lancement de l'application...
echo.
python backend\api\run_api.py

pause
