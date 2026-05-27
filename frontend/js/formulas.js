/**
 * formulas.js — Catálogo de las 9 técnicas de imputación.
 * Cada técnica contiene: nombre, fórmula KaTeX, fórmula unicode,
 * descripción, variables, cuándo usar, riesgo, complejidad y tipos aplicables.
 */

const TECHNIQUES = [
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
  },
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
  },
  {
    id: "mode",
    name: "Moda (Mode)",
    short: "Moda",
    applies: ["int", "float", "categorical", "string"],
    library: "SimpleImputer(strategy='most_frequent')",
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
  },
  {
    id: "ffill",
    name: "Forward Fill",
    short: "Forward Fill",
    applies: ["int", "float", "categorical", "string"],
    library: "pandas.DataFrame.ffill()",
    katex: "\\hat{x}_i = x_j,\\quad j = \\max\\{k < i : x_k \\neq \\varnothing\\}",
    unicode: "x̂ᵢ = xⱼ, j = max{k<i: xₖ ≠ ∅}",
    description:
      "Propaga hacia adelante el último valor observado. La fila i hereda el valor de la fila anterior no nula.",
    when_to_use:
      "Series temporales o datos con orden natural (sensores, logs, precios).",
    variables: [
      ["x̂ᵢ", "valor imputado en la posición i"],
      ["j", "índice del último valor no nulo antes de i"],
    ],
    risk: "Suaviza tendencias; no funciona si el primer valor es nulo.",
    complexity: "O(n)",
  },
  {
    id: "bfill",
    name: "Backward Fill",
    short: "Backward Fill",
    applies: ["int", "float", "categorical", "string"],
    library: "pandas.DataFrame.bfill()",
    katex: "\\hat{x}_i = x_j,\\quad j = \\min\\{k > i : x_k \\neq \\varnothing\\}",
    unicode: "x̂ᵢ = xⱼ, j = min{k>i: xₖ ≠ ∅}",
    description:
      "Propaga hacia atrás el siguiente valor observado. Útil cuando los valores recientes representan mejor el estado.",
    when_to_use:
      "Series temporales en las que el siguiente valor es referencia más fiable que el anterior.",
    variables: [
      ["x̂ᵢ", "valor imputado en la posición i"],
      ["j", "índice del siguiente valor no nulo después de i"],
    ],
    risk: "Mismo riesgo que ffill en sentido opuesto.",
    complexity: "O(n)",
  },
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
  },
  {
    id: "knn",
    name: "KNN (K vecinos)",
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
  },
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
  },
  {
    id: "knn_class",
    name: "Clasificación KNN",
    short: "KNN Cat.",
    applies: ["categorical", "string"],
    library: "KNNImputer + LabelEncoder",
    katex: "\\hat{y} = \\underset{c \\in \\mathcal{C}}{\\arg\\max} \\sum_{k=1}^{K} \\mathbb{1}(y_k = c)\\, w_k",
    unicode: "ŷ = argmax_c { Σ 𝟙(yₖ=c) · wₖ }",
    description:
      "Variante categórica de KNN: codifica con LabelEncoder, vota la clase más frecuente entre los K vecinos ponderada por distancia.",
    when_to_use:
      "Variables categóricas con relaciones a otras columnas numéricas o codificadas.",
    variables: [
      ["c", "clase candidata"],
      ["𝟙(·)", "función indicadora (1 si yₖ=c, 0 si no)"],
      ["wₖ", "peso del k-ésimo vecino (inverso de la distancia)"],
    ],
    params: [{ id: "k", name: "K vecinos", default: 3, min: 1, max: 15 }],
    risk: "Requiere codificar todas las variables; sensible a la escala.",
    complexity: "O(n² · m)",
  },
];

// Exponer globalmente
window.TECHNIQUES = TECHNIQUES;
