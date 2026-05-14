/**
 * ============================================================================
 *   LOGIDMA — Apps Script unificado
 *
 *   Un solo doPost maneja dos formularios distinguiéndolos por payload:
 *     · Formulario de contacto  (index.html)     → hoja "Formulario"
 *     · Formulario de onboarding (onboarding.html) → hoja "Leads_Onboarding"
 *   La presencia del campo 'idea' identifica el formulario de contacto.
 *
 *   DESPLIEGUE:
 *     1. Abrir script.google.com y el proyecto vinculado al Sheets de Logidma.
 *     2. Reemplazar todo el contenido con este archivo.
 *     3. Deploy → Manage Deployments → New Deployment → Web App
 *        · Execute as: Me  ·  Who has access: Anyone
 *     4. Si cambia el URL, actualizar SURL en onboarding.html (línea 1722)
 *        y APPS_SCRIPT_URL en index.html (línea 3155).
 *
 *   ALIAS contacto@logidma.com:
 *     Gmail → Ajustes → Cuentas → "Enviar correo como" → Agregar y verificar.
 *     Sin el alias el correo sale igual, desde la cuenta primaria del script.
 * ============================================================================
 */

// ── CONFIGURACIÓN ─────────────────────────────────────────────────────────────
const CONFIG = {
  SHEET_FORMULARIO : 'Formulario',
  SHEET_ONBOARDING : 'Leads_Onboarding',
  SEND_FROM_EMAIL  : 'contacto@logidma.com',
  SEND_FROM_NAME   : 'Contacto · Logidma',
  REPLY_TO         : 'contacto@logidma.com',
  BCC_OWNER        : '',   // ej. 'tu@email.com' — déjalo vacío para no usarlo
  LOGO_URL         : 'https://github.com/DavisMtz/logidma-assets/blob/main/Logidma%20logo.png?raw=true',
  WHATSAPP_NUMBER  : '524431014385',
  WHATSAPP_DISPLAY : '+52 443 101 4385',
};


// ── doPost ────────────────────────────────────────────────────────────────────
// Entry point. Distingue formularios por la presencia del campo 'idea'.

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    return (data.idea !== undefined)
      ? handleFormulario(data)
      : handleOnboarding(data);
  } catch (err) {
    Logger.log('doPost: ' + err);
    return jsonRes({ ok: false, error: err.toString() });
  }
}


// ── HANDLER: formulario de contacto (index.html) ──────────────────────────────

function handleFormulario(data) {
  try {
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(CONFIG.SHEET_FORMULARIO)
      .appendRow([
        data.fecha    || new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
        data.nombre   || '',
        data.email    || '',
        data.telefono || '',
        data.correo   || '',
        data.idea     || '',
      ]);

    if (data.email && isValidEmail(data.email)) {
      try { sendThankYouEmail(data); }
      catch (me) { Logger.log('Correo contacto: ' + me); }
    }

    return jsonRes({ ok: true });

  } catch (err) {
    Logger.log('handleFormulario: ' + err);
    return jsonRes({ ok: false, error: err.toString() });
  }
}


// ── HANDLER: formulario de onboarding (onboarding.html) ──────────────────────

function handleOnboarding(datos) {
  try {
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(CONFIG.SHEET_ONBOARDING)
      .appendRow([
        new Date(),
        datos.nombre          || '',
        datos.proyecto        || '',
        datos.giro            || '',
        datos.rutaElegida     || '',
        datos.estilo          || '',
        datos.publico         || '',
        datos.proposito       || '',
        datos.dominio         || '',
        datos.colores         || '',
        datos.contextoWeb     || '',
        datos.logoUrl         || '',
        datos.procesosMejorar || '',
        datos.stack           || '',
        datos.correo          || '',
        datos.telefono        || '',
        'Nuevo Lead',
      ]);

    if (datos.correo && isValidEmail(datos.correo)) {
      try { sendOnboardingEmail(datos); }
      catch (me) { Logger.log('Correo onboarding: ' + me); }
    }

    return jsonRes({ estatus: 'exito', mensaje: 'Datos registrados.' });

  } catch (err) {
    Logger.log('handleOnboarding: ' + err);
    return jsonRes({ estatus: 'error', mensaje: err.message });
  }
}


// ── EMAIL: formulario de contacto ─────────────────────────────────────────────

function sendThankYouEmail(data) {
  const opts = {
    from    : CONFIG.SEND_FROM_EMAIL,
    name    : CONFIG.SEND_FROM_NAME,
    replyTo : CONFIG.REPLY_TO,
    htmlBody: buildFormularioHtml(data),
  };
  if (CONFIG.BCC_OWNER) opts.bcc = CONFIG.BCC_OWNER;

  GmailApp.sendEmail(
    data.email,
    `¡Recibí tu idea, ${getFirstName(data.nombre)}! · Logidma`,
    buildFormularioPlain(data),
    opts
  );
}


// ── EMAIL: formulario de onboarding ──────────────────────────────────────────

function sendOnboardingEmail(datos) {
  const opts = {
    from    : CONFIG.SEND_FROM_EMAIL,
    name    : CONFIG.SEND_FROM_NAME,
    replyTo : CONFIG.REPLY_TO,
    htmlBody: buildOnboardingHtml(datos),
    cc      : CONFIG.SEND_FROM_EMAIL,   // Copia automática a la agencia
  };
  if (CONFIG.BCC_OWNER) opts.bcc = CONFIG.BCC_OWNER;

  GmailApp.sendEmail(
    datos.correo,
    `Tu solicitud está en marcha, ${getFirstName(datos.nombre)} · Logidma`,
    buildOnboardingPlain(datos),
    opts
  );
}


// ── HTML: formulario de contacto ──────────────────────────────────────────────

function buildFormularioHtml(data) {
  const firstName = getFirstName(data.nombre);
  const idea      = escapeHtml((data.idea || '').trim());
  const waUrl     = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola David, te escribo sobre la idea que envié por el formulario.')}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>Logidma</title>
<!--[if mso]><style>table,td,div,h1,p{font-family:Arial,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0a0908;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#ebe5d6;">

<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  Hola ${escapeHtml(firstName)}, recibí tu idea. Te respondo en menos de 72 horas.
</div>

<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#0a0908">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr>
    <td style="padding:28px 36px;border-bottom:1px solid #2a2620;">
      <table role="presentation" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="vertical-align:middle;padding-right:14px;">
            <img src="${CONFIG.LOGO_URL}" alt="Logidma" width="36" height="36" style="display:block;border:0;outline:none;">
          </td>
          <td style="vertical-align:middle;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:22px;color:#ebe5d6;letter-spacing:0.5px;">Logidma</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- HERO -->
  <tr>
    <td style="padding:60px 36px 16px;">
      <p style="margin:0 0 18px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c4ff3a;">
        <span style="display:inline-block;width:32px;height:1px;background:#c4ff3a;vertical-align:middle;margin-right:10px;"></span>Mensaje recibido
      </p>
      <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:normal;font-size:44px;line-height:1.05;color:#ebe5d6;letter-spacing:-0.02em;">
        Hola, ${escapeHtml(firstName)}.
      </h1>
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:22px;line-height:1.4;color:#c9c2b0;">
        Tu idea está <span style="color:#c4ff3a;">conmigo</span>.
      </p>
    </td>
  </tr>

  <!-- CUERPO -->
  <tr>
    <td style="padding:24px 36px 8px;">
      <p style="margin:0 0 20px;font-size:15px;line-height:1.75;color:#c9c2b0;">
        Gracias por tomarte el tiempo de compartir lo que tienes en mente. Acabo de recibirla y la voy a revisar con calma — no como un formulario más, sino como un proyecto real que merece ser pensado a fondo.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.75;color:#c9c2b0;">
        <strong style="color:#ebe5d6;font-weight:600;">Te contactaré en menos de 72 horas</strong> con preguntas, observaciones o una propuesta inicial. Mientras tanto, si quieres adelantarme algo o surge un detalle nuevo, puedes responder este correo directamente.
      </p>
    </td>
  </tr>

  <!-- IDEA BLOCK -->
  <tr>
    <td style="padding:32px 36px 8px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border:1px solid #2a2620;">
        <tr>
          <td style="padding:26px 30px;background-color:#100e0c;">
            <p style="margin:0 0 14px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#6b6657;">// Lo que recibí</p>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:16px;line-height:1.7;color:#ebe5d6;">&ldquo;${idea}&rdquo;</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CTAs -->
  <tr>
    <td style="padding:32px 36px 16px;">
      <p style="margin:0 0 18px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#6b6657;">// ¿Algo urgente?</p>
      <table role="presentation" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding-right:10px;">
            <a href="${waUrl}" target="_blank" style="display:inline-block;padding:13px 26px;background-color:#c4ff3a;color:#0a0908 !important;text-decoration:none;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;font-weight:bold;border-radius:999px;">WhatsApp →</a>
          </td>
          <td>
            <a href="mailto:contacto@logidma.com" style="display:inline-block;padding:12px 26px;border:1px solid #2a2620;color:#ebe5d6 !important;text-decoration:none;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;border-radius:999px;">Responder →</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- FIRMA -->
  <tr>
    <td style="padding:40px 36px 48px;border-top:1px solid #2a2620;">
      <p style="margin:0 0 6px;font-size:14px;color:#c9c2b0;">Hablamos pronto,</p>
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:24px;color:#ebe5d6;">David</p>
      <p style="margin:8px 0 0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2.5px;color:#6b6657;text-transform:uppercase;">Founder · Systems Architect</p>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="padding:36px 36px 40px;background-color:#050403;text-align:center;">
      <img src="${CONFIG.LOGO_URL}" alt="Logidma" width="34" height="34" style="display:block;margin:0 auto 14px;border:0;outline:none;">
      <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:18px;color:#ebe5d6;">Logidma</p>
      <p style="margin:0 0 16px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#c4ff3a;">La lógica, sistematizada</p>
      <p style="margin:0 0 4px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.5px;color:#6b6657;">contacto@logidma.com</p>
      <p style="margin:0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.5px;color:#6b6657;">${CONFIG.WHATSAPP_DISPLAY}</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}


// ── HTML: formulario de onboarding ────────────────────────────────────────────

function buildOnboardingHtml(datos) {
  const firstName = getFirstName(datos.nombre);
  const isWeb     = datos.rutaElegida === 'Portal Web';
  const isAuto    = datos.rutaElegida === 'Automatización de Procesos';
  const rutaLabel = datos.rutaElegida || 'Solicitud';
  const rutaColor = isWeb ? '#c4ff3a' : '#b08d57';
  const rutaBg    = isWeb ? 'rgba(196,255,58,0.12)' : 'rgba(176,141,87,0.15)';
  const waUrl     = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola David, te escribo sobre mi solicitud de onboarding en Logidma.')}`;

  // Fila del resumen de datos (omite si valor vacío)
  const fila = function(label, valor) {
    if (!valor) return '';
    return `<tr>
      <td style="padding:9px 0;border-bottom:1px solid #1e1c18;width:34%;vertical-align:top;">
        <span style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#6b6657;">${label}</span>
      </td>
      <td style="padding:9px 0 9px 16px;border-bottom:1px solid #1e1c18;vertical-align:top;">
        <span style="font-size:14px;line-height:1.55;color:#ebe5d6;">${escapeHtml(String(valor))}</span>
      </td>
    </tr>`;
  };

  // Fila especial para link (logo) — no escapa el href, solo el texto
  const logoFila = (datos.logoUrl && isWeb)
    ? `<tr>
        <td style="padding:9px 0;border-bottom:1px solid #1e1c18;width:34%;vertical-align:top;">
          <span style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#6b6657;">Logo</span>
        </td>
        <td style="padding:9px 0 9px 16px;border-bottom:1px solid #1e1c18;vertical-align:top;">
          <a href="${escapeHtml(datos.logoUrl)}" target="_blank" style="font-size:14px;color:#c4ff3a;text-decoration:none;">Ver archivo →</a>
        </td>
      </tr>`
    : '';

  const seccionWeb = isWeb
    ? fila('Estilo',    datos.estilo)
    + fila('Público',   datos.publico)
    + fila('Propósito', datos.proposito)
    + fila('Dominio',   datos.dominio)
    + fila('Colores',   datos.colores)
    + fila('Visión',    datos.contextoWeb)
    + logoFila
    : '';

  const seccionAuto = isAuto
    ? fila('Situación actual', datos.procesosMejorar)
    + fila('Stack / Tools',    datos.stack)
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>Logidma</title>
<!--[if mso]><style>table,td,div,h1,p{font-family:Arial,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0a0908;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#ebe5d6;">

<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  Hola ${escapeHtml(firstName)}, recibimos tu solicitud. Ya estamos en ello.
</div>

<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#0a0908">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr>
    <td style="padding:28px 36px;border-bottom:1px solid #2a2620;">
      <table role="presentation" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="vertical-align:middle;padding-right:14px;">
            <img src="${CONFIG.LOGO_URL}" alt="Logidma" width="36" height="36" style="display:block;border:0;outline:none;">
          </td>
          <td style="vertical-align:middle;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:22px;color:#ebe5d6;letter-spacing:0.5px;">Logidma</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- HERO -->
  <tr>
    <td style="padding:60px 36px 16px;">
      <p style="margin:0 0 18px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${rutaColor};">
        <span style="display:inline-block;width:32px;height:1px;background:${rutaColor};vertical-align:middle;margin-right:10px;"></span>Solicitud recibida
      </p>
      <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:normal;font-size:44px;line-height:1.05;color:#ebe5d6;letter-spacing:-0.02em;">
        Hola, ${escapeHtml(firstName)}.
      </h1>
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:22px;line-height:1.4;color:#c9c2b0;">
        Tu proyecto está <span style="color:#c4ff3a;">en marcha</span>.
      </p>
    </td>
  </tr>

  <!-- CUERPO -->
  <tr>
    <td style="padding:24px 36px 16px;">
      <p style="margin:0 0 20px;font-size:15px;line-height:1.75;color:#c9c2b0;">
        Recibimos toda la información de <strong style="color:#ebe5d6;">${escapeHtml(datos.proyecto || 'tu proyecto')}</strong>. Nuestro equipo la está analizando con detenimiento para darte una propuesta que tenga sentido real para tu negocio.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.75;color:#c9c2b0;">
        <strong style="color:#ebe5d6;font-weight:600;">Te contactaremos en 1–2 días hábiles</strong> con preguntas, observaciones o los próximos pasos. Si surge algo antes, responde este correo directamente.
      </p>
    </td>
  </tr>

  <!-- BADGE DE RUTA -->
  <tr>
    <td style="padding:0 36px 24px;">
      <table role="presentation" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="background-color:${rutaBg};border:1px solid ${rutaColor};border-radius:999px;padding:6px 18px;">
            <span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:${rutaColor};">${escapeHtml(rutaLabel)}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- RESUMEN DEL PROYECTO -->
  <tr>
    <td style="padding:0 36px 8px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border:1px solid #2a2620;">
        <tr>
          <td style="padding:24px 28px;background-color:#100e0c;">
            <p style="margin:0 0 18px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#6b6657;">// Lo que recibí</p>
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
              ${fila('Nombre',   datos.nombre)}
              ${fila('Proyecto', datos.proyecto)}
              ${fila('Giro',     datos.giro)}
              ${seccionWeb}
              ${seccionAuto}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CTAs -->
  <tr>
    <td style="padding:32px 36px 16px;">
      <p style="margin:0 0 18px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#6b6657;">// ¿Algo urgente?</p>
      <table role="presentation" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding-right:10px;">
            <a href="${waUrl}" target="_blank" style="display:inline-block;padding:13px 26px;background-color:#c4ff3a;color:#0a0908 !important;text-decoration:none;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;font-weight:bold;border-radius:999px;">WhatsApp →</a>
          </td>
          <td>
            <a href="mailto:contacto@logidma.com" style="display:inline-block;padding:12px 26px;border:1px solid #2a2620;color:#ebe5d6 !important;text-decoration:none;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;border-radius:999px;">Responder →</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- FIRMA -->
  <tr>
    <td style="padding:40px 36px 48px;border-top:1px solid #2a2620;">
      <p style="margin:0 0 6px;font-size:14px;color:#c9c2b0;">Hablamos pronto,</p>
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:24px;color:#ebe5d6;">David</p>
      <p style="margin:8px 0 0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2.5px;color:#6b6657;text-transform:uppercase;">Founder · Systems Architect</p>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="padding:36px 36px 40px;background-color:#050403;text-align:center;">
      <img src="${CONFIG.LOGO_URL}" alt="Logidma" width="34" height="34" style="display:block;margin:0 auto 14px;border:0;outline:none;">
      <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:18px;color:#ebe5d6;">Logidma</p>
      <p style="margin:0 0 16px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#c4ff3a;">La lógica, sistematizada</p>
      <p style="margin:0 0 4px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.5px;color:#6b6657;">contacto@logidma.com</p>
      <p style="margin:0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:1.5px;color:#6b6657;">${CONFIG.WHATSAPP_DISPLAY}</p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}


// ── PLAIN TEXT ────────────────────────────────────────────────────────────────

function buildFormularioPlain(data) {
  const firstName = getFirstName(data.nombre);
  return [
    `Hola, ${firstName}.`,
    '',
    'Tu idea está conmigo.',
    '',
    'Gracias por tomarte el tiempo de compartir lo que tienes en mente. Acabo de recibirla y la voy a revisar con calma — no como un formulario más, sino como un proyecto real que merece ser pensado a fondo.',
    '',
    'Te contactaré en menos de 72 horas con preguntas, observaciones o una propuesta inicial. Mientras tanto, si quieres adelantarme algo o surge un detalle nuevo, puedes responder este correo directamente.',
    '',
    '── Lo que recibí ──',
    `"${(data.idea || '').trim()}"`,
    '',
    '── ¿Algo urgente? ──',
    `WhatsApp: https://wa.me/${CONFIG.WHATSAPP_NUMBER}`,
    'Correo:   contacto@logidma.com',
    '',
    'Hablamos pronto,',
    'David Martínez Arredondo',
    'Founder · Systems Architect',
    '',
    '──────────────────',
    'Logidma · La lógica, sistematizada',
    `contacto@logidma.com · ${CONFIG.WHATSAPP_DISPLAY}`,
  ].join('\n');
}

function buildOnboardingPlain(datos) {
  const firstName = getFirstName(datos.nombre);
  const isWeb     = datos.rutaElegida === 'Portal Web';
  const isAuto    = datos.rutaElegida === 'Automatización de Procesos';

  const lineas = [
    `Hola, ${firstName}.`,
    '',
    'Tu proyecto está en marcha.',
    '',
    `Recibimos toda la información de "${datos.proyecto || 'tu proyecto'}". Nuestro equipo la está analizando y te contactaremos en 1–2 días hábiles con los próximos pasos.`,
    '',
    '── Lo que recibí ──',
    datos.nombre      ? `Nombre:   ${datos.nombre}`      : null,
    datos.proyecto    ? `Proyecto: ${datos.proyecto}`    : null,
    datos.giro        ? `Giro:     ${datos.giro}`        : null,
    datos.rutaElegida ? `Ruta:     ${datos.rutaElegida}` : null,
  ];

  if (isWeb) {
    if (datos.estilo)      lineas.push(`Estilo:    ${datos.estilo}`);
    if (datos.publico)     lineas.push(`Público:   ${datos.publico}`);
    if (datos.proposito)   lineas.push(`Propósito: ${datos.proposito}`);
    if (datos.dominio)     lineas.push(`Dominio:   ${datos.dominio}`);
    if (datos.colores)     lineas.push(`Colores:   ${datos.colores}`);
    if (datos.contextoWeb) lineas.push(`Visión:    ${datos.contextoWeb}`);
    if (datos.logoUrl)     lineas.push(`Logo:      ${datos.logoUrl}`);
  }
  if (isAuto) {
    if (datos.procesosMejorar) lineas.push(`Situación: ${datos.procesosMejorar}`);
    if (datos.stack)           lineas.push(`Stack:     ${datos.stack}`);
  }

  lineas.push(
    '',
    '── ¿Algo urgente? ──',
    `WhatsApp: https://wa.me/${CONFIG.WHATSAPP_NUMBER}`,
    'Correo:   contacto@logidma.com',
    '',
    'Hablamos pronto,',
    'David Martínez Arredondo',
    'Founder · Systems Architect',
    '',
    '──────────────────',
    'Logidma · La lógica, sistematizada',
    `contacto@logidma.com · ${CONFIG.WHATSAPP_DISPLAY}`
  );

  return lineas.filter(l => l !== null).join('\n');
}


// ── UTILIDADES ────────────────────────────────────────────────────────────────

function getFirstName(fullName) {
  if (!fullName) return 'amigx';
  const first = String(fullName).trim().split(/\s+/)[0];
  return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : 'amigx';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;')
    .replace(/\n/g, '<br>');
}

function jsonRes(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ── CONFIGURAR HOJA Leads_Onboarding ─────────────────────────────────────────
// Ejecutar UNA SOLA VEZ desde el editor para crear y formatear la hoja.

function configurarHoja() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const nombreHoja = 'Leads_Onboarding';
  let hoja = libro.getSheetByName(nombreHoja);
  if (!hoja) hoja = libro.insertSheet(nombreHoja);

  const encabezados = [
    'Fecha de Registro', 'Nombre del Cliente', 'Proyecto/Negocio', 'Giro',
    'Ruta Elegida', 'Estilo', 'Público Objetivo', 'Propósito Web',
    'Dominio Deseado', 'Esquema de Color', 'Contexto del Portal',
    'URL Logo (Firebase)', 'Procesos a Mejorar (Dolor)', 'Stack Tecnológico',
    'Correo Electrónico', 'Teléfono', 'Estatus del Proyecto',
  ];

  hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  const cab = hoja.getRange(1, 1, 1, encabezados.length);
  cab.setFontWeight('bold')
     .setBackground('#2c3e50')
     .setFontColor('#ffffff')
     .setHorizontalAlignment('center');
  hoja.setFrozenRows(1);
  hoja.autoResizeColumns(1, encabezados.length);
  Logger.log('Hoja "' + nombreHoja + '" configurada correctamente.');
}


// ── TESTS ─────────────────────────────────────────────────────────────────────
// Correr desde el editor para verificar el correo antes de desplegar.

function testEmail() {
  const TU_EMAIL = 'davismartinesad@gmail.com';   // ← cámbialo si es necesario
  sendThankYouEmail({
    fecha    : new Date().toLocaleString('es-MX'),
    nombre   : 'David Martínez Arredondo',
    email    : TU_EMAIL,
    telefono : '+52 443 101 4385',
    correo   : '',
    idea     : 'Necesito automatizar el flujo de altas de clientes en mi CRM, conectarlo con Google Sheets para llevar reportes y enviar correos de bienvenida personalizados a cada uno cuando se registran.',
  });
  Logger.log('✓ Correo de prueba (contacto) enviado a ' + TU_EMAIL);
}

function testOnboardingEmail() {
  const TU_EMAIL = 'davismartinesad@gmail.com';   // ← cámbialo si es necesario
  sendOnboardingEmail({
    nombre          : 'David Martínez Arredondo',
    proyecto        : 'Demo Onboarding',
    giro            : 'Tecnología',
    rutaElegida     : 'Portal Web',
    estilo          : 'Minimalista y moderno',
    publico         : 'Empresas medianas B2B',
    proposito       : 'Captar leads y mostrar portfolio',
    dominio         : 'demo.logidma.com',
    colores         : '#c4ff3a, #0a0908',
    contextoWeb     : 'Un portal que refleje nuestra identidad técnica y genere confianza.',
    logoUrl         : '',
    procesosMejorar : '',
    stack           : '',
    correo          : TU_EMAIL,
    telefono        : '+52 443 101 4385',
  });
  Logger.log('✓ Correo de prueba (onboarding) enviado a ' + TU_EMAIL);
}
