# IFRI_MentorLink

Plateforme de mentorat académique et professionnel entre étudiants de l'IFRI (Institut de Formation et de Recherche en Informatique), Université d'Abomey-Calavi.

Les étudiants peuvent créer un profil, publier des offres ou demandes de mentorat, échanger via messagerie instantanée, et découvrir leurs meilleurs matchs grâce à un algorithme de compatibilité.

---

## Fonctionnalités

- Inscription, connexion, gestion de profil (compétences, disponibilités, photo)
- Offres et demandes de mentorat avec filtres
- Algorithme de matching (compétences, filière, niveau, disponibilités)
- Messagerie instantanée avec WebSocket et partage de fichiers
- Thème clair / sombre

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | FastAPI + SQLModel |
| Base de données | SQLite (ou PostgreSQL, par défaut SQLite pour raisons de simplicité) via SQLModel(intégré, aucune config requise) |
| Frontend | React (servi par FastAPI) |
| Temps réel | WebSockets |
| Auth | JWT + bcrypt |

---

## Lancer le projet

**Prérequis : Python 3.11**
Téléchargement : https://www.python.org/downloads/release/python-3110/

**Linux / macOS**
```bash
chmod +x run.sh
./run.sh
```

**Windows**
```cmd
run.bat
```

Puis ouvrir : **http://localhost:9000**

Les scripts créent automatiquement l'environnement virtuel et installent les dépendances.
Pour plus de détails, voir [INSTRUCTIONS.md](./INSTRUCTIONS.md).

---

## Structure du projet

```
├── backend/
│   ├── api/          # Routes FastAPI, WebSocket, config
│   ├── core/         # DBManager, WSManager, modèles SQLModel
│   └── utils/        # JWT, bcrypt, rate limiting
├── frontend/
│   ├── src/          # Code source React
│   └── build/        # Build production (servi par FastAPI)
├── livraux/
    ├── structure.sql  # La structure de la base de donnée
    ├── appercu_db_test.sql  # Apperçu de la base de donnée avec des utilisateurs
    ├── rapport.html  # Le rapport final
├── requirements_unix.txt
├── requirements_windows.txt
├── run.sh
├── run.bat
└── INSTRUCTIONS.md
└── README.md
```

---

## Équipe

Projet intégrateur PIL1 — IFRI 2025-2026

| Nom | Filière |
|-----|---------|
| HOUNSOU Samuel | SI |
| LOKONON Yaniss | GL |
| KOUKOU Félicité Reine | GL |
| GBAGUIDI Jude Hyppocrate | SEIOT |
| DJOMAMOU Hosana Loth | IA |
| ASHANTI Zinedine| SI |
| LOKONON Emerick | IM |
