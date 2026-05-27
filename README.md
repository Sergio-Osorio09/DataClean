# DataClean Pro

**Herramienta web para análisis y limpieza de datos CSV con 8 técnicas de imputación.**

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
- 🧮 **8 técnicas de imputación** con fórmulas matemáticas renderizadas en KaTeX
- 🌳 **Diagramas SVG** de árbol de decisión y red neuronal integrados en la tarjeta de fórmula
- 🎨 **Comparación antes/después** con celdas resaltadas para identificar cambios
- 💾 **Descarga del CSV limpio** con nombre descriptivo que incluye columna, técnica y fecha
- 🌙 **Tema oscuro académico** con tipografía IBM Plex (Serif · Sans · Mono)

---

## Técnicas de imputación implementadas

| # | Técnica | Fórmula | Tipo de dato |
|---|---------|---------|-------------|
| 01 | **Media** | <img width="286" height="164" alt="Captura de pantalla 2026-05-27 114642" src="https://github.com/user-attachments/assets/c7726172-bd23-4a25-a66f-4f9e340666c2" /> | Numérico |
| 02 | **Mediana** | Med = X[(n+1)/2] | Numérico |
| 03 | **Moda** | Mo = argmaxₓ freq(x) | Numérico / Categórico |
| 04 | **Interpolación lineal** | x̂ᵢ = x_{i₁} + (i−i₁)/(i₂−i₁)·(x_{i₂}−x_{i₁}) | Numérico |
| 05 | **KNN Imputación** | x̂ = Σwₖxₖ / Σwₖ ; wₖ=1/d(i,k) | Numérico |
| 06 | **Regresión lineal** | ŷ = β₀ + β₁x | Numérico |
| 07 | **Árbol de Decisión** | ΔI(t) = I(t) − (nₗ/n)·I(tₗ) − (nᵣ/n)·I(tᵣ) | Numérico |
| 08 | **Red Neuronal (MLP)** | a⁽ˡ⁾ = σ(W⁽ˡ⁾·a⁽ˡ⁻¹⁾ + b⁽ˡ⁾), σ=ReLU | Numérico |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Python 3.10+, FastAPI 0.104, uvicorn |
| Procesamiento | pandas 2.0, NumPy 1.24, scikit-learn 1.3 (DecisionTreeRegressor, MLPRegressor, KNNImputer, IterativeImputer) |
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

### Ejemplos de uso

**KNN Imputación:**
```bash
curl -X POST http://127.0.0.1:8000/api/impute \
  -H "Content-Type: application/json" \
  -d '{"column": "Age", "method": "knn", "params": {"k": 5}}'
```

**Árbol de Decisión:**
```bash
curl -X POST http://127.0.0.1:8000/api/impute \
  -H "Content-Type: application/json" \
  -d '{"column": "Fare", "method": "decision_tree"}'
```

**Red Neuronal MLP:**
```bash
curl -X POST http://127.0.0.1:8000/api/impute \
  -H "Content-Type: application/json" \
  -d '{"column": "Age", "method": "neural_network"}'
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
│       └── imputer.py        # Las 8 técnicas de imputación
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
1. Cargar      →  Sube un CSV (o usa uno de los 4 datasets de ejemplo: Titanic, Housing, Pacientes, RRHH)
2. Analizar    →  Explora estadísticas, distribuciones y mapa de nulos
3. Imputar     →  Elige columna + técnica (incluyendo Árbol de Decisión y Red Neuronal) → aplica al servidor
4. Exportar    →  Compara antes/después → descarga el CSV limpio
```

---

## Capturas

> El tema oscuro académico usa IBM Plex Serif para títulos, IBM Plex Mono para datos
> y un esquema de color basado en `#0ea5e9` (cyan) sobre fondo `#0a0a0f`.

<img width="1290" height="862" alt="Captura de pantalla 2026-05-27 112358" src="https://github.com/user-attachments/assets/05855a1d-3c7b-4552-84a8-8b72aa72cded" />

<img width="1291" height="860" alt="Captura de pantalla 2026-05-27 112437" src="https://github.com/user-attachments/assets/de0dd7b4-deb0-4091-af19-072ab0e254c5" />

<img width="1291" height="863" alt="Captura de pantalla 2026-05-27 112520" src="https://github.com/user-attachments/assets/a9db8354-091f-4100-9f5c-1ac5b6323f5c" />

<img width="1287" height="860" alt="Captura de pantalla 2026-05-27 112730" src="https://github.com/user-attachments/assets/2a45cd81-191f-4dd5-8d2d-e0cdbb1cd145" />

<img width="1286" height="859" alt="Captura de pantalla 2026-05-27 112822" src="https://github.com/user-attachments/assets/5b89994d-a80d-4c18-825a-3981978c124a" />

<img width="1287" height="861" alt="Captura de pantalla 2026-05-27 112846" src="https://github.com/user-attachments/assets/976762e8-f3ed-4519-9711-59bbcf0efd9f" />

---

## Licencia

Proyecto académico — Análisis de Datos · 2025
