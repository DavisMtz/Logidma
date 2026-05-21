/**
 * auth.js — Módulo central de autenticación Firebase.
 *
 * Estrategia cross-device:
 *  - iOS / Android → signInWithRedirect directo (popup no confiable en Safari)
 *  - Desktop       → signInWithPopup, con fallback a redirect para CUALQUIER error
 *
 * Se pasa browserPopupRedirectResolver explícitamente en todas las llamadas
 * para evitar comportamientos indefinidos con initializeAuth en iOS Safari.
 */

import { auth, gProv } from './firebase-init.js';
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  browserPopupRedirectResolver,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// iOS Safari y Android no soportan popup de forma confiable
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

/* ── Mensajes de error en español ──────────────────────── */
const ERR_MSGS = {
  'auth/invalid-email':           'Correo inválido.',
  'auth/user-not-found':          'No existe cuenta con ese correo.',
  'auth/wrong-password':          'Contraseña incorrecta.',
  'auth/invalid-credential':      'Correo o contraseña incorrectos.',
  'auth/email-already-in-use':    'Ese correo ya está registrado.',
  'auth/weak-password':           'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests':       'Demasiados intentos. Espera un momento.',
  'auth/network-request-failed':  'Sin conexión. Verifica tu red.',
  'auth/unauthorized-domain':     'Dominio no autorizado. Contacta al administrador.',
  'auth/operation-not-allowed':   'Este método de inicio de sesión no está habilitado.',
  'auth/internal-error':          'Error interno. Inténtalo de nuevo.',
  'auth/user-disabled':           'Esta cuenta ha sido deshabilitada.',
  // Silenciosos — usuario canceló o ya hay un flujo en curso
  'auth/popup-closed-by-user':    null,
  'auth/cancelled-popup-request': null,
  'auth/popup-blocked':           null,
  'auth/no-auth-event':           null,
};

export function authErrMsg(code) {
  return code in ERR_MSGS ? ERR_MSGS[code] : 'Ocurrió un error. Inténtalo de nuevo.';
}

/* ── Google Sign-In ─────────────────────────────────────
 *  Retorna uno de:
 *    { user }          → éxito con popup (solo desktop)
 *    { redirecting }   → la página navegará a Google (móvil / fallback)
 *    { cancelled }     → usuario cerró popup voluntariamente
 *    { error }         → mensaje legible para mostrar al usuario
 * ──────────────────────────────────────────────────────── */
export async function googleSignIn() {
  // ── Móvil: ir directo a redirect, sin intentar popup ──
  if (isMobile) {
    try {
      await signInWithRedirect(auth, gProv, browserPopupRedirectResolver);
      return { redirecting: true };
    } catch (err) {
      console.error('[auth] signInWithRedirect error:', err.code, err.message);
      return { error: authErrMsg(err.code) };
    }
  }

  // ── Desktop: popup con fallback a redirect ──
  try {
    const result = await signInWithPopup(auth, gProv, browserPopupRedirectResolver);
    return { user: result.user };
  } catch (err) {
    // El usuario cerró el popup voluntariamente → no mostrar error, solo re-habilitar
    if (err.code === 'auth/popup-closed-by-user') return { cancelled: true };

    // Cualquier otro error (popup-blocked, internal-error, etc.) → fallback a redirect
    console.warn('[auth] popup falló, intentando redirect. Código:', err.code);
    try {
      await signInWithRedirect(auth, gProv, browserPopupRedirectResolver);
      return { redirecting: true };
    } catch (redirectErr) {
      console.error('[auth] redirect fallback error:', redirectErr.code, redirectErr.message);
      return { error: authErrMsg(redirectErr.code) };
    }
  }
}

/* ── Procesa el resultado del redirect al cargar la página ──
 *  Llamar en TODAS las páginas que tienen Google Sign-In.
 *  Retorna { user } si volvió de un redirect exitoso,
 *           { error } si falló, o {} si no había redirect.
 * ──────────────────────────────────────────────────────── */
export async function checkRedirectResult() {
  try {
    const result = await getRedirectResult(auth, browserPopupRedirectResolver);
    return { user: result?.user ?? null };
  } catch (err) {
    if (!err?.code || err.code === 'auth/no-auth-event') return { user: null };
    const msg =
      err.code === 'auth/internal-error' || err.code === 'auth/unauthorized-domain'
        ? 'No se pudo completar el inicio de sesión con Google. Intenta con correo y contraseña.'
        : authErrMsg(err.code);
    return { user: null, error: msg };
  }
}

/* ── Email / Contraseña ─────────────────────────────────── */
export async function emailSignIn(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user };
  } catch (err) {
    return { error: authErrMsg(err.code) };
  }
}

export async function emailRegister(email, password) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return { user: result.user };
  } catch (err) {
    return { error: authErrMsg(err.code) };
  }
}

/* ── Utilidades ─────────────────────────────────────────── */
export const logout    = () => signOut(auth);
export const watchAuth = (cb) => onAuthStateChanged(auth, cb);
