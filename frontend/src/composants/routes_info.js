import "./routes_info.css";
import { Link } from "react-router-dom";

function RoutesInfo() {
    const routes = [
        {
            path: "/login",
            icon: "🔐",
            title: "Connexion / Inscription",
            description: "Créez votre compte ou connectez-vous pour accéder à la plateforme.",
            features: [
                "Connexion avec email ou téléphone",
                "Inscription avec nom, prénom, email, téléphone, mot de passe et phrase secrète",
                "Récupération de compte par question secrète"
            ]
        },
        {
            path: "/me",
            icon: "👤",
            title: "Mon profil",
            description: "Consultez et modifiez vos informations personnelles.",
            features: [
                "Photo de profil",
                "Compétences (fortes/faibles)",
                "Disponibilités horaires",
                "Modification en ligne (email, téléphone, nom, prénom, bio, filière, niveau)"
            ]
        },
        {
            path: "/mes_offres",
            icon: "📊",
            title: "Dashboard Offres & Matchings",
            description: "Vue d'ensemble de vos offres, demandes, réponses et matchings.",
            features: [
                "Liste des matchings avec score de compatibilité",
                "Filtrage par score minimum",
                "Vos offres et demandes (création, modification, suppression)",
                "Réponses reçues et envoyées"
            ]
        },
        {
            path: "/offres",
            icon: "📋",
            title: "Toutes les offres",
            description: "Parcourez toutes les offres et demandes de mentorat.",
            features: [
                "Recherche par compétence",
                "Filtrage par type (offre/demande), format, statut",
                "Création d'offre/demande",
                "Réponse aux offres"
            ]
        },
        {
            path: "/search_user",
            icon: "🔍",
            title: "Rechercher un utilisateur",
            description: "Trouvez d'autres utilisateurs et calculez votre score de matching.",
            features: [
                "Recherche par email ou téléphone",
                "Affichage du profil",
                "Calcul automatique du score de compatibilité (40% compétences, 20% filière, 10% niveau, 30% disponibilités)",
                "Bouton pour contacter"
            ]
        },
        {
            path: "/messages",
            icon: "💬",
            title: "Messages",
            description: "Discutez en temps réel avec les autres utilisateurs.",
            features: [
                "Chat en temps réel (WebSocket)",
                "Liste des conversations",
                "Envoi de messages textes",
                "Partage de fichiers",
                "Notifications de nouveaux messages"
            ]
        },
        {
            path: "/reset",
            icon: "🔄",
            title: "Réinitialisation",
            description: "Récupérez l'accès à votre compte.",
            features: [
                "Réinitialisation du mot de passe (via phrase secrète)",
                "Modification de la phrase secrète (via mot de passe)",
                "Modification de la question secrète"
            ]
        }
    ];

    return (
        <div className="routes-info-container">
            <div className="routes-info-header">
                <h1>📖 Guide de l'application</h1>
                <p>Bienvenue sur IFRI_MentorLink - Votre plateforme de mentorat</p>
            </div>

            <div className="routes-info-grid">
                {routes.map((route, idx) => (
                    <div key={idx} className="route-card">
                        <div className="route-card-header">
                            <div className="route-icon">{route.icon}</div>
                            <h3>{route.title}</h3>
                            <Link to={route.path} className="route-link">
                                Accéder →
                            </Link>
                        </div>
                        <div className="route-card-body">
                            <p>{route.description}</p>
                            <div className="route-features">
                                <strong>✨ Fonctionnalités :</strong>
                                <ul>
                                    {route.features.map((feature, i) => (
                                        <li key={i}>{feature}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="routes-info-footer">
                <div className="score-badge">
                    <strong>🎯 Score de matching :</strong>
                    <div>40% Compétences • 20% Filière • 10% Niveau • 30% Disponibilités</div>
                </div>
                <div className="tech-badge">
                    <strong>⚙️ Technologies :</strong>
                    <div>React • FastAPI • SQLModel • WebSocket • JWT • Glassmorphism</div>
                </div>
            </div>
        </div>
    );
}

export default RoutesInfo;