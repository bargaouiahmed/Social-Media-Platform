import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(),tailwindcss()],
    server: {
      host: mode === 'production' ? 'hacker.bahwebdev.com' : 'localhost',
      port: 5173,
      hmr: {
        clientPort: 443 // If using SSL
      }
    }
  }
})
