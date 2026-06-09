import "./login.css"
import { useState, useEffect } from "react"
import { login } from "./hooks/fetch_functions";
import { MAPPER } from "./hooks/detail_mapper";
import { PROFILE_ME, RESET } from "./hooks/nav_path";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const ShowResponse = ({ response, error, email, phone, connect, navigate }) => {
    useEffect(() => {
        if (response?.success && navigate) {
            const timer = setTimeout(() => {
                navigate(PROFILE_ME);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [response, navigate]);

    if (response?.success) {
        sessionStorage.setItem("token", response.token);
        sessionStorage.setItem("user_session_id", response.user_session_id);
        sessionStorage.setItem("salt", response.salt);
        sessionStorage.setItem("user_email", email);
        sessionStorage.setItem("user_phone", phone);

        return (
            <div className="response-message success-message">
                <div className="message-icon">✅</div>
                <div className="message-content">
                    <strong>{connect ? "Connexion" : "Inscription"} réussie !</strong>
                    <p>Vous allez être redirigé vers votre profil...</p>
                </div>
            </div>
        );
    }
    
    if (error && error !== "") {
        let lines = error.split("\n").filter(value => value.trim());
        return (
            <div className="response-message error-message">
                <div className="message-icon">❌</div>
                <div className="message-content">
                    <strong>Une erreur est survenue :</strong>
                    {lines.map((line, idx) => (
                        <p key={idx}>{line}</p>
                    ))}
                </div>
            </div>
        );
    }

    return null;
};
    
const LoginComponent = ({
    nom, setNom, prenom, setPrenom, 
    email, setEmail, phone, setPhone,
    password, setPassword, passwordVerify,
    setPasswordVerify, passphrase, setPassphrase, 
    passphraseQuestion, setPassphraseQuestion,
    loading, login_function
}) => {
    return (
        <div className="form-group">
            <div className="input-group">
                <label htmlFor="input_name" className="input-label">
                    <span className="label-icon">👤</span>
                    Votre nom :
                </label>
                <input
                    type="text"
                    value={nom}
                    onChange={(e) => {setNom(e.target.value)}}
                    placeholder="Jean"
                    required
                    id="input_name"
                    className="form-input"
                    autoComplete="name"
                />
            </div>

            <div className="input-group">
                <label htmlFor="input_prenom" className="input-label">
                    <span className="label-icon">👤</span>
                    Votre prénom :
                </label>
                <input
                    value={prenom}
                    type="text"
                    onChange={(e) => {setPrenom(e.target.value)}}
                    placeholder="Dupont"
                    required
                    id="input_prenom"
                    className="form-input"
                    autoComplete="given-name"
                />
            </div>

            <div className="input-group">
                <label htmlFor="input_email" className="input-label">
                    <span className="label-icon">📧</span>
                    Votre email :
                </label>
                <input
                    value={email}
                    type="email"
                    onChange={(e) => {setEmail(e.target.value)}}
                    placeholder="jean.dupont@example.com"
                    required
                    id="input_email"
                    className="form-input"
                    autoComplete="email"
                />
            </div>

            <div className="input-group">
                <label htmlFor="input_phone" className="input-label">
                    <span className="label-icon">📱</span>
                    Votre téléphone :
                </label>
                <input
                    value={phone}
                    type="tel"
                    onChange={(e) => {setPhone(e.target.value)}}
                    placeholder="0102030405"
                    required
                    id="input_phone"
                    className="form-input"
                    autoComplete="tel"
                />
            </div>

            <div className="input-group">
                <label htmlFor="input_password" className="input-label">
                    <span className="label-icon">🔒</span>
                    Votre mot de passe :
                </label>
                <input
                    value={password}
                    type="password"
                    onChange={(e) => {setPassword(e.target.value)}}
                    placeholder="8 caractères minimum"
                    required
                    id="input_password"
                    className="form-input"
                    autoComplete="new-password"
                />
            </div>

            <div className="input-group">
                <label htmlFor="input_password_verify" className="input-label">
                    <span className="label-icon">✓</span>
                    Confirmez votre mot de passe :
                </label>
                <input
                    value={passwordVerify}
                    type="password"
                    onChange={(e) => {setPasswordVerify(e.target.value)}}
                    placeholder="Retapez votre mot de passe"
                    required
                    id="input_password_verify"
                    className="form-input"
                    autoComplete="off"
                />
            </div>

            <div className="input-group">
                <label htmlFor="input_passphrase" className="input-label">
                    <span className="label-icon">🔑</span>
                    Votre passphrase :
                </label>
                <input
                    value={passphrase}
                    type="text"
                    onChange={(e) => {setPassphrase(e.target.value)}}
                    placeholder="Phrase secrète pour récupérer votre mot de passe"
                    required
                    id="input_passphrase"
                    className="form-input"
                    autoComplete="off"
                />
                <small className="input-help">Utilisez une phrase facile à retenir</small>
            </div>

            <div className="input-group">
                <label htmlFor="input_passphrase_question" className="input-label">
                    <span className="label-icon">❓</span>
                    Question pour la passphrase :
                </label>
                <input
                    value={passphraseQuestion}
                    type="text"
                    onChange={(e) => {setPassphraseQuestion(e.target.value)}}
                    placeholder="Ex: Quel est le nom de votre premier animal ?"
                    id="input_passphrase_question"
                    className="form-input"
                    autoComplete="off"
                />
                <small className="input-help">Optionnel : aide à mémoriser votre passphrase</small>
            </div>

            <div className="form-actions">
                <button disabled={loading} onClick={login_function} className="submit-btn">
                    {loading ? (
                        <span className="btn-content">
                            <span className="spinner"></span>
                            Chargement...
                        </span>
                    ) : (
                        <span className="btn-content">
                            <span className="btn-icon">🚀</span>
                            Soumettre le formulaire
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

const ConnectComponent = ({
    email, setEmail, phone, setPhone,
    password, setPassword, loading,
    login_function
}) => {
    return (
        <div className="form-group">
            <div className="input-group">
                <label htmlFor="input_email" className="input-label">
                    <span className="label-icon">📧</span>
                    Votre email :
                </label>
                <input
                    value={email}
                    type="email"
                    onChange={(e) => {setEmail(e.target.value)}}
                    placeholder="jean.dupont@example.com"
                    id="input_email"
                    className="form-input"
                    autoComplete="email"
                />
            </div>

            <div className="input-group">
                <label htmlFor="input_phone" className="input-label">
                    <span className="label-icon">📱</span>
                    Votre téléphone :
                </label>
                <input
                    value={phone}
                    type="tel"
                    onChange={(e) => {setPhone(e.target.value)}}
                    placeholder="0102030405"
                    id="input_phone"
                    className="form-input"
                    autoComplete="tel"
                />
                <small className="input-help">Remplissez l'email ou le téléphone</small>
            </div>

            <div className="input-group">
                <label htmlFor="input_password" className="input-label">
                    <span className="label-icon">🔒</span>
                    Votre mot de passe :
                </label>
                <input
                    value={password}
                    type="password"
                    onChange={(e) => {setPassword(e.target.value)}}
                    placeholder="Votre mot de passe"
                    required
                    id="input_password"
                    className="form-input"
                    autoComplete="current-password"
                />
            </div>

            <div className="reset-link-container">
                <Link to={RESET} className="reset-link">
                    🔐 Mot de passe oublié ?
                </Link>
            </div>

            <div className="form-actions">
                <button disabled={loading} onClick={login_function} className="submit-btn">
                    {loading ? (
                        <span className="btn-content">
                            <span className="spinner"></span>
                            Connexion en cours...
                        </span>
                    ) : (
                        <span className="btn-content">
                            <span className="btn-icon">🔓</span>
                            Se connecter
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

function Login(){
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [response, setResponse] = useState({});
    const [nom, setNom] = useState("");
    const [prenom, setPrenom] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [passphrase, setPassphrase] = useState("");
    const [passphraseQuestion, setPassphraseQuestion] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVerify, setPasswordVerify] = useState("");
    const [connect, setConnect] = useState(true);
    const navigate = useNavigate();
    
    const login_function = async function () {
        try{
            setLoading(true);
            setError("");
            let can;
            if (!connect){
                can = (
                    password.length >= 8  && password.length < 60 && 
                    passwordVerify.length >= 8 &&
                    password === passwordVerify  &&
                    nom.trim() != "" && prenom.trim() != "" &&
                    passphrase.trim() != ""
                );
                can = can && email.trim() && email.includes("@") &&
                email.includes(".")  && phone.trim() && 
                phone.trim().length === 10;
            }
            else {
                can = (
                    password.length >= 8  && password.length < 60 
                );
                can = can && (
                    (email.trim() && email.includes("@") && email.includes(".")) ||
                    (phone.trim() && phone.trim().length === 10)
                );
            }
            if (can){
                let json_data = {
                    "nom": nom,
                    "prenom": prenom,
                    "phone": phone,
                    "password": password,
                    "passphrase": passphrase,
                    "passphrase_question": passphraseQuestion,
                    "email": email,
                    "connect": connect
                };
                let data = await login(json_data);
                let json = data.response;
                if (!data.ok){
                    let detail = json?.detail || `Erreur lors de ${connect ? "la connexion": "l'inscription"}`;
                    let detail_map = MAPPER[detail] || detail;
                    throw new Error(`Erreur dans le login, detail = ${detail_map}`);
                }
                
                setPassword("");
                setPasswordVerify("");
                setResponse(json);
                return json;
            }
            else {
                let msg = "";
                
                if (!(password.length >= 8 && passwordVerify.length >= 8)) {
                    msg += "\n❌ Mot de passe trop court, au moins 8 caractères !";
                }
                if (password.length >= 60) {
                    msg += "\n❌ Mot de passe trop long !";
                }
                if (!(password === passwordVerify)) {
                    msg += "\n❌ Mots de passe incohérents !";
                }
                if (!nom.trim()) {
                    msg += "\n❌ Nom requis !";
                }
                if (!prenom.trim()) {
                    msg += "\n❌ Prénom requis !";
                }
                if (!passphrase.trim()) {
                    msg += "\n❌ Phrase secrète requise !";
                }
                if (!connect) {
                    if (!email.trim() || !email.includes("@") || !email.includes(".")) {
                        msg += "\n❌ Email invalide !";
                    }
                    if (!phone.trim() || phone.trim().length !== 10) {
                        msg += "\n❌ Téléphone invalide (10 chiffres) !";
                    }
                } else {
                    const hasEmail = email.trim() && email.includes("@") && email.includes(".");
                    const hasPhone = phone.trim() && phone.trim().length === 10;
                    if (!hasEmail && !hasPhone) {
                        msg += "\n❌ Email ou téléphone valide requis !";
                    }
                }
                throw new Error(msg);
            }
        }
        catch(err){
            console.log("Erreur : ", err, err.message);
            setError(err.message);
            setResponse({});
        }
        finally{
            setLoading(false);
        }
    };

    
    return(
        <div className="login-container" id="root_div_login">
            <div className="welcome-section" id="bienvenue_div_login">
                <div className="welcome-icon">🌟</div>
                <h2 className="welcome-title h2_bienvenu_login">
                    Bienvenue sur MentorLink
                </h2>
                <h3 className="welcome-subtitle h3_bienvenu_login">
                {connect ? "Connectez-vous à votre compte" : "Créez votre compte et commencez l'aventure"}
                </h3>
            </div>

            <div className="form-container" id="login_div">
                <div className="form-header">
                    <div className="form-tabs">
                        <button 
                            className={`tab-btn ${connect ? 'active' : ''}`}
                            onClick={() => setConnect(true)}
                            type="button"
                        >
                            <span className="tab-icon">🔐</span>
                            Connexion
                        </button>
                        <button 
                            className={`tab-btn ${!connect ? 'active' : ''}`}
                            onClick={() => setConnect(false)}
                            type="button"
                        >
                            <span className="tab-icon">📝</span>
                            Inscription
                        </button>
                    </div>
                </div>
                
                <div className="form-body">
                    {connect ? (
                        <ConnectComponent 
                            email={email}
                            setEmail={setEmail}
                            phone={phone}
                            setPhone={setPhone}
                            password={password}
                            setPassword={setPassword}
                            loading={loading}
                            login_function={login_function}
                        />
                    ) : (
                        <LoginComponent 
                            nom={nom}
                            setNom={setNom}
                            prenom={prenom}
                            setPrenom={setPrenom}
                            email={email}
                            setEmail={setEmail}
                            phone={phone}
                            setPhone={setPhone}
                            password={password}
                            setPassword={setPassword}
                            passwordVerify={passwordVerify}
                            setPasswordVerify={setPasswordVerify}
                            passphrase={passphrase}
                            setPassphrase={setPassphrase}
                            passphraseQuestion={passphraseQuestion}
                            setPassphraseQuestion={setPassphraseQuestion}
                            loading={loading}
                            login_function={login_function}
                        />
                    )}
                </div>
            </div>
            
            <div className="response-area">
                <ShowResponse 
                    response={response} 
                    error={error} 
                    phone={phone} 
                    email={email} 
                    navigate={navigate}
                    connect={connect}
                />
            </div>
        </div>
    );
}

export default Login;