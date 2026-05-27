"""
analyzer.py — Análisis descriptivo y detección de nulos con pandas.

Función principal: analyze(df) → dict con estadísticas por columna y matriz heatmap.
"""
from __future__ import annotations

from typing import Any, Dict, List

import numpy as np
import pandas as pd


def _detect_type(series: pd.Series) -> str:
    """Infiere el tipo semántico de la columna."""
    if pd.api.types.is_float_dtype(series):
        return "float"
    if pd.api.types.is_integer_dtype(series):
        return "int"
    # Categórica si los únicos observados son <= 20% del total o <= 50 valores
    unique = series.nunique(dropna=True)
    total = len(series.dropna())
    if total > 0 and (unique <= 20 or unique / total <= 0.20):
        return "categorical"
    return "string"


def _histogram_bins(nums: np.ndarray, bins: int = 12) -> List[Dict[str, float]]:
    """Genera datos de histograma para una serie numérica."""
    if len(nums) == 0:
        return []
    counts, edges = np.histogram(nums, bins=bins)
    return [
        {"label": round(float(edges[i]), 2), "count": int(counts[i])}
        for i in range(len(counts))
    ]


def _top_categories(series: pd.Series, top_n: int = 10) -> List[Dict[str, Any]]:
    """Devuelve las categorías más frecuentes."""
    vc = series.dropna().value_counts().head(top_n)
    return [{"value": str(k), "count": int(v)} for k, v in vc.items()]


def analyze(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Calcula estadísticas descriptivas completas y matriz de completitud.

    Returns:
        {
            columns: [{ name, type, nulls, total, completeness, unique, ...stats }],
            heatmap: [[1/0 por celda]], # 1=presente, 0=nulo
            total_rows: int,
            total_cols: int,
            total_nulls: int,
            overall_completeness: float,
        }
    """
    columns: List[Dict[str, Any]] = []
    heatmap: List[List[int]] = []  # heatmap[col_idx][row_idx]
    total_nulls = int(df.isna().sum().sum())

    for col_name in df.columns:
        series = df[col_name]
        total = len(series)
        null_count = int(series.isna().sum())
        present = series.dropna()
        completeness = round(((total - null_count) / total) * 100, 2) if total > 0 else 0.0

        col_data: Dict[str, Any] = {
            "name": col_name,
            "type": _detect_type(series),
            "nulls": null_count,
            "total": total,
            "completeness": completeness,
            "unique": int(series.nunique(dropna=True)),
        }

        if pd.api.types.is_numeric_dtype(series):
            nums = present.to_numpy(dtype=float, na_value=np.nan)
            nums = nums[~np.isnan(nums)]
            if len(nums) > 0:
                col_data.update(
                    {
                        "mean": round(float(np.mean(nums)), 4),
                        "median": round(float(np.median(nums)), 4),
                        "std": round(float(np.std(nums, ddof=1)), 4) if len(nums) > 1 else 0.0,
                        "min": round(float(np.min(nums)), 4),
                        "max": round(float(np.max(nums)), 4),
                        "q25": round(float(np.percentile(nums, 25)), 4),
                        "q75": round(float(np.percentile(nums, 75)), 4),
                        "histogram": _histogram_bins(nums),
                    }
                )
            else:
                col_data.update(
                    {"mean": None, "median": None, "std": None, "min": None, "max": None,
                     "q25": None, "q75": None, "histogram": []}
                )
        else:
            vc = present.value_counts()
            mode_val = str(vc.index[0]) if len(vc) > 0 else "—"
            mode_freq = int(vc.iloc[0]) if len(vc) > 0 else 0
            col_data.update(
                {
                    "mode": mode_val,
                    "mode_freq": mode_freq,
                    "categories": _top_categories(series),
                }
            )

        columns.append(col_data)

        # Heatmap: 1=presente, 0=nulo
        heatmap.append(series.notna().astype(int).tolist())

    total_cells = len(df) * len(df.columns)
    overall = round(((total_cells - total_nulls) / total_cells) * 100, 2) if total_cells > 0 else 0.0

    return {
        "columns": columns,
        "heatmap": heatmap,
        "total_rows": len(df),
        "total_cols": len(df.columns),
        "total_nulls": total_nulls,
        "total_cells": total_cells,
        "overall_completeness": overall,
    }
