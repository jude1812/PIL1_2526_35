@echo off
title IFRI_MentorLink
chcp 65001 >nul

echo ========================================
echo   IFRI_MentorLink - Lancement
echo ========================================
echo.

:: ============================================
:: 1. Verification de la structure du projet
:: ============================================
echo [1/4] Verification de la structure du projet...

if not exist "backend\api\run_api.py" (
    echo [ERREUR] backend\api\run_api.py est manquant
    echo Veuillez lancer ce script depuis la racine du projet
    pause
    exit /b 1
)

if not exist "requirements_windows.txt" (
    echo [ERREUR] requirements_windows.txt est manquant
    echo Veuillez lancer ce script depuis la racine du projet
    pause
    exit /b 1
)

echo [OK] Structure du projet valide
echo.

:: ============================================
:: 2. Verification de Python 3.11
:: ============================================
echo [2/4] Verification de Python 3.11...

set PYTHON_CMD=
set FOUND=0

:: Essai 1 : py -3.11
where py >nul 2>&1
if %errorlevel% == 0 (
    py -3.11 --version >nul 2>&1
    if %errorlevel% == 0 (
        set PYTHON_CMD=py -3.11
        set FOUND=1
        goto python_found
    )
)

:: Essai 2 : python3.11
where python3.11 >nul 2>&1
if %errorlevel% == 0 (
    set PYTHON_CMD=python3.11
    set FOUND=1
    goto python_found
)

:: Essai 3 : python avec verification de version
where python >nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=2" %%v in ('python --version 2^>^&1') do set PYVER=%%v
    echo %PYVER% | findstr /b "3.11" >nul
    if %errorlevel% == 0 (
        set PYTHON_CMD=python
        set FOUND=1
        goto python_found
    )
)

:: Essai 4 : py avec verification de version
where py >nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=2" %%v in ('py --version 2^>^&1') do set PYVER=%%v
    echo %PYVER% | findstr /b "3.11" >nul
    if %errorlevel% == 0 (
        set PYTHON_CMD=py
        set FOUND=1
        goto python_found
    )
)

:python_not_found
echo [ERREUR] Python 3.11 est requis mais n'est pas installe
echo.
echo Telechargez et installez Python 3.11 depuis :
echo https://www.python.org/downloads/release/python-3110/
echo.
echo IMPORTANT : Cochez "Add Python to PATH" lors de l'installation
echo.
pause
exit /b 1

:python_found
:: Afficher la version trouvee
for /f "tokens=2" %%v in ('%PYTHON_CMD% --version 2^>^&1') do echo [OK] Python %%v trouve
echo.

:: ============================================
:: 3. Creation de l'environnement virtuel
:: ============================================
echo [3/4] Preparation de l'environnement virtuel...

if not exist "venv\" (
    echo Creation du venv...
    %PYTHON_CMD% -m venv venv
    if %errorlevel% neq 0 (
        echo.
        echo [ERREUR] Impossible de creer l'environnement virtuel
        echo.
        echo Ajoutez Python au PATH :
        echo Panneau de configuration ^> Variables d'environnement
        echo Ajoutez : C:\Python311 et C:\Python311\Scripts
        echo.
        pause
        exit /b 1
    )
    echo [OK] Environnement virtuel cree
) else (
    echo [OK] Environnement virtuel existant
)

:: Activation du venv
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [ERREUR] Impossible d'activer l'environnement virtuel
    pause
    exit /b 1
)
echo [OK] Environnement virtuel active
echo.

:: ============================================
:: 4. Installation des dependances
:: ============================================
echo [4/4] Installation des dependances...
pip install -r requirements_windows.txt

if %errorlevel% neq 0 (
    echo [ERREUR] Echec de l'installation des dependances
    pause
    exit /b 1
)
echo [OK] Dependances installees
echo.

:: ============================================
:: Lancement de l'application
:: ============================================
echo ========================================
echo   Lancement de IFRI_MentorLink...
echo   http://localhost:9000
echo ========================================
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.

python backend\api\run_api.py

:: Pause uniquement si le script se termine anormalement
if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] Le serveur s'est arrete de facon inattendue
    pause
)
