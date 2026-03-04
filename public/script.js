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
let currentAngleMode = "RAD";

/* ============================= */
/* UI Helpers */
/* ============================= */

function setStatus(msg) {
  $("status").innerText = msg;
}

function renderFooter() {
  const footer = $("appFooter");
  if (!footer) return;

  footer.innerHTML = `<span class="text-cyber-gold">©</span> ${new Date().getFullYear()} Todos los derechos reservados • BUILT WITH PYTHON, FASTAPI, JAVASCRIPT & CHART.JS • Deployed on Vercel ®`;
}

function normalizeExpression(expr) {
  return expr.replaceAll("^", "**");
}

function setButtonLoading(buttonId, isLoading, loadingText) {
  const button = $(buttonId);
  if (!button) return;

  if (isLoading) {
    button.dataset.originalText = button.innerText;
    button.innerText = loadingText;
    button.disabled = true;
    return;
  }

  button.innerText = button.dataset.originalText || button.innerText;
  button.disabled = false;
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


function toggleScientificControls(isScientific) {
  const controls = $("scientific-angle-controls");
  if (!controls) return;
  controls.classList.toggle("hidden", !isScientific);
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
    toggleScientificControls(currentMode === "scientific");
    clearOutputs();
    setStatus("Listo.");

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
  const candidates = [url];

  if (url.startsWith("/api/")) {
    candidates.push(url.replace("/api/", "/api/vercel_app.py/"));
    candidates.push(url.replace("/api/", "/api/index.py/"));
  }

  let lastError = new Error("No se pudo conectar con la API.");

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function pingApiHealth() {
  const candidates = ["/api/health", "/api/vercel_app.py/health", "/api/index.py/health"];

  let lastError = new Error("No se pudo conectar con la API.");

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate);

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      if (data?.angle_mode === "RAD" || data?.angle_mode === "DEG") {
        currentAngleMode = data.angle_mode;
        if ($("angleMode")) {
          $("angleMode").value = currentAngleMode;
        }
      }

      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function setApiAngleMode(mode) {
  const normalized = String(mode || "").toUpperCase();
  if (normalized !== "RAD" && normalized !== "DEG") return;

  const candidates = [
    `/api/angle-mode?mode=${encodeURIComponent(normalized)}`,
    `/api/vercel_app.py/angle-mode?mode=${encodeURIComponent(normalized)}`,
    `/api/index.py/angle-mode?mode=${encodeURIComponent(normalized)}`
  ];

  let lastError = new Error("No se pudo actualizar el modo angular.");

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, { method: "POST" });
      const data = await res.json();

      if (!res.ok || data?.error) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      currentAngleMode = data.mode || normalized;
      if ($("angleMode")) {
        $("angleMode").value = currentAngleMode;
      }
      return currentAngleMode;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}


function toLocalMathExpression(expr) {
  return normalizeExpression(expr)
    .replace(/\bpi\b/gi, "Math.PI")
    .replace(/\btau\b/gi, "(2*Math.PI)")
    .replace(/\be\b/g, "Math.E")
    .replace(/\blog\s*\(/g, "Math.log10(")
    .replace(/\bln\s*\(/g, "Math.log(")
    .replace(/\bsqrt\s*\(/g, "Math.sqrt(")
    .replace(/\babs\s*\(/g, "Math.abs(")
    .replace(/\bfloor\s*\(/g, "Math.floor(")
    .replace(/\bceil\s*\(/g, "Math.ceil(")
    .replace(/\bround\s*\(/g, "Math.round(")
    .replace(/\bexp\s*\(/g, "Math.exp(")
    .replace(/\bsinh\s*\(/g, "Math.sinh(")
    .replace(/\bcosh\s*\(/g, "Math.cosh(")
    .replace(/\btanh\s*\(/g, "Math.tanh(")
    .replace(/\bsin\s*\(/g, "__sin(")
    .replace(/\bcos\s*\(/g, "__cos(")
    .replace(/\btan\s*\(/g, "__tan(")
    .replace(/\basin\s*\(/g, "__asin(")
    .replace(/\bacos\s*\(/g, "__acos(")
    .replace(/\batan\s*\(/g, "__atan(");
}

function evalLocalExpression(expr, x = undefined, angleMode = "RAD") {
  const safeExpr = toLocalMathExpression(expr);
  const useDeg = angleMode === "DEG";

  const __sin = useDeg ? (v) => Math.sin((v * Math.PI) / 180) : Math.sin;
  const __cos = useDeg ? (v) => Math.cos((v * Math.PI) / 180) : Math.cos;
  const __tan = useDeg ? (v) => Math.tan((v * Math.PI) / 180) : Math.tan;
  const __asin = useDeg ? (v) => (Math.asin(v) * 180) / Math.PI : Math.asin;
  const __acos = useDeg ? (v) => (Math.acos(v) * 180) / Math.PI : Math.acos;
  const __atan = useDeg ? (v) => (Math.atan(v) * 180) / Math.PI : Math.atan;

  const fn = new Function(
    "x",
    "__sin",
    "__cos",
    "__tan",
    "__asin",
    "__acos",
    "__atan",
    `return (${safeExpr});`
  );
  const value = fn(x, __sin, __cos, __tan, __asin, __acos, __atan);

  if (!Number.isFinite(value)) {
    throw new Error("Resultado no finito");
  }

  return value;
}

function localFallbackCalculate(mode, expr, angleMode = "RAD") {
  if (mode !== "standard" && mode !== "scientific") {
    throw new Error("Modo no soportado en fallback local");
  }

  const value = evalLocalExpression(expr, undefined, angleMode);
  return value.toFixed(5);
}

function localFallbackGraph(expressions, x_min, x_max, samples, angleMode = "RAD") {
  const step = (x_max - x_min) / (samples - 1);
  const xs = Array.from({ length: samples }, (_, i) => x_min + step * i);

  return expressions.map((expression) => {
    const ys = xs.map((x) => {
      try {
        const y = evalLocalExpression(expression, x, angleMode);
        return Number.isFinite(y) ? y : null;
      } catch {
        return null;
      }
    });

    return { expression, x: xs, y: ys };
  });
}

function localFallbackProgrammer(op, number, base, other) {
  if (!Number.isInteger(number)) throw new Error("Número inválido");

  if (op === "to_base") {
    if (base === 2) return number.toString(2);
    if (base === 8) return number.toString(8);
    if (base === 10) return number.toString(10);
    if (base === 16) return number.toString(16);
  }

  if (op === "bit_and") return (number & other).toString();
  if (op === "bit_or") return (number | other).toString();
  if (op === "bit_xor") return (number ^ other).toString();
  if (op === "bit_not") return (~number).toString();
  if (op === "shl") return (number << other).toString();
  if (op === "shr") return (number >> other).toString();

  throw new Error("Operación no soportada en fallback local");
}

function localFallbackDate(dateOp, date1, date2, days) {
  const d1 = date1 ? new Date(date1 + "T00:00:00") : null;
  const d2 = date2 ? new Date(date2 + "T00:00:00") : null;

  if (dateOp === "diff") {
    if (!d1 || !d2) throw new Error("Faltan fechas");
    return String(Math.round((d2 - d1) / 86400000));
  }

  if ((dateOp === "add" || dateOp === "sub") && d1 && Number.isFinite(days)) {
    const delta = (dateOp === "add" ? 1 : -1) * Number(days);
    d1.setDate(d1.getDate() + delta);
    return d1.toISOString().slice(0, 10);
  }

  throw new Error("Operación de fecha inválida");
}

/* ============================= */
/* Standard / Scientific */
/* ============================= */

$("btn-calc")?.addEventListener("click", calculateExpression);
$("btn-clear")?.addEventListener("click", () => {
  $("expression").value = "";
  $("result").innerText = "";
  setStatus("Listo.");
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
  setButtonLoading("btn-calc", true, "Calculando...");

  try {
    if (currentMode === "scientific") {
      await setApiAngleMode($("angleMode")?.value || currentAngleMode);
    }

    const data = await postJSON("/api/calculate", {
      mode: currentMode,
      expression: normalizeExpression(expr),
    });

    if (data.error) {
      $("result").innerText = "❌ " + data.error;
      return setStatus("Error.");
    }

    $("result").innerText = "✅ " + data.result;
    setStatus("HECHO.");

  } catch {
    try {
      const fallback = localFallbackCalculate(
        currentMode,
        normalizeExpression(expr),
        currentMode === "scientific" ? ($("angleMode")?.value || currentAngleMode) : "RAD"
      );
      $("result").innerText = "✅ " + fallback;
      setStatus("HECHO.");
    } catch {
      $("result").innerText = "❌ No se pudo conectar con la API.";
      setStatus("Error de red.");
    }
  } finally {
    setButtonLoading("btn-calc", false);
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
  const graphResult = $("graphResult");

  graphResult.classList.add("hidden");
  graphResult.innerText = "";

  if (!rawInput) return setStatus("Escribí una función.");

  const expressions = rawInput
    .split(",")
    .map((expr) => normalizeExpression(expr.trim()))
    .filter(Boolean);

  const x_min = parseFloat($("xmin").value);
  const x_max = parseFloat($("xmax").value);
  const samples = parseInt($("samples").value, 10);

  if (!Number.isFinite(x_min) || !Number.isFinite(x_max) || !Number.isFinite(samples)) {
    return setStatus("Completá todos los parámetros de gráfica.");
  }

  if (x_max <= x_min) {
    return setStatus("x máx debe ser mayor que x mín.");
  }

  setStatus("Generando gráfico...");
  setButtonLoading("btn-plot", true, "Graficando...");

  try {

    const data = await postJSON("/api/graph", {
      expressions,
      x_min,
      x_max,
      samples
    });

    if (data.error) {
      graphResult.classList.remove("hidden");
      graphResult.innerText = "❌ " + data.error;
      return setStatus("Error.");
    }

    destroyChart();

    const ctx = $("chart").getContext("2d");

    const datasets = [];

    data.datasets.forEach((set) => {

      const points = set.x
        .map((xVal, i) => ({
          x: xVal,
          y: set.y[i]
        }))
        .filter((point) => point.y !== null && Number.isFinite(point.y));

      if (points.length === 0) {
        return;
      }

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

    if (!datasets.length) {
      graphResult.classList.remove("hidden");
      graphResult.innerText = "❌ No se pudieron graficar puntos válidos para esas funciones.";
      return setStatus("Error.");
    }

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
    try {
      const fallbackDatasets = localFallbackGraph(expressions, x_min, x_max, samples, currentAngleMode);

      destroyChart();
      const ctx = $("chart").getContext("2d");
      const datasets = fallbackDatasets
        .map((set) => ({
          label: set.expression,
          data: set.x
            .map((xVal, i) => ({ x: xVal, y: set.y[i] }))
            .filter((point) => point.y !== null && Number.isFinite(point.y)),
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.2,
          fill: false,
        }))
        .filter((dataset) => dataset.data.length > 0);

      if (!datasets.length) {
        throw new Error("No se pudieron graficar puntos válidos");
      }

      chart = new Chart(ctx, {
        type: "line",
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          parsing: false,
          scales: {
            x: { type: "linear", min: x_min, max: x_max },
            y: { type: "linear" },
          },
        },
      });

      setStatus("HECHO.");
    } catch {
      graphResult.classList.remove("hidden");
      graphResult.innerText = "❌ No se pudo conectar con la API.";
      setStatus("Error de red.");
    }
  } finally {
    setButtonLoading("btn-plot", false);
  }
});

$("btn-plot-clear")?.addEventListener("click", () => {
  $("graphExpression").value = "";
  $("graphResult").innerText = "";
  $("graphResult").classList.add("hidden");
  destroyChart();
  setStatus("Listo.");
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

  } catch (error) {
    try {
      const value = localFallbackProgrammer("to_base", number, base, null);
      $("pResult").innerText = "✅ " + value;
      setStatus("HECHO.");
    } catch {
      $("pResult").innerText = `❌ ${error.message || "No se pudo conectar con la API."}`;
      setStatus("Error de red.");
    }
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

  } catch (error) {
    try {
      const value = localFallbackProgrammer(op, number, null, other);
      $("pResult").innerText = "✅ " + value;
      setStatus("HECHO.");
    } catch {
      $("pResult").innerText = `❌ ${error.message || "No se pudo conectar con la API."}`;
      setStatus("Error de red.");
    }
  }
});

$("btn-prog-clear")?.addEventListener("click", () => {
  $("pResult").innerText = "";
  setStatus("Listo.");
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

  } catch (error) {
    try {
      const value = localFallbackDate(date_op, date1, date2, days);
      $("dResult").innerText = "✅ " + value;
      setStatus("HECHO.");
    } catch {
      $("dResult").innerText = `❌ ${error.message || "No se pudo conectar con la API."}`;
      setStatus("Error de red.");
    }
  }
});

$("btn-date-clear")?.addEventListener("click", () => {
  $("dResult").innerText = "";
  setStatus("Listo.");
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

$("graphExpression")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    $("btn-plot")?.click();
  }
});


$("angleMode")?.addEventListener("change", async () => {
  try {
    await setApiAngleMode($("angleMode").value);
    setStatus(`Modo angular: ${currentAngleMode}`);
  } catch (error) {
    setStatus("No se pudo actualizar DEG/RAD.");
  }
});

(async () => {
  toggleScientificControls(currentMode === "scientific");
  try {
    await pingApiHealth();
  } catch {
    setStatus("Error de red.");
  }
})();

renderFooter();
