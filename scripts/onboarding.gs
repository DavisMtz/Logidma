// =============================================================================
// Logidma — Onboarding Google Apps Script
// Recibe datos del formulario web, los guarda en Sheets y envía confirmación
// por correo al cliente.
//
// INSTRUCCIONES DE DESPLIEGUE:
//   1. Abrir script.google.com y el proyecto vinculado al Sheets de Logidma.
//   2. Reemplazar todo el contenido con este archivo.
//   3. Deploy → Manage Deployments → New Deployment → Web App
//      · Execute as: Me  ·  Who has access: Anyone
//   4. Si el URL del deployment cambia, actualizar SURL en onboarding.html.
//
// REQUISITO para enviar desde contacto@logidma.com:
//   En la cuenta Google que ejecuta el script, ir a Gmail → Ajustes →
//   Cuentas e importación → "Enviar correo como" → Agregar contacto@logidma.com
//   y completar la verificación. Sin este paso el correo sale desde la cuenta
//   primaria del script (no rompe el flujo).
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────────────────────
var CONFIG = {
  SHEET_NAME : "Leads_Onboarding",
  FROM_EMAIL : "contacto@logidma.com",
  FROM_NAME  : "Logidma",
  CC_EMAIL   : "contacto@logidma.com",
  SUBJECT    : "Tu solicitud con Logidma — Ya la tenemos ✔",
};

// ─────────────────────────────────────────────────────────────────────────────
// doPost — Entry point del Web App
// ─────────────────────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    var hoja = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(CONFIG.SHEET_NAME);

    var datos = JSON.parse(e.postData.contents);

    // Registro en Sheets (sin cambios respecto a la versión anterior)
    var nuevaFila = [
      new Date(),
      datos.nombre          || "",
      datos.proyecto        || "",
      datos.giro            || "",
      datos.rutaElegida     || "",
      datos.estilo          || "",
      datos.publico         || "",
      datos.proposito       || "",
      datos.dominio         || "",
      datos.colores         || "",
      datos.contextoWeb     || "",
      datos.logoUrl         || "",
      datos.procesosMejorar || "",
      datos.stack           || "",
      datos.correo          || "",
      datos.telefono        || "",
      "Nuevo Lead",
    ];
    hoja.appendRow(nuevaFila);

    // Envío de correo de confirmación (solo si hay correo válido)
    if (datos.correo) {
      sendConfirmationEmail(datos);
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        estatus : "exito",
        mensaje : "Datos registrados y correo de confirmación enviado.",
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        estatus : "error",
        mensaje : error.message,
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// sendConfirmationEmail
// El try/catch es independiente: si el correo falla, el lead ya quedó guardado
// en Sheets y el cliente sigue recibiendo "estatus: exito".
// ─────────────────────────────────────────────────────────────────────────────
function sendConfirmationEmail(datos) {
  try {
    var htmlBody = buildEmailHtml(datos);

    MailApp.sendEmail({
      to      : datos.correo,
      cc      : CONFIG.CC_EMAIL,
      from    : CONFIG.FROM_EMAIL,
      name    : CONFIG.FROM_NAME,
      subject : CONFIG.SUBJECT,
      htmlBody: htmlBody,
      body    : [
        "Hola " + (datos.nombre || "cliente") + ",",
        "",
        "Recibimos tu solicitud para \"" + (datos.proyecto || "tu proyecto") + "\".",
        "Ya estamos revisando la información y nos pondremos en contacto contigo",
        "a la brevedad con los siguientes pasos.",
        "",
        "Equipo Logidma",
        "https://logidma.com",
      ].join("\n"),
    });

  } catch (emailError) {
    Logger.log("Error enviando correo de confirmación: " + emailError.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// buildEmailHtml — Construye el HTML completo del correo
// ─────────────────────────────────────────────────────────────────────────────
function buildEmailHtml(datos) {
  var isWeb  = datos.rutaElegida === "Portal Web";
  var isAuto = datos.rutaElegida === "Automatización de Procesos";
  var anio   = new Date().getFullYear();

  // Helper: fila de datos (omite si el valor es vacío)
  function fila(label, valor) {
    if (!valor) return "";
    return (
      '<tr>' +
        '<td style="padding:10px 20px;border-bottom:1px solid #252320;' +
                   'font-family:\'Manrope\',\'Segoe UI\',Arial,sans-serif;' +
                   'font-size:11px;font-weight:700;letter-spacing:0.09em;' +
                   'text-transform:uppercase;color:#9a9181;' +
                   'width:36%;vertical-align:top;white-space:nowrap;">' +
          label +
        '</td>' +
        '<td style="padding:10px 20px;border-bottom:1px solid #252320;' +
                   'font-family:\'Manrope\',\'Segoe UI\',Arial,sans-serif;' +
                   'font-size:14px;color:#ebe5d6;line-height:1.6;' +
                   'vertical-align:top;word-break:break-word;">' +
          valor +
        '</td>' +
      '</tr>'
    );
  }

  // Secciones condicionales según ruta
  var seccionWeb = isWeb ? (
    fila("Estilo",    datos.estilo) +
    fila("Público",   datos.publico) +
    fila("Propósito", datos.proposito) +
    fila("Dominio",   datos.dominio) +
    fila("Colores",   datos.colores) +
    fila("Visión",    datos.contextoWeb) +
    (datos.logoUrl
      ? fila("Logo", '<a href="' + datos.logoUrl + '" style="color:#c4ff3a;text-decoration:none;">Ver archivo adjunto →</a>')
      : "")
  ) : "";

  var seccionAuto = isAuto ? (
    fila("Situación actual",      datos.procesosMejorar) +
    fila("Stack / Herramientas",  datos.stack)
  ) : "";

  // Badge de ruta con color diferenciado
  var rutaColor = isWeb  ? "#c4ff3a"              : "#b08d57";
  var rutaBg    = isWeb  ? "rgba(196,255,58,0.12)" : "rgba(176,141,87,0.15)";
  var rutaLabel = datos.rutaElegida || "Solicitud";

  return '<!DOCTYPE html>\n' +
'<html lang="es">\n' +
'<head>\n' +
'  <meta charset="UTF-8"/>\n' +
'  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>\n' +
'  <title>Confirmación Logidma</title>\n' +
'  <style>\n' +
'    body{margin:0;padding:0;background-color:#0a0908 !important;}\n' +
'    table{border-collapse:collapse;}\n' +
'    a{color:#c4ff3a;text-decoration:none;}\n' +
'    @media only screen and (max-width:600px){\n' +
'      .email-card{border-radius:0 !important;}\n' +
'      .inner-pad{padding:28px 20px !important;}\n' +
'      .hero-title{font-size:26px !important;}\n' +
'    }\n' +
'  </style>\n' +
'</head>\n' +
'<body style="margin:0;padding:0;background-color:#0a0908;\n' +
'             font-family:\'Manrope\',\'Segoe UI\',Arial,sans-serif;">\n' +
'\n' +
'  <!-- Preheader oculto -->\n' +
'  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">\n' +
'    Recibimos tu solicitud, ' + (datos.nombre || "") + '. Ya estamos en ello.\n' +
'    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;\n' +
'  </div>\n' +
'\n' +
'  <table width="100%" cellpadding="0" cellspacing="0" border="0"\n' +
'         style="background-color:#0a0908;">\n' +
'    <tr>\n' +
'      <td align="center" style="padding:36px 16px 52px;">\n' +
'\n' +
'        <table width="600" cellpadding="0" cellspacing="0" border="0"\n' +
'               style="max-width:600px;width:100%;">\n' +
'\n' +
'          <!-- ── WORDMARK ── -->\n' +
'          <tr>\n' +
'            <td align="center" style="padding:0 0 24px;">\n' +
'              <span style="font-family:Georgia,\'Times New Roman\',serif;\n' +
'                           font-size:26px;font-weight:400;\n' +
'                           letter-spacing:0.05em;color:#ebe5d6;">\n' +
'                Logidma\n' +
'              </span>\n' +
'              <span style="display:inline-block;width:7px;height:7px;\n' +
'                           border-radius:50%;background-color:#c4ff3a;\n' +
'                           margin-left:5px;vertical-align:middle;"></span>\n' +
'            </td>\n' +
'          </tr>\n' +
'\n' +
'          <!-- ── CARD ── -->\n' +
'          <tr>\n' +
'            <td class="email-card"\n' +
'                style="background-color:#111110;border-radius:14px;\n' +
'                       border:1px solid rgba(235,229,214,0.09);overflow:hidden;">\n' +
'\n' +
'              <!-- Barra superior gradiente -->\n' +
'              <table width="100%" cellpadding="0" cellspacing="0" border="0">\n' +
'                <tr>\n' +
'                  <td style="height:4px;line-height:4px;font-size:4px;\n' +
'                             background:linear-gradient(90deg,#b08d57 0%,#c4ff3a 100%);">\n' +
'                    &nbsp;\n' +
'                  </td>\n' +
'                </tr>\n' +
'              </table>\n' +
'\n' +
'              <!-- ── HERO ── -->\n' +
'              <table width="100%" cellpadding="0" cellspacing="0" border="0">\n' +
'                <tr>\n' +
'                  <td class="inner-pad" style="padding:40px 40px 32px;">\n' +
'\n' +
'                    <!-- Kicker -->\n' +
'                    <p style="font-family:\'Manrope\',\'Segoe UI\',Arial,sans-serif;\n' +
'                              font-size:11px;font-weight:700;letter-spacing:0.13em;\n' +
'                              text-transform:uppercase;color:#9a9181;margin:0 0 14px;">\n' +
'                      Confirmación de solicitud\n' +
'                    </p>\n' +
'\n' +
'                    <!-- Título -->\n' +
'                    <h1 class="hero-title"\n' +
'                        style="font-family:Georgia,\'Times New Roman\',serif;\n' +
'                               font-size:34px;font-weight:400;line-height:1.22;\n' +
'                               color:#ebe5d6;margin:0 0 18px;">\n' +
'                      Ya estamos revisando<br/>\n' +
'                      <em style="color:#c4ff3a;font-style:italic;">tu solicitud</em>.\n' +
'                    </h1>\n' +
'\n' +
'                    <!-- Cuerpo del saludo -->\n' +
'                    <p style="font-family:\'Manrope\',\'Segoe UI\',Arial,sans-serif;\n' +
'                              font-size:15px;font-weight:300;color:#c9c2b0;\n' +
'                              line-height:1.7;margin:0 0 28px;">\n' +
'                      Hola <strong style="color:#ebe5d6;font-weight:600;">' + (datos.nombre || "cliente") + '</strong>,\n' +
'                      recibimos la información de\n' +
'                      <strong style="color:#ebe5d6;font-weight:600;">' + (datos.proyecto || "tu proyecto") + '</strong>.\n' +
'                      Nuestro equipo la está analizando y te escribiremos\n' +
'                      a la brevedad con los siguientes pasos.\n' +
'                    </p>\n' +
'\n' +
'                    <!-- Badge de ruta -->\n' +
'                    <table cellpadding="0" cellspacing="0" border="0">\n' +
'                      <tr>\n' +
'                        <td style="background-color:' + rutaBg + ';\n' +
'                                   border:1px solid ' + rutaColor + ';\n' +
'                                   border-radius:20px;padding:5px 16px;">\n' +
'                          <span style="font-family:\'Manrope\',\'Segoe UI\',Arial,sans-serif;\n' +
'                                       font-size:11px;font-weight:700;\n' +
'                                       letter-spacing:0.09em;text-transform:uppercase;\n' +
'                                       color:' + rutaColor + ';">\n' +
'                            ' + rutaLabel + '\n' +
'                          </span>\n' +
'                        </td>\n' +
'                      </tr>\n' +
'                    </table>\n' +
'\n' +
'                  </td>\n' +
'                </tr>\n' +
'              </table>\n' +
'\n' +
'              <!-- Divider -->\n' +
'              <table width="100%" cellpadding="0" cellspacing="0" border="0">\n' +
'                <tr><td style="height:1px;font-size:1px;line-height:1px;\n' +
'                               background-color:rgba(235,229,214,0.07);">&nbsp;</td></tr>\n' +
'              </table>\n' +
'\n' +
'              <!-- ── RESUMEN ── -->\n' +
'              <table width="100%" cellpadding="0" cellspacing="0" border="0">\n' +
'                <tr>\n' +
'                  <td class="inner-pad" style="padding:32px 40px 8px;">\n' +
'                    <p style="font-family:\'Manrope\',\'Segoe UI\',Arial,sans-serif;\n' +
'                              font-size:11px;font-weight:700;letter-spacing:0.13em;\n' +
'                              text-transform:uppercase;color:#9a9181;margin:0;">\n' +
'                      Resumen de tu solicitud\n' +
'                    </p>\n' +
'                  </td>\n' +
'                </tr>\n' +
'                <tr>\n' +
'                  <td class="inner-pad" style="padding:16px 40px 32px;">\n' +
'                    <table width="100%" cellpadding="0" cellspacing="0" border="0"\n' +
'                           style="border:1px solid #252320;border-radius:8px;\n' +
'                                  overflow:hidden;">\n' +
'                      <tbody>\n' +
                          fila("Nombre",   datos.nombre) +
                          fila("Proyecto", datos.proyecto) +
                          fila("Giro",     datos.giro) +
                          seccionWeb +
                          seccionAuto +
'                      </tbody>\n' +
'                    </table>\n' +
'                  </td>\n' +
'                </tr>\n' +
'              </table>\n' +
'\n' +
'              <!-- Divider -->\n' +
'              <table width="100%" cellpadding="0" cellspacing="0" border="0">\n' +
'                <tr><td style="height:1px;font-size:1px;line-height:1px;\n' +
'                               background-color:rgba(235,229,214,0.07);">&nbsp;</td></tr>\n' +
'              </table>\n' +
'\n' +
'              <!-- ── DATOS DE CONTACTO ── -->\n' +
'              <table width="100%" cellpadding="0" cellspacing="0" border="0">\n' +
'                <tr>\n' +
'                  <td class="inner-pad" style="padding:28px 40px 8px;">\n' +
'                    <p style="font-family:\'Manrope\',\'Segoe UI\',Arial,sans-serif;\n' +
'                              font-size:11px;font-weight:700;letter-spacing:0.13em;\n' +
'                              text-transform:uppercase;color:#9a9181;margin:0;">\n' +
'                      Tus datos de contacto\n' +
'                    </p>\n' +
'                  </td>\n' +
'                </tr>\n' +
'                <tr>\n' +
'                  <td class="inner-pad" style="padding:16px 40px 32px;">\n' +
'                    <table width="100%" cellpadding="0" cellspacing="0" border="0"\n' +
'                           style="border:1px solid #252320;border-radius:8px;\n' +
'                                  overflow:hidden;">\n' +
'                      <tbody>\n' +
                          fila("Correo",    datos.correo) +
                          fila("Teléfono",  datos.telefono) +
'                      </tbody>\n' +
'                    </table>\n' +
'                  </td>\n' +
'                </tr>\n' +
'              </table>\n' +
'\n' +
'              <!-- Divider -->\n' +
'              <table width="100%" cellpadding="0" cellspacing="0" border="0">\n' +
'                <tr><td style="height:1px;font-size:1px;line-height:1px;\n' +
'                               background-color:rgba(235,229,214,0.07);">&nbsp;</td></tr>\n' +
'              </table>\n' +
'\n' +
'              <!-- ── ¿QUÉ SIGUE? + CTA ── -->\n' +
'              <table width="100%" cellpadding="0" cellspacing="0" border="0">\n' +
'                <tr>\n' +
'                  <td class="inner-pad" style="padding:32px 40px 40px;text-align:center;">\n' +
'\n' +
'                    <!-- Bloque informativo -->\n' +
'                    <table width="100%" cellpadding="0" cellspacing="0" border="0"\n' +
'                           style="background-color:#16140f;border-radius:10px;\n' +
'                                  border:1px solid rgba(196,255,58,0.14);margin-bottom:28px;">\n' +
'                      <tr>\n' +
'                        <td style="padding:18px 24px;">\n' +
'                          <p style="font-family:\'Manrope\',\'Segoe UI\',Arial,sans-serif;\n' +
'                                    font-size:13px;color:#c9c2b0;line-height:1.65;\n' +
'                                    margin:0;text-align:left;">\n' +
'                            <strong style="color:#c4ff3a;">¿Qué sigue?</strong>\n' +
'                            &nbsp;Nuestro equipo revisará los detalles de tu proyecto y\n' +
'                            te enviará una propuesta personalizada. El tiempo estimado\n' +
'                            de respuesta es de\n' +
'                            <strong style="color:#ebe5d6;">1–2 días hábiles</strong>.\n' +
'                          </p>\n' +
'                        </td>\n' +
'                      </tr>\n' +
'                    </table>\n' +
'\n' +
'                    <!-- Botón CTA -->\n' +
'                    <table cellpadding="0" cellspacing="0" border="0" align="center">\n' +
'                      <tr>\n' +
'                        <td style="background-color:#c4ff3a;border-radius:8px;">\n' +
'                          <a href="https://logidma.com"\n' +
'                             style="display:inline-block;padding:14px 36px;\n' +
'                                    font-family:\'Manrope\',\'Segoe UI\',Arial,sans-serif;\n' +
'                                    font-size:14px;font-weight:700;letter-spacing:0.04em;\n' +
'                                    color:#0a0908;text-decoration:none;">\n' +
'                            Visitar logidma.com &rarr;\n' +
'                          </a>\n' +
'                        </td>\n' +
'                      </tr>\n' +
'                    </table>\n' +
'\n' +
'                  </td>\n' +
'                </tr>\n' +
'              </table>\n' +
'\n' +
'            </td>\n' +
'          </tr>\n' +
'          <!-- fin card -->\n' +
'\n' +
'          <!-- ── FOOTER ── -->\n' +
'          <tr>\n' +
'            <td style="padding:28px 0 0;text-align:center;">\n' +
'              <p style="font-family:\'Manrope\',\'Segoe UI\',Arial,sans-serif;\n' +
'                        font-size:12px;color:#9a9181;line-height:1.6;margin:0 0 6px;">\n' +
'                Este correo se generó automáticamente al completar el formulario\n' +
'                de onboarding en\n' +
'                <a href="https://logidma.com"\n' +
'                   style="color:#9a9181;text-decoration:underline;">logidma.com</a>.\n' +
'              </p>\n' +
'              <p style="font-family:\'Manrope\',\'Segoe UI\',Arial,sans-serif;\n' +
'                        font-size:12px;color:#9a9181;margin:0;">\n' +
'                &copy; ' + anio + ' Logidma &mdash; La lógica, sistematizada.\n' +
'              </p>\n' +
'            </td>\n' +
'          </tr>\n' +
'\n' +
'        </table>\n' +
'      </td>\n' +
'    </tr>\n' +
'  </table>\n' +
'\n' +
'</body>\n' +
'</html>';
}
