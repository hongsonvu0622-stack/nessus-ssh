import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react', 'socket.io-client'],
          terminal: ['xterm', 'xterm-addon-fit', 'xterm-addon-web-links'],
          utils: ['xlsx']
        }
      }
    }
  }
});
