
(async () => {
  await verificarSesion();
  const contenedor = document.getElementById("lista-ramos");
  try {
    const { ramos } = await api("ramos.php?accion=listar&destacados=1");
    pintarRamos(contenedor, ramos);
  } catch (error) {
    contenedor.innerHTML = `<p class="text-danger">${esc(error.message)}</p>`;
  }
})();
