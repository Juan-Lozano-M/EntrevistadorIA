import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// `test` is consumed by Vitest at runtime. Passing the config through a
// variable (not an inline literal) avoids the excess-property check so the
// Vitest options don't trip Vite's config type.
const config = {
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
};

export default defineConfig(config);
