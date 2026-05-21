/**
 * Logidma — doPost de Google Apps Script
 * ──────────────────────────────────────────
 *
 * Este archivo es el código que vive en el editor de Apps Script
 * (https://script.google.com/), no se ejecuta desde el sitio.
 *
 * Recibe submissions de los formularios de logidma.com con:
 *   - index.html: formulario de contacto (origen: 'index/projectForm')
 *   - onboarding.html: flujo multi-paso (origen: 'onboarding')
 *   - recursos.html: lead magnets (origen: 'recursos/lead-magnet')
 *
 * Funciones:
 *   1. Validación server-side (honeypot, longitudes, regex)
 *   2. Persistencia en Sheets (una pestaña por origen)
 *   3. Auto-respuesta al lead (MailApp.sendEmail)
 *   4. Notificación al equipo
 *   5. Si es lead_magnet, envía el link de descarga del recurso
 *
 * INSTALACIÓN:
 *   1. Ir a https://script.google.com/ → Nuevo proyecto
 *   2. Pegar TODO este código
 *   3. Reemplazar SHEET_ID y TEAM_EMAIL con los valores reales
 *   4. Desplegar como "Aplicación web":
 *      - Ejecutar como: Yo (tu cuenta)
 *      - Quién tiene acceso: Cualquier persona, incluso anónima
 *   5. Copiar la URL del despliegue y actualizarla en assets/js/forms.js
 *      (APPS_SCRIPT_URL) y en los inline scripts de index.html y onboarding.html
 */

// ══════════════════════════════════════════════════════════════
// CONFIGURACIÓN — editar antes de desplegar
// ══════════════════════════════════════════════════════════════

const SHEET_ID = 'REPLACE_WITH_YOUR_SHEET_ID';   // ID del Google Sheet de CRM
const TEAM_EMAIL = 'contacto@logidma.com';        // Donde llegan las notificaciones
const FROM_NAME = 'Logidma';
const ALLOWED_ORIGINS = ['logidma.com', 'www.logidma.com', 'localhost', '127.0.0.1'];

// Links de los recursos descargables (lead magnets)
// Reemplazar con URLs reales (Drive públicos, Google Docs, etc.)
const RESOURCES = {
  'nda-bilateral':        'https://drive.google.com/file/d/REPLACE/view',
  'checklist-workspace':  'https://drive.google.com/file/d/REPLACE/view',
  'guia-apps-script':     'https://drive.google.com/file/d/REPLACE/view',
  'aviso-privacidad':     'https://drive.google.com/file/d/REPLACE/view',
  'diagnostico':          'https://drive.google.com/file/d/REPLACE/view',
  'contrato-ti':          'https://drive.google.com/file/d/REPLACE/view'
};

// ══════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ══════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: 'No body' });
    }

    const data = JSON.parse(e.postData.contents);

    // 1) Honeypot: si está lleno, fingir éxito sin persistir
    if (data.empresa_url && String(data.empresa_url).trim() !== '') {
      logEvent('honeypot_blocked', data.trackId || 'unknown');
      return jsonResponse({ ok: true, blocked: 'honeypot' });
    }

    // 2) Validación básica
    if (!validatePayload(data)) {
      return jsonResponse({ ok: false, error: 'Payload inválido' });
    }

    // 3) Persistir en Sheet
    persistToSheet(data);

    // 4) Notificar al equipo
    notifyTeam(data);

    // 5) Auto-respuesta al lead (depende del tipo)
    const leadEmail = data.email || data.correo;
    if (leadEmail && isValidEmail(leadEmail)) {
      if (data.tipo === 'lead_magnet') {
        sendLeadMagnet(leadEmail, data);
      } else {
        sendAutoReply(leadEmail, data);
      }
    }

    return jsonResponse({ ok: true, trackId: data.trackId || '' });

  } catch (err) {
    console.error('doPost error:', err);
    return jsonResponse({ ok: false, error: err.message });
  }
}

function doGet() {
  // Sanity check para el deploy
  return ContentService.createTextOutput('Logidma Apps Script — running');
}

// ══════════════════════════════════════════════════════════════
// VALIDACIÓN
// ══════════════════════════════════════════════════════════════

function validatePayload(data) {
  // Campos mínimos por origen
  if (data.tipo === 'lead_magnet') {
    return data.email && isValidEmail(data.email) && data.recurso;
  }

  if (data.origen === 'onboarding') {
    return data.nombre && data.proyecto && (data.correo || data.email);
  }

  // index/projectForm
  if (data.origen === 'index/projectForm') {
    return data.nombre && data.email && isValidEmail(data.email) && data.idea;
  }

  // Aceptar otros orígenes pero requiere al menos email
  return data.email && isValidEmail(data.email);
}

function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());
}

// ══════════════════════════════════════════════════════════════
// SHEETS
// ══════════════════════════════════════════════════════════════

function persistToSheet(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheetName = data.tipo === 'lead_magnet'
    ? 'Lead Magnets'
    : (data.origen === 'onboarding' ? 'Onboarding' : 'Contacto');

  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(getHeadersFor(sheetName));
  }

  sheet.appendRow(getRowFor(sheetName, data));
}

function getHeadersFor(sheetName) {
  if (sheetName === 'Lead Magnets') {
    return ['Fecha', 'TrackID', 'Recurso', 'Título', 'Email', 'Nombre', 'UTM Source', 'UTM Campaign'];
  }
  if (sheetName === 'Onboarding') {
    return ['Fecha', 'TrackID', 'Nombre', 'Proyecto', 'Giro', 'Ruta', 'Estilo',
            'Público', 'Propósito', 'Dominio', 'Colores', 'Contexto', 'Logo URL',
            'Procesos', 'Stack', 'Correo', 'Teléfono'];
  }
  return ['Fecha', 'TrackID', 'Nombre', 'Email', 'Teléfono', 'Correo alt', 'Idea',
          'Newsletter', 'UTM Source', 'UTM Campaign'];
}

function getRowFor(sheetName, d) {
  if (sheetName === 'Lead Magnets') {
    return [d.fecha, d.trackId, d.recurso, d.recurso_titulo, d.email, d.nombre,
            d.utm_source, d.utm_campaign];
  }
  if (sheetName === 'Onboarding') {
    return [d.fecha, d.trackId, d.nombre, d.proyecto, d.giro, d.rutaElegida,
            d.estilo, d.publico, d.proposito, d.dominio, d.colores,
            d.contextoWeb, d.logoUrl, d.procesosMejorar, d.stack, d.correo, d.telefono];
  }
  return [d.fecha, d.trackId, d.nombre, d.email, d.telefono, d.correo, d.idea,
          d.newsletter, d.utm_source, d.utm_campaign];
}

// ══════════════════════════════════════════════════════════════
// EMAILS
// ══════════════════════════════════════════════════════════════

function notifyTeam(d) {
  const subject = `Nuevo lead · ${d.origen || 'unknown'} · ${d.nombre || d.email || 'sin nombre'}`;
  const body = [
    'Llegó un lead nuevo a Logidma.',
    '',
    'TrackID: ' + (d.trackId || '—'),
    'Origen: ' + (d.origen || '—'),
    'Fecha: ' + (d.fecha || new Date().toISOString()),
    '',
    'Datos:',
    Object.keys(d)
      .filter(k => !['empresa_url', 'fecha', 'trackId', 'origen'].includes(k))
      .map(k => `  ${k}: ${d[k] || '—'}`)
      .join('\n'),
    '',
    'Sheet: https://docs.google.com/spreadsheets/d/' + SHEET_ID
  ].join('\n');

  MailApp.sendEmail({
    to: TEAM_EMAIL,
    subject: subject,
    body: body,
    name: FROM_NAME + ' · CRM'
  });
}

function sendAutoReply(toEmail, d) {
  const nombre = (d.nombre || '').split(' ')[0] || 'hola';
  const isOnboarding = d.origen === 'onboarding';

  const subject = isOnboarding
    ? `Recibimos tu información · ${d.proyecto || 'tu proyecto'}`
    : 'Recibimos tu mensaje en Logidma';

  const htmlBody = buildEmailHtml({
    titulo: `Gracias, ${nombre}`,
    cuerpo: isOnboarding
      ? `Tu información para <strong>${escapeHtml(d.proyecto || 'tu proyecto')}</strong> ya está conmigo. ` +
        `Voy a revisarla personalmente y te contacto en menos de 72 horas hábiles con la propuesta exacta.`
      : `Recibí tu mensaje. Voy a leerlo con calma y te respondo en menos de 72 horas hábiles. ` +
        `Mientras tanto, si urge puedes escribirme directo por WhatsApp.`,
    trackId: d.trackId || ''
  });

  MailApp.sendEmail({
    to: toEmail,
    subject: subject,
    htmlBody: htmlBody,
    name: 'David Martínez · Logidma',
    replyTo: TEAM_EMAIL
  });
}

function sendLeadMagnet(toEmail, d) {
  const nombre = (d.nombre || '').split(' ')[0] || 'hola';
  const recurso = d.recurso;
  const titulo = d.recurso_titulo || 'tu recurso';
  const link = RESOURCES[recurso];

  if (!link) {
    console.error('Lead magnet desconocido:', recurso);
    return;
  }

  const subject = `Tu recurso: ${titulo}`;

  const htmlBody = buildEmailHtml({
    titulo: `Aquí tienes, ${nombre}`,
    cuerpo: `Como pediste, te enviamos <strong>${escapeHtml(titulo)}</strong>. ` +
            `Es tuyo, úsalo sin restricciones.`,
    cta: { url: link, label: 'Descargar el recurso →' },
    trackId: d.trackId || ''
  });

  MailApp.sendEmail({
    to: toEmail,
    subject: subject,
    htmlBody: htmlBody,
    name: 'David Martínez · Logidma',
    replyTo: TEAM_EMAIL
  });
}

// ══════════════════════════════════════════════════════════════
// TEMPLATE DE EMAIL — fondo oscuro + acento lime, estética Logidma
// ══════════════════════════════════════════════════════════════

function buildEmailHtml(opts) {
  const ctaHtml = opts.cta
    ? `<a href="${opts.cta.url}" style="display:inline-block;background:#c4ff3a;color:#0a0908;
           padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:500;
           font-family:Arial,sans-serif;font-size:14px;margin-top:24px;">${escapeHtml(opts.cta.label)}</a>`
    : '';

  const trackHtml = opts.trackId
    ? `<p style="font-family:'Courier New',monospace;font-size:11px;color:#9a9181;
              letter-spacing:.1em;margin-top:32px;">ID de seguimiento: ${escapeHtml(opts.trackId)}</p>`
    : '';

  return `<!doctype html><html><body style="margin:0;padding:0;background:#0a0908;font-family:Arial,sans-serif;color:#ebe5d6;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0908;">
      <tr><td align="center" style="padding:48px 24px;">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#16140f;border:1px solid rgba(235,229,214,.08);border-radius:16px;">
          <tr><td style="padding:40px 32px;">
            <div style="font-family:Georgia,serif;font-size:14px;color:#c4ff3a;letter-spacing:.18em;text-transform:uppercase;">Logidma</div>
            <h1 style="font-family:Georgia,serif;font-style:italic;font-size:28px;font-weight:normal;color:#c4ff3a;margin:18px 0 22px;line-height:1.2;">${escapeHtml(opts.titulo)}</h1>
            <p style="color:#c9c2b0;font-size:15px;line-height:1.6;margin:0;">${opts.cuerpo}</p>
            ${ctaHtml}
            ${trackHtml}
            <p style="border-top:1px solid rgba(235,229,214,.08);margin-top:32px;padding-top:20px;color:#9a9181;font-size:12px;line-height:1.6;">
              ¿Urgente? WhatsApp: <a href="https://wa.me/524431014385" style="color:#c4ff3a;text-decoration:none;">+52 443 101 4385</a><br>
              ¿Dudas? Responde a este correo o escribe a <a href="mailto:${TEAM_EMAIL}" style="color:#c4ff3a;text-decoration:none;">${TEAM_EMAIL}</a>
            </p>
          </td></tr>
        </table>
        <p style="color:#6b6657;font-size:11px;margin-top:24px;font-family:Arial,sans-serif;">© Logidma · La lógica, sistematizada</p>
      </td></tr>
    </table>
  </body></html>`;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ══════════════════════════════════════════════════════════════
// UTILIDADES
// ══════════════════════════════════════════════════════════════

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function logEvent(type, ref) {
  console.log(`[${new Date().toISOString()}] ${type} :: ${ref}`);
}
