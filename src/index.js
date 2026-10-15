// ─────────────────────────────────────────────────────────────────────────────
// ROC BOT — Servidor principal
// Express + Webhook de Instagram (Meta Graph API)
// ─────────────────────────────────────────────────────────────────────────────

require("dotenv").config();

const express = require("express");
const crypto  = require("crypto");
const { generarRespuesta } = require("./messageHandler");
const { tokenEsInstagram, enviarMensaje, marcarVisto, escribiendo, enviarPrivateReply, responderComentario, suscribirWebhook, estadoSuscripcion } = require("./instagram");
const { RESPUESTAS } = require("./knowledge");
const { iniciarDigest } = require("./digest");

const app  = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// Necesitamos el raw body para verificar la firma de Meta
// ─────────────────────────────────────────────────────────────────────────────

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /webhook — verificación del webhook con Meta
// ─────────────────────────────────────────────────────────────────────────────

app.get("/webhook", (req, res) => {
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("[ROC BOT] ✅ Webhook verificado por Meta.");
    return res.status(200).send(challenge);
  }

  console.warn("[ROC BOT] ⚠️  Verificación de webhook fallida.", { mode, token });
  return res.sendStatus(403);
});

// ─────────────────────────────────────────────────────────────────────────────
// Verificar firma X-Hub-Signature-256
// ─────────────────────────────────────────────────────────────────────────────

// Meta firma con el secreto de la app de Facebook (APP_SECRET) o, si el webhook
// es del producto "Instagram con inicio de sesión de Instagram", con el secreto
// de la app de Instagram (INSTAGRAM_APP_SECRET). Aceptamos cualquiera de los dos.
function verificarFirma(req) {
  const secretos = [process.env.APP_SECRET, process.env.INSTAGRAM_APP_SECRET].filter(Boolean);
  if (secretos.length === 0) {
    console.warn("[ROC BOT] APP_SECRET no configurado — saltando verificación de firma.");
    return true;
  }

  const signature = req.headers["x-hub-signature-256"];
  if (!signature || !req.rawBody) return false;

  return secretos.some((secreto) => {
    const expected =
      "sha256=" + crypto.createHmac("sha256", secreto).update(req.rawBody).digest("hex");
    return (
      signature.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /webhook — recibir eventos de Instagram
// ─────────────────────────────────────────────────────────────────────────────

app.post("/webhook", async (req, res) => {
  // Responder 200 inmediatamente (Meta requiere respuesta rápida)
  res.sendStatus(200);

  // Verificar firma
  if (!verificarFirma(req)) {
    console.warn("[ROC BOT] ⚠️  Firma inválida — evento descartado.");
    return;
  }

  const body = req.body;

  // Solo procesamos eventos de Instagram
  if (body.object !== "instagram" && body.object !== "page") {
    console.log(`[ROC BOT] Objeto ignorado: ${body.object}`);
    return;
  }

  const entries = body.entry || [];

  for (const entry of entries) {
    const eventos = entry.messaging || [];

    for (const evento of eventos) {
      await procesarEvento(evento);
    }

    // Comentarios en publicaciones (field "comments")
    const cambios = entry.changes || [];
    for (const cambio of cambios) {
      if (cambio.field === "comments") {
        await procesarComentario(cambio.value, entry.id);
      }
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Procesar un comentario en una publicación
// Si pide info ("info", "precio", etc.) → le mandamos DM con la data básica
// ─────────────────────────────────────────────────────────────────────────────

const REGEX_PIDE_INFO = /\b(info|informacion|información|precio|precios|cu[aá]nto|valor|inscri\w*|anotar|dm|data|d[oó]nde|cu[aá]ndo)\b/i;

async function procesarComentario(valor, cuentaPropiaId) {
  const commentId = valor?.id;
  const texto     = valor?.text || "";
  const autorId   = valor?.from?.id;

  if (!commentId || !autorId) return;

  // Ignorar nuestros propios comentarios (evita loops con nuestras respuestas)
  if (String(autorId) === String(cuentaPropiaId)) return;

  console.log(`[ROC BOT] 💬 Comentario de ${valor?.from?.username || autorId}: "${texto}"`);

  if (!REGEX_PIDE_INFO.test(texto)) return;

  try {
    // DM con la info básica de la carrera
    await enviarPrivateReply(commentId, RESPUESTAS.comentarioInfo());
    // Aviso público para que revise sus mensajes
    await responderComentario(commentId, "¡Te mandamos toda la info por DM! 📩💀 Revisá tus mensajes.");
  } catch (err) {
    console.error(`[ROC BOT] Error procesando comentario ${commentId}:`, err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Procesar un evento de mensajería individual
// ─────────────────────────────────────────────────────────────────────────────

async function procesarEvento(evento) {
  // Solo mensajes de texto entrantes
  if (!evento.message || evento.message.is_echo) return;

  const senderId   = evento.sender?.id;
  const textoUsuario = evento.message?.text;

  if (!senderId) return;

  console.log(`[ROC BOT] 📩 Mensaje de ${senderId}: "${textoUsuario}"`);

  try {
    // Simular que el bot está viendo / escribiendo
    await marcarVisto(senderId);

    // Pequeña pausa para efecto natural (500ms)
    await sleep(500);
    await escribiendo(senderId);
    await sleep(800);

    // Generar y enviar respuesta (pasar senderId como usuario para el digest)
    const respuesta = await generarRespuesta(textoUsuario, senderId);
    await enviarMensaje(senderId, respuesta);
  } catch (err) {
    console.error(`[ROC BOT] Error procesando evento para ${senderId}:`, err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET / — health check
// ─────────────────────────────────────────────────────────────────────────────

app.get("/", (_req, res) => {
  res.json({
    bot: "ROC Bot",
    estado: "activo 💀",
    version: "1.2.0",
    evento: "ROC 2026 – 29 de noviembre – Campo de Mayo",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /debug — estado de la suscripción del webhook (requiere verify token)
// GET /debug?resuscribir=1 — fuerza re-suscripción
// ─────────────────────────────────────────────────────────────────────────────

app.get("/debug", async (req, res) => {
  if (req.query.token !== process.env.VERIFY_TOKEN) return res.sendStatus(403);

  const acciones = {};
  if (req.query.resuscribir === "1") {
    acciones.resuscripcion = await suscribirWebhook();
  }
  // ?extender=1 — canjea el PAGE_ACCESS_TOKEN actual por uno de larga duración.
  // El token nuevo se imprime SOLO en los logs de Railway (no en la respuesta HTTP).
  if (req.query.extender === "1") {
    try {
      const axios = require("axios");
      const r = await axios.get("https://graph.facebook.com/v20.0/oauth/access_token", {
        params: {
          grant_type: "fb_exchange_token",
          client_id: "1647607492990459",
          client_secret: process.env.APP_SECRET,
          fb_exchange_token: process.env.PAGE_ACCESS_TOKEN,
        },
      });
      console.log("[ROC BOT] 🔑 TOKEN DE LARGA DURACIÓN (copiar a Railway → PAGE_ACCESS_TOKEN):");
      console.log(r.data.access_token);
      acciones.extension = { ok: true, nota: "Token nuevo impreso en los logs de Railway" };
    } catch (err) {
      acciones.extension = { error: err.response?.data || err.message };
    }
  }
  // ?refrescar=1 — renueva un token de Instagram Login por 60 días más.
  // El token nuevo se imprime SOLO en los logs de Railway.
  if (req.query.refrescar === "1") {
    try {
      const axios = require("axios");
      const r = await axios.get("https://graph.instagram.com/refresh_access_token", {
        params: { grant_type: "ig_refresh_token", access_token: process.env.PAGE_ACCESS_TOKEN },
      });
      console.log("[ROC BOT] 🔑 TOKEN RENOVADO (copiar a Railway → PAGE_ACCESS_TOKEN):");
      console.log(r.data.access_token);
      acciones.refresco = { ok: true, vence_en_dias: Math.round((r.data.expires_in || 0) / 86400), nota: "Token nuevo impreso en los logs de Railway" };
    } catch (err) {
      acciones.refresco = { error: err.response?.data || err.message };
    }
  }
  acciones.tipo_token = tokenEsInstagram(process.env.PAGE_ACCESS_TOKEN) ? "instagram_login" : "pagina_facebook";
  acciones.firma_instagram_secret = process.env.INSTAGRAM_APP_SECRET ? "configurado" : "no";
  acciones.suscripcion_actual = await estadoSuscripcion();
  res.json(acciones);
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// Arrancar servidor
// ─────────────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n💀 ROC BOT arrancado en puerto ${PORT}`);
  console.log(`   Webhook:    GET/POST /webhook`);
  console.log(`   Health:     GET /`);
  console.log(`   Verify token: ${process.env.VERIFY_TOKEN ? "✅ configurado" : "❌ FALTA CONFIGURAR"}`);
  console.log(`   Page token:   ${process.env.PAGE_ACCESS_TOKEN ? "✅ configurado" : "❌ FALTA CONFIGURAR"}`);
  console.log(`   App secret:   ${process.env.APP_SECRET ? "✅ configurado" : "⚠️  sin configurar"}`);
  console.log(`   Resend:       ${process.env.RESEND_API_KEY ? "✅ configurado" : "⚠️  sin configurar (digest desactivado)"}\n`);

  // Iniciar cron de digest diario (solo si Resend está configurado)
  if (process.env.RESEND_API_KEY) {
    iniciarDigest();
  }

  // Auto-suscribir el webhook a messages + comments al arrancar
  suscribirWebhook();
});
