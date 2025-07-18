// Service Worker para Transporte Esmeralda PWA
// Version: 1.0.2

const CACHE_NAME = 'esmeralda-driver-v3';
const STATIC_CACHE = 'esmeralda-static-v3';
const DYNAMIC_CACHE = 'esmeralda-dynamic-v3';
const API_CACHE = 'esmeralda-api-v3';

// URLs para cache estático
const STATIC_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

// Patrones de URLs para cache dinámico
const CACHE_PATTERNS = {
  api: /^\/api\/(deliveries|conductor|locations)/,
  images: /\.(jpg|jpeg|png|gif|webp|svg)$/,
  fonts: /\.(woff|woff2|eot|ttf|otf)$/,
  static: /\.(css|js)$/
};

// Configuración de cache por tipo
const CACHE_STRATEGIES = {
  static: 'cache-first',
  api: 'network-first',
  images: 'cache-first',
  default: 'network-first'
};

// Eventos del Service Worker

// Manejar mensajes
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Instalación
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');

  event.waitUntil(
    Promise.all([
      // Cache estático
      caches.open(STATIC_CACHE).then(async (cache) => {
        console.log('[SW] Caching static assets');

        // Cachear URLs una por una para evitar fallos
        const cachePromises = STATIC_URLS.map(async (url) => {
          try {
            await cache.add(url);
            console.log(`[SW] Cached: ${url}`);
          } catch (error) {
            console.warn(`[SW] Failed to cache: ${url}`, error);
          }
        });

        await Promise.allSettled(cachePromises);
      }),
      // Skip waiting para activar inmediatamente
      self.skipWaiting()
    ])
  );
});

// Activación
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');

  event.waitUntil(
    Promise.all([
      // Limpiar caches viejos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME &&
                     cacheName !== STATIC_CACHE &&
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== API_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Claim todos los clientes
      self.clients.claim()
    ])
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar requests HTTP(S)
  if (!request.url.startsWith('http')) return;

  // Estrategia según el tipo de request
  if (CACHE_PATTERNS.api.test(url.pathname)) {
    event.respondWith(handleApiRequest(request));
  } else if (CACHE_PATTERNS.images.test(url.pathname)) {
    event.respondWith(handleImageRequest(request));
  } else if (CACHE_PATTERNS.static.test(url.pathname)) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handleDefaultRequest(request));
  }
});

// Estrategias de cache

// Network First para APIs
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);

    // Solo cachear peticiones GET exitosas para APIs
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Network failed for API, trying cache:', request.url);

    // Solo buscar en caché para peticiones GET
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Respuesta offline para APIs
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'No hay conexión a internet'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Cache First para imágenes
async function handleImageRequest(request) {
  // Solo cachear peticiones GET para imágenes
  if (request.method === 'GET') {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }
  }

  try {
    const response = await fetch(request);

    // Solo cachear peticiones GET exitosas
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Imagen placeholder offline solo para GET
    if (request.method === 'GET') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#6b7280">Sin imagen</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }

    // Para otros métodos, devolver error
    return new Response('Offline', { status: 503 });
  }
}

// Cache First para archivos estáticos
async function handleStaticRequest(request) {
  // Solo cachear peticiones GET para archivos estáticos
  if (request.method === 'GET') {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }
  }

  try {
    const response = await fetch(request);

    // Solo cachear peticiones GET exitosas
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Para archivos estáticos, devolver error si no está en caché
    return new Response('Offline', { status: 503 });
  }
}

// Network First para páginas
async function handleDefaultRequest(request) {
  try {
    const response = await fetch(request);

    // Solo cachear peticiones GET exitosas
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Solo buscar en caché para peticiones GET
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Página offline para navegación
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }

    return new Response('Offline', { status: 503 });
  }
}

// Background Sync para sincronización de datos
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'location-sync') {
    event.waitUntil(syncLocation());
  } else if (event.tag === 'delivery-sync') {
    event.waitUntil(syncDeliveries());
  } else if (event.tag === 'photos-sync') {
    event.waitUntil(syncPhotos());
  }
});

// Sincronizar ubicación
async function syncLocation() {
  try {
    const locationData = await getStoredLocationData();

    if (locationData.length > 0) {
      const response = await fetch('/api/conductor/location/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ locations: locationData })
      });

      if (response.ok) {
        await clearStoredLocationData();
        console.log('[SW] Location data synced successfully');
      }
    }
  } catch (error) {
    console.error('[SW] Location sync failed:', error);
  }
}

// Sincronizar entregas
async function syncDeliveries() {
  try {
    const deliveryUpdates = await getStoredDeliveryUpdates();

    for (const update of deliveryUpdates) {
      const response = await fetch(`/api/conductor/delivery/${update.id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(update.data)
      });

      if (response.ok) {
        await removeStoredDeliveryUpdate(update.id);
      }
    }

    console.log('[SW] Delivery updates synced successfully');
  } catch (error) {
    console.error('[SW] Delivery sync failed:', error);
  }
}

// Sincronizar fotos
async function syncPhotos() {
  try {
    const pendingPhotos = await getStoredPendingPhotos();

    for (const photo of pendingPhotos) {
      const formData = new FormData();
      formData.append('image', photo.blob);
      formData.append('type', photo.type);
      formData.append('delivery_id', photo.deliveryId);

      const response = await fetch('/api/conductor/upload-image', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        await removeStoredPendingPhoto(photo.id);
      }
    }

    console.log('[SW] Photos synced successfully');
  } catch (error) {
    console.error('[SW] Photo sync failed:', error);
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = {};

  if (event.data) {
    data = event.data.json();
  }

  const options = {
    title: data.title || 'Transporte Esmeralda',
    body: data.body || 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/icons/open-24x24.png'
      },
      {
        action: 'dismiss',
        title: 'Cerrar',
        icon: '/icons/close-24x24.png'
      }
    ],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false
  };

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/conductor/dashboard';

    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Buscar ventana existente
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }

        // Abrir nueva ventana
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Funciones auxiliares para IndexedDB (simplificadas)
async function getStoredLocationData() {
  // Implementar IndexedDB para obtener datos de ubicación almacenados
  return [];
}

async function clearStoredLocationData() {
  // Implementar limpieza de datos de ubicación
}

async function getStoredDeliveryUpdates() {
  // Implementar IndexedDB para obtener actualizaciones de entrega
  return [];
}

async function removeStoredDeliveryUpdate(id) {
  // Implementar eliminación de actualización específica
}

async function getStoredPendingPhotos() {
  // Implementar IndexedDB para obtener fotos pendientes
  return [];
}

async function removeStoredPendingPhoto(id) {
  // Implementar eliminación de foto específica
}

console.log('[SW] Service Worker loaded successfully');
