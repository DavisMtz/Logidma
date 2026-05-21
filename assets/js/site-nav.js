/**
 * site-nav.js — Inyecta nav consistente en las páginas nuevas.
 *
 * Detecta la página actual y marca el link activo. Incluye mobile menu
 * con animación cinemática.
 *
 * Las páginas nuevas usan: <div id="siteNav"></div>
 * Las páginas legacy mantienen su nav inline.
 */

import { escHtml } from './sanitize.js';

const ITEMS = [
  { href: '/servicios.html',  label: 'Servicios' },
  { href: '/cotizador.html',  label: 'Cotizador' },
  { href: '/casos.html',      label: 'Casos' },
  { href: '/recursos.html',   label: 'Recursos' },
  { href: '/blog.html',       label: 'Blog' },
  { href: '/acerca-de.html',  label: 'Acerca' }
];

const CTA = { href: '/onboarding.html', label: 'Construir' };

function getCurrentPath(){
  const p = location.pathname;
  if (p === '/' || p === '' || p.endsWith('/index.html')) return '/index.html';
  return p;
}

function getActiveItem(){
  const cur = getCurrentPath();
  return ITEMS.find(i => cur.endsWith(i.href.replace(/^\//,'')));
}

function buildHtml(){
  const cur = getCurrentPath();
  const active = getActiveItem();

  const linksHtml = ITEMS.map(item => {
    const isActive = active && item.href === active.href;
    return `<a class="snav__link${isActive ? ' is-active' : ''}" href="${item.href}">${escHtml(item.label)}</a>`;
  }).join('');

  const mobileLinksHtml = ITEMS.map(item => {
    const isActive = active && item.href === active.href;
    return `<a class="snav__mlink${isActive ? ' is-active' : ''}" href="${item.href}">${escHtml(item.label)}</a>`;
  }).join('');

  const showCta = !cur.endsWith('/onboarding.html');

  return `
    <a href="/" class="snav__brand" aria-label="Logidma — inicio">
      <span class="snav__dot" aria-hidden="true"></span>
      <span class="snav__brand-txt">Logidma</span>
    </a>

    <nav class="snav__links" aria-label="Navegación principal">
      ${linksHtml}
    </nav>

    <div class="snav__right">
      ${showCta ? `<a class="snav__cta" href="${CTA.href}">${escHtml(CTA.label)}</a>` : ''}
      <button class="snav__hamburger" id="snavHamburger" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="snavMobile">
        <span></span><span></span><span></span>
      </button>
    </div>

    <div class="snav__mobile" id="snavMobile" role="dialog" aria-modal="true" aria-hidden="true">
      <div class="snav__mobile-inner">
        ${mobileLinksHtml}
        ${showCta ? `<a class="snav__mcta" href="${CTA.href}">${escHtml(CTA.label)} →</a>` : ''}
        <a class="snav__mcontact" href="https://wa.me/524431014385" target="_blank" rel="noopener">WhatsApp directo</a>
        <a class="snav__mcontact" href="mailto:contacto@logidma.com">contacto@logidma.com</a>
      </div>
    </div>
  `;
}

function ensureStyle(){
  if (document.getElementById('snav-style')) return;
  const link = document.createElement('link');
  link.id = 'snav-style';
  link.rel = 'stylesheet';
  link.href = '/assets/css/site-chrome.css';
  document.head.appendChild(link);
}

function bindMobile(root){
  const burger = root.querySelector('#snavHamburger');
  const mobile = root.querySelector('#snavMobile');
  if (!burger || !mobile) return;

  function open(){
    burger.classList.add('is-open');
    mobile.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    mobile.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function close(){
    burger.classList.remove('is-open');
    mobile.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    mobile.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  burger.addEventListener('click', () => {
    burger.classList.contains('is-open') ? close() : open();
  });
  mobile.addEventListener('click', e => {
    if (e.target === mobile) close();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobile.classList.contains('is-open')) close();
  });
  mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
}

export function mountNav(targetId = 'siteNav'){
  ensureStyle();
  const target = document.getElementById(targetId);
  if (!target) return;
  target.classList.add('snav');
  target.innerHTML = buildHtml();
  bindMobile(target);
}

// Auto-mount si hay un elemento esperándolo
if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', () => mountNav());
} else {
  mountNav();
}
