// ─────────────────────────────────────────────────────────────────────────────
// ROC BOT — Base de conocimiento
// Toda la info del evento ROC 2026
// Actualizado 15/10/2026: precio por lote automático según la fecha,
// salidas con disponibilidad en vivo, deslinde online, edad mínima 13.
// ─────────────────────────────────────────────────────────────────────────────

const axios = require("axios");

const INFO = {
  nombre: "ROC – Race Obstacle Course",
  tagline: "ROC — CORRER NO ES SUFICIENTE",
  instagram: "@carreraroc",
  web: "rocargentina.com",
  mail: "info@rocargentina.com",
  mail_copia: "corredor@carrerasucia.com",

  evento: {
    fecha: "Domingo 29 de noviembre de 2026",
    lugar: "Campo de Mayo, Provincia de Buenos Aires",
    distancia: "8 km",
    obstaculos: "30+ obstáculos",
    limite_pagos: "lunes 23 de noviembre",
    cierre_inscripciones: "24 de noviembre",
  },

  // Mismos lotes que roc-inscripciones/lib/pricing.ts
  lotes: [
    { periodo: "13 Jul – 9 Ago",  desde: "2026-07-13", hasta: "2026-08-09", precio: 69000 },
    { periodo: "10 Ago – 18 Oct", desde: "2026-08-10", hasta: "2026-10-18", precio: 79000 },
    { periodo: "19 Oct – 23 Nov", desde: "2026-10-19", hasta: "2026-11-23", precio: 89000 },
  ],

  adicionales: {
    elite:               "+$15.000",
    competitiva:         "+$7.000",
    remera:              "+$15.000",
    cambio_participante: "$10.000",
  },

  premios: {
    elite:       { primero: "$100.000", segundo: "$75.000", tercero: "$50.000" },
    competitiva: { primero: "$45.000",  segundo: "$35.000", tercero: "$25.000" },
  },

  inscripciones_link: "https://inscripcion.rocargentina.com/inscripcion",
  disponibilidad_url: "https://inscripcion.rocargentina.com/api/disponibilidad",

  // Salidas (categoría + horario) — mismas claves que /api/disponibilidad
  salidas: [
    { clave: "ELITE__9:30",       texto: "Elite — 9:30 hs" },
    { clave: "COMPETITIVA__10:00", texto: "Competitiva — 10:00 hs" },
    { clave: "OPEN__10:30",       texto: "Open — 10:30 hs" },
    { clave: "OPEN__11:00",       texto: "Open — 11:00 hs" },
    { clave: "OPEN__11:30",       texto: "Open — 11:30 hs" },
    { clave: "OPEN__12:00",       texto: "Open — 12:00 hs" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de precio (por fecha, hora Argentina)
// ─────────────────────────────────────────────────────────────────────────────

function hoyAR() {
  // YYYY-MM-DD en hora Argentina
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
}

function peso(n) {
  return "$" + n.toLocaleString("es-AR");
}

function fechaCorta(iso) {
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const [, m, d] = iso.split("-").map(Number);
  return `${d} de ${meses[m - 1]}`;
}

function loteActual() {
  const hoy = hoyAR();
  const i = INFO.lotes.findIndex(l => hoy >= l.desde && hoy <= l.hasta);
  if (i === -1) return null;
  return { ...INFO.lotes[i], siguiente: INFO.lotes[i + 1] || null };
}

function inscripcionesCerradas() {
  return hoyAR() > "2026-11-23";
}

function lineaPrecioActual() {
  if (inscripcionesCerradas()) return "Las inscripciones online ya cerraron.";
  const l = loteActual();
  if (!l) return "";
  let txt = `💰 Precio actual: *${peso(l.precio)}* (categoría Open, sin remera)`;
  if (l.siguiente) txt += `\n⚠️ El ${fechaCorta(l.siguiente.desde)} sube a ${peso(l.siguiente.precio)}`;
  else txt += `\n⚠️ Es el último lote — se puede pagar hasta el ${INFO.evento.limite_pagos}`;
  return txt;
}

// ─────────────────────────────────────────────────────────────────────────────
// Disponibilidad de salidas en vivo (cache 5 min)
// ─────────────────────────────────────────────────────────────────────────────

let cacheDisp = { t: 0, llenos: null };

async function obtenerLlenos() {
  if (cacheDisp.llenos && Date.now() - cacheDisp.t < 5 * 60 * 1000) return cacheDisp.llenos;
  try {
    const r = await axios.get(INFO.disponibilidad_url, { timeout: 4000 });
    const llenos = r.data?.llenos;
    if (llenos && Object.keys(llenos).length) {
      cacheDisp = { t: Date.now(), llenos };
      return llenos;
    }
  } catch (err) {
    console.warn("[ROC BOT] No se pudo leer disponibilidad:", err.message);
  }
  return cacheDisp.llenos; // puede ser null si nunca anduvo
}

async function textoSalidas() {
  const llenos = await obtenerLlenos();
  if (!llenos) {
    return INFO.salidas.map(s => `• ${s.texto}`).join("\n") +
      `\n\nAlgunas salidas ya están completas — en el formulario ves cuáles quedan.`;
  }
  return INFO.salidas
    .filter(s => s.clave in llenos)
    .map(s => `• ${s.texto}${llenos[s.clave] ? " — ❌ COMPLETA" : " — ✅ hay lugar"}`)
    .join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPUESTAS por intención (pueden ser async)
// ─────────────────────────────────────────────────────────────────────────────

const RESPUESTAS = {

  bienvenida: () =>
    `💀 ¡Bienvenido a ROC!\n\n` +
    `*"CORRER NO ES SUFICIENTE"*\n\n` +
    `Soy el asistente automático de @carreraroc. Puedo ayudarte con:\n\n` +
    `📅 Fecha y lugar\n` +
    `💰 Precios e inscripción\n` +
    `🕘 Horarios de salida\n` +
    `🏆 Premios y categorías\n` +
    `✍️ Deslinde\n` +
    `📋 Reglamento\n\n` +
    `¿Qué querés saber?`,

  fecha: () =>
    `📅 *ROC 2026*\n\n` +
    `🗓 ${INFO.evento.fecha}\n` +
    `📍 ${INFO.evento.lugar}\n` +
    `🏃 ${INFO.evento.distancia} · ${INFO.evento.obstaculos}\n\n` +
    (inscripcionesCerradas()
      ? `Las inscripciones online ya cerraron.`
      : `✅ Inscripciones abiertas hasta el ${INFO.evento.cierre_inscripciones}:\n${INFO.inscripciones_link}`),

  // DM que se envía cuando alguien comenta pidiendo info en una publicación
  comentarioInfo: () =>
    `💀 ¡Hola! Nos pediste info de *ROC 2026*. Acá va:\n\n` +
    `🗓 ${INFO.evento.fecha}\n` +
    `📍 ${INFO.evento.lugar}\n` +
    `🏃 ${INFO.evento.distancia} · ${INFO.evento.obstaculos}\n\n` +
    `${lineaPrecioActual()}\n` +
    `Categorías: Open, Competitiva y Elite\n\n` +
    `✅ Inscribite acá:\n${INFO.inscripciones_link}\n\n` +
    `¿Tenés otra duda? Escribime por acá.\n\n` +
    `*CORRER NO ES SUFICIENTE*`,

  info: () =>
    `💀 ROC 2026 — Race Obstacle Course\n\n` +
    `🗓 ${INFO.evento.fecha}\n` +
    `📍 ${INFO.evento.lugar}\n` +
    `🏃 ${INFO.evento.distancia} · ${INFO.evento.obstaculos}\n\n` +
    `${lineaPrecioActual()}\n\n` +
    `⚡ Categorías: Open, Competitiva (${INFO.adicionales.competitiva}) y Elite (${INFO.adicionales.elite})\n` +
    `👕 Remera opcional: ${INFO.adicionales.remera}\n` +
    `👦 Edad mínima: 13 años (menores de 16, acompañados por un adulto inscripto)\n` +
    `✍️ El deslinde se firma online al inscribirte\n\n` +
    `✅ Inscribite acá:\n${INFO.inscripciones_link}\n\n` +
    `¿Querés saber algo más? Preguntame por horarios, precios, categorías, premios o reglamento.`,

  lugar: () =>
    `📍 La carrera es en Campo de Mayo, Provincia de Buenos Aires.\n` +
    `La salida es en el sector de Asalto Aéreo.\n\n` +
    `🗓 ${INFO.evento.fecha}`,

  precios: () => {
    const hoy = hoyAR();
    const lista = INFO.lotes
      .map(l => {
        const actual = hoy >= l.desde && hoy <= l.hasta;
        const pasado = hoy > l.hasta;
        return `• ${l.periodo}: *${peso(l.precio)}*${actual ? "  👈 HOY" : pasado ? " (vencido)" : ""}`;
      })
      .join("\n");
    return (
      `💰 *Precios ROC 2026* (categoría Open, sin remera)\n\n` +
      lista +
      `\n\n` +
      `*Adicionales:*\n` +
      `• Categoría Competitiva: ${INFO.adicionales.competitiva}\n` +
      `• Categoría Elite: ${INFO.adicionales.elite}\n` +
      `• Remera oficial: ${INFO.adicionales.remera}\n` +
      `• Cambio de participante: ${INFO.adicionales.cambio_participante}\n\n` +
      `⏰ Fecha límite de pago: *${INFO.evento.limite_pagos}*\n\n` +
      `👇 Inscribite acá:\n${INFO.inscripciones_link}`
    );
  },

  inscripcion: () =>
    inscripcionesCerradas()
      ? `Las inscripciones online ya cerraron. Para consultas escribinos a ${INFO.mail}.`
      : `✅ *Inscribite en ROC 2026*\n\n` +
        `👇 Entrá acá:\n${INFO.inscripciones_link}\n\n` +
        `${lineaPrecioActual()}\n\n` +
        `Elegís categoría y horario de salida, firmás el deslinde online y pagás con MercadoPago. ` +
        `Al confirmarse el pago te llega un mail con tu número de corredor y tu QR.`,

  horarios: async () =>
    `🕘 *Salidas ROC 2026* (29/11)\n\n` +
    (await textoSalidas()) +
    `\n\nElegís tu salida al inscribirte:\n${INFO.inscripciones_link}\n\n` +
    `Si querés correr con amigos, anótense todos en la misma salida.`,

  premios: () =>
    `🏆 *Premios ROC 2026*\n\n` +
    `*Categoría Elite:*\n` +
    `🥇 1° puesto: ${INFO.premios.elite.primero}\n` +
    `🥈 2° puesto: ${INFO.premios.elite.segundo}\n` +
    `🥉 3° puesto: ${INFO.premios.elite.tercero}\n\n` +
    `*Categoría Competitiva:*\n` +
    `🥇 1° puesto: ${INFO.premios.competitiva.primero}\n` +
    `🥈 2° puesto: ${INFO.premios.competitiva.segundo}\n` +
    `🥉 3° puesto: ${INFO.premios.competitiva.tercero}`,

  categorias: () =>
    `⚡ *Categorías ROC 2026*\n\n` +
    `*Open*\n` +
    `Hacé el circuito a tu ritmo intentando todos los obstáculos. Si no querés o no podés hacer alguno, pagás una penalidad y seguís.\n\n` +
    `*Competitiva (${INFO.adicionales.competitiva})*\n` +
    `¿Querés competir pero no estás seguro de completar todos los obstáculos? Esta categoría es para vos. Es premiada.\n\n` +
    `*Elite (${INFO.adicionales.elite})*\n` +
    `Obstáculos 100% obligatorios: si no superás uno, quedás descalificado. La más exigente, y premiada.\n\n` +
    `Escribí *horarios* para ver qué salidas tienen lugar.`,

  reglamento: () =>
    `📋 *Reglamento ROC 2026*\n\n` +
    `Los puntos clave:\n\n` +
    `• Distancia: 8 km con 30+ obstáculos\n` +
    `• Elite: obstáculos obligatorios, sin bypass. Si no superás uno, quedás descalificado\n` +
    `• Competitiva: penalidad por obstáculo no completado\n` +
    `• Open: podés pagar penalidad y seguir si no completás un obstáculo\n` +
    `• Edad mínima: 13 años cumplidos al 29/11. Menores de 16: obligatorio correr con un adulto inscripto. Menores de 18: firma el deslinde también padre, madre o tutor\n` +
    `• No hay tiempo máximo. Medalla para todos los que terminan\n` +
    `• Todos los corredores firman el deslinde online\n\n` +
    `Reglamento completo en *rocargentina.com*`,

  edad: () =>
    `👦 Edad mínima: 13 años cumplidos al 29 de noviembre de 2026. Pueden correr en cualquier categoría.\n\n` +
    `Los menores de 16 tienen que correr obligatoriamente acompañados por un adulto que también esté inscripto.\n\n` +
    `Para menores de 18, el deslinde lo firma también el padre, la madre o el tutor (online, en la misma inscripción).`,

  dia_carrera: () =>
    `🏁 Día de la carrera\n\n` +
    `• Llegá 1 hora y media antes de tu salida: ahí retirás el kit\n` +
    `• Estacionamiento gratis y transporte público hasta la puerta del predio\n` +
    `• Guardarropa gratis, duchas exteriores y carpas vestuario\n` +
    `• Hidratación en el circuito y en la llegada\n` +
    `• Traé ropa cómoda que se pueda mojar y ensuciar: hay agua y barro 💦\n` +
    `• Espectadores sin cargo y mascotas con correa\n` +
    `• No hace falta apto médico: sí es obligatorio firmar el deslinde`,

  devoluciones: () =>
    `No hay devoluciones de dinero, pero podés transferir tu inscripción a otra persona ($10.000) dentro del plazo que figura en la página.\n\n` +
    `Si querés cambiar de categoría u horario, se puede: pagás la diferencia de precio.`,

  descuentos: () =>
    `Para descuentos escribinos a ${INFO.mail} con copia a corredor@carrerasucia.com y te pasamos la info. 🙌`,

  fotos_resultados: () =>
    `📸 Va a haber fotógrafos en el evento: los links a las fotos los subimos a las historias destacadas de @carreraroc.\n\n` +
    `🏅 Medalla para todos los que terminan. Los resultados se publican en rocargentina.com la semana siguiente a la carrera.`,

  deslinde: () =>
    `✍️ *Deslinde ROC 2026*\n\n` +
    `Todos los corredores firman el deslinde *online*, no hace falta llevar nada impreso.\n\n` +
    `• Si te inscribís ahora, lo firmás en el mismo formulario.\n` +
    `• Si ya estabas inscripto, te llegó un mail con el link para firmarlo (revisá también spam/promociones).\n\n` +
    `Si no encontrás el mail, escribinos a ${INFO.mail} con tu nombre y DNI y te lo reenviamos.`,

  remera: () =>
    `👕 *Remera oficial ROC*\n\n` +
    `La remera es opcional y cuesta ${INFO.adicionales.remera}. La agregás al inscribirte.\n\n` +
    `👇 ${INFO.inscripciones_link}`,

  mail_confirmacion: () =>
    `📩 *¿No te llegó el mail de confirmación?*\n\n` +
    `El mail con tu número y QR llega cuando MercadoPago confirma el pago. Revisá spam y promociones.\n\n` +
    `Si no aparece, escribinos a ${INFO.mail} con tu nombre y DNI y lo revisamos.`,

  contacto: () =>
    `📬 *Contacto ROC*\n\n` +
    `Mail: ${INFO.mail}\n` +
    `Instagram: @carreraroc\n` +
    `Web: rocargentina.com\n\n` +
    `Para consultas puntuales escribinos por acá y te responde alguien del equipo. 💀`,

  que_es: () =>
    `💀 *¿Qué es ROC?*\n\n` +
    `ROC – Race Obstacle Course es una carrera de obstáculos de alto rendimiento.\n\n` +
    `🏃 *8 km* de terreno real\n` +
    `💥 *30+ obstáculos* diseñados para ponerte al límite\n` +
    `📍 *Campo de Mayo*, Buenos Aires\n` +
    `🗓 *29 de noviembre de 2026*\n\n` +
    `No es una carrera divertida. Es una prueba. ` +
    `Cada obstáculo está diseñado para que tengas que ganártelo.\n\n` +
    `*CORRER NO ES SUFICIENTE.*`,

  obstaculos: () =>
    `💥 *Los obstáculos de ROC*\n\n` +
    `Esta edición tiene un *sabor militar* que la hace única:\n\n` +
    `• Paredes de diferentes alturas\n` +
    `• Estructuras con obstáculos aéreos\n` +
    `• Subidas en soga\n` +
    `• Trepadoras\n` +
    `• Y muchos más a lo largo de los 8 km\n\n` +
    `*CORRER NO ES SUFICIENTE.* 💀`,

  servicios: () =>
    `🎉 *Servicios en el predio*\n\n` +
    `El día del evento vas a encontrar:\n\n` +
    `• 🍔 Foodtrucks\n` +
    `• 🎵 Música en vivo\n` +
    `• Y muchas sorpresas más\n\n` +
    `Vení con todo, es una experiencia completa. 💀`,

  grupos: () =>
    `👥 *Correr en grupo*\n\n` +
    `Las inscripciones son individuales, pero si se anotan todos en la *misma salida* corren juntos.\n\n` +
    `Escribí *horarios* para ver qué salidas tienen lugar.\n\n` +
    `👇 ${INFO.inscripciones_link}`,

  no_entiendo: () =>
    `Esa te la paso al equipo y te responden por acá en breve 🙌 Si es urgente, escribí a ${INFO.mail} con copia a corredor@carrerasucia.com\n\n` +
    `Si querés, mientras tanto escribime INFO y te mando un resumen de la carrera.`,
};

module.exports = { INFO, RESPUESTAS, loteActual, hoyAR, obtenerLlenos };
