
(async () => {
  await verificarSesion();
  try {
    const { totales, ultimos } = await api("resumen.php");

    document.querySelectorAll("[data-kpi]").forEach((tarjeta) => {
      tarjeta.textContent = Number(totales[tarjeta.dataset.kpi]).toLocaleString("es-MX");
    });

    document.querySelector("#contenido table tbody").innerHTML = ultimos.length
      ? ultimos
          .map((p) => `<tr><td>${p.id_pedido}</td><td>${esc(p.cliente)}</td><td>${badgeEstado(p.estado)}</td></tr>`)
          .join("")
      : '<tr><td colspan="3" class="text-muted">Aún no hay pedidos.</td></tr>';
  } catch (error) {
    mostrarAviso(error.message, "danger");
  }
})();
