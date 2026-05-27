"""
imputer.py — Las 9 técnicas de imputación de DataClean Pro.

Cada técnica es una función independiente con docstring que incluye la fórmula
matemática. La función pública impute() despacha al método correcto.
"""
from __future__ import annotations

from typing import Any, Dict, Optional, Set, Tuple

import numpy as np
import pandas as pd
from sklearn.impute import KNNImputer, SimpleImputer
from sklearn.experimental import enable_iterative_imputer  # noqa: F401
from sklearn.impute import IterativeImputer
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder


# ── Técnica 1: Media ─────────────────────────────────────────────────────────

def _impute_mean(df: pd.DataFrame, column: str) -> Tuple[pd.Series, Set[int]]:
    """
    Fórmula: x̄ = (1/n) · Σᵢ xᵢ
    Sustituye los nulos por la media aritmética de los valores observados.
    Requiere columna numérica.
    """
    series = df[column].copy()
    null_idx = set(series[series.isna()].index.tolist())
    imp = SimpleImputer(strategy="mean")
    filled = imp.fit_transform(series.to_frame())
    result = pd.Series(filled.flatten(), index=series.index, name=column)
    result = result.round(4)
    return result, null_idx


# ── Técnica 2: Mediana ────────────────────────────────────────────────────────

def _impute_median(df: pd.DataFrame, column: str) -> Tuple[pd.Series, Set[int]]:
    """
    Fórmula: Med = X[(n+1)/2] si n impar, (X[n/2]+X[n/2+1])/2 si par
    Más robusta que la media ante distribuciones asimétricas y outliers.
    Requiere columna numérica.
    """
    series = df[column].copy()
    null_idx = set(series[series.isna()].index.tolist())
    imp = SimpleImputer(strategy="median")
    filled = imp.fit_transform(series.to_frame())
    result = pd.Series(filled.flatten(), index=series.index, name=column)
    result = result.round(4)
    return result, null_idx


# ── Técnica 3: Moda ───────────────────────────────────────────────────────────

def _impute_mode(df: pd.DataFrame, column: str) -> Tuple[pd.Series, Set[int]]:
    """
    Fórmula: Mo = argmaxₓ freq(x)
    Sustituye los faltantes por el valor más frecuente. Válida para
    columnas numéricas y categóricas.

    NOTA: NO convertir a str antes de imputar — astype(str) convierte NaN al
    literal "nan", que SimpleImputer trata como valor presente (no faltante)
    y deja sin reemplazar.
    """
    series = df[column].copy()
    null_idx = set(series[series.isna()].index.tolist())

    # Calcular la moda con pandas — más robusto que SimpleImputer para columnas
    # object/string porque maneja correctamente tanto None como np.nan.
    # SimpleImputer falla en estos casos porque: (a) astype(str) convierte NaN → "nan"
    # literal, y (b) None en columnas object no siempre se detecta como faltante.
    mode_series = series.mode(dropna=True)
    if len(mode_series) == 0:
        # Sin datos no nulos: no se puede calcular moda, devolver sin cambios
        return series, null_idx

    mode_val = mode_series.iloc[0]  # valor más frecuente
    result = series.fillna(mode_val)
    return result, null_idx


# ── Técnica 4: Forward Fill ───────────────────────────────────────────────────

def _impute_ffill(df: pd.DataFrame, column: str) -> Tuple[pd.Series, Set[int]]:
    """
    Fórmula: x̂ᵢ = xⱼ, j = max{k<i: xₖ≠∅}
    Propaga hacia adelante el último valor observado.
    Válida para series temporales o datos con orden natural.
    """
    series = df[column].copy()
    null_idx = set(series[series.isna()].index.tolist())
    result = series.ffill()
    return result, null_idx


# ── Técnica 5: Backward Fill ──────────────────────────────────────────────────

def _impute_bfill(df: pd.DataFrame, column: str) -> Tuple[pd.Series, Set[int]]:
    """
    Fórmula: x̂ᵢ = xⱼ, j = min{k>i: xₖ≠∅}
    Propaga hacia atrás el siguiente valor observado.
    Válida para series temporales donde el siguiente valor es más representativo.
    """
    series = df[column].copy()
    null_idx = set(series[series.isna()].index.tolist())
    result = series.bfill()
    return result, null_idx


# ── Técnica 6: Interpolación Lineal ──────────────────────────────────────────

def _impute_linear(df: pd.DataFrame, column: str) -> Tuple[pd.Series, Set[int]]:
    """
    Fórmula: x̂ᵢ = x_{i₁} + (i-i₁)/(i₂-i₁) · (x_{i₂}-x_{i₁})
    Estima los faltantes sobre una recta entre los dos puntos observados adyacentes.
    Requiere columna numérica y datos ordenados.
    """
    series = df[column].copy()
    null_idx = set(series[series.isna()].index.tolist())
    result = series.interpolate(method="linear", limit_direction="both")
    result = result.round(4)
    return result, null_idx


# ── Técnica 7: KNN (K vecinos) ────────────────────────────────────────────────

def _impute_knn(df: pd.DataFrame, column: str, k: int = 3) -> Tuple[pd.Series, Set[int]]:
    """
    Fórmula: x̂ = Σwₖxₖ / Σwₖ ; wₖ = 1/d(i,k)
    Promedio ponderado por distancia inversa de los K vecinos más cercanos.
    Usa todas las columnas numéricas del DataFrame para calcular distancias.
    Requiere columna numérica.
    """
    series = df[column].copy()
    null_idx = set(series[series.isna()].index.tolist())

    # Seleccionar columnas numéricas para el cálculo de vecinos
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if column not in num_cols:
        num_cols = [column] + num_cols
    subset = df[num_cols].copy()

    imp = KNNImputer(n_neighbors=max(1, k), weights="distance")
    filled = imp.fit_transform(subset)
    filled_df = pd.DataFrame(filled, index=df.index, columns=num_cols)

    result = filled_df[column].round(4)
    return result, null_idx


# ── Técnica 8: Regresión Lineal (Predicción) ──────────────────────────────────

def _impute_regression(df: pd.DataFrame, column: str) -> Tuple[pd.Series, Set[int]]:
    """
    Fórmula: ŷ = β₀ + β₁x ; β₁ = Σ(xᵢ-x̄)(yᵢ-ȳ) / Σ(xᵢ-x̄)²
    Predice el valor faltante modelando la columna como función lineal de las demás.
    Usa IterativeImputer (MICE) con LinearRegression como estimador.
    Requiere columna numérica.
    """
    series = df[column].copy()
    null_idx = set(series[series.isna()].index.tolist())

    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if column not in num_cols:
        num_cols = [column] + num_cols
    subset = df[num_cols].copy()

    imp = IterativeImputer(
        estimator=LinearRegression(),
        max_iter=10,
        random_state=42,
    )
    filled = imp.fit_transform(subset)
    filled_df = pd.DataFrame(filled, index=df.index, columns=num_cols)

    result = filled_df[column].round(4)
    return result, null_idx


# ── Técnica 9: Clasificación KNN (Categórica) ────────────────────────────────

def _impute_knn_class(df: pd.DataFrame, column: str, k: int = 3) -> Tuple[pd.Series, Set[int]]:
    """
    Fórmula: ŷ = argmaxc { Σ 𝟙(yₖ=c) · wₖ }
    Variante categórica de KNN: codifica la variable con LabelEncoder,
    aplica KNNImputer y decodifica de vuelta a las categorías originales.
    Requiere columna categórica o string.
    """
    series = df[column].copy()
    null_idx = set(series[series.isna()].index.tolist())

    # Codificar la columna objetivo
    le = LabelEncoder()
    non_null = series.dropna()
    le.fit(non_null.astype(str))

    encoded = series.astype(str).map(
        lambda x: le.transform([x])[0] if x != "nan" else np.nan
    )

    # Usar columnas numéricas como features para calcular distancias
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    work = pd.concat([encoded.rename(column), df[num_cols]], axis=1)

    imp = KNNImputer(n_neighbors=max(1, k), weights="distance")
    filled = imp.fit_transform(work)
    encoded_col = np.round(filled[:, 0]).astype(int)

    # Clampear al rango válido de clases
    encoded_col = np.clip(encoded_col, 0, len(le.classes_) - 1)
    result = pd.Series(le.inverse_transform(encoded_col), index=df.index, name=column)
    return result, null_idx


# ── Despachador público ───────────────────────────────────────────────────────

def impute(
    df: pd.DataFrame,
    column: str,
    method: str,
    params: Optional[Dict[str, Any]] = None,
) -> Tuple[pd.DataFrame, int, Set[int]]:
    """
    Aplica la técnica de imputación seleccionada a la columna indicada.

    Args:
        df: DataFrame actual (df_current de la sesión).
        column: Nombre de la columna a imputar.
        method: Identificador de la técnica (mean|median|mode|ffill|bfill|
                linear|knn|regression|knn_class).
        params: Parámetros adicionales (k para KNN).

    Returns:
        (df_imputado, count_imputados, set_de_índices_imputados)

    Raises:
        ValueError: Si la columna no existe o la técnica no es válida.
    """
    if params is None:
        params = {}

    if column not in df.columns:
        raise ValueError(f"La columna '{column}' no existe en el dataset.")

    nulls_before = int(df[column].isna().sum())
    if nulls_before == 0:
        return df.copy(), 0, set()

    k = int(params.get("k", 3))

    dispatch = {
        "mean":       lambda: _impute_mean(df, column),
        "median":     lambda: _impute_median(df, column),
        "mode":       lambda: _impute_mode(df, column),
        "ffill":      lambda: _impute_ffill(df, column),
        "bfill":      lambda: _impute_bfill(df, column),
        "linear":     lambda: _impute_linear(df, column),
        "knn":        lambda: _impute_knn(df, column, k=k),
        "regression": lambda: _impute_regression(df, column),
        "knn_class":  lambda: _impute_knn_class(df, column, k=k),
    }

    if method not in dispatch:
        raise ValueError(
            f"Técnica '{method}' no reconocida. "
            f"Opciones válidas: {list(dispatch.keys())}"
        )

    result_series, null_idx = dispatch[method]()

    df_out = df.copy()
    df_out[column] = result_series

    nulls_after = int(df_out[column].isna().sum())
    imputed_count = nulls_before - nulls_after

    return df_out, imputed_count, null_idx
