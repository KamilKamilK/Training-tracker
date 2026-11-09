// Imported by the generated service worker (`workbox.importScripts` in vite.config.ts).
// Requests to other origins (Firestore, Firebase Auth) go straight to the network: Workbox serves
// only this origin's files, and in Chromium a Firestore request that wakes the old worker while
// it is being stopped postpones the update confirmed with "Odśwież" until that worker is idle.
// Browsers without the Static Routing API keep passing these requests through the fetch handler.
self.addEventListener('install', (event) => {
  if (!('addRoutes' in event)) return;
  event.waitUntil(
    event
      .addRoutes({ condition: { not: { urlPattern: '/*' } }, source: 'network' })
      .catch((error) => console.warn('Service worker addRoutes failed', error.name)),
  );
});
