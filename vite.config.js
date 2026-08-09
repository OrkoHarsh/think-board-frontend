import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Bind every interface so a phone on the same network can load the dev server
    // via the Network URL Vite prints on start.
    host: true,
  },
})
