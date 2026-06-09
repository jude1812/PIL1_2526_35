import "./answer_to_response.css";
import { useEffect, useState } from "react";
import { answerToResponse, searchUser } from "./hooks/fetch_functions";
import { passwordPrompt } from "./password_prompt";

const AnswerResponsesModal = ({ offer, onClose, onSuccess }) => {
    const [loading, setLoading] = useState({});
    const [loadingUsers, setLoadingUsers] = useState({});
    const [responsesWithUser, setResponsesWithUser] = useState([]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
        
        // Charger les infos des utilisateurs
        loadUsersForResponses();
        
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "auto";
        };
    }, [onClose, offer.responses]);

    const loadUsersForResponses = async () => {
        const responses = offer.responses || [];
        const token = sessionStorage.getItem("token");
        const salt = sessionStorage.getItem("salt");
        
        const enriched = [];
        
        for (const resp of responses) {
            setLoadingUsers(prev => ({ ...prev, [resp.answer_id]: true }));
            
            try {
                const result = await searchUser({
                    user_id: resp.answer_id,
                    token: token,
                    key: salt
                });
                
                if (result.ok && result.response?.user) {
                    enriched.push({ 
                        ...resp, 
                        answer_user: result.response.user 
                    });
                    console.log(result);
                    
                } else {
                    enriched.push(resp);
                }
            } catch (err) {
                console.error("Erreur chargement user:", err);
                enriched.push(resp);
            } finally {
                setLoadingUsers(prev => ({ ...prev, [resp.answer_id]: false }));
            }
        }
        
        setResponsesWithUser(enriched);
    };

    const handleAnswer = async (responseId, accept) => {
        const password = await passwordPrompt("Confirmez avec votre mot de passe");
        if (!password) return;

        setLoading(prev => ({ ...prev, [responseId]: true }));

        try {
            const result = await answerToResponse({
                offre_id: offer.id,
                answer_id: responseId,
                response: accept ? "accepted" : "refused",
                close_offer: false,
                email: sessionStorage.getItem("user_email"),
                phone: sessionStorage.getItem("user_phone"),
                token: sessionStorage.getItem("token"),
                key: sessionStorage.getItem("salt"),
                password: password
            });

            if (result.ok && result.response?.success) {
                alert(`✅ Réponse ${accept ? "acceptée" : "refusée"} !`);
                onSuccess?.();
                onClose();
            } else {
                alert("❌ " + (result.response?.detail || "Erreur"));
            }
        } catch (err) {
            alert("Une erreur est survenue");
        } finally {
            setLoading(prev => ({ ...prev, [responseId]: false }));
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content responses-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>

                <div className="modal-header">
                    <div className="modal-icon">📨</div>
                    <h2>Réponses à l'offre</h2>
                    <p className="offer-title">{offer.competence}</p>
                </div>

                <div className="modal-body">
                    {responsesWithUser.length === 0 ? (
                        <p className="empty-message">Aucune réponse pour le moment</p>
                    ) : (
                        responsesWithUser.map((resp, idx) => (
                            <div key={idx} className="response-item">
                                <div className="response-user">
                                    
                                    {loadingUsers[resp.answer_id] ? (
                                        <span className="loading-text">Chargement...</span>
                                    ) : resp.answer_user ? (
                                        <span className="user-name">
                                            {resp.answer_user.prenom} {resp.answer_user.nom}
                                            <span className="user-email"> ({resp.answer_user.email})</span>
                                        </span>
                                    ) : (
                                        <span className="user-id">Utilisateur #{resp.answer_id}</span>
                                    )}
                                </div>
                                <div className={`response-status ${resp.statut}`}>
                                    {resp.statut === "in_wait" && "⏳ En attente"}
                                    {resp.statut === "accepted" && "✅ Acceptée"}
                                    {resp.statut === "refused" && "❌ Refusée"}
                                </div>
                                {resp.statut === "in_wait" && (
                                    <div className="response-actions">
                                        <button 
                                            className="btn-accept" 
                                            onClick={() => handleAnswer(resp.answer_id, true)} 
                                            disabled={loading[resp.answer_id]}
                                        >
                                            {loading[resp.answer_id] ? "⏳" : "✅"} Accepter
                                        </button>
                                        <button 
                                            className="btn-refuse" 
                                            onClick={() => handleAnswer(resp.answer_id, false)} 
                                            disabled={loading[resp.answer_id]}
                                        >
                                            {loading[resp.answer_id] ? "⏳" : "❌"} Refuser
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-close" onClick={onClose}>Fermer</button>
                </div>
            </div>
        </div>
    );
};

export default AnswerResponsesModal;