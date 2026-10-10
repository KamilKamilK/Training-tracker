import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Third-party code changes less often than the app, so it gets its own long-cached chunks
// and every chunk stays under Vite's 500 kB warning limit. React is split from the other
// libraries only because those libraries import React, never the other way round: chunks
// that import each other in a cycle fail at startup ("Cannot access ... before initialization").
const REACT_PACKAGES = ['react', 'react-dom', 'scheduler']

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const [, modulePath] = id.split('node_modules/')
          if (!modulePath) return undefined
          return REACT_PACKAGES.some(name => modulePath.startsWith(`${name}/`)) ? 'react' : 'vendor'
        },
      },
    },
  },
})
