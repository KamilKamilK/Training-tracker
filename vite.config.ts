import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vendor libraries change less often than the app, so separate chunks stay cached
// between deployments and keep each file under Vite's 500 kB warning limit.
const VENDOR_CHUNKS: Record<string, string[]> = {
  firestore: ['@firebase/firestore'],
  'firebase-auth': ['@firebase/auth'],
  firebase: ['@firebase/', 'firebase/'],
  react: ['react', 'react-dom', 'scheduler'],
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const [, modulePath] = id.split('node_modules/')
          if (!modulePath) return undefined
          return Object.keys(VENDOR_CHUNKS).find(chunk =>
            VENDOR_CHUNKS[chunk].some(name =>
              name.endsWith('/') ? modulePath.startsWith(name) : modulePath.startsWith(`${name}/`),
            ),
          )
        },
      },
    },
  },
})
