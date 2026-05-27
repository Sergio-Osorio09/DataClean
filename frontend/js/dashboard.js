/**
 * dashboard.js — Paso 2: Análisis exploratorio del dataset.
 * RF-02: Estadísticas descriptivas  |  RF-03: Heatmap  |  RF-04: Distribuciones
 */

async function renderDashboard(container) {
  container.innerHTML = `<div class="spinner">Cargando análisis…</div>`;

  try {
    if (!AppState.analysis) {
      AppState.analysis = await api("GET", "/api/analyze");
    }
  } catch (err) {
    container.innerHTML = `<div class="error-state">Error al analizar el dataset:<br>${err.message}</div>`;
    return;
  }

  const a = AppState.analysis;
  const totalCells = a.total_cells;
  const totalNulls = a.total_nulls;
  const colsWithNulls = a.columns.filter(c => c.nulls > 0).length;
  const numTypes  = a.columns.filter(c => c.type === "int" || c.type === "float").length;
  const catTypes  = a.columns.filter(c => c.type === "categorical").length;
  const strTypes  = a.columns.filter(c => c.type === "string").length;

  if (AppState.activeColIdx === null) {
    AppState.activeColIdx = a.columns.findIndex(c => c.nulls > 0);
    if (AppState.activeColIdx < 0) AppState.activeColIdx = 0;
  }

  container.innerHTML = `
    <div class="step-container fade-in">
      <div class="step-head">
        <div>
          <div class="step-eyebrow">02 / 04 · Exploración</div>
          <h1 class="h-display">Análisis exploratorio</h1>
          <p class="lede" style="margin-top:8px">
            Estadísticas descriptivas y matriz de completitud para
            <span class="mono">${a.filename}</span>. Selecciona una columna para
            proseguir a la fase de imputación.
          </p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
          <span class="tag tag-num">${a.total_rows} filas</span>
          <span class="tag tag-num">${a.total_cols} columnas</span>
          <span class="tag tag-red">${totalNulls} nulos</span>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- SIDEBAR -->
        <aside>
          <div class="card card-tight" style="padding:4px 18px">
            <div class="metric">
              <span class="metric-label">Completitud global</span>
              <span class="metric-value">
                ${a.overall_completeness.toFixed(1)}<small>%</small>
              </span>
              <div class="metric-bar">
                <div style="width:${a.overall_completeness}%"></div>
              </div>
            </div>
            <div class="metric">
              <span class="metric-label">Valores faltantes</span>
              <span class="metric-value">
                ${totalNulls}<small>/ ${totalCells} celdas</small>
              </span>
            </div>
            <div class="metric">
              <span class="metric-label">Columnas afectadas</span>
              <span class="metric-value">
                ${colsWithNulls}<small>de ${a.total_cols}</small>
              </span>
            </div>
            <div class="metric">
              <span class="metric-label">Tipos detectados</span>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">
                ${numTypes  > 0 ? `<span class="tag tag-num">${numTypes} numéricas</span>` : ""}
                ${catTypes  > 0 ? `<span class="tag tag-cat">${catTypes} categóricas</span>` : ""}
                ${strTypes  > 0 ? `<span class="tag">${strTypes} string/id</span>` : ""}
              </div>
            </div>
            <div class="metric">
              <span class="metric-label">Memoria estimada</span>
              <span class="metric-value mono" style="font-size:18px;font-family:var(--font-mono)">
                ${(a.size_bytes / 1024).toFixed(1)}<small>KB</small>
              </span>
            </div>
          </div>

          <div class="card card-tight" style="margin-top:16px">
            <div class="card-header">
              <h3 class="h-card">Sesión</h3>
              <span class="annot">live</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;font-family:var(--font-mono);font-size:11px;color:var(--text-secondary)">
              <div style="display:flex;justify-content:space-between">
                <span class="muted">Archivo</span>
                <span>${a.filename}</span>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span class="muted">Filas</span>
                <span>${a.total_rows}</span>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span class="muted">Columnas</span>
                <span>${a.total_cols}</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- MAIN -->
        <div style="display:flex;flex-direction:column;gap:24px">
          <!-- Heatmap -->
          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="h-card">Matriz de completitud · Heatmap</h3>
                <div class="annot" style="margin-top:2px">
                  <span class="mono">${a.total_rows} × ${a.total_cols}</span> — rojo indica null
                </div>
              </div>
            </div>
            <div id="heatmap-container"></div>
          </div>

          <!-- Stats table -->
          <div class="card card-flush">
            <div style="padding:16px 20px 12px;display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid var(--border)">
              <h3 class="h-card" style="color:var(--text-primary)">Estadísticas por columna</h3>
              <span class="annot">RF-02 · pandas.describe()</span>
            </div>
            <div style="overflow-x:auto">
              <table class="stats-table" id="stats-table">
                <thead>
                  <tr>
                    <th>Columna</th><th>Tipo</th><th>Nulos</th>
                    <th style="width:160px">Completitud</th>
                    <th class="num">Media</th><th class="num">Mediana</th>
                    <th class="num">σ</th><th class="num">Mín</th>
                    <th class="num">Máx</th><th class="num">Únicos</th>
                  </tr>
                </thead>
                <tbody id="stats-tbody"></tbody>
              </table>
            </div>
          </div>

          <!-- Distribution -->
          <div class="card" id="dist-card">
            <div class="card-header">
              <div>
                <h3 class="h-card" style="color:var(--text-primary)" id="dist-title">Distribución</h3>
                <div class="annot" style="margin-top:2px" id="dist-sub">Selecciona una columna</div>
              </div>
              <span class="tag" id="dist-type-tag"></span>
            </div>
            <div id="dist-content">
              <div class="empty-hint">Selecciona una columna en la tabla o el heatmap para ver su distribución.</div>
            </div>
          </div>
        </div>
      </div>

      <div class="step-footer">
        <div class="annotation">
          GET <span class="mono">/api/analyze</span> · stats + heatmap matrix
        </div>
        <button class="btn btn-primary" id="btn-continue">
          Imputar columna<span id="btn-col-name">…</span>
          <span>→</span>
        </button>
      </div>
    </div>
  `;

  _refreshDashboard();

  document.getElementById("btn-continue").addEventListener("click", () => {
    if (AppState.activeColIdx !== null) advance(2);
  });
}

function _refreshDashboard() {
  const a = AppState.analysis;
  const activeIdx = AppState.activeColIdx;

  // Heatmap
  const hmContainer = document.getElementById("heatmap-container");
  if (hmContainer) {
    renderHeatmap(hmContainer, a, activeIdx, (ci) => {
      AppState.activeColIdx = ci;
      _refreshDashboard();
    });
  }

  // Stats table
  const tbody = document.getElementById("stats-tbody");
  if (tbody) {
    tbody.innerHTML = a.columns.map((col, idx) => {
      const c = col.completeness;
      const barColor = c >= 95 ? "var(--accent-green)" : c >= 50 ? "var(--accent-amber)" : "var(--accent-red)";
      const typeTag = (col.type === "categorical" || col.type === "string")
        ? `<span class="tag tag-cat">${col.type}</span>`
        : `<span class="tag tag-num">${col.type}</span>`;
      const nullColor = col.nulls > 0 ? "var(--accent-red)" : "var(--text-muted)";

      return `<tr class="${idx === activeIdx ? "active" : ""}" data-idx="${idx}" style="cursor:pointer">
        <td class="col-name">${col.name}</td>
        <td>${typeTag}</td>
        <td class="num" style="color:${nullColor}">${col.nulls}</td>
        <td>
          <div class="completeness-cell">
            <div class="bar"><div style="width:${c}%;background:${barColor}"></div></div>
            <span style="width:38px;text-align:right;color:${barColor}">${c.toFixed(0)}%</span>
          </div>
        </td>
        <td class="num">${col.mean != null ? col.mean.toFixed(2) : "—"}</td>
        <td class="num">${col.median != null ? col.median.toFixed(2) : "—"}</td>
        <td class="num">${col.std != null ? col.std.toFixed(2) : "—"}</td>
        <td class="num">${col.min != null ? col.min : "—"}</td>
        <td class="num">${col.max != null ? col.max : "—"}</td>
        <td class="num">${col.unique}</td>
      </tr>`;
    }).join("");

    tbody.querySelectorAll("tr").forEach(tr => {
      tr.addEventListener("click", () => {
        AppState.activeColIdx = parseInt(tr.dataset.idx);
        _refreshDashboard();
      });
    });
  }

  // Distribution card
  if (activeIdx !== null) {
    const col = a.columns[activeIdx];
    const isNumeric = col.type === "int" || col.type === "float";
    const distTitle = document.getElementById("dist-title");
    const distSub   = document.getElementById("dist-sub");
    const distTag   = document.getElementById("dist-type-tag");
    const distContent = document.getElementById("dist-content");

    if (distTitle) distTitle.innerHTML = `Distribución · <span class="mono" style="color:var(--accent)">${col.name}</span>`;
    if (distSub)   distSub.textContent = isNumeric ? "Histograma + boxplot" : "Frecuencia de categorías";
    if (distTag)   { distTag.textContent = col.type; distTag.className = `tag ${isNumeric ? "tag-num" : "tag-cat"}`; }

    if (distContent) {
      if (isNumeric) {
        distContent.innerHTML = `
          <div class="dist-grid">
            <div id="hist-wrap"></div>
            <div>
              <div class="h-card" style="margin-bottom:10px">Boxplot</div>
              <div id="boxplot-wrap"></div>
              <div class="boxplot-stats" style="margin-top:16px">
                <span class="lbl">μ</span><span>${col.mean?.toFixed(4) ?? "—"}</span>
                <span class="lbl">σ</span><span>${col.std?.toFixed(4) ?? "—"}</span>
                <span class="lbl">Q1</span><span>${col.q25 ?? "—"}</span>
                <span class="lbl">Q3</span><span>${col.q75 ?? "—"}</span>
                <span class="lbl">IQR</span><span>${col.q25 != null && col.q75 != null ? (col.q75 - col.q25).toFixed(4) : "—"}</span>
              </div>
            </div>
          </div>
        `;
        renderHistogram(document.getElementById("hist-wrap"), col);
        renderBoxplot(document.getElementById("boxplot-wrap"), col);
      } else {
        distContent.innerHTML = `<div id="cat-bars"></div>`;
        renderCategorical(document.getElementById("cat-bars"), col);
      }
    }
  }

  // Continue button
  const btn = document.getElementById("btn-continue");
  const btnColName = document.getElementById("btn-col-name");
  if (btn && btnColName) {
    if (activeIdx !== null) {
      btn.disabled = false;
      btnColName.textContent = `: ${a.columns[activeIdx].name}`;
    } else {
      btn.disabled = true;
      btnColName.textContent = "…";
    }
  }
}
