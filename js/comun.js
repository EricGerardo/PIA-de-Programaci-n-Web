
const HOME_POR_ROL = {
  cliente: "home-cliente.html",
  empleado: "home-empleado.html",
  administrador: "home-admin.html",
};

const SUFIJO_POR_ROL = { cliente: "cliente", empleado: "empleado", administrador: "admin" };
const NOMBRE_ROL = { cliente: "Cliente", empleado: "Empleado", administrador: "Admin" };


let usuario = null;


async function api(ruta, datos) {
  const opciones = { credentials: "same-origin" };
  if (datos !== undefined) {
    opciones.method = "POST";
    opciones.headers = { "Content-Type": "application/json" };
    opciones.body = JSON.stringify(datos);
  }

  let respuesta;
  try {
    respuesta = await fetch("api/" + ruta, opciones);
  } catch (e) {
    throw new Error("No hay conexión con el servidor. ¿Está encendido Apache en XAMPP?");
  }

  let resultado = {};
  try {
    resultado = await respuesta.json();
  } catch (e) {
    throw new Error("El servidor respondió algo inesperado. Abre la página desde http://localhost/...");
  }

  if (respuesta.status === 401 && !ruta.startsWith("auth.php")) {
   
    location.href = "iniciar-sesion.html";
  }
  if (!respuesta.ok) {
    throw new Error(resultado.error || "Ocurrió un error.");
  }
  return resultado;
}


async function verificarSesion() {
  const roles = document.body.dataset.roles;
  if (!roles) return null; 

  try {
    usuario = (await api("auth.php?accion=sesion")).usuario;
  } catch (e) {
    location.href = "iniciar-sesion.html";
    return new Promise(() => {}); 
  }

  if (!roles.split(",").includes(usuario.rol)) {
    location.href = HOME_POR_ROL[usuario.rol];
    return new Promise(() => {});
  }

  mostrarDatosDeCuenta();
  return usuario;
}


function mostrarDatosDeCuenta() {
  const datos = document.querySelectorAll("#cuenta dd");
  if (datos.length >= 3) {
    datos[0].textContent = usuario.nombre;
    datos[1].textContent = usuario.correo;
    datos[2].textContent = NOMBRE_ROL[usuario.rol];
  }
}


document.addEventListener("click", async (e) => {
  const enlace = e.target.closest('a[href="index.html"]');
  if (!enlace || !["Cerrar sesión", "Salir"].includes(enlace.textContent.trim())) return;
  e.preventDefault();
  try {
    await api("auth.php?accion=logout", {});
  } catch (error) {

  }
  sessionStorage.removeItem("carrito");
  location.href = "index.html";
});


function esc(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


function dinero(valor) {
  const n = Number(valor);
  return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
}


function fecha(valor) {
  if (!valor) return "—";
  const [a, m, d] = String(valor).slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}


function emojiRamo(nombre) {
  const n = String(nombre).toLowerCase();
  if (n.includes("tulip")) return "🌷";
  if (n.includes("girasol")) return "🌻";
  if (n.includes("cerezo")) return "🌸";
  if (n.includes("hibisco")) return "🌺";
  if (n.includes("margarita")) return "🌼";
  if (n.includes("rosa")) return "🌹";
  return "💐";
}


const ESTADOS_PEDIDO = {
  pendiente: { texto: "Pendiente", color: "warning" },
  en_preparacion: { texto: "En preparación", color: "info" },
  en_camino: { texto: "En camino", color: "primary" },
  entregado: { texto: "Entregado", color: "success" },
};
function badgeEstado(estado) {
  const e = ESTADOS_PEDIDO[estado] || { texto: estado, color: "secondary" };
  return `<span class="badge text-bg-${e.color}">${esc(e.texto)}</span>`;
}


function mostrarAviso(mensaje, tipo = "success") {
  let zona = document.getElementById("zona-avisos");
  if (!zona) {
    zona = document.createElement("div");
    zona.id = "zona-avisos";
    zona.className = "position-fixed bottom-0 end-0 p-3";
    zona.style.zIndex = 1080;
    document.body.appendChild(zona);
  }
  const aviso = document.createElement("div");
  aviso.className = `alert alert-${tipo} shadow-sm mb-2`;
  aviso.setAttribute("role", tipo === "danger" ? "alert" : "status");
  aviso.textContent = mensaje;
  zona.appendChild(aviso);
  setTimeout(() => aviso.remove(), 4000);
}


function activarBuscador() {
  const buscar = document.getElementById("buscar");
  if (!buscar) return;
  buscar.addEventListener("input", () => {
    const texto = buscar.value.toLowerCase();
    document.querySelectorAll("#tabla tbody tr").forEach((fila) => {
      fila.hidden = !fila.textContent.toLowerCase().includes(texto);
    });
  });
}

function leerCarrito() {
  try {
    return JSON.parse(sessionStorage.getItem("carrito")) || [];
  } catch (e) {
    return [];
  }
}

function guardarCarrito(carrito) {
  sessionStorage.setItem("carrito", JSON.stringify(carrito));
}

function agregarAlCarrito(ramo) {
  const carrito = leerCarrito();
  const existente = carrito.find((item) => item.id === ramo.id_ramo);
  const cantidadActual = existente ? existente.cantidad : 0;
  if (cantidadActual + 1 > ramo.existencias) {
    mostrarAviso(`Ya tienes en el carrito todas las existencias de ${ramo.nombre}.`, "warning");
    return;
  }
  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({
      id: ramo.id_ramo,
      nombre: ramo.nombre,
      precio: Number(ramo.precio),
      existencias: ramo.existencias,
      cantidad: 1,
    });
  }
  guardarCarrito(carrito);
  mostrarAviso(`${ramo.nombre} se agregó al carrito.`);
}

function pintarRamos(contenedor, ramos) {
  if (!ramos.length) {
    contenedor.innerHTML = '<p class="text-muted">No hay ramos para mostrar.</p>';
    return;
  }
  contenedor.innerHTML = ramos
    .map((r) => {
      const agotado = r.existencias < 1;
      return `
        <div class="col">
          <article class="card h-100">
            <div class="ramo-img" role="img" aria-label="Ramo ${esc(r.nombre)}">${emojiRamo(r.nombre)}</div>
            <div class="card-body">
              <h3 class="h5 card-title">${esc(r.nombre)}</h3>
              ${r.descripcion ? `<p class="small mb-1">${esc(r.descripcion)}</p>` : ""}
              <p class="precio mb-1">${dinero(r.precio)} MXN</p>
              <p class="small text-muted mb-2">${agotado ? "Agotado" : "Existencias: " + r.existencias}</p>
              <button class="btn btn-rosa btn-sm" type="button" data-id="${r.id_ramo}" ${agotado ? "disabled" : ""}>
                ${agotado ? "Agotado" : "Agregar al carrito"}
              </button>
            </div>
          </article>
        </div>`;
    })
    .join("");

  contenedor.querySelectorAll("button[data-id]").forEach((boton) => {
    boton.addEventListener("click", () => {
      agregarAlCarrito(ramos.find((r) => r.id_ramo === Number(boton.dataset.id)));
    });
  });
}
