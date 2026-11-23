
async function opcionesDeUsuarios() {
  const clientes = (await api("usuarios.php?accion=listar&rol=cliente")).usuarios;
  const empleados = (await api("usuarios.php?accion=listar&rol=empleado")).usuarios;
  return [...clientes, ...empleados].map((u) => ({ valor: u.id_usuario, texto: `${u.nombre} (${u.correo})` }));
}

(async () => {
  await verificarSesion();

  crearCrud({
    api: "direcciones.php",
    listar: "direcciones.php?accion=listar",
    clave: "direcciones",
    id: "id_direccion",
    nombre: "dirección",
    femenino: true,
    botonNuevo: document.getElementById("btn-nuevo"),
    columnas: [
      { campo: "id_direccion" },
      { campo: "usuario" },
      { campo: "alias" },
      { campo: "calle_numero" },
      { campo: "colonia" },
      { campo: "ciudad" },
      { campo: "codigo_postal" },
      { campo: "referencias" },
    ],
    campos: [
      { campo: "id_usuario", etiqueta: "Usuario", tipo: "select", requerido: true, opciones: opcionesDeUsuarios },
      { campo: "alias", etiqueta: "Alias (Casa, Trabajo…)", requerido: true, maximo: 50 },
      { campo: "calle_numero", etiqueta: "Calle y número", requerido: true, maximo: 120 },
      { campo: "colonia", etiqueta: "Colonia", requerido: true, maximo: 80 },
      { campo: "ciudad", etiqueta: "Ciudad", requerido: true, maximo: 80 },
      { campo: "codigo_postal", etiqueta: "Código postal", requerido: true, maximo: 5, patron: "[0-9]{5}" },
      { campo: "referencias", etiqueta: "Referencias", tipo: "textarea" },
    ],
  });
})();
