// Service Worker para PWA - Permite funcionamiento offline
// Este código se ejecuta en segundo plano

const CACHE_NAME = 'claudia-app-v2';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icon-192-v2.png',
    './icon-512-v2.png'
];

// INSTALACIÓN: Cuando se instala el Service Worker
self.addEventListener('install', (event) => {
    console.log('💖 Service Worker: Instalando...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('💖 Service Worker: Archivos guardados en caché');
                return cache.addAll(urlsToCache);
            })
    );
});

// ACTIVACIÓN: Cuando se activa el Service Worker
self.addEventListener('activate', (event) => {
    console.log('💖 Service Worker: Activado');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('💖 Service Worker: Eliminando caché antigua');
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// FETCH: Cuando se solicita un archivo
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Si está en caché, devolver desde caché
                if (response) {
                    return response;
                }

                // Si no, hacer petición a la red
                return fetch(event.request);
            })
    );
});
