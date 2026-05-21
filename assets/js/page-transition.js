/**
 * page-transition.js — Transición cinemática entre páginas.
 *
 * Al hacer click en un link interno, despliega un velo lime → fade,
 * espera 480ms y navega. Combina con la entrada cinemática de la página
 * destino para sensación de continuidad.
 *
 * Respeta prefers-reduced-motion: si el usuario lo pidió, navega instantáneo.
 *
 * Inyectado idempotente: si ya hay un veil, lo reutiliza.
 * Auto-skip: target=_blank, modificadores (Ctrl/Cmd/Shift), anchors (#),
 * mailto, tel y links externos no se interceptan.
 */

const VEIL_ID = 'logidma-page-veil';
const DURATION = 480;

function ensureVeilStyle(){
  if (document.getElementById('logidma-veil-style')) return;
  const style = document.createElement('style');
  style.id = 'logidma-veil-style';
  style.textContent = `
    #${VEIL_ID}{
      position: fixed; inset: 0; z-index: 99999;
      background: #0a0908;
      opacity: 0; pointer-events: none;
      transition: opacity ${DURATION}ms cubic-bezier(0.85, 0, 0.15, 1);
      display: flex; align-items: center; justify-content: center;
    }
    #${VEIL_ID}.is-active{ opacity: 1; pointer-events: auto; }
    #${VEIL_ID} .logidma-veil__pulse{
      width: 12px; height: 12px; border-radius: 50%;
      background: #c4ff3a;
      box-shadow: 0 0 24px rgba(196,255,58,0.6);
      transform: scale(0);
      animation: logidmaVeilPulse 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    #${VEIL_ID}.is-active .logidma-veil__pulse{ animation-play-state: running; }
    @keyframes logidmaVeilPulse{
      0%{ transform: scale(0); opacity: 0; }
      50%{ transform: scale(1.2); opacity: 1; }
      100%{ transform: scale(0.8); opacity: 0.5; }
    }
    @media (prefers-reduced-motion: reduce){
      #${VEIL_ID}{ transition: none !important; }
      #${VEIL_ID} .logidma-veil__pulse{ animation: none !important; }
    }
  `;
  document.head.appendChild(style);
}

function ensureVeil(){
  let veil = document.getElementById(VEIL_ID);
  if (!veil){
    veil = document.createElement('div');
    veil.id = VEIL_ID;
    veil.setAttribute('aria-hidden', 'true');
    veil.innerHTML = '<div class="logidma-veil__pulse" aria-hidden="true"></div>';
    document.body.appendChild(veil);
  }
  return veil;
}

function isInternalNav(a){
  if (!a || !a.href) return false;
  if (a.target === '_blank') return false;
  if (a.hasAttribute('download')) return false;
  const href = a.getAttribute('href') || '';
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return false;
  try {
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return false;
    // Mismo path + solo cambia hash → no es navegación
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return false;
    return true;
  } catch (e){
    return false;
  }
}

function triggerTransition(href){
  ensureVeilStyle();
  const veil = ensureVeil();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      veil.classList.add('is-active');
      setTimeout(() => { window.location.href = href; }, DURATION);
    });
  });
}

function init(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; // no interceptar, dejar navegación nativa

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const a = e.target && e.target.closest('a[href]');
    if (!isInternalNav(a)) return;
    e.preventDefault();
    triggerTransition(a.href);
  }, { capture: false });

  // Al volver con back/forward, asegurar que el velo esté oculto
  window.addEventListener('pageshow', () => {
    const veil = document.getElementById(VEIL_ID);
    if (veil) veil.classList.remove('is-active');
  });
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
