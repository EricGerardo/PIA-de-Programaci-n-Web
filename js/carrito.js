var r = "cliente";
try {
  r = sessionStorage.getItem("rol") || r;
} catch (e) {}
var N = { cliente: "Cliente", empleado: "Empleado", admin: "Admin" };
document.getElementById("rol-n").textContent = N[r];
document.getElementById("inicio").href = "home-" + r + ".html";
document.getElementById("cat").href = document.getElementById("seguir").href = "catalogo-" + r + ".html";
function calc() {
  var t = 0,
    rs = document.querySelectorAll("#items tr");
  rs.forEach(function (x) {
    var s = x.dataset.p * Math.max(1, x.querySelector(".cant").value);
    x.querySelector(".sub").textContent = "$" + s;
    t += s;
  });
  var it = [];
  rs.forEach(function (x) {
    it.push({ n: x.cells[0].textContent, p: +x.dataset.p, c: Math.max(1, +x.querySelector(".cant").value) });
  });
  try {
    sessionStorage.setItem("carrito", JSON.stringify(it));
  } catch (e) {}
  document.getElementById("pagar").classList.toggle("disabled", rs.length == 0);
  document.getElementById("total").textContent = "$" + t + " MXN";
  document.getElementById("vacio").classList.toggle("d-none", rs.length > 0);
}
document.getElementById("items").addEventListener("input", calc);
document.getElementById("items").addEventListener("click", function (e) {
  if (e.target.classList.contains("quitar")) {
    e.target.closest("tr").remove();
    calc();
  }
});
calc();
