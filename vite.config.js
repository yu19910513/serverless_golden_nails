import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // ✅ output to ./dist for Vercel
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // optional, for local dev only
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
