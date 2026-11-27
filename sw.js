// Setu Meet — সাধারণ service worker (অ্যাপ হিসেবে ইনস্টল করার জন্য)
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
