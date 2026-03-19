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

Calculadora web integral orientada a precisión matemática, experiencia de usuario y despliegue profesional.

---

## 🚀 Funcionalidades

- **Estándar**: operaciones aritméticas y expresiones con paréntesis.
- **Científica**: trigonometría, logaritmos, exponenciales, funciones hiperbólicas y números complejos.
- **Gráfica**: trazado de funciones en `x` con múltiples curvas.
- **Programadora**: conversiones de base y operaciones bitwise.
- **Fechas**: diferencia, suma y resta de días.
- **Financiera**:
  - Propinas y descuentos por porcentaje
  - Cálculo de cuotas con y sin interés
  - Anticipo configurable
  - Resultado detallado (financiado, total, cuota)

---

## 🏗️ Stack técnico

- **Frontend:** HTML + CSS + JavaScript (sin frameworks)
- **Backend:** FastAPI (`api/index.py`)
- **Deploy:** Vercel (función Python + estáticos)

---

## 🧠 Arquitectura

- Sistema de navegación por modos (tabs dinámicos)
- Paneles independientes por funcionalidad
- Comunicación frontend-backend vía `/api/calculate`
- Fallback local en caso de fallo de API
- Separación clara entre UI, lógica y validación

---

## 🔐 Seguridad

La app **no utiliza `eval()` en backend**.

Las expresiones se procesan mediante:
- Parser AST seguro
- Allowlist controlada

Incluye:

- Operadores: `+ - * / // % **`
- Constantes: `pi`, `e`, `tau`, `i`
- Funciones matemáticas validadas

---

## ⚙️ Ejecución local

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

---

## 📡 Endpoints

- `GET /api/health`
- `POST /api/calculate`
- `POST /api/graph`
- `POST /api/angle-mode`

---

## 🧪 Ejemplos de cálculos

### Estándar
- `4 + 2,5` → `6,50000`
- `(8 - 3)^2 + 10/4`
- `125 % 7`

### Científica
- `sin(pi/2)` en `RAD` → `1,00000`
- `sin(45)` en `DEG`
- `ln(e^2)`

### Gráfica
- `sin(x), x^2/10`
- `tan(x)` con `x_min=-10`, `x_max=10`, `samples=400`

### Programadora
- Decimal `42` → binario / octal / hexadecimal
- `bit_and(42, 7)`
- `shl(5, 2)`

### Fechas
- Diferencia entre fechas
- Sumar/restar días

### Financiera

#### Propinas / Descuentos
- $1000 con 10% → $1100 (propina)
- $2000 con 25% → $1500 (descuento)

#### Cuotas
- Precio: $100000
- Anticipo: $20000
- Cuotas: 6
- Interés: 20%

Resultado:
- Financiado: $80000
- Total: $96000
- Cuota: $16000

---

## 🎯 Notas de UX

- Se acepta `^` como potencia (se convierte a `**`)
- Soporte de símbolos: `√ × ÷ π −`
- Normalización automática de inputs
- Manejo de errores y feedback visual
- Estados de carga
- Modo científico en DEG por defecto (configurable a RAD)

---

## 🧪 Testing

- Pytest + HTTPX
- Validación de endpoints principales
- Cobertura de cálculos críticos
- Tests para modo financiero incluidos

---

## 📌 Roadmap

- Historial de cálculos
- Persistencia en localStorage
- Exportación de resultados
- Modo oscuro
- Finanzas avanzadas (interés compuesto)

---
