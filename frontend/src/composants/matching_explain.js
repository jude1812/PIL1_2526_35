import "./matching_explain.css";

function MatchingExplain() {
    return (
        <div className="matching-explain-container">
            {/* ── En-tête ── */}
            <div className="page-header">
                <div className="header-icon">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                        <path d="M17 8l2 2 4-4"/>
                    </svg>
                </div>
                <h2>Algorithme de matching</h2>
                <p>Comment MentorLink trouve les paires mentor-mentoré les plus compatibles.<br />
                    Chaque paire reçoit un <strong>score sur 100</strong> calculé à partir de quatre critères indépendants.
                </p>
            </div>

            {/* ── Vue d'ensemble des critères ── */}
            <p className="section-label">Vue d'ensemble des critères</p>
            <section className="criteres">
                <div className="card">
                    <div className="crit-container">
                        <div className="crit-row">
                            <div className="crit-num c1">1</div>
                            <div className="crit-info">
                                <p>Compétences du candidat couvrant vos faiblesses</p>
                                <div className="bar-bg"><div className="bar-fill c1"></div></div>
                            </div>
                            <div className="crit-pts">max 40 pts</div>
                        </div>
                        <div className="crit-row">
                            <div className="crit-num c2">2</div>
                            <div className="crit-info">
                                <p>Disponibilités du candidat englobant les vôtres</p>
                                <div className="bar-bg"><div className="bar-fill c2"></div></div>
                            </div>
                            <div className="crit-pts">max 30 pts</div>
                        </div>
                        <div className="crit-row">
                            <div className="crit-num c3">3</div>
                            <div className="crit-info">
                                <p>Même filière</p>
                                <div className="bar-bg"><div className="bar-fill c3"></div></div>
                            </div>
                            <div className="crit-pts">max 20 pts</div>
                        </div>
                        <div className="crit-row">
                            <div className="crit-num c4">4</div>
                            <div className="crit-info">
                                <p>Même niveau</p>
                                <div className="bar-bg"><div className="bar-fill c4"></div></div>
                            </div>
                            <div className="crit-pts">max 10 pts</div>
                        </div>
                    </div>
                    <div className="divider"></div>
                    <div className="total-row">
                        <h4>Score total</h4>
                        <span>100 pts</span>
                    </div>
                </div>
            </section>

            {/* ── Formule générale ── */}
            <p className="section-label">Formule générale</p>
            <section className="explication">
                <div className="card">
                    <div className="formule">
                        <p>Le score total est la somme de quatre sous-scores indépendants :</p>
                        <div className="formula-box">
                            Score total = Score_compétences + Score_dispos + Score_filière + Score_niveau
                        </div>
                        <p>Chaque sous-score a un maximum fixé. Le total ne peut jamais dépasser <strong>100 pts</strong>.</p>
                    </div>
                </div>
            </section>

            {/* ── Calcul de chaque sous-score ── */}
            <p className="section-label">Calcul de chaque sous-score</p>
            <section className="calcul">
                <div className="card" style={{ padding: 0 }}>

                    {/* Critère 1 */}
                    <div className="cal-block">
                        <div className="cal-header">
                            <div className="crit-num c1">1</div>
                            <h5>Score des compétences</h5>
                            <span className="badge c1">max 40 pts</span>
                        </div>
                        <p>On compte combien de <strong>vos faiblesses</strong> sont couvertes par les <strong>compétences fortes du candidat</strong>. Chaque couverture rapporte 10 points.</p>
                        <div className="formula-box">
                            Score_compétences = (compétences fortes du candidat couvrant vos faiblesses) × 10 (max 40)
                        </div>
                        <p className="note">Exemple : vous êtes faible en Python, SQL et Java. Le candidat est fort en Python et SQL → 2 × 10 = <strong>20 pts</strong></p>
                    </div>

                    {/* Critère 2 */}
                    <div className="cal-block">
                        <div className="cal-header">
                            <div className="crit-num c2">2</div>
                            <h5>Score des disponibilités</h5>
                            <span className="badge c2">max 30 pts</span>
                        </div>
                        <p>On identifie les créneaux du candidat qui <strong>englobent complètement les vôtres</strong> (même jour, début ≤, fin ≥). Chaque créneau englobant rapporte 10 points.</p>
                        <div className="formula-box teal">
                            Score_dispos = (créneaux du candidat englobant les vôtres) × 10 (max 30)
                        </div>
                        <p className="note">Exemple : vous êtes disponible le lundi 14h-16h. Le candidat est disponible le lundi 13h-17h → créneau englobant → <strong>10 pts</strong></p>
                    </div>

                    {/* Critère 3 */}
                    <div className="cal-block">
                        <div className="cal-header">
                            <div className="crit-num c3">3</div>
                            <h5>Score de filière</h5>
                            <span className="badge c3">max 20 pts</span>
                        </div>
                        <p>On attribue des points fixes selon la filière.</p>
                        <div className="formula-box amber">
                            Même filière → 20 pts<br />
                            Filières différentes → 0 pt
                        </div>
                        <p className="note">Exemple : vous êtes en IA, le candidat est en IA → <strong>20 pts</strong></p>
                    </div>

                    {/* Critère 4 */}
                    <div className="cal-block">
                        <div className="cal-header">
                            <div className="crit-num c4">4</div>
                            <h5>Score de niveau</h5>
                            <span className="badge c4">max 10 pts</span>
                        </div>
                        <p>On attribue des points fixes selon le niveau d'études.</p>
                        <div className="formula-box amber">
                            Même niveau → 10 pts<br />
                            Niveaux différents → 0 pt
                        </div>
                        <p className="note">Exemple : vous êtes en L2, le candidat est en L2 → <strong>10 pts</strong></p>
                    </div>

                </div>
            </section>

            {/* ── Exemple complet pas à pas ── */}
            <p className="section-label">Exemple complet pas à pas</p>
            <section className="exemple">
                <div className="card">
                    <div className="profiles-row">
                        <div className="profile-card">
                            <div className="profile-head">
                                <div className="avatar candidat">KA</div>
                                <div className="profile-head-info">
                                    <strong>Kofi · Candidat</strong>
                                    <span>IA · L2</span>
                                </div>
                            </div>
                            <div className="label">Compétences fortes</div>
                            <div className="tags">
                                <span className="tag match">Python</span>
                                <span className="tag match">SQL</span>
                                <span className="tag match">Statistiques</span>
                            </div>
                            <div className="label">Ses créneaux (4)</div>
                            <div className="dispo">Lun 13h-17h · Mer 10h-12h<br />Ven 8h-10h · Sam 9h-11h</div>
                        </div>

                        <div className="vs-icon">⇄</div>

                        <div className="profile-card">
                            <div className="profile-head">
                                <div className="avatar vous">AM</div>
                                <div className="profile-head-info">
                                    <strong>Ama · Vous</strong>
                                    <span>IA · L1</span>
                                </div>
                            </div>
                            <div className="label">Vos faiblesses (3)</div>
                            <div className="tags">
                                <span className="tag match">Python</span>
                                <span className="tag match">SQL</span>
                                <span className="tag no">Infographie</span>
                            </div>
                            <div className="label">Vos créneaux (2)</div>
                            <div className="dispo">Lun 14h-16h · Ven 8h-9h</div>
                        </div>
                    </div>

                    <div className="divider"></div>

                    <div className="calc-rows">
                        <div className="calc-row">
                            <span className="calc-label">Vos faiblesses couvertes : Python, SQL (2 couvertures)</span>
                            <span className="calc-val c1">2 × 10 = 20 pts</span>
                        </div>
                        <div className="calc-row">
                            <span className="calc-label">Créneaux du candidat englobant les vôtres : Lun 13h-17h (englobe 14h-16h), Ven 8h-10h (englobe 8h-9h) → 2 créneaux</span>
                            <span className="calc-val c2">2 × 10 = 20 pts</span>
                        </div>
                        <div className="calc-row">
                            <span className="calc-label">Même filière IA</span>
                            <span className="calc-val c3">20 pts</span>
                        </div>
                        <div className="calc-row">
                            <span className="calc-label">Niveaux différents L1 / L2</span>
                            <span className="calc-val c4">0 pt</span>
                        </div>
                    </div>

                    <div className="divider"></div>

                    <div className="score-final">
                        <div>
                            <div className="score-label">Score final : 20 + 20 + 20 + 0</div>
                            <div className="score-value">60 / 100</div>
                        </div>
                        <span className="badge c2" style={{ fontSize: "13px", padding: "6px 14px" }}>Moyenne compatibilité</span>
                    </div>
                </div>
            </section>

            {/* ── Niveaux de compatibilité ── */}
            <p className="section-label">Niveaux de compatibilité</p>
            <section className="conclusion">
                <div className="niveaux-grid">
                    <div className="niveau-card nv1">
                        <div className="nv-score">0 – 39</div>
                        <div className="nv-label">Faible</div>
                    </div>
                    <div className="niveau-card nv2">
                        <div className="nv-score">40 – 59</div>
                        <div className="nv-label">Moyenne</div>
                    </div>
                    <div className="niveau-card nv3">
                        <div className="nv-score">60 – 79</div>
                        <div className="nv-label">Bonne</div>
                    </div>
                    <div className="niveau-card nv4">
                        <div className="nv-score">80 – 100</div>
                        <div className="nv-label">Excellente</div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default MatchingExplain;