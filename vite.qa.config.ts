import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

// Separate design review server. This config and its fixture aliases are never used by the production build.
export default defineConfig({
  plugins: [
    react(),
    {
      name: "design-preview-entry",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === "/" || req.url?.startsWith("/erp/"))
            req.url = "/qa/preview.html";
          next();
        });
      },
    },
  ],
  resolve: {
    alias: [
      {
        find: "@/contexts/AuthContext",
        replacement: path.resolve("qa/auth-fixture.ts"),
      },
      {
        find: "@/lib/erp/api",
        replacement: path.resolve("qa/data-fixture.ts"),
      },
      { find: "@", replacement: path.resolve("src") },
    ],
  },
});
