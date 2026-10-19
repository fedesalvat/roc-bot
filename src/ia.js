// ─────────────────────────────────────────────────────────────────────────────
// ROC BOT — Modo inteligente (Claude)
// Si ANTHROPIC_API_KEY está configurada en Railway, el bot entiende las
// preguntas con IA y responde SOLO con la info oficial de ROC. Si la IA no
// está configurada o falla, el bot vuelve al modo de palabras clave.
// ─────────────────────────────────────────────────────────────────────────────

const axios = require("axios");
const { INFO, loteActual, hoyAR, obtenerLlenos } = require("./knowledge");

const MODELO = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";

function iaActiva() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// ── Memoria corta por usuario (últimos mensajes, se borra a las 24 h) ────────
const historiales = new Map(); // userId → { t, msgs: [{role, content}] }

function historial(userId) {
  const h = historiales.get(userId);
  if (!h || Date.now() - h.t > 24 * 60 * 60 * 1000) return [];
  return h.msgs;
}

function guardar(userId, role, content) {
  const msgs = historial(userId).slice(-10);
  msgs.push({ role, content });
  historiales.set(userId, { t: Date.now(), msgs });
}

// ── Datos oficiales que la IA puede usar ─────────────────────────────────────
function peso(n) {
  return "$" + n.toLocaleString("es-AR");
}

async function fichaDelEvento() {
  const l = loteActual();
  const llenos = await obtenerLlenos();
  const salidas = INFO.salidas
    .map((s) => {
      if (!llenos || !(s.clave in llenos)) return `- ${s.texto}`;
      return `- ${s.texto}: ${llenos[s.clave] ? "COMPLETA (sin lugar)" : "hay lugar"}`;
    })
    .join("\n");

  const lotes = INFO.lotes
    .map((x) => `- ${x.periodo}: ${peso(x.precio)}`)
    .join("\n");

  return `
HOY ES: ${hoyAR()} (año-mes-día, hora Argentina)

EVENTO
- Nombre: ROC – Race Obstacle Course. Lema: "Correr no es suficiente".
- Fecha: domingo 29 de noviembre de 2026.
- Lugar: Campo de Mayo, Provincia de Buenos Aires. La salida es en el sector de Asalto Aéreo de Campo de Mayo.
- Distancia: 8 km con más de 30 obstáculos, con estilo militar (paredes de distintas alturas, estructuras aéreas, subidas en soga, trepadoras).
- En el predio: foodtrucks y música en vivo.
- Organiza: Fun Run Entertainment, con la Fundación Soldados y el Ejército Argentino.

PRECIOS (categoría Open, sin remera)
${lotes}
- Precio vigente hoy: ${l ? peso(l.precio) : "inscripciones online cerradas"}${l && l.siguiente ? ` (sube a ${peso(l.siguiente.precio)} el ${l.siguiente.desde})` : ""}.
- Adicionales: Competitiva +$7.000, Elite +$15.000, remera oficial +$15.000 (opcional). Cambio de participante: $10.000.
- Fecha límite de pago: lunes 23 de noviembre. Las inscripciones online cierran el 24 de noviembre.
- Se paga con MercadoPago. Al confirmarse el pago llega un mail con el número de corredor y un código QR.

INSCRIPCIÓN
- Link: ${INFO.inscripciones_link}
- Es individual. Para correr con amigos, se anotan todos en la misma salida.
- Edad mínima: 13 años cumplidos al 29/11/2026. Menores de 18: el deslinde lo firma también padre, madre o tutor.
- Deslinde: se firma online (no hace falta llevar papel). Si te inscribís ahora, se firma en el formulario. A los ya inscriptos les llegó un mail con el link para firmarlo.

CATEGORÍAS Y SALIDAS (estado en vivo)
- Elite: obstáculos 100% obligatorios; si no superás uno quedás descalificado. Premiada.
- Competitiva: si no completás un obstáculo tenés penalidad. Premiada.
- Open: a tu ritmo; si no querés o no podés hacer un obstáculo pagás una penalidad y seguís.
${salidas}

PREMIOS
- Elite: 1° $100.000, 2° $75.000, 3° $50.000.
- Competitiva: 1° $45.000, 2° $35.000, 3° $25.000.

CONTACTO
- Mail: info@rocargentina.com
- Web: rocargentina.com (ahí está el reglamento completo)
- Propuestas de prensa, contenido, drones, sponsors o colaboraciones: federico@carrerasucia.com.ar
`.trim();
}

function instrucciones(ficha) {
  return `Sos el asistente automático de mensajes directos de Instagram de @carreraroc, la carrera de obstáculos ROC.

Tu trabajo es contestar consultas de corredores usando ÚNICAMENTE los datos oficiales de abajo.

CÓMO RESPONDER
- Español rioplatense (vos, tenés, inscribite), tono cálido pero con la onda intensa de ROC. Podés usar 1 o 2 emojis.
- Respuestas cortas: 1 a 4 oraciones. Respondé exactamente lo que preguntaron, sin agregar todo el menú de información.
- Texto plano: sin asteriscos, sin negritas, sin markdown, sin títulos.
- Si la pregunta es sobre precios o inscripción, incluí el link de inscripción.
- Si te saludan sin preguntar nada, saludá y preguntá en qué los podés ayudar.

LO QUE NO SABÉS
- Nunca inventes datos (horarios de retiro de kit, estacionamiento, cómo llegar en transporte, si hay guardarropas, si pueden ir espectadores, descuentos, etc.). Si la respuesta no está en los datos oficiales, respondé exactamente con el texto:
[DERIVAR] seguido de una frase corta y amable diciendo que se lo pasás al equipo y que le van a responder por acá.
- Si el mensaje es solo un agradecimiento, un "ok", un emoji, un audio o algo que no necesita respuesta, respondé exactamente: [SILENCIO]
- Si piden hablar con una persona, o tienen un problema con su pago, su inscripción o sus datos, usá [DERIVAR].

DATOS OFICIALES
${ficha}`;
}

// ── Llamada a la IA ──────────────────────────────────────────────────────────
// Devuelve { tipo: "respuesta" | "derivar" | "silencio", texto }
// o null si la IA no está disponible (el bot usa el modo palabras clave).
async function responderConIA(userId, mensaje) {
  if (!iaActiva()) return null;

  try {
    const ficha = await fichaDelEvento();
    const mensajes = [...historial(userId), { role: "user", content: mensaje }];

    const r = await axios.post(
      (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com") + "/v1/messages",
      {
        model: MODELO,
        max_tokens: 400,
        system: instrucciones(ficha),
        messages: mensajes,
      },
      {
        timeout: 15000,
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      }
    );

    const texto = (r.data?.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!texto) return null;

    guardar(userId, "user", mensaje);

    if (texto.startsWith("[SILENCIO]")) {
      guardar(userId, "assistant", "(sin respuesta)");
      return { tipo: "silencio", texto: "" };
    }
    if (texto.startsWith("[DERIVAR]")) {
      const limpio =
        texto.replace("[DERIVAR]", "").trim() ||
        "Esa te la paso al equipo y te responden por acá en breve. 🙌";
      guardar(userId, "assistant", limpio);
      return { tipo: "derivar", texto: limpio };
    }

    guardar(userId, "assistant", texto);
    return { tipo: "respuesta", texto };
  } catch (err) {
    console.error("[ROC BOT] IA no disponible, uso palabras clave:", JSON.stringify(err.response?.data || err.message));
    return null;
  }
}

module.exports = { iaActiva, responderConIA, MODELO };
