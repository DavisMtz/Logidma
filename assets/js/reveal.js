/**
 * reveal.js — Scroll reveal cinemático con GSAP ScrollTrigger.
 *
 * Cualquier elemento con [data-reveal] se anima al entrar al viewport.
 * Variantes:
 *   data-reveal="up"     (default — translateY)
 *   data-reveal="left"   (translateX)
 *   data-reveal="right"  (translateX)
 *   data-reveal="zoom"   (scale + translateY)
 *   data-reveal="fade"   (solo opacity)
 *   data-reveal-delay="120"  (ms de delay)
 *
 * Grupos: [data-reveal-group] anima a sus hijos con stagger.
 * Respeta prefers-reduced-motion.
 */

import { initGSAP } from './gsap-init.js';

const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function getFromVars(dir) {
  if (dir === 'left')  return { x: -44 };
  if (dir === 'right') return { x:  44 };
  if (dir === 'zoom')  return { scale: 0.93, y: 18 };
  if (dir === 'fade')  return {};
  return { y: 44 };
}

async function init() {
  const els   = document.querySelectorAll('[data-reveal]');
  const groups = document.querySelectorAll('[data-reveal-group]');
  if (!els.length && !groups.length) return;

  if (REDUCE) {
    els.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    return;
  }

  const { gsap, ScrollTrigger } = await initGSAP();

  els.forEach(el => {
    const dir   = el.dataset.reveal || 'up';
    const delay = parseInt(el.dataset.revealDelay || '0', 10) / 1000;

    gsap.from(el, {
      opacity: 0,
      duration: 1,
      delay,
      ...getFromVars(dir),
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  groups.forEach(group => {
    const items = Array.from(group.children);
    if (!items.length) return;
    gsap.from(items, {
      opacity: 0,
      y: 32,
      duration: 0.85,
      stagger: 0.1,
      scrollTrigger: { trigger: group, start: 'top 85%', once: true }
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
