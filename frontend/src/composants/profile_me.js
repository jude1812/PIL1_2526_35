import "./profile_me.css"
import { useState, useRef, useEffect } from "react"
import { LOGIN } from "./hooks/nav_path";
import { 
    getMe, refreshToken as _refreshToken, logout, 
    DEFAULT_AVATAR, BACKEND_PROFILE_IMGS_URL,
    checkEmail as _checkEmail, checkPhone as _checkPhone, 
    updateEmail, updatePhone, updateGeneral,
    addSkill, deleteSkill, addDispo, deleteDispo, 
    getPassphraseQuestion, uploadProfileImg
} from "./hooks/fetch_functions";
import { passwordPrompt } from "./password_prompt";
import { MAPPER } from "./hooks/detail_mapper";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const refreshToken = async (user_session_id, token, salt, navigate) => {
    console.log("🔄 Refresh token enclenché !");
    try {
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
    } catch (err) {
        console.log("❌ Exception refreshToken : ", err.message);
        alert("Erreur lors du rafraîchissement du token. Veuillez vous reconnecter.");
        sessionStorage.clear();
        if (navigate) navigate(LOGIN);
        return false;
    }
}

const loadMe = async (
    navigate, setUser, setSkills, 
    setDispos, setLoading,
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
                if (refreshed) return await loadMe(
                    navigate, setUser, setSkills, setDispos, setLoading,
                    user_email, user_phone, salt, token, user_session_id
                );
                else throw new Error("Impossible de rafraîchir le token");
            }
            throw new Error(MAPPER[json?.detail] || "Erreur lors du chargement du profil");
        }

        setUser(json.user_data);
        setSkills(json.skills || []);
        setDispos(json.dispos || []);
        return json;
    }
    catch (err){
        console.log("❌ Erreur dans loadMe : ", err.message);
        //alert(err.message);
        return null;   
    }
    finally {
        setLoading(false);
    }
}

// Validation des heures sans regex
const validateTimeFormat = (time) => {
    if (time.length !== 5) return false;
    if (time[2] !== ":") return false;
    
    const heures = parseInt(time.substring(0, 2));
    const minutes = parseInt(time.substring(3, 5));
    
    if (isNaN(heures) || isNaN(minutes)) return false;
    if (heures < 0 || heures > 23) return false;
    if (minutes < 0 || minutes > 59) return false;
    
    return true;
};

const validateHeures = (heure_debut, heure_fin) => {
    if (!validateTimeFormat(heure_debut)) {
        alert("❌ Heure début invalide. Utilisez HH:MM (ex: 14:30)");
        return false;
    }
    if (!validateTimeFormat(heure_fin)) {
        alert("❌ Heure fin invalide. Utilisez HH:MM (ex: 17:00)");
        return false;
    }
    
    const debutHeures = parseInt(heure_debut.substring(0, 2));
    const debutMinutes = parseInt(heure_debut.substring(3, 5));
    const finHeures = parseInt(heure_fin.substring(0, 2));
    const finMinutes = parseInt(heure_fin.substring(3, 5));
    
    const debutTotal = debutHeures * 60 + debutMinutes;
    const finTotal = finHeures * 60 + finMinutes;
    
    if (debutTotal >= finTotal) {
        alert("❌ L'heure de début doit être avant l'heure de fin");
        return false;
    }
    
    return true;
};

const UserComponent = ({ user, skills, dispos, setEdited, token, salt, navigate, user_session_id }) => {
    const profil_img = user?.img_path == null ? DEFAULT_AVATAR : `${BACKEND_PROFILE_IMGS_URL}/${user.img_path}`;
    
    // États pour l'édition des champs
    const [editEmail, setEditEmail] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editNom, setEditNom] = useState("");
    const [editPrenom, setEditPrenom] = useState("");
    const [editBio, setEditBio] = useState("");
    const [editFiliere, setEditFiliere] = useState("");
    const [editLevel, setEditLevel] = useState("");
    
    // États pour les modes édition
    const [editingEmail, setEditingEmail] = useState(false);
    const [editingPhone, setEditingPhone] = useState(false);
    const [editingNom, setEditingNom] = useState(false);
    const [editingPrenom, setEditingPrenom] = useState(false);
    const [editingBio, setEditingBio] = useState(false);
    const [editingFiliere, setEditingFiliere] = useState(false);
    const [editingLevel, setEditingLevel] = useState(false);
    
    // États pour ajout compétence/disponibilité
    const [newSkill, setNewSkill] = useState({ competence: "", type: "fort" });
    const [showAddSkill, setShowAddSkill] = useState(false);
    const [newDispo, setNewDispo] = useState({ jour: "lundi", heure_debut: "09:00", heure_fin: "17:00" });
    const [showAddDispo, setShowAddDispo] = useState(false);
    
    const jours = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

    const showError = (message) => {
        alert(`❌ ${message}`);
        console.log(`❌ ${message}`);
    };

    const showSuccess = (message) => {
        alert(`✅ ${message}`);
    };

    const [editingAvatar, setEditingAvatar] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    // Handler
    const handleAvatarEdit = async () => {
        if (!selectedFile) {
            showError("Veuillez sélectionner une image");
            return;
        }

        const password = await passwordPrompt("Votre mot de passe pour modifier la photo");
        if (!password) return;

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("token", token.current);
            formData.append("key", salt.current);
            formData.append("email", user?.email || "");
            formData.append("phone", user?.phone || "");

            const response = await uploadProfileImg(formData);

            if (response.ok && response.response?.success) {
                showSuccess("Photo mise à jour !");
                setSelectedFile(null);
                setEditingAvatar(false);
                setEdited(true);
            } else {
                showError(response.response?.detail || "Erreur");
            }
        } catch (err) {
            showError("Une erreur est survenue");
        }
    };
    // ========== HANDLERS EMAIL & PHONE ==========
    const handleEmailEdit = async () => {
        let password = await passwordPrompt("Votre mot de passe pour confirmer");
        if (!password) {
            showError("Mot de passe requis !");
            setEditingEmail(false);
            return;
        }
        
        let checkingResult = await _checkEmail(`email=${editEmail}`);
        if (checkingResult.ok && checkingResult.response?.exists) {
            showError("Cet email est déjà utilisé");
            setEditingEmail(false);
            return;
        }
        
        let updateResult = await updateEmail({
            phone: user?.phone,
            email: editEmail,
            password: password,
            token: token.current,
            key: salt.current
        });
        
        if (updateResult?.ok && updateResult.response?.success) {
            showSuccess("Email mis à jour avec succès !");
            sessionStorage.setItem("user_email", editEmail);
            setEdited(true);
        } else {
            showError(updateResult.response?.detail || "Échec de la mise à jour");
        }
        setEditingEmail(false);
    };

    const handlePhoneEdit = async () => {
        let password = await passwordPrompt("Votre mot de passe pour confirmer");
        if (!password) {
            showError("Mot de passe requis !");
            setEditingPhone(false);
            return;
        }
        
        let checkingResult = await _checkPhone(`phone=${editPhone}`);
        if (checkingResult.ok && checkingResult.response?.exists) {
            showError("Ce numéro est déjà utilisé");
            setEditingPhone(false);
            return;
        }
        
        let updateResult = await updatePhone({
            email: user?.email,
            phone: editPhone,
            password: password,
            token: token.current,
            key: salt.current
        });
        
        if (updateResult?.ok && updateResult.response?.success) {
            showSuccess("Téléphone mis à jour avec succès !");
            sessionStorage.setItem("user_phone", editPhone);
            setEdited(true);
        } else {
            showError(updateResult.response?.detail || "Échec de la mise à jour");
        }
        setEditingPhone(false);
    };

    // ========== HANDLERS CHAMPS GENERAUX ==========
    const handleNomEdit = async () => {
        if (!editNom.trim()) {
            showError("Le nom ne peut pas être vide");
            setEditingNom(false);
            return;
        }
        
        let password = await passwordPrompt("Votre mot de passe pour confirmer");
        if (!password) {
            showError("Mot de passe requis !");
            setEditingNom(false);
            return;
        }
        
        let updateResult = await updateGeneral({
            email: user?.email,
            phone: user?.phone,
            nom: editNom,
            password: password,
            token: token.current,
            key: salt.current
        });
        
        if (updateResult?.ok && updateResult.response?.success) {
            showSuccess("Nom mis à jour avec succès !");
            setEdited(true);
        } else {
            showError(updateResult.response?.detail || "Échec de la mise à jour");
        }
        setEditingNom(false);
    };

    const handlePrenomEdit = async () => {
        if (!editPrenom.trim()) {
            showError("Le prénom ne peut pas être vide");
            setEditingPrenom(false);
            return;
        }
        
        let password = await passwordPrompt("Votre mot de passe pour confirmer");
        if (!password) {
            showError("Mot de passe requis !");
            setEditingPrenom(false);
            return;
        }
        
        let updateResult = await updateGeneral({
            email: user?.email,
            phone: user?.phone,
            prenom: editPrenom,
            password: password,
            token: token.current,
            key: salt.current
        });
        
        if (updateResult?.ok && updateResult.response?.success) {
            showSuccess("Prénom mis à jour avec succès !");
            setEdited(true);
        } else {
            showError(updateResult.response?.detail || "Échec de la mise à jour");
        }
        setEditingPrenom(false);
    };

    const handleBioEdit = async () => {
        let password = await passwordPrompt("Votre mot de passe pour confirmer");
        if (!password) {
            showError("Mot de passe requis !");
            setEditingBio(false);
            return;
        }
        
        let updateResult = await updateGeneral({
            email: user?.email,
            phone: user?.phone,
            bio: editBio,
            password: password,
            token: token.current,
            key: salt.current
        });
        
        if (updateResult?.ok && updateResult.response?.success) {
            showSuccess("Bio mise à jour avec succès !");
            setEdited(true);
        } else {
            showError(updateResult.response?.detail || "Échec de la mise à jour");
        }
        setEditingBio(false);
    };

    const handleFiliereEdit = async () => {
        let password = await passwordPrompt("Votre mot de passe pour confirmer");
        if (!password) {
            showError("Mot de passe requis !");
            setEditingFiliere(false);
            return;
        }
        
        let updateResult = await updateGeneral({
            email: user?.email,
            phone: user?.phone,
            filiere: editFiliere,
            password: password,
            token: token.current,
            key: salt.current
        });
        
        if (updateResult?.ok && updateResult.response?.success) {
            showSuccess("Filière mise à jour avec succès !");
            setEdited(true);
        } else {
            showError(updateResult.response?.detail || "Échec de la mise à jour");
        }
        setEditingFiliere(false);
    };

    const handleLevelEdit = async () => {
        let password = await passwordPrompt("Votre mot de passe pour confirmer");
        if (!password) {
            showError("Mot de passe requis !");
            setEditingLevel(false);
            return;
        }
        
        let updateResult = await updateGeneral({
            email: user?.email,
            phone: user?.phone,
            level: editLevel,
            password: password,
            token: token.current,
            key: salt.current
        });
        
        if (updateResult?.ok && updateResult.response?.success) {
            showSuccess("Niveau mis à jour avec succès !");
            setEdited(true);
        } else {
            showError(updateResult.response?.detail || "Échec de la mise à jour");
        }
        setEditingLevel(false);
    };

    // ========== HANDLERS COMPÉTENCES ==========
    const handleAddSkill = async () => {
        if (!newSkill.competence.trim()) {
            showError("Veuillez entrer une compétence");
            return;
        }
        
        let password = await passwordPrompt("Votre mot de passe pour confirmer l'ajout");
        if (!password) {
            showError("Mot de passe requis !");
            return;
        }
        
        try {
            let response = await addSkill({
                email: user?.email,
                phone: user?.phone,
                token: token.current,
                key: salt.current,
                password: password,
                competence: newSkill.competence,
                type: newSkill.type
            });
            
            if (response.ok && response.response?.success) {
                showSuccess("Compétence ajoutée avec succès !");
                setNewSkill({ competence: "", type: "fort" });
                setShowAddSkill(false);
                setEdited(true);
            } else {
                showError(response.response?.detail || "Erreur lors de l'ajout");
            }
        } catch (err) {
            console.log("❌ handleAddSkill error:", err);
            showError("Une erreur est survenue");
        }
    };

    const handleDeleteSkill = async (competence) => {
        let password = await passwordPrompt("Votre mot de passe pour confirmer la suppression");
        if (!password) {
            showError("Mot de passe requis !");
            return;
        }
        
        try {
            let response = await deleteSkill({
                email: user?.email,
                phone: user?.phone,
                token: token.current,
                key: salt.current,
                password: password,
                competence: competence,
                all: false
            });
            
            if (response.ok && response.response?.success) {
                showSuccess("Compétence supprimée avec succès !");
                setEdited(true);
            } else {
                showError(response.response?.reason || "Erreur lors de la suppression");
            }
        } catch (err) {
            console.log("❌ handleDeleteSkill error:", err);
            showError("Une erreur est survenue");
        }
    };

    // ========== HANDLERS DISPONIBILITÉS ==========
    const handleAddDispo = async () => {
        if (!newDispo.heure_debut || !newDispo.heure_fin) {
            showError("Veuillez remplir les heures");
            return;
        }
        
        if (!validateHeures(newDispo.heure_debut, newDispo.heure_fin)) {
            return;
        }
        
        let password = await passwordPrompt("Votre mot de passe pour confirmer l'ajout");
        if (!password) {
            showError("Mot de passe requis !");
            return;
        }
        
        try {
            let response = await addDispo({
                email: user?.email,
                phone: user?.phone,
                token: token.current,
                key: salt.current,
                password: password,
                jour: newDispo.jour,
                heure_debut: newDispo.heure_debut,
                heure_fin: newDispo.heure_fin
            });
            
            if (response.ok && response.response?.success) {
                showSuccess("Disponibilité ajoutée avec succès !");
                setNewDispo({ jour: "lundi", heure_debut: "09:00", heure_fin: "17:00" });
                setShowAddDispo(false);
                setEdited(true);
            } else {
                showError(response.response?.detail || "Erreur lors de l'ajout");
            }
        } catch (err) {
            console.log("❌ handleAddDispo error:", err);
            showError("Une erreur est survenue");
        }
    };

    const handleDeleteDispo = async (jour, heure_debut, heure_fin) => {
        let password = await passwordPrompt("Votre mot de passe pour confirmer la suppression");
        if (!password) {
            showError("Mot de passe requis !");
            return;
        }
        
        try {
            let response = await deleteDispo({
                email: user?.email,
                phone: user?.phone,
                token: token.current,
                key: salt.current,
                password: password,
                jour: jour,
                all: false
            });
            
            if (response.ok && response.response?.success) {
                showSuccess("Disponibilité supprimée avec succès !");
                setEdited(true);
            } else {
                showError(response.response?.reason || "Erreur lors de la suppression");
            }
        } catch (err) {
            console.log("❌ handleDeleteDispo error:", err);
            showError("Une erreur est survenue");
        }
    };

    return (
        <div className="user-component">
            <div className="user-avatar-section">
                <img src={profil_img} alt="Profil" className="user-avatar"/>
                
                {editingAvatar ? (
                    <div className="edit-avatar-inline">
                        <input 
                            type="file" 
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => setSelectedFile(e.target.files[0])}
                            className="avatar-file-input"
                        />
                        <div className="edit-avatar-actions">
                            <button className="btn-avatar-confirm" onClick={handleAvatarEdit}>
                                ✅ Enregistrer
                            </button>
                            <button className="btn-avatar-cancel" onClick={() => setEditingAvatar(false)}>
                                ❌ Annuler
                            </button>
                        </div>
                    </div>
                ) : (
                    <button className="btn-edit-avatar" onClick={() => setEditingAvatar(true)}>
                        ✏️ Modifier la photo
                    </button>
                )}
            </div>
            <div className="user-info-section">
                <h2 className="user-fullname">{user?.nom} {user?.prenom}</h2>
                <div className="user-details-grid">
                    {/* Nom */}
                    <div className="detail-item">
                        <span className="detail-label">👤 Nom:</span>
                        {editingNom ? (
                            <div className="edit-inline">
                                <input 
                                    value={editNom}
                                    onChange={(e) => setEditNom(e.target.value)}
                                    autoFocus
                                />
                                <button onClick={handleNomEdit}>✅</button>
                                <button onClick={() => setEditingNom(false)}>❌</button>
                            </div>
                        ) : (
                            <div className="display-inline">
                                <span>{user?.nom}</span>
                                <button onClick={() => {
                                    setEditNom(user?.nom);
                                    setEditingNom(true);
                                }}>✏️</button>
                            </div>
                        )}
                    </div>

                    {/* Prénom */}
                    <div className="detail-item">
                        <span className="detail-label">👤 Prénom:</span>
                        {editingPrenom ? (
                            <div className="edit-inline">
                                <input 
                                    value={editPrenom}
                                    onChange={(e) => setEditPrenom(e.target.value)}
                                    autoFocus
                                />
                                <button onClick={handlePrenomEdit}>✅</button>
                                <button onClick={() => setEditingPrenom(false)}>❌</button>
                            </div>
                        ) : (
                            <div className="display-inline">
                                <span>{user?.prenom}</span>
                                <button onClick={() => {
                                    setEditPrenom(user?.prenom);
                                    setEditingPrenom(true);
                                }}>✏️</button>
                            </div>
                        )}
                    </div>

                    {/* Email */}
                    <div className="detail-item">
                        <span className="detail-label">📧 Email:</span>
                        {editingEmail ? (
                            <div className="edit-inline">
                                <input 
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    autoFocus
                                />
                                <button onClick={handleEmailEdit}>✅</button>
                                <button onClick={() => setEditingEmail(false)}>❌</button>
                            </div>
                        ) : (
                            <div className="display-inline">
                                <span>{user?.email}</span>
                                <button onClick={() => {
                                    setEditEmail(user?.email);
                                    setEditingEmail(true);
                                }}>✏️</button>
                            </div>
                        )}
                    </div>

                    {/* Téléphone */}
                    <div className="detail-item">
                        <span className="detail-label">📞 Téléphone:</span>
                        {editingPhone ? (
                            <div className="edit-inline">
                                <input 
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    autoFocus
                                />
                                <button onClick={handlePhoneEdit}>✅</button>
                                <button onClick={() => setEditingPhone(false)}>❌</button>
                            </div>
                        ) : (
                            <div className="display-inline">
                                <span>{user?.phone}</span>
                                <button onClick={() => {
                                    setEditPhone(user?.phone);
                                    setEditingPhone(true);
                                }}>✏️</button>
                            </div>
                        )}
                    </div>

                    {/* Bio */}
                    <div className="detail-item">
                        <span className="detail-label">📝 Bio:</span>
                        {editingBio ? (
                            <div className="edit-inline">
                                <textarea 
                                    value={editBio}
                                    onChange={(e) => setEditBio(e.target.value)}
                                    rows={3}
                                />
                                <button onClick={handleBioEdit}>✅</button>
                                <button onClick={() => setEditingBio(false)}>❌</button>
                            </div>
                        ) : (
                            <div className="display-inline">
                                <span>{user?.bio || "Non renseignée"}</span>
                                <button onClick={() => {
                                    setEditBio(user?.bio || "");
                                    setEditingBio(true);
                                }}>✏️</button>
                            </div>
                        )}
                    </div>

                    {/* Filière */}
                    <div className="detail-item">
                        <span className="detail-label">🎓 Filière:</span>
                        {editingFiliere ? (
                            <div className="edit-inline">
                                <select 
                                    value={editFiliere}
                                    onChange={(e) => setEditFiliere(e.target.value)}
                                >
                                    <option value="">Sélectionner</option>
                                    <option value="IA">IA</option>
                                    <option value="IM">IM</option>
                                    <option value="GL">GL</option>
                                    <option value="SE&IoT">SE&IoT</option>
                                    <option value="SI">SI</option>
                                </select>
                                <button onClick={handleFiliereEdit}>✅</button>
                                <button onClick={() => setEditingFiliere(false)}>❌</button>
                            </div>
                        ) : (
                            <div className="display-inline">
                                <span>{user?.filiere || "Non renseignée"}</span>
                                <button onClick={() => {
                                    setEditFiliere(user?.filiere || "");
                                    setEditingFiliere(true);
                                }}>✏️</button>
                            </div>
                        )}
                    </div>

                    {/* Niveau */}
                    <div className="detail-item">
                        <span className="detail-label">📚 Niveau:</span>
                        {editingLevel ? (
                            <div className="edit-inline">
                                <select 
                                    value={editLevel}
                                    onChange={(e) => setEditLevel(e.target.value)}
                                >
                                    <option value="">Sélectionner</option>
                                    <option value="L1">L1</option>
                                    <option value="L2">L2</option>
                                    <option value="L3">L3</option>
                                    <option value="M1">M1</option>
                                    <option value="M2">M2</option>
                                </select>
                                <button onClick={handleLevelEdit}>✅</button>
                                <button onClick={() => setEditingLevel(false)}>❌</button>
                            </div>
                        ) : (
                            <div className="display-inline">
                                <span>{user?.level || "Non renseigné"}</span>
                                <button onClick={() => {
                                    setEditLevel(user?.level || "");
                                    setEditingLevel(true);
                                }}>✏️</button>
                            </div>
                        )}
                    </div>

                    {/* Date création + ID */}
                    <div className="detail-item">
                        <span className="detail-label">📅 Créé le:</span> 
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                    </div>
                    {/*<div className="detail-item">
                        <span className="detail-label">🆔 ID:</span> {user?.id || "N/A"}
                    </div>*/}
                </div>

                {/* Compétences */}
                <div className="user-skills-section">
                    <div className="section-header">
                        <h4>Compétences</h4>
                        <button className="btn-add" onClick={() => setShowAddSkill(!showAddSkill)}>
                            {showAddSkill ? "❌ Annuler" : "+ Ajouter"}
                        </button>
                    </div>
                    
                    {showAddSkill && (
                        <div className="add-form">
                            <input 
                                type="text"
                                placeholder="Compétence (ex: Python, SQL, React...)"
                                value={newSkill.competence}
                                onChange={(e) => setNewSkill({...newSkill, competence: e.target.value})}
                                className="add-input"
                            />
                            <select 
                                value={newSkill.type}
                                onChange={(e) => setNewSkill({...newSkill, type: e.target.value})}
                                className="add-select"
                            >
                                <option value="fort">💪 Fort</option>
                                <option value="faible">📖 Faible</option>
                            </select>
                            <button onClick={handleAddSkill} className="btn-confirm">✅ Ajouter</button>
                        </div>
                    )}
                    
                    {skills?.length > 0 ? (
                        skills.map((value, idx) => (
                            <div key={idx} className="skill-item">
                                <span className="skill-competence">{value.competence}</span>
                                <span className={`skill-type ${value.type}`}>
                                    {value.type === "fort" ? "💪 Fort" : "📖 Faible"}
                                </span>
                                <span className="skill-date">{new Date(value.created_at).toLocaleDateString()}</span>
                                <button 
                                    className="btn-delete-item"
                                    onClick={() => handleDeleteSkill(value.competence)}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="no-data">Aucune compétence</div>
                    )}
                </div>

                {/* Disponibilités */}
                <div className="user-dispos-section">
                    <div className="section-header">
                        <h4>Disponibilités</h4>
                        <button className="btn-add" onClick={() => setShowAddDispo(!showAddDispo)}>
                            {showAddDispo ? "❌ Annuler" : "+ Ajouter"}
                        </button>
                    </div>
                    
                    {showAddDispo && (
                        <div className="add-form">
                            <select 
                                value={newDispo.jour}
                                onChange={(e) => setNewDispo({...newDispo, jour: e.target.value})}
                                className="add-select"
                            >
                                {jours.map(jour => (
                                    <option key={jour} value={jour}>{jour}</option>
                                ))}
                            </select>
                            <input 
                                type="text"
                                placeholder="HH:MM (ex: 09:00)"
                                value={newDispo.heure_debut}
                                onChange={(e) => {
                                    let value = e.target.value;
                                    if (/^[0-9:]*$/.test(value)) {
                                        setNewDispo({...newDispo, heure_debut: value});
                                    }
                                }}
                                className="add-input"
                                maxLength={5}
                            />
                            <input 
                                type="text"
                                placeholder="HH:MM (ex: 17:00)"
                                value={newDispo.heure_fin}
                                onChange={(e) => {
                                    let value = e.target.value;
                                    if (/^[0-9:]*$/.test(value)) {
                                        setNewDispo({...newDispo, heure_fin: value});
                                    }
                                }}
                                className="add-input"
                                maxLength={5}
                            />
                            <button onClick={handleAddDispo} className="btn-confirm">✅ Ajouter</button>
                        </div>
                    )}
                    
                    {dispos?.length > 0 ? (
                        dispos.map((value, idx) => (
                            <div key={idx} className="dispo-item">
                                <span className="dispo-jour">{value.jour}</span>
                                <span className="dispo-heure">{value.heure_debut} - {value.heure_fin}</span>
                                <span className="dispo-date">{new Date(value.created_at).toLocaleDateString()}</span>
                                <button 
                                    className="btn-delete-item"
                                    onClick={() => handleDeleteDispo(value.jour, value.heure_debut, value.heure_fin)}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="no-data">Aucune disponibilité</div>
                    )}
                </div>
            </div>
        </div>
    );
};

function ProfileMe() {
    const user_session_id = useRef(null);
    const token = useRef(null);
    const salt = useRef(null);
    const user_phone = useRef(null);
    const user_email = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [skills, setSkills] = useState([]);
    const [dispos, setDispos] = useState([]);
    const navigate = useNavigate();

    const [edited, setEdited] = useState(false);
    const [firstTime, setFirstTime] = useState(true);

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
    }
    
    const loadData = async () => {
        if (firstTime) {
            await loadMe(
                navigate, setUser, setSkills, setDispos, setLoading,
                user_email, user_phone, salt, token, user_session_id
            );
            setFirstTime(false);
        } else if (edited) {
            await loadMe(
                navigate, setUser, setSkills, setDispos, setLoading,
                user_email, user_phone, salt, token, user_session_id
            );
            setEdited(false);
        }
    };
        
    useEffect(() => {
        setIsReady(setData());
    }, []);

    
    
    useEffect(() => {
        loadData();
    }, [edited, isReady]);
    

    const handleLogout = () => {
        try {
            logout();
            navigate(LOGIN);
        } catch (err) {
            console.log("❌ Logout error:", err);
            alert("Erreur lors de la déconnexion");
        }
    };

    const handleGetPassphrase = async () => {
        let password = await passwordPrompt("Veuillez entrer votre mot de passe pour récupérer votre passphrase");
        if (!password) {
            return;
        }
        
        try {
            let response = await getPassphraseQuestion({
                email: user?.email,
                phone: user?.phone,
                password: password,
                passphrase: ""
            });
            console.log(response);
            if (response.ok && response.response?.success) {
                alert(
                    `📝 Votre question secrète : ${response.response.passphrase_question}\n\nUtilisez cette question pour vous rappelez votre passphrase sur la page de connexion.`
                );
            } else {
                alert(response.response?.detail || "Échec de la récupération");
            }
        } catch (err) {
            console.log("❌ handleGetPassphrase error:", err);
            alert("Une erreur est survenue");
        }
    };

    if (loading) {
        return <div className="profile-loading">⏳ Chargement de votre profil...</div>;
    }

    return (
        <div id="profile-root">
            {isReady ? (
                <div className="profile-container">
                    <div className="profile-header-section">
                        <UserComponent 
                            user={user}
                            dispos={dispos}
                            skills={skills}
                            setEdited={setEdited}
                            token={token}
                            salt={salt}
                            navigate={navigate}
                            user_session_id={user_session_id}
                        />
                        <div className="profile-actions">
                            <button className="btn-passphrase" onClick={handleGetPassphrase}>
                                🔑 Récupérer ma passphrase
                            </button>
                            <button className="btn-logout" onClick={handleLogout}>
                                🚪 Déconnexion
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="notConnected">
                    🔒 <Link to={LOGIN}>Connectez-vous</Link>
                </div>
            )}
        </div>
    );
}

export default ProfileMe;