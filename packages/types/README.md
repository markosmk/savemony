# `@savemony/types`

Este paquete centraliza todos los **tipos de TypeScript puros** e interfaces de dominio del sistema. 
El objetivo principal es mantener una única fuente de verdad (Single Source of Truth) para las estructuras de datos, asegurando que todas las aplicaciones del monorepo estén sincronizadas sin acoplar dependencias de librerías.

## ¿Qué debe ir en este paquete?

1. **Interfaces de Dominio (Modelos de Base de Datos):** Tipos que representan cómo se estructuran los datos, por ejemplo:
   - `ThemeConfig`, `OnlineStoreConfig`, `PaymentConfig` (actualmente en `apps/api`).
   - Interfaces base de `User`, `Product`, `Ingredient`, `Order`, etc.

2. **Enums y Tipos Literales:** 
   - Roles (`'admin' | 'user'`).
   - Estados de orden (`'pending' | 'preparing' | 'ready' | 'delivered'`).

3. **Tipos de Contratos de API:**
   - Tipos de Request/Response de tus endpoints (ej: `CreateOrderRequest`, `PaginatedResponse<T>`).

## ¿Qué NO debe ir en este paquete?

1. **Esquemas de Validación (Zod / Valibot):**
   - Los validadores requieren importar librerías (`valibot`, `zod`). Es mejor mantenerlos en `packages/shared` o un paquete `packages/validators` aparte, para que aplicaciones móviles (ej. React Native) o módulos ligeros no se lleven peso innecesario si solo necesitan la interfaz estática.
   
2. **Lógica de Base de Datos o Drizzle:**
   - Nada de código que importe `drizzle-orm` (como `sqliteTable`). Los schemas de DB deben vivir en la API, pero pueden implementar o castear hacia los tipos de este paquete (`.$type<ThemeConfig>()`).

3. **Hooks o Componentes (React/Vue/etc):**
   - Este paquete debe ser agnóstico de frameworks.

## ¿Por qué separarlo?

Cuando crees una aplicación en **React Native**, el cliente móvil solo necesitará conocer la "forma" de los datos (las interfaces). Si esos tipos viven dentro de `apps/api/`, React Native intentaría resolver dependencias del backend (como Drizzle o Node APIs) y fallará el bundle. Al aislar los tipos aquí, cualquier cliente (Panel, MVP, App Móvil) puede consumirlos de forma 100% segura y ligera.