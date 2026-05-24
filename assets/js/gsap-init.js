/**
 * gsap-init.js — Carga GSAP + ScrollTrigger via CDN y registra plugins.
 * Devuelve una promesa cacheada: llama initGSAP() cuantas veces quieras.
 */

const GSAP_URL = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js';
const ST_URL   = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`GSAP CDN load failed: ${src}`));
    document.head.appendChild(s);
  });
}

let _promise = null;

export async function initGSAP() {
  if (_promise) return _promise;
  _promise = (async () => {
    if (!window.gsap)          await loadScript(GSAP_URL);
    if (!window.ScrollTrigger) await loadScript(ST_URL);
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: 'expo.out', overwrite: 'auto' });
    ScrollTrigger.defaults({ toggleActions: 'play none none none', start: 'top 88%' });
    return { gsap: window.gsap, ScrollTrigger: window.ScrollTrigger };
  })();
  return _promise;
}
