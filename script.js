let numConsultas = 1;
let consultasFavoritas = JSON.parse(localStorage.getItem("consultasFavoritas")) || [];
let totalRendimientos = 0;
let montosInvertidos = {}; // Objeto para almacenar los montos invertidos de cada consulta

async function obtenerRendimiento(consultaId) {
  const fondo = document.getElementById(`fondo${consultaId}`).value;
  const clase = document.getElementById(`clase${consultaId}`).value;
  const nombreFondo = document.getElementById(`nombreFondo${consultaId}`).value;
  const montoInvertido = parseFloat(document.getElementById(`monto${consultaId}`).value);

  // Validación básica de entradas (puedes agregar más validaciones si es necesario)
  if (isNaN(fondo) || isNaN(clase) || isNaN(montoInvertido) || montoInvertido <= 0) {
    document.getElementById(`resultado${consultaId}`).textContent = "Por favor, ingrese valores válidos para fondo, clase y monto invertido.";
    return;
  }

  const url = `https://api.cafci.org.ar/fondo/${fondo}/clase/${clase}/ficha`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const rendimiento = data.data.info.diaria.rendimientos.day.rendimiento;
    const gananciaDiaria = (rendimiento / 100) * montoInvertido;
    totalRendimientos += gananciaDiaria;

    document.getElementById(`resultado${consultaId}`).textContent =
      `Fondo: ${nombreFondo}, Rendimiento diario: ${rendimiento.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%, Ganancia diaria: ${gananciaDiaria.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Actualizar monto invertido y guardarlo en favoritos si existe
    const consultaIndex = consultasFavoritas.findIndex(c =>
      c.fondo === fondo && c.clase === clase && c.nombreFondo === nombreFondo
    );
    if (consultaIndex !== -1) {
      consultasFavoritas[consultaIndex].monto += gananciaDiaria;
      localStorage.setItem("consultasFavoritas", JSON.stringify(consultasFavoritas));
      actualizarListaFavoritos();
      document.getElementById(`monto${consultaId}`).value = consultasFavoritas[consultaIndex].monto.toFixed(2);
    }

    // Actualizar el monto invertido en el objeto montosInvertidos
    montosInvertidos[consultaId] = montoInvertido;

    // Calcular y mostrar el total de rendimientos + monto invertido
    const totalRendimientosMasMonto = totalRendimientos + Object.values(montosInvertidos).reduce((sum, monto) => sum + monto, 0);

    document.getElementById('totalRendimientos').textContent = `Total de rendimientos: ${totalRendimientos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const totalMasMontoElement = document.getElementById('totalMasMonto');
    if (totalMasMontoElement) {
      totalMasMontoElement.textContent = `Total rendimientos + monto invertido: ${totalRendimientosMasMonto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      const newTotalMasMontoElement = document.createElement('p');
      newTotalMasMontoElement.id = 'totalMasMonto';
      newTotalMasMontoElement.textContent = `Total rendimientos + monto invertido: ${totalRendimientosMasMonto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      document.getElementById('totalRendimientos').parentNode.insertBefore(newTotalMasMontoElement, document.getElementById('totalRendimientos').nextSibling);
    }
  } catch (error) {
    document.getElementById(`resultado${consultaId}`).textContent = "Error al obtener datos";
    console.error(error);
  }
}

function agregarConsulta() {
    numConsultas++;
    const nuevaConsulta = `
        <div id="consulta${numConsultas}">
            <label for="nombreFondo${numConsultas}">Nombre del Fondo:</label>
            <input type="text" id="nombreFondo${numConsultas}" name="nombreFondo${numConsultas}"><br><br>

            <label for="fondo${numConsultas}">Numero de Fondo:</label>
            <input type="number" id="fondo${numConsultas}" name="fondo${numConsultas}"><br><br>

            <label for="clase${numConsultas}">Numero de Clase:</label>
            <input type="number" id="clase${numConsultas}" name="clase${numConsultas}"><br><br>

            <label for="monto${numConsultas}">Monto invertido:</label>
            <input type="number" id="monto${numConsultas}" name="monto${numConsultas}"><br><br>

            <button onclick="obtenerRendimiento(${numConsultas})">Obtener Rendimiento</button>
            <button onclick="guardarConsulta(${numConsultas})">Guardar como Favorita</button>
            <div id="resultado${numConsultas}"></div><br>
        </div>
    `;

    document.getElementById("consultasContainer").insertAdjacentHTML('beforeend', nuevaConsulta);
}

function guardarConsulta(consultaId) {
    const consulta = {
        nombreFondo: document.getElementById(`nombreFondo${consultaId}`).value,
        fondo: document.getElementById(`fondo${consultaId}`).value,
        clase: document.getElementById(`clase${consultaId}`).value,
        monto: document.getElementById(`monto${consultaId}`).value,
    };
    consultasFavoritas.push(consulta);
    localStorage.setItem("consultasFavoritas", JSON.stringify(consultasFavoritas));
    actualizarListaFavoritos();
    alert("Consulta guardada como favorita");
}

function cargarConsultasFavoritas() {
    document.getElementById("consultasContainer").innerHTML = "";
    numConsultas = 1;
    consultasFavoritas.forEach(consulta => {
        agregarConsulta();
        document.getElementById(`nombreFondo${numConsultas}`).value = consulta.nombreFondo;
        document.getElementById(`fondo${numConsultas}`).value = consulta.fondo;
        document.getElementById(`clase${numConsultas}`).value = consulta.clase;
        document.getElementById(`monto${numConsultas}`).value = consulta.monto;
    });
}

function borrarFavoritos() {
    if (confirm("¿Estás seguro de que quieres borrar todas las consultas favoritas?")) {
        consultasFavoritas = [];
        localStorage.removeItem("consultasFavoritas");
        document.getElementById("consultasContainer").innerHTML = "";
        numConsultas = 1;
        agregarConsulta();
        actualizarListaFavoritos();
        alert("Consultas favoritas borradas");
    }
}

function guardarResultados() {
    let resultados = "Resultados de las consultas:\n\n";

    for (let i = 1; i <= numConsultas; i++) {
        const resultadoDiv = document.getElementById(`resultado${i}`);
        if (resultadoDiv) {
            const resultadoText = resultadoDiv.textContent;
            if (resultadoText && !resultadoText.startsWith("Error")) {
                resultados += resultadoText + "\n\n";
            }
        }
    }

    resultados += `Total de rendimientos: ${totalRendimientos.toFixed(2)}`; 

    const blob = new Blob([resultados], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rendimientos.txt";
    a.click();
}

function actualizarListaFavoritos() {
  const favoritosList = document.getElementById("favoritosList");
  favoritosList.innerHTML = ""; // Limpiar la lista antes de actualizar

  consultasFavoritas.forEach((consulta, index) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${consulta.nombreFondo} - Fondo: ${consulta.fondo}, Clase: ${consulta.clase}, Monto: `;

    const montoInput = document.createElement("input");
    montoInput.type = "number";
    montoInput.value = consulta.monto;
    montoInput.style.width = "80px";
    listItem.appendChild(montoInput);

    const guardarButton = document.createElement("button");
    guardarButton.textContent = "Guardar";
    guardarButton.onclick = function() {
      consultasFavoritas[index].monto = parseFloat(montoInput.value);
      localStorage.setItem("consultasFavoritas", JSON.stringify(consultasFavoritas));
    };
    listItem.appendChild(guardarButton);

    // Botón para borrar la consulta favorita individualmente
    const borrarButton = document.createElement("button");
    borrarButton.textContent = "Borrar";
    borrarButton.onclick = function() {
      if (confirm(`¿Estás seguro de que quieres borrar la consulta favorita "${consulta.nombreFondo}"?`)) {
        consultasFavoritas.splice(index, 1); // Eliminar del array
        localStorage.setItem("consultasFavoritas", JSON.stringify(consultasFavoritas));
        actualizarListaFavoritos(); // Actualizar la lista en la interfaz
      }
    };
    listItem.appendChild(borrarButton);

    favoritosList.appendChild(listItem);
  });
}

function cargarConsulta(index) {
    const consulta = consultasFavoritas[index];
    document.getElementById(`nombreFondo1`).value = consulta.nombreFondo;
    document.getElementById(`fondo1`).value = consulta.fondo;
    document.getElementById(`clase1`).value = consulta.clase;
    document.getElementById(`monto1`).value = consulta.monto;
}

// Manejo del cambio de tema
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark-mode' : 'light-mode');
});

// Cargar la preferencia del tema al iniciar
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.classList.add(savedTheme);
}

window.onload = () => {  
  agregarConsulta();
  actualizarListaFavoritos(); 
};
