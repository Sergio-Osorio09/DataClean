/**
 * formulas.js — Catálogo de las 8 técnicas de imputación.
 * Cada técnica contiene: nombre, fórmula KaTeX, fórmula unicode,
 * descripción, variables, cuándo usar, riesgo, complejidad, tipos aplicables
 * y un diagrama SVG opcional para técnicas de Machine Learning.
 */

const TECHNIQUES = [
  // ── 01 · Media ─────────────────────────────────────────────────────────────
  {
    id: "mean",
    name: "Media (Mean)",
    short: "Media",
    applies: ["int", "float"],
    library: "SimpleImputer(strategy='mean')",
    katex: "\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i",
    unicode: "x̄ = (1/n) · Σᵢ xᵢ",
    description:
      "Sustituye cada valor faltante por la media aritmética de los valores observados de la misma columna.",
    when_to_use:
      "Variables numéricas continuas con distribución aproximadamente simétrica y sin outliers severos.",
    variables: [
      ["x̄", "media muestral de la columna"],
      ["n", "número de observaciones no nulas"],
      ["xᵢ", "i-ésimo valor observado"],
    ],
    risk: "Sesga la varianza hacia 0 y atenúa correlaciones con otras variables.",
    complexity: "O(n)",
    diagram: null,
  },

  // ── 02 · Mediana ────────────────────────────────────────────────────────────
  {
    id: "median",
    name: "Mediana (Median)",
    short: "Mediana",
    applies: ["int", "float"],
    library: "SimpleImputer(strategy='median')",
    katex: "\\text{Med} = \\begin{cases} X_{(n+1)/2}, & n \\text{ impar} \\\\[4pt] \\dfrac{X_{n/2} + X_{n/2+1}}{2}, & n \\text{ par} \\end{cases}",
    unicode: "Med = X[(n+1)/2] si n impar, (X[n/2]+X[n/2+1])/2 si par",
    description:
      "Sustituye los valores faltantes por la mediana de la columna, ordenando los valores observados.",
    when_to_use:
      "Distribuciones asimétricas o con outliers. Más robusta que la media.",
    variables: [
      ["X_(k)", "k-ésimo valor ordenado (estadístico de orden)"],
      ["n", "número de observaciones no nulas"],
    ],
    risk: "También reduce la varianza; no preserva relaciones con otras variables.",
    complexity: "O(n log n)",
    diagram: null,
  },

  // ── 03 · Moda ───────────────────────────────────────────────────────────────
  {
    id: "mode",
    name: "Moda (Mode)",
    short: "Moda",
    applies: ["int", "float", "categorical", "string"],
    library: "pandas.Series.mode()",
    katex: "\\text{Mo} = \\underset{x \\in \\Omega}{\\arg\\max}\\; \\operatorname{freq}(x)",
    unicode: "Mo = argmaxₓ freq(x)",
    description:
      "Sustituye los faltantes por el valor más frecuente observado en la columna.",
    when_to_use:
      "Variables categóricas o discretas. Único método aplicable a strings.",
    variables: [
      ["Ω", "conjunto de valores únicos observados"],
      ["freq(x)", "frecuencia absoluta del valor x"],
    ],
    risk: "Concentra masa en una sola categoría; reduce diversidad.",
    complexity: "O(n)",
    diagram: null,
  },

  // ── 04 · Interpolación Lineal ───────────────────────────────────────────────
  {
    id: "linear",
    name: "Interpolación Lineal",
    short: "Interpolación",
    applies: ["int", "float"],
    library: "pandas.interpolate(method='linear')",
    katex: "\\hat{x}_i = x_{i_1} + \\frac{i - i_1}{i_2 - i_1}\\,(x_{i_2} - x_{i_1})",
    unicode: "x̂ᵢ = x_{i₁} + (i-i₁)/(i₂-i₁) · (x_{i₂}-x_{i₁})",
    description:
      "Estima los valores faltantes a lo largo de una recta entre los dos puntos observados que rodean al faltante.",
    when_to_use:
      "Variables continuas con dependencia secuencial; series ordenadas sin saltos bruscos.",
    variables: [
      ["i₁", "índice del último no nulo antes de i"],
      ["i₂", "índice del primer no nulo después de i"],
      ["x_{i₁}, x_{i₂}", "valores observados en esos índices"],
    ],
    risk: "Asume linealidad local; falla con cambios bruscos.",
    complexity: "O(n)",
    diagram: null,
  },

  // ── 05 · KNN Imputación ─────────────────────────────────────────────────────
  {
    id: "knn",
    name: "KNN Imputación",
    short: "KNN",
    applies: ["int", "float"],
    library: "KNNImputer(n_neighbors=k)",
    katex: "\\hat{x} = \\frac{\\displaystyle\\sum_{k=1}^{K} w_k\\, x_k}{\\displaystyle\\sum_{k=1}^{K} w_k},\\quad w_k = \\frac{1}{d(i,k)}",
    unicode: "x̂ = Σ wₖxₖ / Σ wₖ ; wₖ = 1/d(i,k)",
    description:
      "Busca las K filas más parecidas (vecinas) usando distancia euclídea y calcula un promedio ponderado por distancia inversa.",
    when_to_use:
      "Datasets con múltiples variables correlacionadas; sin distribución específica asumida.",
    variables: [
      ["K", "número de vecinos a considerar"],
      ["d(i,k)", "distancia euclídea entre fila i y fila k"],
      ["wₖ", "peso inverso a la distancia del k-ésimo vecino"],
    ],
    params: [{ id: "k", name: "K vecinos", default: 3, min: 1, max: 15 }],
    risk: "Costoso para datasets grandes (O(n²·m)); sensible a la escala.",
    complexity: "O(n² · m)",
    diagram: null,
  },

  // ── 06 · Regresión Lineal ───────────────────────────────────────────────────
  {
    id: "regression",
    name: "Regresión Lineal",
    short: "Regresión",
    applies: ["int", "float"],
    library: "IterativeImputer(estimator=LinearRegression)",
    katex: "\\hat{y} = \\beta_0 + \\beta_1 x,\\quad \\beta_1 = \\frac{\\displaystyle\\sum_{i}(x_i - \\bar{x})(y_i - \\bar{y})}{\\displaystyle\\sum_{i}(x_i - \\bar{x})^2}",
    unicode: "ŷ = β₀ + β₁x ; β₁ = Σ(xᵢ-x̄)(yᵢ-ȳ) / Σ(xᵢ-x̄)²",
    description:
      "Modela la variable objetivo como función lineal de las demás y predice los valores faltantes (MICE iterativo).",
    when_to_use:
      "Cuando existe relación lineal entre la variable a imputar y otras columnas completas.",
    variables: [
      ["ŷ", "valor predicho (imputado)"],
      ["β₀, β₁", "intercepto y pendiente de la recta de regresión"],
      ["xᵢ, yᵢ", "pares de valores observados"],
    ],
    risk: "Asume linealidad; subestima la varianza residual.",
    complexity: "O(n · m)",
    diagram: null,
  },

  // ── 07 · Árbol de Decisión ──────────────────────────────────────────────────
  {
    id: "decision_tree",
    name: "Árbol de Decisión",
    short: "Árbol",
    applies: ["int", "float"],
    library: "IterativeImputer(estimator=DecisionTreeRegressor)",
    katex: "\\Delta I(t) = I(t) - \\frac{n_L}{n}\\,I(t_L) - \\frac{n_R}{n}\\,I(t_R)",
    unicode: "ΔI(t) = I(t) − (nₗ/n)·I(tₗ) − (nᵣ/n)·I(tᵣ)",
    description:
      "Usa un árbol de regresión como estimador dentro del esquema MICE iterativo: aprende particiones del espacio de features para predecir cada valor faltante.",
    when_to_use:
      "Relaciones no lineales entre variables; datos mixtos; outliers o distribuciones asimétricas.",
    variables: [
      ["I(t)", "impureza del nodo t — MSE en regresión"],
      ["nₗ, nᵣ", "muestras en rama izquierda y derecha"],
      ["n", "total de muestras en el nodo t"],
    ],
    risk: "Propenso a sobreajuste con max_depth elevado; más lento que métodos estadísticos.",
    complexity: "O(n · m · log n)",
    diagram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 185" style="width:100%;max-width:300px;display:block;margin:0 auto"><line x1="150" y1="36" x2="82" y2="82" stroke="#334155" stroke-width="1.2"/><line x1="150" y1="36" x2="218" y2="82" stroke="#334155" stroke-width="1.2"/><line x1="82" y1="104" x2="46" y2="148" stroke="#334155" stroke-width="1.2"/><line x1="82" y1="104" x2="118" y2="148" stroke="#334155" stroke-width="1.2"/><line x1="218" y1="104" x2="182" y2="148" stroke="#334155" stroke-width="1.2"/><line x1="218" y1="104" x2="254" y2="148" stroke="#334155" stroke-width="1.2"/><rect x="112" y="10" width="76" height="26" rx="5" fill="#0f172a" stroke="#0ea5e9" stroke-width="1.5"/><text x="150" y="27" text-anchor="middle" font-family="monospace" font-size="9" fill="#0ea5e9">x &#x2264; &#x03B8; ?</text><rect x="52" y="82" width="60" height="22" rx="5" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2"/><text x="82" y="97" text-anchor="middle" font-family="monospace" font-size="8" fill="#7dd3fc">x&#x2081; &#x2264; &#x03B8;&#x2081;</text><rect x="188" y="82" width="60" height="22" rx="5" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2"/><text x="218" y="97" text-anchor="middle" font-family="monospace" font-size="8" fill="#7dd3fc">x&#x2082; &#x2264; &#x03B8;&#x2082;</text><text x="107" y="62" font-family="monospace" font-size="7.5" fill="#64748b">s&#xED;</text><text x="191" y="62" font-family="monospace" font-size="7.5" fill="#64748b">no</text><text x="55" y="130" font-family="monospace" font-size="7.5" fill="#64748b">s&#xED;</text><text x="103" y="130" font-family="monospace" font-size="7.5" fill="#64748b">no</text><text x="153" y="130" font-family="monospace" font-size="7.5" fill="#64748b">s&#xED;</text><text x="243" y="130" font-family="monospace" font-size="7.5" fill="#64748b">no</text><rect x="22" y="148" width="48" height="24" rx="4" fill="#052e16" stroke="#10b981" stroke-width="1.2"/><text x="46" y="164" text-anchor="middle" font-family="monospace" font-size="9" fill="#6ee7b7">&#x0177;&#x2081;</text><rect x="94" y="148" width="48" height="24" rx="4" fill="#052e16" stroke="#10b981" stroke-width="1.2"/><text x="118" y="164" text-anchor="middle" font-family="monospace" font-size="9" fill="#6ee7b7">&#x0177;&#x2082;</text><rect x="158" y="148" width="48" height="24" rx="4" fill="#052e16" stroke="#10b981" stroke-width="1.2"/><text x="182" y="164" text-anchor="middle" font-family="monospace" font-size="9" fill="#6ee7b7">&#x0177;&#x2083;</text><rect x="230" y="148" width="48" height="24" rx="4" fill="#052e16" stroke="#10b981" stroke-width="1.2"/><text x="254" y="164" text-anchor="middle" font-family="monospace" font-size="9" fill="#6ee7b7">&#x0177;&#x2084;</text></svg>`,
  },

  // ── 08 · Red Neuronal MLP ───────────────────────────────────────────────────
  {
    id: "neural_network",
    name: "Red Neuronal (MLP)",
    short: "Red Neuronal",
    applies: ["int", "float"],
    library: "IterativeImputer(estimator=MLPRegressor)",
    katex: "a^{(l)} = \\sigma\\!\\left(W^{(l)}\\,a^{(l-1)} + b^{(l)}\\right),\\quad \\sigma(z) = \\max(0,\\,z)",
    unicode: "a^(l) = σ(W^(l)·a^(l-1) + b^(l)),  σ(z) = max(0, z)",
    description:
      "Perceptrón multicapa (MLP) como estimador MICE: aprende representaciones no lineales profundas de las relaciones entre columnas para imputar cada valor faltante.",
    when_to_use:
      "Datasets con relaciones complejas y no lineales; cuando regresión o árbol no capturan el patrón subyacente.",
    variables: [
      ["a^(l)", "vector de activaciones de la capa l"],
      ["W^(l), b^(l)", "pesos y sesgos de la capa l"],
      ["σ", "función de activación ReLU: max(0, z)"],
    ],
    risk: "El más costoso computacionalmente; puede sobreajustar en datasets pequeños.",
    complexity: "O(n · m · epochs)",
    diagram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 185" style="width:100%;max-width:300px;display:block;margin:0 auto"><line x1="56" y1="48" x2="136" y2="35" stroke="#1e3a5f" stroke-width="0.9"/><line x1="56" y1="48" x2="136" y2="90" stroke="#1e3a5f" stroke-width="0.9"/><line x1="56" y1="48" x2="136" y2="145" stroke="#1e3a5f" stroke-width="0.9"/><line x1="56" y1="90" x2="136" y2="35" stroke="#1e3a5f" stroke-width="0.9"/><line x1="56" y1="90" x2="136" y2="90" stroke="#1e3a5f" stroke-width="0.9"/><line x1="56" y1="90" x2="136" y2="145" stroke="#1e3a5f" stroke-width="0.9"/><line x1="56" y1="132" x2="136" y2="35" stroke="#1e3a5f" stroke-width="0.9"/><line x1="56" y1="132" x2="136" y2="90" stroke="#1e3a5f" stroke-width="0.9"/><line x1="56" y1="132" x2="136" y2="145" stroke="#1e3a5f" stroke-width="0.9"/><line x1="164" y1="35" x2="242" y2="90" stroke="#1e3a5f" stroke-width="0.9"/><line x1="164" y1="90" x2="242" y2="90" stroke="#1e3a5f" stroke-width="0.9"/><line x1="164" y1="145" x2="242" y2="90" stroke="#1e3a5f" stroke-width="0.9"/><circle cx="40" cy="48" r="16" fill="#0a0a0f" stroke="#0ea5e9" stroke-width="1.5"/><text x="40" y="52" text-anchor="middle" font-family="monospace" font-size="9" fill="#7dd3fc">x&#x2081;</text><circle cx="40" cy="90" r="16" fill="#0a0a0f" stroke="#0ea5e9" stroke-width="1.5"/><text x="40" y="94" text-anchor="middle" font-family="monospace" font-size="9" fill="#7dd3fc">x&#x2082;</text><circle cx="40" cy="132" r="16" fill="#0a0a0f" stroke="#0ea5e9" stroke-width="1.5"/><text x="40" y="136" text-anchor="middle" font-family="monospace" font-size="9" fill="#7dd3fc">x&#x2083;</text><circle cx="150" cy="35" r="14" fill="#0a0a0f" stroke="#8b5cf6" stroke-width="1.5"/><text x="150" y="39" text-anchor="middle" font-family="monospace" font-size="8" fill="#c4b5fd">h&#x2081;</text><circle cx="150" cy="90" r="14" fill="#0a0a0f" stroke="#8b5cf6" stroke-width="1.5"/><text x="150" y="94" text-anchor="middle" font-family="monospace" font-size="8" fill="#c4b5fd">h&#x2082;</text><circle cx="150" cy="145" r="14" fill="#0a0a0f" stroke="#8b5cf6" stroke-width="1.5"/><text x="150" y="149" text-anchor="middle" font-family="monospace" font-size="8" fill="#c4b5fd">h&#x2083;</text><circle cx="260" cy="90" r="18" fill="#0a0a0f" stroke="#10b981" stroke-width="1.8"/><text x="260" y="95" text-anchor="middle" font-family="monospace" font-size="11" fill="#6ee7b7">&#x0177;</text><text x="40" y="172" text-anchor="middle" font-family="monospace" font-size="7.5" fill="#475569">entrada</text><text x="150" y="172" text-anchor="middle" font-family="monospace" font-size="7.5" fill="#475569">oculta</text><text x="260" y="120" text-anchor="middle" font-family="monospace" font-size="7.5" fill="#475569">salida</text><rect x="128" y="6" width="44" height="13" rx="3" fill="#1e1540" stroke="#8b5cf6" stroke-width="0.8"/><text x="150" y="16" text-anchor="middle" font-family="monospace" font-size="7" fill="#a78bfa">ReLU</text></svg>`,
  },
];

// Exponer globalmente
window.TECHNIQUES = TECHNIQUES;
