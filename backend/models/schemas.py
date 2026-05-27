"""
schemas.py — Modelos Pydantic para request/response de la API.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ImputeRequest(BaseModel):
    """Body de POST /api/impute"""
    column: str = Field(..., description="Nombre de la columna a imputar")
    method: str = Field(..., description="Técnica: mean|median|mode|ffill|bfill|linear|knn|regression|knn_class")
    params: Optional[Dict[str, Any]] = Field(default={}, description="Parámetros opcionales (p.ej. k para KNN)")


class UploadResponse(BaseModel):
    success: bool
    filename: str
    rows: int
    columns: int
    size_bytes: int
    message: str = ""


class ImputeResponse(BaseModel):
    success: bool
    column: str
    method: str
    imputed_count: int
    nulls_before: int
    nulls_after: int
    message: str = ""


class ErrorResponse(BaseModel):
    error: str
    detail: str
