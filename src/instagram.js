// ─────────────────────────────────────────────────────────────────────────────
// ROC BOT — Cliente de Instagram / Meta Graph API
// Envía mensajes de vuelta al usuario vía DM
// ─────────────────────────────────────────────────────────────────────────────

const axios = require("axios");

const GRAPH_API_URL = "https://graph.facebook.com/v19.0";

// ─────────────────────────────────────────────────────────────────────────────
// Enviar mensaje de texto
// ─────────────────────────────────────────────────────────────────────────────

async function enviarMensaje(recipientId, texto) {
  const token = process.env.PAGE_ACCESS_TOKEN;

  if (!token) {
    console.error("[ROC BOT] ERROR: PAGE_ACCESS_TOKEN no configurado.");
    return;
  }

  try {
    const response = await axios.post(
      `${GRAPH_API_URL}/me/messages`,
      {
        recipient: { id: recipientId },
        message: { text: texto },
        messaging_type: "RESPONSE",
      },
      {
        params: { access_token: token },
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log(
      `[ROC BOT] Mensaje enviado a ${recipientId} → message_id: ${response.data.message_id}`
    );
    return response.data;
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error("[ROC BOT] Error al enviar mensaje:", JSON.stringify(errData, null, 2));
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Marcar como "visto" (typing indicator opcional)
// ─────────────────────────────────────────────────────────────────────────────

async function marcarVisto(recipientId) {
  const token = process.env.PAGE_ACCESS_TOKEN;
  if (!token) return;

  try {
    await axios.post(
      `${GRAPH_API_URL}/me/messages`,
      {
        recipient: { id: recipientId },
        sender_action: "mark_seen",
      },
      { params: { access_token: token } }
    );
  } catch (err) {
    // No crítico — ignoramos errores del mark_seen
    console.warn("[ROC BOT] No se pudo marcar como visto:", err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Indicador "escribiendo..."
// ─────────────────────────────────────────────────────────────────────────────

async function escribiendo(recipientId) {
  const token = process.env.PAGE_ACCESS_TOKEN;
  if (!token) return;

  try {
    await axios.post(
      `${GRAPH_API_URL}/me/messages`,
      {
        recipient: { id: recipientId },
        sender_action: "typing_on",
      },
      { params: { access_token: token } }
    );
  } catch (err) {
    console.warn("[ROC BOT] No se pudo activar typing:", err.message);
  }
}

module.exports = { enviarMensaje, marcarVisto, escribiendo };
