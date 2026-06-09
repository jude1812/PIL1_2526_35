import "./candidat_modal.css";
import { useEffect, useState } from "react";
import { DEFAULT_AVATAR, BACKEND_PROFILE_IMGS_URL } from "./hooks/fetch_functions";

const CandidatModal = ({ candidat, onClose }) => {
    const [showSkills, setShowSkills] = useState(true);
    const [showDispos, setShowDispos] = useState(true);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
        
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "auto";
        };
    }, [onClose]);

    const imgUrl = candidat?.img_path
        ? `${BACKEND_PROFILE_IMGS_URL}/${candidat.img_path}`
        : DEFAULT_AVATAR;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>
                
                {/* HEADER */}
                <div className="modal-header">
                    <img src={imgUrl} alt="Profil" className="modal-avatar" />
                    <h2>{candidat?.prenom} {candidat?.nom}</h2>
                    {candidat?.filiere && candidat?.level && (
                        <div className="modal-badge">
                            📚 {candidat.filiere} • {candidat.level}
                        </div>
                    )}
                </div>
                
                {/* BODY */}
                <div className="modal-body">
                    {/* Infos de base */}
                    <div className="modal-info">
                        <div className="info-row">
                            <span className="info-icon">📧</span>
                            <span className="info-label">Email :</span>
                            <span className="info-value">{candidat?.email || "Non renseigné"}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-icon">📞</span>
                            <span className="info-label">Téléphone :</span>
                            <span className="info-value">{candidat?.phone || "Non renseigné"}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-icon">📝</span>
                            <span className="info-label">Bio :</span>
                            <span className="info-value">{candidat?.bio || "Aucune bio"}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-icon">📅</span>
                            <span className="info-label">Membre depuis :</span>
                            <span className="info-value">
                                {candidat?.created_at ? new Date(candidat.created_at).toLocaleDateString() : "N/A"}
                            </span>
                        </div>
                    </div>

                    {/* COMPÉTENCES */}
                    <div className="modal-section">
                        <div className="section-header">
                            <h4>💪 Compétences</h4>
                            <button className="section-toggle" onClick={() => setShowSkills(!showSkills)}>
                                {showSkills ? "🙈 Masquer" : "👁️ Afficher"}
                            </button>
                        </div>
                        {showSkills && (
                            <div className="skills-list">
                                {candidat?.skills && candidat.skills.length > 0 ? (
                                    candidat.skills.map((skill, idx) => (
                                        <div key={idx} className="skill-tag">
                                            <span className="skill-name">{skill.competence}</span>
                                            <span className={`skill-level ${skill.type}`}>
                                                {skill.type === "fort" ? "💪 Fort" : "📖 Faible"}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="empty-section">Aucune compétence renseignée</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* DISPONIBILITÉS */}
                    <div className="modal-section">
                        <div className="section-header">
                            <h4>📅 Disponibilités</h4>
                            <button className="section-toggle" onClick={() => setShowDispos(!showDispos)}>
                                {showDispos ? "🙈 Masquer" : "👁️ Afficher"}
                            </button>
                        </div>
                        {showDispos && (
                            <div className="dispos-list">
                                {candidat?.disponibilites && candidat.disponibilites.length > 0 ? (
                                    candidat.disponibilites.map((dispo, idx) => (
                                        <div key={idx} className="dispo-tag">
                                            <span className="dispo-day">{dispo.jour}</span>
                                            <span className="dispo-time">{dispo.heure_debut} - {dispo.heure_fin}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="empty-section">Aucune disponibilité renseignée</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* FOOTER */}
                <div className="modal-footer">
                    <button className="modal-btn-message" onClick={() => {
                        window.location.href = `/messages?user=${candidat?.id}`;
                    }}>
                        💬 Envoyer un message
                    </button>
                    <button className="modal-btn-close" onClick={onClose}>
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CandidatModal;