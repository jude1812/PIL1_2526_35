import { Link } from "react-router-dom";
import "./not_found.css";

function NotFound() {
    return (
        <div className="notfound-container">
            <div className="notfound-content">
                <div className="error-code">
                    <span className="digit">4</span>
                    <span className="digit">0</span>
                    <span className="digit">4</span>
                </div>

                <h1 className="error-title">Page introuvable</h1>
                <p className="error-message">
                    Oups ! La page que vous cherchez n'existe pas ou a été déplacée.
                </p>

                <div className="action-buttons">
                    <Link to="/" className="btn-primary-404">
                        🏠 Retour à l'accueil
                    </Link>
                    <button onClick={() => window.history.back()} className="btn-secondary-404">
                        ← Page précédente
                    </button>
                </div>

                <div className="suggestions-section">
                    <h3 className="suggestions-title">Vous pourriez aussi aimer :</h3>
                    <div className="suggestions-grid">
                        <Link to="/me" className="suggestion-card">👤 Mon profil</Link>
                        <Link to="/offres" className="suggestion-card">📋 Toutes les offres</Link>
                        <Link to="/messages" className="suggestion-card">💬 Messages</Link>
                        <Link to="/search_user" className="suggestion-card">🔍 Rechercher</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NotFound;