import "./offres.css"
import { useState, useEffect, useRef } from "react";
import { addOffre, refreshToken as _refreshToken, getAllOffres, deleteOffre } from "./hooks/fetch_functions";
import { MAPPER } from "./hooks/detail_mapper";
import { useNavigate } from "react-router-dom";
import { LOGIN } from "./hooks/nav_path";
import { passwordPrompt } from "./password_prompt";
import OfferResponseModal from "./offre_reponse_modal";

const refreshToken = async (user_session_id, token, salt, navigate) => {
    let response = await _refreshToken({
        "user_session_id": user_session_id.current,
        "key": salt.current,
        "token": token.current
    });
    
    if ((!response.ok) || response.error){
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user_session_id");
        if (navigate) navigate(LOGIN);
        return false;
    }
    const json = response.response;
    token.current = json.token;
    sessionStorage.setItem("token", json.token);
    return true;
}

const loadOffers = async (navigate, setOffers, setLoading, token, salt, user_session_id) => {
    try {
        setLoading(true);
        let response = await getAllOffres();
        let json = response.response;
        
        if ((!response.ok) || response.error){
            if (json?.detail == "TOKEN_EXPIRED"){
                const refreshed = await refreshToken(user_session_id, token, salt, navigate);
                if (refreshed) return await loadOffers(navigate, setOffers, setLoading, token, salt, user_session_id);
                else throw new Error("TOKEN_EXPIRED");
            }
            throw new Error(MAPPER[json.detail] || "Erreur chargement offres");
        }
        
        setOffers(json.offres || []);
        return json;
    } catch (err) {
        console.log("❌ Erreur loadOffers:", err.message);
        return null;
    } finally {
        setLoading(false);
    }
};

function Offers() {
    const user_session_id = useRef(null);
    const token = useRef(null);
    const salt = useRef(null);
    const currentUserEmail = sessionStorage.getItem("user_email");
    const currentUserPhone = sessionStorage.getItem("user_phone");
    const [loading, setLoading] = useState(true);
    const [offers, setOffers] = useState([]);
    const navigate = useNavigate();

    // Filtres
    const [searchCompetence, setSearchCompetence] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterFormat, setFilterFormat] = useState("all");
    const [filterStatut, setFilterStatut] = useState("all");
    const [includeMyOffers, setIncludeMyOffers] = useState(true);

    // Formulaire création offre
    const [showForm, setShowForm] = useState(false);
    const [newOffre, setNewOffre] = useState({
        competence: "",
        description: "",
        type: "offre",
        format: "en_ligne"
    });
    const [submitting, setSubmitting] = useState(false);

    // Modal réponse
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState(null);

    const setData = () => {
        user_session_id.current = sessionStorage.getItem("user_session_id");
        token.current = sessionStorage.getItem("token");
        salt.current = sessionStorage.getItem("salt");
        return user_session_id.current !== null && token.current !== null && salt.current !== null;
    };

    useEffect(() => {
        if (!setData()) {
            navigate(LOGIN);
            return;
        }
        loadOffers(navigate, setOffers, setLoading, token, salt, user_session_id);
    }, []);

    // Filtrer les offres
    const filteredOffers = offers.filter(offer => {
        const matchCompetence = !searchCompetence || offer.competence.toLowerCase().includes(searchCompetence.toLowerCase());
        const matchType = filterType === "all" || offer.type === filterType;
        const matchFormat = filterFormat === "all" || offer.format === filterFormat;
        const matchStatut = filterStatut === "all" || offer.statut === filterStatut;
        const matchMyOffers = includeMyOffers || offer.user?.email !== currentUserEmail || offer?.user?.phone !== currentUserPhone;
        return matchCompetence && matchType && matchFormat && matchStatut && matchMyOffers;
    });

    const handleDeleteOffer = async (offer) => {
        const password = await passwordPrompt("Votre mot de passe pour supprimer cette offre");
        setSearchCompetence("");
        if (!password) return;

        try {
            const response = await deleteOffre({
                email: sessionStorage.getItem("user_email"),
                phone: sessionStorage.getItem("user_phone"),
                token: token.current,
                key: salt.current,
                password: password,
                competence: offer.competence,
                type: offer.type,
                format: offer.format
            });
            console.log({
                email: sessionStorage.getItem("user_email"),
                phone: sessionStorage.getItem("user_phone"),
                token: token.current,
                key: salt.current,
                password: password,
                competence: offer.competence,
                type: offer.type,
                format: offer.format
            })
            console.log(response);
            if (response.ok && response.response?.success) {
                alert("✅ Offre supprimée avec succès !");
                loadOffers(navigate, setOffers, setLoading, token, salt, user_session_id);
            } else {
                alert("❌ " + (response.response?.reason || "Erreur lors de la suppression"));
            }
        } catch (err) {
            alert("Une erreur est survenue");
        }
    };
   
    const handleCreateOffre = async () => {
        if (!newOffre.competence.trim()) {
            alert("❌ La compétence est requise");
            return;
        }

        const password = await passwordPrompt("Votre mot de passe pour créer cette offre");
        setSearchCompetence("");
        if (!password) return;

        setSubmitting(true);
        try {
            const response = await addOffre({
                email: sessionStorage.getItem("user_email"),
                phone: sessionStorage.getItem("user_phone"),
                token: token.current,
                key: salt.current,
                password: password,
                competence: newOffre.competence,
                description: newOffre.description || null,
                type: newOffre.type,
                format: newOffre.format,
                statut: "active"
            });

            if (response.ok && response.response?.success) {
                alert("✅ Offre créée avec succès !");
                setNewOffre({ competence: "", description: "", type: "offre", format: "en_ligne" });
                setShowForm(false);
                loadOffers(navigate, setOffers, setLoading, token, salt, user_session_id);
            } else {
                alert("❌ " + (response.response?.detail || "Erreur lors de la création"));
            }
        } catch (err) {
            console.log(err);
            alert("Une erreur est survenue");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRespond = (offer) => {
        setSelectedOffer(offer);
        setSearchCompetence("");
        setShowResponseModal(true);
    };

    const handleResponseSuccess = () => {
        loadOffers(navigate, setOffers, setLoading, token, salt, user_session_id);
    };

    if (loading) {
        return <div className="offers-loading">⏳ Chargement des offres...</div>;
    }

    return (
        <div className="offers-container">
            <div className="offers-header">
                <h1 className="offers-title">📋 Toutes les offres</h1>
                <button className="offers-add-btn" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "❌ Annuler" : "+ Créer une offre/demande"}
                </button>
            </div>

            {/* Formulaire de création */}
            {showForm && (
                <div className="offers-form-card">
                    <h3>📝 Nouvelle offre / demande</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>📚 Compétence *</label>
                            <input
                                type="text"
                                placeholder="Ex: Python, SQL, React..."
                                value={newOffre.competence}
                                onChange={(e) => setNewOffre({...newOffre, competence: e.target.value})}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>🎯 Type</label>
                            <select
                                value={newOffre.type}
                                onChange={(e) => setNewOffre({...newOffre, type: e.target.value})}
                                className="form-select"
                            >
                                <option value="offre">🎓 Offre (je propose du mentorat)</option>
                                <option value="demande">🙏 Demande (je cherche du mentorat)</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>🏠 Format</label>
                            <select
                                value={newOffre.format}
                                onChange={(e) => setNewOffre({...newOffre, format: e.target.value})}
                                className="form-select"
                            >
                                <option value="en_ligne">💻 En ligne</option>
                                <option value="presentiel">🏠 Présentiel</option>
                                <option value="les_deux">🌍 Les deux</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>📝 Description (optionnelle)</label>
                        <textarea
                            placeholder="Décrivez votre offre ou demande..."
                            value={newOffre.description}
                            onChange={(e) => setNewOffre({...newOffre, description: e.target.value})}
                            className="form-textarea"
                            rows={3}
                        />
                    </div>
                    <button 
                        onClick={handleCreateOffre} 
                        disabled={submitting} 
                        className="form-submit-btn"
                    >
                        {submitting ? "Création..." : "✅ Publier"}
                    </button>
                </div>
            )}

            {/* Filtres + Liste des offres */}
            <div className="offers-content">
                <div className="offers-filters">
                    <h3>🔍 Filtres</h3>
                    <div className="filter-group">
                        <label>🔎 Compétence</label>
                        <input
                            type="text"
                            placeholder="Python, SQL, React..."
                            value={searchCompetence}
                            onChange={(e) => setSearchCompetence(e.target.value)}
                            className="filter-input"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            data-lpignore="true"
                            data-form-type="other"
                            name="search-competence-random-123"
                            id="search-competence-random-123"
                        />
                    </div>
                    <div className="filter-group">
                        <label>🎯 Type</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">Tous</option>
                            <option value="offre">Offres</option>
                            <option value="demande">Demandes</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>🏠 Format</label>
                        <select
                            value={filterFormat}
                            onChange={(e) => setFilterFormat(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">Tous</option>
                            <option value="presentiel">Présentiel</option>
                            <option value="en_ligne">En ligne</option>
                            <option value="les_deux">Les deux</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>📌 Statut</label>
                        <select
                            value={filterStatut}
                            onChange={(e) => setFilterStatut(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">Tous</option>
                            <option value="active">Actives</option>
                            <option value="clotured">Clôturées</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>👤 Mes offres</label>
                        <select
                            value={includeMyOffers}
                            onChange={(e) => setIncludeMyOffers(e.target.value === "true")}
                            className="filter-select"
                        >
                            <option value="true">✅ Inclure mes offres</option>
                            <option value="false">🚫 Exclure mes offres</option>
                        </select>
                    </div>
                    <div className="filter-results">
                        {filteredOffers.length} offre(s) trouvée(s)
                    </div>
                </div>

                <div className="offers-list">
                    {filteredOffers.length === 0 && (
                        <div className="offers-empty">
                            <p>Aucune offre ne correspond à vos critères</p>
                        </div>
                    )}
                    {filteredOffers.map((offer, idx) => (
                        <div key={idx} className="offer-item">
                            <div className="offer-item-header">
                                <div className="offer-badges">
                                    <span className={`badge-type ${offer.type}`}>
                                        {offer.type === "offre" ? "🎓 Offre" : "🙏 Demande"}
                                    </span>
                                    <span className={`badge-status ${offer.statut}`}>
                                        {offer.statut === "active" ? "🟢 Active" : "🔴 Clôturée"}
                                    </span>
                                    <span className="badge-format">{offer.format === "presentiel" ? "🏠 Présentiel" : offer.format === "en_ligne" ? "💻 En ligne" : "🌍 Les deux"}</span>
                                    {offer.responses && offer.responses.length > 0 && (
                                    <span className="offer-responses-badge">
                                        📨 {offer.responses.length} réponse(s)
                                    </span>
                                )}
                                </div>
                                <div className="offer-user">
                                    <span className="user-name">{offer.user?.prenom} {offer.user?.nom}</span>
                                    <span className="user-filiere">{offer.user?.filiere || "N/A"} • {offer.user?.level || "N/A"}</span>
                                </div>
                            </div>
                            <div className="offer-item-competence">
                                <strong>{offer.competence}</strong>
                            </div>
                            {offer.description && (
                                <div className="offer-item-description">
                                    {offer.description}
                                </div>
                            )}
                            <div className="offer-item-footer">
                                {(offer.user?.email === currentUserEmail || offer.user?.phone === currentUserPhone) ? (
                                    <button className="offer-delete-btn" onClick={() => handleDeleteOffer(offer)}>
                                        🗑️ Supprimer mon offre
                                    </button>
                                ) : (
                                    <button className="offer-respond-btn" onClick={() => handleRespond(offer)}>
                                        📝 Répondre à cette offre
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal de réponse */}
            {showResponseModal && selectedOffer && (
                <OfferResponseModal
                    offer={selectedOffer}
                    onClose={() => {
                        setShowResponseModal(false);
                        setSelectedOffer(null);
                        setSearchCompetence("");
                    }}
                    onSuccess={handleResponseSuccess}
                />
            )}
        </div>
    );
}

export default Offers;