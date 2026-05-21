/**
 * analytics.js — Eventos de tracking ligeros.
 * Por ahora es un stub que envía al dataLayer (GTM) si está disponible
 * o a window.plausible si Plausible está cargado. Sin Plausible/GTM
 * configurado, no hace nada (no rompe).
 *
 * Uso:
 *   import { track } from './assets/js/analytics.js';
 *   track('form_submit', { form: 'onboarding', trackId });
 *
 * Para activar Plausible en el futuro, añade en el <head>:
 *   <script defer data-domain="logidma.com" src="https://plausible.io/js/script.js"></script>
 */

export function track(eventName, props){
  try{
    if (typeof window === 'undefined') return;
    // Plausible
    if (typeof window.plausible === 'function'){
      window.plausible(eventName, { props });
    }
    // GA4 via gtag
    if (typeof window.gtag === 'function'){
      window.gtag('event', eventName, props || {});
    }
    // GTM dataLayer
    if (Array.isArray(window.dataLayer)){
      window.dataLayer.push({ event: eventName, ...props });
    }
  }catch(e){
    // Nunca romper la UX por analytics
  }
}

export function trackPageView(path){
  track('pageview', { path: path || (typeof location !== 'undefined' ? location.pathname : '/') });
}
