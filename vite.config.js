import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    // We are re-introducing the proxy for local development ONLY.
    // This tells the Vite server to forward any /api requests.
    proxy: {
      '/api': {
        // This will be the address of our Vercel backend server.
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    }
  }
})
