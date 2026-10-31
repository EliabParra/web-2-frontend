import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const backend = "http://localhost:3000";
const proxiedPaths = ["/toProccess", "/login", "/logout", "/csrf"];

// Browser navigations (e.g. reloading /login) must get the SPA, not the API.
const isPageRequest = (accept = "") => accept.includes("text/html");

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false,
    },
    proxy: Object.fromEntries(
      proxiedPaths.map((p) => [
        p,
        {
          target: backend,
          changeOrigin: true,
          bypass: (req) => (isPageRequest(req.headers.accept) ? req.url : undefined),
        },
      ]),
    ),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
