const CACHE_NAME = 'jardin-coran-v1.0.0';
const STATIC_CACHE = 'jardin-coran-static-v1.0.0';
const DYNAMIC_CACHE = 'jardin-coran-dynamic-v1.0.0';
const AUDIO_CACHE = 'jardin-coran-audio-v1.0.0';

// Ressources statiques à mettre en cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/Logo.svg',
  '/src/main.tsx',
  '/src/index.css'
];

// URLs des APIs à mettre en cache
const API_URLS = [
  'https://api.alquran.cloud/v1/surah',
  'https://api.alquran.cloud/v1/quran/quran-uthmani',
  'https://api.alquran.cloud/v1/quran/fr.hamidullah'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache des ressources statiques
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Pré-cache des données essentielles
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('Service Worker: Pre-caching essential data');
        return Promise.allSettled(
          API_URLS.map(url => 
            fetch(url)
              .then(response => response.ok ? cache.put(url, response) : null)
              .catch(err => console.log(`Failed to cache ${url}:`, err))
          )
        );
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== AUDIO_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Stratégie de cache pour les requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Stratégie pour les ressources statiques
  if (STATIC_ASSETS.some(asset => request.url.includes(asset))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Stratégie pour les fichiers audio
  if (request.url.includes('cdn.islamic.network/quran/audio') || 
      request.url.includes('.mp3') || 
      request.url.includes('.m4a')) {
    event.respondWith(cacheFirst(request, AUDIO_CACHE));
    return;
  }

  // Stratégie pour les APIs
  if (request.url.includes('api.alquran.cloud')) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }

  // Stratégie par défaut pour les autres ressources
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      request.destination === 'style') {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Pour tout le reste, essayer le réseau d'abord
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// Stratégie Cache First (pour les ressources statiques et audio)
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache:', request.url);
      return cachedResponse;
    }

    console.log('Service Worker: Fetching and caching:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Cache first failed:', error);
    
    // Fallback pour les documents
    if (request.destination === 'document') {
      const cache = await caches.open(STATIC_CACHE);
      return cache.match('/') || new Response('Application hors ligne', {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    throw error;
  }
}

// Stratégie Stale While Revalidate (pour les APIs et ressources dynamiques)
async function staleWhileRevalidate(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Lancer la requête réseau en arrière-plan
    const networkPromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        const responseClone = networkResponse.clone();
        await cache.put(request, responseClone);
      }
      return networkResponse;
    }).catch(err => {
      console.log('Service Worker: Network failed, using cache:', err);
      return null;
    });

    // Retourner immédiatement la réponse en cache si disponible
    if (cachedResponse) {
      console.log('Service Worker: Serving stale content:', request.url);
      networkPromise; // Continue en arrière-plan
      return cachedResponse;
    }

    // Sinon, attendre la réponse réseau
    console.log('Service Worker: Waiting for network:', request.url);
    return await networkPromise;
  } catch (error) {
    console.error('Service Worker: Stale while revalidate failed:', error);
    throw error;
  }
}

// Stratégie Network First (pour les nouvelles ressources)
async function networkFirst(request, cacheName) {
  try {
    console.log('Service Worker: Network first for:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache:', error);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Gestion des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then(size => {
      event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
    });
  }
});

// Utilitaires pour la gestion du cache
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    console.log('Service Worker: Background sync triggered');
    
    // Mettre à jour les données essentielles
    const cache = await caches.open(DYNAMIC_CACHE);
    
    for (const url of API_URLS) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.log(`Background sync failed for ${url}:`, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}