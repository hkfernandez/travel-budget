const STATIC_CACHE_NAME = "static-cache-v1";
const DATABASE_CACHE_NAME = "data-cache-v2";
const FILES_TO_CACHE = [
  "/",
  "./assets/scripts/index.js",
  "./assets/scripts/swActivation.js",
  "./assets/css/styles.css",
  "./manifest.webmanifest",
  "./assets/images/icons/icon-192x192.png",
  "./assets/images/icons/icon-512x512.png"
];

// install
self.addEventListener("install", function (evt) {
	console.log('SERVICE WORKER INSTALLED');

  // pre cache database data
//   evt.waitUntil(
//     caches.open(DATABASE_CACHE_NAME)
// 	.then((cache) => cache.add("/api/images"))
//   );
    
  // pre cache all static assets
  evt.waitUntil(
    caches.open(STATIC_CACHE_NAME)
	.then((cache) => {
		console.log('CACHING STATIC DATA');
		cache.addAll(FILES_TO_CACHE)
	})
		
  );

  // tell the browser to activate this service worker immediately once it
  // has finished installing
  self.skipWaiting();
});

// activate - removes any unused cache data
self.addEventListener("activate", function(evt) {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== STATIC_CACHE_NAME && key !== DATABASE_CACHE_NAME) {
            console.log("Removing old cache data", key);
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
      caches.open(DATA_CACHE_NAME).then(cache => {
		console.log('EVENT.REQUEST ON THE FETCH EVENT INSIDE THE SERVICE WORKER',evt.request);
        return fetch(evt.request)
          .then(response => {
            if (response.status === 200) {
				console.log('RESPONSE AFTER FETCH', response);
				console.log('EVENT.REQUEST.URL', evt.request.url);
              	cache.put(evt.request.url, response.clone());
            }

            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
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
