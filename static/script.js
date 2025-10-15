// === Selección de elementos ===
const cuerpoTabla = document.getElementById("cuerpo-tabla");
const btnCompra = document.getElementById("agregar-compra");
const btnVenta = document.getElementById("agregar-venta");

const totalInvertidoEl = document.getElementById("total-invertido");
const totalActualEl = document.getElementById("total-actual");
const totalGanadoEl = document.getElementById("total-ganado");

// === Calcular totales ===
function calcularTotales() {
  let totalInvertido = 0;
  let totalCantidad = 0;
  let totalGanado = 0;

  const filas = cuerpoTabla.querySelectorAll("tr");
  filas.forEach(fila => {
    const esVenta = fila.classList.contains("fila-venta");
    const inversionEl = fila.querySelector(".inversion");
    const cantidadEl = fila.querySelector(".cantidad");
    const precioEl = fila.querySelector(".precio");

    let cantidad = parseFloat(cantidadEl.value) || 0;
    let precio = parseFloat(precioEl.value) || 0;

    if (esVenta) {
      const inversion = cantidad * precio;
      inversionEl.value = inversion.toFixed(2);
      totalCantidad -= cantidad;
      totalGanado += inversion;
    } else {
      const inversion = parseFloat(inversionEl.value) || 0;
      cantidad = precio > 0 ? inversion / precio : 0;
      cantidadEl.value = cantidad.toFixed(4);
      totalCantidad += cantidad;
      totalInvertido += inversion;
    }
  });

  totalInvertidoEl.textContent = totalInvertido.toFixed(2);
  totalActualEl.textContent = totalCantidad.toFixed(4);
  totalGanadoEl.textContent = (totalGanado - totalInvertido).toFixed(2);

  guardarDatos();
}

// === Guardar en backend ===
function guardarDatos() {
  const filas = [];
  cuerpoTabla.querySelectorAll("tr").forEach(fila => {
    const esVenta = fila.classList.contains("fila-venta");
    filas.push({
      fecha: fila.querySelector("td:nth-child(1) input").value,
      inversion: fila.querySelector(".inversion").value,
      cantidad: fila.querySelector(".cantidad").value,
      precio: fila.querySelector(".precio").value,
      tipo: esVenta ? "venta" : "compra"
    });
  });

  fetch(`/guardar/${activo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filas)
  }).catch(err => console.error("Error al guardar:", err));
}

// === Cargar datos ===
function cargarDatos() {
  fetch(`/cargar/${activo}`)
    .then(res => res.json())
    .then(datos => {
      datos.forEach(dato => agregarFila(dato.tipo, dato));
    })
    .catch(err => console.error("Error al cargar:", err));
}

// === Agregar fila ===
function agregarFila(tipo, dato = null) {
  const fila = document.createElement("tr");
  if (tipo === "venta") fila.classList.add("fila-venta");

  const fecha = dato ? dato.fecha : new Date().toISOString().split("T")[0];
  const inversion = dato ? dato.inversion : 0;
  const cantidad = dato ? dato.cantidad : 0;
  const precio = dato ? dato.precio : 0;

  fila.innerHTML = `
    <td><input type="date" value="${fecha}"></td>
    <td><input type="number" step="any" value="${inversion}" class="inversion" ${tipo === "venta" ? "readonly" : ""}></td>
    <td><input type="number" step="any" value="${cantidad}" class="cantidad" ${tipo === "compra" ? "readonly" : ""}></td>
    <td><input type="number" step="any" value="${precio}" class="precio"></td>
    <td class="tipo" style="color:${tipo === "venta" ? "#cc0000" : "inherit"};">${tipo === "venta" ? "Venta" : "Compra"}</td>
    <td><button class="eliminar">❌</button></td>
  `;

  fila.querySelector(".eliminar").addEventListener("click", () => {
    fila.remove();
    calcularTotales();
  });

  cuerpoTabla.appendChild(fila);
  calcularTotales();
}

// === Eventos ===
btnCompra.addEventListener("click", () => agregarFila("compra"));
btnVenta.addEventListener("click", () => agregarFila("venta"));
cuerpoTabla.addEventListener("input", () => calcularTotales());

// === Iniciar ===
cargarDatos();
