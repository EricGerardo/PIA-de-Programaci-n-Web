var s = document.getElementById("rol"),
  f = document.getElementById("f");
s.addEventListener("change", function () {
  f.action = s.value;
});
