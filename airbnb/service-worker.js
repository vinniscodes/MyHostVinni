// Este é um service worker básico para funcionalidades offline futuras (PWA)
// Por enquanto, ele apenas registra sua presença.
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado com sucesso!');
});

self.addEventListener('fetch', (event) => {
  // Em uma implementação completa, aqui haveria a lógica de cache.
});