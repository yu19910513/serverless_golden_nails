import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // vercel dev runs here
        changeOrigin: true,              // fixes CORS and host issues
        secure: false,                   // allow local http
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
