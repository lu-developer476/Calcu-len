from __future__ import annotations

import ast
import cmath
import logging
import math
import os
import re
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta
from threading import Lock
from typing import Any, Deque, Dict, List, Optional, Tuple, Union
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator, model_validator

APP_VERSION = "1.1.0"
START_TIME = time.monotonic()
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("calculen.api")

app = FastAPI(title="Calculadora Pro API", version=APP_VERSION)

RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
RATE_LIMIT_MAX_GRAPH_CALLS = int(os.getenv("RATE_LIMIT_MAX_GRAPH_CALLS", "30"))
_RATE_LIMIT_STORE: Dict[Tuple[str, str], Deque[float]] = defaultdict(deque)
_RATE_LIMIT_LOCK = Lock()


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid4()))
    start = time.perf_counter()

    try:
        response = await call_next(request)
    except Exception:
        duration_ms = (time.perf_counter() - start) * 1000
        logger.exception(
            "Unhandled error | request_id=%s method=%s path=%s duration_ms=%.2f",
            request_id,
            request.method,
            request.url.path,
            duration_ms,
        )
        raise

    duration_ms = (time.perf_counter() - start) * 1000
    response.headers["x-request-id"] = request_id
    logger.info(
        "Request completed | request_id=%s method=%s path=%s status=%s duration_ms=%.2f",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.exception_handler(Exception)
def unhandled_exception_handler(request: Request, exc: Exception):
    request_id = request.headers.get("x-request-id", "n/a")
    logger.exception(
        "Unhandled exception captured | request_id=%s path=%s", request_id, request.url.path
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "Error interno del servidor",
            "request_id": request_id,
        },
    )


app = FastAPI(title="Calculadora Pro API", version="1.2.1")
START_TIME = datetime.utcnow()
ANGLE_MODE = "RAD"

_ALLOWED_BINOPS = {
    ast.Add: lambda a, b: a + b,
    ast.Sub: lambda a, b: a - b,
    ast.Mult: lambda a, b: a * b,
    ast.Div: lambda a, b: a / b,
    ast.FloorDiv: lambda a, b: a // b,
    ast.Mod: lambda a, b: a % b,
    ast.Pow: lambda a, b: a**b,
}

_ALLOWED_UNARYOPS = {
    ast.UAdd: lambda a: +a,
    ast.USub: lambda a: -a,
}

ANGLE_MODE = "RAD"

_ALLOWED_FUNCS = {
    "sqrt": cmath.sqrt,
    "sin": lambda x: cmath.sin(math.radians(x)) if ANGLE_MODE == "DEG" else cmath.sin(x),
    "cos": lambda x: cmath.cos(math.radians(x)) if ANGLE_MODE == "DEG" else cmath.cos(x),
    "tan": lambda x: cmath.tan(math.radians(x)) if ANGLE_MODE == "DEG" else cmath.tan(x),
    "asin": lambda x: math.degrees(cmath.asin(x)) if ANGLE_MODE == "DEG" else cmath.asin(x),
    "acos": lambda x: math.degrees(cmath.acos(x)) if ANGLE_MODE == "DEG" else cmath.acos(x),
    "atan": lambda x: math.degrees(cmath.atan(x)) if ANGLE_MODE == "DEG" else cmath.atan(x),
    "log": cmath.log10,
    "ln": cmath.log,
    "exp": cmath.exp,
    "abs": abs,
    "floor": lambda x: math.floor(x.real) if isinstance(x, complex) else math.floor(x),
    "ceil": lambda x: math.ceil(x.real) if isinstance(x, complex) else math.ceil(x),
    "round": round,
    "fact": math.factorial,
    "factorial": math.factorial,
    "sinh": math.sinh,
    "cosh": math.cosh,
    "tanh": math.tanh,
    "asinh": math.asinh,
    "acosh": math.acosh,
    "atanh": math.atanh,
}

_ALLOWED_CONSTS = {
    "pi": math.pi,
    "e": math.e,
    "tau": math.tau,
    "j": 1j,
}


class SafeEvalError(ValueError):
    pass


def _to_plot_value(value: Union[float, complex]) -> Optional[float]:
    numeric = value.real if isinstance(value, complex) else value

    if not isinstance(numeric, (int, float)):
        return None

    if not math.isfinite(float(numeric)):
        return None

    return float(numeric)


def _check_rate_limit(client_id: str, endpoint: str, limit: int, window_s: int) -> bool:
    now = time.monotonic()
    key = (client_id, endpoint)

    with _RATE_LIMIT_LOCK:
        bucket = _RATE_LIMIT_STORE[key]

        while bucket and now - bucket[0] > window_s:
            bucket.popleft()

        if len(bucket) >= limit:
            return False

        bucket.append(now)
        return True


def _to_plot_value(value):
    numeric = value.real if isinstance(value, complex) else value
    if not isinstance(numeric, (int, float)):
        return None
    if not math.isfinite(float(numeric)):
        return None
    return float(numeric)


def numerical_integral(expr, a, b, n=1000):
    step = (b - a) / n
    total = 0
    for i in range(n + 1):
        x = a + i * step
        weight = 0.5 if i == 0 or i == n else 1
        total += weight * safe_eval(expr, {"x": x})
    return total * step


def numerical_derivative(expr: str, x: float, h: float = 1e-5) -> Union[float, complex]:
    return (safe_eval(expr, {"x": x + h}) - safe_eval(expr, {"x": x - h})) / (2 * h)


def format_result(value: Union[float, complex]) -> str:
    if isinstance(value, complex):
        real = round(value.real, 5)
        imag = round(value.imag, 5)

        if abs(imag) < 1e-12:
            return f"{real:.5f}"
        if abs(real) < 1e-12:
            return f"{imag:.5f}i"
        sign = "+" if imag >= 0 else "-"
        return f"{real:.5f} {sign} {abs(imag):.5f}i"

    value = round(value, 5)
    if abs(value) >= 1e6:
        return f"{value:.5e}"
    return f"{value:.5f}"


def safe_eval(expr: str, variables: Optional[Dict[str, Union[float, complex]]] = None) -> Union[float, complex]:
    variables = variables or {}
    expr = re.sub(r"(?<![a-zA-Z])i(?![a-zA-Z])", "j", expr)

    try:
        tree = ast.parse(expr, mode="eval")
    except SyntaxError as exc:
        raise SafeEvalError("Expresión inválida") from exc

    def _eval(node: ast.AST) -> Union[float, complex]:
        if isinstance(node, ast.Expression):
            return _eval(node.body)

        if isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float, complex)):
                return node.value
            raise SafeEvalError("Solo números permitidos")

        if isinstance(node, ast.Name):
            if node.id in variables:
                return variables[node.id]
            if node.id in _ALLOWED_CONSTS:
                return _ALLOWED_CONSTS[node.id]
            raise SafeEvalError(f"Variable inválida: {node.id}")

        if isinstance(node, ast.UnaryOp) and type(node.op) in _ALLOWED_UNARYOPS:
            return _ALLOWED_UNARYOPS[type(node.op)](_eval(node.operand))

        if isinstance(node, ast.BinOp) and type(node.op) in _ALLOWED_BINOPS:
            return _ALLOWED_BINOPS[type(node.op)](_eval(node.left), _eval(node.right))

        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id == "der":
                if len(node.args) != 2:
                    raise SafeEvalError("der requiere 2 argumentos: der(expr, x)")
                expr_source = ast.unparse(node.args[0])
                x_value = _eval(node.args[1])
                return numerical_derivative(expr_source, x_value)

            if isinstance(node.func, ast.Name) and node.func.id == "int":
                if len(node.args) != 3:
                    raise SafeEvalError("int requiere 3 argumentos: int(expr, a, b)")
                expr_source = ast.unparse(node.args[0])
                a = _eval(node.args[1])
                b = _eval(node.args[2])
                return numerical_integral(expr_source, a, b)

            if isinstance(node.func, ast.Name) and node.func.id in _ALLOWED_FUNCS:
                fn = _ALLOWED_FUNCS[node.func.id]
                args = [_eval(arg) for arg in node.args]
                try:
                    return fn(*args)
                except Exception as exc:
                    raise SafeEvalError("Error en función matemática") from exc

            raise SafeEvalError("Función no permitida")

        raise SafeEvalError("Operación no permitida")

    return _eval(tree)


# ---------------------------
# Models
# ---------------------------


class CalcRequest(BaseModel):
    mode: str = Field(..., description="standard | scientific | programmer | date")
    expression: Optional[str] = None
    number: Optional[int] = None
    base: Optional[int] = Field(default=None, description="2, 8, 10, 16")
    op: Optional[str] = None
    other: Optional[int] = None
    date1: Optional[str] = None
    date2: Optional[str] = None
    days: Optional[int] = None
    date_op: Optional[str] = None

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, value: str) -> str:
        valid_modes = {"standard", "scientific", "programmer", "date"}
        mode = value.strip().lower()
        if mode not in valid_modes:
            raise ValueError("Modo inválido")
        return mode


class GraphRequest(BaseModel):
    expressions: List[str] = Field(..., min_length=1, description="Lista de funciones en x")
    x_min: float = Field(default=-10, ge=-1e6, le=1e6)
    x_max: float = Field(default=10, ge=-1e6, le=1e6)
    samples: int = Field(default=200, ge=10, le=2000)

    @field_validator("expressions")
    @classmethod
    def validate_expressions(cls, value: List[str]) -> List[str]:
        clean = [expr.strip() for expr in value if expr and expr.strip()]
        if not clean:
            raise ValueError("Ingresá al menos una función válida")
        return clean

    @model_validator(mode="after")
    def validate_range(self) -> "GraphRequest":
        if self.x_max <= self.x_min:
            raise ValueError("x_max debe ser mayor que x_min")
        return self

    model_config = {
        "json_schema_extra": {
            "example": {
                "expressions": ["sin(x)", "x**2"],
                "x_min": -10,
                "x_max": 10,
                "samples": 200,
            }
        }
    }








# ---------------------------
# Routes
# ---------------------------


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "service": "calculen-api",
        "version": APP_VERSION,
        "uptime_seconds": round(time.monotonic() - START_TIME, 2),
        "angle_mode": ANGLE_MODE,
    }


@app.post("/api/angle-mode")
def set_angle_mode(mode: str):
    global ANGLE_MODE
    mode = mode.upper()
    if mode not in ("RAD", "DEG"):
        return {"error": "Modo inválido"}
    ANGLE_MODE = mode
    return {"mode": ANGLE_MODE}


@app.post("/api/calculate")
def calculate(req: CalcRequest):
    mode = req.mode

    if mode in ("standard", "scientific"):
        expression = payload.get("expression")
        if not expression:
            return {"error": "Falta la expresión"}
        try:
            return {"result": format_result(safe_eval(req.expression))}
        except SafeEvalError as exc:
            return {"error": str(exc)}

    if mode == "scientific":
        if not req.expression:
            return {"error": "Falta la expresión (ej: sqrt(9), sin(pi/2), log(100))"}
        try:
            return {"result": format_result(safe_eval(req.expression))}
        except SafeEvalError as exc:
            return {"error": str(exc)}

    if mode == "programmer":
        if req.op in ("to_base", "from_base"):
            if req.number is None or req.base is None:
                return {"error": "Faltan number/base"}
            if int(base) not in (2, 8, 10, 16):
                return {"error": "Base inválida (2/8/10/16)"}
            n = int(number)
            base = int(base)
            if op == "to_base":
                if base == 2:
                    return {"result": bin(n)}
                if base == 8:
                    return {"result": oct(n)}
                if base == 10:
                    return {"result": str(n)}
                return {"result": hex(n)}

            if not req.expression:
                return {"error": "Para from_base, mandá el valor en 'expression' (string)"}
            try:
                return {"result": int(req.expression.strip(), req.base)}
            except Exception:
                return {"error": "No se pudo parsear el número en esa base"}

        if req.number is None:
            return {"error": "Falta number"}

        n = int(req.number)
        op = (req.op or "").strip().lower()

        n = int(number)
        if op in ("bit_and", "bit_or", "bit_xor", "shl", "shr"):
            if other is None:
                return {"error": "Falta other"}
            o = int(other)
            if op == "bit_and":
                return {"result": n & o}
            if op == "bit_or":
                return {"result": n | o}
            if op == "bit_xor":
                return {"result": n ^ o}
            if op == "shl":
                return {"result": n << o}
            return {"result": n >> o}

        if op == "bit_not":
            return {"result": ~n}
        return {"error": "Operación inválida"}

    if mode == "date":
        op = str(payload.get("date_op", "")).strip().lower()
        date1 = payload.get("date1")
        date2 = payload.get("date2")
        days = payload.get("days")

        try:
            d1 = datetime.strptime(date1, "%Y-%m-%d").date() if date1 else None
            d2 = datetime.strptime(date2, "%Y-%m-%d").date() if date2 else None
        except Exception:
            return {"error": "Formato inválido (usá YYYY-MM-DD)"}

        if op == "diff":
            if not d1 or not d2:
                return {"error": "Faltan date1/date2"}
            return {"result": (d2 - d1).days}

        if op in ("add", "sub"):
            if not d1 or days is None:
                return {"error": "Faltan date1/days"}
            delta = timedelta(days=int(days))
            out = d1 + delta if op == "add" else d1 - delta
            return {"result": out.isoformat()}

        return {"error": "Operación inválida (diff/add/sub)"}

    return {"error": "Modo inválido"}


@app.post("/api/graph")
def graph(req: GraphRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    allowed = _check_rate_limit(
        client_id=client_ip,
        endpoint="/api/graph",
        limit=RATE_LIMIT_MAX_GRAPH_CALLS,
        window_s=RATE_LIMIT_WINDOW_SECONDS,
    )
    if not allowed:
        return {
            "error": "Demasiadas solicitudes de gráfica. Esperá unos segundos e intentá de nuevo."
        }

    step = (req.x_max - req.x_min) / (req.samples - 1)
    xs = [req.x_min + step * i for i in range(req.samples)]
    datasets = []

    for expr in req.expressions:
        ys: List[Optional[float]] = []
        for x in xs:
            try:
                y = safe_eval(expr, variables={"x": x})
                ys.append(_to_plot_value(y))
            except Exception:
                ys.append(None)

        datasets.append({"expression": expr, "x": xs, "y": ys})

    return {"datasets": datasets}


handler = app
