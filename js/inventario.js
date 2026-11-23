
(async () => {
  await verificarSesion();
  const esAdmin = document.body.dataset.roles === "administrador";

  crearCrud({
    api: "ramos.php",
    listar: "ramos.php?accion=listar",
    clave: "ramos",
    id: "id_ramo",
    nombre: "ramo",
    descripcion: (r) => `«${r.nombre}»`,
    botonNuevo: document.getElementById("btn-nuevo"),
    columnas: [
      { campo: "id_ramo" },
      { campo: "nombre" },
      { campo: "descripcion" },
      { campo: "precio", formato: (v) => dinero(v) },
      { campo: "existencias" },
      { campo: "imagen" },
      {
        campo: "destacado",
        formato: (v, r) =>
          `<input class="form-check-input destacado" type="checkbox" aria-label="Destacado"
                  data-id="${r.id_ramo}" ${Number(v) ? "checked" : ""} ${esAdmin ? "" : "disabled"}>`,
      },
    ],
    campos: [
      { campo: "nombre", etiqueta: "Nombre", requerido: true, maximo: 100 },
      { campo: "descripcion", etiqueta: "Descripción", tipo: "textarea" },
      { campo: "precio", etiqueta: "Precio (MXN)", tipo: "number", min: 0, paso: "0.01", requerido: true },
      { campo: "existencias", etiqueta: "Existencias", tipo: "number", min: 0, paso: "1", requerido: true, inicial: 0 },
      { campo: "imagen", etiqueta: "Imagen (nombre del archivo)", maximo: 255 },
      { campo: "destacado", etiqueta: "Mostrar en ramos destacados del home", tipo: "checkbox" },
    ],
  });

  document.querySelector("#tabla tbody").addEventListener("change", async (e) => {
    if (!e.target.classList.contains("destacado")) return;
    try {
      await api("ramos.php?accion=destacado", { id: Number(e.target.dataset.id), destacado: e.target.checked });
      mostrarAviso(e.target.checked ? "El ramo ahora aparece en destacados." : "El ramo ya no aparece en destacados.");
    } catch (error) {
      e.target.checked = !e.target.checked;
      mostrarAviso(error.message, "danger");
    }
  });
})();
