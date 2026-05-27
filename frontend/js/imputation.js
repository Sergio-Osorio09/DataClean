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
          <span class="tag tag-num">RF-07 · 9 técnicas</span>
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
                ${activeCol ? `compatibles con ${activeCol.type}` : "9 técnicas disponibles"}
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
  if (techSub) techSub.textContent = activeCol ? `compatibles con ${activeCol.type}` : "9 técnicas disponibles";

  // Library annotation
  const techLib = document.getElementById("tech-lib");
  if (techLib && tech) techLib.innerHTML = `Implementación: <span class="mono">${tech.library}</span>`;

  // Formula card
  const formulaContainer = document.getElementById("formula-container");
  if (formulaContainer) _renderFormulaCard(formulaContainer, tech);

  // Preview
  const previewContainer = document.getElementById("preview-container");
  if (previewContainer) _renderPreviewCard(previewContainer, activeCol);
}

function _renderFormulaCard(container, tech) {
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
        <span class="num">TÉCNICA · ${String(techIdx + 1).padStart(2, "0")} / 09</span>
        <span class="tag">${tech.complexity}</span>
        <span class="tag">${tech.applies.join(" · ")}</span>
      </div>
      <h2 class="formula-name">${tech.name}</h2>
      <p class="formula-desc">${tech.description}</p>

      <div class="formula-render" data-label="Modelo matemático" id="formula-render"></div>

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
