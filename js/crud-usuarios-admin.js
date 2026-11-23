try {
  sessionStorage.setItem("rol", "admin");
} catch (e) {}

var q = document.getElementById("buscar");
q.addEventListener("input", function () {
  var v = q.value.toLowerCase();
  document.querySelectorAll("#tabla tbody tr").forEach(function (r) {
    r.hidden = r.textContent.toLowerCase().indexOf(v) < 0;
  });
});

var mr = new bootstrap.Modal(document.getElementById("modalRol")),
  fila = null,
  av = document.getElementById("aviso");
document.querySelector("#tabla tbody").addEventListener("click", function (e) {
  var b = e.target.closest(".btn-rol");
  if (!b) return;
  fila = b.closest("tr");
  document.getElementById("rolNombre").textContent = fila.children[1].textContent;
  document.getElementById("rolNuevo").value = "empleado";
  mr.show();
});
document.getElementById("formRol").addEventListener("submit", function (e) {
  e.preventDefault();
  if (document.getElementById("rolNuevo").value === "cliente") {
    av.textContent = fila.children[1].textContent + " ahora es Cliente y aparece en la sección Clientes.";
    av.classList.remove("d-none");
    fila.remove();
  }
  mr.hide();
});

var mn = new bootstrap.Modal(document.getElementById("modalNuevo"));
document.getElementById("formNuevo").addEventListener("submit", function (e) {
  e.preventDefault();
  var err = document.getElementById("nErr");
  if (document.getElementById("nPass").value !== document.getElementById("nPass2").value) {
    err.textContent = "Las contraseñas no coinciden.";
    return;
  }
  err.textContent = "";
  var tb = document.querySelector("#tabla tbody"),
    ids = [].map.call(tb.rows, function (r) {
      return +r.cells[0].textContent;
    }),
    d = new Date(),
    f =
      String(d.getDate()).padStart(2, "0") +
      "/" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "/" +
      d.getFullYear(),
    vals = [
      Math.max.apply(null, ids.concat(0)) + 1,
      document.getElementById("nNombre").value,
      document.getElementById("nCorreo").value,
      document.getElementById("nTel").value,
      f,
    ],
    tr = tb.insertRow();
  vals.forEach(function (v) {
    tr.insertCell().textContent = v;
  });
  var a = tr.insertCell();
  a.innerHTML =
    '<button class="btn btn-sm btn-outline-secondary" type="button">Editar</button> <button class="btn btn-sm btn-outline-secondary btn-rol" type="button">Cambiar rol</button>';
  av.textContent = "Empleado creado: " + vals[1] + ". Ya puede iniciar sesión con su correo y contraseña.";
  av.classList.remove("d-none");
  this.reset();
  mn.hide();
});
