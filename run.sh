#!/bin/bash

# ============================================
# IFRI_MentorLink - Script de lancement
# ============================================

echo "========================================"
echo "  IFRI_MentorLink - Lancement"
echo "========================================"
echo ""

# ============================================
# 1. Vérification de la structure du projet
# ============================================
echo "[1/4] Vérification de la structure du projet..."

if [ ! -f "backend/api/run_api.py" ]; then
    echo "❌ ERREUR : backend/api/run_api.py est manquant"
    echo "   Veuillez lancer ce script depuis la racine du projet"
    exit 1
fi

if [ ! -f "requirements_unix.txt" ]; then
    echo "❌ ERREUR : requirements_unix.txt est manquant"
    echo "   Veuillez lancer ce script depuis la racine du projet"
    exit 1
fi

echo "✅ Structure du projet valide"
echo ""

# ============================================
# 2. Vérification de Python 3.11
# ============================================
echo "[2/4] Vérification de Python 3.11..."

PYTHON_CMD=""
PYTHON_VERSION=""

# Vérifier python3.11 en premier
if command -v python3.11 &>/dev/null; then
    PYTHON_VERSION=$(python3.11 --version 2>&1 | grep -oE '[0-9]+\.[0-9]+')
    if [[ "$PYTHON_VERSION" == "3.11"* ]]; then
        PYTHON_CMD="python3.11"
    fi
fi

# Sinon vérifier python3
if [ -z "$PYTHON_CMD" ] && command -v python3 &>/dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | grep -oE '[0-9]+\.[0-9]+')
    if [[ "$PYTHON_VERSION" == "3.11"* ]]; then
        PYTHON_CMD="python3"
    fi
fi

# Python 3.11 non trouvé
if [ -z "$PYTHON_CMD" ]; then
    echo "❌ ERREUR : Python 3.11 est requis mais n'est pas installé"
    echo ""
    echo "   Téléchargez et installez Python 3.11 depuis :"
    echo "   https://www.python.org/downloads/release/python-3110/"
    echo ""
    exit 1
fi

echo "✅ Python trouvé : $($PYTHON_CMD --version)"
echo ""

# ============================================
# 3. Création de l'environnement virtuel
# ============================================
echo "[3/4] Préparation de l'environnement virtuel..."

if [ ! -d "venv" ]; then
    echo "   Création du venv..."
    $PYTHON_CMD -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ ERREUR : Impossible de créer l'environnement virtuel"
        echo "   Vérifiez que venv est disponible (python3-venv sur Debian/Ubuntu)"
        exit 1
    fi
    echo "✅ Environnement virtuel créé"
else
    echo "✅ Environnement virtuel existant"
fi

# Activation du venv
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "❌ ERREUR : Impossible d'activer l'environnement virtuel"
    exit 1
fi
echo "✅ Environnement virtuel activé"
echo ""

# ============================================
# 4. Installation des dépendances
# ============================================
echo "[4/4] Installation des dépendances..."
pip install -r requirements_unix.txt

if [ $? -ne 0 ]; then
    echo "❌ ERREUR : Échec de l'installation des dépendances"
    exit 1
fi
echo "✅ Dépendances installées"
echo ""

# ============================================
# Lancement de l'application
# ============================================
echo "========================================"
echo "  Lancement de IFRI_MentorLink..."
echo "  http://localhost:9000"
echo "========================================"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

python backend/api/run_api.py
