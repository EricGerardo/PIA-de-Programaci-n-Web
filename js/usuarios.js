
(async () => {
  await verificarSesion();
  const tipo = document.body.dataset.tipo; 
  const esClientes = tipo === "cliente";
  const modalRol = document.getElementById("modalRol");

  const columnas = [
    { campo: "id_usuario" },
    { campo: "nombre" },
    { campo: "correo" },
    { campo: "telefono" },
    { campo: "fecha_registro", formato: (v) => fecha(v) },
  ];
  if (esClientes) columnas.push({ campo: "direcciones" }, { campo: "pedidos" });

  const tabla = crearCrud({
    api: "usuarios.php",
    listar: `usuarios.php?accion=listar&rol=${tipo}`,
    clave: "usuarios",
    id: "id_usuario",
    nombre: tipo,
    descripcion: (u) => `«${u.nombre}»`,
    botonNuevo: document.getElementById("btn-nuevo"),
    columnas,
    campos: [
      { campo: "nombre", etiqueta: "Nombre completo", requerido: true, maximo: 100 },
      { campo: "correo", etiqueta: "Correo electrónico", tipo: "email", requerido: true, maximo: 150 },
      { campo: "telefono", etiqueta: "Teléfono", tipo: "tel", maximo: 20 },
      {
        campo: "clave",
        etiqueta: "Contraseña (mínimo 6 caracteres)",
        tipo: "password",
        requerido: true,
        minimo: 6,
        soloNuevo: true,
      },
    ],

    antesDeGuardar: (datos, editando) => (editando ? datos : { ...datos, rol: tipo }),
    accionesExtra: modalRol ? [{ texto: "Cambiar rol", alHacerClic: abrirCambioDeRol }] : [],
  });

 
  if (!modalRol) return; 
  const ventanaRol = new bootstrap.Modal(modalRol);
  let usuarioElegido = null;

  function abrirCambioDeRol(fila) {
    usuarioElegido = fila;
    document.getElementById("rolNombre").textContent = fila.nombre;
    document.getElementById("rolNuevo").value = tipo;
    ventanaRol.show();
  }

  document.getElementById("formRol").addEventListener("submit", async (e) => {
    e.preventDefault();
    const rol = document.getElementById("rolNuevo").value;
    if (rol === tipo) {
      ventanaRol.hide();
      return;
    }
    try {
      await api("usuarios.php?accion=cambiar_rol", { id: usuarioElegido.id_usuario, rol });
      ventanaRol.hide();
      const destino = rol === "empleado" ? "Empleados" : "Clientes";
      mostrarAviso(`${usuarioElegido.nombre} ahora es ${NOMBRE_ROL[rol]} y aparece en la sección ${destino}.`);
      tabla.recargar();
    } catch (error) {
      mostrarAviso(error.message, "danger");
    }
  });
})();
