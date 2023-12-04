import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [
    dts({ rollupTypes: true }),
    react()
  ],
  esbuild: {
    target: "esnext"
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext"
    }
  },
  build: {
    target: "esnext",
    lib: {
      entry: "src/index.ts",
      fileName: "index",
      formats: ["es"]
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "react-to-print", "pdfjs-dist"],
    }
  }
});
