/**
 * sanitize.js — Escape HTML utilities.
 * Versión única, importable desde cualquier página.
 * Equivalentes a esc(), escHtml(), escAttr() que existían duplicadas
 * en index.html, onboarding.html, galeria.html y gracias.html.
 */

const MAP = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };

export function escHtml(s){
  return String(s).replace(/[&<>"']/g, c => MAP[c]);
}

export function escAttr(s){
  return String(s).replace(/[&<>"']/g, c => MAP[c]);
}

// Alias corto compatible con `esc()` antiguo
export const esc = escHtml;
