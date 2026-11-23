function crearCrud(config) {

  if (config.soloLectura === undefined) config.soloLectura = document.body.dataset.roles !== "administrador";
  const cuerpoTabla = document.querySelector("#tabla tbody");
  const encabezados = [...document.querySelectorAll("#tabla thead th")].map((th) => th.textContent.trim());
  let registros = [];
  const articulo = config.femenino ? "la" : "el"; 

  
  const ventana = document.createElement("div");
  ventana.className = "modal fade";
  ventana.tabIndex = -1;
  ventana.setAttribute("aria-labelledby", "crudTitulo");
  ventana.innerHTML = `
    <div class="modal-dialog modal-dialog-scrollable">
      <form class="modal-content" novalidate>
        <div class="modal-header">
          <h2 class="modal-title h5" id="crudTitulo"></h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body"></div>
        <div class="modal-footer">
          <p class="text-danger small me-auto mb-0" role="alert"></p>
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>
          <button type="submit" class="btn btn-rosa">Guardar</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(ventana);
  const modal = new bootstrap.Modal(ventana);
  const formulario = ventana.querySelector("form");
  const titulo = ventana.querySelector(".modal-title");
  const cuerpo = ventana.querySelector(".modal-body");
  const error = ventana.querySelector(".modal-footer p");
  const botonGuardar = ventana.querySelector("button[type=submit]");
  let registroEditando = null; // null = nuevo registro

 
  async function recargar() {
    try {
      const respuesta = await api(config.listar);
      registros = respuesta[config.clave];
      pintarTabla();
    } catch (e) {
      cuerpoTabla.innerHTML = `<tr><td colspan="${encabezados.length}" class="text-danger">${esc(e.message)}</td></tr>`;
    }
  }

  function pintarTabla() {
    if (!registros.length) {
      cuerpoTabla.innerHTML = `<tr><td colspan="${encabezados.length}" class="text-muted">No hay registros.</td></tr>`;
      return;
    }
    cuerpoTabla.innerHTML = registros
      .map((fila) => {
        const celdas = config.columnas.map((col) => `<td>${valorCelda(col, fila)}</td>`).join("");
        let botones = `<button class="btn btn-sm btn-outline-secondary" type="button" data-accion="ver">Ver</button>`;
        if (!config.soloLectura) {
          botones += ` <button class="btn btn-sm btn-outline-secondary" type="button" data-accion="editar">Editar</button>`;
          (config.accionesExtra || []).forEach((extra, i) => {
            botones += ` <button class="btn btn-sm btn-outline-secondary" type="button" data-extra="${i}">${esc(extra.texto)}</button>`;
          });
          if (config.eliminar !== false) {
            botones += ` <button class="btn btn-sm btn-outline-danger" type="button" data-accion="eliminar">Eliminar</button>`;
          }
        }
        return `<tr data-id="${fila[config.id]}">${celdas}<td class="text-nowrap">${botones}</td></tr>`;
      })
      .join("");
    
    document.getElementById("buscar")?.dispatchEvent(new Event("input"));
  }

 
  function valorCelda(columna, fila) {
    const valor = fila[columna.campo];
    if (columna.formato) return columna.formato(valor, fila);
    return valor === null || valor === "" ? "—" : esc(valor);
  }

  cuerpoTabla.addEventListener("click", (e) => {
    const boton = e.target.closest("button");
    if (!boton) return;
    const id = Number(boton.closest("tr").dataset.id);
    const fila = registros.find((r) => r[config.id] === id);
    if (boton.dataset.accion === "ver") ver(fila);
    if (boton.dataset.accion === "editar") abrirFormulario(fila);
    if (boton.dataset.accion === "eliminar") eliminar(fila);
    if (boton.dataset.extra) config.accionesExtra[boton.dataset.extra].alHacerClic(fila);
  });

  function ver(fila) {
    titulo.textContent = `Detalle de ${config.nombre} #${fila[config.id]}`;
    const datos = config.columnas
      .map((col, i) => `<dt class="col-5">${esc(encabezados[i])}</dt><dd class="col-7">${valorCelda(col, fila)}</dd>`)
      .join("");
    cuerpo.innerHTML = `<dl class="row mb-0">${datos}</dl>` + (config.detalle ? config.detalle(fila) : "");
    error.textContent = "";
    botonGuardar.hidden = true;
    modal.show();
  }

  async function abrirFormulario(fila) {
    registroEditando = fila || null;
    titulo.textContent = fila
      ? `Editar ${config.nombre} #${fila[config.id]}`
      : `${config.femenino ? "Nueva" : "Nuevo"} ${config.nombre}`;
    error.textContent = "";
    botonGuardar.hidden = false;
    botonGuardar.disabled = false;

    const campos = config.campos.filter((c) => (fila ? !c.soloNuevo : !c.soloEditar));
    let html = "";
    for (const campo of campos) {
      html += await htmlCampo(campo, fila ? fila[campo.campo] : campo.inicial);
    }
    cuerpo.innerHTML = html;
    modal.show();
  }

  async function htmlCampo(campo, valor) {
    const id = "campo-" + campo.campo;
    const requerido = campo.requerido ? "required" : "";
    valor = valor ?? "";

    if (campo.tipo === "checkbox") {
      return `<div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" id="${id}" name="${campo.campo}" ${Number(valor) ? "checked" : ""}>
                <label class="form-check-label" for="${id}">${esc(campo.etiqueta)}</label>
              </div>`;
    }

    let control;
    if (campo.tipo === "select") {
      const opciones = typeof campo.opciones === "function" ? await campo.opciones() : campo.opciones;
      control = `<select class="form-select" id="${id}" name="${campo.campo}" ${requerido}>
          <option value="">Selecciona…</option>
          ${opciones
            .map(
              (o) =>
                `<option value="${esc(o.valor)}" ${String(o.valor) === String(valor) ? "selected" : ""}>${esc(o.texto)}</option>`,
            )
            .join("")}
        </select>`;
    } else if (campo.tipo === "textarea") {
      control = `<textarea class="form-control" id="${id}" name="${campo.campo}" rows="2" ${requerido}>${esc(valor)}</textarea>`;
    } else {
      const extras = [
        campo.min !== undefined ? `min="${campo.min}"` : "",
        campo.paso ? `step="${campo.paso}"` : "",
        campo.maximo ? `maxlength="${campo.maximo}"` : "",
        campo.minimo ? `minlength="${campo.minimo}"` : "",
        campo.patron ? `pattern="${campo.patron}"` : "",
      ].join(" ");
      control = `<input class="form-control" type="${campo.tipo || "text"}" id="${id}" name="${campo.campo}"
                   value="${esc(valor)}" ${requerido} ${extras}>`;
    }
    return `<div class="mb-3"><label class="form-label" for="${id}">${esc(campo.etiqueta)}</label>${control}</div>`;
  }

  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (botonGuardar.hidden) return;
    if (!formulario.checkValidity()) {
      error.textContent = "Revisa los campos marcados.";
      formulario.classList.add("was-validated");
      return;
    }
    formulario.classList.remove("was-validated");

    const datos = {};
    formulario.querySelectorAll("[name]").forEach((control) => {
      datos[control.name] = control.type === "checkbox" ? control.checked : control.value.trim();
    });
    if (registroEditando) datos.id = registroEditando[config.id];
    const datosFinales = config.antesDeGuardar ? config.antesDeGuardar(datos, registroEditando) : datos;

    botonGuardar.disabled = true;
    try {
      const accion = registroEditando ? "editar" : "crear";
      await api(`${config.api}?accion=${accion}`, datosFinales);
      modal.hide();
      mostrarAviso(registroEditando ? "Cambios guardados." : `Se creó ${articulo} ${config.nombre}.`);
      await recargar();
    } catch (err) {
      error.textContent = err.message;
      botonGuardar.disabled = false;
    }
  });

  // ----- Eliminar -----
  async function eliminar(fila) {
    const descripcion = config.descripcion ? config.descripcion(fila) : `#${fila[config.id]}`;
    if (!confirm(`¿Eliminar ${config.nombre} ${descripcion}? Esta acción no se puede deshacer.`)) return;
    try {
      await api(`${config.api}?accion=eliminar`, { id: fila[config.id] });
      mostrarAviso(`Se eliminó ${articulo} ${config.nombre}.`);
      await recargar();
    } catch (err) {
      mostrarAviso(err.message, "danger");
    }
  }

  // ----- Arranque -----
  if (config.botonNuevo) {
    config.botonNuevo.hidden = Boolean(config.soloLectura);
    config.botonNuevo.addEventListener("click", () => abrirFormulario(null));
  }
  activarBuscador();
  recargar();

  return { recargar };
}
