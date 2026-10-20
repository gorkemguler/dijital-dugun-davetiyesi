import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
// @ts-expect-error mjs server module
import { handleApiAndUploads } from './server/apiHandler.mjs';

export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  plugins: [
    tailwindcss(),
    {
      name: 'wedding-backend-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          handleApiAndUploads(req, res, next);
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          handleApiAndUploads(req, res, next);
        });
      },
    },
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
