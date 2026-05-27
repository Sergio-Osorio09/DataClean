/**
 * upload.js — Paso 1: Carga de CSV con drag-and-drop y datasets de ejemplo.
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
              <span class="annot">4 disponibles</span>
            </div>
            <div class="samples-card">
              <div class="sample-row" id="sample-titanic">
                <div class="sample-icon">T</div>
                <div class="sample-meta">
                  <span class="sample-name">titanic_train.csv</span>
                  <span class="sample-desc">50 filas · 12 cols · Age, Cabin, Embarked nulos</span>
                </div>
                <span class="btn btn-sm btn-ghost">Usar →</span>
              </div>
              <div class="sample-row" id="sample-housing">
                <div class="sample-icon">H</div>
                <div class="sample-meta">
                  <span class="sample-name">housing_prices.csv</span>
                  <span class="sample-desc">55 filas · 11 cols · Garage, Pool, LotArea nulos</span>
                </div>
                <span class="btn btn-sm btn-ghost">Usar →</span>
              </div>
              <div class="sample-row" id="sample-medical">
                <div class="sample-icon">P</div>
                <div class="sample-meta">
                  <span class="sample-name">pacientes_medicos.csv</span>
                  <span class="sample-desc">50 filas · 9 cols · Age, BMI, BloodPressure nulos</span>
                </div>
                <span class="btn btn-sm btn-ghost">Usar →</span>
              </div>
              <div class="sample-row" id="sample-hr">
                <div class="sample-icon">E</div>
                <div class="sample-meta">
                  <span class="sample-name">empleados_rrhh.csv</span>
                  <span class="sample-desc">50 filas · 9 cols · Salary, Dept, Performance nulos</span>
                </div>
                <span class="btn btn-sm btn-ghost">Usar →</span>
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
  const dropzone  = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const selectBtn = document.getElementById("select-btn");

  dropzone.addEventListener("click", (e) => {
    if (e.target === selectBtn || selectBtn.contains(e.target)) return;
    fileInput.click();
  });
  selectBtn.addEventListener("click", (e) => { e.stopPropagation(); fileInput.click(); });
  fileInput.addEventListener("change", (e) => {
    if (e.target.files[0]) _handleFile(e.target.files[0]);
  });

  dropzone.addEventListener("dragover",  (e) => { e.preventDefault(); dropzone.classList.add("dragging"); });
  dropzone.addEventListener("dragleave", ()  => dropzone.classList.remove("dragging"));
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragging");
    if (e.dataTransfer.files[0]) _handleFile(e.dataTransfer.files[0]);
  });

  document.getElementById("sample-titanic")?.addEventListener("click", () => _loadSampleTitanic());
  document.getElementById("sample-housing")?.addEventListener("click", () => _loadSampleHousing());
  document.getElementById("sample-medical")?.addEventListener("click", () => _loadSampleMedical());
  document.getElementById("sample-hr")?.addEventListener("click",      () => _loadSampleHR());
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

// ── Dataset 1: Titanic ───────────────────────────────────────────────
// Nulos reales: Age (múltiples), Cabin (mayoría), Embarked (2)
async function _loadSampleTitanic() {
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
    "39,0,3,\"Vander Planke, Miss. Augusta\",female,18,2,0,345764,18,,S",
    "40,1,3,\"Nicola-Yarred, Miss. Jamila\",female,14,1,0,2651,11.2417,,C",
    "41,0,3,\"Ahlin, Mrs. Johan\",female,40,1,0,7546,9.475,,S",
    "42,0,2,\"Turpin, Mrs. William John\",female,27,1,0,11668,21,,S",
    "43,0,3,\"Kraeff, Mr. Theodor\",male,,0,0,349253,7.8958,,C",
    "44,1,2,\"Laroche, Miss. Simonne\",female,3,1,2,SC/Paris 2123,41.5792,,C",
    "45,1,3,\"Devaney, Miss. Margaret Delia\",female,19,0,0,330958,7.8792,,Q",
    "46,0,3,\"Rogers, Mr. William John\",male,,0,0,S.C./A.4. 23567,8.05,,S",
    "47,0,3,\"Lennon, Mr. Denis\",male,,1,0,370371,15.5,,Q",
    "48,1,3,\"O'Driscoll, Miss. Bridget\",female,,0,0,14311,7.75,,Q",
    "49,0,3,\"Samaan, Mr. Youssef\",male,,2,0,2662,21.6792,,C",
    "50,0,3,\"Arnold-Franchi, Mrs. Josef\",female,18,1,0,349237,17.8,,S",
  ];
  const file = new File([new Blob([rows.join("\n")], { type: "text/csv" })], "titanic_train.csv", { type: "text/csv" });
  await _handleFile(file);
}

// ── Dataset 2: Housing Prices ────────────────────────────────────────
// Nulos: LotArea (8), YearBuilt (5), GarageType (7), GarageArea (7), PoolArea (50)
async function _loadSampleHousing() {
  const rows = [
    "Id,Neighborhood,LotArea,YearBuilt,OverallQual,Bedrooms,Bathrooms,GarageType,GarageArea,PoolArea,SalePrice",
    "1,CollgCr,8450,2003,7,3,2,Attchd,548,,208500",
    "2,Veenker,9600,1976,6,3,2,Attchd,460,,181500",
    "3,Crawfor,11250,2001,7,3,2,Attchd,608,,223500",
    "4,NoRidge,9550,1915,7,3,3,Detchd,642,452,140000",
    "5,Mitchel,14260,2000,8,4,2,Attchd,836,,250000",
    "6,Somerst,14115,1993,5,2,1,,,,,143000",
    "7,NWAmes,,2004,8,4,3,Attchd,636,,307000",
    "8,OldTown,10382,1910,4,3,2,Detchd,356,,200000",
    "9,BrkSide,6120,1964,4,3,1,Detchd,285,,129900",
    "10,Somerst,7420,,6,3,2,Attchd,490,,182000",
    "11,CollgCr,11241,1988,5,3,1,,,,,142000",
    "12,Crawfor,13830,2004,8,4,3,Attchd,714,,307000",
    "13,CollgCr,9978,1923,5,3,1,Detchd,352,,115000",
    "14,Mitchel,,1973,5,3,2,Attchd,480,,129500",
    "15,NoRidge,14803,2007,9,4,4,BuiltIn,800,561,325000",
    "16,NWAmes,5000,1975,4,2,1,,,,,78000",
    "17,OldTown,10703,1936,4,3,1,Detchd,252,,94000",
    "18,Somerst,10791,,5,3,2,Attchd,506,,157000",
    "19,CollgCr,8099,2005,7,3,2,Attchd,526,,193500",
    "20,NWAmes,,1970,5,3,2,Detchd,378,,136000",
    "21,BrkSide,6000,1968,4,2,1,Detchd,268,,89000",
    "22,Mitchel,14000,2001,8,4,3,Attchd,762,,270000",
    "23,SawyerW,6030,1978,4,2,1,,,,,92000",
    "24,CollgCr,7800,2000,6,3,2,Attchd,510,,178000",
    "25,Crawfor,,1998,7,3,2,Attchd,600,,215000",
    "26,NoRidge,12000,2009,9,5,4,BuiltIn,898,,368000",
    "27,OldTown,9000,1901,3,2,1,Detchd,220,,65000",
    "28,Somerst,8450,1992,5,3,2,Attchd,476,,145000",
    "29,NWAmes,7500,2006,7,3,2,Attchd,652,,234000",
    "30,CollgCr,,1999,6,3,2,Attchd,534,,172000",
    "31,BrkSide,4500,1960,3,2,1,,,,,71000",
    "32,Mitchel,13175,2003,8,4,3,Attchd,770,,267000",
    "33,OldTown,9825,1916,4,3,2,Detchd,300,,118000",
    "34,Crawfor,10800,,7,3,2,Attchd,596,,208000",
    "35,NoRidge,16200,2008,10,5,4,BuiltIn,920,480,395000",
    "36,CollgCr,8770,2001,7,3,2,Attchd,554,,215000",
    "37,Mitchel,,1974,5,3,2,Detchd,400,,126000",
    "38,Somerst,10875,1997,6,3,2,Attchd,520,,168000",
    "39,NWAmes,5000,1965,4,2,1,,,,,82000",
    "40,OldTown,7200,1904,3,2,1,Detchd,228,,68000",
    "41,BrkSide,5400,,4,2,1,Detchd,272,,86000",
    "42,CollgCr,8100,2003,8,4,3,Attchd,720,400,252000",
    "43,Crawfor,9600,2007,8,4,3,Attchd,734,,274000",
    "44,NoRidge,,2004,9,4,3,Attchd,868,,342000",
    "45,Mitchel,12250,1999,7,3,2,Attchd,640,,212000",
    "46,Somerst,10500,2002,7,4,3,Attchd,684,,235000",
    "47,NWAmes,8700,1971,5,3,2,Detchd,372,,132000",
    "48,OldTown,,1925,3,2,1,Detchd,240,,72000",
    "49,CollgCr,7700,2001,6,3,2,Attchd,504,,180000",
    "50,BrkSide,4800,1957,3,2,1,,,,,75000",
    "51,Crawfor,9400,2005,7,3,2,Attchd,620,,225000",
    "52,NWAmes,8200,,5,3,2,Attchd,440,,148000",
    "53,Mitchel,13000,2006,8,4,2,Attchd,780,,286000",
    "54,CollgCr,8300,2002,7,3,2,Attchd,530,,197000",
    "55,NoRidge,15000,2010,9,5,4,BuiltIn,896,612,412000",
  ];
  const file = new File([new Blob([rows.join("\n")], { type: "text/csv" })], "housing_prices.csv", { type: "text/csv" });
  await _handleFile(file);
}

// ── Dataset 3: Pacientes Médicos ─────────────────────────────────────
// Nulos: Age (5), BloodPressure (6), Cholesterol (4), Glucose (5), BMI (5), Smoker (5)
async function _loadSampleMedical() {
  const rows = [
    "PatientId,Age,Gender,BloodPressure,Cholesterol,Glucose,BMI,Smoker,Outcome",
    "1,63,M,145,233,150,33.6,Yes,1",
    "2,58,F,,246,87,31.2,No,0",
    "3,28,F,66,193,94,28.1,,0",
    "4,33,F,96,209,121,,No,1",
    "5,43,M,100,255,168,42.7,Yes,1",
    "6,,F,90,178,80,25.2,No,0",
    "7,54,M,140,251,190,35.0,Yes,1",
    "8,42,F,,207,90,27.6,No,0",
    "9,31,M,70,192,101,26.4,No,0",
    "10,26,F,85,,88,28.9,No,0",
    "11,29,M,95,210,100,32.1,,0",
    "12,,F,120,244,169,38.5,Yes,1",
    "13,52,M,130,,175,40.0,Yes,1",
    "14,38,F,82,195,83,24.5,No,0",
    "15,40,M,,215,120,31.8,No,0",
    "16,23,F,75,186,88,22.3,No,0",
    "17,60,M,160,280,210,45.2,Yes,1",
    "18,34,F,88,205,98,,No,0",
    "19,45,M,110,235,145,36.7,Yes,1",
    "20,27,F,72,190,,23.8,No,0",
    "21,61,M,145,273,200,43.1,Yes,1",
    "22,,M,130,250,180,39.4,,1",
    "23,35,F,80,198,95,26.2,No,0",
    "24,46,M,120,240,155,37.0,Yes,1",
    "25,30,F,78,188,86,24.0,No,0",
    "26,55,M,,265,185,41.5,Yes,1",
    "27,32,F,84,,91,25.8,No,0",
    "28,50,M,135,255,170,,Yes,1",
    "29,28,F,70,192,84,22.5,No,0",
    "30,41,M,105,228,140,34.0,,1",
    "31,57,F,140,268,195,42.3,Yes,1",
    "32,24,M,75,186,,23.0,No,0",
    "33,,F,90,210,110,29.5,No,0",
    "34,49,M,125,248,162,37.5,Yes,1",
    "35,36,F,82,196,88,25.0,No,0",
    "36,62,M,155,275,205,44.0,Yes,1",
    "37,25,F,,182,85,,No,0",
    "38,44,M,110,232,148,35.5,Yes,1",
    "39,31,F,76,194,92,24.2,No,0",
    "40,53,M,140,258,178,39.0,Yes,1",
    "41,29,F,78,190,88,,No,0",
    "42,47,M,118,238,158,36.0,,1",
    "43,37,F,84,200,,26.0,No,0",
    "44,,M,132,252,175,40.5,Yes,1",
    "45,26,F,72,185,86,22.0,No,0",
    "46,58,M,148,270,198,43.5,Yes,1",
    "47,33,F,80,,90,25.2,No,0",
    "48,42,M,,225,138,34.2,Yes,1",
    "49,30,F,75,188,87,23.0,No,0",
    "50,56,M,145,265,,42.0,Yes,1",
  ];
  const file = new File([new Blob([rows.join("\n")], { type: "text/csv" })], "pacientes_medicos.csv", { type: "text/csv" });
  await _handleFile(file);
}

// ── Dataset 4: Empleados RRHH ────────────────────────────────────────
// Nulos: Department (6), Age (6), Salary (7), YearsExp (5), PerformanceScore (6), Education (6)
async function _loadSampleHR() {
  const rows = [
    "EmployeeId,Department,Age,Gender,Salary,YearsExp,PerformanceScore,Education,Attrition",
    "1,IT,32,M,75000,7,High,Master,No",
    "2,Sales,28,F,,4,Medium,Bachelor,No",
    "3,,25,F,45000,2,Low,Bachelor,Yes",
    "4,Finance,45,M,95000,18,,Master,No",
    "5,HR,,F,53000,8,Medium,Bachelor,No",
    "6,Operations,52,M,88000,25,High,,No",
    "7,Marketing,29,F,,5,High,Master,No",
    "8,IT,36,M,82000,10,High,Master,No",
    "9,Sales,33,M,61000,,Medium,Bachelor,No",
    "10,Finance,41,F,91000,15,Excellent,Master,No",
    "11,,27,F,47000,3,Low,Bachelor,Yes",
    "12,HR,34,F,50000,8,,Bachelor,No",
    "13,Operations,,M,86000,22,High,HighSchool,No",
    "14,Marketing,30,F,60000,6,Medium,,No",
    "15,IT,38,M,,12,High,PhD,No",
    "16,Sales,26,F,48000,3,Medium,Bachelor,Yes",
    "17,Finance,44,M,97000,17,Excellent,Master,No",
    "18,HR,31,F,49000,,Medium,Bachelor,No",
    "19,,35,M,72000,9,High,Bachelor,No",
    "20,Operations,50,M,89000,24,,HighSchool,No",
    "21,Marketing,,F,63000,8,High,Master,No",
    "22,IT,42,M,90000,16,Excellent,,No",
    "23,Sales,25,F,,1,Low,Bachelor,Yes",
    "24,Finance,48,F,103000,20,Excellent,Master,No",
    "25,HR,33,F,51000,7,Medium,Bachelor,No",
    "26,Operations,54,M,91000,27,High,HighSchool,No",
    "27,,29,M,74000,,Medium,Bachelor,No",
    "28,Marketing,37,F,65000,10,,Master,No",
    "29,IT,,M,84000,13,High,Master,No",
    "30,Sales,28,F,50000,4,Low,,Yes",
    "31,Finance,43,M,,17,Excellent,Master,No",
    "32,HR,30,F,48000,5,Medium,Bachelor,No",
    "33,Operations,51,M,87000,24,High,Bachelor,No",
    "34,Marketing,32,F,62000,8,Medium,Bachelor,No",
    "35,,46,M,93000,19,High,Master,No",
    "36,IT,39,M,87000,,Excellent,PhD,No",
    "37,Sales,,F,54000,6,Medium,Bachelor,No",
    "38,Finance,47,F,100000,21,,Master,No",
    "39,HR,28,F,,3,Low,Bachelor,Yes",
    "40,Operations,56,M,92000,30,High,HighSchool,No",
    "41,Marketing,34,F,64000,9,Medium,Master,No",
    "42,IT,40,M,88000,14,High,,No",
    "43,,26,F,44000,,Low,Bachelor,Yes",
    "44,Sales,31,M,58000,7,,Bachelor,No",
    "45,Finance,,F,96000,19,Excellent,Master,No",
    "46,HR,33,F,52000,8,Medium,,No",
    "47,Operations,49,M,,23,High,Bachelor,No",
    "48,Marketing,36,F,66000,11,High,Master,No",
    "49,IT,43,M,91000,17,Excellent,PhD,No",
    "50,Sales,27,F,50000,,Medium,Bachelor,No",
  ];
  const file = new File([new Blob([rows.join("\n")], { type: "text/csv" })], "empleados_rrhh.csv", { type: "text/csv" });
  await _handleFile(file);
}
