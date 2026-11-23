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
  document.getElementById("rolNuevo").value = "cliente";
  mr.show();
});
document.getElementById("formRol").addEventListener("submit", function (e) {
  e.preventDefault();
  if (document.getElementById("rolNuevo").value === "empleado") {
    av.textContent = fila.children[1].textContent + " ahora es Empleado y aparece en la sección Empleados.";
    av.classList.remove("d-none");
    fila.remove();
  }
  mr.hide();
});
