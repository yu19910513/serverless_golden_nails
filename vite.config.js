import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000', // vercel dev default port
    },
  },
  build: {
    // Vercel expects the output directory to be 'dist' at the project root.
    outDir: 'dist',
  },
})
