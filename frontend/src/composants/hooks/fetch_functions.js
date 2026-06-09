const BASE_URL = "http://localhost:9000";
const AUTH_PATH = "api/auth/login";
const ME_PATH = "api/users/me";
const REFRESH_TOKEN_PATH = "api/token/refresh_token";
const CHECK_EMAIL = "/check/email";
const CHECK_PHONE = "/check/phone";
const DELETE_SKILL_PATH = "api/users/delete_skill";
const DELETE_DISPO_PATH = "api/users/delete_dispo";
const UPDATE_EMAIL_PATH = "api/users/update/email";
const UPDATE_PHONE_PATH = "api/users/update/phone";
const UPDATE_GENERAL_PATH = "api/users/update/general";
const ADD_SKILL_PATH = "api/users/add_skill";
const ADD_DISPO_PATH = "api/users/add_dispo";
const GET_PASSPHRASE_QUESTION_PATH = "api/auth/get_passphrase_question";
const RESET_PASSWORD_PATH = "api/auth/reset-password";
const RESET_PASSPHRASE_PATH = "api/auth/reset-passphrase";
const SEARCH_USER_PATH = "api/users/search";
const COMPUTE_MATCHING_PATH = "api/matching/compute";
const UPLOAD_PROFILE_IMG_PATH = "api/upload/profile_img";
const ACTIVE_OFFRES_PATH = "api/offres/active";
const ALL_OFFRES_PATH = "api/offres/all";
const ADD_OFFRE_PATH = "api/users/add_offre";
const GET_CONVERSATIONS_USERS_PATH = "api/users/messages_user_with_me";
const GET_CONVERSATION_PATH = "api/users/messages";
const MARK_READ_PATH = "api/users/messages_make_read";
const GET_UNREAD_COUNT_PATH = "api/users/messages_unread_count";
const UPLOAD_FILE_WS = "api/upload/ws_file"
const RESPONSE_TO_OFFRE_PATH = "api/users/response_to_offre";
const DELETE_OFFRE_PATH = "api/users/delete_offre";
const DELETE_RESPONSE_PATH = "api/users/delete_response";
const ANSWER_TO_RESPONSE_PATH = "api/users/answer_to_response";

const _fetch_post = async (path, data) => {
    try{
        let res = await fetch(
            path,
            {
                "method": "POST",
                "body": JSON.stringify(data),
                "headers": {"Content-Type": "application/json"}
            }
        );
        return {
            "ok": res.ok,
            "response": await res.json(),
            "error": null
        }
    }
    catch(err){
        console.log("Erreur POST : ", err, err.message);
        return {
            "ok": false,
            "response": null,
            "error": err
        }
    }
};

const _fetch_get = async (path, query) => {
    try{
        let res = await fetch(
            `${path}${query ? "?" + query : ""}`,
            {
                "method": "GET",
            }
        );
        return {
            "ok": res.ok,
            "response": await res.json(),
            "error": null
        }
    }
    catch(err){
        console.log("Erreur GET : ", err, err.message);
        return {
            "ok": false,
            "response": null,
            "error": err
        }
    }
}


export const login = async (data) => {
    return await _fetch_post(`${BASE_URL}/${AUTH_PATH}`, data);
};

export const getMe = async (data) => {
    return await _fetch_post(`${BASE_URL}/${ME_PATH}`, data);
};

export const refreshToken = async (data) => {
    return await _fetch_post(`${BASE_URL}/${REFRESH_TOKEN_PATH}`, data);
}

export const updateUser = async (data) => {
    return await _fetch_post(`${BASE_URL}/${UPDATE_GENERAL_PATH}`, data)
}

export const updateEmail = async (data) => {
    return await _fetch_post(`${BASE_URL}/${UPDATE_EMAIL_PATH}`, data)
}

export const updatePhone = async (data) => {
    return await _fetch_post(`${BASE_URL}/${UPDATE_PHONE_PATH}`, data)
}

export const updateGeneral = async (data) => {
    return await _fetch_post(`${BASE_URL}/${UPDATE_GENERAL_PATH}`, data)
}

export const checkEmail = async (data) => {
    return await _fetch_get(`${BASE_URL}/${CHECK_EMAIL}`, data)
}

export const checkPhone = async (data) => {
    return await _fetch_get(`${BASE_URL}/${CHECK_PHONE}`, data)
}

export const deleteSkill = async (data) => {
    return await _fetch_post(`${BASE_URL}/${DELETE_SKILL_PATH}`, data)
}

export const deleteDispo = async (data) => {
    return await _fetch_post(`${BASE_URL}/${DELETE_DISPO_PATH}`, data)
}

export const addSkill = async (data) => {
    return await _fetch_post(`${BASE_URL}/${ADD_SKILL_PATH}`, data)
}

export const addDispo = async (data) => {
    return await _fetch_post(`${BASE_URL}/${ADD_DISPO_PATH}`, data)
}

export const resetPassword = async (data) => {
    return await _fetch_post(`${BASE_URL}/${RESET_PASSWORD_PATH}`, data);
}

export const resetPassphrase = async (data) => {
    return await _fetch_post(`${BASE_URL}/${RESET_PASSPHRASE_PATH}`, data);
}

export const getPassphraseQuestion = async (data) => {
    return await _fetch_post(`${BASE_URL}/${GET_PASSPHRASE_QUESTION_PATH}`, data);
}

export const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("salt");
    sessionStorage.removeItem("user_email");
    sessionStorage.removeItem("user_phone");
    sessionStorage.removeItem("user_session_id");
};

export const searchUser = async (data) => {
    const { email, phone } = data;
    let url = `${BASE_URL}/${SEARCH_USER_PATH}?`;
    if (email) url += `email=${encodeURIComponent(email)}&`;
    if (phone) url += `phone=${phone}&`;
    if (data?.user_id) url += `user_id=${data.user_id}`
    
    return await _fetch_get(url, "");
}

export const computeMatching = async (data) => {
    return await _fetch_post(`${BASE_URL}/${COMPUTE_MATCHING_PATH}`, data);
}

export const uploadProfileImg = async (formData) => {
    try {
        let res = await fetch(`${BASE_URL}/${UPLOAD_PROFILE_IMG_PATH}`, {
            method: "POST",
            body: formData,
        });
        return {
            "ok": res.ok,
            "response": await res.json(),
            "error": null
        };
    } catch (err) {
        console.log("Erreur upload : ", err.message);
        return {
            "ok": false,
            "response": null,
            "error": err
        };
    }
};

export const sendFileByWS = async (formData) => {
    try {
        let res = await fetch(`${BASE_URL}/${UPLOAD_FILE_WS}`, {
            method: "POST",
            body: formData,
        });
        return {
            "ok": res.ok,
            "response": await res.json(),
            "error": null
        };
    } catch (err) {
        console.log("Erreur upload : ", err.message);
        return {
            "ok": false,
            "response": null,
            "error": err
        };
    }
};

export const getActiveOffres = async () => {
    return await _fetch_get(`${BASE_URL}/${ACTIVE_OFFRES_PATH}`, "");
}

export const getAllOffres = async () => {
    return await _fetch_get(`${BASE_URL}/${ALL_OFFRES_PATH}`, "");
}

export const addOffre = async (data) => {
    return await _fetch_post(`${BASE_URL}/${ADD_OFFRE_PATH}`, data);
}

export const getConversationsUsers = async (data) => {
    return await _fetch_post(`${BASE_URL}/${GET_CONVERSATIONS_USERS_PATH}`, data);
}

export const getConversation = async (data) => {
    return await _fetch_post(`${BASE_URL}/${GET_CONVERSATION_PATH}`, data);
}

export const markConversationRead = async (data) => {
    return await _fetch_post(`${BASE_URL}/${MARK_READ_PATH}`, data);
}

export const getUnreadCount = async (data) => {
    return await _fetch_post(`${BASE_URL}/${GET_UNREAD_COUNT_PATH}`, data);
}

export const responseToOffre = async (data) => {
    return await _fetch_post(`${BASE_URL}/${RESPONSE_TO_OFFRE_PATH}`, data);
}

export const deleteOffre = async (data) => {
    return await _fetch_post(`${BASE_URL}/${DELETE_OFFRE_PATH}`, data);
}

export const deleteResponse = async (data) => {
    return await _fetch_post(`${BASE_URL}/${DELETE_RESPONSE_PATH}`, data);
}
export const DEFAULT_AVATAR = `${BASE_URL}/api/static/profils_img/default-avatar.jpeg`;
export const BACKEND_PROFILE_IMGS_URL = `${BASE_URL}/api/static/profils_img`;
export const WS_MSG = "ws://localhost:9000/api/user/ws/msg";
export const BACKEND_UPLOAD_WS_DIR = `${BASE_URL}/api/static/ws_files`;

export const answerToResponse = async (data) => {
    return await _fetch_post(`${BASE_URL}/${ANSWER_TO_RESPONSE_PATH}`, data);
}