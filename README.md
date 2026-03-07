# Calcu-len

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white)
![Uvicorn](https://img.shields.io/badge/Uvicorn-499848?style=for-the-badge)
![Pytest](https://img.shields.io/badge/Pytest-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)
![HTTPX](https://img.shields.io/badge/HTTPX-000000?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

Calculadora web multi-modo orientada a precisión matemática, experiencia de usuario y despliegue profesional.

## Funcionalidades
- **Estándar**: operaciones aritméticas y expresiones con paréntesis.
- **Científica**: trigonometría, logaritmos, exponenciales, funciones hiperbólicas y números complejos.
- **Gráfica**: trazado de funciones en `x` con múltiples curvas.
- **Programadora**: conversiones de base y operaciones bitwise.
- **Fechas**: diferencia, suma y resta de días.

## Stack técnico
- **Frontend:** HTML + CSS + JavaScript (sin frameworks)
- **Backend:** FastAPI (`api/index.py`)
- **Deploy:** Vercel (función Python + estáticos)

## Seguridad
La app **no utiliza `eval()` en backend**. Las expresiones se resuelven con parser AST seguro y allowlist de:
- Operadores: `+ - * / // % **`
- Constantes: `pi`, `e`, `tau`, `i`
- Funciones matemáticas habilitadas

## Ejecución local

### 1) Entorno e instalación
```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2) Levantar API
```bash
uvicorn api.index:app --reload
```

### 3) Servir frontend
Abrí `public/index.html` con Live Server o cualquier servidor estático.

## Endpoints
- `GET /api/health`
- `POST /api/calculate`
- `POST /api/graph`
- `POST /api/angle-mode`

## Ejemplos de cálculos para probar

### Estándar
- `4 + 2,5` → `6,50000`
- `(8 - 3)^2 + 10/4`
- `125 % 7`

### Científica
- `sin(pi/2)` en `RAD` → `1,00000`
- `sin(45)` en `DEG`
- `√(125^2 - 5^4) + log(1000) + sin(45) × 20`
- `ln(e^2)`

### Gráfica
- `sin(x), x^2/10`
- `tan(x)` con `x_min=-10`, `x_max=10`, `samples=400`
- `sqrt(x)` con `x_min=0`, `x_max=25`, `samples=200`

### Programadora
- Número decimal `42` a base `2`, `8`, `16`
- `bit_and` entre `42` y `7`
- `shl` de `5` por `2`

### Fechas
- Diferencia entre `2026-01-01` y `2026-12-31`
- Sumar `30` días a una fecha
- Restar `90` días a una fecha

## Notas de UX
- Se acepta `^` como potencia desde el frontend (se normaliza a `**`).
- Se aceptan `^`, `√`, `×`, `÷`, `π` y `−`; se normalizan automáticamente para cálculo científico.
- La gráfica descarta valores no finitos para evitar errores de render y JSON inválido.
- Se muestran estados de carga y feedback de error en cada flujo principal.
- Modo científico en **grados (DEG)** por defecto; podés cambiar a RAD vía `POST /api/angle-mode`.
