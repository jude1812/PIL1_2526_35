import "./confirm_delete_modal.css";
import { useEffect } from "react";

const DeleteConfirmModal = ({ title, message, onConfirm, onClose }) => {
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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>

                <div className="modal-header">
                    <div className="modal-icon">⚠️</div>
                    <h2>{title || "Confirmation"}</h2>
                </div>

                <div className="modal-body">
                    <p>{message || "Êtes-vous sûr de vouloir effectuer cette action ?"}</p>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Annuler</button>
                    <button className="btn-delete" onClick={onConfirm}>🗑️ Supprimer</button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;