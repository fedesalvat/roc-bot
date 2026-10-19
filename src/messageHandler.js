// ─────────────────────────────────────────────────────────────────────────────
// ROC BOT — Procesador de mensajes
// Detecta la intención del usuario y devuelve la respuesta adecuada
// ─────────────────────────────────────────────────────────────────────────────

const { RESPUESTAS } = require("./knowledge");
const { responderConIA } = require("./ia");
const { registrarPreguntaSinRespuesta } = require("./digest");

// ─────────────────────────────────────────────────────────────────────────────
// Mapa de keywords → intención
// ─────────────────────────────────────────────────────────────────────────────

const INTENCIONES = [
  {
    nombre: "info",
    keywords: [
      "info", "informacion", "data", "detalles", "mas datos", "quiero saber",
      "me pasas", "me pasan", "me das", "me dan", "contame", "cuentame",
    ],
  },
  {
    nombre: "mail_confirmacion",
    keywords: [
      "no me llego", "no llego el mail", "no recibi", "no me lleg",
      "mail de confirmacion", "confirmacion", "mi numero", "numero de corredor",
      "qr",
    ],
  },
  {
    nombre: "deslinde",
    keywords: [
      "deslinde", "deslindes", "firmar", "firma", "apto", "declaracion jurada",
      "acta", "responsabilidad",
    ],
  },
  {
    nombre: "edad",
    keywords: [
      "edad", "menor", "menores", "mi hijo", "mi hija", "anos", "años",
      "chico", "chicos", "nene", "adolescente",
    ],
  },
  {
    nombre: "horarios",
    keywords: [
      "horario", "horarios", "salida", "salidas", "hora", "largada",
      "a que hora", "turno", "cupo", "cupos", "lugar disponible", "hay lugar",
      "agotad", "lleno",
    ],
  },
  {
    nombre: "remera",
    keywords: ["remera", "camiseta", "talle", "kit"],
  },
  {
    nombre: "inscripcion",
    keywords: [
      "inscri", "anotar", "registr", "como me anoto", "quiero correr",
      "quiero participar", "link", "eventol", "comprar", "pagar",
      "como participo", "participar",
    ],
  },
  {
    nombre: "precios",
    keywords: [
      "precio", "cuánto", "cuanto", "cuesta", "vale", "valor",
      "tarifa", "plata", "costo", "importe", "sale", "salen", "abonar",
    ],
  },
  {
    nombre: "fecha",
    keywords: [
      "fecha", "cuándo", "cuando", "dia", "día", "noviembre",
      "2026", "domingo",
    ],
  },
  {
    nombre: "lugar",
    keywords: [
      "donde", "dónde", "lugar", "ubicacion", "ubicación", "campo de mayo", "direccion", "dirección", "como llego", "llegar",
      "localidad", "como llegar", "cómo llegar", "mapa",
    ],
  },
  {
    nombre: "premios",
    keywords: [
      "premio", "premios", "ganador", "ganar", "gana", "plata",
      "primero", "segundo", "tercero", "podio",
    ],
  },
  {
    nombre: "categorias",
    keywords: [
      "categoria", "categoría", "categorias", "categorías",
      "elite", "competitiva", "general", "chip", "tiempo",
      "obligatorio",
    ],
  },
  {
    nombre: "reglamento",
    keywords: [
      "reglamento", "reglas", "regla", "penali", "bypass",
      "como funciona", "cómo funciona", "normas", "bases",
    ],
  },
  {
    nombre: "que_es",
    keywords: [
      "que es", "qué es", "que son", "qué son", "roc", "race",
      "obstacle", "carrera de obstaculos", "de que se trata",
    ],
  },
  {
    nombre: "obstaculos",
    keywords: [
      "obstaculo", "obstaculos", "pared", "soga", "trapadora",
      "aereo", "estructura", "militar", "que obstaculos", "obstáculo", "trepadora",
    ],
  },
  {
    nombre: "servicios",
    keywords: [
      "servicio", "servicios", "comida", "foodtruck", "food truck",
      "musica", "música", "en vivo", "predio", "hay en el predio",
      "que hay en", "que tienen en",
    ],
  },
  {
    nombre: "grupos",
    keywords: [
      "grupo", "grupos", "grupal", "amigos", "equipo", "team",
      "juntos", "varios", "familia", "con amigos", "con mi grupo",
      "puedo ir con", "somos varios",
    ],
  },
  {
    nombre: "contacto",
    keywords: [
      "contacto", "mail", "email", "correo", "whatsapp", "hablar",
      "comunicar", "teléfono", "telefono",
    ],
  },
  {
    nombre: "bienvenida",
    keywords: [
      "hola", "buenas", "buen dia", "buen día", "buenos dias",
      "buenos días", "buenas noches", "buenas tardes", "hey",
      "hi", "hello", "ey", "saludos",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Normalizar texto (minúsculas, sin acentos, sin puntuación)
// ─────────────────────────────────────────────────────────────────────────────

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quitar tildes
    .replace(/[^a-z0-9\s]/g, " ")   // quitar puntuación
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Detectar intención
// ─────────────────────────────────────────────────────────────────────────────

function detectarIntencion(texto) {
  // Se compara al inicio de palabra (" " + kw) para que, por ejemplo,
  // "ahora" no dispare "hora" ni "contacto" dispare "acta".
  const normalizado = " " + normalizar(texto).replace(/\s+/g, " ");

  for (const intencion of INTENCIONES) {
    for (const kw of intencion.keywords) {
      if (normalizado.includes(" " + normalizar(kw))) {
        return intencion.nombre;
      }
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generar respuesta
// ─────────────────────────────────────────────────────────────────────────────

// Mensajes que no necesitan respuesta ("gracias", "ok", emojis sueltos)
const PALABRAS_CIERRE = new Set([
  "gracias", "muchas", "mil", "genial", "perfecto", "ok", "okey", "oka", "okk",
  "dale", "listo", "buenisimo", "joya", "barbaro", "excelente", "de", "nada",
  "bueno", "buen", "genio", "capo", "crack", "graciass", "grax", "gracia", "tks", "thanks",
]);

function esCierre(texto) {
  const t = normalizar(texto || "");
  if (t === "") return (texto || "").trim() !== ""; // solo emojis / signos
  const palabras = t.split(/\s+/);
  return palabras.length <= 4 && palabras.every((w) => PALABRAS_CIERRE.has(w) || /^gra+c+i+a+s+$/.test(w));
}

// Devuelve el texto a enviar, o null si conviene no responder.
async function generarRespuesta(mensajeUsuario, usuarioIg = null) {
  if (!mensajeUsuario || mensajeUsuario.trim() === "") return null; // audio, foto, sticker
  if (esCierre(mensajeUsuario)) {
    console.log(`[ROC BOT] Mensaje: "${mensajeUsuario}" → cierre, no respondo`);
    return null;
  }

  // 1) Modo inteligente (si hay ANTHROPIC_API_KEY)
  const ia = await responderConIA(usuarioIg || "anon", mensajeUsuario);
  if (ia) {
    console.log(`[ROC BOT] Mensaje: "${mensajeUsuario}" → IA: ${ia.tipo}`);
    if (ia.tipo === "silencio") return null;
    if (ia.tipo === "derivar") registrarPreguntaSinRespuesta(usuarioIg, mensajeUsuario);
    return ia.texto;
  }

  // 2) Modo palabras clave (respaldo)
  const intencion = detectarIntencion(mensajeUsuario);
  console.log(`[ROC BOT] Mensaje: "${mensajeUsuario}" → Intención: ${intencion || "no detectada"}`);

  if (intencion && RESPUESTAS[intencion]) {
    return await RESPUESTAS[intencion]();
  }

  registrarPreguntaSinRespuesta(usuarioIg, mensajeUsuario);
  return RESPUESTAS.no_entiendo();
}

module.exports = { generarRespuesta };
