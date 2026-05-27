/**
 * comparison.js — Paso 4: Comparación antes/después y descarga del CSV limpio.
 * RF-08: Celdas resaltadas  |  RF-09: Descarga con nombre descriptivo
 */

async function renderComparison(container) {
  container.innerHTML = `<div class="spinner">Cargando comparación…</div>`;

  try {
    AppState.beforeAfter = await api("GET", "/api/before-after");
  } catch (err) {
    container.innerHTML = `<div class="error-state">Error al cargar la comparación:<br>${err.message}</div>`;
    return;
  }

  const ba      = AppState.beforeAfter;
  const result  = AppState.imputeResult;
  const a       = AppState.analysis;
  const tech    = window.TECHNIQUES.find(t => t.id === AppState.technique);
  const activeCol = a.columns[AppState.activeColIdx];
  const colName   = activeCol?.name ?? "";

  const changedRows   = result?.imputed_count ?? 0;
  const nullsBefore   = result?.nulls_before ?? 0;
  const nullsAfter    = result?.nulls_after ?? 0;
  const improvement   = nullsBefore > 0 ? ((nullsBefore - nullsAfter) / nullsBefore * 100).toFixed(0) : "100";

  const today     = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const filename  = `${(AppState.fileInfo?.filename ?? "dataset").replace(".csv", "")}__${colName}_${AppState.technique}_${today}.csv`;

  const colHeaders = ba.columns.map((c, i) =>
    `<th class="${i === AppState.activeColIdx ? "row-idx" : ""}" style="${c === colName ? "color:var(--accent)" : ""}">${c}</th>`
  ).join("");

  // Build changed set for quick lookup: {row_idx}
  const changedSet = new Set((ba.changed_cells[colName] || []).map(String));

  const tableRows = ba.after.map((row, ri) => {
    const origRow = ba.before[ri];
    const cells = ba.columns.map((col, ci) => {
      const val      = row[col];
      const origVal  = origRow[col];
      const isNull   = val === null || val === undefined;
      const wasNull  = origVal === null || origVal === undefined;
      const isImputed = col === colName && wasNull && !isNull;

      let cls = "";
      if (isImputed) cls = "imputed-cell changed";
      else if (isNull) cls = "null-cell";

      const display = isNull ? "—"
        : typeof val === "number"
          ? (Number.isInteger(val) ? val : val.toFixed(2))
          : String(val).slice(0, 20);

      const align = typeof val === "number" ? "right" : "left";
      return `<td class="${cls}" style="text-align:${align}">${display}</td>`;
    }).join("");

    return `<tr>
      <td class="row-idx">${String(ri + 1).padStart(3, "0")}</td>
      ${cells}
    </tr>`;
  }).join("");

  container.innerHTML = `
    <div class="step-container fade-in">
      <div class="step-head">
        <div>
          <div class="step-eyebrow">04 / 04 · Resultado</div>
          <h1 class="h-display">Comparación antes / después</h1>
          <p class="lede" style="margin-top:8px">
            Resumen de los cambios aplicados al dataset. Las celdas resaltadas en
            <span style="color:var(--accent)">cyan</span> fueron imputadas con el método
            <span class="mono">${tech?.short ?? AppState.technique}</span>.
          </p>
        </div>
        <div style="display:flex;gap:8px">
          <span class="tag tag-num">RF-08 · Comparación</span>
          <span class="tag tag-cat">+${changedRows} imputados</span>
        </div>
      </div>

      <!-- Summary cards -->
      <div class="comparison-summary">
        <div class="card">
          <div class="metric-label">Celdas modificadas</div>
          <div class="metric-value">${changedRows}<small>/ ${ba.total_rows} filas</small></div>
        </div>
        <div class="card">
          <div class="metric-label">Nulos restantes</div>
          <div class="metric-value" style="color:${nullsAfter === 0 ? "var(--accent-green)" : "var(--accent-red)"}">
            ${nullsAfter}<small>antes: ${nullsBefore}</small>
          </div>
        </div>
        <div class="card">
          <div class="metric-label">% de mejora</div>
          <div class="metric-value" style="color:var(--accent-green)">${improvement}<small>%</small></div>
        </div>
        <div class="card">
          <div class="metric-label">Técnica aplicada</div>
          <div class="metric-value" style="font-size:18px">
            ${tech?.short ?? AppState.technique}
            <small>${tech?.complexity ?? ""}</small>
          </div>
        </div>
      </div>

      <!-- Table + sidebar -->
      <div style="display:grid;grid-template-columns:1fr 320px;gap:24px;align-items:flex-start">
        <div>
          <div class="card-header" style="border-bottom:0;padding-bottom:0;margin-bottom:12px">
            <h3 class="h-card" style="color:var(--text-primary)">
              Vista del dataset · columna <span class="mono" style="color:var(--accent)">${colName}</span>
            </h3>
            <span class="annot">
              <span style="background:rgba(14,165,233,.22);padding:0 6px;border-radius:2px;margin-right:8px">cyan</span>
              celdas imputadas (${ba.showing_rows} de ${ba.total_rows} filas)
            </span>
          </div>
          <div class="comparison-table-wrap">
            <table class="comparison-table">
              <thead>
                <tr>
                  <th class="row-idx">#</th>
                  ${colHeaders}
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>
        </div>

        <!-- Log sidebar -->
        <aside style="display:flex;flex-direction:column;gap:16px">
          <div class="card">
            <div class="card-header">
              <h3 class="h-card">Reporte de cambios</h3>
              <span class="annot">log</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;font-family:var(--font-mono);font-size:11.5px;color:var(--text-secondary)">
              <div style="padding-bottom:8px;border-bottom:1px solid var(--border)">
                <div class="muted" style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">Dataset</div>
                <div>${AppState.fileInfo?.filename ?? "—"}</div>
              </div>
              <div style="padding-bottom:8px;border-bottom:1px solid var(--border)">
                <div class="muted" style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">Columna</div>
                <div style="color:var(--accent)">${colName}</div>
              </div>
              <div style="padding-bottom:8px;border-bottom:1px solid var(--border)">
                <div class="muted" style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">Método</div>
                <div>${tech?.name ?? AppState.technique}</div>
                <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${tech?.library ?? ""}</div>
              </div>
              <div style="padding-bottom:8px;border-bottom:1px solid var(--border)">
                <div class="muted" style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">Detalles</div>
                <div style="display:grid;grid-template-columns:1fr auto;gap:2px 8px">
                  <span class="muted">filas total</span><span>${ba.total_rows}</span>
                  <span class="muted">nulos antes</span><span style="color:var(--accent-red)">${nullsBefore}</span>
                  <span class="muted">nulos después</span><span style="color:${nullsAfter === 0 ? "var(--accent-green)" : "var(--accent-red)"}">${nullsAfter}</span>
                  <span class="muted">imputados</span><span style="color:var(--accent)">+${changedRows}</span>
                </div>
              </div>
              <div>
                <div class="muted" style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">Próximas acciones</div>
                <button class="btn btn-sm btn-ghost" id="btn-back-impute"
                        style="width:100%;justify-content:flex-start;padding:5px 8px;margin-bottom:4px">
                  ↺ Imputar otra columna
                </button>
                <button class="btn btn-sm btn-ghost" id="btn-reset"
                        style="width:100%;justify-content:flex-start;padding:5px 8px">
                  ⟲ Cargar nuevo dataset
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <!-- Download bar -->
      <div class="download-bar">
        <div class="info">
          <span class="file">↓ ${filename}</span>
          <span class="meta">
            ${ba.total_rows} filas · ${ba.columns.length} columnas ·
            ~${Math.round((AppState.fileInfo?.size_bytes ?? 0) / 1024)} KB ·
            UTF-8 · GET /api/download
          </span>
        </div>
        <a href="/api/download" download class="btn btn-primary" id="btn-download">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Descargar CSV
        </a>
      </div>

      <div class="step-footer">
        <div class="annotation">
          GET <span class="mono">/api/before-after</span> · GET <span class="mono">/api/download</span>
        </div>
        <div class="annotation">
          Sesión persistida en memoria — POST /api/reset para limpiar
        </div>
      </div>
    </div>
  `;

  document.getElementById("btn-back-impute")?.addEventListener("click", () => {
    AppState.imputeResult = null;
    AppState.beforeAfter  = null;
    // Re-fetch del análisis para reflejar nulos ya corregidos en el dashboard
    AppState.analysis     = null;
    AppState.activeColIdx = null;
    // Ir al paso Analizar (1) para que el usuario elija la próxima columna
    goToStep(1);
  });

  document.getElementById("btn-reset")?.addEventListener("click", resetApp);
}
