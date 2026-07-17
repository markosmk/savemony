
### CÓMO FUNCIONAN LAS RACHAS (STREAKS)
- NO se guardan en la base de datos.
- Se calculan EN TIEMPO REAL a partir de los entries (depósitos).

### ¿Por qué no se guardan en BD?
Son datos DERIVADOS. Si se guarda la racha en BD, cada vez que el usuario
edita o elimina un depósito del pasado, se tendria que recalcular y
actualizar la BD. Es más simple y robusto calcularlas **"on the fly"**.

### ¿Qué se necesita para calcular una racha?

Solo se necesita el array de entries de ese plan. De ahí se extrae:

1. Las fechas únicas que tienen al menos un depósito.
2. Se ordena esas fechas ascendentemente.
3. Se cuenta cuántos días `CONSECUTIVOS` hay desde el último depósito hacia atrás.

### Ejemplo visual:

- `entries`: `[{date:'2026-07-10'}, {date:'2026-07-11'}, {date:'2026-07-12'}]`
- `depositDays`: `['2026-07-10', '2026-07-11', '2026-07-12']`
- `hoy`: `'2026-07-12'`

- Resultado: `currentStreak` = `3` (10, 11, 12 son consecutivos)
Entonces si hoy es `'2026-07-14'` y el último depósito fue el 12:
- Resultado: `currentStreak` = `0` (se rompió, pasaron más de 2 días sin depositar)

### ¿Cómo agregar más insignias (badges)?
Solo edita el array `BADGES` en `streaks.ts`:

```ts
const BADGES = [
{ id: 'week',      name: 'Semana de Fuego',      icon: '🔥',  requiredDays: 7 },
{ id: 'month',     name: 'Ahorrador del Mes',    icon: '📅',  requiredDays: 30 },
{ id: 'quarter',   name: 'Trimestre de Oro',     icon: '🏆',  requiredDays: 90 },
{ id: 'year',      name: 'Leyenda del Ahorro',   icon: '👑',  requiredDays: 365 },
// aca:
{ id: 'biweek', name: 'Quincena Perfecta', icon: '⭐', requiredDays: 14 },
{ id: 'halfyear', name: 'Medio Año', icon: '🥈', requiredDays: 180 },
];
```

### ¿Dónde se usan en el frontend?

En `streaks-panel.tsx` ese componente:

- Llama a `getStreakInfo(entries)`.
- Muestra `currentStreak`, `longestStreak`, `badges` ganados/no ganados.
- Muestra una barra de progreso hacia el siguiente milestone.

### ¿Se pierde algo al no guardar en BD?
No. La racha se calcula siempre correctamente porque parte de los datos
reales (`entries`). Si se borra un depósito del pasado, la racha se ajusta
automáticamente en la próxima renderización.

### ¿Qué pasa si quiero mostrar la racha en la lista de planes?
- Simplemente se pasa los `entries` de cada plan a `getStreakInfo()`:
```ts
const streak = getStreakInfo(planEntries);
```
- No se necesita ningún campo extra en la BD.