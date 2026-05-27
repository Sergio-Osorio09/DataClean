/**
 * imputation.js — Paso 3: Selección de técnica, fórmula KaTeX y preview antes/después.
 * RF-05: Filtrado por tipo  |  RF-06: Modelo matemático  |  RF-07: 9 técnicas
 */

async function renderImputation(container) {
  // Siempre re-fetcha el análisis para tener los nulos actualizados (p.ej. tras imputar y volver)
  if (!AppState.analysis) {
    container.innerHTML = `<div class="spinner">Cargando análisis actualizado…</div>`;
    try {
      AppState.analysis = await api("GET", "/api/analyze");
    } catch (err) {
      container.innerHTML = `<div class="error-state">Error al cargar el análisis:<br>${err.message}</div>`;
      return;
    }
  }

  const a = AppState.analysis;
  const techniques = window.TECHNIQUES;

  const colMeta = a.columns.map((col, idx) => ({
    ...col, idx,
    nulls: col.nulls,
  }));

  const activeCol = AppState.activeColIdx !== null ? a.columns[AppState.activeColIdx] : null;

  // Si la técnica actual no aplica a la columna seleccionada, auto-cambiar
  const curTech = techniques.find(t => t.id === AppState.technique);
  if (curTech && activeCol && !curTech.applies.includes(activeCol.type)) {
    const first = techniques.find(t => t.applies.includes(activeCol.type));
    if (first) AppState.technique = first.id;
  }

  container.innerHTML = `
    <div class="step-container fade-in">
      <div class="step-head">
        <div>
          <div class="step-eyebrow">03 / 04 · Imputación</div>
          <h1 class="h-display">Selección de técnica</h1>
          <p class="lede" style="margin-top:8px">
            Elige una columna y la técnica matemática que deseas aplicar.
            El sistema filtra automáticamente los métodos compatibles con el tipo de dato.
          </p>
        </div>
        <div style="display:flex;gap:8px">
          <span class="tag tag-num">RF-06 · Modelo matemático</span>
          <span class="tag tag-num">RF-07 · 8 técnicas</span>
        </div>
      </div>

      <div class="impute-grid">
        <!-- LEFT: pickers -->
        <div style="display:flex;flex-direction:column;gap:16px">
          <!-- Column picker -->
          <div class="card card-flush">
            <div style="padding:12px 16px 8px;border-bottom:1px solid var(--border)">
              <h3 class="h-card" style="color:var(--text-primary)">Columna</h3>
              <div class="annot" style="margin-top:2px">solo las que tienen nulos</div>
            </div>
            <div class="column-select-list" id="col-list"></div>
          </div>

          <!-- Technique picker -->
          <div class="card card-flush">
            <div style="padding:12px 16px 8px;border-bottom:1px solid var(--border)">
              <h3 class="h-card" style="color:var(--text-primary)">Técnica</h3>
              <div class="annot" style="margin-top:2px" id="tech-sub">
                ${activeCol ? `compatibles con ${activeCol.type}` : `${window.TECHNIQUES.length} técnicas disponibles`}
              </div>
            </div>
            <div class="tech-list" id="tech-list"></div>
          </div>
        </div>

        <!-- CENTER: formula card -->
        <div id="formula-container"></div>

        <!-- RIGHT: preview -->
        <div id="preview-container"></div>
      </div>

      <div class="step-footer">
        <div class="annotation">
          POST <span class="mono">/api/impute</span> ·
          <span class="mono">{ column, method, params }</span>
        </div>
        <div class="annotation" id="tech-lib"></div>
      </div>
    </div>
  `;

  _refreshImputation();
}

function _refreshImputation() {
  const a = AppState.analysis;
  const techniques = window.TECHNIQUES;
  const activeCol = AppState.activeColIdx !== null ? a.columns[AppState.activeColIdx] : null;
  const tech = techniques.find(t => t.id === AppState.technique);

  // Column list
  const colList = document.getElementById("col-list");
  if (colList) {
    colList.innerHTML = a.columns.map((col, idx) => {
      const disabled = col.nulls === 0;
      const isActive = AppState.activeColIdx === idx;
      const typeTag = (col.type === "categorical" || col.type === "string")
        ? `<span class="tag tag-cat" style="font-size:9px">${col.type}</span>`
        : `<span class="tag tag-num" style="font-size:9px">${col.type}</span>`;
      return `
        <div class="column-select-item ${isActive ? "active" : ""} ${disabled ? "no-nulls" : ""}"
             data-idx="${idx}" ${disabled ? "" : 'style="cursor:pointer"'}>
          <span>${col.name}</span>
          ${typeTag}
          <span class="nulls-mini">${col.nulls > 0 ? col.nulls + " ∅" : "—"}</span>
        </div>
      `;
    }).join("");

    colList.querySelectorAll(".column-select-item:not(.no-nulls)").forEach(el => {
      el.addEventListener("click", () => {
        AppState.activeColIdx = parseInt(el.dataset.idx);
        // Auto-switch technique if incompatible
        const newCol = a.columns[AppState.activeColIdx];
        const curTech = techniques.find(t => t.id === AppState.technique);
        if (curTech && !curTech.applies.includes(newCol.type)) {
          const first = techniques.find(t => t.applies.includes(newCol.type));
          if (first) AppState.technique = first.id;
        }
        _refreshImputation();
      });
    });
  }

  // Technique list
  const techList = document.getElementById("tech-list");
  if (techList) {
    techList.innerHTML = techniques.map((t, i) => {
      const applicable = !activeCol || t.applies.includes(activeCol.type);
      const isActive = AppState.technique === t.id;
      const tagText = t.applies.includes("int") || t.applies.includes("float")
        ? (t.applies.includes("categorical") ? "any" : "num")
        : "cat";
      return `
        <div class="tech-item ${isActive ? "active" : ""} ${!applicable ? "disabled" : ""}"
             data-id="${t.id}" ${applicable ? 'style="cursor:pointer"' : ""}>
          <span class="tech-idx">${String(i + 1).padStart(2, "0")}</span>
          <span class="tech-name">${t.short}</span>
          <span class="tech-tag">${tagText}</span>
        </div>
      `;
    }).join("");

    techList.querySelectorAll(".tech-item:not(.disabled)").forEach(el => {
      el.addEventListener("click", () => {
        AppState.technique = el.dataset.id;
        _refreshImputation();
      });
    });
  }

  // Tech subtitle
  const techSub = document.getElementById("tech-sub");
  if (techSub) techSub.textContent = activeCol ? `compatibles con ${activeCol.type}` : `${techniques.length} técnicas disponibles`;

  // Library annotation
  const techLib = document.getElementById("tech-lib");
  if (techLib && tech) techLib.innerHTML = `Implementación: <span class="mono">${tech.library}</span>`;

  // Formula card
  const formulaContainer = document.getElementById("formula-container");
  if (formulaContainer) _renderFormulaCard(formulaContainer, tech, activeCol);

  // Preview
  const previewContainer = document.getElementById("preview-container");
  if (previewContainer) _renderPreviewCard(previewContainer, activeCol);
}

// ── Ejemplo calculado con los datos reales del dataset ───────────────
function _buildExample(tech, col, params) {
  if (!tech || !col) return null;

  const n = col.total - col.nulls;
  const k = (params && params.k) ? parseInt(params.k) : 3;
  const f = v => (v == null ? '?' : v);

  switch (tech.id) {

    case 'mean': {
      const sum = (col.mean * n).toFixed(2);
      return {
        info: `${n} observados · ${col.nulls} nulos`,
        data: `mín ${f(col.min)}  ·  Q1 ${f(col.q25)}  ·  mediana ${f(col.median)}  ·  Q3 ${f(col.q75)}  ·  máx ${f(col.max)}`,
        steps: [
          `n = ${col.total} − ${col.nulls} = ${n} valores válidos`,
          `Σxᵢ ≈ x̄ × n  =  ${f(col.mean)} × ${n}  =  ${sum}`,
          `x̄  =  ${sum} / ${n}  =  ${f(col.mean)}`,
        ],
        result: f(col.mean),
        label: `${col.nulls} nulo(s) → reemplazados por`,
      };
    }

    case 'median': {
      const pos = n % 2 !== 0
        ? `posición ${Math.ceil(n / 2)} de ${n}`
        : `media entre pos. ${n/2} y ${n/2+1} de ${n}`;
      return {
        info: `${n} observados · ${col.nulls} nulos`,
        data: `mín ${f(col.min)}  ·  Q1 ${f(col.q25)}  ·  Q3 ${f(col.q75)}  ·  máx ${f(col.max)}`,
        steps: [
          `n = ${col.total} − ${col.nulls} = ${n} valores`,
          `Ordenar de menor a mayor → ${pos}`,
          `Med = ${f(col.median)}`,
        ],
        result: f(col.median),
        label: `${col.nulls} nulo(s) → reemplazados por`,
      };
    }

    case 'mode': {
      // Numérico → derivar moda del bin más frecuente del histograma
      if (col.histogram && col.histogram.length > 0) {
        const top = col.histogram.reduce((a, b) => b.count > a.count ? b : a);
        return {
          info: `${n} observados · ${col.nulls} nulos`,
          data: col.histogram.slice(0, 5).map(b => `[${b.label}]: ${b.count}`).join('  ') + (col.histogram.length > 5 ? '  …' : ''),
          steps: [
            `Recorrer histograma: buscar bin de máxima frecuencia`,
            `Bin más frecuente: ≈ ${f(top.label)}  →  ${top.count} observaciones`,
            `Mo ≈ ${f(top.label)}`,
          ],
          result: f(top.label),
          label: `${col.nulls} nulo(s) → reemplazados por`,
          note: 'Para datos numéricos la moda exacta es el valor individual más repetido.',
        };
      }
      // Categórico / string
      const cats = col.categories || [];
      const pct = n > 0 && cats[0] ? (cats[0].count / n * 100).toFixed(1) : '?';
      return {
        info: `${n} observados · ${col.nulls} nulos`,
        data: cats.slice(0, 4).map(c => `"${c.value}": ${c.count}`).join('  ·  ') + (cats.length > 4 ? '  …' : ''),
        steps: [
          `Contar frecuencias absolutas de cada categoría`,
          `Valor más frecuente: "${col.mode}"  →  ${cats[0]?.count ?? '?'} / ${n} = ${pct}%`,
        ],
        result: `"${col.mode}"`,
        label: `${col.nulls} nulo(s) → reemplazados por`,
      };
    }

    case 'linear': {
      const x1 = col.q25 ?? col.min ?? 0;
      const x2 = col.q75 ?? col.max ?? 1;
      const half = ((x2 - x1) * 0.5).toFixed(4);
      const est  = (parseFloat(x1) + parseFloat(half)).toFixed(4);
      return {
        info: `nulo hipotético equidistante entre Q1 y Q3 (t = 0.5)`,
        data: `Q1 = ${f(x1)}  ·  Q3 = ${f(x2)}  ·  diferencia = ${(x2 - x1).toFixed(4)}`,
        steps: [
          `Puntos adyacentes: x_{i₁} = ${f(x1)},  x_{i₂} = ${f(x2)}`,
          `Proporción: t = (i − i₁) / (i₂ − i₁) = 0.5`,
          `x̂ = ${f(x1)} + 0.5 × (${f(x2)} − ${f(x1)}) = ${f(x1)} + ${half}`,
          `x̂ = ${est}`,
        ],
        result: est,
        label: `Valor interpolado (ejemplo con t = 0.5)`,
        note: 'El t real de cada nulo depende de su posición entre los vecinos observados.',
      };
    }

    case 'knn': {
      const v1 = col.q25 ?? 0;
      const v2 = parseFloat((col.mean ?? 0).toFixed(2));
      const v3 = col.q75 ?? 0;
      const d1 = 1.5, d2 = 2.3, d3 = 3.8;
      const w1 = 1/d1, w2 = 1/d2, w3 = 1/d3;
      const wSum = w1 + w2 + w3;
      const est = ((v1*w1 + v2*w2 + v3*w3) / wSum).toFixed(4);
      return {
        info: `k = ${k}  ·  distancia euclídea  ·  pesos 1/d`,
        data: `vecinos ilustrativos: Q1 = ${f(v1)},  media = ${v2},  Q3 = ${f(v3)}`,
        steps: [
          `k = ${k} vecinos más cercanos (ejemplo): ${f(v1)} (d=1.5)  ·  ${v2} (d=2.3)  ·  ${f(v3)} (d=3.8)`,
          `wᵢ = 1/dᵢ  →  w₁ = ${w1.toFixed(3)},  w₂ = ${w2.toFixed(3)},  w₃ = ${w3.toFixed(3)}`,
          `x̂ = (${f(v1)}·${w1.toFixed(3)} + ${v2}·${w2.toFixed(3)} + ${f(v3)}·${w3.toFixed(3)}) / ${wSum.toFixed(3)}`,
          `x̂ = ${est}`,
        ],
        result: est,
        label: `Estimación ponderada (ejemplo ilustrativo)`,
        note: 'Los vecinos y distancias reales se calculan sobre todos los registros del dataset.',
      };
    }

    case 'regression': {
      const lo = (col.mean - col.std).toFixed(2);
      const hi = (col.mean + col.std).toFixed(2);
      return {
        info: `MICE · LinearRegression · max_iter = 10`,
        data: `media = ${f(col.mean)}  ·  σ = ${f(col.std)}  ·  rango = [${f(col.min)}, ${f(col.max)}]`,
        steps: [
          `Modelo: ŷ = β₀ + β₁x₁ + β₂x₂ + … (predictores: otras columnas numéricas)`,
          `Valor central esperado: μ = ${f(col.mean)}`,
          `Intervalo μ ± σ: [ ${lo},  ${hi} ]`,
        ],
        result: `≈ ${f(col.mean)}`,
        label: `Predicción esperada (varía por fila)`,
        note: 'Cada registro obtiene una predicción distinta según sus columnas predictoras.',
      };
    }

    case 'decision_tree': {
      return {
        info: `IterativeImputer · DecisionTreeRegressor · max_depth=5`,
        data: `rango=[${f(col.min)}, ${f(col.max)}]  ·  media=${f(col.mean)}  ·  σ=${f(col.std)}`,
        steps: [
          `El árbol aprende: si xⱼ ≤ θ → rama izquierda, si xⱼ > θ → rama derecha`,
          `Criterio de partición: MSE = (1/n)·Σ(yᵢ − ȳ)²  minimizado en cada nodo`,
          `Hoja con rango [${f(col.q25)}, ${f(col.q75)}] → ŷ ≈ ${f(col.mean)}`,
        ],
        result: `≈ ${f(col.mean)}`,
        label: `Predicción de la hoja correspondiente (ejemplo)`,
        note: 'Cada nulo recibe el valor promedio de la hoja donde cae según sus features.',
      };
    }

    case 'neural_network': {
      const lo = col.mean != null && col.std != null ? (col.mean - col.std).toFixed(2) : '?';
      const hi = col.mean != null && col.std != null ? (col.mean + col.std).toFixed(2) : '?';
      return {
        info: `MLPRegressor · capas ocultas=(64, 32) · ReLU · max_iter=200`,
        data: `media=${f(col.mean)}  ·  σ=${f(col.std)}  ·  rango=[${f(col.min)}, ${f(col.max)}]`,
        steps: [
          `Entrada: x = [otras columnas numéricas del registro con nulo]`,
          `Capa oculta: a⁽ˡ⁾ = ReLU(W⁽ˡ⁾·a⁽ˡ⁻¹⁾ + b⁽ˡ⁾)  →  64 → 32 neuronas`,
          `Salida lineal: ŷ ≈ ${f(col.mean)}  ·  intervalo μ±σ: [${lo}, ${hi}]`,
        ],
        result: `≈ ${f(col.mean)}`,
        label: `Predicción esperada (varía por fila)`,
        note: 'Cada registro obtiene una predicción distinta según el patrón aprendido.',
      };
    }

    default: return null;
  }
}

function _exampleHTML(example, col) {
  if (!example || !col) {
    return `
      <div class="example-block">
        <div class="example-header">
          <span class="example-eyebrow">EJEMPLO CON TUS DATOS</span>
        </div>
        <div class="example-placeholder">Selecciona una columna para ver el cálculo con datos reales.</div>
      </div>`;
  }
  const stepsHTML = example.steps.map((s, i) => `
    <div class="example-step">
      <span class="example-step-num">${i + 1}</span>
      <span>${s}</span>
    </div>`).join('');

  return `
    <div class="example-block">
      <div class="example-header">
        <span class="example-eyebrow">EJEMPLO · ${col.name}</span>
        <span class="example-info">${example.info}</span>
      </div>
      ${example.data ? `<div class="example-data">${example.data}</div>` : ''}
      <div class="example-steps">${stepsHTML}</div>
      <div class="example-result-row">
        <span class="example-result-label">${example.label}</span>
        <span class="example-result-val">${example.result}</span>
      </div>
      ${example.note ? `<p class="example-note">${example.note}</p>` : ''}
    </div>`;
}

function _renderFormulaCard(container, tech, activeCol) {
  if (!tech) {
    container.innerHTML = `<div class="formula-card"><div class="empty-hint">Selecciona una técnica para ver su modelo matemático.</div></div>`;
    return;
  }

  const techIdx = window.TECHNIQUES.indexOf(tech);
  const hasParams = tech.params && tech.params.length > 0;

  const paramsHTML = hasParams ? `
    <div class="params-row">
      <span class="h-card" style="font-size:10px">Parámetros</span>
      ${tech.params.map(p => `
        <label>
          <span>${p.name}</span>
          <input type="number" class="param-input" data-param="${p.id}"
                 min="${p.min}" max="${p.max}"
                 value="${AppState.params[p.id] ?? p.default}" />
        </label>
      `).join("")}
    </div>
  ` : "";

  const varsHTML = tech.variables.map(([sym, def]) =>
    `<li><b>${sym}</b><span>${def}</span></li>`
  ).join("");

  container.innerHTML = `
    <div class="formula-card fade-in">
      <div class="formula-eyebrow">
        <span class="num">TÉCNICA · ${String(techIdx + 1).padStart(2, "0")} / ${String(window.TECHNIQUES.length).padStart(2, "0")}</span>
        <span class="tag">${tech.complexity}</span>
        <span class="tag">${tech.applies.join(" · ")}</span>
      </div>
      <h2 class="formula-name">${tech.name}</h2>
      <p class="formula-desc">${tech.description}</p>

      <div class="formula-render" data-label="Modelo matemático" id="formula-render"></div>

      ${tech.diagram ? `<div class="formula-diagram" data-label="Estructura del modelo">${tech.diagram}</div>` : ""}

      ${_exampleHTML(_buildExample(tech, activeCol, AppState.params), activeCol)}

      ${paramsHTML}

      <div class="formula-meta-grid">
        <div class="formula-meta-block">
          <h4 class="h-card">Variables</h4>
          <ul>${varsHTML}</ul>
        </div>
        <div class="formula-meta-block">
          <h4 class="h-card">Cuándo usar</h4>
          <p>${tech.when_to_use}</p>
          <h4 class="h-card" style="margin-top:12px">Riesgo</h4>
          <p style="color:var(--accent-amber)">${tech.risk}</p>
        </div>
      </div>
    </div>
  `;

  // Render KaTeX
  const formulaEl = document.getElementById("formula-render");
  if (formulaEl && window.katex) {
    try {
      window.katex.render(tech.katex, formulaEl, {
        throwOnError: false,
        displayMode: true,
      });
    } catch (_) {
      formulaEl.textContent = tech.unicode;
      formulaEl.classList.add("unicode");
    }
  } else if (formulaEl) {
    formulaEl.textContent = tech.unicode;
    formulaEl.classList.add("unicode");
  }

  // Bind param inputs
  container.querySelectorAll(".param-input").forEach(input => {
    input.addEventListener("change", () => {
      AppState.params[input.dataset.param] = Number(input.value);
      // Re-render preview only
      const previewContainer = document.getElementById("preview-container");
      const activeCol = AppState.activeColIdx !== null
        ? AppState.analysis.columns[AppState.activeColIdx] : null;
      if (previewContainer) _renderPreviewCard(previewContainer, activeCol);
    });
  });
}

function _renderPreviewCard(container, activeCol) {
  if (!activeCol) {
    container.innerHTML = `
      <div class="card preview-card">
        <div class="empty-hint">Selecciona una columna para previsualizar.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="card card-flush preview-card">
      <div style="padding:14px 16px;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <h3 class="h-card" style="color:var(--text-primary)">Vista previa</h3>
          <span class="annotation mono" style="color:var(--accent)">${activeCol.name}</span>
        </div>
        <div style="display:flex;gap:18px;margin-top:10px;font-family:var(--font-mono);font-size:11px">
          <div>
            <div class="muted" style="font-size:9px;letter-spacing:.1em;text-transform:uppercase">Nulos</div>
            <div style="color:var(--accent-red)">${activeCol.nulls} → ?</div>
          </div>
          <div>
            <div class="muted" style="font-size:9px;letter-spacing:.1em;text-transform:uppercase">Método</div>
            <div style="color:var(--text-primary)">${window.TECHNIQUES.find(t => t.id === AppState.technique)?.short ?? AppState.technique}</div>
          </div>
        </div>
      </div>
      <div style="padding:14px;text-align:center;color:var(--text-muted);font-family:var(--font-mono);font-size:11px;border-bottom:1px solid var(--border)">
        Haz clic en «Aplicar imputación» para ver el resultado real del servidor.
      </div>
      <div style="padding:14px;border-top:1px solid var(--border)">
        <button class="btn btn-primary" style="width:100%" id="btn-apply"
                ${activeCol.nulls === 0 ? "disabled" : ""}>
          Aplicar imputación →
        </button>
      </div>
    </div>
  `;

  document.getElementById("btn-apply")?.addEventListener("click", _applyImputation);
}

async function _applyImputation() {
  const btn = document.getElementById("btn-apply");
  if (btn) { btn.disabled = true; btn.textContent = "Aplicando…"; }

  const a = AppState.analysis;
  const activeCol = a.columns[AppState.activeColIdx];

  try {
    const result = await api("POST", "/api/impute", {
      column: activeCol.name,
      method: AppState.technique,
      params: AppState.params,
    });
    AppState.imputeResult = result;
    showToast(`✓ ${result.imputed_count} valores imputados en "${result.column}"`, "success");
    advance(3);
  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = "Aplicar imputación →"; }
    showToast(`Error: ${err.message}`, "error", 5000);
  }
}
