#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
"""

import os, sys
import enum
sys.path.insert(1, os.path.dirname(os.path.abspath(os.path.join(__file__, "..", ".."))))
from sqlmodel import SQLModel, create_engine, select, Session, func, Field, Relationship, and_, or_
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from backend.api.api_config import DBPATH


# =============================================================================
# Les classes de enum
# =============================================================================

class Days(str, enum.Enum):
    lundi: str = "lundi"
    mardi: str = "mardi"
    mercredi: str = "mercredi"
    jeudi: str = "jeudi"
    vendredi: str = "vendredi"
    samedi: str = "samedi"
    dimanche: str = "dimanche"

class SkillType(str, enum.Enum):
    fort: str = "fort"
    faible:str = "faible"

class OffreType(str, enum.Enum):
    offre: str = "offre"
    demande:str = "demande"

class OffreFormat(str, enum.Enum):
    presentiel:str = "presentiel"
    en_ligne: str = "en_ligne"
    les_deux: str = "les_deux"

class OffreStatut(str, enum.Enum):
    active: str = "active"
    clotured: str = "clotured"

class Filiere(str, enum.Enum):
    IA: str = "IA"
    IM: str = "IM"
    GL: str= "GL"
    SE:str = "SE&IoT"
    SI: str = "SI"

class Level(str, enum.Enum):
    L1: str = "L1"
    L2: str = "L2"
    L3: str = "L3"
    M1: str = "M1"
    M2: str = "M2"

class ResponseStatut(str, enum.Enum):
    in_wait: str = "in_wait"
    accepted: str = "accepted"
    refused: str = "refused"
    
# =============================================================================
# Les classes (table sql) sqlmodel
# =============================================================================

def _is_loaded(obj, relation: str) -> bool:
    """Vérifie si une relation est chargée sans déclencher le lazy load."""
    return relation in obj.__dict__ and obj.__dict__[relation] is not None

class User(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    nom: str = Field(max_length=100, min_length=1)
    prenom: str = Field(max_length=100, min_length=1)
    email: str = Field(unique=True, index=True)
    phone: str = Field(unique=True, index=True, max_length=10)
    bio: Optional[str] = Field(default=None)
    password_hash: str = Field(exclude=True)
    passphrase_hash: str = Field(exclude=True)
    passphrase_question: Optional[str] = Field(default=None)
    filiere: Optional[Filiere] = Field(default=None)
    level: Optional[Level] = Field(default=None)
    img_path: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.now)
    skills: List["UserSkill"] = Relationship(back_populates="user", sa_relationship_kwargs={"lazy": "selectin", "cascade": "all, delete-orphan"})
    disponibilites: List["Disponibilite"] = Relationship(back_populates="user", sa_relationship_kwargs={"lazy": "selectin", "cascade": "all, delete-orphan"})
    offres: List["Offre"] = Relationship(back_populates="user", sa_relationship_kwargs={"lazy": "selectin", "cascade": "all, delete-orphan"})

    def model_dump(self, skip_relation: str = None, **kwargs) -> Dict[str, Any]:
        data = super().model_dump(**kwargs)
        exclude = kwargs.get("exclude", []) or []

        if skip_relation != 'skills' and "skills" not in exclude and _is_loaded(self, 'skills'):
            data['skills'] = [
                skill.model_dump(skip_relation='user', **kwargs)
                for skill in self.__dict__['skills']
            ]
        else:
            data['skills'] = []

        if skip_relation != 'disponibilites' and "disponibilites" not in exclude and _is_loaded(self, 'disponibilites'):
            data['disponibilites'] = [
                dispo.model_dump(skip_relation='user', **kwargs)
                for dispo in self.__dict__['disponibilites']
            ]
        else:
            data['disponibilites'] = []

        if skip_relation != 'offres' and "offres" not in exclude and _is_loaded(self, 'offres'):
            data['offres'] = [
                offre.model_dump(skip_relation='user', **kwargs)
                for offre in self.__dict__['offres']
            ]
        else:
            data['offres'] = []

        return data


class UserSkill(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    __tablename__ = "user_skills"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", ondelete="CASCADE")
    competence: str = Field(min_length=1, max_length=200)
    type: SkillType
    created_at: datetime = Field(default_factory=datetime.now)
    user: Optional[User] = Relationship(back_populates="skills", sa_relationship_kwargs={"lazy": "selectin"})

    def model_dump(self, skip_relation: str = None, **kwargs) -> Dict[str, Any]:
        data = super().model_dump(**kwargs)
        exclude = kwargs.get("exclude", []) or []

        if skip_relation != 'user' and "user" not in exclude and _is_loaded(self, 'user'):
            data['user'] = self.__dict__['user'].model_dump(skip_relation='skills', **kwargs)

        return data


class Disponibilite(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    __tablename__ = "disponibilite"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    jour: Days
    heure_debut: str = Field(max_length=5, min_length=1)
    heure_fin: str = Field(max_length=5, min_length=1)
    user_id: int = Field(foreign_key="users.id", ondelete="CASCADE")
    created_at: datetime = Field(default_factory=datetime.now)
    user: Optional[User] = Relationship(back_populates="disponibilites", sa_relationship_kwargs={"lazy": "selectin"})

    def model_dump(self, skip_relation: str = None, **kwargs) -> Dict[str, Any]:
        data = super().model_dump(**kwargs)
        exclude = kwargs.get("exclude", []) or []

        if skip_relation != 'user' and "user" not in exclude and _is_loaded(self, 'user'):
            data['user'] = self.__dict__['user'].model_dump(skip_relation='disponibilites', **kwargs)

        return data


class Offre(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    __tablename__ = "offre"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", ondelete="CASCADE")
    competence: str = Field(min_length=1)
    description: Optional[str] = Field(default=None, max_length=500)
    type: OffreType
    format: OffreFormat
    statut: OffreStatut = Field(default=OffreStatut.active)
    created_at: datetime = Field(default_factory=datetime.now)
    user: Optional[User] = Relationship(back_populates="offres", sa_relationship_kwargs={"lazy": "selectin"})
    responses: List["OffreResponse"] = Relationship(back_populates="offre", sa_relationship_kwargs={"lazy": "selectin", "cascade": "all, delete-orphan"})

    def model_dump(self, skip_relation: str = None, **kwargs) -> Dict[str, Any]:
        data = super().model_dump(**kwargs)
        exclude = kwargs.get("exclude", []) or []

        if skip_relation != 'user' and "user" not in exclude and _is_loaded(self, 'user'):
            data['user'] = self.__dict__['user'].model_dump(skip_relation='offres', **kwargs)

        if skip_relation != 'responses' and "responses" not in exclude and _is_loaded(self, 'responses'):
            data['responses'] = [
                response.model_dump(skip_relation='offre', **kwargs)
                for response in self.__dict__['responses']
            ]
        else:
            data['responses'] = []

        return data


class OffreResponse(SQLModel, table=True):
    __table_args__ = {"extend_existing": True}
    __tablename__ = "offre_response"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    offre_id: int = Field(foreign_key="offre.id", ondelete="CASCADE")
    answer_id: int = Field(foreign_key="users.id", ondelete="CASCADE")
    created_at: datetime = Field(default_factory=datetime.now)
    statut: ResponseStatut = Field(default=ResponseStatut.in_wait)
    offre: Optional["Offre"] = Relationship(back_populates="responses", sa_relationship_kwargs={"lazy": "selectin"})

    def model_dump(self, skip_relation: str = None, **kwargs) -> Dict[str, Any]:
        data = super().model_dump(**kwargs)
        exclude = kwargs.get("exclude", []) or []

        if skip_relation != 'offre' and "offre" not in exclude and _is_loaded(self, 'offre'):
            data['offre'] = self.__dict__['offre'].model_dump(skip_relation='responses', **kwargs)

        return data

class Message(SQLModel, table=True):
    __tablename__ = "messages"
    __table_args__ = {"extend_existing": True}
    
    id: Optional[int] = Field(default=None, primary_key=True)
    sender_id: int = Field(foreign_key="users.id", index=True, ondelete="CASCADE")
    receiver_id: int = Field(foreign_key="users.id", index=True, ondelete="CASCADE")
    contenu: str
    is_link: bool = Field(default=False)
    read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.now)
    
    
class DBManager:
    def __init__(self, db_url: str = None):
        if not db_url:
            db_url = os.path.join(DBPATH, "mentor_link.db")
            db_url = "sqlite:///" + db_url
                
        self.engine = create_engine(db_url, echo=False)
        SQLModel.metadata.create_all(self.engine)
    
    def get_session(self) -> Session:
        return Session(self.engine)
    
    # =============================================================================
    # Users
    # =============================================================================
    
    def create_user(self, user: User) -> User:
        """
        Méthode de création des utilisateurs

        Parameters
        ----------
        user : User
            L'user a ajouter ou mettre a jour.

        Returns
        -------
        User
            L'user a jour.

        """
        try:
            with self.get_session() as session:
                session.add(user)
                session.commit()
                session.refresh(user)
                return user
        except Exception as e:
            session.rollback()
            print(f"❌ ERREUR create_user: {e}")
            return None
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Methode pour obtenir un user par son email.

        Parameters
        ----------
        email : str
            L'email de la personne.

        Returns
        -------
        Optional[User]
            L'user si trouver.

        """
        with self.get_session() as session:
            return session.exec(
                select(User).where(User.email == email)
            ).first()
    
    def get_user_by_phone(self, phone: str) -> Optional[User]:
        """
        Methode pour obtenir un user par son téléphone.

        Parameters
        ----------
        phone : str
            L'email de la personne.

        Returns
        -------
        Optional[User]
            L'user si trouver.

        """
        with self.get_session() as session:
            return session.exec(
                select(User).where(User.phone == phone)
            ).first()
    
    def get_user_by_email_or_phone(self, identifier: str) -> Optional[User]:
        """
        Methode pour obtenir un user par son téléphone ou son email.

        Parameters
        ----------
        identifier : str
            L'email ou téléphone de la personne.

        Returns
        -------
        Optional[User]
            L'user si trouver.

        """
        with self.get_session() as session:
            return session.exec(
                select(User).where(
                    or_(User.email == identifier, User.phone == identifier)
                )
            ).first()

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Méthode pour obtenir un user par son id.

        Parameters
        ----------
        user_id : int
            L'ID de la personne.

        Returns
        -------
        Optional[User]
            L'user si trouver.

        """
        with self.get_session() as session:
            return session.get(User, user_id)
    
    def get_emails(self) -> List[str]:
        """
        Méthode qui retourne tout les emails.

        Returns
        -------
        List[str]
            Liste des emails.

        """
        with self.get_session() as session:
            return session.exec(
                select(User.email)
            ).all()
    
    def get_phones(self) -> List[str]:
        """
        Méthode qui retourne tout les téléphones.

        Returns
        -------
        List[str]
            Liste des téléphones.

        """
        with self.get_session() as session:
            return session.exec(
                select(User.phone)
            ).all()
    
    def verify_email_validity(self, email: str) -> bool:
        """
        Méthode de vérification de la validité de l'email (si il n'existe pas déja).

        Parameters
        ----------
        email : str
            L'email.

        Returns
        -------
        bool
            True/False selon la validité.

        """
        with self.get_session() as session:
            return not session.exec(
                select(User).where(User.email == email)
            ).all()
    
    def verify_phone_validity(self, phone: str) -> bool:
        """
        Méthode de vérification de la validité du téléphone (si il n'existe pas déja).

        Parameters
        ----------
        phone : str
            L'email.

        Returns
        -------
        bool
            True/False selon la validité.

        """
        with self.get_session() as session:
            return not session.exec(
                select(User).where(User.phone == phone)
            ).all()
    
    def get_user_skills(self, identifier: str) -> List[UserSkill]:
        """
        Méthode pour obtenir les skills d'un user.

        Parameters
        ----------
        identifier : str
            Email ou téléphone.

        Returns
        -------
        List[UserSkill]
            La liste des skills.

        """
        user = self.get_user_by_email_or_phone(identifier)
        if user:
            return user.skills
        
        return []
    
    def get_all_users(self) -> List[User]:
        """
        Méthode qui retourne tout les users de la base.

        Returns
        -------
        List[User]
            Liste des users.

        """
        with self.get_session() as session:
            return session.exec(
                select(User)
            ).all()
        # =============================================================================
    # Skills
    # =============================================================================
    
    def add_skill(self, skill: UserSkill) -> UserSkill | None:
        """
        Méthode pour ajouter une compétence à un utilisateur.

        Parameters
        ----------
        skill : UserSkill
            La compétence à ajouter.

        Returns
        -------
        UserSkill | None
            La compétence ajoutée ou None si échec.
        """
        with self.get_session() as session:
            try:
                session.add(skill)
                session.commit()
                session.refresh(skill)
                return skill
            
            except:
                session.rollback()
                return None
    
    def remove_skill(self, identifier: str, all = False, competence: str = "") -> Dict[str, Any]:
        """
        Méthode pour supprimer une ou plusieurs compétences d'un utilisateur.

        Parameters
        ----------
        identifier : str
            Email ou téléphone de l'utilisateur.
        all : bool, optional
            Si True, supprime toutes les compétences. False par défaut.
        competence : str, optional
            La compétence spécifique à supprimer (si all=False).

        Returns
        -------
        Dict[str, Any]
            Dictionnaire avec 'success' (bool) et 'reason' (str si erreur).
        """
        result = {
            "success": False,
            "reason": None
        }
        try:
            user = self.get_user_by_email_or_phone(identifier)
            user_skills = user.skills if user else []
            if not user_skills:
                result["reason"] = "Pas de compétence pour l'utilisateur."
                return 
            
            skills_to_delete = []
            if all:
                skills_to_delete = user_skills
            else:
                skills_to_delete = [skill for skill in user_skills if skill.competence == competence]
                
            if not skills_to_delete:
                result["reason"] = "Pas de compétence à supprimer, veuillez revoir votre demande."
                return 
            
            with self.get_session() as session:
                try:
                    for skill in skills_to_delete:
                        session.delete(skill)
                    session.commit()
                    result["success"] = True
                except Exception as e:
                    session.rollback()
                    result["reason"] = "Erreur lors de la suppression. Erreur: " + str(e)
        
        finally:
            return result
    
    
    def add_dispo(self, dispo: Disponibilite) -> Disponibilite | None:
        """
        Méthode pour ajouter une disponibilité à un utilisateur.

        Parameters
        ----------
        dispo : Disponibilite
            La disponibilité à ajouter.

        Returns
        -------
        Disponibilite | None
            La disponibilité ajoutée ou None si échec.
        """
        with self.get_session() as session:
            try:
                session.add(dispo)
                session.commit()
                session.refresh(dispo)
                return dispo
            
            except:
                session.rollback()
                return None
    
    def remove_dispo(self, identifier: str, all = False, jour: str = "") -> Dict[str, Any]:
        """
        Méthode pour supprimer une ou plusieurs disponibilités d'un utilisateur.

        Parameters
        ----------
        identifier : str
            Email ou téléphone de l'utilisateur.
        all : bool, optional
            Si True, supprime toutes les disponibilités. False par défaut.
        jour : str, optional
            Le jour spécifique à supprimer (si all=False).

        Returns
        -------
        Dict[str, Any]
            Dictionnaire avec 'success' (bool) et 'reason' (str si erreur).
        """
        result = {
            "success": False,
            "reason": None
        }
        try:
            user = self.get_user_by_email_or_phone(identifier)
            user_dispos = user.disponibilites if user else []
            if not user_dispos:
                result["reason"] = "Pas de disponibilités pour l'utilisateur."
                return 
            
            dispos_to_delete = []
            if all:
                dispos_to_delete = user_dispos
            else:
                dispos_to_delete = [dispo for dispo in user_dispos if str(dispo.jour.value) == jour]
                
            if not dispos_to_delete:
                result["reason"] = "Pas de disponibilités à supprimer, veuillez revoir votre demande."
                return 
            
            with self.get_session() as session:
                try:
                    for dispo in dispos_to_delete:
                        session.delete(dispo)
                    session.commit()
                    result["success"] = True
                except Exception as e:
                    session.rollback()
                    result["reason"] = "Erreur lors de la suppression. Erreur: " + str(e)
        
        finally:
            return result
    
    def _update_dispo(
        self, 
        user_id: int, 
        jour: str, 
        heure_debut: str = None,
        heure_fin: str = None, 
        first: bool = True
    ) -> bool:
        """
        Méthode interne pour mettre à jour les disponibilités d'un utilisateur par son ID.

        Parameters
        ----------
        user_id : int
            L'ID de l'utilisateur.
        jour : str
            Le jour de la disponibilité.
        heure_debut : str, optional
            Nouvelle heure de début.
        heure_fin : str, optional
            Nouvelle heure de fin.
        first : bool, optional
            Si True, met à jour uniquement la première disponibilité du jour.

        Returns
        -------
        bool
            True si succès, False sinon.
        """
        user = self.get_user_by_id(user_id)
        dispos = user.disponibilites if user else []
        if not dispos:
            return True
        
        dispo_to_update = []
        if first:
            dispo_to_update = [dispos[0]]
            
        else:
            dispo_to_update = dispos
        
        with self.get_session() as session:
            try:
                for dispo in dispo_to_update:
                    if heure_debut:
                        dispo.heure_debut = heure_debut
                    if heure_fin:
                        dispo.heure_fin = heure_fin
                    session.add(dispo)
                session.commit()
                
            except:
                session.rollback()
                return False
        
    def update_dispo(
        self, 
        identifier: int, 
        jour: str, 
        heure_debut: str = None,
        heure_fin: str = None, 
        first: bool = True
    ) -> bool:
        """
        Méthode pour mettre à jour les disponibilités d'un utilisateur par son identifiant.

        Parameters
        ----------
        identifier : str
            Email ou téléphone de l'utilisateur.
        jour : str
            Le jour de la disponibilité.
        heure_debut : str, optional
            Nouvelle heure de début.
        heure_fin : str, optional
            Nouvelle heure de fin.
        first : bool, optional
            Si True, met à jour uniquement la première disponibilité du jour.

        Returns
        -------
        bool
            True si succès, False sinon.
        """
        user = self.get_user_by_email_or_phone(identifier)
        if user:
            return self._update_dispo(
                user_id=user.id,
                jour=jour,
                heure_debut=heure_debut,
                heure_fin=heure_fin,
                first=first
            )
        return True
    
    # =============================================================================
    # Messages
    # =============================================================================
    
    def send_message(self, message: Message) -> Message | None:
        """
        Méthode pour envoyer un message.

        Parameters
        ----------
        message : Message
            Le message à envoyer.

        Returns
        -------
        Message | None
            Le message envoyé ou None si échec.
        """
        with self.get_session() as session:
            try:
                session.add(message)
                session.commit()
                session.refresh(message)
                return message
            except:
                return

    def _get_conversation(self, user_a: int, user_b: int) -> List[Message]:
        """
        Méthode interne pour récupérer la conversation entre deux utilisateurs par leurs ID.

        Parameters
        ----------
        user_a : int
            ID du premier utilisateur.
        user_b : int
            ID du second utilisateur.

        Returns
        -------
        List[Message]
            Liste des messages triés par date.
        """
        with self.get_session() as session:
            return session.exec(
                select(Message)
                .where(
                    or_(
                        and_((Message.sender_id == user_a), (Message.receiver_id == user_b)),
                        and_((Message.sender_id == user_b), (Message.receiver_id == user_a))
                    )
                )
                .order_by(Message.created_at)
            ).all()
    
    def get_conversation(self, user_a_identifier: str, user_b_identifier: str) -> List[Message]:
        """
        Méthode pour récupérer la conversation entre deux utilisateurs par leurs identifiants.

        Parameters
        ----------
        user_a_identifier : str
            Email ou téléphone du premier utilisateur.
        user_b_identifier : str
            Email ou téléphone du second utilisateur.

        Returns
        -------
        List[Message]
            Liste des messages triés par date.
        """
        user_a = self.get_user_by_email_or_phone(user_a_identifier)
        user_b = self.get_user_by_email_or_phone(user_b_identifier)
        if user_a and user_b:
            return self._get_conversation(user_a.id, user_b.id)
        
        return []
    
    def _get_unread_count(self, user_id: int) -> int:
        """
        Méthode interne pour compter les messages non lus d'un utilisateur par son ID.

        Parameters
        ----------
        user_id : int
            ID de l'utilisateur.

        Returns
        -------
        int
            Nombre de messages non lus.
        """
        with self.get_session() as session:
            return session.exec(
                select(func.count(Message.id))
                .where(Message.receiver_id == user_id, Message.read == False)
            ).one()
    
    def get_unread_count(self, identifier: int) -> int | None:
        """
        Méthode pour compter les messages non lus d'un utilisateur.

        Parameters
        ----------
        identifier : str
            Email ou téléphone de l'utilisateur.

        Returns
        -------
        int | None
            Nombre de messages non lus ou None si utilisateur non trouvé.
        """
        user = self.get_user_by_email_or_phone(identifier)
        if user:
            return self._get_unread_count(user.id)
        
        return None
    
    def _get_unread_count_from(self, sender_id: int, receiver_id: int) -> int:
        """
        Méthode interne pour compter les messages non lus d'un expéditeur vers un destinataire.

        Parameters
        ----------
        sender_id : int
            ID de l'expéditeur.
        receiver_id : int
            ID du destinataire.

        Returns
        -------
        int
            Nombre de messages non lus.
        """
        with self.get_session() as session:
            return session.exec(
                select(func.count(Message.id))
                .where(
                    Message.sender_id == sender_id,
                    Message.receiver_id == receiver_id,
                    Message.read == False
                )
            ).one()
    
    def get_unread_count_from(self, sender_identifier: str, receiver_identifier: str) -> int:
        """
        Méthode pour compter les messages non lus d'un expéditeur vers un destinataire.

        Parameters
        ----------
        sender_identifier : str
            Email ou téléphone de l'expéditeur.
        receiver_identifier : str
            Email ou téléphone du destinataire.

        Returns
        -------
        int
            Nombre de messages non lus.
        """
        sender = self.get_user_by_email_or_phone(sender_identifier)
        receiver = self.get_user_by_email_or_phone(receiver_identifier)
        if not (sender and receiver):
            return 0
        
        return self._get_unread_count_from(sender.id, receiver.id)
    
    def _mark_conversation_read(self, sender: int, receiver: int):
        """
        Méthode interne pour marquer comme lus tous les messages d'une conversation.

        Parameters
        ----------
        sender : int
            ID de l'expéditeur.
        receiver : int
            ID du destinataire.
        """
        with self.get_session() as session:
            messages = session.exec(
                select(Message).where(
                    Message.sender_id == sender,
                    Message.receiver_id == receiver,
                    Message.read == False
                )
            ).all()
            for m in messages:
                m.read = True
                session.add(m)
            session.commit()

    def mark_conversation_read(self, sender_identifier: str, receiver_identifier: str) -> bool:
        """
        Méthode pour marquer comme lus tous les messages d'une conversation.

        Parameters
        ----------
        sender_identifier : str
            Email ou téléphone de l'expéditeur.
        receiver_identifier : str
            Email ou téléphone du destinataire.

        Returns
        -------
        bool
            True si succès, False sinon.
        """
        sender = self.get_user_by_email_or_phone(sender_identifier)
        receiver = self.get_user_by_email_or_phone(receiver_identifier)
        if not (sender and receiver):
            return False
        
        self._mark_conversation_read(sender.id, receiver.id)
        return True
    
    def _get_conversations_ids_list(self, user_id: int) -> List[int]:
        """
        Méthode interne pour obtenir la liste des IDs des utilisateurs avec qui on a échangé.

        Parameters
        ----------
        user_id : int
            ID de l'utilisateur.

        Returns
        -------
        List[int]
            Liste des IDs des utilisateurs.
        """
        with self.get_session() as session:
            sent = session.exec(
                select(Message.receiver_id)
                .where(Message.sender_id == user_id)
            ).all() or []
            received = session.exec(
                select(Message.sender_id)
                .where(Message.receiver_id == user_id)
            ).all() or []
            return list(dict.fromkeys(sent + received))
    
    def get_conversations_ids_list(self, identifier: str) -> List[int]:
        """
        Méthode pour obtenir la liste des IDs des utilisateurs avec qui on a échangé.

        Parameters
        ----------
        identifier : str
            Email ou téléphone de l'utilisateur.

        Returns
        -------
        List[int]
            Liste des IDs des utilisateurs.
        """
        user = self.get_user_by_email_or_phone(identifier)
        if not user:
            return []
        
        return self._get_conversations_ids_list(user.id)
    
    def _get_conversations_users_list(self, user_id: int) -> List[User]:
        """
        Méthode interne pour obtenir la liste des utilisateurs avec qui on a échangé.

        Parameters
        ----------
        user_id : int
            ID de l'utilisateur.

        Returns
        -------
        List[User]
            Liste des utilisateurs.
        """
        conv_ids = self._get_conversations_ids_list(user_id)
        with self.get_session() as session:
            return session.exec(
                select(User).where(User.id.in_(conv_ids))
            ).all()
    
    def get_conversations_users_list(self, identifier: int) -> List[User]:
        """
        Méthode pour obtenir la liste des utilisateurs avec qui on a échangé.

        Parameters
        ----------
        identifier : str
            Email ou téléphone de l'utilisateur.

        Returns
        -------
        List[User]
            Liste des utilisateurs.
        """
        user = self.get_user_by_email_or_phone(identifier)
        if not user:
            return []
        
        return self._get_conversations_users_list(user.id)
    
    def _get_conversations_users_list_with_not_readed_count(self, user_id: int) -> List[Tuple[User, int]]:
        """
        Méthode interne pour obtenir la liste des utilisateurs avec le nombre de messages non lus.

        Parameters
        ----------
        user_id : int
            ID de l'utilisateur.

        Returns
        -------
        List[Tuple[User, int]]
            Liste de tuples (utilisateur, nombre_non_lus).
        """
        result = []
        conv_users = self._get_conversations_users_list(user_id)
        if conv_users:
            for user in conv_users:
                result.append((user, self._get_unread_count_from(user.id, user_id)))
        return result
                
    def get_conversations_users_list_with_not_readed_count(self, identifier: int) -> List[Tuple[User, int]]:
        """
        Méthode pour obtenir la liste des utilisateurs avec le nombre de messages non lus.

        Parameters
        ----------
        identifier : str
            Email ou téléphone de l'utilisateur.

        Returns
        -------
        List[Tuple[User, int]]
            Liste de tuples (utilisateur, nombre_non_lus).
        """
        user = self.get_user_by_email_or_phone(identifier)
        if not user:
            return []
        return self._get_conversations_users_list_with_not_readed_count(user.id)
    
    # =============================================================================
    # Offres
    # =============================================================================
    
    def create_offre(self, offre: Offre) -> Offre | None:
        """
        Méthode pour créer une offre ou une demande de mentorat.

        Parameters
        ----------
        offre : Offre
            L'offre à créer.

        Returns
        -------
        Offre | None
            L'offre créée ou None si échec.
        """
        with self.get_session() as session:
            try:
                session.add(offre)
                session.commit()
                session.refresh(offre)
                return offre
            except:
                session.rollback()
                return None
    
    def get_offers(self, identifier: str, separe: bool = True) -> Tuple[List[Offre], List[Offre]] | List[Offre]:
        """
        Méthode pour récupérer les offres et demandes d'un utilisateur.

        Parameters
        ----------
        identifier : str
            Email ou téléphone de l'utilisateur.
        separe : bool, optional
            Si True, retourne (offres, demandes). Si False, retourne la liste complète.

        Returns
        -------
        Tuple[List[Offre], List[Offre]] | List[Offre]
            Offres et demandes séparées ou liste complète.
        """
        user = self.get_user_by_email_or_phone(identifier)
        if not user:
            return []
        
        if not separe:
            return user.offres
        
        offers = [offer for offer in user.offres if offer.type == OffreType.offre]
        demandes = [offer for offer in user.offres if offer.type == OffreType.demande]
        return offers, demandes
    
    def search_offers(
        self, 
        competence: str = None,
        format: str = None,
        type: str = None,
        jour: str = None
    ):
        """
        Méthode pour rechercher des offres actives selon des critères.

        Parameters
        ----------
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
        List[Offre]
            Liste des offres correspondant aux critères.
        """
        active_offers = self.get_active_offres()
        offers = []
        for offer in active_offers:
            add = True
            if competence:
                add = competence.lower() in str(offer.competence).lower()
            
            if format:
                add = add and format == offer.format
            
            if type:
                add = add and type == offer.type
            
            if jour:
                add = add and any(jour == dispo.jour for dispo in offer.user.disponibilites)
                
            if add:
                offers.append(offer)
        
        return offers
            
    def remove_offre(
        self, 
        identifier: str, 
        competence: str = None, 
        type: str = None, 
        format: str = None, 
        all: bool = False
    ) -> Dict[str, Any]:
        """
        Méthode pour supprimer une ou plusieurs offres d'un utilisateur.

        Parameters
        ----------
        identifier : str
            Email ou téléphone de l'utilisateur.
        competence : str, optional
            La compétence spécifique.
        type : str, optional
            Le type spécifique.
        format : str, optional
            Le format spécifique.
        all : bool, optional
            Si True, supprime toutes les offres.

        Returns
        -------
        Dict[str, Any]
            Dictionnaire avec 'success' (bool) et 'reason' (str si erreur).
        """
        result = {
            "success": False,
            "reason": None
        }
        try:
            user = self.get_user_by_email_or_phone(identifier)
            offers = user.offres if user else []
            if not offers:
                result["reason"] = "Pas de d'offres pour l'utilisateur."
                return result
            
            offer_to_delete = []
            offers = user.offres
            if all:
                offer_to_delete = offers
            else:
                for offer in offers:
                    delete = False
                    if type:
                        delete = str(offer.type.value) == type
                    
                    if format:
                        delete = delete and str(offer.format.value) == format
                    
                    if competence:
                        delete = delete and offer.competence.lower() == competence.lower()
                        
                    if delete:
                        offer_to_delete.append(offer)
                
            if not offer_to_delete:
                result["reason"] = "Pas de d'offres à supprimer, veuillez revoir votre demande."
                return
            
            with self.get_session() as session:
                try:
                    for offer in offer_to_delete:
                        session.delete(offer)
                    session.commit()
                    result["success"] = True
                except Exception as e:
                    session.rollback()
                    result["reason"] = "Erreur lors de la suppression. Erreur: " + str(e)
            
        finally:
            return result
    
    def get_active_offres(self) -> List[Offre]:
        """
        Méthode pour récupérer toutes les offres actives.

        Returns
        -------
        List[Offre]
            Liste des offres actives triées par date décroissante.
        """
        with self.get_session() as session:
            return session.exec(
                select(Offre)
                .where(Offre.statut == OffreStatut.active)
                .order_by(Offre.created_at.desc())
            ).all()
    
    def get_all_offres(self) -> List[Offre]:
        """
        Méthode pour récupérer toutes les offres.

        Returns
        -------
        List[Offre]
            Liste des offres actives triées par date décroissante.
        """
        with self.get_session() as session:
            return session.exec(
                select(Offre)
                .order_by(Offre.created_at.desc())
            ).all()

    def answer_to_offre(self, reponse: OffreResponse) -> OffreResponse | None:
        """
        Méthode pour répondre à une offre.

        Parameters
        ----------
        reponse : OffreResponse
            La réponse à l'offre.

        Returns
        -------
        OffreResponse | None
            La réponse créée ou None si échec.
        """
        with self.get_session() as session:
            try:
                session.add(reponse)
                session.commit()
                session.refresh(reponse)
                return reponse
            except:
                session.rollback()
                return
        
    def get_responses(self, identifier: str) -> List[OffreResponse]:
        """
        Méthode pour récupérer toutes les réponses d'un utilisateur.

        Parameters
        ----------
        identifier : str
            Email ou téléphone de l'utilisateur.

        Returns
        -------
        List[OffreResponse]
            Liste des réponses.
        """
        user = self.get_user_by_email_or_phone(identifier)
        if not user:
            return []
        
        with self.get_session() as session:
            return session.exec(
                select(OffreResponse)
                .where(OffreResponse.answer_id == user.id)
            ).all()
        
    def get_specific_response(self, identifier: str, anwser_id: int, offer_id: int) -> OffreResponse | None:
        """
        Méthode pour récupérer une réponse spécifique.

        Parameters
        ----------
        identifier : str
            Email ou téléphone de l'utilisateur.
        anwser_id : int
            ID de la réponse.
        offer_id : int
            ID de l'offre.

        Returns
        -------
        OffreResponse | None
            La réponse trouvée ou None.
        """
        with self.get_session() as session:
            user_responses = session.exec(
                select(OffreResponse)
                .where(OffreResponse.answer_id == anwser_id)
            ).all()
            
        if not user_responses:
            return None
        
        response = list(
            filter(
                lambda response_: response_.answer_id == anwser_id and response_.offre_id == offer_id,
                user_responses
            )
        )
        return response[0] if response else None
    
    def remove_response(self, response_id: int) -> Dict[str, Any]:
        """
        Méthode pour supprimer une réponse à une offre.
    
        Parameters
        ----------
        response_id : int
            ID de la réponse à supprimer.
    
        Returns
        -------
        Dict[str, Any]
            Dictionnaire avec 'success' (bool) et 'reason' (str si erreur).
        """
        result = {"success": False, "reason": None}
        try:
            with self.get_session() as session:
                response = session.get(OffreResponse, response_id)
                if not response:
                    result["reason"] = "Réponse introuvable."
                    return result
                session.delete(response)
                session.commit()
                result["success"] = True
        except Exception as e:
            result["reason"] = f"Erreur lors de la suppression : {str(e)}"
        finally:
            return result
    
    def accept_reponse(self, reponse_id: int, close_offer: bool = False) -> bool:
        """
        Méthode pour accepter une réponse à une offre.

        Parameters
        ----------
        reponse_id : int
            ID de la réponse.
        close_offer : bool, optional
            Si True, ferme l'offre après acceptation.

        Returns
        -------
        bool
            True si succès, False sinon.
        """
        with self.get_session() as sesssion:
            try:
                reponse = sesssion.get(OffreResponse, reponse_id)
                reponse.statut = ResponseStatut.accepted
                
                offre = None
                if close_offer:
                    offre = sesssion.get(Offre, reponse.offre_id)
                    offre.statut = OffreStatut.clotured
                
                sesssion.add(reponse)
                if offre:
                    sesssion.add(offre)
                sesssion.commit()
                return True
            
            except:
                sesssion.rollback()
                return False
    
    def refuse_reponse(self, reponse_id: int, close_offer: bool = False) -> bool:
        """
        Méthode pour refuser une réponse à une offre.

        Parameters
        ----------
        reponse_id : int
            ID de la réponse.
        close_offer : bool, optional
            Si True, ferme l'offre après refus.

        Returns
        -------
        bool
            True si succès, False sinon.
        """
        with self.get_session() as sesssion:
            try:
                reponse = sesssion.get(OffreResponse, reponse_id)
                reponse.statut = ResponseStatut.refused
                
                offre = None
                if close_offer:
                    offre = sesssion.get(Offre, reponse.offre_id)
                    offre.statut = OffreStatut.clotured
                
                sesssion.add(reponse)
                if offre:
                    sesssion.add(offre)
                sesssion.commit()
                return True
            
            except:
                sesssion.rollback()
                return False
    
    @classmethod
    def get_barem(cls):
        """
        Méthode de classe pour obtenir le barème de notation du matching.

        Returns
        -------
        dict
            Dictionnaire des pondérations (compétences, niveau, filière, dispo).
        """
        return {
            "competences": 40,
            "niveau": 10,
            "filiere": 20,
            "dispo": 30
        }
    
    def _compute_score(self, user_id: int, candidat_id: int) -> Tuple[int, Dict]:
        """
        Méthode interne pour calculer le score de compatibilité entre deux utilisateurs.

        Parameters
        ----------
        user_id : int
            ID de l'utilisateur principal.
        candidat_id : int
            ID du candidat.

        Returns
        -------
        Tuple[int, Dict]
            Score (0-100) et dictionnaire des messages explicatifs.
        """
        score = 0
        messages = {
            "competences": None,
            "filiere": None,
            "niveau": None,
            "dispo": None,
        }
        with self.get_session() as session:

            # +40 pts — compétences
            faiblesses = session.exec(
                select(UserSkill.competence)
                .where(UserSkill.user_id == user_id, UserSkill.type == SkillType.faible)
            ).all()

            if faiblesses:
                match_skills = session.exec(
                    select(func.count(UserSkill.id))
                    .where(
                        UserSkill.user_id == candidat_id,
                        UserSkill.type == SkillType.fort,
                        UserSkill.competence.in_(faiblesses)
                    )
                ).one()
                score += min(40, match_skills * 10)
                messages["competences"] = ["Bon dans {} matière où vous êtes faible".format(match_skills)]

            # +30 pts — filière / niveau
            user = session.get(User, user_id)
            candidat = session.get(User, candidat_id)
            if user.filiere == candidat.filiere and user.filiere is not None:
                messages["filiere"] = ["Même filière que vous"]
                score += 20
                
            if user.level  == candidat.level and user.level is not None:
                messages["niveau"] = ["Même niveau que vous"]
                score += 10

            # +30 pts — disponibilités communes
            dispos_user = session.exec(
                select(Disponibilite)
                .where(Disponibilite.user_id == user_id)
            ).all()

            if dispos_user:
                dispos_communes = 0
                dispos_candidat = session.exec(
                    select(Disponibilite)
                    .where(
                        Disponibilite.user_id == candidat_id,
                    )
                ).all()
                for dispo_candidat in dispos_candidat:
                    for dispo_user in dispos_user:
                        if dispo_candidat.jour == dispo_user.jour and \
                            dispo_candidat.heure_debut <= dispo_user.heure_debut and \
                            dispo_candidat.heure_fin >= dispo_user.heure_fin:
                                dispos_communes += 1
                                messages.setdefault("dispos", []).append(
                                    f"Dispo jour {dispo_candidat.jour.value} comme vous et ses heures " 
                                    f"englobent les votres {dispo_candidat.heure_debut} - {dispo_candidat.heure_fin}(candidat) "
                                    f"{dispo_user.heure_debut} - {dispo_user.heure_fin}(vous)"
                                )
                score += min(30, dispos_communes * 10)

        return score, messages   
    
    def compute_score(self, user_identifier: int, candidat_identifier: int) -> Tuple[int, Dict]:
        """
        Méthode pour calculer le score de compatibilité entre deux utilisateurs.

        Parameters
        ----------
        user_identifier : str
            Email ou téléphone de l'utilisateur principal.
        candidat_identifier : str
            Email ou téléphone du candidat.

        Returns
        -------
        Tuple[int, Dict]
            Score (0-100) et dictionnaire des messages explicatifs.
        """
        user = self.get_user_by_email_or_phone(user_identifier)
        candidat = self.get_user_by_email_or_phone(candidat_identifier)
        if user and candidat:
            return self._compute_score(user.id, candidat.id)
        return (0, {})
        
    def _get_matches(self, user_id: int) -> List[Tuple[User, int, Dict]]:
        """
        Méthode interne pour obtenir tous les matchings d'un utilisateur triés par score.

        Parameters
        ----------
        user_id : int
            ID de l'utilisateur.

        Returns
        -------
        List[Tuple[User, int, Dict]]
            Liste triée de tuples (candidat, score, messages).
        """
        with self.get_session() as s:
            all_ = s.exec(
                select(User).where(User.id != user_id)
            ).all()
        
        scores = [
            (candidat, *self._compute_score(user_id, candidat.id))
            for candidat in all_
        ]
        return sorted(scores, key=lambda x: x[1], reverse=True)
    
    def get_matches(self, identifier: int) -> List[Tuple[User, int, Dict]]:
        """
        Méthode pour obtenir tous les matchings d'un utilisateur triés par score.

        Parameters
        ----------
        identifier : str
            Email ou téléphone de l'utilisateur.

        Returns
        -------
        List[Tuple[User, int, Dict]]
            Liste triée de tuples (candidat, score, messages).
        """
        user = self.get_user_by_email_or_phone(identifier)
        return self._get_matches(user.id) if user else []

    def to_dict(self, obj, **kwargs) -> Dict:
        """
        Méthode utilitaire pour transformer table en dictionnaire propre

        Parametersos.makedirs(USER_CACHE_DIR, exist_ok=True)

        ----------
        obj : Any
            Une instance des tables.
        **kwargs : dict
            Arguments nommées supplémentaires.

        Returns
        -------
        Dict
            Dictionnaire final.

        """
        with self.get_session() as session:
            try:
                merged = session.merge(obj)
                session.refresh(merged)
                return merged.model_dump(**kwargs)
            except:
                return {}

if __name__ == "__main__":
    import bcrypt
    
    db = DBManager()
    SQLModel.metadata.drop_all(db.engine)
    SQLModel.metadata.create_all(db.engine)
    
    # =========================================================================
    # Création users
    # =========================================================================
    
    sam = User(
        nom="Hounsou",
        prenom="Sam",
        email="sam@ifri.bj",
        phone="97000001",
        bio="Passionné d'IA",
        password_hash=bcrypt.hashpw("password123".encode(), bcrypt.gensalt()).decode(),
        passphrase_hash=bcrypt.hashpw("mon chien s'appelle rex".encode(), bcrypt.gensalt()).decode(),
        passphrase_question="Nom de ton premier animal ?",
        filiere=Filiere.IA,
        level=Level.L1,
    )
    
    felix = User(
        nom="Koudjo",
        prenom="Felix",
        email="felix@ifri.bj",
        phone="97000002",
        bio="Dev web",
        password_hash=bcrypt.hashpw("password456".encode(), bcrypt.gensalt()).decode(),
        passphrase_hash=bcrypt.hashpw("ma rue principale".encode(), bcrypt.gensalt()).decode(),
        passphrase_question="Ta rue d'enfance ?",
        filiere=Filiere.GL,
        level=Level.L1,
    )
    
    sam   = db.create_user(sam)
    felix = db.create_user(felix)
    print(f"Users créés : {sam.prenom} (id={sam.id}), {felix.prenom} (id={felix.id})")
    
    # =========================================================================
    # Skills
    # =========================================================================
    
    db.add_skill(UserSkill(user_id=sam.id,   competence="Python",      type=SkillType.fort))
    db.add_skill(UserSkill(user_id=sam.id,   competence="SQL",         type=SkillType.faible))
    db.add_skill(UserSkill(user_id=felix.id, competence="SQL",         type=SkillType.fort))
    db.add_skill(UserSkill(user_id=felix.id, competence="Python",      type=SkillType.faible))
    print("Skills ajoutés")
    
    # =========================================================================
    # Disponibilités
    # =========================================================================
    
    db_sam = Disponibilite(user_id=sam.id,   jour=Days.lundi,  heure_debut="14:00", heure_fin="16:00")
    db_felix = Disponibilite(user_id=felix.id, jour=Days.lundi, heure_debut="13:00", heure_fin="17:00")
    
    with db.get_session() as session:
        session.add(db_sam)
        session.add(db_felix)
        session.commit()
    print("Dispos ajoutées")
    
    # =========================================================================
    # Matching
    # =========================================================================
    
    score, messages = db._compute_score(sam.id, felix.id)
    print(f"\nScore Sam -> Felix : {score}/100")
    for k, v in messages.items():
        if v:
            print(f"  {k}: {v}")

    # =========================================================================
    # Offres
    # =========================================================================
    
    offre = Offre(
        user_id=felix.id,
        competence="SQL",
        type=OffreType.offre,
        format=OffreFormat.en_ligne,
        description="Je peux aider en SQL débutant",
    )
    offre = db.create_offre(offre)
    print(f"\nOffre créée : id={offre.id}, competence={offre.competence}")
    
    actives = db.get_active_offres()
    print(f"Offres actives : {len(actives)}")
    
    reponse = OffreResponse(offre_id=offre.id, answer_id=sam.id)
    reponse = db.answer_to_offre(reponse)
    print(f"Réponse envoyée : id={reponse.id}, statut={reponse.statut}")
    
    db.accept_reponse(reponse.id, close_offer=True)
    print("Réponse acceptée, offre clôturée")
    
    # =========================================================================
    # Messagerie
    # =========================================================================
    
    db.send_message(Message(sender_id=sam.id,   receiver_id=felix.id, contenu="Salut Felix !"))
    db.send_message(Message(sender_id=felix.id, receiver_id=sam.id,   contenu="Salut Sam !"))
    db.send_message(Message(sender_id=sam.id,   receiver_id=felix.id, contenu="On commence quand ?"))
    
    conv = db._get_conversation(sam.id, felix.id)
    print(f"\nConversation ({len(conv)} messages):")
    for m in conv:
        print(f"  [{m.created_at.strftime('%H:%M')}] {m.sender_id} -> {m.receiver_id} : {m.contenu}")
    
    non_lus = db._get_unread_count(felix.id)
    print(f"Messages non lus pour Felix : {non_lus}")
    
    db._mark_conversation_read(sam.id, felix.id)
    non_lus = db._get_unread_count(felix.id)
    print(f"Après lecture : {non_lus}")
    
    # =========================================================================
    # Validations
    # =========================================================================
    
    print(f"\nEmail 'sam@ifri.bj' disponible ? {db.verify_email_validity('sam@ifri.bj')}")
    print(f"Email 'nouveau@ifri.bj' disponible ? {db.verify_email_validity('nouveau@ifri.bj')}")
    sam = db.get_user_by_id(1)
    print(sam.skills)
    print(db.to_dict(sam))
                
        
    
        