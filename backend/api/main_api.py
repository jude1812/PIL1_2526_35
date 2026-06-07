#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
"""

import os, sys
sys.path.insert(1, os.path.dirname(os.path.abspath(os.path.join(__file__, "..", ".."))))
import asyncio
import uvicorn
import atexit
import aiohttp
import threading
from fastapi import HTTPException, FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from slowapi.util import get_remote_address
from contextlib import asynccontextmanager
from backend.api.api_config import (
    IP, PORT, LIMITE, REACT_EXISTS,
    INDEX_FILE, STATICDIR, BUILD_DIR,
    FASTAPIDIR, WS_UPLOAD_DIR, PROFILE_IMG_DIR,
)
from backend.utils.limiter import limiter
from backend.api.router import router
import backend.api.router as r

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 API lancée !")
    r.get_db_manager()
    r.get_ws_manager()
    yield
    print("👋 API fermée !")
    
    
server = None
app = FastAPI(
    version="1.0",
    docs_url='/api/docs',
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
    )

app.include_router(router, prefix="/api")
app.add_middleware(
    CORSMiddleware,
    allow_methods=["*"],
    allow_credentials=True,
    allow_origins=[
        "*"
    ],
    allow_headers=['*'],
    )
app.mount("/api/static/fastapi_mount", StaticFiles(directory=FASTAPIDIR), name="static_fastapi_mount")
app.mount("/api/static/profils_img", StaticFiles(directory=PROFILE_IMG_DIR), name="static_profils_img")
app.mount("/api/static/ws_files", StaticFiles(directory=WS_UPLOAD_DIR), name="static_ws_files")
if REACT_EXISTS:
    app.mount("/static/react/static", StaticFiles(directory=STATICDIR), name="static_react")
    app.mount("/static/react/build", StaticFiles(directory=BUILD_DIR), name="build_react")

def __close_api():
    global server
    server.should_exit = True
    
@app.get('/api/close')
def _close_api():
    global server
    if server is None:
        print('Serveur non lancé !')
        return {
            "message ": "Serveur non lancé !"
            }
    else:
        __close_api()
        print('Serveur fermé.')
        return {
            "message ": 'Serveur fermé.'
            }
    
@app.get("/api/test")
def _test():
    return {
        "message": "Test de l'api !"
        }

@app.get("/api/rate-limit-status")
@limiter.limit(f"{LIMITE}/minute")
async def rate_limit_status(request: Request):
    return {
        "ip": get_remote_address(request),
        "limit": f"{LIMITE}/minute"
    }

@app.get("/")
async def serve_react_app():
    """Sert l'application React - point d'entrée"""
    if REACT_EXISTS:
        return FileResponse(INDEX_FILE)
    else:
        return {
        }


def start(app, host: str = "0.0.0.0", port: int = 8000):
    """Démarre le serveur dans un thread séparé."""
    global server
    loop = "uvloop" if sys.platform != "win32" else "asyncio"
    config = uvicorn.Config(app, host=host, port=port, loop=loop, use_colors=True, workers=10)
    server = uvicorn.Server(config=config)
    th = threading.Thread(target=server.run, daemon=True)
    return th, server


def stop(th: threading.Thread, timeout: int = 5):
    """Arrête proprement le thread serveur."""
    print("Arrêt du serveur...")
    th.join(timeout)
    print("Serveur arrêté.")

async def close_api(url):
    """Ferme l'API (utilitaire)."""
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            print('Statut : ', response.status)


def close_api_atexit(url):
    """Enregistre la fermeture de l'API à la sortie."""
    def _close():
        try:
            loop = asyncio.new_event_loop()
            loop.run_until_complete(close_api(url))
            loop.close()
        except:
            pass
    atexit.register(_close)
    
    
@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    """Capture toutes les routes pour React Router"""
    excluded_prefixes = ["api/", "docs", "redoc", "openapi.json"]
    print(full_path)
    if any(full_path.startswith(prefix) for prefix in excluded_prefixes):
        raise HTTPException(404, detail="Route non trouvée")
        
    if full_path.startswith("static/"):
        return FileResponse(os.path.join(STATICDIR, full_path.removeprefix("static/")))
    
    elif full_path.startswith("build/"):
        return FileResponse(os.path.join(BUILD_DIR, full_path.removeprefix("build/")))
    
    elif REACT_EXISTS:
        return FileResponse(INDEX_FILE)
    
    else:
        raise HTTPException(status_code=404, detail="Route non trouvée")
