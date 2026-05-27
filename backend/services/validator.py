"""
validator.py — Validación de archivos CSV antes de procesarlos.

Verifica extensión y tamaño (máximo 50 MB).
"""
from __future__ import annotations

MAX_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSIONS: tuple[str, ...] = (".csv",)


def validate_csv_file(filename: str, size: int) -> tuple[bool, str]:
    """
    Valida que el archivo sea un CSV válido y no supere el tamaño máximo.

    Returns:
        (True, "") si es válido.
        (False, mensaje_de_error) si no lo es.
    """
    lower = filename.lower()
    if not any(lower.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        return False, (
            f"Formato no válido: '{filename}'. "
            "El sistema solo acepta archivos con extensión .csv"
        )
    if size > MAX_SIZE_BYTES:
        mb = size / 1024 / 1024
        return False, (
            f"El archivo supera el límite de 50 MB (tamaño detectado: {mb:.1f} MB). "
            "Por favor reduce el dataset antes de subirlo."
        )
    return True, ""
