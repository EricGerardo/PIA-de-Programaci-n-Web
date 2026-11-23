
const OPCIONES_ESTADO = Object.entries(ESTADOS_PEDIDO).map(([valor, e]) => ({ valor, texto: e.texto }));

(async () => {
  await verificarSesion();

  crearCrud({
    api: "pedidos.php",
    listar: "pedidos.php?accion=listar",
    clave: "pedidos",
    id: "id_pedido",
    nombre: "pedido",
    botonNuevo: document.getElementById("btn-nuevo"),
    columnas: [
      { campo: "id_pedido" },
      { campo: "cliente" },
      { campo: "ramos" },
      { campo: "direccion" },
      { campo: "fecha_pedido", formato: (v) => fecha(v) },
      { campo: "fecha_entrega", formato: (v) => fecha(v) },
      { campo: "estado", formato: (v) => badgeEstado(v) },
      { campo: "total", formato: (v) => dinero(v) },
    ],
    campos: [
      {
        campo: "id_direccion",
        etiqueta: "Cliente y dirección de entrega",
        tipo: "select",
        requerido: true,
        soloNuevo: true,
        opciones: async () =>
          (await api("direcciones.php?accion=listar")).direcciones.map((d) => ({
            valor: d.id_direccion,
            texto: `${d.usuario} — ${d.alias}: ${d.calle_numero}, ${d.colonia}`,
          })),
      },
      {
        campo: "id_ramo",
        etiqueta: "Ramo",
        tipo: "select",
        requerido: true,
        soloNuevo: true,
        opciones: async () =>
          (await api("ramos.php?accion=listar")).ramos
            .filter((r) => r.existencias > 0)
            .map((r) => ({ valor: r.id_ramo, texto: `${r.nombre} (${dinero(r.precio)}, quedan ${r.existencias})` })),
      },
      {
        campo: "cantidad",
        etiqueta: "Cantidad",
        tipo: "number",
        min: 1,
        paso: "1",
        requerido: true,
        soloNuevo: true,
        inicial: 1,
      },
      
      {
        campo: "estado",
        etiqueta: "Estado",
        tipo: "select",
        requerido: true,
        soloEditar: true,
        opciones: OPCIONES_ESTADO,
      },
      { campo: "fecha_entrega", etiqueta: "Fecha de entrega", tipo: "date" },
    ],
    
    antesDeGuardar: (datos, editando) => {
      if (editando) return datos;
      return {
        id_direccion: Number(datos.id_direccion),
        fecha_entrega: datos.fecha_entrega,
        items: [{ id_ramo: Number(datos.id_ramo), cantidad: Number(datos.cantidad) }],
      };
    },
  });
})();
