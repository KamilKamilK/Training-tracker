import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Third-party code changes less often than the app, so it gets its own long-cached chunks.
// Capture shared dependencies before their consumers to keep chunk imports acyclic:
// Firebase Auth and Firestore both use the Firebase app, but the app imports neither.
// Firestore's standalone regexp engine (re2js) has no dependency on Firebase.
// Rolldown includes each group's dependencies recursively; the first matching group wins.
const packages = (...names: string[]) => new RegExp(`node_modules[\\\\/](${names.join('|')})[\\\\/]`)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'prompt',
    manifest: false,
    workbox: {
      // Control the first online visit as soon as installation completes. Updates still wait
      // for confirmation: claiming clients happens only after the new worker is activated.
      clientsClaim: true,
      globPatterns: ['**/*.{js,css,html,svg}'],
      navigateFallback: 'index.html',
      // Reserved endpoints (including Firebase Auth helpers) must reach the server.
      navigateFallbackDenylist: [/^\/__/],
    },
  })],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: packages('react', 'react-dom', 'scheduler') },
            { name: 'zod', test: packages('zod') },
            { name: 'react-router', test: packages('react-router') },
            { name: 'firebase-app', test: packages('@firebase/app') },
            { name: 'firebase-auth', test: packages('@firebase/auth') },
            { name: 're2js', test: packages('re2js') },
            { name: 'firebase-firestore', test: packages('@firebase/firestore') },
            { name: 'vendor', test: /node_modules[\\/]/ },
          ],
        },
      },
    },
  },
})
