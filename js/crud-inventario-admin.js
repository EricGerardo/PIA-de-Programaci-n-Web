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
