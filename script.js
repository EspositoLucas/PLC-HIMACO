document.addEventListener("DOMContentLoaded", function () {
  const app = document.getElementById("app");
  const storageKey = 'plc_himaco_records';
  let currentlyEditingIndex = null; // Variable para rastrear qué registro se está editando

  // Estilos comunes (actualizados para coincidir con TSX)
  const styles = {
    cell: "p-2 border border-black bg-white text-black font-bold align-top",
    input: "border border-black p-1 w-24 font-bold text-center bg-gray-100 focus:bg-white",
    header: "p-2 bg-white text-black font-bold border border-black",
    section: "relative mb-8 bg-white p-4 rounded-lg border border-black",
    value: "p-2 border border-black bg-white text-black w-24 text-center font-bold",
    efValue: "p-2 border border-black bg-white text-black w-24 text-center font-bold",
    articleContainer: "mb-4 md:mb-0 md:absolute md:top-4 md:right-4 text-black font-bold flex items-center gap-2",
    button: "px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700",
    select: "border border-black p-1 font-bold"
  };

  function createEditableCell(section, rowId, colId, initialValue = "") {
    return `<input type="text" class="${styles.input}" data-section="${section}" data-row="${rowId}" data-col="${colId}" value="${initialValue || '____'}">`;
  }

  function createReadOnlyCell(value = "____") {
    return `<div class="${styles.efValue}">${value}</div>`;
  }

  function createArticleInput(initialValue = "") {
    return `<div class="${styles.articleContainer}">ARTÍCULO: <input type="text" id="article-input" class="${styles.input}" value="${initialValue}" /></div>`;
  }

  function createTable(sectionId, headers, rowsData, showEf = false) {
    return `
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-black">
          <thead><tr>${headers.map(h => `<th class="${styles.header}">${h}</th>`).join("")}</tr></thead>
          <tbody>
            ${rowsData.map(rowData => `
              <tr>
                <td class="${styles.cell}">${rowData.id}</td>
                ${rowData.values.map((val, i) => {
                  let headerText = headers[i + 1];
                  let colId = headerText.toLowerCase().replace(/\./g, '').replace(/ /g, '-');
                  const isReadOnlyCol = headerText.startsWith("Ef.") || headerText === "Efectivo";

                  if (isReadOnlyCol) {
                    return `<td class="${styles.value}" data-section="${sectionId}" data-row="${rowData.id}" data-col="${colId}">${val || '____'}</td>`;
                  } else {
                    return `<td class="border border-black text-center">${createEditableCell(sectionId, rowData.id, colId, val)}</td>`;
                  }
                }).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
        ${showEf ? `
        <div class="mt-4 flex flex-wrap gap-4">
          <div><span class="font-bold text-black">Pos. Ef:</span><div class="${styles.efValue}" data-section="${sectionId}" data-row="summary" data-col="pos-ef">____</div></div>
          <div><span class="font-bold text-black">Pres Ef:</span><div class="${styles.efValue}" data-section="${sectionId}" data-row="summary" data-col="pres-ef">____</div></div>
        </div>` : ''}
      </div>
    `;
  }

  function createTimePressSection() {
    const sectionId = "tiempos-prensa";
    return `
      <div class="${styles.section}">
        ${createArticleInput()}
        <h2 class="text-xl font-bold mb-4 text-black">Tiempos y Prensa</h2>
        
        <div class="mb-6">
          <h3 class="text-lg font-bold mb-2 text-black">Tiempos de Inyección</h3>
          ${createTable(
            `${sectionId}-inyeccion`,
            ["Inyeccion Molde", "Tiempo", "Ef. Tiempo", "Ret. Ing", "Ef. RetIng"],
            [...Array(8)].map((_, i) => ({ id: `Molde ${i + 1}`, values: ["____", "____", "____", "____"] }))
          )}
        </div>

        <div class="mb-6">
          <h3 class="text-lg font-bold mb-2 text-black">Prensa</h3>
          ${createTable(
            `${sectionId}-prensa-ops`,
            ["Operación", "Presion", "Veloc."],
            [
                { id: "Cerrar Prensa", values: ["____", "____"] },
                { id: "Abrir Prensa", values: ["____", "____"] }
            ]
          )}
          <div class="mt-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            ${["Pres. Acting", "Pres. Prensa", "Presion Ef. B1", "Presion Ef. B2"].map(item => {
              const colId = item.toLowerCase().replace(/\./g, '').replace(/ /g, '-');
              return `
                <div>
                  <span class="font-bold text-black">${item}:</span>
                  <div class="${styles.efValue}" data-section="${sectionId}" data-row="prensa-summary" data-col="${colId}">____</div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <div>
          <h3 class="text-lg font-bold mb-2 text-black">Configuración de Moldes</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            ${["Molde Inyeccion", "Molde Carga", "Molde Expulsor"].map(item => {
               const colId = item.toLowerCase().replace(/ /g, '-');
              return `
                <div>
                  <span class="font-bold text-black">${item}:</span>
                  ${createEditableCell(sectionId, 'config-moldes', colId, '____')}
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    `;
  }

  function getAllFormData() {
    const data = {
      article: document.getElementById('article-input')?.value || '',
      fields: {}
    };
    document.querySelectorAll(`input[data-section]`).forEach(input => {
      const section = input.dataset.section;
      const row = input.dataset.row;
      const col = input.dataset.col;
      if (!data.fields[section]) data.fields[section] = {};
      if (!data.fields[section][row]) data.fields[section][row] = {};
      data.fields[section][row][col] = input.value;
    });
    document.querySelectorAll(`div[data-section][data-row][data-col]`).forEach(div => {
        const section = div.dataset.section;
        const row = div.dataset.row;
        const col = div.dataset.col;
        if (!data.fields[section]) data.fields[section] = {};
        if (!data.fields[section][row]) data.fields[section][row] = {};
        data.fields[section][row][col] = div.textContent || '____';
    });
    document.querySelectorAll(`td[data-section][data-row][data-col]`).forEach(td => {
        const section = td.dataset.section;
        const row = td.dataset.row;
        const col = td.dataset.col;
        if (!data.fields[section]) data.fields[section] = {};
        if (!data.fields[section][row]) data.fields[section][row] = {};
        data.fields[section][row][col] = td.textContent || '____';
    });
    return data;
  }

  function setAllFormData(data) {
    if (!data || !data.fields) {
        console.error("Datos inválidos para cargar.");
        clearAllFormData();
        return;
    }
    const articleInput = document.getElementById('article-input');
    if(articleInput) articleInput.value = data.article || '';

    document.querySelectorAll(`input[data-section]`).forEach(input => input.value = '____');
    document.querySelectorAll(`div[data-section][data-row][data-col]`).forEach(div => div.textContent = '____');
    document.querySelectorAll(`td[data-section][data-row][data-col]`).forEach(td => td.textContent = '____');

    for (const section in data.fields) {
      for (const row in data.fields[section]) {
        for (const col in data.fields[section][row]) {
          const value = data.fields[section][row][col];
          const element = document.querySelector(`[data-section="${section}"][data-row="${row}"][data-col="${col}"]`);
          if (element) {
            if (element.tagName === 'INPUT') {
              element.value = value || '';
            } else if (element.tagName === 'DIV' || element.tagName === 'TD') {
              element.textContent = value || '____';
            }
          } else {
            console.warn(`Elemento no encontrado para ${section}-${row}-${col}`);
          }
        }
      }
    }
  }

  function clearAllFormData() {
    const articleInput = document.getElementById('article-input');
    if(articleInput) articleInput.value = '';
    document.querySelectorAll(`input[data-section]`).forEach(input => input.value = '____');
    document.querySelectorAll(`div[data-section][data-row][data-col]`).forEach(div => div.textContent = '____');
    document.querySelectorAll(`td[data-section][data-row][data-col]`).forEach(td => td.textContent = '____');

    const recordSelect = document.getElementById('record-select');
    if (recordSelect) recordSelect.value = "";
    currentlyEditingIndex = null;
  }

  function loadRecordsList(selectedIndexToRestore = null) {
    const records = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const select = document.getElementById('record-select');
    if (!select) return;

    const previouslySelectedValue = selectedIndexToRestore ?? select.value;

    select.innerHTML = '<option value="">--- NUEVA HOJA ---</option>';
    records.forEach((record, index) => {
      const recordName = record.name || `Registro ${index + 1} - ${record.article || 'Sin Artículo'}`;
      const option = document.createElement('option');
      option.value = index;
      option.textContent = recordName;
      select.appendChild(option);
    });

    if (previouslySelectedValue !== null && previouslySelectedValue !== "") {
        select.value = previouslySelectedValue;
    } else {
        select.value = "";
    }
     currentlyEditingIndex = select.value !== "" ? parseInt(select.value, 10) : null;
  }

  function saveCurrentRecord() {
     const currentData = getAllFormData();
     const records = JSON.parse(localStorage.getItem(storageKey) || '[]');
     const select = document.getElementById('record-select');
     const selectedIndex = select ? select.value : null;

     if (selectedIndex !== null && selectedIndex !== "") {
         const indexToUpdate = parseInt(selectedIndex, 10);
         if (indexToUpdate >= 0 && indexToUpdate < records.length) {
             const originalRecord = records[indexToUpdate];
             let newName = originalRecord.name;

             const currentArticle = currentData.article || 'Sin Artículo';
             const nameNeedsUpdate = !originalRecord.name || !originalRecord.name.startsWith(currentArticle);

             if (nameNeedsUpdate && originalRecord.article !== currentData.article) {
                 if (confirm(`El artículo ha cambiado a "${currentArticle}". ¿Quieres actualizar también el nombre de la hoja guardada?`)) {
                     const timestamp = new Date().toLocaleString();
                     newName = `${currentArticle} - ${timestamp}`;
                 }
             }
              else if (!newName) {
                  const timestamp = new Date().toLocaleString();
                  newName = `${currentArticle} - ${timestamp}`;
              }


             currentData.name = newName;
             records[indexToUpdate] = currentData;
             localStorage.setItem(storageKey, JSON.stringify(records));
             alert(`Hoja "${newName}" actualizada.`);
             loadRecordsList(indexToUpdate);
         } else {
             console.error("Índice seleccionado inválido para actualizar.");
             alert("Error: No se pudo encontrar la hoja seleccionada para actualizar.");
         }

     } else {
         const article = currentData.article || 'Sin Artículo';
         const timestamp = new Date().toLocaleString();
         const recordName = prompt("Ingrese un nombre para esta nueva hoja:", `${article} - ${timestamp}`);

         if (recordName) {
             currentData.name = recordName;
             records.push(currentData);
             localStorage.setItem(storageKey, JSON.stringify(records));
             alert(`Nueva hoja "${recordName}" guardada.`);
             const newIndex = records.length - 1;
             loadRecordsList(newIndex);
             setAllFormData(currentData);
         }
     }
  }

  function loadSelectedRecordForEditing() {
    const select = document.getElementById('record-select');
    const recordIndexStr = select?.value;

    if (recordIndexStr === "") {
      clearAllFormData();
      currentlyEditingIndex = null;
    } else {
      const recordIndex = parseInt(recordIndexStr, 10);
      const records = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const selectedRecord = records[recordIndex];

      if (selectedRecord) {
        setAllFormData(selectedRecord);
        currentlyEditingIndex = recordIndex;
      } else {
        alert("Error al cargar la hoja seleccionada.");
        clearAllFormData();
        currentlyEditingIndex = null;
      }
    }
  }

  function renderApp() {
      const controlPanel = `
        <div class="p-4 mb-4 bg-gray-200 rounded border border-black flex flex-wrap items-center gap-4">
          <label for="record-select" class="font-bold text-black">Hoja Activa:</label>
          <select id="record-select" class="${styles.select} flex-grow min-w-[200px]">
            <option value="">--- NUEVA HOJA ---</option>
          </select>
          <button id="save-button" class="${styles.button}">Guardar Cambios</button>
          <button id="new-button" class="${styles.button}">Limpiar (Nueva Hoja)</button>
           <button id="delete-button" class="${styles.button} bg-red-600 hover:bg-red-700">Borrar Hoja Sel.</button>
        </div>
      `;

    app.innerHTML = `
      <div class="p-4 bg-white text-black min-h-screen">
        <h1 class="text-2xl font-bold mb-4">PLC HIMACO - Interface de Control</h1>

        ${controlPanel}

        <!-- Inyección -->
        <div class="${styles.section}">
          ${createArticleInput()}
          <h2 class="text-xl font-bold mb-4 text-black">Parámetros de Inyección</h2>
          ${createTable(
            "inyeccion",
            ["Inyecc. Molde", "Posicio", "Presion", "Veloc."],
            [...Array(8)].map((_, i) => ({ id: `Molde ${i + 1}`, values: ["____", "____", "____"] })),
            true
          )}
        </div>

        <!-- Boquilla -->
        <div class="${styles.section}">
          ${createArticleInput()}
          <h2 class="text-xl font-bold mb-4 text-black">Parámetros de Boquilla</h2>
          ${createTable(
            "boquilla",
            ["Boquilla", "Posicio", "Presion", "Veloc."],
            [
              { id: "Avanza Lento", values: ["____", "____", "____"] },
              { id: "Retr. Lento", values: ["____", "____", "____"] },
              { id: "Boquilla Retroc.", values: ["____", "____", "____"] },
              { id: "E1 Boqu. Avanzada", values: ["____", "____", "____"] },
              { id: "E2 Boqu. Avanzada", values: ["____", "____", "____"] },
              { id: "E3 Boqu. Avanzada", values: ["____", "____", "____"] }
            ],
            true
          )}
        </div>

        <!-- Carga -->
        <div class="${styles.section}">
          ${createArticleInput()}
          <h2 class="text-xl font-bold mb-4 text-black">Parámetros de Carga</h2>
          ${createTable(
            "carga",
            ["Cargas", "Posicio", "Presion", "Veloc."],
            [...Array(8)].map((_, i) => ({ id: `Molde ${i + 1}`, values: ["____", "____", "____"] })),
            true
          )}
          <div class="mt-4 flex gap-4">
            <div><span class="font-bold text-black">RPM:</span>${createEditableCell('carga', 'summary', 'rpm', '____')}</div>
          </div>
        </div>

        <!-- Funciones Manuales -->
        <div class="${styles.section}">
          ${createArticleInput()}
          <h2 class="text-xl font-bold mb-4 text-black">Funciones Manuales</h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            ${["RPM", "Molde Inyecc.", "Molde Carga", "Molde Ext.", "Pres.P Acting",
              "R.Ing", "R.Boq", "R.Exp", "Pres Ef B1", "Pres Ef B2"].map(param => {
                const colId = param.toLowerCase().replace(/\./g, '').replace(/ /g, '-');
                return `
                    <div>
                        <span class="font-bold text-black">${param}:</span>
                        <div class="${styles.efValue}" data-section="manuales" data-row="valores" data-col="${colId}">____</div>
                    </div>
                    `;
              }).join("")}
          </div>
        </div>

        <!-- Calentamiento -->
        <div class="${styles.section}">
          ${createArticleInput()}
          <h2 class="text-xl font-bold mb-4 text-black">Calentamiento</h2>
          ${createTable(
            "calentamiento",
            ["Zona", "Progr.", "Efectivo"],
            [
              { id: "% Bico", values: ["____", "____"] },
              { id: "Calent. Z1", values: ["____", "____"] },
              { id: "Calent. Z2", values: ["____", "____"] },
              { id: "Calent. Z3", values: ["____", "____"] },
              { id: "Temp Aceit", values: ["____", "____"] },
              { id: "Refrig Aceit", values: ["____", "____"] },
              { id: "Refrig.C. Z1", values: ["____", "____"] }
            ]
          )}
          <div class="mt-4 flex flex-wrap gap-4">
            ${["Calent. Min", "Calent. Max"].map(item => {
               const colId = item.toLowerCase().replace(/ /g, '-');
              return `
                <div><span class="font-bold text-black">${item}:</span>${createEditableCell('calentamiento', 'summary', colId, '____')}</div>
              `
             }).join("")}
          </div>
        </div>

        ${createTimePressSection()}
      </div>
    `;

    document.getElementById('save-button')?.addEventListener('click', saveCurrentRecord);
    document.getElementById('record-select')?.addEventListener('change', loadSelectedRecordForEditing);
    document.getElementById('new-button')?.addEventListener('click', () => {
        clearAllFormData();
        alert("Formulario limpiado. Puede empezar a rellenar una nueva hoja y guardarla.");
    });
     document.getElementById('delete-button')?.addEventListener('click', () => {
        const select = document.getElementById('record-select');
        const recordIndexStr = select?.value;
        if (recordIndexStr === "" || recordIndexStr === null) {
            alert("Por favor, seleccione una hoja de la lista para borrar.");
            return;
        }
         const recordIndex = parseInt(recordIndexStr, 10);
         const records = JSON.parse(localStorage.getItem(storageKey) || '[]');
         const recordToDelete = records[recordIndex];

          if (recordToDelete && confirm(`¿Estás seguro de que quieres borrar la hoja "${recordToDelete.name || 'seleccionada'}" permanentemente?`)) {
             records.splice(recordIndex, 1);
             localStorage.setItem(storageKey, JSON.stringify(records));
             loadRecordsList();
             clearAllFormData();
             alert("Hoja borrada.");
         }
     });

    loadRecordsList();
    if (document.getElementById('record-select')?.value !== "") {
        loadSelectedRecordForEditing();
    } else {
        currentlyEditingIndex = null;
    }
  }

  renderApp();
});