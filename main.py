"""
DataClean Pro — Entry Point
Inicia FastAPI, monta el frontend, registra routers y abre el navegador automáticamente.
"""
import threading
import webbrowser

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from backend.routers import upload, analyze, impute, export


class NoCacheMiddleware(BaseHTTPMiddleware):
    """Evita que el navegador cachee JS, CSS y HTML — útil en desarrollo."""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.url.path.endswith((".js", ".css", ".html", "/")):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response

app = FastAPI(
    title="DataClean Pro",
    version="1.0.0",
    description="Sistema de Análisis e Imputación de Datos CSV",
)
app.add_middleware(NoCacheMiddleware)

# ── Registrar routers de la API ──────────────────────────────────────────────
app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(analyze.router, prefix="/api", tags=["analyze"])
app.include_router(impute.router, prefix="/api", tags=["impute"])
app.include_router(export.router, prefix="/api", tags=["export"])

# ── Servir archivos estáticos del frontend ───────────────────────────────────
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")


def _open_browser() -> None:
    webbrowser.open("http://127.0.0.1:8000")


if __name__ == "__main__":
    # Abre el navegador 1 segundo después de que el servidor arranque
    threading.Timer(1.0, _open_browser).start()
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=False,
        log_level="info",
    )
