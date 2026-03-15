import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  // Dev server proxies API calls to the Express backend
  server: {
    port: 5173,
    proxy: {
      '/build': 'http://localhost:3000',
    },
  },
  build: {
    // Output directly into the Express static folder
    outDir: path.resolve(__dirname, '../public'),
    emptyOutDir: true,
  },
});
