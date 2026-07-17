# `@savemony/shared`

Este paquete centraliza los **esquemas de validación (Valibot)** y la lógica compartida que se ejecuta tanto en el Frontend (`apps/panel`) como en el Backend (`apps/api`).

## ¿Qué debe ir en este paquete?

1. **Esquemas de Contratos de API (Request/Response):**
   - Esquemas que validan lo que el frontend envía y lo que el backend recibe.
   - Ejemplos: `loginSchema`, `settingsUpdateSchema`, `createProductSchema`.
   - Estos esquemas suelen ser **diferentes** a la tabla exacta de la base de datos (por ejemplo, omiten campos auto-generados, anidan JSONs, o validan reglas de negocio como "el password debe tener 4 caracteres").

2. **Tipos inferidos de Valibot:**
   - `export type SettingsUpdateInput = v.InferOutput<typeof settingsUpdateSchema>;`

3. **Constantes y Utilidades Globales:**
   - Reglas de negocio compartidas, listas predefinidas (ej. `PROVIDER_AVAILABLE`).

## Relación con Drizzle (`drizzle-orm/valibot`)

Es tentador usar `createSelectSchema` o `createInsertSchema` de `drizzle-orm/valibot` para no duplicar código. Sin embargo, en un monorepo hay que tener cuidado:

### ¿Por qué NO exportar los schemas de Drizzle al Frontend directamente?
1. **Acoplamiento Fuerte:** Si exportas el schema generado por Drizzle desde `apps/api`, obligas al frontend a importar desde el backend.
2. **Secretos e Implementación:** La base de datos es un detalle de implementación. Hay columnas (ej. `passwordHash`, `internalNotes`) que el frontend no debería conocer ni tener en sus tipos de TypeScript.
3. **Columnas JSON:** Drizzle tipa las columnas JSON como `text("...", { mode: "json" })`. Drizzle no sabe validar el interior de ese JSON (como tu `ThemeConfig`), por lo que igual tendrías que escribir el esquema de Valibot a mano para validarlo.

### La Estrategia Recomendada
1. **Para validación de API (Frontend <-> Backend):** Escribe los esquemas manualmente aquí en `packages/shared`. Esto define el "Contrato de la API" (lo que viaja por la red).
2. **Para tipos puros (JSONs, configs):** Usa `packages/types` para las interfaces puras de TypeScript (`ThemeConfig`).
3. **Para validación interna en DB:** Si quieres, dentro de `apps/api/src/db`, usa `drizzle-orm/valibot` internamente para asegurarte de que lo que vas a insertar en la BD es válido a nivel de tabla, pero **no lo exportes** a las aplicaciones cliente.

De esta forma:
- El Frontend solo conoce el contrato de la API (`packages/shared`).
- El Backend valida la entrada de la API (`packages/shared`).
- Las interfaces de datos complejos (`packages/types`) se comparten limpiamente.

## Barriles internos y Punto de Entrada Único
Al ser funciones utilitarias y código que no depende de librerías pesadas del navegador (como componentes de React), los bundlers modernos (Vite, Next.js, etc.) aplicarán **Tree Shaking** de forma sumamente eficiente. No habrá problemas de rendimiento. Ademas si existiera el caso de que exportaras dos types iguales, typescript dará error al instante.

packages/shared/
├── src/
│   ├── constants/
│   │   └── index.ts (exporta enums y constantes)
│   ├── schemas/
│   │   └── index.ts (exporta esquemas Valibot y sus InferTypes)
│   ├── utils/
│   │   ├── currency-helpers.ts
│   │   ├── date-helpers.ts
│   │   └── index.ts (reexporta currency y dates)
│   ├── saving/
│   │   └── index.ts (funciones y tipos específicos de saving)
│   └── index.ts (EL PUNTO CENTRAL)
├── package.json
└── tsconfig.json


### Tres Reglas de Oro para evitar problemas
- **Exporta los Tipos de Valibot explícitamente:** Cuando se creen esquemas de Valibot, infiere y exporta los tipos en el mismo lugar para que el frontend los consuma directo.
- **Cuidado con las dependencias del lado del servidor**: Asegurarse de que nada dentro de `shared` intente importar módulos nativos de Node.js (como `fs` o `crypto`). Si una utilidad de `saving/` usa algo exclusivo del Backend, romperá el Frontend al importar desde el `index.ts` común. Todo lo que esté en `shared` debe ser código isomórfico (que corra en cualquier lado).
- **Usa export type si hay ambigüedad**: Si en algún momento hay archivos con interfaces puras de TypeScript que chocan en nombre con variables locales, se puede usar `export type * from './types'` para ayudar al compilador.