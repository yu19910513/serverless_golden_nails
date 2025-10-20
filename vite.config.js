import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Vercel expects the output directory to be 'dist' at the project root.
    outDir: 'dist',
  },
  // The 'server.proxy' section should be removed.
  // The `vercel dev` command handles all API routing automatically.
})
