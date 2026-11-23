
const contenedor = document.getElementById("lista-ramos");
const buscar = document.getElementById("buscar");
const orden = document.getElementById("orden");
let todosLosRamos = [];


function actualizarCatalogo() {
  const texto = buscar.value.trim().toLowerCase();
  const ramos = todosLosRamos.filter(
    (r) => r.nombre.toLowerCase().includes(texto) || (r.descripcion || "").toLowerCase().includes(texto),
  );
  if (orden.value === "Menor a mayor") ramos.sort((a, b) => a.precio - b.precio);
  if (orden.value === "Mayor a menor") ramos.sort((a, b) => b.precio - a.precio);
  pintarRamos(contenedor, ramos);
}

(async () => {
  await verificarSesion();
  try {
    todosLosRamos = (await api("ramos.php?accion=listar")).ramos;
    todosLosRamos.forEach((r) => (r.precio = Number(r.precio)));
    actualizarCatalogo();
  } catch (error) {
    contenedor.innerHTML = `<p class="text-danger">${esc(error.message)}</p>`;
  }
})();

buscar.addEventListener("input", actualizarCatalogo);
orden.addEventListener("change", actualizarCatalogo);
buscar.form.addEventListener("submit", (e) => e.preventDefault());
