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

// ─────────────────────────────────────────────────────────────────────────────
// Private Reply — responder por DM a quien COMENTÓ en una publicación
// (Meta permite 1 private reply por comentario, dentro de los 7 días)
// ─────────────────────────────────────────────────────────────────────────────

async function enviarPrivateReply(commentId, texto) {
  const token = process.env.PAGE_ACCESS_TOKEN;
  if (!token) {
    console.error("[ROC BOT] ERROR: PAGE_ACCESS_TOKEN no configurado.");
    return;
  }

  try {
    const response = await axios.post(
      `${GRAPH_API_URL}/me/messages`,
      {
        recipient: { comment_id: commentId },
        message: { text: texto },
      },
      {
        params: { access_token: token },
        headers: { "Content-Type": "application/json" },
      }
    );
    console.log(`[ROC BOT] Private reply enviado al comentario ${commentId}`);
    return response.data;
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error("[ROC BOT] Error en private reply:", JSON.stringify(errData, null, 2));
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Responder PÚBLICAMENTE a un comentario (avisa que le mandamos DM)
// ─────────────────────────────────────────────────────────────────────────────

async function responderComentario(commentId, texto) {
  const token = process.env.PAGE_ACCESS_TOKEN;
  if (!token) return;

  try {
    await axios.post(
      `${GRAPH_API_URL}/${commentId}/replies`,
      { message: texto },
      { params: { access_token: token } }
    );
    console.log(`[ROC BOT] Respuesta pública al comentario ${commentId}`);
  } catch (err) {
    const errData = err.response?.data || err.message;
    console.warn("[ROC BOT] No se pudo responder el comentario:", JSON.stringify(errData));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suscripción del webhook (mecanismo copiado de Cerdín/Carrera Sucia)
// Suscribe la cuenta de IG a los campos messages + comments
// ─────────────────────────────────────────────────────────────────────────────

const IG_ACCOUNT_ID = process.env.IG_ACCOUNT_ID || "17841403090981940"; // @carreraroc

async function suscribirWebhook() {
  const token = process.env.PAGE_ACCESS_TOKEN;
  if (!token) return { error: "PAGE_ACCESS_TOKEN no configurado" };

  try {
    const r = await axios.post(
      `${GRAPH_API_URL}/${IG_ACCOUNT_ID}/subscribed_apps`,
      null,
      { params: { subscribed_fields: "messages,comments", access_token: token } }
    );
    console.log("[ROC BOT] ✅ Suscripción webhook (messages,comments):", JSON.stringify(r.data));
    return r.data;
  } catch (err) {
    const errData = err.response?.data || err.message;
    console.error("[ROC BOT] ❌ Error suscribiendo webhook:", JSON.stringify(errData));
    return { error: errData };
  }
}

async function estadoSuscripcion() {
  const token = process.env.PAGE_ACCESS_TOKEN;
  if (!token) return { error: "PAGE_ACCESS_TOKEN no configurado" };

  try {
    const r = await axios.get(`${GRAPH_API_URL}/${IG_ACCOUNT_ID}/subscribed_apps`, {
      params: { access_token: token },
    });
    return r.data;
  } catch (err) {
    return { error: err.response?.data || err.message };
  }
}

module.exports = { enviarMensaje, marcarVisto, escribiendo, enviarPrivateReply, responderComentario, suscribirWebhook, estadoSuscripcion };
