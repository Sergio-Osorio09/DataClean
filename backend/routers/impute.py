"""
impute.py — POST /api/impute
Aplica una técnica de imputación a una columna específica del dataset.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.session import session
from backend.services.imputer import impute
from backend.models.schemas import ImputeRequest

router = APIRouter()


@router.post("/impute")
async def impute_column(req: ImputeRequest):
    """
    Aplica la técnica seleccionada a la columna indicada.
    Body: { "column": "edad", "method": "knn", "params": { "k": 3 } }
    Response: { success, column, method, imputed_count, nulls_before, nulls_after }
    """
    if not session.is_loaded:
        raise HTTPException(
            status_code=400,
            detail={"error": "Sin datos", "detail": "No hay ningún dataset cargado."},
        )

    if req.column not in session.df_current.columns:
        raise HTTPException(
            status_code=404,
            detail={"error": "Columna no encontrada", "detail": f"La columna '{req.column}' no existe."},
        )

    nulls_before = int(session.df_current[req.column].isna().sum())

    try:
        df_out, imputed_count, null_idx = impute(
            session.df_current,
            req.column,
            req.method,
            req.params or {},
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail={"error": "Error en la imputación", "detail": str(exc)},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "Error inesperado", "detail": str(exc)},
        )

    # Actualizar sesión
    session.df_current = df_out
    if req.column not in session.imputed_cells:
        session.imputed_cells[req.column] = set()
    session.imputed_cells[req.column].update(null_idx)

    nulls_after = int(session.df_current[req.column].isna().sum())

    return {
        "success": True,
        "column": req.column,
        "method": req.method,
        "imputed_count": imputed_count,
        "nulls_before": nulls_before,
        "nulls_after": nulls_after,
        "message": f"Se imputaron {imputed_count} valores en '{req.column}' con '{req.method}'.",
    }
