"""
upload.py — POST /api/upload
Recibe el archivo CSV como multipart/form-data, valida y carga en sesión.
"""
from __future__ import annotations

import io

import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse

from backend.session import session
from backend.services.validator import validate_csv_file

router = APIRouter()


@router.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    """
    Recibe un archivo CSV, lo valida y lo carga en memoria.
    Response: { success, filename, rows, columns, size_bytes }
    """
    content = await file.read()
    size = len(content)

    ok, msg = validate_csv_file(file.filename or "unknown.csv", size)
    if not ok:
        raise HTTPException(
            status_code=400,
            detail={"error": "Archivo no válido", "detail": msg},
        )

    # Intentar leer el CSV con detección de encoding y separador
    try:
        for encoding in ("utf-8", "latin-1", "cp1252"):
            try:
                df = pd.read_csv(
                    io.BytesIO(content),
                    encoding=encoding,
                    sep=None,           # autodetección del separador
                    engine="python",
                )
                break
            except UnicodeDecodeError:
                continue
        else:
            raise ValueError("No se pudo decodificar el archivo con ningún encoding conocido.")
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail={"error": "Error al leer el CSV", "detail": str(exc)},
        )

    # Guardar en sesión
    session.reset()
    session.df_original = df.copy()
    session.df_current = df.copy()
    session.filename = file.filename or "dataset.csv"
    session.size_bytes = size

    return {
        "success": True,
        "filename": session.filename,
        "rows": len(df),
        "columns": len(df.columns),
        "size_bytes": size,
        "message": f"Archivo cargado: {len(df)} filas × {len(df.columns)} columnas",
    }


@router.post("/reset")
async def reset_session():
    """Limpia el estado de sesión para cargar un nuevo dataset."""
    session.reset()
    return {"success": True, "message": "Sesión reiniciada correctamente."}
