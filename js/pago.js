// =====================================================================
// Un ramo más | Pago y confirmación del pedido
// Al confirmar se crea el pedido en la base de datos (estado "pendiente").
// =====================================================================
const $ = (id) => document.getElementById(id);
const carrito = leerCarrito();

// Enlaces de la barra según el rol
function ajustarEnlaces() {
  $("rol-n").textContent = NOMBRE_ROL[usuario.rol];
  $("inicio").href = $("volver-inicio").href = HOME_POR_ROL[usuario.rol];
  $("cat").href = `catalogo-${SUFIJO_POR_ROL[usuario.rol]}.html`;
}

// Resumen del pedido (lado derecho)
function pintarResumen() {
  let total = 0;
  $("resumen").innerHTML = carrito
    .map((item) => {
      total += item.precio * item.cantidad;
      return `<li class="list-group-item d-flex justify-content-between px-0">
                ${esc(item.nombre)} × ${item.cantidad}<span>${dinero(item.precio * item.cantidad)}</span>
              </li>`;
    })
    .join("");
  $("total").textContent = dinero(total) + " MXN";
}

// Direcciones guardadas del usuario, como opciones de radio
async function cargarDirecciones(seleccionar) {
  const { direcciones } = await api("direcciones.php?accion=mias");
  if (!direcciones.length) {
    $("lista-dir").innerHTML = '<p class="text-muted small">Aún no tienes direcciones. Agrega una.</p>';
    bootstrap.Collapse.getOrCreateInstance($("nueva")).show();
    return;
  }
  $("lista-dir").innerHTML = direcciones
    .map((d, i) => {
      const marcada = seleccionar ? d.id_direccion === seleccionar : i === 0;
      const texto = `${d.alias} · ${d.calle_numero}, ${d.colonia}, ${d.ciudad}, ${d.codigo_postal}`;
      return `<div class="form-check mb-2">
                <input class="form-check-input" type="radio" name="dir" id="d${d.id_direccion}"
                       value="${d.id_direccion}" data-texto="${esc(texto)}" ${marcada ? "checked" : ""} required>
                <label class="form-check-label" for="d${d.id_direccion}">${esc(texto)}</label>
              </div>`;
    })
    .join("");
}

// Guardar una dirección nueva
$("guardar-dir").addEventListener("click", async () => {
  try {
    const { id } = await api("direcciones.php?accion=crear", {
      alias: "Otra",
      calle_numero: $("calle").value.trim(),
      colonia: $("colonia").value.trim(),
      ciudad: $("ciudad").value.trim(),
      codigo_postal: $("cp").value.trim(),
    });
    ["calle", "colonia", "ciudad", "cp"].forEach((campo) => ($(campo).value = ""));
    bootstrap.Collapse.getOrCreateInstance($("nueva")).hide();
    await cargarDirecciones(id);
    mostrarAviso("Dirección guardada.");
  } catch (error) {
    mostrarAviso(error.message, "danger");
  }
});

// Confirmar pedido
$("fpago").addEventListener("submit", async (e) => {
  e.preventDefault();
  const direccion = document.querySelector("input[name=dir]:checked");
  if (!direccion) {
    mostrarAviso("Selecciona o agrega una dirección de entrega.", "warning");
    return;
  }
  const boton = e.submitter;
  boton.disabled = true;
  try {
    const pedido = await api("pedidos.php?accion=crear", {
      id_direccion: Number(direccion.value),
      items: carrito.map((item) => ({ id_ramo: item.id, cantidad: item.cantidad })),
    });
    // Los datos de la tarjeta no se envían ni se guardan: el pago es simulado.
    sessionStorage.removeItem("carrito");
    $("num").textContent = "#" + pedido.id;
    $("dir-ok").textContent = direccion.dataset.texto;
    $("total-ok").textContent = dinero(pedido.total) + " MXN";
    $("pantalla-pago").classList.add("d-none");
    $("confirmacion").classList.remove("d-none");
    $("confirmacion").focus();
  } catch (error) {
    mostrarAviso(error.message, "danger");
    boton.disabled = false;
  }
});

(async () => {
  await verificarSesion();
  ajustarEnlaces();
  if (!carrito.length) {
    location.href = "carrito.html"; // no hay nada que pagar
    return;
  }
  pintarResumen();
  try {
    await cargarDirecciones();
  } catch (error) {
    mostrarAviso(error.message, "danger");
  }
})();
