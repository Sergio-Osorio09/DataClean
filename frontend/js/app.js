/**
 * app.js — Controlador principal de la SPA DataClean Pro.
 * Gestiona el estado global, la navegación entre pasos y el stepper.
 */

/* ── Estado global de la aplicación ──────────────────────────────── */
const AppState = {
  step: 0,              // paso actual (0=upload, 1=analyze, 2=impute, 3=compare)
  completedSteps: new Set(),
  fileInfo: null,       // { filename, rows, columns, size_bytes }
  analysis: null,       // respuesta de /api/analyze
  activeColIdx: null,   // índice de la columna seleccionada
  technique: "mean",
  params: { k: 3 },
  imputeResult: null,   // respuesta de /api/impute
  beforeAfter: null,    // respuesta de /api/before-after
};

const STEPS = [
  { id: 0, label: "Cargar",   sub: "Ingesta" },
  { id: 1, label: "Analizar", sub: "Exploración" },
  { id: 2, label: "Imputar",  sub: "Técnica" },
  { id: 3, label: "Exportar", sub: "Resultado" },
];

/* ── Utilidades de API ───────────────────────────────────────────── */
async function api(method, path, body = null) {
  const opts = { method, headers: {} };
  if (body && !(body instanceof FormData)) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  } else if (body) {
    opts.body = body;
  }
  const res = await fetch(path, opts);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err.detail?.detail || err.detail || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

/* ── Toast notifications ─────────────────────────────────────────── */
function showToast(msg, type = "info", duration = 3500) {
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

/* ── Stepper ─────────────────────────────────────────────────────── */
function renderStepper() {
  const nav = document.querySelector(".stepper");
  if (!nav) return;
  nav.innerHTML = "";
  STEPS.forEach((s, i) => {
    const done   = AppState.completedSteps.has(s.id);
    const active = AppState.step === s.id;
    const locked = !active && !done && !AppState.completedSteps.has(s.id - 1) && s.id !== 0;

    const btn = document.createElement("button");
    btn.className = ["step-btn", active ? "active" : "", done ? "done" : "", locked ? "locked" : ""].join(" ").trim();
    btn.disabled = locked;
    btn.innerHTML = `
      <span class="step-num">${done ? "✓" : String(s.id + 1).padStart(2, "0")}</span>
      ${s.label}
    `;
    btn.addEventListener("click", () => goToStep(s.id));
    nav.appendChild(btn);

    if (i < STEPS.length - 1) {
      const divider = document.createElement("div");
      divider.className = "step-divider";
      nav.appendChild(divider);
    }
  });
}

function advance(to) {
  for (let i = 0; i < to; i++) AppState.completedSteps.add(i);
  AppState.step = to;
  renderStep();
  document.querySelector(".main")?.scrollTo({ top: 0, behavior: "smooth" });
}

function goToStep(id) {
  if (id <= AppState.step || AppState.completedSteps.has(id - 1) || id === 0) {
    AppState.step = id;
    renderStep();
    document.querySelector(".main")?.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function resetApp() {
  AppState.step = 0;
  AppState.completedSteps = new Set();
  AppState.fileInfo = null;
  AppState.analysis = null;
  AppState.activeColIdx = null;
  AppState.technique = "mean";
  AppState.params = { k: 3 };
  AppState.imputeResult = null;
  AppState.beforeAfter = null;
  api("POST", "/api/reset").catch(() => {});
  renderStep();
}

/* ── Router principal ────────────────────────────────────────────── */
function renderStep() {
  renderStepper();
  const main = document.querySelector(".main");
  if (!main) return;
  main.innerHTML = "";

  // Todas las funciones de paso pueden ser async; las llamamos con .catch() para capturar errores
  const steps = [renderUpload, renderDashboard, renderImputation, renderComparison];
  const fn = steps[AppState.step];
  if (fn) {
    Promise.resolve(fn(main)).catch((err) => {
      main.innerHTML = `<div class="error-state">Error inesperado:<br>${err.message}</div>`;
      console.error(err);
    });
  }
}

/* ── Boot ────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  renderStep();
});
