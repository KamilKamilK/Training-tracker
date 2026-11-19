import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Third-party code changes less often than the app, so it gets its own long-cached chunks.
// Capture shared dependencies before their consumers to keep chunk imports acyclic:
// Firebase Auth and Firestore both use the Firebase app, but the app imports neither.
// Firestore's standalone regexp engine (re2js) has no dependency on Firebase.
// Rolldown includes each group's dependencies recursively; the first matching group wins.
const packages = (...names: string[]) => new RegExp(`node_modules[\\\\/](${names.join('|')})[\\\\/]`)

type ApiModule = { POST: (request: Request) => Promise<Response> }

// `npm run dev` serves the Vercel function api/exercise-videos.ts itself, so the videos work
// without the Vercel CLI. With VITE_USE_EMULATORS=true the function checks tokens and permissions
// in the local emulators; the files still go to the Supabase project from .env (README).
const exerciseVideosApi = (): Plugin => ({
  name: 'exercise-videos-api',
  apply: 'serve',
  configureServer(server) {
    const env = loadEnv(server.config.mode, process.cwd(), ['VITE_', 'SUPABASE_', 'FIREBASE_', 'GCLOUD_'])
    for (const [name, value] of Object.entries(env)) {
      if (!name.startsWith('VITE_')) process.env[name] ??= value
    }
    if (env.VITE_USE_EMULATORS === 'true') {
      process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080'
      process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099'
      process.env.GCLOUD_PROJECT ??= env.VITE_PROJECT_ID
    }

    server.middlewares.use('/api/exercise-videos', async (req, res, next) => {
      try {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const headers = new Headers()
        for (const [name, value] of Object.entries(req.headers)) {
          if (typeof value === 'string') headers.set(name, value)
        }
        const api = (await server.ssrLoadModule('/api/exercise-videos.ts')) as ApiModule
        const response = await api.POST(new Request(`http://localhost${req.originalUrl ?? req.url}`, {
          method: 'POST',
          headers,
          body: Buffer.concat(chunks),
        }))
        res.statusCode = response.status
        response.headers.forEach((value, name) => res.setHeader(name, value))
        res.end(Buffer.from(await response.arrayBuffer()))
      } catch (error) {
        next(error)
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), exerciseVideosApi(), VitePWA({
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
      // Sends requests to other origins (Firebase) straight to the network, bypassing the worker.
      importScripts: ['sw-network-routes.js'],
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
