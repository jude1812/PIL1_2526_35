import "./offre_reponse_modal.css";
import { useEffect, useState } from "react";
import { responseToOffre } from "./hooks/fetch_functions";

const OfferResponseModal = ({ offer, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "auto";
        };
    }, [onClose]);

    const handleSubmit = async () => {
        if (!password.trim()) {
            setError("Mot de passe requis");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await responseToOffre({
                offre_id: offer.id,
                email: sessionStorage.getItem("user_email"),
                phone: sessionStorage.getItem("user_phone"),
                token: sessionStorage.getItem("token"),
                key: sessionStorage.getItem("salt"),
                password: password
            });

            if (response.ok && response.response?.success) {
                alert("✅ Réponse envoyée avec succès !");
                onSuccess?.();
                onClose();
            } else {
                setError(response.response?.detail || "Erreur lors de la réponse");
            }
        } catch (err) {
            setError("Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content response-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>

                <div className="modal-header">
                    <div className="modal-icon">📝</div>
                    <h2>Répondre à l'offre</h2>
                </div>

                <div className="modal-body">
                    <div className="offer-details">
                        <div className="offer-detail-item">
                            <span className="detail-label">Compétence :</span>
                            <span className="detail-value">{offer.competence}</span>
                        </div>
                        <div className="offer-detail-item">
                            <span className="detail-label">Type :</span>
                            <span className="detail-value">{offer.type === "offre" ? "🎓 Offre" : "🙏 Demande"}</span>
                        </div>
                        <div className="offer-detail-item">
                            <span className="detail-label">Format :</span>
                            <span className="detail-value">
                                {offer.format === "presentiel" ? "🏠 Présentiel" : 
                                 offer.format === "en_ligne" ? "💻 En ligne" : "🌍 Les deux"}
                            </span>
                        </div>
                        {offer.description && (
                            <div className="offer-detail-item">
                                <span className="detail-label">Description :</span>
                                <span className="detail-value">{offer.description}</span>
                            </div>
                        )}
                    </div>

                    <div className="password-group">
                        <label>🔐 Mot de passe</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Votre mot de passe"
                                className="password-input"
                                autoFocus
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Annuler</button>
                    <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
                        {loading ? "⏳ Envoi..." : "✅ Confirmer la réponse"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OfferResponseModal;