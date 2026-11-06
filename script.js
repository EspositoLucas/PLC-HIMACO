document.addEventListener("DOMContentLoaded", function () {
  const app = document.getElementById("app");
  const storageKey = 'plc_himaco_records';
  const backupMarker = 'PLC_HIMACO_BACKUP_V1';
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
    return `<div class="${styles.articleContainer}">ARTÍCULO: <input type="text" class="article-input ${styles.input}" value="${initialValue}" /></div>`;
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
                  return `<td class="border border-black text-center">${createEditableCell(sectionId, rowData.id, colId, val)}</td>`;
                }).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
        ${showEf ? `
        <div class="mt-4 flex flex-wrap gap-4">
          <div><span class="font-bold text-black">Pos. Ef:</span>${createEditableCell(sectionId, 'summary', 'pos-ef', '____')}</div>
          <div><span class="font-bold text-black">Pres Ef:</span>${createEditableCell(sectionId, 'summary', 'pres-ef', '____')}</div>
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
                  ${createEditableCell(sectionId, 'prensa-summary', colId, '____')}
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
      article: document.querySelector('.article-input')?.value || '',
      fields: {}
    };
    document.querySelectorAll(`input[data-section][data-row][data-col]`).forEach(input => {
      const section = input.dataset.section;
      const row = input.dataset.row;
      const col = input.dataset.col;
      if (!data.fields[section]) data.fields[section] = {};
      if (!data.fields[section][row]) data.fields[section][row] = {};
      data.fields[section][row][col] = input.value;
    });
    return data;
  }

  function setAllFormData(data) {
    if (!data || !data.fields) {
        console.error("Datos inválidos para cargar.");
        clearAllFormData();
        return;
    }
    document.querySelectorAll('.article-input').forEach(input => input.value = data.article || '');

    document.querySelectorAll(`input[data-section][data-row][data-col]`).forEach(input => input.value = '____');

    for (const section in data.fields) {
      for (const row in data.fields[section]) {
        for (const col in data.fields[section][row]) {
          const value = data.fields[section][row][col];
          const element = document.querySelector(`input[data-section="${section}"][data-row="${row}"][data-col="${col}"]`);
          if (element) {
            element.value = value || '';
          } else {
            console.warn(`Input no encontrado para ${section}-${row}-${col}`);
          }
        }
      }
    }
  }

  function clearAllFormData() {
    document.querySelectorAll('.article-input').forEach(input => input.value = '');
    document.querySelectorAll(`input[data-section][data-row][data-col]`).forEach(input => input.value = '____');

    const recordSelect = document.getElementById('record-select');
    if (recordSelect) recordSelect.value = "";
    const recordSearch = document.getElementById('record-search');
    if (recordSearch) recordSearch.value = "";
    const suggestions = document.getElementById('record-suggestions');
    if (suggestions) suggestions.hidden = true;
    currentlyEditingIndex = null;
  }

  function loadRecordsList(selectedIndexToRestore = null) {
    const records = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const select = document.getElementById('record-select');
    if (!select) return;

    const previouslySelectedValue = selectedIndexToRestore ?? currentlyEditingIndex ?? select.value;

    select.innerHTML = '<option value="">--- NUEVA HOJA ---</option>';
    records.forEach((record, index) => {
      const recordName = record.name || `Registro ${index + 1} - ${record.article || 'Sin Artículo'}`;
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${record.article || 'Sin Artículo'} — ${recordName}`;
      select.appendChild(option);
    });

    if (previouslySelectedValue !== null && previouslySelectedValue !== "") {
        select.value = previouslySelectedValue;
    } else {
        select.value = "";
    }
    if (selectedIndexToRestore !== null) {
      currentlyEditingIndex = select.value !== ""
        ? parseInt(select.value, 10)
        : selectedIndexToRestore;
    }
  }

  function renderRecordSuggestions(query) {
    const suggestions = document.getElementById('record-suggestions');
    const search = document.getElementById('record-search');
    if (!suggestions || !search) return;

    suggestions.replaceChildren();
    const normalizedQuery = query.trim().toLocaleLowerCase('es');
    if (!normalizedQuery) {
      suggestions.hidden = true;
      search.setAttribute('aria-expanded', 'false');
      return;
    }

    const records = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const matchingRecords = records
      .map((record, index) => ({ record, index }))
      .filter(({ record }) => {
        const searchableText = `${record.article || ''} ${record.name || ''}`.toLocaleLowerCase('es');
        return searchableText.includes(normalizedQuery);
      });

    if (matchingRecords.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'px-3 py-2 text-gray-600';
      emptyMessage.textContent = 'No se encontraron artículos u hojas.';
      suggestions.appendChild(emptyMessage);
    } else {
      matchingRecords.forEach(({ record, index }) => {
        const option = document.createElement('button');
        const recordName = record.name || `Registro ${index + 1}`;
        option.type = 'button';
        option.className = 'block w-full px-3 py-2 text-left hover:bg-gray-200 focus:bg-gray-200';
        option.setAttribute('role', 'option');
        option.textContent = `${record.article || 'Sin Artículo'} — ${recordName}`;
        option.addEventListener('click', () => {
          const recordSelect = document.getElementById('record-select');
          if (!recordSelect) return;
          recordSelect.value = String(index);
          loadSelectedRecordForEditing();
        });
        suggestions.appendChild(option);
      });
    }

    suggestions.hidden = false;
    search.setAttribute('aria-expanded', 'true');
  }

  function getSavedRecords() {
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  }

  function encodeBase64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return btoa(binary);
  }

  function decodeBase64(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function toPdfText(value) {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, '?');
  }

  function escapePdfText(value) {
    return toPdfText(value).replace(/[\\()]/g, '\\$&');
  }

  function wrapPdfLine(value, maxLength = 92) {
    const text = toPdfText(value);
    const lines = [];
    for (let offset = 0; offset < text.length; offset += maxLength) {
      lines.push(text.slice(offset, offset + maxLength));
    }
    return lines.length ? lines : [''];
  }

  function createPdfBackup(records) {
    const lines = [
      'PLC HIMACO - RESPALDO DE HOJAS Y ARTICULOS',
      `Fecha de exportacion: ${new Date().toLocaleString()}`,
      `Cantidad de hojas: ${records.length}`,
      'Este PDF contiene un respaldo importable de todos los datos guardados.',
      ''
    ];

    records.forEach((record, index) => {
      lines.push(...wrapPdfLine(`HOJA ${index + 1}: ${record.name || 'Sin nombre'}`));
      lines.push(...wrapPdfLine(`Articulo: ${record.article || 'Sin Articulo'}`));
      for (const [section, rows] of Object.entries(record.fields || {})) {
        for (const [row, columns] of Object.entries(rows || {})) {
          for (const [column, value] of Object.entries(columns || {})) {
            lines.push(...wrapPdfLine(`${section} / ${row} / ${column}: ${value}`));
          }
        }
      }
      lines.push('');
    });

    const linesPerPage = 58;
    const pageLines = [];
    for (let i = 0; i < lines.length; i += linesPerPage) {
      pageLines.push(lines.slice(i, i + linesPerPage));
    }
    const payload = encodeBase64(JSON.stringify(records));
    const objects = [];
    const pageIds = pageLines.map((_, index) => 4 + index * 2);

    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
    objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

    pageLines.forEach((page, index) => {
      const pageId = pageIds[index];
      const contentId = pageId + 1;
      const commands = [
        'BT',
        '/F1 9 Tf',
        '50 800 Td',
        '12 TL',
        ...page.map(line => `(${escapePdfText(line)}) Tj T*`),
        'ET',
        ...(index === 0
          ? [`%${backupMarker}`, ...payload.match(/.{1,72}/g).map(chunk => `%${chunk}`), '%PLC_HIMACO_BACKUP_END']
          : [])
      ].join('\n');

      objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
      objects[contentId] = `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`;
    });

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (let id = 1; id < objects.length; id++) {
      offsets[id] = pdf.length;
      pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
    }
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let id = 1; id < objects.length; id++) {
      pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new Blob([pdf], { type: 'application/pdf' });
  }

  function exportRecordsToPdf() {
    let records;
    try {
      records = getSavedRecords();
    } catch (error) {
      console.error('No se pudieron leer las hojas guardadas.', error);
      alert('No se pudieron leer los datos guardados para exportarlos.');
      return;
    }

    if (records.length === 0) {
      alert('No hay hojas guardadas para exportar.');
      return;
    }

    const blob = createPdfBackup(records);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PLC-HIMACO-respaldo-${new Date().toISOString().slice(0, 10)}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    alert(`Se exportaron ${records.length} hojas a PDF.`);
  }

  function readRecordsFromPdf(file) {
    return file.text().then(text => {
      const matches = [...text.matchAll(/%PLC_HIMACO_BACKUP_V1\r?\n((?:%[A-Za-z0-9+/=]+\r?\n)+)%PLC_HIMACO_BACKUP_END/g)];
      if (matches.length !== 1) {
        throw new Error('El PDF no contiene un respaldo válido de PLC HIMACO.');
      }

      const encodedRecords = matches[0][1].replace(/%|\r?\n/g, '');
      const records = JSON.parse(decodeBase64(encodedRecords));
      if (!Array.isArray(records) || records.some(record =>
        !record || typeof record !== 'object' || Array.isArray(record) ||
        typeof record.fields !== 'object' || record.fields === null || Array.isArray(record.fields) ||
        (record.article !== undefined && typeof record.article !== 'string') ||
        (record.name !== undefined && typeof record.name !== 'string')
      )) {
        throw new Error('El respaldo del PDF tiene un formato de datos inválido.');
      }
      return records;
    });
  }

  function importRecordsFromPdf(file) {
    readRecordsFromPdf(file).then(records => {
      if (!confirm(`El PDF contiene ${records.length} hojas. La importación reemplazará todas las hojas guardadas actualmente. ¿Desea continuar?`)) {
        return;
      }

      try {
        localStorage.setItem(storageKey, JSON.stringify(records));
      } catch (error) {
        console.error('No se pudieron guardar las hojas importadas.', error);
        alert('No se pudieron restaurar los datos. Es posible que no haya espacio suficiente en el almacenamiento.');
        return;
      }

      currentlyEditingIndex = null;
      clearAllFormData();
      loadRecordsList();
      alert(`Se restauraron ${records.length} hojas correctamente.`);
    }).catch(error => {
      console.error('Error al importar el respaldo PDF.', error);
      alert(error instanceof SyntaxError
        ? 'No se pudo leer el respaldo. El archivo PDF puede estar dañado.'
        : error.message || 'No se pudo importar el archivo PDF.');
    });
  }

  function saveCurrentRecord() {
     const currentData = getAllFormData();
     const records = JSON.parse(localStorage.getItem(storageKey) || '[]');
     const selectedIndex = currentlyEditingIndex;

     if (selectedIndex !== null) {
         const indexToUpdate = selectedIndex;
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
             loadSelectedRecordForEditing();
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
             loadSelectedRecordForEditing();
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
        const search = document.getElementById('record-search');
        const recordName = selectedRecord.name || `Registro ${recordIndex + 1}`;
        if (search) search.value = `${selectedRecord.article || 'Sin Artículo'} — ${recordName}`;
        const suggestions = document.getElementById('record-suggestions');
        if (suggestions) suggestions.hidden = true;
        search?.setAttribute('aria-expanded', 'false');
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
          <div class="relative flex-grow min-w-[240px]">
            <label for="record-search" class="font-bold text-black">Buscar artículo u hoja:</label>
            <input id="record-search" type="search" class="${styles.select} w-full bg-white"
              placeholder="Escriba un artículo o nombre de hoja..." autocomplete="off"
              role="combobox" aria-autocomplete="list" aria-controls="record-suggestions"
              aria-haspopup="listbox" aria-expanded="false">
            <div id="record-suggestions" class="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-black rounded shadow-lg"
              role="listbox" hidden></div>
          </div>
          <label for="record-select" class="font-bold text-black">Hoja Activa:</label>
          <select id="record-select" class="${styles.select} flex-grow min-w-[200px]">
            <option value="">--- NUEVA HOJA ---</option>
          </select>
          <button id="save-button" class="${styles.button}">Guardar Cambios</button>
          <button id="export-button" class="${styles.button}">Exportar respaldo PDF</button>
          <button id="import-button" class="${styles.button}">Importar respaldo PDF</button>
          <input id="import-file" type="file" accept=".pdf,application/pdf" class="hidden">
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
                        ${createEditableCell('manuales', 'valores', colId, '____')}
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

    document.querySelectorAll('.article-input').forEach(input => {
      input.addEventListener('input', event => {
        document.querySelectorAll('.article-input').forEach(articleInput => {
          if (articleInput !== event.currentTarget) articleInput.value = event.currentTarget.value;
        });
      });
    });
    const recordSearch = document.getElementById('record-search');
    recordSearch?.addEventListener('input', () => renderRecordSuggestions(recordSearch.value));
    recordSearch?.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        const suggestions = document.getElementById('record-suggestions');
        if (suggestions) suggestions.hidden = true;
        recordSearch.setAttribute('aria-expanded', 'false');
      }
    });
    document.getElementById('save-button')?.addEventListener('click', saveCurrentRecord);
    document.getElementById('export-button')?.addEventListener('click', exportRecordsToPdf);
    const importFile = document.getElementById('import-file');
    document.getElementById('import-button')?.addEventListener('click', () => importFile?.click());
    importFile?.addEventListener('change', () => {
      const file = importFile.files?.[0];
      if (file) importRecordsFromPdf(file);
      importFile.value = '';
    });
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