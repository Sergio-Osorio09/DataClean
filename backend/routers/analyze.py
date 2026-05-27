"""
analyze.py — GET /api/analyze
Retorna estadísticas descriptivas completas + mapa de nulos del dataset actual.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.session import session
from backend.services.analyzer import analyze

router = APIRouter()


@router.get("/analyze")
async def analyze_dataset():
    """
    Analiza el dataset cargado y retorna:
    - columns: estadísticas por columna (tipo, nulos, media, mediana, σ, ...)
    - heatmap: matriz binaria [col][row] (1=presente, 0=nulo)
    - totales globales
    """
    if not session.is_loaded:
        raise HTTPException(
            status_code=400,
            detail={"error": "Sin datos", "detail": "No hay ningún dataset cargado. Sube un CSV primero."},
        )

    result = analyze(session.df_current)
    result["filename"] = session.filename
    result["size_bytes"] = session.size_bytes
    return result
