/**
 * auth.js — Módulo central de autenticación Firebase.
 *
 * Exporta helpers usados por index.html, admin.html y onboarding.html.
 * Las páginas que solo escuchan el estado (galeria, proyectos, cliente)
 * pueden importar { auth } de firebase-init.js directamente.
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
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

/* ── Mensajes de error en español ──────────────────── */
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
  // Silenciosos — no mostrar al usuario
  'auth/popup-closed-by-user':    null,
  'auth/cancelled-popup-request': null,
  'auth/popup-blocked':           null,
  'auth/no-auth-event':           null,
};

export function authErrMsg(code) {
  if (code in ERR_MSGS) return ERR_MSGS[code];
  return 'Ocurrió un error. Inténtalo de nuevo.';
}

/* ── Google Sign-In (popup → redirect en iOS/móvil) ─ */
export async function googleSignIn() {
  try {
    const result = await signInWithPopup(auth, gProv);
    return { user: result.user };
  } catch (err) {
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, gProv);
      return { redirecting: true };
    }
    // El usuario cerró el popup: no es error real
    if (err.code === 'auth/popup-closed-by-user') return { cancelled: true };
    return { error: authErrMsg(err.code) };
  }
}

/* ── Captura el resultado del redirect al cargar la página ── */
export async function checkRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    return { user: result?.user ?? null };
  } catch (err) {
    if (!err?.code || err.code === 'auth/no-auth-event') return { user: null };
    // internal-error o unauthorized-domain casi siempre = problema de dominio
    const msg =
      err.code === 'auth/internal-error' || err.code === 'auth/unauthorized-domain'
        ? 'No se pudo completar el inicio de sesión con Google. Intenta con correo y contraseña.'
        : authErrMsg(err.code);
    return { user: null, error: msg };
  }
}

/* ── Email / Contraseña ─────────────────────────────── */
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

/* ── Utilidades ─────────────────────────────────────── */
export const logout    = () => signOut(auth);
export const watchAuth = (cb) => onAuthStateChanged(auth, cb);
