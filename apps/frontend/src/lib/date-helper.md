# Date Helpers – Guía Rápida

> **Regla de oro:** `dayjs` **nunca** se importa directamente en componentes o páginas.  
> Siempre usá `@/lib/date-helpers`. Esto nos permite cambiar la librería subyacente (Luxon, date-fns, Temporal…) sin tocar cientos de archivos.

---

## Uso básico

```ts
import { formatTime, getRelativeTime, formatDateTime } from "@/lib/date-helpers";

formatTime("2026-06-05T15:38:28.000Z");        // → "15:38"
formatDateTime("2026-06-05T15:38:28.000Z");    // → "05/06/2026 15:38"
getRelativeTime("2026-06-05T15:38:28.000Z"); // → "en 12 minutos" | "menos de 1 minuto"
```

---

## Zonas horarias (Timezone)

### Default
Todas las funciones usan por defecto:
```ts
const DEFAULT_TIMEZONE = "America/Argentina/Buenos_Aires";
```

### Pasar una zona personalizada
Cada helper acepta un segundo argumento `tz`:

```ts
formatTime("2026-06-05T15:38:28.000Z", "America/Mexico_City");
// → "13:38" (CDT)
```

Esto está pensado para cuando en **Configuración > Perfil** permitamos al operador elegir su zona horaria. Solo tenés que leerla del usuario y pasarla:

```tsx
const userTz = currentUser?.timezone ?? getDefaultTimezone();

<p>{formatTime(contact.botPausedUntil, userTz)}</p>
```

---

## Timezones en el contexto de Chat / CRM

| Escenario | Recomendación |
|-----------|---------------|
| **Base de datos** | Guardar siempre **UTC** (`2026-06-05T15:38:28.000Z`). Nunca guardes hora local. |
| **UI del operador** | Mostrar en la zona del **operador** (o la default de la app). El operador necesita saber a qué hora se envió/reactivó algo desde su perspectiva. |
| **Timestamps de mensajes** | Usar `formatTime()` para hora corta en burbujas. |
| **Cuenta regresiva** (ej. bot pausado) | Usar `getRelativeTime()`. Se actualiza cada 30s en el componente. |
| **Logs del sistema** | Mostrar fecha completa con `formatDateTime()` en zona local del admin, o UTC si hay operadores en múltiples países. |
| **Formularios** (input `datetime-local`) | Convertir a UTC antes de enviar al backend usando `dayjs` internamente o `new Date().toISOString()`. |

---

## Helpers disponibles

| Función | Descripción | Ejemplo de salida |
|---------|-------------|-------------------|
| `formatDateTime(date, tz?)` | Fecha + hora completa | `"05/06/2026 15:38"` |
| `formatTime(date, tz?)` | Solo hora | `"15:38"` |
| `getRelativeTime(date, tz?)` | Texto relativo amigable | `"en 12 minutos"`, `"menos de 1 minuto"`, `"hace 2 horas"` |
| `isFuture(date, tz?)` | ¿Es fecha futura? | `true / false` |
| `getDefaultTimezone()` | Devuelve la zona por defecto | `"America/Argentina/Buenos_Aires"` |

---

## 🚨 Errores comunes a evitar

1. **No hardcodear `new Date()` para comparaciones**  
   Siempre usá los helpers que ya aplican `.tz()` para que la comparación sea consistente.

2. **No mostrar hora del servidor tal cual**  
   Cloudflare Workers ejecutan en UTC. Si renderizás `new Date().toLocaleTimeString()` sin timezone explícito, puede salir la hora del edge location (a veces UTC, a veces no).

3. **No guardar strings con offset en la DB**  
   Ej. `"2026-06-05T15:38:28-03:00"` complica las queries y los índices. Guardá siempre ISO 8601 en **Z** (UTC).

4. **Si agregás un nuevo helper**  
   Exportalo aquí y documentalo brevemente en este archivo.

---

## Extender helpers

Si necesitás un formato nuevo (ej. solo fecha, o con nombre de mes), agregalo a `date-helpers.ts`:

```ts
export function formatShortDate(date: string | number | Date, tz = DEFAULT_TIMEZONE): string {
  return dayjs(date).tz(tz).format("DD MMM"); // → "05 Jun"
}
```

Recordá mantener la firma `(date, tz?)` para consistencia.
