import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Third-party code changes less often than the app, so it gets its own long-cached chunks
// and every chunk stays under Vite's 500 kB warning limit. A package gets a separate chunk only
// when the chunks cannot import each other in a cycle, which fails at startup ("Cannot access ...
// before initialization"): other libraries import React but React imports none of them, and Zod
// and React Router are imported only by the app, never by another library.
const REACT_PACKAGES = ['react', 'react-dom', 'scheduler']
const OWN_CHUNK_PACKAGES = ['zod', 'react-router']

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const [, modulePath] = id.split('node_modules/')
          if (!modulePath) return undefined
          if (REACT_PACKAGES.some(name => modulePath.startsWith(`${name}/`))) return 'react'
          return OWN_CHUNK_PACKAGES.find(name => modulePath.startsWith(`${name}/`)) ?? 'vendor'
        },
      },
    },
  },
})
