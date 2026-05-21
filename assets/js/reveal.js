/**
 * reveal.js — Scroll reveal cinemático compartido.
 *
 * Cualquier elemento con [data-reveal] se anima al entrar al viewport.
 * Variantes opcionales:
 *   data-reveal="up"     (default — translateY)
 *   data-reveal="left"   (translateX desde la izquierda)
 *   data-reveal="right"  (translateX desde la derecha)
 *   data-reveal="zoom"   (scale up)
 *   data-reveal="fade"   (solo opacity)
 *   data-reveal-delay="120"  (ms de delay)
 *
 * Respeta prefers-reduced-motion.
 */

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ensureStyle(){
  if (document.getElementById('reveal-style')) return;
  const style = document.createElement('style');
  style.id = 'reveal-style';
  style.textContent = `
    [data-reveal]{
      opacity: 0;
      transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1);
      will-change: opacity, transform;
    }
    [data-reveal="up"]    { transform: translateY(36px); }
    [data-reveal="left"]  { transform: translateX(-36px); }
    [data-reveal="right"] { transform: translateX(36px); }
    [data-reveal="zoom"]  { transform: scale(.94); }
    [data-reveal="fade"]  { transform: none; }
    [data-reveal].is-revealed{
      opacity: 1;
      transform: none;
    }
    @media (prefers-reduced-motion: reduce){
      [data-reveal]{ opacity: 1 !important; transform: none !important; transition: none !important; }
    }
  `;
  document.head.appendChild(style);
}

function init(){
  if (reduce) {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-revealed'));
    return;
  }
  ensureStyle();

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        const el = entry.target;
        const delay = parseInt(el.dataset.revealDelay || '0', 10);
        setTimeout(() => el.classList.add('is-revealed'), delay);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });

  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
