@echo off
title IFRI_MentorLink - Backend
chcp 65001 >nul

echo ========================================
echo   IFRI_MentorLink - Lancement du backend
echo ========================================
echo.

:: ============================================
:: 1. Verification de la structure du projet
:: ============================================
echo [1/4] Verification de la structure du projet...

if not exist "backend\api\run_api.py" (
    echo ERREUR : backend\api\run_api.py manquant
    echo Lancez ce script depuis la racine du projet.
    pause
    exit /b 1
)
if not exist "requirements_windows.txt" (
    echo ERREUR : requirements_windows.txt manquant
    pause
    exit /b 1
)
echo OK - Structure du projet correcte
echo.

:: ============================================
:: 2. Verification de Python 3.11
:: ============================================
echo [2/4] Verification de Python 3.11...

set PYTHON=

:: Essai 1 : py launcher avec version 3.11
where py >nul 2>&1
if %errorlevel% == 0 (
    py -3.11 --version >nul 2>&1
    if %errorlevel% == 0 (
        set PYTHON=py -3.11
        goto python_found
    )
)

:: Essai 2 : python3.11 direct
where python3.11 >nul 2>&1
if %errorlevel% == 0 (
    set PYTHON=python3.11
    goto python_found
)

:: Essai 3 : python et verifier version 3.11
where python >nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=2 delims= " %%v in ('python --version 2^>^&1') do set PYVER=%%v
    echo %PYVER% | findstr /b "3.11" >nul
    if %errorlevel% == 0 (
        set PYTHON=python
        goto python_found
    )
)

:: Python 3.11 non trouve - tentative installation via winget
echo Python 3.11 non trouve. Tentative d'installation via winget...
where winget >nul 2>&1
if %errorlevel% == 0 (
    winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    if %errorlevel% == 0 (
        echo OK - Python 3.11 installe avec succes
        set PYTHON=py -3.11
        goto python_found
    ) else (
        echo ERREUR : Installation via winget echouee.
    )
) else (
    echo winget non disponible sur ce systeme.
)

:: Echec total
echo.
echo ERREUR : Python 3.11 introuvable et installation impossible.
echo Installez Python 3.11 manuellement :
echo https://www.python.org/downloads/release/python-3110/
echo Cochez "Add Python to PATH" lors de l'installation.
pause
exit /b 1

:python_found
for /f "tokens=2 delims= " %%v in ('%PYTHON% --version 2^>^&1') do echo OK - Python %%v trouve
echo.

:: ============================================
:: 3. Creation et activation du venv
:: ============================================
echo [3/4] Creation de l'environnement virtuel...

if not exist "venv\" (
    %PYTHON% -m venv venv
    if %errorlevel% neq 0 (
        echo ERREUR : Impossible de creer le venv
        pause
        exit /b 1
    )
    echo OK - Environnement virtuel cree
) else (
    echo OK - Environnement virtuel existant trouve
)

call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ERREUR : Impossible d'activer le venv
    pause
    exit /b 1
)
echo OK - Environnement virtuel active
echo.

:: ============================================
:: 4. Installation des dependances
:: ============================================
echo [4/4] Installation des dependances...
pip install -r requirements_windows.txt

if %errorlevel% neq 0 (
    echo ERREUR lors de l'installation des dependances
    pause
    exit /b 1
)
echo OK - Dependances installees
echo.

:: ============================================
:: Lancement
:: ============================================
echo ========================================
echo   Lancement de IFRI_MentorLink...
echo   Ouvrez votre navigateur sur :
echo   http://localhost:9000
echo ========================================
echo.

python backend\api\run_api.py
pause
