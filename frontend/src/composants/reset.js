import "./reset.css"
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
    resetPassword, 
    resetPassphrase, 
    getPassphraseQuestion
} from "./hooks/fetch_functions";
import { LOGIN } from "./hooks/nav_path";

const Reset = () => {
    const [mode, setMode] = useState("password");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [passphrase, setPassphrase] = useState("");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [newPassphrase, setNewPassphrase] = useState("");
    const [confirmPassphrase, setConfirmPassphrase] = useState("");
    const [newQuestion, setNewQuestion] = useState("");
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    // ============ MOT DE PASSE OUBLIÉ ============
    // Il faut : email OU phone + passphrase
    const handleResetPassword = async () => {
        if (!email && !phone) {
            setError("Email ou téléphone requis");
            return;
        }
        if (!passphrase) {
            setError("Passphrase requise");
            return;
        }
        if (!newPassword || !confirmPassword) {
            setError("Nouveau mot de passe requis");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }
        if (newPassword.length < 8) {
            setError("8 caractères minimum");
            return;
        }

        setLoading(true);
        setError("");

        const response = await resetPassword({
            email: email,
            phone: phone,
            passphrase: passphrase,
            password: newPassword
        });

        if (response.ok && response.response?.success) {
            setSuccess(true);
            setTimeout(() => navigate(LOGIN), 3000);
        } else {
            setError(response.response?.detail || "Échec");
        }
        setLoading(false);
    };

    // ============ PASSPHRASE OUBLIÉE ============
    // Il faut : email OU phone + mot de passe
    const handleResetPassphrase = async () => {
        if (!email && !phone) {
            setError("Email ou téléphone requis");
            return;
        }
        if (!password) {
            setError("Mot de passe requis");
            return;
        }
        if (!newPassphrase || !confirmPassphrase) {
            setError("Nouvelle passphrase requise");
            return;
        }
        if (newPassphrase !== confirmPassphrase) {
            setError("Les passphrases ne correspondent pas");
            return;
        }

        setLoading(true);
        setError("");

        const response = await resetPassphrase({
            email: email,
            phone: phone,
            password: password,
            passphrase: newPassphrase,
            passphrase_question: null
        });

        if (response.ok && response.response?.success) {
            setSuccess(true);
            setTimeout(() => navigate(LOGIN), 3000);
        } else {
            setError(response.response?.detail || "Échec");
        }
        setLoading(false);
    };

    // ============ QUESTION SECRÈTE ============
    // Il faut : email OU phone + mot de passe OU passphrase
    const handleResetQuestion = async () => {
        if (!email && !phone) {
            setError("Email ou téléphone requis");
            return;
        }
        if (!newQuestion) {
            setError("Nouvelle question requise");
            return;
        }

        setLoading(true);
        setError("");

        // Essayer d'abord avec le mot de passe
        if (password) {
            const response = await resetPassphrase({
                email: email,
                phone: phone,
                password: password,
                passphrase: null,
                passphrase_question: newQuestion
            });

            if (response.ok && response.response?.success) {
                setSuccess(true);
                setTimeout(() => navigate(LOGIN), 3000);
                setLoading(false);
                return;
            } else if (response.response?.detail !== "BAD_PASSPHRASE") {
                setError(response.response?.detail || "Échec");
                setLoading(false);
                return;
            }
        }

        // Sinon essayer avec la passphrase
        if (passphrase) {
            const response = await resetPassphrase({
                email: email,
                phone: phone,
                password: null,
                passphrase: passphrase,
                passphrase_question: newQuestion
            });

            if (response.ok && response.response?.success) {
                setSuccess(true);
                setTimeout(() => navigate(LOGIN), 3000);
            } else {
                setError(response.response?.detail || "Échec");
            }
        } else {
            setError("Mot de passe ou passphrase requis");
        }
        setLoading(false);
    };

    // ============ AFFICHER QUESTION POUR RESET PASSWORD ============
    const fetchQuestion = async () => {
        if (!email && !phone) {
            setError("Email ou téléphone requis");
            return;
        }

        setLoading(true);
        const response = await getPassphraseQuestion({
            email: email,
            phone: phone,
            password: password,
            passphrase: passphrase
        });

        if (response.ok && response.response?.success) {
            setQuestion(response.response.passphrase_question);
        } else {
            setError("Compte non trouvé");
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="reset-container">
                <div className="reset-card">
                    <div className="reset-success">
                        <div className="success-icon">✅</div>
                        <h2>Réinitialisation réussie !</h2>
                        <p>Redirection vers la connexion...</p>
                        <Link to={LOGIN}>Se connecter</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-container">
            <div className="reset-card">
                <h2 className="reset-title">🔐 Réinitialisation</h2>

                <div className="reset-mode-selector">
                    <button className={mode === "password" ? "active" : ""} onClick={() => { setMode("password"); setError(""); setQuestion(""); }}>
                        🔑 Mot de passe
                    </button>
                    <button className={mode === "passphrase" ? "active" : ""} onClick={() => { setMode("passphrase"); setError(""); }}>
                        📝 Passphrase
                    </button>
                    <button className={mode === "question" ? "active" : ""} onClick={() => { setMode("question"); setError(""); }}>
                        ❓ Question
                    </button>
                </div>

                {error && <div className="reset-error">❌ {error}</div>}

                {/* MODE MOT DE PASSE - email/phone + passphrase */}
                {mode === "password" && (
                    <div className="reset-form">
                        <div className="input-group">
                            <label>📧 Email</label>
                            <input type="email" placeholder="exemple@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="reset-input" />
                        </div>
                        <div className="input-group">
                            <label>📱 Téléphone</label>
                            <input type="tel" placeholder="0612345678" value={phone} onChange={(e) => setPhone(e.target.value)} className="reset-input" />
                        </div>
                        <button onClick={fetchQuestion} disabled={loading} className="reset-btn-small">Afficher ma question</button>
                        {question && (
                            <div className="reset-question">
                                <strong>Question secrète :</strong><br />
                                {question}
                            </div>
                        )}
                        <div className="input-group">
                            <label>🔑 Passphrase</label>
                            <input type="text" placeholder="Votre passphrase" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} className="reset-input" />
                        </div>
                        <div className="input-group">
                            <label>🔐 Nouveau mot de passe</label>
                            <input type="password" placeholder="8 caractères minimum" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="reset-input" />
                        </div>
                        <div className="input-group">
                            <label>✓ Confirmation</label>
                            <input type="password" placeholder="Retapez votre mot de passe" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="reset-input" />
                        </div>
                        <button onClick={handleResetPassword} disabled={loading} className="reset-btn">Réinitialiser</button>
                    </div>
                )}

                {/* MODE PASSPHRASE - email/phone + mot de passe */}
                {mode === "passphrase" && (
                    <div className="reset-form">
                        <div className="input-group">
                            <label>📧 Email</label>
                            <input type="email" placeholder="exemple@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="reset-input" />
                        </div>
                        <div className="input-group">
                            <label>📱 Téléphone</label>
                            <input type="tel" placeholder="0612345678" value={phone} onChange={(e) => setPhone(e.target.value)} className="reset-input" />
                        </div>
                        <div className="input-group">
                            <label>🔐 Mot de passe</label>
                            <input type="password" placeholder="Votre mot de passe actuel" value={password} onChange={(e) => setPassword(e.target.value)} className="reset-input" />
                        </div>
                        <div className="input-group">
                            <label>🔑 Nouvelle passphrase</label>
                            <input type="text" placeholder="Nouvelle passphrase" value={newPassphrase} onChange={(e) => setNewPassphrase(e.target.value)} className="reset-input" />
                        </div>
                        <div className="input-group">
                            <label>✓ Confirmation</label>
                            <input type="text" placeholder="Retapez votre passphrase" value={confirmPassphrase} onChange={(e) => setConfirmPassphrase(e.target.value)} className="reset-input" />
                        </div>
                        <button onClick={handleResetPassphrase} disabled={loading} className="reset-btn">Modifier la passphrase</button>
                    </div>
                )}

                {/* MODE QUESTION - email/phone + mot de passe OU passphrase */}
                {mode === "question" && (
                    <div className="reset-form">
                        <div className="input-group">
                            <label>📧 Email</label>
                            <input type="email" placeholder="exemple@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="reset-input" />
                        </div>
                        <div className="input-group">
                            <label>📱 Téléphone</label>
                            <input type="tel" placeholder="0612345678" value={phone} onChange={(e) => setPhone(e.target.value)} className="reset-input" />
                        </div>
                        <div className="input-group">
                            <label>🔐 OU 🔑</label>
                            <input type="password" placeholder="Mot de passe (ou laissez vide si vous utilisez passphrase)" value={password} onChange={(e) => setPassword(e.target.value)} className="reset-input" />
                        </div>
                        <div className="input-group">
                            <label>🔑 OU 🔐</label>
                            <input type="text" placeholder="Passphrase (ou laissez vide si vous utilisez mot de passe)" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} className="reset-input" />
                        </div>
                        <div className="input-group">
                            <label>❓ Nouvelle question</label>
                            <input type="text" placeholder="Ex: Nom de mon premier animal ?" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} className="reset-input" />
                        </div>
                        <button onClick={handleResetQuestion} disabled={loading} className="reset-btn">Modifier la question</button>
                    </div>
                )}

                <div className="reset-footer">
                    <Link to={LOGIN}>← Retour à la connexion</Link>
                </div>
            </div>
        </div>
    );
};

export default Reset;