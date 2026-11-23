// =====================================================================
// Un ramo más | Proveedores
// En "Ver" se muestran los ramos que ha suministrado cada proveedor
// (tabla intermedia Proveedor_Ramo).
// =====================================================================
(async () => {
  await verificarSesion();

  crearCrud({
    api: "proveedores.php",
    listar: "proveedores.php?accion=listar",
    clave: "proveedores",
    id: "id_proveedor",
    nombre: "proveedor",
    descripcion: (p) => `«${p.nombre}»`,
    botonNuevo: document.getElementById("btn-nuevo"),
    columnas: [
      { campo: "id_proveedor" },
      { campo: "nombre" },
      { campo: "suministra" },
      { campo: "telefono" },
      { campo: "correo" },
    ],
    campos: [
      { campo: "nombre", etiqueta: "Nombre", requerido: true, maximo: 100 },
      { campo: "suministra", etiqueta: "Suministra", requerido: true, maximo: 100 },
      { campo: "telefono", etiqueta: "Teléfono", tipo: "tel", maximo: 20 },
      { campo: "correo", etiqueta: "Correo", tipo: "email", maximo: 150 },
    ],
    detalle: (p) => {
      if (!p.suministros.length) return '<p class="text-muted mt-3 mb-0">Sin suministros registrados.</p>';
      const filas = p.suministros
        .map(
          (s) =>
            `<tr><td>${esc(s.ramo)}</td><td>${s.cantidad}</td><td>${dinero(s.costo)}</td><td>${fecha(s.fecha_suministro)}</td></tr>`,
        )
        .join("");
      return `<h3 class="h6 mt-3">Suministros</h3>
              <table class="table table-sm mb-0">
                <thead><tr><th>Ramo</th><th>Cantidad</th><th>Costo</th><th>Fecha</th></tr></thead>
                <tbody>${filas}</tbody>
              </table>`;
    },
  });
})();
