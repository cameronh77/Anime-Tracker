import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on the local network so phones on the same Wi-Fi can open it.
    host: true,
    // Auth only trusts this exact origin (BETTER_AUTH_URL in backend/.env),
    // so fail loudly rather than silently moving to another port.
    port: 5173,
    strictPort: true,
    // Forward /api requests to the backend (backend/), so the frontend can call
    // fetch('/api/...') without CORS and auth cookies just work.
    proxy: { '/api': 'http://localhost:3001' },
  },
})
