// =====================================================================
// Un ramo más | Crear cuenta (siempre se crea con rol cliente)
// =====================================================================
const formulario = document.getElementById("f");
const mensajeError = document.getElementById("error");

formulario.addEventListener("submit", async (e) => {
  e.preventDefault();
  mensajeError.textContent = "";

  const clave = document.getElementById("clave").value;
  if (clave !== document.getElementById("clave2").value) {
    mensajeError.textContent = "Las contraseñas no coinciden.";
    return;
  }

  const boton = formulario.querySelector("button[type=submit]");
  boton.disabled = true;
  try {
    await api("auth.php?accion=registro", {
      nombre: document.getElementById("nombre").value.trim(),
      correo: document.getElementById("correo").value.trim(),
      telefono: document.getElementById("telefono").value.trim(),
      clave: clave,
    });
    // La cuenta queda con la sesión iniciada
    location.href = HOME_POR_ROL.cliente;
  } catch (error) {
    mensajeError.textContent = error.message;
    boton.disabled = false;
  }
});
