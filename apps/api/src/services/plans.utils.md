# plans.utils.ts

Generacion y rebalanceo de montos para planes de ahorro.

## Arquitectura

### Metodos de ahorro (`SavingsMethod`)

| Metodo        | Montos fijos | Usa `amountMode` | Descripcion                          |
|---------------|-------------|------------------|--------------------------------------|
| `custom_grid` | No          | Si               | Grilla libre con estrategia variable |
| `no_spend`    | No          | Si               | Dias sin gastos, monto variable      |
| `52_weeks`    | Si          | No               | Patron escalado 1-52                 |
| `100_envelopes`| Si         | No               | Patron escalado 1-100                |
| `3_months`    | Si          | No               | Patron de 90 dias                    |

### Estrategias de montos (`AmountMode`)

Solo aplica para `custom_grid` y `no_spend`:

| Modo         | Descripcion                              | Parametros clave          |
|--------------|------------------------------------------|----------------------------|
| `range`      | (default) Montos aleatorios entre min/max| `minAmount`, `maxAmount`   |
| `rounding`   | Multiplos de un valor fijo               | `roundingMultiple`         |
| `preferred`  | Solo valores predefinidos por el usuario | `preferredAmounts[]`       |

### Orden de prioridad

Para metodos variables (`custom_grid`, `no_spend`):

1. Si `amountMode === "rounding"` y `roundingMultiple &gt; 1` -&gt; `generateRounding`
2. Si `amountMode === "preferred"` y `preferredAmounts.length &gt; 0` -&gt; `generateCustomGrid`
3. Default -&gt; `generateRandomGrid`

Para metodos fijos (`52_weeks`, `100_envelopes`, `3_months`):

- Siempre usan su patron clasico, ignoran `amountMode` y `roundingMultiple`

## Funciones publicas

### `generateGrid(options: GenerateGridOptions): number[]`

Genera un array de montos que suman exactamente `target`.

**Opciones:**

- `method`: Metodo de ahorro
- `target`: Monto objetivo total
- `rows`, `cols`: Dimensiones de la grilla
- `minAmount` / `maxAmount`: Umbrales (default 0 = sin limite)
- `preferredAmounts`: Array de montos preferidos
- `roundingMultiple`: Multiplo para redondeo (ej: 25000)
- `amountMode`: Estrategia para metodos variables

**Invariantes garantizadas:**

- `result.length === rows * cols`
- `result.reduce((a,b) =&gt; a+b, 0) === target`
- `result[i] &gt;= 1` para todo i
- En modo `rounding`: `result[i] % roundingMultiple === 0` para al menos el 95% de las celdas

### `rebalanceCells(options: RebalanceOptions): {id, amount}[]`

Recalcula montos de celdas pendientes cuando una celda se completa.

**Opciones:**

- `cells`: Array de celdas con `id`, `amount`, `status`, `isLocked`
- `totalTarget`: Meta total del plan
- `mode`: `"proportional"` o `"random"`
- `minAmount` / `maxAmount`: Umbrales

**Comportamiento:**

- Celdas `completed` o `isLocked` no se modifican
- Distribuye el remanente (`totalTarget - suma de completadas/locked`) entre pendientes
- En modo `proportional`: distribuye proporcional al monto original
- En modo `random`: fair share con variacion del 30%

**Manejo de casos extremos:**

- Si `max` es imposible (max * pendientes &lt; remanente), eleva el max automaticamente
- Si no hay pendientes, devuelve las celdas sin cambios
- Si `target &lt; suma completadas`, asigna el minimo a las pendientes

## Generadores internos

### `generateRandomGrid(target, total, min, max)`

Distribucion aleatoria con varianza controlada. Garantiza que la suma sea exacta mediante `normalizeToTarget`.

### `generateCustomGrid(target, total, min, max, preferredAmounts)`

Usa solo valores de `preferredAmounts`. Si no alcanzan, ajusta la ultima celda. Si hay sobrante, distribuye entre celdas existentes.

### `generateRounding(target, total, min, max, roundingMultiple)`

1. Genera base aleatoria
2. Redondea cada celda al multiplo mas cercano
3. Ajusta diferencias sumando/restando multiplos a celdas aleatorias
4. Si queda diff no divisible por el multiplo, `normalizeToTarget` arregla la suma (puede romper un multiplo en una celda)

### `generateClassicPattern(target, total, classicCount, patternFn)`

Escala un patron clasico al target. Si `total === classicCount`, usa el patron exacto. Si no, genera aproximacion lineal creciente.

## Helpers

### `normalizeToTarget(amounts, target)`

Ajusta la ultima celda para que la suma sea exacta. Si la ultima celda queda &lt;= 0, redistribuye equitativamente.

### `shuffle(arr)`

Fisher-Yates shuffle. Usado para que los montos no salgan ordenados.