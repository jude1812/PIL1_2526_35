#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
"""

import os, sys
sys.path.insert(1, os.path.dirname(os.path.abspath(os.path.join(__file__, "..", ".."))))
import asyncio
import bcrypt
import aiofiles
import json
import diskcache
from fastapi import (
    status, Request, WebSocket, 
    APIRouter, HTTPException, File,
    UploadFile, Form, WebSocketException,
    WebSocketDisconnect
)
from pydantic import BaseModel
from backend.api.api_config import LIMITE
from backend.utils.limiter import limiter
from backend.core.db_manager import (
    DBManager, User, UserSkill,
    Disponibilite, Message, Offre, OffreResponse,
    ResponseStatut, OffreStatut
    
)
from uuid import uuid4
from typing import List
from backend.core.ws_manager import WSManager
from backend.utils.jwt_utils import verify_token, create_token
from backend.utils.cryto_utils import hashpw, checkpw
from backend.api.api_config import PROFILE_IMG_DIR, WS_UPLOAD_DIR, IMG_EXTENSIONS

router = APIRouter()
db_manager = None
ws_manager = None
USER_CACHE_DIR = "./user_session"
os.makedirs(USER_CACHE_DIR, exist_ok=True)
CONNECTED_USERS = diskcache.Cache(USER_CACHE_DIR)

# =============================================================================
# Fonctions utilitaires
# =============================================================================
def get_db_manager() -> DBManager:
    """
    Fonction pour obtenir l'instance du gestionnaire de base de données.

    Returns
    -------
    DBManager
        L'instance du DBManager.
    """
    global db_manager
    if db_manager is None:
        db_manager = DBManager()
        
    return db_manager

def get_ws_manager():
    """
    Fonction pour obtenir l'instance du gestionnaire WebSocket.

    Returns
    -------
    WSManager
        L'instance du WSManager.
    """
    global ws_manager
    if ws_manager is None:
        ws_manager = WSManager()
        
    return ws_manager

def _verify_token_and_user(data: BaseModel, db_manager: DBManager, checkpassword: bool = True):
    """
    Fonction utilitaire pour vérifier le token et l'existence de l'utilisateur.

    Parameters
    ----------
    data : BaseModel
        Les données contenant token, key, email, phone et password.
    db_manager : DBManager
        Le gestionnaire de base de données.
    checkpassword : bool, optional
        Si True, vérifie également le mot de passe.

    Returns
    -------
    tuple
        (identifier, user) où identifier est l'email/phone et user l'objet User.

    Raises
    ------
    HTTPException
        Si token invalide, identifiant manquant, utilisateur inexistant ou mot de passe incorrect.
    """
    verify_token(token=data.token, key=data.key)
    identifier = data.email or data.phone
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail="IDENTIFIER NOT AVAILABLE"
        )
        
    user = db_manager.get_user_by_email_or_phone(identifier)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail="ACCOUNT DONT EXISTS"
        )
    if checkpassword:
        if not checkpw(data.password, user.password_hash.encode()):
            raise HTTPException(
                detail="BAD_PASSWORD",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )
    return identifier, user

async def handle_one_file(dirname: str, file: UploadFile = File(...)):
    """
    Fonction utilitaire pour sauvegarder un fichier uploadé.

    Parameters
    ----------
    dirname : str
        Le répertoire de destination.
    file : UploadFile
        Le fichier à sauvegarder.

    Returns
    -------
    tuple
        (new_filename, original_filename) où new_filename est le nom généré.
    """
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    new_filename = filename.removesuffix(ext) + "_" + str(uuid4()) + ext
    path = os.path.join(dirname, new_filename)
    async with aiofiles.open(path, "wb") as f:
        await f.write(await file.read())
    
    return new_filename, filename

# =============================================================================
# Classes de données
# =============================================================================
class LoginData(BaseModel):
    nom: str
    prenom: str
    phone: str
    password: str
    passphrase: str
    passphrase_question: str = None
    email: str
    connect: bool = False

class RefreshData(BaseModel):
    token: str
    user_session_id: str
    key: str

class ResetPasswordData(BaseModel):
    passphrase: str
    phone: str
    email: str
    password: str

class ResetPassphraseData(BaseModel):
    passphrase: str
    phone: str
    email: str
    password: str
    passphrase_question: str = None

class GetPassphraseData(BaseModel):
    passphrase: str
    password: str
    phone: str
    email: str
    
class GlobalData(BaseModel):
    phone: str
    email: str
    token: str
    key: str
    password: str | None = None

class DeleteSkillData(BaseModel):
    phone: str
    email: str
    password: str
    competence: str
    all: bool = False
    token: str
    key: str

class AddSkillData(BaseModel):
    phone: str
    email: str
    password: str
    competence: str
    type: str
    token: str
    key: str

class AddDispoData(BaseModel):
    phone: str
    email: str
    password: str
    jour: str
    heure_debut: str
    heure_fin: str
    token: str
    key: str

class RemoveDispoData(BaseModel):
    phone: str
    email: str
    password: str
    jour: str
    all: bool = False
    token: str
    key: str

class UpdateDispoData(BaseModel):
    phone: str
    email: str
    password: str
    jour: str
    heure_debut: str | None = None
    heure_fin: str | None = None
    token: str
    key: str
    first: bool = True
    

class ComputeMatchingData(BaseModel):
    user_phone: str
    user_email: str
    candidat_phone: str
    candidat_email: str
    phone: str | None = None
    email: str | None = None
    token: str
    key: str

class AddOffreData(BaseModel):
    phone: str
    email: str
    password: str
    competence: str
    description: str | None = None
    type: str
    format: str
    statut: str = OffreStatut.active.value
    token: str
    key: str
    
class DeleteOffreData(BaseModel):
    phone: str
    email: str
    password: str
    competence: str
    type: str | None = None
    format: str | None = None
    token: str
    key: str

class OffreResponseData(BaseModel):
    phone: str
    email: str
    password: str
    offre_id: int
    token: str
    key: str
    
class AnswerResponseData(BaseModel):
    phone: str
    email: str
    password: str
    offre_id: int
    answer_id: int
    close_offer: bool = True
    token: str
    key: str
    response: str = ResponseStatut.accepted.value

class GetMessageData(BaseModel):
    sender_phone: str
    sender_email: str
    password: str
    receiver_phone: str
    receiver_email: str
    phone: str | None = None
    email: str | None = None
    token: str
    key: str

class UpdateEmailData(BaseModel):
    phone: str  
    email: str  
    password: str
    token: str
    key: str

class UpdatePhoneData(BaseModel):
    email: str  
    phone: str  
    password: str
    token: str
    key: str

class UpdateUserData(BaseModel):
    email: str | None = None
    phone: str | None = None
    nom: str | None = None
    prenom: str | None = None
    bio: str | None = None
    filiere: str | None = None
    level: str | None = None
    password: str
    token: str
    key: str
    
class DeleteResponseData(BaseModel):
    phone: str
    email: str
    password: str
    response_id: int
    token: str
    key: str
        
# =============================================================================
# Routes API        
# =============================================================================
@router.post("/auth/login")
@limiter.limit(f"{LIMITE}/minute")
async def _login(request: Request, data: LoginData):
    """
    Endpoint d'authentification.
    
    Deux cas possibles :
    - Si data.connect = True : connexion d'un utilisateur existant
    - Si data.connect = False : création d'un nouveau compte

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : LoginData
        Les données de connexion/inscription.

    Returns
    -------
    dict
        Dictionnaire contenant success, token et salt.

    Raises
    ------
    HTTPException
        401 si mot de passe incorrect.
        406 si email/téléphone déjà utilisé ou identifiant manquant.
    """
    try:
        db_manager = get_db_manager()
        identifier = data.email or data.phone
        if not identifier:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="IDENTIFIER NOT AVAILABLE"
            )
        if data.connect: # Connection, donc déja un compte
            user = db_manager.get_user_by_email_or_phone(identifier)
            if user:
                if checkpw(data.password, user.password_hash.encode()):
                    user_session_id = str(uuid4())
                    CONNECTED_USERS.set(user_session_id, value=user.id, expire=None)
                    key = bcrypt.gensalt()
                    return {
                        "success": True, 
                        "token": create_token(
                            {"username": user_session_id}, 
                            key=key
                        ),
                        "salt": key.decode(),
                        "user_session_id": user_session_id
                    }
                else:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="BAD_PASSWORD",
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_406_NOT_ACCEPTABLE,
                    detail="ACCOUNT DONT EXISTS"
                )
        else:  # Création de compte
            if db_manager.verify_email_validity(data.email) and \
                db_manager.verify_phone_validity(data.phone): # Le frontend se chargere de verifier email et taille phone
                
                user = User(
                    nom=data.nom,
                    prenom=data.prenom,
                    password_hash=hashpw(data.password).decode(),
                    email=data.email,
                    phone=data.phone,
                    passphrase_hash=hashpw(data.passphrase).decode(),
                    passphrase_question=data.passphrase_question,
                )
                user = db_manager.create_user(user)
                success = user is not None
                user_session_id = str(uuid4())
                CONNECTED_USERS.set(user_session_id, value=user.id, expire=None)
                key = bcrypt.gensalt()
                return {
                    "success": success,
                    "token": create_token(
                        {"username": user_session_id}, 
                        key=key
                    ),
                    "salt": key.decode(),
                    "user_session_id": user_session_id
                }
            else:
                details = ""
                if not db_manager.verify_email_validity(data.email):
                    details += "Email invalide !\n"
                
                if not db_manager.verify_phone_validity(data.phone):
                    details += "Téléphone invalide !"
                
                raise HTTPException(
                    detail=details,
                    status_code=status.HTTP_406_NOT_ACCEPTABLE
                )
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )
        
# =============================================================================
# RESET
# =============================================================================
@router.post("/auth/reset-password")
@limiter.limit(f"{LIMITE}/minute")
async def _reset_password(request: Request, data: ResetPasswordData):
    """
    Endpoint pour réinitialiser le mot de passe à l'aide de la phrase secrète.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : ResetPasswordData
        Les données contenant passphrase, phone, email et nouveau password.

    Returns
    -------
    dict
        Dictionnaire contenant success, token, salt et le nouveau mot de passe.

    Raises
    ------
    HTTPException
        406 si identifiant manquant ou utilisateur inexistant.
    """
    try:
        identifier = data.email or data.phone
        if not identifier:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="IDENTIFIER NOT AVAILABLE"
            )
        db_manager = get_db_manager()
        user = db_manager.get_user_by_email_or_phone(identifier)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="ACCOUNT DONT EXISTS"
            )
            
        if not checkpw(data.passphrase, user.passphrase_hash.encode()):
            return {
                "success": False,
                "detail": "Passphrase invalide",
                "help": user.passphrase_question
            }
        user.password_hash = hashpw(data.password).decode()
        user = db_manager.create_user(user)
        success = user is not None 
        user_session_id = str(uuid4())
        CONNECTED_USERS.set(user_session_id, value=user.id, expire=None)
        key = bcrypt.gensalt()
        return {
            "success": success,
            "token": create_token(
                {"username": user_session_id}, 
                key=key
            ),
            "salt": key.decode(),
            "password": data.password,
            "user_session_id": user_session_id
        } # Si user pas connecté, le frontend mettra a jour, sinon ignorera salt, token et key
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

@router.post("/auth/reset-passphrase")
@limiter.limit(f"{LIMITE}/minute")
async def _reset_passphrase(request: Request, data: ResetPassphraseData):
    """
    Endpoint pour réinitialiser la phrase secrète à l'aide du mot de passe.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : ResetPassphraseData
        Les données contenant password, phone, email et nouvelle passphrase.

    Returns
    -------
    dict
        Dictionnaire contenant success, token, salt et la nouvelle passphrase.

    Raises
    ------
    HTTPException
        406 si identifiant manquant ou utilisateur inexistant.
    """
    try:
        identifier = data.email or data.phone
        if not identifier:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="IDENTIFIER NOT AVAILABLE"
            )
        db_manager = get_db_manager()
        user = db_manager.get_user_by_email_or_phone(identifier)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="ACCOUNT DONT EXISTS"
            )
            
        if not checkpw(data.password, user.password_hash.encode()):
            return {
                "success": False,
                "detail": "Passphrase invalide !",
                "help": user.passphrase_question
            }
        user.passphrase_hash = hashpw(data.passphrase).decode()
        if data.passphrase_question:
            user.passphrase_question = data.passphrase_question
            
        user = db_manager.create_user(user)
        success = user is not None
        user_session_id = str(uuid4())
        CONNECTED_USERS.set(user_session_id, value=user.id, expire=None)
        key = bcrypt.gensalt()
        return {
            "success": success,
            "token": create_token(
                {"username": user_session_id}, 
                key=key
            ),
            "salt": key.decode(),
            "passphrase": data.passphrase,
            "user_session_id": user_session_id
        } # Si user pas connecté, le frontend mettra a jour, sinon ignorera salt, token et key
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

@router.post("/auth/get_passphrase_question")
@limiter.limit(f"{LIMITE}/minute")
async def _get_passphrase_question(request: Request, data: GetPassphraseData):
    """
    Endpoint pour récupérer la question secrète d'un utilisateur.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : GetPassphraseData
        Les données contenant passphrase ou password, phone et email.

    Returns
    -------
    dict
        Dictionnaire contenant success et passphrase_question.

    Raises
    ------
    HTTPException
        401 si mot de passe ou phrase secrète incorrect.
        406 si identifiant manquant ou utilisateur inexistant.
    """
    try:
        if not (data.passphrase or data.password):
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="PASSWORD OR PASSPHRASE IS REQUIRED"
            )
        
        identifier = data.email or data.phone
        if not identifier:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="IDENTIFIER NOT AVAILABLE"
            )
            
        db_manager = get_db_manager()
        user = db_manager.get_user_by_email_or_phone(identifier)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="ACCOUNT DONT EXISTS"
            )
            
        if data.password:
            if not checkpw(data.password, user.password_hash.encode()):
                raise HTTPException(
                    detail="BAD_PASSWORD",
                    status_code=status.HTTP_401_UNAUTHORIZED,
                )
        elif data.passphrase:
            if not checkpw(data.passphrase, user.passphrase_hash.encode()):
                raise HTTPException(
                    detail="BAD_PASSPHRASE",
                    status_code=status.HTTP_401_UNAUTHORIZED,
                )
        return {
            "success": True,
            "passphrase_question": user.passphrase_question
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )
        
# =============================================================================
# TOKENS
# =============================================================================
@router.post("/token/refresh_token")
@limiter.limit(f"{LIMITE}/minute")
async def _refresh_token(request: Request, data: RefreshData):
    """
    Endpoint pour rafraîchir un token JWT avant son expiration.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : RefreshData
        Les données contenant token, user_session_id et key.

    Returns
    -------
    dict
        Dictionnaire contenant success et le nouveau token.

    Raises
    ------
    HTTPException
        401 si user_session_id invalide ou token incorrect.
    """
    try:
        user_session_id = data.user_session_id
        token = data.token
        key = data.key
        username = verify_token(token=token, key=key, verify_exp=False)
        if user_session_id == username:
            return {
                "success": True,
                "token": create_token(
                    {"username": user_session_id}, 
                    key=key
                ),
                "user_session_id": user_session_id
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="USER_SESSION_ID NOT AVAILABLE"
        )
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

# =============================================================================
# Upload
# =============================================================================
@router.post("/upload/ws_file")
@limiter.limit(f"{LIMITE}/minute")
async def _upload_ws_file(
    request: Request, 
    files: List[UploadFile] = File(...),
    json_data: str = Form(...),
):
    """
    Endpoint pour uploader des fichiers dans la messagerie.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    files : List[UploadFile]
        La liste des fichiers à uploader.
    json_data : str
        Chaîne JSON contenant from, to, sender_id, receiver_id.

    Returns
    -------
    dict
        Dictionnaire contenant success (bool).

    Raises
    ------
    HTTPException
        500 en cas d'erreur interne.
    """
    try:
        print("Upload file : ", json_data)
        json_data = json.loads(json_data)
        print("Upload file loaded : ", json_data)
        if all(c in json_data for c in ("from", "to", "sender_id", "receiver_id")):
            tasks = [
                asyncio.create_task(handle_one_file(file=file, dirname=WS_UPLOAD_DIR))
                for file in files
            ]
            results = list(await asyncio.gather(*tasks))
            print("results : ", results)
            msg = ""
            for i, result in enumerate(results):    
                msg += result[0] + "#__#" + result[1] 
                if (i != len(results) -1):
                    msg += "####_####"
            
            print("msg", msg)
            ws_manager = get_ws_manager()
            await ws_manager.send_message(
                who=json_data["from"],
                to=json_data["to"],
                msg=msg,
                type="file_send",
            )
            db_manager.send_message(
                Message(
                    sender_id=json_data["sender_id"],
                    receiver_id=json_data["receiver_id"],
                    contenu=msg,
                    is_link=True,
                    read=False,
                )
            )
            return {  
                "success": all(not isinstance(a, Exception) for a in results)
                }
        
        return {  
            "success": False,
            }
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

@router.post("/upload/profile_img")
@limiter.limit(f"{LIMITE}/minute")
async def _upload_profile_img(
    request: Request, 
    file: UploadFile = File(...),
    token: str = Form(...),
    key: str = Form(...),
    phone: str = Form(...),
    email: str = Form(...)
):
    """
    Endpoint pour uploader une photo de profil.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    file : UploadFile
        Le fichier image.
    token : str
        Le token JWT.
    key : str
        La clé de chiffrement.
    phone : str
        Le numéro de téléphone de l'utilisateur.
    email : str
        L'email de l'utilisateur.

    Returns
    -------
    dict
        Dictionnaire contenant success et img_filename.

    Raises
    ------
    HTTPException
        406 si extension non autorisée, identifiant manquant ou utilisateur inexistant.
    """
    try:
        verify_token(token=token, key=key)
        identifier = email or phone
        if not identifier:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="IDENTIFIER NOT AVAILABLE"
            )
            
        user = db_manager.get_user_by_email_or_phone(identifier)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="ACCOUNT DONT EXISTS"
            )
        
        ext = ext = os.path.splitext(file.filename)[1].lower()
        if ext not in IMG_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="EXT_NOT_ACCEPTABLE"
            )
        img_filename, _ = await handle_one_file(dirname=PROFILE_IMG_DIR, file=file)
        user.img_path = img_filename
        user = db_manager.create_user(user)
        return {
            "success": user is not None,
            "img_filename": img_filename
        }
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )
        
# =============================================================================
# SKILLS
# =============================================================================
@router.post("/users/skills")
@limiter.limit(f"{LIMITE}/minute")
async def _user_skill(request: Request, data: GlobalData):
    """
    Endpoint pour récupérer les compétences d'un utilisateur.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : GlobalData
        Les données contenant email, phone, token et key.

    Returns
    -------
    dict
        Dictionnaire contenant success et la liste des skills.
    """
    try:
        db_manager = get_db_manager()
        identifier, user = _verify_token_and_user(data, db_manager)
        user_skills = db_manager.get_user_skills(identifier)
        user_skills = [db_manager.to_dict(skill) for skill in user_skills]
        return {
            "success": True,
            "skills": user_skills
        }
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

@router.post("/users/delete_skill")
@limiter.limit(f"{LIMITE}/minute")
async def _delete_skill(request: Request, data: DeleteSkillData):
    """
    Endpoint pour supprimer une ou plusieurs compétences.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : DeleteSkillData
        Les données contenant competence, all, token, key, etc.

    Returns
    -------
    dict
        Dictionnaire contenant success et reason en cas d'erreur.
    """
    try:
        db_manager = get_db_manager()
        identifier, user = _verify_token_and_user(data, db_manager)
        result = db_manager.remove_skill(identifier=identifier, competence=data.competence, all=data.all)
        return {
            **result
        }
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

@router.post("/users/add_skill")
@limiter.limit(f"{LIMITE}/minute")
async def _add_skill(request: Request, data: AddSkillData):
    """
    Endpoint pour ajouter une compétence (forte ou faible).

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : AddSkillData
        Les données contenant competence, type, token, key, etc.

    Returns
    -------
    dict
        Dictionnaire contenant success (bool).
    """
    try:
        db_manager = get_db_manager()
        identifier, user = _verify_token_and_user(data, db_manager)
        skill = UserSkill(
            user_id=user.id,
            competence=data.competence,
            type=data.type,
        )
        skill = db_manager.add_skill(skill)
        return {
            "success": skill is not None
        }
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )
        
# =============================================================================
# TOUT LES USERS et recherche
# =============================================================================
@router.get("/users/all")
@limiter.limit(f"{LIMITE}/minute")
async def _all_users(request: Request):
    """
    Endpoint pour récupérer tous les utilisateurs (sans les mots de passe).

    Parameters
    ----------
    request : Request
        La requête HTTP.

    Returns
    -------
    dict
        Dictionnaire contenant la liste des users.
    """
    db_manager = get_db_manager()
    users = db_manager.get_all_users()
    return {
        "users": [db_manager.to_dict(user, exclude=["passphrase_hash", "password_hash"]) for user in users] if users else []
    }

@router.get("/users/search")
@limiter.limit(f"{LIMITE}/minute")
async def _search_users(request: Request, email: str = None, phone: str = None):
    """
    Endpoint pour récupérer tous les utilisateurs (sans les mots de passe).

    Parameters
    ----------
    request : Request
        La requête HTTP.

    Returns
    -------
    dict
        Dictionnaire contenant la liste des users.
    """
    identifier = email or phone
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail="IDENTIFIER NOT AVAILABLE"
        )
        
    db_manager = get_db_manager()
    user = db_manager.get_user_by_email_or_phone(identifier)
    return {
        "user": db_manager.to_dict(user, exclude=["passphrase_hash", "password_hash"]) if user else {}
    }

# =============================================================================
# DISPOS
# =============================================================================
@router.post("/users/dispos")
@limiter.limit(f"{LIMITE}/minute")
async def _users_dispos(request: Request, data: GlobalData):
    """
    Endpoint pour récupérer les disponibilités d'un utilisateur.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : GlobalData
        Les données contenant email, phone, token et key.

    Returns
    -------
    dict
        Dictionnaire contenant success et la liste des disponibilités.
    """
    try:
        verify_token(token=data.token, key=data.key)
        identifier = data.email or data.phone
        if not identifier:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="IDENTIFIER NOT AVAILABLE"
            )
            
        db_manager = get_db_manager()
        user = db_manager.get_user_by_email_or_phone(identifier)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="ACCOUNT DONT EXISTS"
            )
        dispos = [db_manager.to_dict(dispo) for dispo in user.disponibilites] if user.disponibilites else []
        return {
            "success": True,
            "dispos": dispos
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

@router.post("/users/add_dispo")
@limiter.limit(f"{LIMITE}/minute")
async def _add_dispo(request: Request, data: AddDispoData):
    """
    Endpoint pour ajouter une disponibilité.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : AddDispoData
        Les données contenant jour, heure_debut, heure_fin, token, key, etc.

    Returns
    -------
    dict
        Dictionnaire contenant success (bool).
    """
    try:
        db_manager = get_db_manager()
        identifier, user = _verify_token_and_user(data, db_manager)
        # print(user, identifier)
        # input()
        dispo = Disponibilite(
            heure_debut=data.heure_debut,
            heure_fin=data.heure_fin,
            jour=data.jour,
            user_id=user.id
        )
        dispo = db_manager.add_dispo(dispo)
        return {
            "success": dispo is not None
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

@router.post("/users/delete_dispo")
@limiter.limit(f"{LIMITE}/minute")
async def _delete_dispo(request: Request, data: RemoveDispoData):
    """
    Endpoint pour supprimer une ou plusieurs disponibilités.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : RemoveDispoData
        Les données contenant jour, all, token, key, etc.

    Returns
    -------
    dict
        Dictionnaire contenant success et reason en cas d'erreur.
    """
    try:
        db_manager = get_db_manager()
        identifier, user = _verify_token_and_user(data, db_manager)
        result = db_manager.remove_dispo(identifier=identifier, all=data.all, jour=data.jour)
        return {
            **result
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

@router.post("/users/update_dispo")
@limiter.limit(f"{LIMITE}/minute")
async def _update_dispo(request: Request, data: UpdateDispoData):
    """
    Endpoint pour mettre à jour une disponibilité.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : UpdateDispoData
        Les données contenant jour, heure_debut, heure_fin, token, key, etc.

    Returns
    -------
    dict
        Dictionnaire contenant success (bool).
    """
    try:
        db_manager = get_db_manager()
        identifier, user = _verify_token_and_user(data, db_manager)
        success = db_manager.update_dispo(
            identifier=identifier,
            jour=data.jour,
            heure_debut=data.heure_debut,
            heure_fin=data.heure_fin
        )
        return {
            "success": success
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

# =============================================================================
#  USERS
# =============================================================================
@router.post("/users/me")
@limiter.limit(f"{LIMITE}/minute")
async def _users_me(request: Request, data: GlobalData):
    """
    Endpoint pour récupérer le profil complet de l'utilisateur connecté.
    
    Retourne les compétences, disponibilités, offres, demandes, réponses et matchings.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : GlobalData
        Les données contenant email, phone, password, token et key.

    Returns
    -------
    dict
        Dictionnaire contenant skills, dispos, user_data, offres, demandes, responses et matchings.
    """
    try:
        db_manager = get_db_manager()
        identifier, user = _verify_token_and_user(data, db_manager, checkpassword=False)
        offres, demandes = db_manager.get_offers(identifier, separe=True)
        user_data = {
            "skills": [db_manager.to_dict(skill) for skill in user.skills] if user.skills else [],
            "dispos": [db_manager.to_dict(dispo) for dispo in user.disponibilites] if user.disponibilites else [],
            "user_data": db_manager.to_dict(user, exclude=["passphrase_hash", "password_hash"]),
            "offres": [db_manager.to_dict(offre) for offre in offres],
            "demandes": [db_manager.to_dict(demande) for demande in demandes],
            "responses": db_manager.get_responses(identifier)
        }
        matchings_ = db_manager.get_matches(identifier)
        if not matchings_:
            user_data["matchings"] = matchings_
            
        else:
            matchings = []
            for candidat, score, reasons in matchings_:
                candidat = db_manager.to_dict(candidat, exclude=["passphrase_hash", "password_hash"])
                matchings.append([candidat, score, reasons])
            
            user_data["matchings"] = matchings
            
        return user_data
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

# =============================================================================
# UPDATE
# =============================================================================

@router.post("/users/update/email")
@limiter.limit(f"{LIMITE}/minute")
async def update_email(request: Request, data: UpdateEmailData):
    """
    Endpoint pour modifier uniquement l'email.
    Utilise le téléphone comme identifiant.
    """
    try:
        db_manager = get_db_manager()
        verify_token(token=data.token, key=data.key)
        if not data.phone:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="PHONE REQUIRED"
            )
        
        user = db_manager.get_user_by_email_or_phone(data.phone)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="ACCOUNT DONT EXISTS"
            )
        
        if not checkpw(data.password, user.password_hash.encode()):
            raise HTTPException(
                detail="BAD_PASSWORD",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )
        
        if not db_manager.verify_email_validity(data.email):
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="EMAIL ALREADY EXISTS"
            )
        
        user.email = data.email
        user = db_manager.create_user(user)
        
        return {
            "success": user is not None,
            "email": user.email if user else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )


@router.post("/users/update/phone")
@limiter.limit(f"{LIMITE}/minute")
async def update_phone(request: Request, data: UpdatePhoneData):
    """
    Endpoint pour modifier uniquement le téléphone.
    Utilise l'email comme identifiant.
    """
    try:
        db_manager = get_db_manager()
        verify_token(token=data.token, key=data.key)
        if not data.email:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="EMAIL REQUIRED"
            )
        
        user = db_manager.get_user_by_email_or_phone(data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="ACCOUNT DONT EXISTS"
            )

        if not checkpw(data.password, user.password_hash.encode()):
            raise HTTPException(
                detail="BAD_PASSWORD",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )
        
        if not db_manager.verify_phone_validity(data.phone):
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="PHONE ALREADY EXISTS"
            )
        
        user.phone = data.phone
        user = db_manager.create_user(user)
        
        return {
            "success": user is not None,
            "phone": user.phone if user else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )


@router.post("/users/update/general")
@limiter.limit(f"{LIMITE}/minute")
async def update_general(request: Request, data: UpdateUserData):
    """
    Endpoint pour modifier les autres champs (nom, prenom, bio, filiere, level).
    Utilise l'email OU le téléphone comme identifiant.
    """
    try:
        db_manager = get_db_manager()
        verify_token(token=data.token, key=data.key)
        
        identifier = data.email or data.phone
        if not identifier:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="IDENTIFIER NOT AVAILABLE"
            )
        
        user = db_manager.get_user_by_email_or_phone(identifier)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="ACCOUNT DONT EXISTS"
            )
        if not checkpw(data.password, user.password_hash.encode()):
            raise HTTPException(
                detail="BAD_PASSWORD",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )
        
        if data.nom is not None:
            user.nom = data.nom
        if data.prenom is not None:
            user.prenom = data.prenom
        if data.bio is not None:
            user.bio = data.bio
        if data.filiere is not None:
            user.filiere = data.filiere
        if data.level is not None:
            user.level = data.level
        
        user = db_manager.create_user(user)
        
        return {
            "success": user is not None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )        
        
# =============================================================================
# MATCHING
# =============================================================================
@router.post("/matching/compute")
@limiter.limit(f"{LIMITE}/minute")
async def _get_matching(request: Request, data: ComputeMatchingData):
    """
    Endpoint pour calculer le score de compatibilité entre deux utilisateurs.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : ComputeMatchingData
        Les données contenant user_phone, user_email, candidat_phone, candidat_email, token et key.

    Returns
    -------
    dict
        Dictionnaire contenant success et matching (score + messages).
    """
    try:
        db_manager = get_db_manager()
        data_copy = data.copy()
        data_copy.email = data.user_email
        data_copy.phone = data.user_phone
        user_identifier, user = _verify_token_and_user(data_copy, db_manager, checkpassword=False)
        
        data_copy = data.copy()
        data_copy.email = data.candidat_email
        data_copy.phone = data.candidat_phone
        candidat_identifier, candidat = _verify_token_and_user(data_copy, db_manager, checkpassword=False)
        
        matching = list(db_manager.compute_score(user_identifier, candidat_identifier))
        return {
            "success": True,
            "matching": matching
        }
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

# =============================================================================
# OFFRES
# =============================================================================
@router.post("/users/offres")
@limiter.limit(f"{LIMITE}/minute")
async def _get_user_offres(request: Request, data: GlobalData):
    """
    Endpoint pour récupérer toutes les offres et demandes d'un utilisateur.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : GlobalData
        Les données contenant email, phone, token et key.

    Returns
    -------
    dict
        Dictionnaire contenant success et la liste des offres.
    """
    try:
        db_manager = get_db_manager()
        identifier, user = _verify_token_and_user(data, db_manager)    
        offres = db_manager.get_offers(identifier, separe=False)    
        return {
            "success": True,
            "offres": [db_manager.to_dict(offre) for offre in offres]
        }
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

@router.post("/users/add_offre")
@limiter.limit(f"{LIMITE}/minute")
async def _add_user_offre(request: Request, data: AddOffreData):
    """
    Endpoint pour ajouter une offre ou une demande de mentorat.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : AddOffreData
        Les données contenant competence, description, type, format, token, key, etc.

    Returns
    -------
    dict
        Dictionnaire contenant success (bool).
    """
    try:
        db_manager = get_db_manager()
        identifier, user = _verify_token_and_user(data, db_manager)    
        offre = Offre(
            type=data.type,
            format=data.format,
            statut=data.statut,
            competence=data.competence,
            user_id=user.id,
            description=data.description
        )
        offre = db_manager.create_offre(offre)
        return {
            "success": offre is not None
        }
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )
    
  
@router.post("/users/delete_offre")
@limiter.limit(f"{LIMITE}/minute")
async def _delete_user_offre(request: Request, data: DeleteOffreData):
    """
    Endpoint pour supprimer une ou plusieurs offres.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : DeleteOffreData
        Les données contenant competence, type, format, token, key, etc.

    Returns
    -------
    dict
        Dictionnaire contenant success et reason en cas d'erreur.
    """
    try:
        db_manager = get_db_manager()
        identifier, user = _verify_token_and_user(data, db_manager)    
        result = db_manager.remove_offre(
            identifier=identifier,
            type=data.type,
            format=data.format,
            competence=data.competence
        )
        return {
            **result
        }
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

@router.get("/offres/active")
@limiter.limit(f"{LIMITE}/minute")
async def get_active_offres(request: Request):
    """
    Endpoint pour récupérer toutes les offres actives (pour filtrage frontend).

    Parameters
    ----------
    request : Request
        La requête HTTP.

    Returns
    -------
    dict
        Dictionnaire contenant success et la liste des offres actives.
    """
    db_manager = get_db_manager()
    offres = db_manager.get_active_offres()  
    return {
        "success": True,
        "offres": [db_manager.to_dict(offre) for offre in offres]
    }

@router.get("/offres/all")
@limiter.limit(f"{LIMITE}/minute")
async def get_all_offres(request: Request):
    """
    Endpoint pour récupérer toutes les offres actives (pour filtrage frontend).

    Parameters
    ----------
    request : Request
        La requête HTTP.

    Returns
    -------
    dict
        Dictionnaire contenant success et la liste des offres actives.
    """
    db_manager = get_db_manager()
    offres = db_manager.get_all_offres()  
    return {
        "success": True,
        "offres": [db_manager.to_dict(offre) for offre in offres]
    }

@router.get("/offres/search")
@limiter.limit(f"{LIMITE}/minute")
async def search_offres(
    request: Request,
    competence: str = None,
    format: str = None,
    type: str = None,
    jour: str = None
):
    """
    Endpoint pour rechercher des offres actives selon des critères.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    competence : str, optional
        La compétence recherchée.
    format : str, optional
        Le format (presentiel, en_ligne, les_deux).
    type : str, optional
        Le type (offre, demande).
    jour : str, optional
        Le jour de disponibilité.

    Returns
    -------
    dict
        Dictionnaire contenant la liste des résultats.
    """
    try:
        db_manager = get_db_manager()
        offers = db_manager.search_offers(
            competence=competence,
            format=format,
            type=type,
            jour=jour
        )
        return {
            "result": [db_manager.to_dict(offer) for offer in offers]
        }
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

# =============================================================================
# REPONSE A OFFRE
# =============================================================================
@router.post("/users/response_to_offre")
@limiter.limit(f"{LIMITE}/minute")
async def _response_to_user_offre(request: Request, data: OffreResponseData):
    """
    Endpoint pour répondre à une offre.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : OffreResponseData
        Les données contenant offre_id, token, key, etc.

    Returns
    -------
    dict
        Dictionnaire contenant success (bool).
    """
    try:
        db_manager = get_db_manager()
        identifier, user = _verify_token_and_user(data, db_manager)    
        response = OffreResponse(
            offre_id=data.offre_id,
            answer_id=user.id,
        )
        response = db_manager.answer_to_offre(response)
        return {
            "success": response is not None
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

@router.post("/users/delete_response")
@limiter.limit(f"{LIMITE}/minute")
async def _delete_response(request: Request, data: DeleteResponseData):
    try:
        db_manager = get_db_manager()
        identifier, user = _verify_token_and_user(data, db_manager)
        result = db_manager.remove_response(data.response_id)
        return {**result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )
        
@router.post("/users/answer_to_response")
@limiter.limit(f"{LIMITE}/minute")
async def _answer_to_user_response(request: Request, data: AnswerResponseData):
    """
    Endpoint pour accepter ou refuser une réponse à une offre.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : AnswerResponseData
        Les données contenant offre_id, answer_id, response, close_offer, token, key, etc.

    Returns
    -------
    dict
        Dictionnaire contenant success (bool).
    """
    try:
        db_manager = get_db_manager()
        identifier, user = _verify_token_and_user(data, db_manager)    
        response = db_manager.get_specific_response(
            identifier=identifier,
            offer_id=data.offre_id,
            anwser_id=data.answer_id
        )
        if not response:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="RESPONSE NOT FOUND"
            )
        
        if data.response == ResponseStatut.accepted:
            func = db_manager.accept_reponse
        else:
            func = db_manager.refuse_reponse
        
        success = func(
            reponse_id=response.id,
            close_offer=data.close_offer
        )
        return {
            "success": success
        }
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

# =============================================================================
# MESSAGES
# =============================================================================
@router.post("/users/messages")
async def _get_user_messages(request: Request, data: GetMessageData):
    """
    Endpoint pour récupérer la conversation entre deux utilisateurs.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : GetMessageData
        Les données contenant sender_phone, sender_email, receiver_phone, receiver_email, token, key, etc.

    Returns
    -------
    dict
        Dictionnaire contenant la liste des messages.
    """
    try:
        db_manager = get_db_manager()
        data_copy = data.copy()
        data_copy.email = data.sender_email
        data.phone = data.sender_phone
        identifier, user = _verify_token_and_user(data_copy, db_manager, checkpassword=False)  
        
        data_copy = data.copy()
        data_copy.email = data.receiver_email
        data.phone = data.receiver_phone
        receiver_identifier, receiver = _verify_token_and_user(data_copy, db_manager, checkpassword=False)  
        messages = db_manager.get_conversation(identifier, receiver_identifier)
        messages = [db_manager.to_dict(message) for message in messages] if messages else []
        return {
            "messages": messages
        }
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

@router.post("/users/messages_unread_count")
async def _get_user_message_unread_count(request: Request, data: GetMessageData):
    """
    Endpoint pour compter les messages non lus entre deux utilisateurs.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : GetMessageData
        Les données contenant sender_phone, sender_email, receiver_phone, receiver_email, token, key, etc.

    Returns
    -------
    dict
        Dictionnaire contenant le count.
    """
    try:
        db_manager = get_db_manager()
        data_copy = data.copy()
        data_copy.email = data.sender_email
        data.phone = data.sender_phone
        identifier, user = _verify_token_and_user(data_copy, db_manager)  
        
        data_copy = data.copy()
        data_copy.email = data.receiver_email
        data.phone = data.receiver_phone
        receiver_identifier, receiver = _verify_token_and_user(data_copy, db_manager, checkpassword=False)  
        count = db_manager.get_unread_count_from(identifier, receiver_identifier)
        return {
            "count": count
        }
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

@router.post("/users/messages_make_read")
async def _make_user_message_read(request: Request, data: GetMessageData):
    """
    Endpoint pour marquer comme lus tous les messages d'une conversation.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : GetMessageData
        Les données contenant sender_phone, sender_email, receiver_phone, receiver_email, token, key, etc.

    Returns
    -------
    dict
        Dictionnaire contenant success et le nouveau count.
    """
    try:
        db_manager = get_db_manager()
        data_copy = data.copy()
        data_copy.email = data.sender_email
        data.phone = data.sender_phone
        identifier, user = _verify_token_and_user(data_copy, db_manager, checkpassword=False)  
        
        data_copy = data.copy()
        data_copy.email = data.receiver_email
        data.phone = data.receiver_phone
        receiver_identifier, receiver = _verify_token_and_user(data_copy, db_manager, checkpassword=False)  
        make_read_success = db_manager.mark_conversation_read(identifier, receiver_identifier)
        count = db_manager.get_unread_count_from(identifier, receiver_identifier)
        return {
            "count": count,
            "success": make_read_success and count == 0
        }
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

@router.post("/users/messages_user_with_me")
async def _get_user_that_user_write(request: Request, data: GlobalData):
    """
    Endpoint pour récupérer la liste des utilisateurs avec qui on a échangé.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    data : GlobalData
        Les données contenant email, phone, token et key.

    Returns
    -------
    dict
        Dictionnaire contenant users, total_unread et success.
    """
    try:
        db_manager = get_db_manager()
        identifier, user = _verify_token_and_user(data, db_manager, checkpassword=False)    
        users_ids = db_manager.get_conversations_ids_list(identifier)
        if not users_ids:
            return {
                "success": True,
                "total_unread": 0,
                "users": []
            }
        
        users = [
            [
                db_manager.to_dict(db_manager.get_user_by_id(user_id)), 
                db_manager._get_unread_count_from(user_id, user.id)
            ]
            for user_id in users_ids
        ]
        return {
            "success": True,
            "users": users,
            "total_unread": db_manager.get_unread_count(identifier)
        }
    except HTTPException:
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )

# =============================================================================
# WS MESSAGERIE
# =============================================================================
@router.websocket("/user/ws/msg")
async def _ws_user(ws: WebSocket, username: str, user_session_id: str):
    """
    Endpoint WebSocket pour la messagerie instantanée.
    
    Gère la connexion, la réception et l'envoi de messages en temps réel.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    ws : WebSocket
        La connexion WebSocket.
    username : str
        Nom d'utilisateur (format: prenom_nom).
    user_session_id : str
        ID de session utilisateur.

    Raises
    ------
    WebSocketException
        1008 si session non enregistrée ou structure de données invalide.
    """
    ws_manager = get_ws_manager()
    db_manager = get_db_manager()
    # username est gérer par le frontend, pour nom = XX, prenom = ss ee, username = XX_ss_ee
    try:
        # if not user_session_id in CONNECTED_USERS:
        #     raise WebSocketException(
        #         code=status.WS_1008_POLICY_VIOLATION,
        #         reason="USER_SESSION_ID NOT REGISTER"
        #     )
        await ws.accept()
        ws_manager.connect(ws, username)
        while True:
            data = await ws.receive_json()
            if all(c in data for c in ("from", "to", "message", "type", "sender_id", "receiver_id", "is_link")):
                if data["from"] == username:
                    _type = data["type"]
                    if _type == "for_user" or _type == "file_send":
                        await ws_manager.send_message(
                            who=data["from"],
                            to=data["to"],
                            msg=data["message"],
                            type=_type
                        )
                        db_manager.send_message(
                            Message(
                                sender_id=data["sender_id"],
                                receiver_id=data["receiver_id"],
                                contenu=data["message"],
                                is_link=data["is_link"],
                                read=False,
                            )
                        )
            
            else:
                s_data = {
                    "from": "serveur",
                    "to": data["from"],
                    "message": "Structure de données invalide, certaines clé non retrouvé !",
                    "type": "mgs_error"
                    }
                
                await ws_manager.send_message(
                    who=s_data["from"],
                    to=s_data["to"],
                    msg=s_data["message"],
                    type=s_data["type"]
                )
                raise WebSocketException(
                    code=status.WS_1008_POLICY_VIOLATION,
                    reason="INVALIDE_DATA_STRUCTURE"
                )
                    
    
    except WebSocketDisconnect:
        pass
    
    except (WebSocketException,):
        raise

    except Exception as e:
        print(f"Erreur WS inattendue: {e}")
        
    finally:
        try:
            await ws.close()
        except:
            pass
        
        try:
            ws_manager.disconnect(username)
        except:
            pass
        
# =============================================================================
# CHECK
# =============================================================================
@router.get("/check/email")
@limiter.limit(f"{LIMITE}/minute")
async def check_email_exists(request: Request, email: str):
    """
    Vérifie si un email est déjà utilisé.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    email : str
        L'email à vérifier.

    Returns
    -------
    dict
        {"exists": bool, "message": str}
    """
    db_manager = get_db_manager()
    exists = not db_manager.verify_email_validity(email)
    return {
        "exists": exists,
        "message": "Email déjà utilisé" if exists else "Email disponible",
        "email": email
    }


@router.get("/check/phone")
@limiter.limit(f"{LIMITE}/minute")
async def check_phone_exists(request: Request, phone: str):
    """
    Vérifie si un numéro de téléphone est déjà utilisé.

    Parameters
    ----------
    request : Request
        La requête HTTP.
    phone : str
        Le téléphone à vérifier.

    Returns
    -------
    dict
        {"exists": bool, "message": str}
    """
    db_manager = get_db_manager()
    exists = not db_manager.verify_phone_validity(phone)
    return {
        "exists": exists,
        "message": "Téléphone déjà utilisé" if exists else "Téléphone disponible",
        "phone": phone
    }
