// Mees service worker: alleen een offlinepagina als er geen verbinding is.
// Bewust GEEN caching van pagina's of gegevens: niets van kinderen, ouders of tutors in de cache.
const CACHE = "mees-offline-v1";
const OFFLINE = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll([OFFLINE, "/app/icoon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Alleen paginanavigatie: lukt het netwerk niet, dan de offlinepagina. Al het andere gaat gewoon naar het netwerk.
  if (req.mode !== "navigate" || req.method !== "GET") return;
  event.respondWith(fetch(req).catch(() => caches.match(OFFLINE).then((r) => r ?? Response.error())));
});
