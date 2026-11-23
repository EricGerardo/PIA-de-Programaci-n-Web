var r = "cliente",
  it = [{ n: "🌹 Rosas Clásicas", p: 450, c: 1 }];
try {
  r = sessionStorage.getItem("rol") || r;
  it = JSON.parse(sessionStorage.getItem("carrito")) || it;
} catch (e) {}
var N = { cliente: "Cliente", empleado: "Empleado", admin: "Admin" },
  $ = function (i) {
    return document.getElementById(i);
  };
$("rol-n").textContent = N[r];
$("inicio").href = $("volver-inicio").href = "home-" + r + ".html";
$("cat").href = "catalogo-" + r + ".html";
var t = 0;
it.forEach(function (x) {
  t += x.p * x.c;
  var l = document.createElement("li");
  l.className = "list-group-item d-flex justify-content-between px-0";
  l.textContent = x.n + " × " + x.c;
  var s = document.createElement("span");
  s.textContent = "$" + x.p * x.c;
  l.appendChild(s);
  $("resumen").appendChild(l);
});
$("total").textContent = "$" + t + " MXN";
$("guardar-dir").addEventListener("click", function () {
  var v = ["calle", "colonia", "ciudad", "cp"].map(function (i) {
    return $(i).value.trim();
  });
  if (
    v.some(function (x) {
      return !x;
    })
  ) {
    alert("Completa todos los campos de la dirección.");
    return;
  }
  var n = document.querySelectorAll("#lista-dir input").length,
    txt = "Nueva · " + v[0] + ", " + v[1] + ", " + v[2] + ", " + v[3],
    d = document.createElement("div");
  d.className = "form-check mb-2";
  d.innerHTML =
    '<input class="form-check-input" type="radio" name="dir" id="d' +
    n +
    '" required><label class="form-check-label" for="d' +
    n +
    '"></label>';
  d.querySelector("label").textContent = txt;
  d.querySelector("input").value = txt;
  d.querySelector("input").checked = true;
  $("lista-dir").appendChild(d);
  ["calle", "colonia", "ciudad", "cp"].forEach(function (i) {
    $(i).value = "";
  });
  bootstrap.Collapse.getOrCreateInstance($("nueva")).hide();
});
$("fpago").addEventListener("submit", function (e) {
  e.preventDefault();
  $("num").textContent = "#" + (1025 + Math.floor(Math.random() * 50));
  $("dir-ok").textContent = document.querySelector("input[name=dir]:checked").value;
  $("total-ok").textContent = "$" + t + " MXN";
  $("pantalla-pago").classList.add("d-none");
  $("confirmacion").classList.remove("d-none");
  $("confirmacion").focus();
  try {
    sessionStorage.removeItem("carrito");
  } catch (x) {}
});
