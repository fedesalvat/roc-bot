// ─────────────────────────────────────────────────────────────────────────────
// ROC BOT — Procesador de mensajes
// Detecta la intención del usuario y devuelve la respuesta adecuada
// ─────────────────────────────────────────────────────────────────────────────

const { RESPUESTAS } = require("./knowledge");
const { registrarPreguntaSinRespuesta } = require("./digest");

// ─────────────────────────────────────────────────────────────────────────────
// Mapa de keywords → intención
// ─────────────────────────────────────────────────────────────────────────────

const INTENCIONES = [
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
      "tarifa", "plata", "costo", "importe",
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
      "donde", "dónde", "lugar", "ubicacion", "ubicación", "campo de mayo",
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
      "aereo", "estructura", "militar", "que obstaculos", "obstáculo",
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
      "contacto", "mail", "email", "whatsapp", "hablar",
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
  const normalizado = normalizar(texto);

  for (const intencion of INTENCIONES) {
    for (const kw of intencion.keywords) {
      if (normalizado.includes(normalizar(kw))) {
        return intencion.nombre;
      }
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Generar respuesta
// ─────────────────────────────────────────────────────────────────────────────

function generarRespuesta(mensajeUsuario, usuarioIg = null) {
  if (!mensajeUsuario || mensajeUsuario.trim() === "") {
    return RESPUESTAS.bienvenida();
  }

  const intencion = detectarIntencion(mensajeUsuario);

  console.log(`[ROC BOT] Mensaje: "${mensajeUsuario}" → Intención: ${intencion || "no detectada"}`);

  if (intencion && RESPUESTAS[intencion]) {
    return RESPUESTAS[intencion]();
  }

  // No se entendió → registrar para el digest diario
  registrarPreguntaSinRespuesta(usuarioIg, mensajeUsuario);
  return RESPUESTAS.no_entiendo();
}

module.exports = { generarRespuesta };
