import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Third-party code changes less often than the app, so it gets its own long-cached chunks.
// Capture shared dependencies before their consumers to keep chunk imports acyclic:
// Firebase Auth and Firestore both use the Firebase app, but the app imports neither.
// Firestore's standalone regexp engine (re2js) has no dependency on Firebase.
// Rolldown includes each group's dependencies recursively; the first matching group wins.
const packages = (...names: string[]) => new RegExp(`node_modules[\\\\/](${names.join('|')})[\\\\/]`)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
