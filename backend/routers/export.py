"""
export.py — Endpoints de exportación y consulta del dataset.

GET /api/preview         → primeras 50 filas en JSON
GET /api/before-after    → comparación original vs. actual con celdas marcadas
GET /api/download        → descarga del CSV imputado
"""
from __future__ import annotations

import io
from datetime import datetime

import pandas as pd
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from backend.session import session

router = APIRouter()


def _safe_value(v):
    """Convierte valores de pandas a tipos JSON-serializables."""
    if pd.isna(v):
        return None
    if hasattr(v, "item"):
        return v.item()
    return v


@router.get("/preview")
async def preview():
    """Retorna las primeras 50 filas del dataset actual."""
    if not session.is_loaded:
        raise HTTPException(
            status_code=400,
            detail={"error": "Sin datos", "detail": "No hay dataset cargado."},
        )
    df = session.df_current.head(50)
    data = [
        {col: _safe_value(row[col]) for col in df.columns}
        for _, row in df.iterrows()
    ]
    return {"data": data, "total_rows": len(session.df_current), "columns": list(df.columns)}


@router.get("/before-after")
async def before_after():
    """
    Retorna los datasets original y actual con marcado de celdas modificadas.
    Response: { columns, before: [...], after: [...], changed_cells: {col: [row_idx]} }
    """
    if not session.is_loaded:
        raise HTTPException(
            status_code=400,
            detail={"error": "Sin datos", "detail": "No hay dataset cargado."},
        )

    df_orig = session.df_original
    df_curr = session.df_current
    columns = list(df_orig.columns)

    # Limitar a primeras 200 filas para rendimiento en la UI
    max_rows = 200
    orig_rows = df_orig.head(max_rows)
    curr_rows = df_curr.head(max_rows)

    before = []
    after = []
    for i in range(len(orig_rows)):
        row_orig = {col: _safe_value(orig_rows.iloc[i][col]) for col in columns}
        row_curr = {col: _safe_value(curr_rows.iloc[i][col]) for col in columns}
        before.append(row_orig)
        after.append(row_curr)

    # Celdas que fueron nulas y ahora tienen valor
    changed: dict = {}
    for col in columns:
        orig_null_mask = df_orig[col].isna()
        curr_has_value = df_curr[col].notna()
        changed_idx = list(df_orig.index[orig_null_mask & curr_has_value][:max_rows])
        if changed_idx:
            changed[col] = [int(i) for i in changed_idx]

    return {
        "columns": columns,
        "before": before,
        "after": after,
        "changed_cells": changed,
        "total_rows": len(df_orig),
        "showing_rows": len(orig_rows),
    }


@router.get("/download")
async def download():
    """Descarga el dataset imputado como archivo .csv."""
    if not session.is_loaded:
        raise HTTPException(
            status_code=400,
            detail={"error": "Sin datos", "detail": "No hay dataset cargado."},
        )

    # Generar nombre descriptivo
    imputed_cols = list(session.imputed_cells.keys())
    col_str = "_".join(imputed_cols[:2]) if imputed_cols else "dataset"
    date_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    base = session.filename.replace(".csv", "")
    filename = f"{base}__imputado_{col_str}_{date_str}.csv"

    csv_buffer = io.StringIO()
    session.df_current.to_csv(csv_buffer, index=False, encoding="utf-8")
    csv_buffer.seek(0)

    return StreamingResponse(
        io.BytesIO(csv_buffer.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
