import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    host: '0.0.0.0',
    proxy: {
      '/socket.io': {
        target: 'http://192.168.6.9:8081',
        ws: true
      }
    }
  }
}); 