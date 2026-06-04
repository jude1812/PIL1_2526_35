#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue May 26 09:05:03 2026

@author: hounsousamuel
"""

import os
IP = "0.0.0.0"
PORT = 9000
API_HOST_PUBLIC = "localhost"  
API_PORT = 9000
LIMITE = 10
ALLOWED_ORIGINS = ["*"]
NOT_BEFORE = 0.1
EXP = 60 * 3
MAX_CONFIG_SIZE = 20 * 1024  # 20KB
STATICDIR = "."
BUILD_DIR = "."
INDEX_FILE = "."
REACT_EXISTS = False

IMG_EXTENSIONS = (".jpg", ".jpeg", ".png", ".ppm", ".bmp", ".pgm", ".tif", ".tiff", ".webp")
BASEDIR = os.path.dirname(os.path.abspath(__file__))
FASTAPIDIR = os.path.abspath(os.path.join(BASEDIR, "..", "fastapi_mount", "files"))
PROFILE_IMG_DIR = os.path.join(FASTAPIDIR, "img_profils")
WS_UPLOAD_DIR = os.path.join(FASTAPIDIR, "ws_upload_dir")
DIRS = [FASTAPIDIR, PROFILE_IMG_DIR, WS_UPLOAD_DIR]
for path in DIRS:
    os.makedirs(path, exist_ok=True)