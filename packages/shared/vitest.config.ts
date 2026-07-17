import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Permite usar describe, it, expect sin importarlos en cada archivo
    // add "types": ["vitest/globals"] en el tsconfig.json
    // globals: true,
    // Entorno de ejecución optimizado para funciones puras/Node
    environment: "node",
  },
});
