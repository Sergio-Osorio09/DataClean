# DataClean Pro

**Herramienta web para análisis y limpieza de datos CSV con 9 técnicas de imputación.**

Aplicación de una sola página (SPA) con backend en FastAPI y frontend en JavaScript vanilla que permite cargar un dataset CSV, explorar sus estadísticas, aplicar imputación de valores faltantes y descargar el resultado limpio.

---

## Autores

| Nombre | Rol |
|---|---|
| **Sergio Osorio** | Desarrollo fullstack, backend FastAPI, lógica de imputación |
| **Cesar Villanueva** | Desarrollo fullstack, frontend SPA, visualizaciones |

---

## Características

- 📂 **Carga de archivos CSV** hasta 50 MB con detección automática de separador y codificación
- 📊 **Análisis exploratorio** con histogramas, boxplots, heatmap de nulos y estadísticas completas
- 🧮 **9 técnicas de imputación** con fórmulas matemáticas renderizadas en KaTeX
- 🎨 **Comparación antes/después** con celdas resaltadas para identificar cambios
- 💾 **Descarga del CSV limpio** con nombre descriptivo que incluye columna, técnica y fecha
- 🌙 **Tema oscuro académico** con tipografía IBM Plex (Serif · Sans · Mono)

---

## Técnicas de imputación implementadas

| # | Técnica | Fórmula | Tipo de dato |
|---|---------|---------|-------------|
| 01 | **Media** | x̄ = (1/n) · Σᵢ xᵢ | Numérico |
| 02 | **Mediana** | Med = X[(n+1)/2] | Numérico |
| 03 | **Moda** | Mo = argmaxₓ freq(x) | Numérico / Categórico |
| 04 | **Forward Fill** | x̂ᵢ = xⱼ, j = max{k<i : xₖ≠∅} | Numérico / Categórico |
| 05 | **Backward Fill** | x̂ᵢ = xⱼ, j = min{k>i : xₖ≠∅} | Numérico / Categórico |
| 06 | **Interpolación lineal** | x̂ᵢ = x_{i₁} + (i−i₁)/(i₂−i₁)·(x_{i₂}−x_{i₁}) | Numérico |
| 07 | **KNN (regresión)** | x̂ = Σwₖxₖ / Σwₖ ; wₖ=1/d(i,k) | Numérico |
| 08 | **Regresión lineal** | ŷ = β₀ + β₁x | Numérico |
| 09 | **KNN clasificación** | ŷ = argmaxc { Σ 𝟙(yₖ=c)·wₖ } | Categórico |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Python 3.10+, FastAPI 0.104, uvicorn |
| Procesamiento | pandas 2.0, NumPy 1.24, scikit-learn 1.3 |
| Frontend | HTML5, CSS3, JavaScript ES2022 (sin frameworks) |
| Fórmulas | KaTeX 0.16 (CDN) |
| Tipografía | IBM Plex Serif · Sans · Mono (Google Fonts) |

> El frontend es vanilla JS puro, sin React, Vue, Angular ni Node.js.

---

## Requisitos

- Python 3.10 o superior
- Conexión a internet (solo para la primera carga de fuentes y KaTeX desde CDN)

---

## Instalación y ejecución

### Windows
```bat
run.bat
```

### Linux / macOS
```bash
chmod +x run.sh
./run.sh
```

### Manual
```bash
pip install -r requirements.txt
python main.py
```

El servidor arranca en **http://127.0.0.1:8000** y abre el navegador automáticamente.

---

## API REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/upload` | Carga un archivo CSV |
| `GET` | `/api/analyze` | Estadísticas y distribución de columnas |
| `POST` | `/api/impute` | Aplica una técnica de imputación |
| `GET` | `/api/preview` | Primeras 50 filas del dataset actual |
| `GET` | `/api/before-after` | Comparación original vs. imputado |
| `GET` | `/api/download` | Descarga el CSV limpio |
| `POST` | `/api/reset` | Limpia la sesión |

### Ejemplo — imputar con KNN
```bash
curl -X POST http://127.0.0.1:8000/api/impute \
  -H "Content-Type: application/json" \
  -d '{"column": "Age", "method": "knn", "params": {"k": 5}}'
```

---

## Estructura del proyecto

```
DataClean Pro/
│
├── main.py                   # Punto de entrada, arranca FastAPI + abre navegador
├── requirements.txt
├── run.bat                   # Lanzador Windows
├── run.sh                    # Lanzador Linux/macOS
│
├── backend/
│   ├── session.py            # Estado en memoria (df_original, df_current)
│   ├── models/
│   │   └── schemas.py        # Pydantic models (ImputeRequest, …)
│   ├── routers/
│   │   ├── upload.py         # POST /api/upload  |  POST /api/reset
│   │   ├── analyze.py        # GET  /api/analyze
│   │   ├── impute.py         # POST /api/impute
│   │   └── export.py         # GET  /api/preview | /before-after | /download
│   └── services/
│       ├── validator.py      # Validación de archivos CSV
│       ├── analyzer.py       # Estadísticas, tipos, histogramas, heatmap
│       └── imputer.py        # Las 9 técnicas de imputación
│
└── frontend/
    ├── index.html
    ├── css/
    │   ├── styles.css        # Layout, topbar, statusbar, tipografía
    │   ├── components.css    # Cards, tablas, botones, badges
    │   └── charts.css        # Gráficos y heatmap
    └── js/
        ├── formulas.js       # TECHNIQUES[] — metadatos de cada técnica (KaTeX, variables, etc.)
        ├── app.js            # AppState, router SPA, stepper
        ├── upload.js         # Paso 1 — carga de archivo
        ├── charts.js         # Histograma SVG, boxplot SVG, heatmap CSS
        ├── dashboard.js      # Paso 2 — análisis exploratorio
        ├── imputation.js     # Paso 3 — selección de técnica y aplicación
        └── comparison.js     # Paso 4 — comparación y descarga
```

---

## Flujo de uso

```
1. Cargar      →  Sube un CSV (o usa el dataset Titanic de ejemplo)
2. Analizar    →  Explora estadísticas, distribuciones y mapa de nulos
3. Imputar     →  Elige columna + técnica → aplica al servidor
4. Exportar    →  Compara antes/después → descarga el CSV limpio
```

---

## Capturas

> El tema oscuro académico usa IBM Plex Serif para títulos, IBM Plex Mono para datos
> y un esquema de color basado en `#0ea5e9` (cyan) sobre fondo `#0a0a0f`.

---

## Licencia

Proyecto académico — Análisis de Datos · 2025
