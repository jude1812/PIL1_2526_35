export function passwordPrompt(message) {
    return new Promise((resolve) => {
        // Créer l'overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.2s ease;
        `;
        
        // Styles d'animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
        
        // Créer la modale
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: var(--card-bg, rgba(26, 31, 58, 0.95));
            backdrop-filter: blur(12px);
            border-radius: 28px;
            padding: 28px;
            min-width: 360px;
            max-width: 400px;
            width: 90%;
            border: 1px solid var(--glass-border, rgba(0, 212, 255, 0.3));
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, var(--primary, #8b5cf6), var(--secondary, #ec4899));
                    border-radius: 50%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 16px;
                ">
                    <span style="font-size: 28px;">🔐</span>
                </div>
                <h3 style="
                    margin: 0 0 8px 0;
                    color: var(--text-primary, white);
                    font-size: 1.3rem;
                    font-weight: 600;
                ">Confirmation requise</h3>
                <p style="
                    margin: 0;
                    color: var(--text-secondary, rgba(255,255,255,0.7));
                    font-size: 0.9rem;
                ">${message}</p>
            </div>
            
            <div style="margin-bottom: 24px;">
                <div style="
                    position: relative;
                    display: flex;
                    align-items: center;
                ">
                    <input type="password" id="password-input" placeholder="Mot de passe" style="
                        width: 100%;
                        padding: 14px 45px 14px 16px;
                        border-radius: 40px;
                        border: 2px solid var(--glass-border, rgba(255,255,255,0.2));
                        background: var(--input-bg, rgba(0,0,0,0.3));
                        color: var(--text-primary, white);
                        font-family: inherit;
                        font-size: 0.95rem;
                        transition: all 0.2s ease;
                        outline: none;
                        box-sizing: border-box;
                    " onfocus="this.style.borderColor='var(--primary, #8b5cf6)'; this.style.boxShadow='0 0 0 3px rgba(139,92,246,0.2)'"
                       onblur="this.style.borderColor='var(--glass-border, rgba(255,255,255,0.2))'; this.style.boxShadow='none'">
                    <button type="button" id="toggle-password" style="
                        position: absolute;
                        right: 12px;
                        background: none;
                        border: none;
                        cursor: pointer;
                        font-size: 1.1rem;
                        padding: 8px;
                        border-radius: 50%;
                        transition: background 0.2s;
                    " onmouseenter="this.style.background='rgba(255,255,255,0.1)'"
                       onmouseleave="this.style.background='transparent'">👁️</button>
                </div>
                <div id="password-error" style="
                    margin-top: 8px;
                    font-size: 0.75rem;
                    color: #ef4444;
                    min-height: 20px;
                "></div>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="cancel-btn" style="
                    padding: 10px 24px;
                    border-radius: 40px;
                    background: transparent;
                    border: 1px solid var(--glass-border, rgba(255,255,255,0.2));
                    color: var(--text-secondary, rgba(255,255,255,0.7));
                    cursor: pointer;
                    font-weight: 500;
                    font-family: inherit;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                " onmouseenter="this.style.background='rgba(239,68,68,0.2)'; this.style.color='#ef4444'; this.style.borderColor='rgba(239,68,68,0.5)'"
                   onmouseleave="this.style.background='transparent'; this.style.color='var(--text-secondary, rgba(255,255,255,0.7))'; this.style.borderColor='var(--glass-border, rgba(255,255,255,0.2))'">
                    Annuler
                </button>
                <button id="confirm-btn" style="
                    padding: 10px 28px;
                    border-radius: 40px;
                    background: linear-gradient(135deg, var(--primary, #8b5cf6), var(--secondary, #ec4899));
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-weight: 500;
                    font-family: inherit;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                " onmouseenter="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(139,92,246,0.4)'"
                   onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                    Confirmer
                </button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        const input = modal.querySelector('#password-input');
        const confirmBtn = modal.querySelector('#confirm-btn');
        const cancelBtn = modal.querySelector('#cancel-btn');
        const toggleBtn = modal.querySelector('#toggle-password');
        const errorDiv = modal.querySelector('#password-error');
        
        // Toggle password visibility
        let isPasswordVisible = false;
        toggleBtn.onclick = () => {
            isPasswordVisible = !isPasswordVisible;
            input.type = isPasswordVisible ? 'text' : 'password';
            toggleBtn.textContent = isPasswordVisible ? '🙈' : '👁️';
        };
        
        // Validation et soumission
        const showError = (msg) => {
            errorDiv.textContent = msg;
            input.style.borderColor = '#ef4444';
            input.style.animation = 'shake 0.3s ease';
            setTimeout(() => {
                input.style.animation = '';
            }, 300);
        };
        
        const clearError = () => {
            errorDiv.textContent = '';
            input.style.borderColor = '';
        };
        
        const handleConfirm = () => {
            const password = input.value;
            if (!password.trim()) {
                showError("❌ Mot de passe requis");
                input.focus();
                return;
            }
            cleanup();
            resolve(password);
        };
        
        const handleCancel = () => {
            cleanup();
            resolve(null);
        };
        
        confirmBtn.onclick = handleConfirm;
        cancelBtn.onclick = handleCancel;
        
        // Raccourcis clavier
        input.onkeydown = (e) => {
            clearError();
            if (e.key === 'Enter') {
                handleConfirm();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        };
        
        input.focus();
        
        // Nettoyage complet
        const cleanup = () => {
            overlay.remove();
            style.remove();
        };
        
        // Fermer en cliquant sur l'overlay
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                handleCancel();
            }
        };
    });
}