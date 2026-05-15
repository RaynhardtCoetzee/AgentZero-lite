// Minimal service worker — satisfies Chrome's PWA installability requirement.
// No caching strategy; all requests pass through to the network.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => e.respondWith(fetch(e.request)));
