import "./messages.css";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    searchUser, 
    getConversationsUsers as _getConversationsUsers,
    getConversation as _getConversation,
    markConversationRead,
    refreshToken as _refreshToken,
    sendFileByWS
} from "./hooks/fetch_functions";
import { LOGIN } from "./hooks/nav_path";
import { BACKEND_PROFILE_IMGS_URL, DEFAULT_AVATAR, WS_MSG, BACKEND_UPLOAD_WS_DIR } from "./hooks/fetch_functions";
import CandidatModal from "./candidat_modal";

const refreshToken = async (user_session_id, token, salt, navigate) => {
    console.log("🔄 Refresh token enclenché !");
    let response = await _refreshToken({
        "user_session_id": user_session_id.current,
        "key": salt.current,
        "token": token.current
    });
    
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
}

// Composant d'affichage des messages
const ShowMessages = ({ messages, activeChat, user }) => {
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleFileClick = (fileUrl) => {
        window.open(fileUrl, '_blank');
    };

    return (
        <div className="chat-messages">
            {messages.length === 0 ? (
                <div className="no-messages">💬 Aucun message. Commencez la conversation !</div>
            ) : (
                messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                        <div key={idx} className={`message ${isMe ? "sent" : "received"}`}>
                            {!isMe && (
                                <img
                                    src={activeChat?.img_path ? `${BACKEND_PROFILE_IMGS_URL}/${activeChat.img_path}` : DEFAULT_AVATAR}
                                    alt=""
                                    className="msg-avatar"
                                />
                            )}
                            <div className="message-bubble">
                                {msg.is_link ? (
                                    <div className="file-message">
                                        📎 Fichier partagé
                                        <div className="file-links">
                                            {msg.contenu.split("####_####").map((file, i) => {
                                                const [filename, original] = file.split("#__#");
                                                const fileUrl = `${BACKEND_UPLOAD_WS_DIR}/${filename}`;
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleFileClick(fileUrl)}
                                                        className="file-link-btn"
                                                    >
                                                        📖 {original || filename}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    msg.contenu
                                )}
                                <span className="message-time">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};

function Messages() {
    const user_session_id = useRef(null);
    const token = useRef(null);
    const salt = useRef(null);
    const user_phone = useRef(null);
    const user_email = useRef(null);
    const [error, setError] = useState("");
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState("");
    const navigate = useNavigate();
    const wsRef = useRef(null);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState("");

    const [convUsers, setConvUsers] = useState([]);
    const [getUsersError, setGetUsersError] = useState("");

    const [activeChat, setActiveChat] = useState(null);
    const activeChatRef = useRef(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileUser, setProfileUser] = useState(null);
    const [conversation, setConversation] = useState([]);

    const [connected, setConnected] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [files, setFiles] = useState([]);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(true);

    const setData = () => {
        user_session_id.current = sessionStorage.getItem("user_session_id");
        token.current = sessionStorage.getItem("token");
        salt.current = sessionStorage.getItem("salt");
        user_email.current = sessionStorage.getItem("user_email");
        user_phone.current = sessionStorage.getItem("user_phone");
        return [user_email, user_phone, user_session_id, salt, token].every(value => value?.current !== null);
    };

    const getUser = async () => {
        let response = await searchUser({
            email: user_email.current,
            phone: user_phone.current,
            token: token.current,
            key: salt.current,
        });

        if (!response.ok) {
            setError(response.response?.detail || "Utilisateur non trouvé");
            return;
        }
        setUser(response.response.user);
    };

    useEffect(() => {
        if (!setData()) {
            navigate(LOGIN);
            return;
        }
        getUser();
    }, []);

    useEffect(() => {
        if (user == null) return;
        let nom = user.nom;
        let prenom = user.prenom;
        setUsername(`${nom}_${prenom.split(" ").join("_")}`);
    }, [user]);

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setSearchError("Veuillez entrer un email ou un téléphone");
            return;
        }

        if (!searchTerm.includes("@")) {
            if (searchTerm.length !== 10) {
                setSearchError("Numéro invalide (10 chiffres requis)");
                return;
            }
            if (isNaN(parseInt(searchTerm))) {
                setSearchError("Numéro invalide, chiffres attendus");
                return;
            }
        }

        setSearchLoading(true);
        setSearchError("");
        setSearchResult(null);

        try {
            const isEmail = searchTerm.includes("@");
            const response = await searchUser({
                email: isEmail ? searchTerm : "",
                phone: !isEmail ? searchTerm : "",
                token: token.current,
                key: salt.current
            });

            if (response.ok && response.response?.user) {
                const foundUser = response.response.user;
                if (foundUser.email === user_email.current || foundUser.phone === user_phone.current) {
                    setSearchError("C'est vous-même !");
                } else {
                    setSearchResult(foundUser);
                }
            } else {
                setSearchError("Utilisateur non trouvé");
            }
        } catch (err) {
            setSearchError("Erreur lors de la recherche");
        } finally {
            setSearchLoading(false);
        }
    };

    const getConversationUsers = async () => {
        let response = await _getConversationsUsers({
            phone: user_phone.current,
            email: user_email.current,
            token: token.current,
            key: salt.current,
            password: ""
        });
        
        let json = response.response;
        if (!response.ok || response.error) {
            if (json?.detail === "TOKEN_EXPIRED") {
                const refreshed = await refreshToken(user_session_id, token, salt, navigate);
                if (refreshed) return await getConversationUsers();
            }
            setGetUsersError(json?.detail || "Erreur lors de l'obtention de la liste");
        }
        setConvUsers(response.response?.users || []);
    };

    useEffect(() => {
        if (user_email.current && user_phone.current && token.current) {
            getConversationUsers();
        }
    }, [user, token.current]);

    const getConversation = async () => {
        if (!activeChatRef.current) return;
        
        let response = await _getConversation({
            sender_phone: activeChatRef.current.phone,
            sender_email: activeChatRef.current.email,
            password: "",
            receiver_phone: user_phone.current,
            receiver_email: user_email.current,
            token: token.current,
            key: salt.current
        });
        let json = response.response;
        if (!response.ok || response.error) {
            if (json?.detail === "TOKEN_EXPIRED") {
                const refreshed = await refreshToken(user_session_id, token, salt, navigate);
                if (refreshed) return await getConversation();
            }
            console.error("Erreur getConversation:", json?.detail);
        }
        setConversation(json?.messages || []);
    };

    const startConversation = async (chatUser) => {
        setActiveChat(chatUser);
        activeChatRef.current = chatUser;
        
        let response = await markConversationRead({
            sender_phone: chatUser.phone,
            sender_email: chatUser.email,
            password: "",
            receiver_phone: user_phone.current,
            receiver_email: user_email.current,
            token: token.current,
            key: salt.current
        });
        
        let json = response.response;
        if (!response.ok || response.error) {
            if (json?.detail === "TOKEN_EXPIRED") {
                const refreshed = await refreshToken(user_session_id, token, salt, navigate);
                if (refreshed) return await startConversation(chatUser);
            }
        }
        
        await getConversation();
        await getConversationUsers();
    };

    const viewProfile = (chatUser) => {
        setProfileUser(chatUser);
        setShowProfileModal(true);
    };

    const handleWebSocketMessage = async (event) => {
        const data = JSON.parse(event.data);
        //console.log("📨 Message reçu:", data);
        if (data.type === "for_user" || data.type === "file_send") {
            await getConversation();
            await getConversationUsers();
        }
    };

    const sendMessage = async () => {
        
        if (!newMessage.trim() || !activeChat) return;
        if (wsRef.current) {
            wsRef.current.send(JSON.stringify({
                from: username,
                to: `${activeChat.nom}_${activeChat.prenom.split(" ").join("_")}`,
                message: newMessage,
                type: "for_user",
                sender_id: user.id,
                receiver_id: activeChat.id,
                is_link: false
            }));
            await getConversation();
            setNewMessage("");
        }
    };

    const uploadFiles = async () => {
        if (!files || files.length === 0 || !activeChat) return;
        
        setUploadLoading(true);
        setUploadSuccess(false);
        
        let form = new FormData();
        Array.from(files).forEach((val) => {
            form.append("files", val);
        });
        form.append("json_data", JSON.stringify({
            "from": username,
            "to": `${activeChat.nom}_${activeChat.prenom.split(" ").join("_")}`,
            "sender_id": user?.id,
            "receiver_id": activeChat.id
        }));
        
        let response = await sendFileByWS(form);
        if (response.ok && response.response?.success) {
            setUploadSuccess(true);
            setFiles([]);
            await getConversation();
        } else {
            setUploadSuccess(false);
        }
        setUploadLoading(false);
    };

    // WebSocket initialization
    useEffect(() => {
        if (!username || !token.current) return;
        
        const wsUrl = `${WS_MSG}?username=${encodeURIComponent(username)}&user_session_id=${user_session_id.current}`;
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            console.log("✅ WebSocket connecté");
            setConnected(true);
        };
        
        ws.onclose = () => {
            console.log("❌ WebSocket déconnecté");
            setConnected(false);
        };
        
        ws.onerror = (error) => {
            console.error("WebSocket erreur:", error);
        };
        
        ws.onmessage = handleWebSocketMessage;
        
        wsRef.current = ws;
        
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [username, token.current]);

    useEffect(() => {
        getConversationUsers();
        const interval = setInterval(() => {
            getConversationUsers();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeChat) {
            getConversation();
        }
    }, [activeChat]);

    if (!setData()) {
        return <div className="messages-loading">🔒 Veuillez vous connecter</div>;
    }

    return (
        <div className="messages-container">
            {/* Colonne gauche */}
            <div className="messages-sidebar">
                <div className="search-section">
                    <h3>🔍 Rechercher</h3>
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Email ou téléphone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            className="search-input"
                        />
                        <button onClick={handleSearch} disabled={searchLoading} className="search-btn">
                            {searchLoading ? "..." : "🔍"}
                        </button>
                    </div>
                    {searchError && <div className="search-error">{searchError}</div>}
                    
                    {searchResult && (
                        <div className="search-result">
                            <div className="search-result-user" onClick={() => startConversation(searchResult)}>
                                <img
                                    src={searchResult.img_path ? `${BACKEND_PROFILE_IMGS_URL}/${searchResult.img_path}` : DEFAULT_AVATAR}
                                    alt=""
                                    className="result-avatar"
                                />
                                <div className="result-info">
                                    <span className="result-name">{searchResult.prenom} {searchResult.nom}</span>
                                    <span className="result-email">{searchResult.email}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="conversations-section">
                    <h3>
                        💬 Conversations
                        {connected && <span className="online-dot"> 🟢</span>}
                    </h3>
                    <div className="conversations-list">
                        {convUsers.length === 0 ? (
                            <div className="no-conversations">Aucune conversation</div>
                        ) : (
                            convUsers.map(([convUser, unreadCount], idx) => (
                                <div
                                    key={idx}
                                    className={`conversation-item ${activeChat?.id === convUser.id ? "active" : ""}`}
                                    onClick={() => startConversation(convUser)}
                                >
                                    <img
                                        src={convUser.img_path ? `${BACKEND_PROFILE_IMGS_URL}/${convUser.img_path}` : DEFAULT_AVATAR}
                                        alt=""
                                        className="conv-avatar"
                                    />
                                    <div className="conv-info">
                                        <span className="conv-name">{convUser.prenom} {convUser.nom}</span>
                                        <span className="conv-meta">{convUser.filiere || "N/A"}</span>
                                    </div>
                                    {unreadCount > 0 && activeChat?.id !== convUser.id && (
                                        <span className="conv-unread">{unreadCount}</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Colonne droite - Chat */}
            <div className="messages-chat">
                {activeChat ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-user-info">
                                <img
                                    src={activeChat.img_path ? `${BACKEND_PROFILE_IMGS_URL}/${activeChat.img_path}` : DEFAULT_AVATAR}
                                    alt=""
                                    className="chat-avatar"
                                />
                                <div>
                                    <h3>
                                        {activeChat.prenom} {activeChat.nom}
                                        {connected && <span className="user-online-dot"> 🟢</span>}
                                    </h3>
                                    <p>{activeChat.filiere || "N/A"} • {activeChat.level || "N/A"}</p>
                                </div>
                            </div>
                            <button 
                                className="view-profile-btn" 
                                onClick={() => viewProfile(activeChat)}
                            >
                                👤 Voir profil
                            </button>
                            <button 
                                className="close-chat-btn" 
                                onClick={() => {
                                    setActiveChat(null);
                                    activeChatRef.current = null;
                                }}
                            >
                                ✕ Fermer la conversation
                            </button>
                        </div>

                        <ShowMessages 
                            messages={conversation} 
                            activeChat={activeChat}
                            user={user}
                        />

                        <div className="file-upload-area">
                            <input
                                type="file"
                                multiple
                                onChange={(e) => setFiles(e.target.files)}
                                className="file-input"
                                id="file-input"
                            />
                            <label htmlFor="file-input" className="file-label">📎 Choisir fichiers</label>
                            {files.length > 0 && (
                                <button onClick={uploadFiles} disabled={uploadLoading} className="upload-btn">
                                    {uploadLoading ? "⏳ Envoi..." : `📤 Envoyer (${files.length})`}
                                </button>
                            )}
                            {uploadSuccess && files.length === 0 && uploadLoading === false && (
                                <span className="upload-success">✅ Envoyé</span>
                            )}
                        </div>

                        <div className="chat-input-area">
                            <textarea
                                placeholder="Écrivez votre message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                                rows={1}
                            />
                            <button onClick={sendMessage} disabled={!newMessage.trim()} className="send-btn">
                                📤 Envoyer
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        💬 Sélectionnez une conversation pour commencer à discuter
                    </div>
                )}
            </div>

            {/* Modale profil */}
            {showProfileModal && profileUser && (
                <CandidatModal
                    candidat={profileUser}
                    onClose={() => setShowProfileModal(false)}
                />
            )}
        </div>
    );
}

export default Messages;