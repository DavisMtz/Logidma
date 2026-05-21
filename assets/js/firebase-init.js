/**
 * firebase-init.js — Inicialización única de Firebase.
 * Reemplaza la duplicación de firebaseConfig que existe inline en
 * index.html, onboarding.html, galeria.html y proyectos.html.
 *
 * Cualquier página puede hacer:
 *   import { app, auth, db, stor, gProv } from './assets/js/firebase-init.js';
 *
 * Nota: las claves de Firebase son públicas por diseño. La seguridad
 * vive en firestore.rules y storage.rules.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  initializeAuth,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  browserPopupRedirectResolver,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

export const firebaseConfig = {
  apiKey:            "AIzaSyCiDKiKDvPkPIonnFrsWU-IJkpNIpfQt9g",
  authDomain:        "logidma.com",
  projectId:         "logidma-c1df8",
  storageBucket:     "logidma-c1df8.firebasestorage.app",
  messagingSenderId: "1089066225627",
  appId:             "1:1089066225627:web:29add3b175fb959fe221fe",
  measurementId:     "G-W5RG7GTTDK"
};

export const app   = initializeApp(firebaseConfig);
// Persistencia en capas: IndexedDB (mejor soporte iOS Safari) → localStorage → sessionStorage
export const auth  = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});
export const db    = getFirestore(app);
export const stor  = getStorage(app);
export const gProv = new GoogleAuthProvider();
