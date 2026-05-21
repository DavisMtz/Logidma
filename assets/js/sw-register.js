/**
 * sw-register.js — Registro silencioso del Service Worker.
 * Importa este módulo desde cualquier página para habilitar PWA + offline.
 *
 * No bloquea ni rompe nada si el navegador no soporta SW.
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .catch(() => {
        // Silencioso: no rompemos nada si falla el registro
      });
  });
}
