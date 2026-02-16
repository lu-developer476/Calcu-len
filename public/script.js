const $ = (id) => document.getElementById(id);

const tabs = Array.from(document.querySelectorAll(".tab"));
const sidebar = document.querySelector(".sidebar");
const menuToggle = $("menuToggle");

const panels = {
  standard: $("panel-expression"),
  scientific: $("panel-expression"),
  graph: $("panel-graph"),
  programmer: $("panel-programmer"),
  date: $("panel-date"),
};

let currentMode = "standard";

/* ============================= */
/* UI Helpers */
/* ============================= */

function setStatus(msg) {
  $("status").innerText = msg;
}

function setTitle(mode) {
  const titles = {
    standard: "Estándar",
    scientific: "Científica",
    graph: "Gráfica",
    programmer: "Programadora",
    date: "Cálculo de fechas",
  };
  $("title").innerText = titles[mode] ?? mode;
}

function showPanel(mode) {
  Object.values(panels).forEach(p => p?.classList.add("hidden"));

  if (mode === "standard" || mode === "scientific") {
    $("panel-expression").classList.remove("hidden");
  } else {
    panels[mode]?.classList.remove("hidden");
  }
}

function clearOutputs() {
  $("result").innerText = "";
  $("pResult").innerText = "";
  $("dResult").innerText = "";
}

/* ============================= */
/* Sidebar Mobile Behavior */
/* ============================= */

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
}

// cerrar sidebar en mobile al hacer click fuera
document.addEventListener("click", (e) => {
  if (window.innerWidth < 1240 &&
      sidebar.classList.contains("open") &&
      !sidebar.contains(e.target) &&
      e.target !== menuToggle) {
    sidebar.classList.remove("open");
  }
});

/* ============================= */
/* Tab Navigation */
/* ============================= */

tabs.forEach(btn => {
  btn.addEventListener("click", () => {
    tabs.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    currentMode = btn.dataset.mode;
    setTitle(currentMode);
    showPanel(currentMode);
    clearOutputs();
    setStatus("© Todos los derechos reservados | Realizado por Lucas Leonel Montenegro Burgos");

    // cerrar sidebar en mobile después de seleccionar
    if (window.innerWidth < 1240) {
      sidebar.classList.remove("open");
    }
  });
});

/* ============================= */
/* API Helper */
/* ============================= */

async function postJSON(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("HTTP error");
  }

  return res.json();
}

/* ============================= */
/* Standard / Scientific */
/* ============================= */

$("btn-calc")?.addEventListener("click", calculateExpression);
$("btn-clear")?.addEventListener("click", () => {
  $("expression").value = "";
  $("result").innerText = "";
  setStatus("© Todos los derechos reservados | Realizado por Lucas Leonel Montenegro Burgos");
});

// Enter para calcular
$("expression")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    calculateExpression();
  }
});

async function calculateExpression() {
  const expr = $("expression").value.trim();
  if (!expr) return setStatus("Escribí una expresión.");

  setStatus("Realizando cálculo...");

  try {
    const data = await postJSON("/api/calculate", {
      mode: currentMode,
      expression: expr,
    });

    if (data.error) {
      $("result").innerText = "❌ " + data.error;
      return setStatus("Error.");
    }

    $("result").innerText = "✅ " + data.result;
    setStatus("HECHO.");

  } catch {
    $("result").innerText = "❌ No se pudo conectar con la API.";
    setStatus("Error de red.");
  }
}

/* ============================= */
/* Graph */
/* ============================= */

let chart = null;

function destroyChart() {
  if (chart) {
    chart.destroy();
    chart = null;
  }
}

$("btn-plot")?.addEventListener("click", async () => {

  const rawInput = $("graphExpression").value.trim();
  if (!rawInput) return setStatus("Escribí una función.");

  const expressions = rawInput.split(",").map(e => e.trim());

  const x_min = parseFloat($("xmin").value);
  const x_max = parseFloat($("xmax").value);
  const samples = parseInt($("samples").value, 10);

  setStatus("Generando gráfico...");

  try {

    const data = await postJSON("/api/graph", {
      expressions,
      x_min,
      x_max,
      samples
    });

    if (data.error) return setStatus("Error.");

    destroyChart();

    const ctx = $("chart").getContext("2d");

    const datasets = [];

    data.datasets.forEach((set, index) => {

      const points = set.x.map((xVal, i) => ({
        x: xVal,
        y: set.y[i]
      }));

      const isIntegral = set.expression.startsWith("int(");

      datasets.push({
        label: set.expression,
        data: points,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.2,
        fill: false
      });

      // Si es integral, sombrear área
      if (isIntegral) {

        const match = set.expression.match(/int\((.*?),(.*?),(.*?)\)/);

        if (match) {
          const exprBase = match[1].trim();
          const a = parseFloat(match[2]);
          const b = parseFloat(match[3]);

          const areaPoints = points.filter(p => p.x >= a && p.x <= b);

          datasets.push({
            label: `Área ∫ ${exprBase}`,
            data: areaPoints,
            borderWidth: 0,
            pointRadius: 0,
            fill: true,
            backgroundColor: "rgba(96,165,250,0.25)"
          });
        }
      }

    });

    chart = new Chart(ctx, {
      type: "line",
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        scales: {
          x: {
            type: "linear",
            min: x_min,
            max: x_max
          },
          y: {
            type: "linear"
          }
        }
      }
    });

    setStatus("HECHO.");

  } catch {
    setStatus("Error de red.");
  }
});

$("btn-plot-clear")?.addEventListener("click", () => {
  $("graphExpression").value = "";
  destroyChart();
  setStatus("© Todos los derechos reservados | Realizado por Lucas Leonel Montenegro Burgos");
});

/* ============================= */
/* Programmer */
/* ============================= */

$("btn-to-base")?.addEventListener("click", async () => {
  const number = parseInt($("pNumber").value, 10);
  const base = parseInt($("pBase").value, 10);

  setStatus("Convirtiendo...");

  try {
    const data = await postJSON("/api/calculate", {
      mode: "programmer",
      op: "to_base",
      number,
      base
    });

    $("pResult").innerText = data.error ? "❌ " + data.error : "✅ " + data.result;
    setStatus(data.error ? "Error." : "HECHO.");

  } catch {
    $("pResult").innerText = "❌ No se pudo conectar con la API.";
    setStatus("Error de red.");
  }
});

$("btn-bitwise")?.addEventListener("click", async () => {
  const number = parseInt($("pNumber").value, 10);
  const op = $("pOp").value;
  const other = parseInt($("pOther").value, 10);

  setStatus("Realizando cálculo...");

  const payload = { mode: "programmer", op, number };
  if (!Number.isNaN(other) && op !== "bit_not") payload.other = other;

  try {
    const data = await postJSON("/api/calculate", payload);

    $("pResult").innerText = data.error ? "❌ " + data.error : "✅ " + data.result;
    setStatus(data.error ? "Error." : "HECHO.");

  } catch {
    $("pResult").innerText = "❌ No se pudo conectar con la API.";
    setStatus("Error de red.");
  }
});

$("btn-prog-clear")?.addEventListener("click", () => {
  $("pResult").innerText = "";
  setStatus("© Todos los derechos reservados | Realizado por Lucas Leonel Montenegro Burgos");
});

/* ============================= */
/* Date */
/* ============================= */

function todayISO() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

$("d1").value = todayISO();
$("d2").value = todayISO();

$("btn-date")?.addEventListener("click", async () => {
  const date1 = $("d1").value;
  const date2 = $("d2").value;
  const days = parseInt($("days").value, 10);
  const date_op = $("dOp").value;

  setStatus("Realizando cálculo...");

  try {
    const data = await postJSON("/api/calculate", {
      mode: "date",
      date_op,
      date1,
      date2,
      days: Number.isNaN(days) ? null : days
    });

    $("dResult").innerText = data.error ? "❌ " + data.error : "✅ " + data.result;
    setStatus(data.error ? "Error." : "HECHO.");

  } catch {
    $("dResult").innerText = "❌ No se pudo conectar con la API.";
    setStatus("Error de red.");
  }
});

$("btn-date-clear")?.addEventListener("click", () => {
  $("dResult").innerText = "";
  setStatus("© Todos los derechos reservados | Realizado por Lucas Leonel Montenegro Burgos");
});

/* ============================= */
/* Tips aleatorios */
/* ============================= */

const tipsList = [
"Multiplicar por 10 → agregar un cero.",
"Multiplicar por 5 → multiplicar por 10 y dividir por 2.",
"Dividir por 0 no está definido.",
"Todo número multiplicado por 0 da 0.",
"Todo número elevado a 0 (≠0) da 1.",
"El cuadrado de un número negativo es positivo.",
"(a + b)² = a² + 2ab + b².",
"(a − b)² = a² − 2ab + b².",
"(a + b)(a − b) = a² − b².",
"1% de un número = dividir por 100.",
"10% de un número = mover la coma un lugar.",
"Para calcular 15%, sumá 10% + 5%.",
"Si ax = b → x = b/a.",
"Despejar es aislar la variable.",
"Una función lineal tiene forma f(x)=mx+b.",
"sin²(x)+cos²(x)=1.",
"√(a²)=|a|.",
"log(a·b)=log(a)+log(b).",
"log(a/b)=log(a)-log(b).",
"ln(e)=1.",
"Multiplicar por 9 → multiplicar por 10 y restar el número.",
"25% es la cuarta parte de un entero.",
"50% es la mitad de un entero.",
"75% son las 3/4 partes de un entero.",
"Siempre estimá antes de validar un resultado.",
"Siempre simplificá antes de operar."
];

const tipText = document.getElementById("tipText");
const newTipBtn = document.getElementById("newTipBtn");
const tipsToggle = document.getElementById("tipsToggle");
const tipsContent = document.getElementById("tipsContent");

function getRandomTip(){
  return tipsList[Math.floor(Math.random() * tipsList.length)];
}

function showNewTip(){
  tipText.innerText = getRandomTip();
}

if (tipsToggle) {
  tipsToggle.addEventListener("click", () => {
    tipsContent.classList.toggle("hidden");
    tipsToggle.innerText =
      tipsContent.classList.contains("hidden")
        ? "Tips rápidos ▶"
        : "Tips rápidos ▼";

    if (!tipsContent.classList.contains("hidden")) {
      showNewTip();
    }
  });
}

if (newTipBtn) {
  newTipBtn.addEventListener("click", showNewTip);
}
