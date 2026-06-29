// ─────────────────────────────────────────────────────────────────────────────
// ROC BOT — Servidor principal
// Express + Webhook de Instagram (Meta Graph API)
// ─────────────────────────────────────────────────────────────────────────────

require("dotenv").config();

const express = require("express");
const crypto  = require("crypto");
const { generarRespuesta } = require("./messageHandler");
const { enviarMensaje, marcarVisto, escribiendo } = require("./instagram");

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

function verificarFirma(req) {
  const appSecret = process.env.APP_SECRET;
  if (!appSecret) {
    console.warn("[ROC BOT] APP_SECRET no configurado — saltando verificación de firma.");
    return true;
  }

  const signature = req.headers["x-hub-signature-256"];
  if (!signature) return false;

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(req.rawBody).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
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
  }
});

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

    // Generar y enviar respuesta
    const respuesta = generarRespuesta(textoUsuario);
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
    version: "1.0.0",
    evento: "ROC 2026 – 29 de noviembre – Campo de Mayo",
  });
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
  console.log(`   App secret:   ${process.env.APP_SECRET ? "✅ configurado" : "⚠️  sin configurar"}\n`);
});
