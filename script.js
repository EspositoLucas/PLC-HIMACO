document.addEventListener("DOMContentLoaded", function () {
  const app = document.getElementById("app");
  
  // Estilos comunes (actualizados para coincidir con TSX)
  const styles = {
    cell: "p-2 border border-black bg-white text-black font-bold",
    input: "border border-black p-1 w-24 font-bold",
    header: "p-2 bg-white text-black font-bold border border-black",
    section: "relative mb-8 bg-white p-4 rounded-lg border border-black",
    value: "p-2 border border-black bg-white text-black w-24 text-center font-bold",
    efValue: "p-2 border border-black bg-white text-black w-24 text-center font-bold",
    article: "absolute top-4 right-4 text-black font-bold flex items-center gap-2"
  };

  function createArticleInput() {
    return `<div class="${styles.article}">ARTÍCULO: <input type="text" class="${styles.input}" /></div>`;
  }

  function createTable(headers, rows, showEf = false) {
    return `
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border border-black">
          <thead><tr>${headers.map(h => `<th class="${styles.header}">${h}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows.map(row => `
              <tr>${row.map((cell, i) => `
                <td class="${i === 0 ? styles.cell : styles.value}">${cell}</td>
              `).join("")}</tr>
            `).join("")}
          </tbody>
        </table>
        ${showEf ? `
        <div class="mt-4 flex gap-4">
          <div><span class="font-bold text-black">Pos. Ef:</span><div class="${styles.efValue}">____</div></div>
          <div><span class="font-bold text-black">Pres Ef:</span><div class="${styles.efValue}">____</div></div>
        </div>` : ''}
      </div>
    `;
  }

  // Sección especial para Tiempos y Prensa
  function createTimePressSection() {
    return `
      <div class="${styles.section}">
        ${createArticleInput()}
        <h2 class="text-xl font-bold mb-4 text-black">Tiempos y Prensa</h2>
        
        <div class="mb-6">
          <h3 class="text-lg font-bold mb-2 text-black">Tiempos de Inyección</h3>
          ${createTable(
            ["Inyeccion Molde", "Tiempo", "Ef.", "Ret. Ing", "Ef."],
            [...Array(8)].map((_, i) => [`Molde ${i + 1}`, "____", "____", "____", "____"])
          )}
        </div>

        <div class="mb-6">
          <h3 class="text-lg font-bold mb-2 text-black">Prensa</h3>
          ${createTable(
            ["Operación", "Presion", "Veloc."],
            [["Cerrar Prensa", "____", "____"], ["Abrir Prensa", "____", "____"]]
          )}
          <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            ${["Pres. Acting", "Pres. Prensa", "Presion Ef. B1", "Presion Ef. B2"].map(item => `
              <div>
                <span class="font-bold text-black">${item}:</span>
                <div class="${styles.efValue}">____</div>
              </div>
            `).join("")}
          </div>
        </div>

        <div>
          <h3 class="text-lg font-bold mb-2 text-black">Configuración de Moldes</h3>
          <div class="grid grid-cols-3 gap-4">
            ${["Molde Inyeccion", "Molde Carga", "Molde Expulsor"].map(item => `
              <div>
                <span class="font-bold text-black">${item}:</span>
                <div class="${styles.efValue}">____</div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  app.innerHTML = `
    <div class="p-4 bg-white text-black min-h-screen">
      <h1 class="text-2xl font-bold mb-4">PLC HIMACO - Interface de Control</h1>

      <!-- Inyección -->
      <div class="${styles.section}">
        ${createArticleInput()}
        <h2 class="text-xl font-bold mb-4 text-black">Parámetros de Inyección</h2>
        ${createTable(
          ["Inyecc. Molde", "Posicio", "Presion", "Veloc."], 
          [...Array(8)].map((_, i) => [`Molde ${i + 1}`, "____", "____", "____"]),
          true
        )}
      </div>

      <!-- Boquilla -->
      <div class="${styles.section}">
        ${createArticleInput()}
        <h2 class="text-xl font-bold mb-4 text-black">Parámetros de Boquilla</h2>
        ${createTable(
          ["Boquilla", "Posicio", "Presion", "Veloc."],
          [
            ["Avanza Lento", "____", "____", "____"],
            ["Retr. Lento", "____", "____", "____"],
            ["Boquilla Retroc.", "____", "____", "____"],
            ["E1 Boqu. Avanzada", "____", "____", "____"],
            ["E2 Boqu. Avanzada", "____", "____", "____"],
            ["E3 Boqu. Avanzada", "____", "____", "____"]
          ],
          true
        )}
      </div>

      <!-- Carga -->
      <div class="${styles.section}">
        ${createArticleInput()}
        <h2 class="text-xl font-bold mb-4 text-black">Parámetros de Carga</h2>
        ${createTable(
          ["Cargas", "Posicio", "Presion", "Veloc."],
          [...Array(8)].map((_, i) => [`Molde ${i + 1}`, "____", "____", "____"]),
          true
        )}
        <div class="mt-4 flex gap-4">
          <div><span class="font-bold text-black">RPM:</span><div class="${styles.efValue}">____</div></div>
        </div>
      </div>

      <!-- Funciones Manuales -->
      <div class="${styles.section}">
        ${createArticleInput()}
        <h2 class="text-xl font-bold mb-4 text-black">Funciones Manuales</h2>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          ${["RPM", "Molde Inyecc.", "Molde Carga", "Molde Ext.", "Pres.P Acting", 
            "R.Ing", "R.Boq", "R.Exp", "Pres Ef B1", "Pres Ef B2"].map(param => `
            <div>
              <span class="font-bold text-black">${param}:</span>
              <div class="${styles.efValue}">____</div>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Calentamiento -->
      <div class="${styles.section}">
        ${createArticleInput()}
        <h2 class="text-xl font-bold mb-4 text-black">Calentamiento</h2>
        ${createTable(
          ["Zona", "Progr.", "Efectivo"],
          [
            ["% Bico", "____", "____"],
            ["Calent. Z1", "____", "____"],
            ["Calent. Z2", "____", "____"],
            ["Calent. Z3", "____", "____"],
            ["Temp Aceit", "____", "____"],
            ["Refrig Aceit", "____", "____"],
            ["Refrig.C. Z1", "____", "____"]
          ]
        )}
        <div class="mt-4 flex gap-4">
          ${["Calent. Min", "Calent. Max"].map(item => `
            <div><span class="font-bold text-black">${item}:</span><div class="${styles.efValue}">____</div></div>
          `).join("")}
        </div>
      </div>

      ${createTimePressSection()}
    </div>
  `;
});