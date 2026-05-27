/**
 * charts.js — Renderizado de visualizaciones con SVG inline.
 * RF-03: Heatmap de nulos  |  RF-04: Histograma + Boxplot + Distribución categórica
 */

/* ── Heatmap de completitud ──────────────────────────────────────── */
function renderHeatmap(container, analysis, activeColIdx, onColClick) {
  const cols = analysis.columns;
  const heatmap = analysis.heatmap; // [col_idx][row_idx] 1=presente, 0=nulo
  const totalRows = analysis.total_rows;
  const displayRows = Math.min(totalRows, 50);

  container.innerHTML = `
    <div class="heatmap-legend">
      <span><span class="swatch" style="background:var(--filled)"></span>presente</span>
      <span><span class="swatch" style="background:var(--null)"></span>nulo</span>
      <span class="muted" style="margin-left:auto;font-size:10px">
        mostrando ${displayRows} / ${totalRows} filas
      </span>
    </div>
    <div class="heatmap">
      <div class="heatmap-rownames" id="hm-rownames"></div>
      <div class="heatmap-main">
        <div class="heatmap-colnames" id="hm-colnames"
             style="grid-template-columns: repeat(${cols.length}, 1fr)"></div>
        <div class="heatmap-cells" id="hm-cells"
             style="grid-template-columns: repeat(${cols.length}, 1fr); grid-auto-rows: 13px; gap:1px"></div>
      </div>
    </div>
  `;

  // Row labels
  const rowNames = container.querySelector("#hm-rownames");
  for (let r = 0; r < displayRows; r++) {
    const d = document.createElement("div");
    d.textContent = String(r + 1).padStart(3, " ");
    rowNames.appendChild(d);
  }

  // Column headers
  const colNames = container.querySelector("#hm-colnames");
  cols.forEach((col, ci) => {
    const d = document.createElement("div");
    d.textContent = col.name;
    d.title = col.name;
    d.style.color = ci === activeColIdx ? "var(--accent)" : "";
    d.style.fontWeight = ci === activeColIdx ? "600" : "";
    d.addEventListener("click", () => onColClick(ci));
    colNames.appendChild(d);
  });

  // Cells
  const cells = container.querySelector("#hm-cells");
  for (let r = 0; r < displayRows; r++) {
    cols.forEach((col, ci) => {
      const v = heatmap[ci] ? heatmap[ci][r] : 1;
      const cell = document.createElement("div");
      cell.className = `heatmap-cell ${v === 1 ? "filled" : "null"}`;
      cell.title = `${col.name} · fila ${r + 1}: ${v === 1 ? col.name : "NULL"}`;
      cell.style.outline = ci === activeColIdx ? "1px solid var(--accent)" : "none";
      cell.style.outlineOffset = "-1px";
      cell.addEventListener("click", () => onColClick(ci));
      cells.appendChild(cell);
    });
  }
}

/* ── Histograma numérico (SVG inline) ────────────────────────────── */
function renderHistogram(container, col) {
  if (!col.histogram || col.histogram.length === 0) {
    container.innerHTML = `<div class="empty-hint">Sin datos numéricos para visualizar.</div>`;
    return;
  }

  const bins = col.histogram;
  const maxCount = Math.max(...bins.map(b => b.count), 1);
  const W = bins.length * 28;
  const H = 140;

  let bars = "";
  let labels = "";
  bins.forEach((b, i) => {
    const h = (b.count / maxCount) * 120;
    const x = i * 28 + 2;
    const y = H - 12 - h;
    bars += `<rect x="${x}" y="${y}" width="22" height="${h}"
              fill="var(--accent)" opacity="0.85" rx="1"/>`;
    if (i % Math.ceil(bins.length / 6) === 0) {
      labels += `<text x="${x + 11}" y="${H - 2}" font-size="7"
                  fill="var(--text-muted)" text-anchor="middle"
                  font-family="var(--font-mono)">${b.label}</text>`;
    }
    if (b.count > 0) {
      bars += `<text x="${x + 11}" y="${y - 3}" font-size="7"
                fill="var(--text-secondary)" text-anchor="middle"
                font-family="var(--font-mono)">${b.count}</text>`;
    }
  });

  container.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" class="hist-svg" preserveAspectRatio="none">
      ${bars}
      ${labels}
      <line x1="0" x2="${W}" y1="${H - 12}" y2="${H - 12}"
            stroke="var(--border-strong)" stroke-width="0.5"/>
    </svg>
  `;
}

/* ── Boxplot SVG inline ───────────────────────────────────────────── */
function renderBoxplot(container, col) {
  if (col.min == null) { container.innerHTML = ""; return; }
  const { min, max, q25, q75, median } = col;
  const range = max - min || 1;
  const sx = v => ((v - min) / range) * 180 + 10;

  container.innerHTML = `
    <svg viewBox="0 0 200 60" width="100%" height="60">
      <line x1="${sx(min)}" x2="${sx(max)}" y1="30" y2="30"
            stroke="var(--text-muted)" stroke-width="1"/>
      <line x1="${sx(min)}" x2="${sx(min)}" y1="22" y2="38"
            stroke="var(--text-muted)" stroke-width="1"/>
      <line x1="${sx(max)}" x2="${sx(max)}" y1="22" y2="38"
            stroke="var(--text-muted)" stroke-width="1"/>
      <rect x="${sx(q25)}" y="18" width="${sx(q75) - sx(q25)}" height="24"
            fill="rgba(14,165,233,0.18)" stroke="var(--accent)" stroke-width="1"/>
      <line x1="${sx(median)}" x2="${sx(median)}" y1="18" y2="42"
            stroke="var(--accent-green)" stroke-width="2"/>
      <text x="${sx(min)}" y="56" font-size="7" fill="var(--text-muted)"
            text-anchor="middle" font-family="var(--font-mono)">${min}</text>
      <text x="${sx(max)}" y="56" font-size="7" fill="var(--text-muted)"
            text-anchor="middle" font-family="var(--font-mono)">${max}</text>
      <text x="${sx(median)}" y="14" font-size="7" fill="var(--accent-green)"
            text-anchor="middle" font-family="var(--font-mono)">med=${median?.toFixed?.(1) ?? median}</text>
    </svg>
  `;
}

/* ── Distribución categórica ─────────────────────────────────────── */
function renderCategorical(container, col) {
  const cats = col.categories || [];
  if (cats.length === 0) {
    container.innerHTML = `<div class="empty-hint">Sin valores observados.</div>`;
    return;
  }
  const maxCount = cats[0].count;
  container.innerHTML = cats.map(c => `
    <div class="cat-bar-row" style="margin-bottom:8px">
      <span class="cat-bar-label" title="${c.value}">${c.value}</span>
      <div class="cat-bar-track">
        <div class="cat-bar-fill" style="width:${(c.count / maxCount * 100).toFixed(1)}%"></div>
      </div>
      <span class="cat-bar-count num">${c.count}</span>
    </div>
  `).join("");
}
