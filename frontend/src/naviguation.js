import "./naviguation.css";
import { Link, Route, Routes } from "react-router-dom";
import { useState } from "react";
import Login from "./composants/login";
import NotFound from "./composants/not_found";
import ProfileMe from "./composants/profile_me";
import ProfileOffre from "./composants/profile_offres";
import Reset from "./composants/reset";
import SearchUser from "./composants/search_user";
import Offers from "./composants/offres";
import Messages from "./composants/messages";
import RoutesInfo from "./composants/routes_info";
import Home from "./home";
import MatchingExplain from "./composants/matching_explain";

function Naviguation() {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    return (
        <div>
            <nav>
                <div className="menu-toggle" onClick={toggleMenu}>
                    <span className="menu-icon">{menuOpen ? "✕" : "☰"}</span>
                    <span className="menu-title">MentorLink</span>
                </div>
                <ul className={menuOpen ? 'open' : ''}>
                    <li>
                        <Link to="/" onClick={closeMenu}>
                            <span className="nav-icon">🏠</span>
                            <span className="nav-text">Accueil</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/login" onClick={closeMenu}>
                            <span className="nav-icon">🔐</span>
                            <span className="nav-text">Connexion / Inscription</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/me" onClick={closeMenu}>
                            <span className="nav-icon">👤</span>
                            <span className="nav-text">Mon profil</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/mes_offres" onClick={closeMenu}>
                            <span className="nav-icon">📊</span>
                            <span className="nav-text">Dashboard Offres & Matchings</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/offres" onClick={closeMenu}>
                            <span className="nav-icon">📋</span>
                            <span className="nav-text">Toutes les offres</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/search_user" onClick={closeMenu}>
                            <span className="nav-icon">🔍</span>
                            <span className="nav-text">Rechercher un utilisateur</span>
                            <span className="nav-badge">+ Score</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/messages" onClick={closeMenu}>
                            <span className="nav-icon">💬</span>
                            <span className="nav-text">Messages</span>
                            <span className="nav-badge">📨</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/reset" onClick={closeMenu}>
                            <span className="nav-icon">🔄</span>
                            <span className="nav-text">Réinitialisation</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/info" onClick={closeMenu}>
                            <span className="nav-icon">📖</span>
                            <span className="nav-text">Guide</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/matching-explain" onClick={closeMenu}>
                            <span className="nav-icon">📊</span>
                            <span className="nav-text">Comment ça match ?</span>
                        </Link>
                    </li>
                </ul>
            </nav>

            <div className="content-wrapper">
                <Routes>
                    <Route element={<Home />} path="/" />
                    <Route element={<Login />} path="/login" />
                    <Route element={<ProfileMe />} path="/me" />
                    <Route element={<ProfileOffre />} path="/mes_offres" />
                    <Route element={<Reset />} path="/reset" />
                    <Route element={<SearchUser />} path="/search_user" />
                    <Route element={<Offers />} path="/offres" />
                    <Route element={<Messages />} path="/messages" />
                    <Route element={<RoutesInfo />} path="/info" />
                    <Route element={<MatchingExplain />} path="/matching-explain" />
                    <Route element={<NotFound />} path="*" />
                </Routes>
            </div>
        </div>
    );
}

export default Naviguation;