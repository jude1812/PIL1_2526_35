# 🚀 Lancer IFRI_MentorLink

## Prérequis

- **Python 3.11** — Le scrpt vérifiera sa présente, si absent il va s'arrêter, téléchargez-le manuellement : [python.org](https://www.python.org/downloads/release/python-3110/)
- **Git** — uniquement si vous clonez le dépôt (pas nécessaire si vous avez le ZIP)

---

## 📦 Obtenir le projet

**Option 1 — Via ZIP** : téléchargez et dézippez l'archive, puis ouvrez un terminal dans le dossier extrait.

**Option 2 — Via Git** :
```bash
git clone https://github.com/jude1812/PIL1_2526_35.git
cd PIL1_2526_35
```

---

## 🐧 Linux / macOS

```bash
chmod +x run.sh
./run.sh
```

## 🪟 Windows

Double-cliquer sur `run.bat` ou depuis le terminal :
```cmd
run.bat
```

> ⚠️ **Windows bloque l'exécution du script ?**
> Faites un clic droit sur `run.bat` → **Propriétés** → cochez **Débloquer** → OK.
> Ou depuis PowerShell : `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

---

## 🌐 Accéder à l'application

Une fois lancé, ouvrez votre navigateur sur :

**http://localhost:9000**

---

## ⚙️ Ce que font les scripts automatiquement

1. Vérifient que vous êtes bien dans le bon dossier
2. Vérifient que Python 3.11 est installé
3. Créent un environnement virtuel `venv/`
4. Installent les dépendances Python
5. Lancent le serveur

---

## 🔧 Lancement manuel

**Linux / macOS**
```bash
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements_unix.txt
python backend/api/run_api.py
```

**Windows**
```cmd
py -3.11 -m venv venv
venv\Scripts\activate
pip install -r requirements_windows.txt
python backend\api\run_api.py
```

---

## ❓ Problèmes fréquents

**Python 3.11 introuvable sur Windows**
Installez Python 3.11 depuis [python.org](https://www.python.org/downloads/release/python-3110/) en cochant **"Add Python to PATH"**, puis relancez `run.bat`.

**Permission refusée sur Linux/macOS**
```bash
chmod +x run.sh
```
