/**
 * upload.js — Paso 1: Carga de CSV con drag-and-drop y dataset de ejemplo.
 * RF-01: Validación de formato y feedback visual.
 */

function renderUpload(container) {
  container.innerHTML = `
    <div class="step-container fade-in">
      <div class="step-head">
        <div>
          <div class="step-eyebrow">01 / 04 · Ingesta</div>
          <h1 class="h-display">Carga del dataset</h1>
          <p class="lede" style="margin-top:8px">
            Sube un archivo <span class="mono">.csv</span> para iniciar el análisis.
            Los datos permanecen en tu máquina; el servidor escucha únicamente en
            <span class="mono">127.0.0.1</span>.
          </p>
        </div>
        <div style="display:flex;gap:8px">
          <span class="tag tag-num">RF-01 · Carga</span>
          <span class="tag">Máx. 50 MB</span>
        </div>
      </div>

      <div class="upload-grid">
        <!-- Drop zone -->
        <div class="dropzone" id="dropzone">
          <input type="file" accept=".csv" id="file-input" style="display:none" />
          <div class="dropzone-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke-linecap="round"/>
              <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" stroke-linecap="round"/>
            </svg>
          </div>
          <h2 class="dropzone-title" id="dropzone-title">Arrastra tu CSV aquí</h2>
          <p class="dropzone-sub" id="dropzone-sub">
            O haz clic en cualquier parte del recuadro para seleccionar un archivo.
          </p>
          <button class="btn btn-primary" id="select-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Seleccionar archivo
          </button>
          <div class="dropzone-hint">
            <span><b>Formato</b> CSV · UTF-8</span>
            <span><b>Separador</b> autodetectado</span>
            <span><b>Encoding</b> infer</span>
          </div>
        </div>

        <!-- Sidebar -->
        <div style="display:flex;flex-direction:column;gap:20px">
          <!-- Samples -->
          <div class="card card-tight">
            <div class="card-header">
              <h3 class="h-card">Datasets de ejemplo</h3>
              <span class="annot">3 disponibles</span>
            </div>
            <div class="samples-card">
              <div class="sample-row" id="sample-titanic">
                <div class="sample-icon">T</div>
                <div class="sample-meta">
                  <span class="sample-name">titanic_train.csv</span>
                  <span class="sample-desc">891 filas · 12 columnas · 866 nulos</span>
                </div>
                <span class="btn btn-sm btn-ghost">Usar →</span>
              </div>
              <div class="sample-row" style="opacity:0.5;cursor:default">
                <div class="sample-icon">I</div>
                <div class="sample-meta">
                  <span class="sample-name">iris.csv</span>
                  <span class="sample-desc">150 filas · 5 columnas · 0 nulos</span>
                </div>
                <span class="tag">sin nulos</span>
              </div>
              <div class="sample-row" style="opacity:0.5;cursor:default">
                <div class="sample-icon">B</div>
                <div class="sample-meta">
                  <span class="sample-name">boston_housing.csv</span>
                  <span class="sample-desc">506 filas · 14 columnas · 23 nulos</span>
                </div>
                <span class="tag">numérico</span>
              </div>
            </div>
          </div>

          <!-- Constraints -->
          <div class="card card-tight">
            <div class="card-header">
              <h3 class="h-card">Restricciones</h3>
              <span class="annot">§ 4.5 — Seguridad</span>
            </div>
            <div class="constraints">
              <div class="constraint"><span class="constraint-label">Formato</span><span class="constraint-value">.csv</span></div>
              <div class="constraint"><span class="constraint-label">Tamaño máx.</span><span class="constraint-value">50 MB</span></div>
              <div class="constraint"><span class="constraint-label">Codificación</span><span class="constraint-value">UTF-8 / Latin-1</span></div>
              <div class="constraint"><span class="constraint-label">Procesamiento</span><span class="constraint-value">en memoria</span></div>
              <div class="constraint"><span class="constraint-label">Red</span><span class="constraint-value">127.0.0.1 only</span></div>
              <div class="constraint"><span class="constraint-label">Persistencia</span><span class="constraint-value">sesión actual</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="step-footer">
        <div class="annotation">
          POST <span class="mono">/api/upload</span> · multipart/form-data ·
          retorna <span class="mono">{ rows, columns, filename }</span>
        </div>
        <div class="annotation">Siguiente: <span class="mono">/api/analyze</span> ↗</div>
      </div>
    </div>
  `;

  _bindUploadEvents();
}

function _bindUploadEvents() {
  const dropzone   = document.getElementById("dropzone");
  const fileInput  = document.getElementById("file-input");
  const selectBtn  = document.getElementById("select-btn");
  const sampleTitanic = document.getElementById("sample-titanic");

  // Click to open file dialog
  dropzone.addEventListener("click", (e) => {
    if (e.target === selectBtn || selectBtn.contains(e.target)) return;
    fileInput.click();
  });
  selectBtn.addEventListener("click", (e) => { e.stopPropagation(); fileInput.click(); });

  // File input change
  fileInput.addEventListener("change", (e) => {
    if (e.target.files[0]) _handleFile(e.target.files[0]);
  });

  // Drag and drop
  dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("dragging"); });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragging"));
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragging");
    if (e.dataTransfer.files[0]) _handleFile(e.dataTransfer.files[0]);
  });

  // Sample dataset (Titanic CSV inline)
  sampleTitanic.addEventListener("click", () => _loadSampleTitanic());
}

async function _handleFile(file) {
  const title = document.getElementById("dropzone-title");
  const sub   = document.getElementById("dropzone-sub");
  const btn   = document.getElementById("select-btn");
  if (btn) btn.style.display = "none";
  title.textContent = `Cargando ${file.name}…`;
  sub.textContent = "Procesando estructura y detectando valores faltantes.";
  document.getElementById("dropzone")?.classList.add("pulse");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const data = await api("POST", "/api/upload", formData);
    AppState.fileInfo = data;
    showToast(`✓ ${data.filename} — ${data.rows} filas × ${data.columns} columnas`, "success");
    advance(1);
  } catch (err) {
    document.getElementById("dropzone")?.classList.remove("pulse");
    if (btn) btn.style.display = "";
    title.textContent = "Arrastra tu CSV aquí";
    sub.textContent = "O haz clic en cualquier parte del recuadro para seleccionar un archivo.";
    showToast(`Error: ${err.message}`, "error", 5000);
  }
}

async function _loadSampleTitanic() {
  // Genera el CSV del Titanic en memoria (muestra reducida con nulos reales)
  const rows = [
    "PassengerId,Survived,Pclass,Name,Sex,Age,SibSp,Parch,Ticket,Fare,Cabin,Embarked",
    "1,0,3,\"Braund, Mr. Owen Harris\",male,22,1,0,A/5 21171,7.25,,S",
    "2,1,1,\"Cumings, Mrs. John Bradley\",female,38,1,0,PC 17599,71.2833,C85,C",
    "3,1,3,\"Heikkinen, Miss. Laina\",female,26,0,0,STON/O2. 3101282,7.925,,S",
    "4,1,1,\"Futrelle, Mrs. Jacques Heath\",female,35,1,0,113803,53.1,C123,S",
    "5,0,3,\"Allen, Mr. William Henry\",male,35,0,0,373450,8.05,,S",
    "6,0,3,\"Moran, Mr. James\",male,,0,0,330877,8.4583,,Q",
    "7,0,1,\"McCarthy, Mr. Timothy J\",male,54,0,0,17463,51.8625,E46,S",
    "8,0,3,\"Palsson, Master. Gosta Leonard\",male,2,3,1,349909,21.075,,S",
    "9,1,3,\"Johnson, Mrs. Oscar W\",female,27,0,2,347742,11.1333,,S",
    "10,1,2,\"Nasser, Mrs. Nicholas\",female,14,1,0,237736,30.0708,,C",
    "11,1,3,\"Sandstrom, Miss. Marguerite Rut\",female,4,1,1,PP 9549,16.7,G6,S",
    "12,1,1,\"Bonnell, Miss. Elizabeth\",female,58,0,0,113783,26.55,C103,S",
    "13,0,3,\"Saundercock, Mr. William Henry\",male,20,0,0,A/5. 2151,8.05,,S",
    "14,0,3,\"Andersson, Mr. Anders Johan\",male,39,1,5,347082,31.275,,S",
    "15,0,3,\"Vestrom, Miss. Hulda Amanda\",female,14,0,0,350406,7.8542,,S",
    "16,1,2,\"Hewlett, Mrs. (Mary D Kingcome)\",female,55,0,0,248706,16,,S",
    "17,0,3,\"Rice, Master. Eugene\",male,2,4,1,382652,29.125,,Q",
    "18,1,2,\"Williams, Mr. Charles Eugene\",male,,0,0,244373,13,,S",
    "19,0,3,\"Vander Planke, Mrs. Julius\",female,31,1,0,345763,18,,S",
    "20,1,3,\"Masselmani, Mrs. Fatima\",female,,0,0,2649,7.225,,C",
    "21,0,2,\"Fynney, Mr. Joseph J\",male,35,0,0,239865,26,,S",
    "22,1,2,\"Beesley, Mr. Lawrence\",male,34,0,0,248698,13,D56,S",
    "23,1,3,\"McGowan, Miss. Anna\",female,15,0,0,330923,8.0292,,Q",
    "24,1,1,\"Sloper, Mr. William Thompson\",male,28,0,0,113788,35.5,A6,S",
    "25,0,3,\"Palsson, Miss. Torborg Danira\",female,8,3,1,349909,21.075,,S",
    "26,1,3,\"Asplund, Mrs. Carl Oscar\",female,38,1,5,347077,31.3875,,S",
    "27,0,3,\"Emir, Mr. Farred Chehab\",male,,0,0,2631,7.225,,C",
    "28,0,1,\"Fortune, Mr. Charles Alexander\",male,19,3,2,19950,263,C23,",
    "29,1,3,\"O'Dwyer, Miss. Ellen\",female,,0,0,330959,7.8792,,Q",
    "30,0,3,\"Todoroff, Mr. Lalio\",male,,0,0,349216,7.8958,,S",
    "31,0,1,\"Uruchurtu, Don. Manuel E\",male,40,0,0,PC 17601,27.7208,,C",
    "32,1,1,\"Spencer, Mrs. William Augustus\",female,,1,0,PC 17569,146.5208,B78,",
    "33,1,3,\"Glynn, Miss. Mary Agatha\",female,,0,0,335677,7.75,,Q",
    "34,0,2,\"Wheadon, Mr. Edward H\",male,66,0,0,C.A. 24579,10.5,,S",
    "35,0,1,\"Meyer, Mr. Edgar Joseph\",male,28,1,0,PC 17604,82.1708,,C",
    "36,0,1,\"Holverson, Mr. Alexander Oskar\",male,42,1,0,113789,52,,S",
    "37,1,3,\"Mamee, Mr. Hanna\",male,,0,0,2677,7.2292,,C",
    "38,0,3,\"Cann, Mr. Ernest Charles\",male,21,0,0,A./5. 2152,8.05,,S",
    "39,0,3,\"Vander Planke, Miss. Augusta Maria\",female,18,2,0,345764,18,,S",
    "40,1,3,\"Nicola-Yarred, Miss. Jamila\",female,14,1,0,2651,11.2417,,C",
    "41,0,3,\"Ahlin, Mrs. Johan\",female,40,1,0,7546,9.475,,S",
    "42,0,2,\"Turpin, Mrs. William John Robert\",female,27,1,0,11668,21,,S",
    "43,0,3,\"Kraeff, Mr. Theodor\",male,,0,0,349253,7.8958,,C",
    "44,1,2,\"Laroche, Miss. Simonne Marie Anne Andree\",female,3,1,2,SC/Paris 2123,41.5792,,C",
    "45,1,3,\"Devaney, Miss. Margaret Delia\",female,19,0,0,330958,7.8792,,Q",
    "46,0,3,\"Rogers, Mr. William John\",male,,0,0,S.C./A.4. 23567,8.05,,S",
    "47,0,3,\"Lennon, Mr. Denis\",male,,1,0,370371,15.5,,Q",
    "48,1,3,\"O'Driscoll, Miss. Bridget\",female,,0,0,14311,7.75,,Q",
    "49,0,3,\"Samaan, Mr. Youssef\",male,,2,0,2662,21.6792,,C",
    "50,0,3,\"Arnold-Franchi, Mrs. Josef\",female,18,1,0,349237,17.8,,S",
  ];

  const csvContent = rows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const file = new File([blob], "titanic_train.csv", { type: "text/csv" });
  await _handleFile(file);
}
