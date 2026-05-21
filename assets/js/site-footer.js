/**
 * site-footer.js — Footer consistente con sitemap completo.
 */

import { escHtml } from './sanitize.js';

const SECTIONS = [
  {
    title: 'Servicios',
    links: [
      { href: '/servicios.html', label: 'Catálogo' },
      { href: '/cotizador.html', label: 'Cotizador de ROI' },
      { href: '/casos.html', label: 'Casos de estudio' },
      { href: '/recursos.html', label: 'Recursos gratuitos' }
    ]
  },
  {
    title: 'Empresa',
    links: [
      { href: '/acerca-de.html', label: 'Acerca de DMA' },
      { href: '/onboarding.html', label: 'Construir sistema' },
      { href: '/cliente.html', label: 'Panel de cliente' },
      { href: '/galeria.html', label: 'Galería comunitaria' }
    ]
  },
  {
    title: 'Contacto',
    links: [
      { href: 'https://wa.me/524431014385', label: 'WhatsApp directo', ext: true },
      { href: 'mailto:contacto@logidma.com', label: 'contacto@logidma.com' },
      { href: 'https://www.linkedin.com/company/logidma/', label: 'LinkedIn', ext: true },
      { href: 'https://www.instagram.com/logidma', label: 'Instagram', ext: true }
    ]
  }
];

function buildHtml(){
  const year = new Date().getFullYear();
  const cols = SECTIONS.map(sec => `
    <div class="sfoot__col">
      <h3 class="sfoot__title">${escHtml(sec.title)}</h3>
      <ul class="sfoot__list">
        ${sec.links.map(l => `
          <li><a class="sfoot__link" href="${l.href}"${l.ext ? ' target="_blank" rel="noopener"' : ''}>${escHtml(l.label)}</a></li>
        `).join('')}
      </ul>
    </div>
  `).join('');

  return `
    <div class="sfoot__top">
      <div class="sfoot__brand">
        <a href="/" class="sfoot__brand-link" aria-label="Logidma">
          <span class="sfoot__brand-dot" aria-hidden="true"></span>
          <span class="sfoot__brand-name">Logidma</span>
        </a>
        <p class="sfoot__tag">La lógica, sistematizada.</p>
        <p class="sfoot__desc">Infraestructura Digital, Automatización y Blindaje Legal TI para empresas que quieren crecer ordenadas.</p>
      </div>
      <div class="sfoot__cols">
        ${cols}
      </div>
    </div>
    <div class="sfoot__bottom">
      <span class="sfoot__copy">© ${year} Logidma · DMA</span>
      <span class="sfoot__loc">Hecho en Morelia, México</span>
    </div>
  `;
}

export function mountFooter(targetId = 'siteFooter'){
  const target = document.getElementById(targetId);
  if (!target) return;
  target.classList.add('sfoot');
  target.innerHTML = buildHtml();
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', () => mountFooter());
} else {
  mountFooter();
}
