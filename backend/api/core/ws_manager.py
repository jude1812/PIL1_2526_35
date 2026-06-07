#!/usr/bin/env python3
# -*- coding: utf-8 -*-


from fastapi import WebSocket

class WSManager:
    def __init__(self):
        self.ws: dict[str, WebSocket] = {}
    
    def connect(self, ws: WebSocket, username: str):
        self.ws[username] = ws
    
    def disconnect(self, username: str) -> bool:
        if username in self.ws:
            self.ws.pop(username)
            return True
        return False
    
    def verify_user(self, username: str):
        return username in self.ws
    
    async def send_message(self, who: str, to: str, msg: str = "", type: str = None):
        """ who : Qui envoie le message, to: À qui """
        if not to or not who:
            raise ValueError("WHO et TO requis pour envoyer le message !")
        try:
            if self.verify_user(username=to) and self.verify_user(username=who):
                data = {
                    "from": who,
                    "to": to,
                    "type": type if type else "message",
                    "message": msg
                }
                if to in self.ws:
                    websocket = self.ws[to]
                    await websocket.send_json(data)
                    
                who_ws = self.ws[who]
                to_online = self.verify_user(to)
                s_msg = "online" if to_online else "offline"
                
                if to != "serveur":
                    s_data = {
                        "from": "serveur",
                        "to": who,
                        "type": "message",
                        "message": f"Succès, {s_msg}"
                    }
                    await who_ws.send_json(s_data)
                return True
        
            else:
                s_data = {
                    "from": "serveur",
                    "to": who,
                    "type": "message",
                    "message": "Échec, destinataire non enrégistré !"
                    }
                who_ws = self.ws[who]
                await who_ws.send_json(s_data)
                return False
            
        except Exception as e:
            print("Erreur lors de l'envoie du message : ", str(e))
            return False
    
    async def send_all(self, msg: str, who: str = "serveur"):
        if not who:
            raise ValueError("WHO requis pour envoyer le message !")
            
        try:
            if self.verify_user(username=who):
                data = {
                    "from": who,
                    "to": "all",
                    "type": "message",
                    "message": msg
                }
                for name, ws in self.ws.items():
                    await ws.send_json(data)
                return True
            return False
        except Exception as e:
            print("Erreur lors de l'envoie du message à tous les user connectés : ", str(e))
            return False
