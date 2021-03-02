const STATIC_CACHE_NAME = "static-cache-v1";
const DATABASE_CACHE_NAME = "data-cache-v1";
const FILES_TO_CACHE = [
  "/",
  "./assets/scripts/index.js",
  "./assets/scripts/swActivation.js",
  "./assets/css/styles.css",
  "./manifest.webmanifest",
  "./assets/images/icons/icon-192x192.png",
  "./assets/images/icons/icon-512x512.png",
  "https://cdn.jsdelivr.net/npm/chart.js@2.8.0",
  "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"
];

self.addEventListener("install", function (evt) {
    
  // pre cache all static assets
  evt.waitUntil(
    caches.open(STATIC_CACHE_NAME)
	.then((cache) => {
		cache.addAll(FILES_TO_CACHE)
	})
		
  );

  self.skipWaiting();
});

// activate - removes any unused cache data
self.addEventListener("activate", function(evt) {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== STATIC_CACHE_NAME && key !== DATABASE_CACHE_NAME) {
            // console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// fetch - any time an call is made on the db, the service worker stores the request by the url
self.addEventListener("fetch", function(evt) {
  if (evt.request.url.includes("/api/")) {
    evt.respondWith(
      caches.open(DATABASE_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            if (response.status === 200) {
              	cache.put(evt.request.url, response.clone());
            }

            return response;
          })
          .catch(err => {
            return cache.match(evt.request);
          });
      }).catch(err => console.log(err))
    );
    return;
  }

  evt.respondWith(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      return cache.match(evt.request).then(response => {
        return response || fetch(evt.request);
      });
    })
  );
});
