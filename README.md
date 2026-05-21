# Logidma

> **La lógica, sistematizada.** Infraestructura digital, automatización y blindaje legal TI para empresas.

Sitio oficial de [logidma.com](https://logidma.com) — la firma de **David Martínez Arredondo (DMA)**.

---

## Qué es

Sitio estático multi-página servido desde GitHub Pages, con autenticación y datos en Firebase (Auth + Firestore + Storage) y formularios sincronizados a Google Sheets vía Apps Script.

### Páginas

| Ruta | Propósito |
|---|---|
| `index.html` | Landing — narrativa, oferta, formulario de contacto, modal de auth |
| `servicios.html` | Catálogo público con 3 rutas (Workspace, Automatización, Blindaje) y CTAs precargando onboarding |
| `cotizador.html` | Calculadora interactiva de ROI con sliders; el CTA preset al onboarding con ahorro y servicio |
| `casos.html` | Casos de estudio con métricas reales y filtros por categoría |
| `recursos.html` | Lead magnets gratuitos (NDA, checklists, guías) con modal de email + honeypot |
| `acerca-de.html` | Historia, filosofía, equipo (DMA) |
| `onboarding.html` | Flujo multi-paso para construir tu sistema (acepta prefill por `?nombre=&proyecto=&servicio=`) |
| `cliente.html` | Panel privado para clientes autenticados (proyectos, hitos, soporte) |
| `proyectos.html` | Área de proyectos (requiere autenticación) |
| `galeria.html` | Galería comunitaria con retos mensuales (requiere autenticación) |
| `gracias.html` | Confirmación post-envío con próximos pasos, ID de seguimiento y WhatsApp personalizado |
| `404.html` | Página de error con la estética del sitio |

---

## Stack

- **Frontend**: HTML5 + CSS3 + JavaScript (módulos ES6, sin framework, sin bundler)
- **Auth + DB + Storage**: Firebase 10.12.2 (CDN modular)
- **Formularios**: Google Apps Script → Google Sheets
- **Tipografías**: Instrument Serif, JetBrains Mono, Manrope (Google Fonts)
- **Hosting**: GitHub Pages + dominio custom (`CNAME`)
- **Reglas backend**: `firestore.rules` + `storage.rules` versionadas en el repo

---

## Cómo correr en local

No requiere build. Cualquier servidor HTTP estático funciona:

```bash
# Opción 1: Python
python3 -m http.server 8000

# Opción 2: Node
npx serve .

# Opción 3: VS Code
# Extensión "Live Server" → click derecho en index.html → "Open with Live Server"
```

Luego abre `http://localhost:8000`.

> ⚠️ **No abras el HTML con `file://`** — Firebase Auth y las llamadas a Apps Script requieren un origen HTTP válido.

---

## Estructura

```
.
├── index.html              # Landing
├── servicios.html          # Catálogo de servicios
├── cotizador.html          # Calculadora interactiva de ROI
├── casos.html              # Casos de estudio con métricas
├── recursos.html           # Lead magnets (NDA, checklists, guías)
├── acerca-de.html
├── onboarding.html
├── cliente.html            # Panel autenticado
├── proyectos.html
├── galeria.html
├── gracias.html            # Confirmación post-submit
├── 404.html
├── sw.js                   # Service Worker (PWA + offline)
├── assets/
│   ├── js/
│   │   ├── firebase-init.js   # Init único de Firebase
│   │   ├── sanitize.js        # escHtml, escAttr
│   │   ├── forms.js           # submitToAppsScript, genTrackId
│   │   ├── analytics.js       # track(), trackPageView()
│   │   └── sw-register.js     # Registro del service worker
│   └── css/
├── sitemap.xml
├── robots.txt
├── manifest.json
├── firebase.json           # Config de despliegue de rules
├── firestore.rules         # Reglas de seguridad de Firestore
├── storage.rules           # Reglas de seguridad de Storage
├── CNAME                   # Dominio: logidma.com
└── README.md
```

### PWA + Service Worker

`sw.js` cachea las páginas estáticas y las fuentes para que:
- El sitio funciona **offline** (excepto Firebase y Apps Script, que requieren red).
- Las cargas siguientes son **instantáneas**.
- El sitio puede **instalarse** como app desde el menú del navegador.

Para invalidar el caché, sube la constante `VERSION` en `sw.js`.

### Anti-bot

- **Honeypot** en los forms de `index.html`, `onboarding.html` y `recursos.html`:
  campo invisible llamado `empresa_url`. Si lo llenan, fingimos éxito sin enviar.
- Apps Script puede añadir validación adicional server-side (rate-limit por IP,
  validación de dominios de email, etc.).

### Módulos JavaScript compartidos (`assets/js/`)

Las nuevas páginas (`servicios.html`, `cliente.html`) usan módulos ES6 importables.
Las páginas legacy (`index.html`, `onboarding.html`, etc.) mantienen su Firebase config
inline para no romper su flujo actual — la consolidación es un refactor futuro.

```javascript
// Ejemplo de uso en una nueva página
import { auth, db } from './assets/js/firebase-init.js';
import { escHtml } from './assets/js/sanitize.js';
import { submitToAppsScript, genTrackId } from './assets/js/forms.js';
import { track } from './assets/js/analytics.js';
```

---

## Despliegue

Push a `main` → GitHub Pages publica automáticamente.

CI (`.github/workflows/ci.yml`) valida en cada push:
- HTMLhint sobre todos los `.html`
- Que los módulos JS parseen (`node --check`)
- Que existan `sitemap.xml`, `robots.txt`, `404.html`, `manifest.json`
- Smoke test: cada página devuelve 200 desde un server local

### Scripts útiles (`package.json`)

```bash
npm run serve         # Servidor local en http://localhost:8000
npm run lint:html     # Validar HTML con htmlhint
npm run format:check  # Verificar formato con Prettier
```

### Despliegue de reglas de Firebase

Solo necesario cuando cambies `firestore.rules` o `storage.rules`:

```bash
# Requiere Firebase CLI: npm i -g firebase-tools
firebase login
firebase deploy --only firestore:rules,storage
```

### Apps Script (CRM backend)

El código que recibe los formularios vive en `apps-script/Code.gs`. Ver
`apps-script/README.md` para instalación y despliegue. Hace:
- Persistencia en 3 pestañas de Sheets (Contacto, Onboarding, Lead Magnets).
- Auto-respuesta al lead con plantilla HTML estilo Logidma.
- Notificación al equipo.
- Envío del recurso descargable cuando origen es `lead_magnet`.

---

## Integraciones

| Servicio | Uso | Ubicación de credenciales |
|---|---|---|
| **Firebase Auth** | Login con Google | `firebaseConfig` inline (pública por diseño) |
| **Firestore** | `posts`, `posts/{id}/likes`, retos mensuales | Reglas en `firestore.rules` |
| **Firebase Storage** | Uploads de galería | Reglas en `storage.rules` |
| **Google Apps Script** | Forms → Sheets | URL inline (POST `no-cors`) |
| **WhatsApp** | Contacto directo | `wa.me/524431014385` |
| **Email** | Contacto | `contacto@logidma.com` |

> Las claves de Firebase **son públicas por diseño** (cliente JS). La seguridad real vive en las reglas Firestore/Storage.

---

## Convenciones

- **Paleta**: `--bg #0a0908`, `--accent #c4ff3a`, `--cream #ebe5d6`, `--bronze #b08d57`
- **Easings**: `--e-expo`, `--e-quart`, `--e-circ`, `--e-back` (cubic-bezier definidas en `:root` de cada HTML)
- **Tipografía**: Instrument Serif (display), Manrope (cuerpo), JetBrains Mono (etiquetas/código)
- **Idioma**: Español (México)

---

## Contacto

- **WhatsApp**: [+52 443 101 4385](https://wa.me/524431014385)
- **Email**: contacto@logidma.com
- **Instagram**: [@logidma](https://www.instagram.com/logidma)
- **LinkedIn**: [Logidma](https://www.linkedin.com/company/logidma/)

---

## Licencia

© Logidma — Todos los derechos reservados.
