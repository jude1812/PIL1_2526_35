#!/usr/bin/env python3
# -*- coding: utf-8 -*-


import bcrypt
            
def hashpw(password:str):
    if isinstance(password, str):
        password = password.encode()
    
    return bcrypt.hashpw(password, bcrypt.gensalt())

def checkpw(password:str, hashed:bytes):
    if isinstance(password, str):
        password = password.encode()
    
    hashed = hashed if isinstance(hashed, bytes) else hashed.encode()

    return bcrypt.checkpw(password=password, hashed_password=hashed)

def checksalt(salt):
    try:
        password = "password".encode()
        bcrypt.hashpw(password, salt)
        return True
    except:
        return False
 
