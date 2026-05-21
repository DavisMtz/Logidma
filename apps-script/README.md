# Apps Script — Logidma CRM Backend

Código que vive en [Google Apps Script](https://script.google.com), no en el sitio. Recibe los submissions de los formularios y los procesa.

## Qué hace

1. **Recibe** POST de los formularios (`index.html`, `onboarding.html`, `recursos.html`).
2. **Bloquea bots** vía honeypot (campo `empresa_url`).
3. **Persiste** cada lead en Google Sheets (una pestaña por tipo de form).
4. **Notifica al equipo** por correo con todos los datos del lead.
5. **Auto-responde al lead** con un correo HTML con la estética de Logidma.
6. **Envía recursos** (lead magnets) si el origen es `recursos.html`.

## Instalación

### 1. Crear el Sheet de CRM

1. Crea un nuevo Google Sheet (vacío). Las pestañas se auto-crean cuando llegan datos.
2. Copia el **ID** de la URL: `https://docs.google.com/spreadsheets/d/<ESTE_ID>/edit`

### 2. Crear el script

1. Ve a https://script.google.com → **Nuevo proyecto**.
2. Renombra el proyecto a "Logidma — CRM".
3. **Borra** el código por defecto y pega el contenido de `Code.gs`.
4. Edita las constantes al inicio:
   - `SHEET_ID`: el ID que copiaste arriba.
   - `TEAM_EMAIL`: tu correo de notificaciones (por defecto `contacto@logidma.com`).
   - `RESOURCES`: pega los links reales de los recursos (Drive públicos o Google Docs).

### 3. Desplegar como web app

1. **Implementar → Nueva implementación**.
2. Selecciona **tipo: Aplicación web**.
3. Configura:
   - **Ejecutar como**: tu cuenta (la que envía emails).
   - **Quién tiene acceso**: **Cualquier persona, incluso anónima**.
4. Click **Implementar** y autoriza los permisos solicitados (Sheets + Gmail).
5. Copia la **URL del despliegue**.

### 4. Actualizar la URL en el sitio

Tres lugares apuntan a esta URL — reemplaza la URL anterior por la nueva en:

| Archivo | Constante / línea |
|---|---|
| `assets/js/forms.js` | `APPS_SCRIPT_URL` (línea ~13) |
| `index.html` | `APPS_SCRIPT_URL` (constante en el `<script>` del form) |
| `onboarding.html` | `SURL` (constante en el `<script>` del onboarding) |

> **Tip**: si en el futuro consolidas todo a `forms.js`, solo necesitas tocar un lugar.

## Estructura del Sheet

Tres pestañas se crean automáticamente:

### `Contacto`
| Fecha | TrackID | Nombre | Email | Teléfono | Correo alt | Idea | Newsletter | UTM Source | UTM Campaign |

### `Onboarding`
| Fecha | TrackID | Nombre | Proyecto | Giro | Ruta | Estilo | Público | Propósito | Dominio | Colores | Contexto | Logo URL | Procesos | Stack | Correo | Teléfono |

### `Lead Magnets`
| Fecha | TrackID | Recurso | Título | Email | Nombre | UTM Source | UTM Campaign |

## Cómo probarlo

Después de desplegar:

```bash
curl -X POST 'https://script.google.com/macros/s/TU_URL/exec' \
  -H 'Content-Type: text/plain' \
  --data-raw '{"origen":"index/projectForm","nombre":"Test","email":"tu@email.com","idea":"prueba post-deploy","trackId":"TEST-001"}'
```

Deberías recibir un correo de prueba en menos de 30 segundos.

## Updates futuros

Cada cambio al script requiere **nueva versión del despliegue**:
- En el editor → Implementar → **Gestionar implementaciones** → editar → **Versión nueva** → Implementar.
- La URL **no cambia** si editas el despliegue existente.

## Drip campaign (futuro)

Para encadenar emails de seguimiento (D+3, D+7, D+14), puedes:
1. Usar **triggers basados en tiempo** desde el editor: `ScriptApp.newTrigger('sendDay3').timeBased()...`.
2. O usar [Brevo / Mailchimp / MailerLite](https://brevo.com) sincronizando vía API.
