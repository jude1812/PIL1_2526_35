#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""

"""

import os
IP = "0.0.0.0"
PORT = 9000
API_HOST_PUBLIC = "localhost"  
API_PORT = 9000
LIMITE = 50
ALLOWED_ORIGINS = ["*"]
NOT_BEFORE = 0.1
EXP = 60 * 3

BASEDIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND = os.path.abspath(os.path.join(BASEDIR, "..", "..", "frontend"))
BUILD_DIR = os.path.join(FRONTEND, "build")
STATICDIR = os.path.join(FRONTEND, "build", "static")
INDEX_FILE = os.path.join(BUILD_DIR, "index.html")

IMG_EXTENSIONS = (".jpg", ".jpeg", ".png", ".ppm", ".bmp", ".pgm", ".tif", ".tiff", ".webp")
FASTAPIDIR = os.path.abspath(os.path.join(BASEDIR, "..", "fastapi_mount", "files"))
PROFILE_IMG_DIR = os.path.join(FASTAPIDIR, "img_profils")
WS_UPLOAD_DIR = os.path.join(FASTAPIDIR, "ws_upload_dir")
DBPATH = os.path.abspath(os.path.join(BASEDIR, "..", "database"))
DIRS = [FASTAPIDIR, PROFILE_IMG_DIR, WS_UPLOAD_DIR, DBPATH]
for path in DIRS:
    os.makedirs(path, exist_ok=True)

REACT_EXISTS = all(os.path.exists(x) for x in (FRONTEND, BUILD_DIR, STATICDIR, INDEX_FILE))
