import "./search_user.css"
import { useState } from "react";
import { searchUser, computeMatching, DEFAULT_AVATAR, BACKEND_PROFILE_IMGS_URL } from "./hooks/fetch_functions";
import CandidatModal from "./candidat_modal";

const SearchUser = () => {
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [user, setUser] = useState(null);
    const [score, setScore] = useState(null);
    const [scoreDetails, setScoreDetails] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [calculatingScore, setCalculatingScore] = useState(false);
    const [hideSelf, setHideSelf] = useState(true);

    
    const handleSearch = async () => {
        if (!email && !phone) {
            setError("Email ou téléphone requis");
            return;
        }

        setLoading(true);
        setError("");
        setUser(null);
        setScore(null);
        setScoreDetails(null);

        try {
            const token = sessionStorage.getItem("token");
            const salt = sessionStorage.getItem("salt");
            const currentEmail = sessionStorage.getItem("user_email");
            const currentPhone = sessionStorage.getItem("user_phone");

            if (!token || !salt) {
                setError("Vous devez être connecté");
                return;
            }

            const response = await searchUser({
                email: email,
                phone: phone,
                token: token,
                key: salt
            });

            if (!response.ok) {
                setError(response.response?.detail || "Utilisateur non trouvé");
                return;
            }

            const userData = response.response.user;
            if (!userData || Object.keys(userData).length === 0) {
                setError("Utilisateur non trouvé");
                return;
            }

            // Vérifier si c'est l'utilisateur lui-même
            const isSelf = (currentEmail && userData.email === currentEmail) || 
                          (currentPhone && userData.phone === currentPhone);

            if (hideSelf && isSelf) {
                setError("ℹ️ C'est vous-même ! Vous ne pouvez pas vous rechercher.");
                setLoading(false);
                return;
            }

            setUser(userData);

            // Calculer le score de matching
            setCalculatingScore(true);
            try {
                const scoreResponse = await computeMatching({
                    user_email: currentEmail,
                    user_phone: currentPhone,
                    candidat_email: userData.email,
                    candidat_phone: userData.phone,
                    token: token,
                    key: salt
                });
                console.log({
                    user_email: currentEmail,
                    user_phone: currentPhone,
                    candidat_email: userData.email,
                    candidat_phone: userData.phone,
                    token: token,
                    key: salt
                });
                

                if (scoreResponse.ok && scoreResponse.response?.success) {
                    const matching = scoreResponse.response.matching;
                    setScore(matching[0]);
                    setScoreDetails(matching[1]);
                }
            } catch (err) {
                console.log("Erreur calcul score:", err);
            } finally {
                setCalculatingScore(false);
            }

        } catch (err) {
            setError("Erreur lors de la recherche");
        } finally {
            setLoading(false);
        }
    };

    const handleViewProfile = () => {
        setShowModal(true);
    };

    return (
        <div className="search-container">
            <div className="search-card">
                <h2 className="search-title">🔍 Rechercher un utilisateur</h2>
                
                <div className="search-form">
                    <div className="input-group">
                        <label>📧 Email</label>
                        <input 
                            type="email" 
                            placeholder="exemple@email.com" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    
                    <div className="input-group">
                        <label>📱 Téléphone</label>
                        <input 
                            type="tel" 
                            placeholder="0612345678" 
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    
                    <div className="search-options">
                        <label className="checkbox-label">
                            <input 
                                type="checkbox" 
                                checked={hideSelf} 
                                onChange={(e) => setHideSelf(e.target.checked)}
                            />
                            🚫 Ignorer mon propre profil
                        </label>
                    </div>
                    
                    <button onClick={handleSearch} disabled={loading} className="search-btn">
                        {loading ? "Recherche..." : "🔍"}
                    </button>
                </div>

                {error && <div className="search-error">❌ {error}</div>}
            </div>

            {/* Résultats affichés en dehors de la carte formulaire */}
            {user && (
                <div className="search-result-card">
                    <div className="result-header">
                        <img 
                            src={user?.img_path == null ? DEFAULT_AVATAR : `${BACKEND_PROFILE_IMGS_URL}/${user.img_path}`} 
                            alt="Avatar" 
                            className="result-avatar"
                        />
                        <div className="result-info">
                            <h3>{user.prenom} {user.nom}</h3>
                            <p className="result-meta">{user.filiere || "N/A"} • {user.level || "N/A"}</p>
                            <p className="result-contact">{user.email} | {user.phone}</p>
                        </div>
                    </div>

                    {calculatingScore && (
                        <div className="score-loading">
                            <div className="spinner-small"></div>
                            Calcul du score de matching...
                        </div>
                    )}

                    {score !== null && !calculatingScore && (
                        <div className={`score-display ${score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low'}`}>
                            <div className="score-value">{score} sur 100</div>
                            <div className="score-label">Compatibilité</div>
                            <div className="score-bar">
                                <div className="score-bar-fill" style={{ width: `${score}%` }}></div>
                            </div>
                        </div>
                    )}

                    {scoreDetails && (
                        <div className="score-details">
                            <strong>📊 Détails du matching :</strong>
                            {scoreDetails.competences && <div className="detail-item">📚 {scoreDetails.competences}</div>}
                            {scoreDetails.filiere && <div className="detail-item">🎓 {scoreDetails.filiere}</div>}
                            {scoreDetails.niveau && <div className="detail-item">📖 {scoreDetails.niveau}</div>}
                            {scoreDetails.dispos && scoreDetails.dispos.map((d, i) => <div key={i} className="detail-item">📅 {d}</div>)}
                        </div>
                    )}

                    <div className="result-actions">
                        <button onClick={handleViewProfile} className="btn-profile">
                            👤 Voir le profil complet
                        </button>
                    </div>
                </div>
            )}

            {showModal && user && (
                <CandidatModal 
                    candidat={user} 
                    onClose={() => setShowModal(false)} 
                />
            )}
        </div>
    );
};

export default SearchUser;