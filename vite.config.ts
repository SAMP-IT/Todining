import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  // Strip console.* and debugger from PRODUCTION builds only (kept in dev).
  // Stops credential-hash / PII payload logging from ever shipping to the browser.
  esbuild: command === 'build' ? { drop: ['console', 'debugger'] } : {},
}));
