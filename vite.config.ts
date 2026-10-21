import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Third-party code changes less often than the app, so it gets its own long-cached chunks.
// A package gets a separate chunk only when the chunks cannot import each other in a cycle,
// which fails at startup ("Cannot access ... before initialization"): other libraries import
// React but React imports none of them, and Zod and React Router are imported only by the app,
// never by another library. A module goes to the first group whose test it matches.
const packages = (...names: string[]) => new RegExp(`node_modules[\\\\/](${names.join('|')})[\\\\/]`)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: packages('react', 'react-dom', 'scheduler') },
            { name: 'zod', test: packages('zod') },
            { name: 'react-router', test: packages('react-router') },
            { name: 'vendor', test: /node_modules[\\/]/ },
          ],
        },
      },
    },
  },
})
