import "./profile_offres.css"
import { useState, useEffect, useRef } from "react";
import { getMe, refreshToken as _refreshToken, DEFAULT_AVATAR, BACKEND_PROFILE_IMGS_URL } from "./hooks/fetch_functions";
import { deleteOffre, deleteResponse } from "./hooks/fetch_functions";
import { MAPPER } from "./hooks/detail_mapper";
import { useNavigate } from "react-router-dom";
import { LOGIN } from "./hooks/nav_path";
import { passwordPrompt } from "./password_prompt";
import CandidatModal from "./candidat_modal";
import AnswerResponsesModal from "./answer_to_response";


const refreshToken = async (user_session_id, token, salt, navigate) => {
    console.log("🔄 Refresh token enclenché !");
    let response = await _refreshToken(
        {
            "user_session_id": user_session_id.current,
            "key": salt.current,
            "token": token.current
        }
    );
    
    if ((!response.ok) || response.error){
        console.log("❌ Erreur dans refresh_token : ", response.error);
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user_session_id");
        if (navigate) navigate(LOGIN);
        return false;
    }
    const json = response.response;
    token.current = json.token;
    sessionStorage.setItem("token", json.token);
    console.log("✅ Token rafraîchi avec succès");
    return true;
}

const loadOffreData = async (
    navigate, setUser, setOffres, setDemandes, 
    setResponses, setMatchings, setLoading,
    user_email, user_phone, salt,
    token, user_session_id
) => {
    try{
        setLoading(true);
        let data = {
            "phone": user_phone.current,
            "email": user_email.current,
            "key": salt.current,
            "token": token.current
        }
        let response = await getMe(data);
        let json = response.response;
        if ((!response.ok) || response.error){
            if (json?.detail == "TOKEN_EXPIRED"){
                const refreshed = await refreshToken(user_session_id, token, salt, navigate);
                if (refreshed) return await loadOffreData(
                    navigate, setUser, setOffres, setDemandes,
                    setResponses, setMatchings, setLoading,
                    user_email, user_phone, salt, token, user_session_id
                );
                else throw new Error("TOKEN_EXPIRED");
            }
            throw new Error(`Erreur ${MAPPER[json.detail]}`);
        }

        setUser(json.user_data);
        setOffres(json.offres || []);
        setDemandes(json.demandes || []);
        setResponses(json.responses || []);
        setMatchings(json.matchings || []);
        return json;
    }
    catch (err){
        console.log("❌ Erreur dans loadOffreData : ", err.message);
        return null;   
    }
    finally {
        setLoading(false);
    }
}

// Composant utilisateur
const OffreUserHeader = ({ user }) => {
    const profil_img = user?.img_path == null ? DEFAULT_AVATAR : `${BACKEND_PROFILE_IMGS_URL}/${user.img_path}`;
    const nom = user?.nom;
    const prenom = user?.prenom;

    return (
        <div className="offre-user-header">
            <img src={profil_img} alt="Profil" className="offre-user-avatar"/>
            <div className="offre-user-name">
                <span>{prenom} {nom}</span>
                {user?.level && user?.filiere && (
                    <div id="offre-user-etudiant">
                        📚 {user.filiere} • {user.level}
                    </div>
                )}
            </div>
        </div>
    );
}

const MatchingComponent = ({ showMatchings, setShowMatchings, matchings, scoreMin, setScoreMin, onViewProfile }) => {
    let filteredMatchings = [...matchings];
    filteredMatchings = filteredMatchings.filter(
            (value) => (value[1] >= scoreMin)
    )
    
    return (
        <div className="matching-component">
            <div className="matching-header">
                <button className="toggle-btn matching-toggle" onClick={() => setShowMatchings(!showMatchings)}>
                    {showMatchings ? "🙈 Masquer" : "👁️ Afficher"}
                </button>
            </div>
            {showMatchings && (
                <div className="matching-content">
                    <div className="filter-score matching-filter">
                        <label className="filter-label">Score minimum : {scoreMin}</label>
                        <input
                            className="score-slider"
                            type="range"
                            min="0"
                            max="100"
                            value={scoreMin}
                            onChange={(e) => setScoreMin(parseInt(e.target.value))}
                        />
                    </div>

                    <div className="matchings-list">
                        {filteredMatchings.length === 0 && (
                            <p className="empty-message">Aucun matching trouvé</p>
                        )}
                        {filteredMatchings.map(([candidat, score, reasons], idx) => (
                            <div key={idx} className="matching-card">
                                <div className={`matching-score ${score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low'}`}>
                                    {score}
                                </div>
                                <div className="matching-user-info">
                                    <strong className="user-name">{candidat.prenom} {candidat.nom}</strong>
                                    <span className="user-meta">{candidat?.filiere || "absent"} | {candidat?.level || "absent"}</span>
                                </div>
                                <div className="matching-reasons">
                                    {Object.entries(reasons).map(([key, reasons], idx) => (
                                        <div key={idx} className="reason-item">{reasons || ""}</div>
                                    ))}
                                </div>
                                <div className="matching-actions">
                                    <button className="btn-view-profile" onClick={() => onViewProfile(candidat)}>
                                        👤 Voir le profil
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

const OfferComponent = ({ offres, demandes, setShowOffres, showOffres, setShowDemandes, showDemandes, setOffreFilterFormat, setOffreFilterStatut, offreFilterFormat, offreFilterStatut, onDeleteOffer, onViewResponses }) => {
    let to_show = [];
    if (showDemandes) to_show = [...to_show, ...demandes];
    if (showOffres) to_show = [...to_show, ...offres];
    to_show = to_show.filter(value => offreFilterFormat == "all" ? true : value.format == offreFilterFormat);
    to_show = to_show.filter(value => offreFilterStatut == "all" ? true : value.statut == offreFilterStatut);
    
    return (
        <div className="offer-component">
            <div className="offer-buttons">
                <button className={`offer-toggle-btn `} onClick={() => setShowOffres(!showOffres)}>
                    {showOffres ? "🙈 Cacher les offres" : "👁️ Afficher les offres"}
                </button>
                <button className={`offer-toggle-btn `} onClick={() => setShowDemandes(!showDemandes)}>
                    {showDemandes ? "🙈 Cacher les demandes" : "👁️ Afficher les demandes"}    
                </button>
            </div>
            <div className="offer-filters">
                <div className="filter-group">
                    <select className="filter-select" onChange={(e) => setOffreFilterFormat(e.target.value)}>
                        <option value={"all"}>Tout</option>
                        <option value={"les_deux"}>Presentiel et en ligne</option>
                        <option value={"presentiel"}>Presentiel</option>
                        <option value={"en_ligne"}>En ligne</option>
                    </select>
                </div>
                <div className="filter-group">
                    <select className="filter-select" onChange={(e) => setOffreFilterStatut(e.target.value)}>
                        <option value={"all"}>Tout</option>
                        <option value={"active"}>Active</option>
                        <option value={"cloturee"}>Cloturé</option>
                    </select>
                </div>
                <div className="offers-list">
                    {to_show.length === 0 && <p className="empty-message">Pas d'offres ou demandes</p>}
                    {to_show.map((value, idx) => (
                        <div key={idx} className="offer-card">
                            <div className="offer-header">
                                <span className={`offer-type ${value.type == "offre" ? "type-offre" : "type-demande"}`}>
                                    {value.type == "offre" ? "🎓 Offre" : "🙏 Demande"}
                                </span>
                                <span className={`offer-status ${value.statut}`}>
                                    {value.statut === "active" ? "🟢 Active" : "🔴 Clôturée"}
                                </span>
                                {value.responses && value.responses.length > 0 && (
                                    <span className="offer-responses-badge">
                                        📨 {value.responses.length} réponse(s)
                                    </span>
                                )}
                            </div>
                            <div className="offer-competence"><strong>{value.competence}</strong></div>
                            <div className="offer-format">{value.format === "presentiel" ? "🏠 Présentiel" : "💻 En ligne"}</div>
                            {value.description && <div className="offer-description">{value.description}</div>}
                            <div className="offer-actions">
                                <button className="btn-delete" onClick={() => onDeleteOffer(value)}>🗑️ Supprimer</button>
                            </div>
                            {value.responses?.length > 0 && (
                                <button 
                                    className="btn-view-responses" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onViewResponses(value);
                                    }}
                                >
                                    📨 Voir les réponses ({value.responses.length})
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

const ResponseComponent = ({ response, showResponse, setShowResponse, responseFilter, setResponseFilter, onDeleteResponse }) => {
    let to_show = [];
    if (showResponse) to_show = [...response];
    to_show = to_show.filter(value => responseFilter == "all" ? true : value.statut == responseFilter);
    
    return (
        <div className="response-component">
            <div className="response-header">
                <button className="toggle-btn response-toggle" onClick={() => setShowResponse(!showResponse)}>
                    {showResponse ? "🙈 Cacher les réponses" : "👁️ Afficher les réponses"}
                </button>
                {showResponse && (
                    <select className="response-filter" onChange={(e) => setResponseFilter(e.target.value)}>
                        <option value={"all"}>Tout</option>
                        <option value={"in_wait"}>⏳ En attente</option>
                        <option value={"accepted"}>✅ Accepté</option>
                        <option value={"refused"}>❌ Refusé</option>
                    </select>
                )}
            </div>
            {showResponse && (
                <div className="responses-list">
                    {to_show.length === 0 && <p className="empty-message">Pas de réponses</p>}
                    {to_show.map((value, idx) => (
                        <div key={idx} className="response-card">
                            <div className="response-info">
                                <span className="response-offre-id">📋 {value.offre?.competence || `Offre #${value.offre_id}`}</span>
                                <span className={`response-status ${value.statut}`}>
                                    {value.statut === "in_wait" && "⏳ En attente"}
                                    {value.statut === "accepted" && "✅ Acceptée"}
                                    {value.statut === "refused" && "❌ Refusée"}
                                </span>
                                <span className="response-date">{new Date(value.created_at).toLocaleDateString()}</span>
                            </div>
                            <button className="btn-delete-response" onClick={() => onDeleteResponse(value)}>
                                🗑️ Supprimer
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function ProfileOffre() {
    const user_session_id = useRef(null);
    const token = useRef(null);
    const salt = useRef(null);
    const user_phone = useRef(null);
    const user_email = useRef(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [offres, setOffres] = useState([]);
    const [demandes, setDemandes] = useState([]);
    const [responses, setResponses] = useState([]);
    const [matchings, setMatchings] = useState([]);
    const [selectedCandidat, setSelectedCandidat] = useState(null);
    const navigate = useNavigate();

    const [scoreMin, setScoreMin] = useState(0);
    const [offreFilterFormat, setOffreFilterFormat] = useState("all");
    const [offreFilterStatut, setOffreFilterStatut] = useState("all");
    const [responseFilter, setResponseFilter] = useState("all");
    const [showOffres, setShowOffres] = useState(true);
    const [showMatchings, setShowMatchings] = useState(true);
    const [showResponse, setShowResponse] = useState(true);
    const [showDemandes, setShowDemandes] = useState(true);
    const [showResponsesModal, setShowResponsesModal] = useState(false);
    const [selectedOfferForResponses, setSelectedOfferForResponses] = useState(null)
    const setData = () => { 
        user_session_id.current = sessionStorage.getItem("user_session_id");
        token.current = sessionStorage.getItem("token");
        salt.current = sessionStorage.getItem("salt");
        user_email.current = sessionStorage.getItem("user_email");
        user_phone.current = sessionStorage.getItem("user_phone");
        return (
            user_session_id.current != null && 
            token.current != null && 
            salt.current != null &&
            user_email.current != null &&
            user_phone.current != null
        );
    };
    
    useEffect(() => {
        if (!setData()) {
            navigate(LOGIN);
            return;
        }
        loadOffreData(
            navigate, setUser, setOffres, setDemandes,
            setResponses, setMatchings, setLoading,
            user_email, user_phone, salt, token, user_session_id
        );
    }, []);

    const reloadData = () => {
        loadOffreData(
            navigate, setUser, setOffres, setDemandes,
            setResponses, setMatchings, setLoading,
            user_email, user_phone, salt, token, user_session_id
        );
    };

    const handleViewProfile = (candidat) => {
        setSelectedCandidat(candidat);
    };

    const handleCloseModal = () => {
        setSelectedCandidat(null);
    };
    useEffect(
        () => {
            console.log(user, matchings)
        }
    , [user, matchings])

    // Suppression d'une offre
    const handleDeleteOffer = async (offer) => {
        const password = await passwordPrompt("Votre mot de passe pour supprimer cette offre");
        if (!password) return;

        try {
            const response = await deleteOffre({
                email: user_email.current,
                phone: user_phone.current,
                token: token.current,
                key: salt.current,
                password: password,
                competence: offer.competence,
                type: offer.type,
                format: offer.format
            });

            if (response.ok && response.response?.success) {
                alert("✅ Offre supprimée avec succès !");
                reloadData();
            } else {
                alert("❌ " + (response.response?.reason || "Erreur lors de la suppression"));
            }
        } catch (err) {
            alert("Une erreur est survenue");
        }
    };

    // Suppression d'une réponse
    const handleDeleteResponse = async (resp) => {
        const password = await passwordPrompt("Votre mot de passe pour supprimer cette réponse");
        if (!password) return;

        try {
            const response = await deleteResponse({
                response_id: resp.id,
                email: user_email.current,
                phone: user_phone.current,
                token: token.current,
                key: salt.current,
                password: password
            });

            if (response.ok && response.response?.success) {
                alert("✅ Réponse supprimée avec succès !");
                reloadData();
            } else {
                alert("❌ " + (response.response?.detail || "Erreur lors de la suppression"));
            }
        } catch (err) {
            alert("Une erreur est survenue");
        }
    };

    // Répondre à une réponse
    const handleViewResponses = (offer) => {
        setSelectedOfferForResponses(offer);
        setShowResponsesModal(true);
    };

    if (loading) {
        return <div className="profile-offre-loading">⏳ Chargement des offres...</div>;
    }

    return (
        <div className="profile-offre-container">
            <OffreUserHeader user={user} />
            <div className="profile-three-columns">
                <div className="column-card">
                    <h3 className="column-title">🎯 Matchings</h3>
                    <MatchingComponent 
                        matchings={matchings}
                        scoreMin={scoreMin}
                        setScoreMin={setScoreMin}
                        setShowMatchings={setShowMatchings}
                        showMatchings={showMatchings}
                        onViewProfile={handleViewProfile}
                    />
                </div>
                <div className="column-card">
                    <h3 className="column-title">📋 Offres & Demandes</h3>
                    <OfferComponent 
                        offreFilterFormat={offreFilterFormat}
                        offreFilterStatut={offreFilterStatut}
                        offres={offres}
                        demandes={demandes}
                        showDemandes={showDemandes}
                        showOffres={showOffres}
                        setOffreFilterFormat={setOffreFilterFormat}
                        setOffreFilterStatut={setOffreFilterStatut}
                        setShowDemandes={setShowDemandes}
                        setShowOffres={setShowOffres}
                        onDeleteOffer={handleDeleteOffer}
                        onViewResponses={handleViewResponses}
                    />
                </div>
                <div className="column-card">
                    <h3 className="column-title">📬 Réponses</h3>
                    <ResponseComponent 
                        response={responses}
                        showResponse={showResponse}
                        setShowResponse={setShowResponse}
                        setResponseFilter={setResponseFilter}
                        responseFilter={responseFilter}
                        onDeleteResponse={handleDeleteResponse}
                    />
                </div>
            </div>

            {/* Modal profil candidat */}
            {selectedCandidat && (
                <CandidatModal 
                    candidat={selectedCandidat} 
                    onClose={handleCloseModal} 
                />
            )}

            {/* Modal réponse à reponse */}
            {showResponsesModal && selectedOfferForResponses && (
                <AnswerResponsesModal
                    offer={selectedOfferForResponses}
                    onClose={() => setShowResponsesModal(false)}
                    onSuccess={reloadData}
                />
            )}
        </div>
    );
}

export default ProfileOffre;