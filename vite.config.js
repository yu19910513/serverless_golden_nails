import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  // Add this 'server' section to configure the development server
  server: {
    proxy: {
      // Proxy any request that starts with '/api'
      '/api': {
        // This is the target where your backend serverless functions are running.
        // Vercel CLI (which Vite uses under the hood for this setup) typically
        // runs on port 3000 by default. If you have configured it differently,
        // you may need to change this port.
        target: 'http://localhost:3000',
        // 'changeOrigin' is needed for virtual hosted sites
        changeOrigin: true,
      },
    }
  }
})
