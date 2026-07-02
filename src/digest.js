// ─────────────────────────────────────────────────────────────────────────────
// ROC BOT — Digest diario de preguntas sin respuesta
// Acumula los mensajes que el bot no supo responder durante el día
// y los envía en un solo email a las 23:00 a carrerasucia@gmail.com
// ─────────────────────────────────────────────────────────────────────────────

const cron = require("node-cron");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Buffer en memoria de preguntas sin respuesta del día
const preguntasDelDia = [];

// ── Registrar una pregunta sin respuesta ──────────────────────────────────
function registrarPreguntaSinRespuesta(usuario, mensaje) {
  preguntasDelDia.push({
    hora: new Date().toLocaleTimeString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit" }),
    usuario: usuario || "desconocido",
    mensaje,
  });
  console.log(`[DIGEST] Pregunta registrada: "${mensaje}" de @${usuario}`);
}

// ── Generar HTML del email digest ─────────────────────────────────────────
function generarEmailDigest(preguntas) {
  const hoy = new Date().toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const filas = preguntas.map(p => `
    <tr>
      <td style="padding:10px 14px;font-size:13px;color:#888;border-bottom:1px solid #f0f0f0;white-space:nowrap;">${p.hora}hs</td>
      <td style="padding:10px 14px;font-size:13px;color:#CC1122;border-bottom:1px solid #f0f0f0;white-space:nowrap;">@${p.usuario}</td>
      <td style="padding:10px 14px;font-size:14px;color:#0a0a0a;border-bottom:1px solid #f0f0f0;">${p.mensaje}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>ROC Bot — Digest ${hoy}</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000000;">
    <tr>
      <td align="center" style="padding:24px;">
        <div style="font-size:28px;font-weight:900;letter-spacing:6px;color:#CC1122;">ROC BOT</div>
        <div style="font-size:11px;color:#555;letter-spacing:3px;margin-top:4px;">PREGUNTAS SIN RESPUESTA</div>
      </td>
    </tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 16px;">
              <div style="font-size:18px;font-weight:700;color:#0a0a0a;">Resumen del día — ${hoy}</div>
              <div style="font-size:14px;color:#666;margin-top:6px;">
                El bot recibió <strong>${preguntas.length} pregunta${preguntas.length !== 1 ? "s" : ""}</strong> que no supo responder.
                Revisalas y avisame para agregar las respuestas.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
                <thead>
                  <tr style="background:#f8f8f8;">
                    <th style="padding:10px 14px;font-size:11px;color:#999;letter-spacing:2px;text-align:left;border-bottom:2px solid #e5e7eb;">HORA</th>
                    <th style="padding:10px 14px;font-size:11px;color:#999;letter-spacing:2px;text-align:left;border-bottom:2px solid #e5e7eb;">USUARIO</th>
                    <th style="padding:10px 14px;font-size:11px;color:#999;letter-spacing:2px;text-align:left;border-bottom:2px solid #e5e7eb;">PREGUNTA</th>
                  </tr>
                </thead>
                <tbody>
                  ${filas}
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <div style="background:#fff8f8;border-left:3px solid #CC1122;padding:14px 18px;font-size:13px;color:#666;line-height:1.6;">
                💡 <strong>¿Cómo mejorar el bot?</strong><br>
                Respondé este email con la pregunta y la respuesta correcta, y lo actualizo.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr>
      <td align="center" style="padding:20px;">
        <div style="font-size:11px;color:#444;">ROC BOT · @carreraroc · rocargentina.com</div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Enviar digest ─────────────────────────────────────────────────────────
async function enviarDigest() {
  if (preguntasDelDia.length === 0) {
    console.log("[DIGEST] Sin preguntas pendientes hoy, no se envía email.");
    return;
  }

  const cantPreguntas = preguntasDelDia.length;
  const html = generarEmailDigest([...preguntasDelDia]);

  // Limpiar buffer antes de enviar (por si el envío tarda)
  preguntasDelDia.length = 0;

  try {
    const { data, error } = await resend.emails.send({
      from: "ROC Bot <noreply@rocargentina.com>",
      replyTo: "carrerasucia@gmail.com",
      to: "carrerasucia@gmail.com",
      subject: `🤖 ROC Bot — ${cantPreguntas} pregunta${cantPreguntas !== 1 ? "s" : ""} sin respuesta hoy`,
      html,
    });

    if (error) {
      console.error("[DIGEST] Error Resend:", error);
    } else {
      console.log(`[DIGEST] Email enviado con ${cantPreguntas} preguntas. ID: ${data?.id}`);
    }
  } catch (err) {
    console.error("[DIGEST] Error inesperado:", err);
  }
}

// ── Iniciar cron ──────────────────────────────────────────────────────────
// Todos los días a las 23:00 hora Argentina
function iniciarDigest() {
  cron.schedule("0 23 * * *", enviarDigest, {
    timezone: "America/Argentina/Buenos_Aires",
  });
  console.log("[DIGEST] Cron activo — digest diario a las 23:00 AR");
}

module.exports = { registrarPreguntaSinRespuesta, iniciarDigest };
