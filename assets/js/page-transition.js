/**
 * page-transition.js — Transición entre páginas con el logo animado de Logidma.
 * Muestra el overlay del logo SVG durante 380ms antes de navegar.
 *
 * Respeta prefers-reduced-motion: navega instantáneo si se prefiere.
 * Auto-skip: target=_blank, modificadores, anchors (#), mailto, tel, externos.
 */

import { showLoading, hideLoading } from './loading.js';

const DURATION = 380;

function isInternalNav(a) {
  if (!a || !a.href) return false;
  if (a.target === '_blank') return false;
  if (a.hasAttribute('download')) return false;
  const href = a.getAttribute('href') || '';
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return false;
  try {
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return false;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return false;
    return true;
  } catch {
    return false;
  }
}

function triggerTransition(href) {
  showLoading();
  setTimeout(() => { window.location.href = href; }, DURATION);
}

function init() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.addEventListener('click', e => {
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const a = e.target && e.target.closest('a[href]');
    if (!isInternalNav(a)) return;
    e.preventDefault();
    triggerTransition(a.href);
  }, { capture: false });

  window.addEventListener('pageshow', () => hideLoading());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
