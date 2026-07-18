import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
// import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    plugins: [tailwindcss(), tanstackRouter({ target: "react", autoCodeSplitting: true }), react()],
    resolve: {
      tsconfigPaths: true,
      // alias: {
      //   "@": path.resolve(__dirname, "./src"),
      //   "@savemony/shared/assets": path.resolve(__dirname, "../../packages/shared/src/assets/index.ts"),
      //   "@savemony/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      // },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:8787",
          changeOrigin: true,
        },
      },
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});
