import "./home.css";
import { useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            {/* Header */}
            <header className="home-header">
                <div className="logo">
                    <div className="logo-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                    </div>
                    <div>
                        <span className="logo-text">MentorLink</span>
                        <span className="logo-sub">IFRI</span>
                    </div>
                </div>
                <div className="header-btns">
                    <button className="btn-outline" onClick={() => navigate("/login")}>Connexion</button>
                    <button className="btn-primary" onClick={() => navigate("/login")}>S'inscrire</button>
                </div>
            </header>

            {/* Hero */}
            <section className="hero">
                <span className="badge">Plateforme de mentorat étudiant — IFRI 2025/2026</span>
                <h1 className="hero-title">Trouve ton<br />mentor. Partage<br />tes <span>compétences</span>.</h1>
                <p className="hero-desc">
                    MentorLink connecte les étudiants de l'IFRI pour favoriser le partage de connaissances 
                    et l'entraide académique. Rejoins une communauté active de mentors et mentorés.
                </p>
                <div className="hero-btns">
                    <button className="btn-lg btn-primary" onClick={() => navigate("/login")}>Créer un compte</button>
                    <button className="btn-lg btn-outline" onClick={() => navigate("/login")}>Se connecter</button>
                </div>
            </section>

            {/* Stats */}
            <section className="stats">
                <div className="stat-item">
                    <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                    <span className="stat-text">5 filières connectées</span>
                </div>
                <div className="stat-item">
                    <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                    <span className="stat-text">Algorithme de matching intelligent</span>
                </div>
                <div className="stat-item">
                    <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <span className="stat-text">100% gratuit pour les étudiants IFRI</span>
                </div>
            </section>

            {/* Features */}
            <section className="features">
                <h2 className="section-title">Fonctionnalités principales</h2>

                <div className="feature-card">
                    <div className="feature-icon-box icon-purple">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                    <h3 className="feature-title">Profil personnalisé</h3>
                    <p className="feature-desc">Crée ton profil avec tes compétences, ton niveau et tes disponibilités pour un matching optimal.</p>
                </div>

                <div className="feature-card">
                    <div className="feature-icon-box icon-green">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </div>
                    <h3 className="feature-title">Matching automatique</h3>
                    <p className="feature-desc">Notre algorithme te propose les meilleurs mentors ou mentorés selon tes besoins.</p>
                </div>

                <div className="feature-card">
                    <div className="feature-icon-box icon-orange">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                        </svg>
                    </div>
                    <h3 className="feature-title">Messagerie intégrée</h3>
                    <p className="feature-desc">Communique facilement via notre système de messagerie sécurisé en temps réel.</p>
                </div>
            </section>

            {/* How it works */}
            <section className="how-it-works">
                <h2 className="section-title">Comment ça marche</h2>
                <div className="step-card">
                    <div className="step-number">1</div>
                    <span className="step-text">Crée ton profil</span>
                </div>
                <div className="step-card">
                    <div className="step-number">2</div>
                    <span className="step-text">Publie ou cherche</span>
                </div>
                <div className="step-card">
                    <div className="step-number">3</div>
                    <span className="step-text">Reçois les matchings</span>
                </div>
                <div className="step-card">
                    <div className="step-number">4</div>
                    <span className="step-text">Lance ta session</span>
                </div>
            </section>

            {/* CTA */}
            <section className="cta">
                <h2 className="cta-title">Prêt à rejoindre la communauté IFRI MentorLink ?</h2>
                <p className="cta-desc">Inscris-toi gratuitement et commence à partager tes connaissances dès aujourd'hui.</p>
                <div className="cta-btns">
                    <button className="btn-lg btn-outline" onClick={() => navigate("/login")}>Se connecter</button>
                    <button className="btn-lg btn-primary" onClick={() => navigate("/login")}>S'inscrire maintenant</button>
                </div>
            </section>
        </div>
    );
}

export default Home;