import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // This exposes the server to all interfaces
    port: 5173,        // You can specify a different port if needed
  },
})
