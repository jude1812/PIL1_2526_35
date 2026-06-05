#!/bin/bash

# ============================================
# IFRI_MentorLink - Lancement du backend
# ============================================

echo "========================================"
echo "  IFRI_MentorLink - Lancement du backend"
echo "========================================"
echo ""

echo "[1/2] Installation des dépendances..."
pip install -r ./requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'installation des dépendances"
    exit 1
fi

echo "✅ Dépendances installées avec succès"
echo ""

echo "[2/2] Lancement de l'application..."
echo ""

if command -v python3 &>/dev/null; then
    python3 ./backend/api/run_api.py
elif command -v python &>/dev/null; then
    python ./backend/api/run_api.py
else
    echo "❌ Python n'est pas installé"
    exit 1
fi
