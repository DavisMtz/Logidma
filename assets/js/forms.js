/**
 * forms.js — Wrapper único para enviar formularios al Apps Script.
 * Reemplaza las funciones sendSheets() duplicadas en index.html y onboarding.html.
 *
 * Uso:
 *   import { submitToAppsScript, genTrackId } from './assets/js/forms.js';
 *   const trackId = genTrackId();
 *   await submitToAppsScript({ ...data, trackId, origen: 'mi-form' });
 *
 * Mantiene exactamente el mismo comportamiento que el flujo original:
 * - mode: 'no-cors' (no permite leer respuesta)
 * - Content-Type: text/plain (evita preflight CORS)
 * - JSON.stringify del payload
 */

export const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyeHTmABdGjckQ04nPUbMh0KblMNbXXVa3lq_-UzJhEsiHx4oPvFdRgM6gvLtpZuCGV/exec';

export function genTrackId(){
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2,6).toUpperCase();
  return `LGD-${ts}-${rand}`;
}

export async function submitToAppsScript(data){
  await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(data)
  });
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^[\d+\-()\s]{7,20}$/;

export function isValidEmail(s){ return EMAIL_RE.test(String(s||'').trim()); }
export function isValidPhone(s){ return PHONE_RE.test(String(s||'').trim()); }

export function nowMX(){
  return new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
}
