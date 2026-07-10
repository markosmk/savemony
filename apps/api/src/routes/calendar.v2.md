# MVP v2 — Modo Calendario & Montos Preferidos

> Documento de especificación para la próxima versión. No implementar en MVP v1.

---

## 1. Modo Calendario (Calendar Mode)

### 1.1 Concepto
El usuario define un **período de ahorro real** con fechas concretas, en lugar de un número arbitrario de celdas. El sistema calcula automáticamente cuántas celdas necesita basándose en:

- Fecha de inicio
- Fecha de fin (o deadline)
- Días de la semana habilitados para ahorrar
- Feriados opcionales

Cada celda se **mapea a una fecha específica** del calendario.

### 1.2 Schema de Base de Datos

#### Nuevo campo en `plan`:
```sql
ALTER TABLE plan ADD COLUMN calendar_config TEXT; -- JSON stringificado
```

#### Nuevo campo en `cell`:
```sql
ALTER TABLE cell ADD COLUMN scheduled_date TEXT; -- ISO date "2026-07-14"
```

Cuando `scheduled_date` es `NULL`, la celda es de **modo libre** (comportamiento v1).

### 1.3 Schema de Validación (Valibot)

```typescript
const calendarConfigSchema = v.object({
  enabled: v.literal(true),
  startDate: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: v.optional(v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/))),
  daysOfWeek: v.pipe(
    v.array(v.pipe(v.number(), v.minValue(0), v.maxValue(6))),
    v.minLength(1)
  ),
  excludeHolidays: v.optional(v.boolean()),
});

// En createPlanSchema:
calendarConfig: v.optional(calendarConfigSchema),
```

### 1.4 Flujo de Creación

```
[Usuario]
  │
  ▼
[Step 1: Meta y título]
  │
  ▼
[Step 2: ¿Modo calendario?]
  │
  ├── NO → Modo libre (comportamiento v1)
  │
  └── SÍ →
       │
       ▼
  [Step 2a: Fecha inicio]
       │
       ▼
  [Step 2b: Fecha fin / Deadline]
       │
       ▼
  [Step 2c: Días de la semana]
       │    [Lun] [Mar] [Mié] [Jue] [Vie] [Sáb] [Dom]
       │
       ▼
  [Step 2d: Montos preferidos (opcional)]
       │
       ▼
  [Sistema calcula]
       │    totalCells = días hábiles entre inicio y fin
       │    Ej: 3 meses, lun-sáb = ~78 celdas
       │
       ▼
  [Step 3: Preview del calendario]
       │    Muestra grid con fechas y montos estimados
       │
       ▼
  [Confirmar y crear]
```

### 1.5 Generación de Celdas con Fechas

```typescript
function generateCalendarCells(
  target: number,
  startDate: Date,
  endDate: Date,
  daysOfWeek: number[],
  preferredAmounts?: number[],
): Array<{ amount: number; scheduledDate: string }> {
  // 1. Generar fechas válidas
  const dates: Date[] = [];
  let current = new Date(startDate);

  while (current <= endDate) {
    if (daysOfWeek.includes(current.getDay())) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  // 2. Generar montos
  const amounts = generateGrid(
    "custom_grid",
    target,
    dates.length,
    1,
    0,
    0,
    "daily",
    preferredAmounts,
  );

  // 3. Combinar
  return dates.map((date, i) => ({
    amount: amounts[i],
    scheduledDate: date.toISOString().split('T')[0],
  }));
}
```

### 1.6 Visualización en el Frontend

```
┌─────────────────────────────────────┐
│  Julio 2026                         │
│  Lu  Ma  Mi  Ju  Vi  Sá  Do          │
│   -   -   1   2   3   4   -          │
│   5   6   7   8   9  10   -          │
│  11  12  13  14  15  16   -          │
│  ...                                 │
│                                      │
│  Celda 1:  $12.500  ✓ completada     │
│  Celda 2:  $15.000  ○ pendiente      │
│  Celda 3:  $10.000  ○ hoy            │
│  ...                                 │
└─────────────────────────────────────┘
```

### 1.7 Reglas de Negocio

| Regla | Comportamiento |
|-------|---------------|
| Fecha pasada | Celda aparece como "perdida" (no penaliza streak) |
| Hoy | Destacada, puede completarse |
| Futuro | No clickable hasta la fecha |
| Fin de semana deshabilitado | Gris, no cuenta para streak |
| Feriado | Opcional: excluir o marcar como día libre |

### 1.8 Migración desde v1

Los planes v1 (sin `calendarConfig`) siguen funcionando en **modo libre**. No requieren migración.

---

## 2. Montos Preferidos (Preferred Amounts)

> Implementado parcialmente en v1.5. Esta sección documenta la versión completa.

### 2.1 Concepto
El usuario define un conjunto de montos que **realmente puede ahorrar**, evitando valores incómodos (ej: $13.847 → nunca lo va a tener en efectivo).

### 2.2 Schema

```typescript
preferredAmounts: v.optional(
  v.array(v.pipe(v.number(), v.minValue(1)))
),
```

### 2.3 UI en Formulario de Creación

```
💰 Montos que sueles ahorrar (opcional):

[ 10000 ] [ 15000 ] [ 20000 ] [ 25000 ] [ + ]

[✓] Usar solo estos montos

📊 Estimado: 78 celdas × ~$12.800 promedio
🎯 Con tus montos: $10k-$25k por celda
```

### 2.4 Algoritmo

```typescript
function generateCustomGrid(
  target: number,
  total: number,
  min: number,
  max: number,
  preferredAmounts?: number[],
): number[] {
  if (!preferredAmounts || preferredAmounts.length === 0) {
    return generateRandomGrid(target, total, min, max);
  }

  const clean = [...new Set(preferredAmounts)].sort((a, b) => a - b);
  const amounts: number[] = [];
  let remaining = target;

  for (let i = 0; i < total; i++) {
    const isLast = i === total - 1;
    if (isLast) {
      amounts.push(Math.max(1, remaining));
      break;
    }

    const minReserve = (total - i - 1) * (clean[0] || 1);
    const valid = clean.filter(p => p <= remaining - minReserve);

    const amount = valid.length > 0
      ? valid[Math.floor(Math.random() * valid.length)]
      : clean.find(p => p <= remaining) ?? 1;

    amounts.push(amount);
    remaining -= amount;
  }

  return shuffle(normalizeToTarget(amounts, target));
}
```

---

## 3. Integración: Calendario + Montos Preferidos

El modo calendario **usa** montos preferidos si están definidos. Si no, usa distribución aleatoria.

```
[Calendario activo] + [Montos preferidos: 10k, 15k, 20k]
  │
  ▼
Cada fecha del calendario recibe un monto del set preferido
```

---

## 4. API Endpoints Nuevos / Modificados

### `POST /api/plans` (modificado)

Body acepta ahora:
```json
{
  "title": "Vacaciones",
  "targetAmount": 1000000,
  "calendarConfig": {
    "enabled": true,
    "startDate": "2026-07-14",
    "endDate": "2026-10-14",
    "daysOfWeek": [1, 2, 3, 4, 5, 6]
  },
  "preferredAmounts": [10000, 15000, 20000, 25000]
}
```

### `GET /api/plans/:id/calendar` (nuevo)

Devuelve las celdas con sus fechas para renderizar el calendario:
```json
{
  "month": "2026-07",
  "cells": [
    { "date": "2026-07-14", "amount": 15000, "status": "pending", "cellId": "..." },
    { "date": "2026-07-15", "amount": 20000, "status": "completed", "cellId": "..." }
  ]
}
```

---

## 5. Consideraciones Técnicas

### Timezones
- Todas las fechas se almacenan en **UTC** (`YYYY-MM-DD` sin hora)
- El frontend convierte a timezone local para display

### Performance
- Un calendario de 1 año = ~260 celdas (lún-sáb)
- Batch insert de 260 celdas: ~3 requests de 100 statements cada uno
- Aceptable para D1

### Streak en Modo Calendario
- El streak se calcula por **fechas consecutivas habilitadas**, no por días calendario
- Ej: si ahorra lunes y martes, pero miércoles es día deshabilitado, el streak sigue

---

## 6. Checklist de Implementación

- [ ] Migration: `cell.scheduled_date` (nullable text)
- [ ] Migration: `plan.calendar_config` (nullable text)
- [ ] Schema Valibot: `calendarConfig` + `preferredAmounts`
- [ ] `generateCalendarCells()` function
- [ ] Endpoint `POST /api/plans` con calendar mode
- [ ] Endpoint `GET /api/plans/:id/calendar`
- [ ] Frontend: Step de selección de fechas
- [ ] Frontend: Selector de días de la semana
- [ ] Frontend: Componente calendario visual
- [ ] Frontend: Integrar montos preferidos en form
- [ ] Tests: streak con días deshabilitados
- [ ] Tests: feriados (opcional)

---

*Documento v1.0 — 2026-07-09*