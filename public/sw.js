const CACHE_NAME = "delibery-cache-v3";
const urlsToCache = ["/", "/index.html", "/logo.png", "/manifest.json"];

self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching app shell");
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Removing old cache:", key);
            return caches.delete(key);
          }
        }),
      ),
    ),
  );
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Ignorar requests de extensiones de navegador y dev tools
  const url = event.request.url;
  if (
    url.startsWith("chrome-extension://") ||
    url.startsWith("devtools://") ||
    url.startsWith("moz-extension://") ||
    url.startsWith("safari-extension://")
  ) {
    return;
  }

  // Network first for API calls
  if (url.includes("supabase.co") || url.includes("googleapis.com") || url.includes("googleusercontent.com")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        return (
          response ||
          fetch(event.request).then((fetchResponse) => {
            // Solo cachear respuestas exitosas de HTTP/HTTPS
            if (
              fetchResponse.ok &&
              (url.startsWith("http://") || url.startsWith("https://"))
            ) {
              return caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, fetchResponse.clone());
                return fetchResponse;
              });
            }
            return fetchResponse;
          })
        );
      })
      .catch(() => {
        // Return offline page if available
        return caches.match("/");
      }),
  );
});

// Comunicación para actualización
self.addEventListener("message", (event) => {
  if (!event.data) return;
  if (event.data.type === "SKIP_WAITING") {
    console.log("[SW] Skip waiting");
    self.skipWaiting();
  }
});
