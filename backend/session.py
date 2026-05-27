"""
session.py — Estado global de la sesión en memoria.

El DataFrame vive aquí durante la sesión del servidor. No hay base de datos.
"""
from __future__ import annotations

from typing import Dict, List, Optional, Set, Tuple

import pandas as pd


class AppSession:
    """Contenedor del estado de la sesión actual."""

    def __init__(self) -> None:
        self.df_original: Optional[pd.DataFrame] = None
        self.df_current: Optional[pd.DataFrame] = None
        self.filename: str = ""
        self.size_bytes: int = 0
        # Rastreo de celdas imputadas: { nombre_columna: set de índices de fila }
        self.imputed_cells: Dict[str, Set[int]] = {}

    def reset(self) -> None:
        """Limpia el estado de la sesión para iniciar un nuevo análisis."""
        self.df_original = None
        self.df_current = None
        self.filename = ""
        self.size_bytes = 0
        self.imputed_cells = {}

    @property
    def is_loaded(self) -> bool:
        return self.df_current is not None


# Instancia global compartida por todos los routers
session = AppSession()
