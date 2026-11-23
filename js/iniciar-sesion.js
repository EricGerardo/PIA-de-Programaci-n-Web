
const formulario = document.getElementById("f");
const mensajeError = document.getElementById("error");

formulario.addEventListener("submit", async (e) => {
  e.preventDefault();
  mensajeError.textContent = "";
  const boton = formulario.querySelector("button[type=submit]");
  boton.disabled = true;

  try {
    const { usuario } = await api("auth.php?accion=login", {
      correo: document.getElementById("correo").value.trim(),
      clave: document.getElementById("clave").value,
    });
    location.href = HOME_POR_ROL[usuario.rol];
  } catch (error) {
    mensajeError.textContent = error.message;
    boton.disabled = false;
  }
});
