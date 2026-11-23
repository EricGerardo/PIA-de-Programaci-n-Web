// =====================================================================
// Un ramo más | Carrito de compras
// Los ramos se guardan en el navegador (sessionStorage) hasta que el
// pedido se confirma en la pantalla de pago.
// =====================================================================
const tabla = document.getElementById("items");

// Enlaces de la barra según el rol (home y catálogo de cada rol)
function ajustarEnlaces() {
  const sufijo = SUFIJO_POR_ROL[usuario.rol];
  document.getElementById("rol-n").textContent = NOMBRE_ROL[usuario.rol];
  document.getElementById("inicio").href = HOME_POR_ROL[usuario.rol];
  document.getElementById("cat").href = document.getElementById("seguir").href = `catalogo-${sufijo}.html`;
}

// Dibuja la tabla y calcula el total.
function pintarCarrito() {
  const carrito = leerCarrito();
  let total = 0;
  tabla.innerHTML = carrito
    .map((item, i) => {
      const subtotal = item.precio * item.cantidad;
      total += subtotal;
      return `
        <tr>
          <td>${emojiRamo(item.nombre)} ${esc(item.nombre)}</td>
          <td>${dinero(item.precio)}</td>
          <td><input type="number" min="1" max="${item.existencias}" value="${item.cantidad}"
                class="form-control form-control-sm cant" data-i="${i}" aria-label="Cantidad" style="width:5rem"></td>
          <td>${dinero(subtotal)}</td>
          <td><button class="btn btn-sm btn-outline-danger quitar" type="button" data-i="${i}">Eliminar</button></td>
        </tr>`;
    })
    .join("");

  document.getElementById("total").textContent = dinero(total) + " MXN";
  document.getElementById("vacio").classList.toggle("d-none", carrito.length > 0);
  document.getElementById("pagar").classList.toggle("disabled", carrito.length === 0);
}

// Cambiar cantidad (entre 1 y las existencias del ramo)
tabla.addEventListener("change", (e) => {
  if (!e.target.classList.contains("cant")) return;
  const carrito = leerCarrito();
  const item = carrito[e.target.dataset.i];
  item.cantidad = Math.min(Math.max(1, parseInt(e.target.value) || 1), item.existencias);
  guardarCarrito(carrito);
  pintarCarrito();
});

// Quitar un ramo del carrito
tabla.addEventListener("click", (e) => {
  if (!e.target.classList.contains("quitar")) return;
  const carrito = leerCarrito();
  carrito.splice(e.target.dataset.i, 1);
  guardarCarrito(carrito);
  pintarCarrito();
});

(async () => {
  await verificarSesion();
  ajustarEnlaces();
  pintarCarrito();
})();
