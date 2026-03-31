import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Зменшує ризик MIME-sniffing у dev; на production краще задати на CDN/nginx.
      'X-Content-Type-Options': 'nosniff',
    },
  },
})
