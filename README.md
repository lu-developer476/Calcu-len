# Calcu-len (Python + HTML + Vercel)

Calculadora web multi-modo con foco en precisión, seguridad y buena experiencia de uso.

## Funcionalidades
- **Estándar**: operaciones aritméticas y expresiones con paréntesis.
- **Científica**: funciones trigonométricas, logarítmicas, hiperbólicas y complejas.
- **Gráfica**: trazado de funciones en `x` con múltiples curvas y validación de puntos.
- **Programadora**: conversiones de base y operaciones bitwise.
- **Fechas**: diferencia, suma y resta de días.

## Mejoras de preparación profesional (sin cambios estéticos)
- Validaciones más estrictas de payloads con Pydantic para entrada robusta.
- Logging por request con `x-request-id` para trazabilidad.
- Rate limiting básico para `/api/graph` para evitar abuso.
- Healthcheck extendido con metadata (`version`, `uptime`, `angle_mode`).
- Suite de tests automáticos con `pytest`.
- CI con GitHub Actions (compilación + tests).
- Documentación de endpoint y payloads de referencia.

## Stack
- Frontend: HTML + CSS + JavaScript (sin frameworks)
- Backend: FastAPI en `api/index.py`
- Deploy: Vercel (serverless + static)

## Seguridad
La app **no usa `eval()`**. Las expresiones se resuelven con un parser AST seguro que permite únicamente:
- Operadores: `+ - * / // % **`
- Constantes: `pi`, `e`, `tau`, `i`
- Funciones matemáticas permitidas del motor

## Ejecutar localmente

### 1) Crear entorno e instalar dependencias
```bash
python -m venv .venv
source .venv/bin/activate   # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2) Levantar API
```bash
uvicorn api.index:app --reload
```

### 3) Servir frontend
Podés abrir `public/index.html` con Live Server o con cualquier servidor estático.

## Endpoints
- `GET /api/health`
- `POST /api/calculate`
- `POST /api/graph`
- `POST /api/angle-mode`

### Ejemplo: `/api/calculate`
```json
{
  "mode": "scientific",
  "expression": "sin(pi/2)"
}
```

### Ejemplo: `/api/graph`
```json
{
  "expressions": ["sin(x)", "x**2"],
  "x_min": -10,
  "x_max": 10,
  "samples": 200
}
```

## Notas de UX
- Se acepta `^` como potencia desde el frontend (se normaliza a `**`).
- La gráfica descarta valores no finitos para evitar errores de render y JSON inválido.
- Se muestran estados de carga y feedback de error en cada flujo principal.
- Modo científico en **grados (DEG)** por defecto; podés cambiar a RAD vía `POST /api/angle-mode`.
