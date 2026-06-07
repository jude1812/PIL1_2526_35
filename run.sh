#!/bin/bash

# ============================================
# IFRI_MentorLink - Lancement du backend
# ============================================

echo "========================================"
echo "  IFRI_MentorLink - Lancement du backend"
echo "========================================"
echo ""

# ============================================
# 1. Vérification de la structure du projet
# ============================================
echo "[1/4] Vérification de la structure du projet..."

REQUIRED=("backend/api/run_api.py" "backend/api/main_api.py" "requirements_unix.txt")
for item in "${REQUIRED[@]}"; do
    if [ ! -e "$item" ]; then
        echo "❌ Fichier/dossier manquant : $item"
        echo "   Assurez-vous de lancer ce script depuis la racine du projet."
        exit 1
    fi
done
echo "✅ Structure du projet OK"
echo ""

# ============================================
# 2. Vérification de Python 3.11
# ============================================
echo "[2/4] Vérification de Python 3.11..."

PYTHON=""
for cmd in python3.11 python3 python; do
    if command -v $cmd &>/dev/null; then
        VERSION=$($cmd --version 2>&1 | grep -oP '\d+\.\d+')
        MAJOR=$(echo $VERSION | cut -d. -f1)
        MINOR=$(echo $VERSION | cut -d. -f2)
        if [ "$MAJOR" -eq 3 ] && [ "$MINOR" -eq 11 ]; then
            PYTHON=$cmd
            break
        fi
    fi
done

if [ -z "$PYTHON" ]; then
    echo "❌ Python 3.11 non trouvé."
    echo "   Installation en cours..."

    if command -v apt &>/dev/null; then
        sudo apt update && sudo apt install -y python3.11 python3.11-venv python3.11-dev
    elif command -v brew &>/dev/null; then
        brew install python@3.11
    else
        echo "❌ Impossible d'installer Python automatiquement."
        echo "   Installez Python 3.11 manuellement : https://www.python.org/downloads/"
        exit 1
    fi

    PYTHON=python3.11
fi

echo "✅ Python trouvé : $($PYTHON --version)"
echo ""

# ============================================
# 3. Création et activation du venv
# ============================================
echo "[3/4] Création de l'environnement virtuel..."

if [ ! -d "venv" ]; then
    $PYTHON -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ Erreur lors de la création du venv"
        exit 1
    fi
    echo "✅ Environnement virtuel créé"
else
    echo "✅ Environnement virtuel existant trouvé"
fi

source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'activation du venv"
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
    echo "❌ Erreur lors de l'installation des dépendances"
    exit 1
fi
echo "✅ Dépendances installées"
echo ""

# ============================================
# Lancement
# ============================================
echo "========================================"
echo "  Lancement de IFRI_MentorLink..."
echo "  http://localhost:9000"
echo "========================================"
echo ""

python backend/api/run_api.py
