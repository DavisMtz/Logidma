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
import { initGSAP } from './gsap-init.js';

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

  let isOpen = false;

  async function open(){
    if (isOpen) return;
    isOpen = true;
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    mobile.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const { gsap } = await initGSAP();
    const items = mobile.querySelectorAll('.snav__mlink, .snav__mcta, .snav__mcontact');
    mobile.style.pointerEvents = 'auto';

    gsap.timeline()
      .to(mobile,  { opacity: 1, duration: 0.38, ease: 'expo.out' })
      .from(items, { opacity: 0, y: 22, duration: 0.55, stagger: 0.06, ease: 'expo.out' }, 0.1);
  }

  async function close(){
    if (!isOpen) return;
    isOpen = false;
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    mobile.setAttribute('aria-hidden', 'true');

    const { gsap } = await initGSAP();
    gsap.to(mobile, {
      opacity: 0,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: () => {
        mobile.style.pointerEvents = 'none';
        document.body.style.overflow = '';
      }
    });
  }

  burger.addEventListener('click', () => isOpen ? close() : open());
  mobile.addEventListener('click', e => { if (e.target === mobile) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) close();
  });
  mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
}

export async function mountNav(targetId = 'siteNav'){
  ensureStyle();
  const target = document.getElementById(targetId);
  if (!target) return;
  target.classList.add('snav');
  target.innerHTML = buildHtml();
  bindMobile(target);

  // Animate nav entrance with GSAP
  const { gsap } = await initGSAP();
  gsap.from(target, { opacity: 0, y: -14, duration: 0.9, ease: 'expo.out', delay: 0.15 });
}

// Auto-mount si hay un elemento esperándolo
if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', () => mountNav());
} else {
  mountNav();
}
