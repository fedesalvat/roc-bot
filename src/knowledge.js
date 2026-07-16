// ─────────────────────────────────────────────────────────────────────────────
// ROC BOT — Base de conocimiento
// Toda la info del evento ROC 2026
// ─────────────────────────────────────────────────────────────────────────────

const INFO = {
  nombre: "ROC – Race Obstacle Course",
  tagline: "ROC — CORRER NO ES SUFICIENTE",
  instagram: "@carreraroc",
  web: "rocargentina.com",

  evento: {
    fecha: "Domingo 29 de noviembre de 2026",
    lugar: "Campo de Mayo, Provincia de Buenos Aires",
    distancia: "8 km",
    obstaculos: "30+ obstáculos",
    apertura_inscripciones: "Domingo 13 de julio de 2026",
    limite_pagos: "Lunes 23 de noviembre de 2026",
  },

  precios: [
    { periodo: "13 Jul – 9 Ago",   precio: "$69.000" },
    { periodo: "10 Ago – 18 Oct",  precio: "$79.000" },
    { periodo: "19 Oct – 23 Nov",  precio: "$89.000" },
    { periodo: "Día de carrera",   precio: "$100.000" },
  ],

  adicionales: {
    elite:              "+$15.000",
    competitiva:        "+$7.000",
    remera:             "+$15.000",
    cambio_participante:"+$10.000",
  },

  premios: {
    elite: {
      primero:  "$100.000",
      segundo:  "$75.000",
      tercero:  "$50.000",
    },
    competitiva: {
      primero:  "$45.000",
      segundo:  "$35.000",
      tercero:  "$25.000",
    },
  },

  inscripciones_link: "https://inscripcion.rocargentina.com/inscripcion",

  categorias: [
    "Open (salidas 10:30 / 11:00 / 11:30hs)",
    "Competitiva (salida 10:00hs)",
    "Elite (salida 9:30hs, obstáculos obligatorios, premiada)",
  ],

  descripcion: [
    "ROC es una carrera de obstáculos de alto rendimiento.",
    "8 km de terreno exigente con más de 30 obstáculos diseñados para ponerte al límite.",
    "Tiene lugar en Campo de Mayo, uno de los predios más desafiantes del país.",
    "No es una carrera divertida — es una prueba real. Correr no es suficiente.",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// RESPUESTAS por intención
// ─────────────────────────────────────────────────────────────────────────────

const RESPUESTAS = {

  bienvenida: () =>
    `💀 ¡Bienvenido a ROC!\n\n` +
    `*"CORRER NO ES SUFICIENTE"*\n\n` +
    `Soy el bot oficial de @carreraroc. Puedo ayudarte con:\n\n` +
    `📅 Fecha y lugar\n` +
    `💰 Precios e inscripción\n` +
    `🏆 Premios y categorías\n` +
    `📋 Reglamento\n` +
    `❓ Preguntas frecuentes\n\n` +
    `¿Qué querés saber?`,

  fecha: () =>
    `📅 *ROC 2026*\n\n` +
    `🗓 ${INFO.evento.fecha}\n` +
    `📍 ${INFO.evento.lugar}\n` +
    `🏃 ${INFO.evento.distancia} · ${INFO.evento.obstaculos}\n\n` +
    `✅ ¡Las inscripciones ya están abiertas!\n${INFO.inscripciones_link}`,

  // DM que se envía cuando alguien comenta pidiendo info en una publicación
  comentarioInfo: () =>
    `💀 ¡Hola! Nos pediste info de *ROC 2026* — acá va:\n\n` +
    `🗓 ${INFO.evento.fecha}\n` +
    `📍 ${INFO.evento.lugar}\n` +
    `🏃 ${INFO.evento.distancia} · ${INFO.evento.obstaculos}\n\n` +
    `💰 Precio actual: *$69.000* (sube el 10 de agosto)\n` +
    `Categorías: Open, Competitiva y Elite\n\n` +
    `✅ Inscribite acá:\n${INFO.inscripciones_link}\n\n` +
    `¿Tenés otra duda? Escribime acá y te respondo al toque.\n\n` +
    `*CORRER NO ES SUFICIENTE*`,

  lugar: () =>
    `📍 *El evento se realiza en:*\n\n` +
    `Campo de Mayo\nProvincia de Buenos Aires\n\n` +
    `Es uno de los predios más exigentes del país — terreno variado, desniveles reales y 30+ obstáculos diseñados para ponerte al límite.`,

  precios: () => {
    const lista = INFO.precios
      .map(p => `• ${p.periodo}: *${p.precio}*`)
      .join("\n");
    return (
      `💰 *Precios ROC 2026* (sin remera)\n\n` +
      lista +
      `\n\n` +
      `*Adicionales:*\n` +
      `• Categoría Elite: ${INFO.adicionales.elite}\n` +
      `• Categoría Competitiva: ${INFO.adicionales.competitiva}\n` +
      `• Remera oficial: ${INFO.adicionales.remera}\n` +
      `• Cambio de participante: ${INFO.adicionales.cambio_participante}\n\n` +
      `⏰ Fecha límite de pago: *${INFO.evento.limite_pagos}*`
    );
  },

  inscripcion: () =>
    `✅ *Inscribite en ROC 2026*\n\n` +
    `👇 Entrá acá:\n${INFO.inscripciones_link}\n\n` +
    `Las inscripciones abren el *${INFO.evento.apertura_inscripciones}*.\n\n` +
    `El precio sube a medida que se acerca la fecha — inscribite temprano.`,

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
    `*General*\n` +
    `¡Hace el circuito a tu ritmo intentando hacer todos los obstáculos! En caso de no querer/poder hacer alguno podés pagar una penalidad y seguir.\n\n` +
    `*Competitiva (+$7.000)*\n` +
    `¿Querés competir pero no estás seguro de poder completar todos los obstáculos? Esta categoría es para vos. ¡Vení a intentar superarte!\n\n` +
    `*Elite (+$15.000)*\n` +
    `Obstáculos 100% obligatorios. En caso de no poder superar alguno serás descalificado. La categoría más exigente.\n\n` +
    `¿Cuál es tu nivel?`,

  reglamento: () =>
    `📋 *Reglamento ROC 2026*\n\n` +
    `Los puntos clave:\n\n` +
    `• Distancia: 8 km con 30+ obstáculos\n` +
    `• Categoría Elite: obstáculos obligatorios, sin bypass. Si no superás uno, quedás descalificado\n` +
    `• Categoría Competitiva: penalidad por obstáculo no completado\n` +
    `• Categoría General: podés pagar penalidad y seguir si no completás un obstáculo\n` +
    `• Menores de 16 años no pueden participar\n\n` +
    `Para el reglamento completo visitá: *rocargentina.com*`,

  contacto: () =>
    `📬 *Contacto ROC*\n\n` +
    `Instagram: @carreraroc\n` +
    `Web: rocargentina.com\n\n` +
    `Para consultas específicas escribinos por acá y te respondemos a la brevedad. 💀`,

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
    `• Trapadoras\n` +
    `• Y muchos más a lo largo de los 8 km\n\n` +
    `*CORRER NO ES SUFICIENTE.* 💀`,

  servicios: () =>
    `🎉 *Servicios en el predio*\n\n` +
    `El día del evento vas a encontrar:\n\n` +
    `• 🍔 Foodtrucks\n` +
    `• 🎵 Música en vivo\n` +
    `• Y muchas sorpresas más\n\n` +
    `Viene con todo para que sea una experiencia completa. 💀`,

  grupos: () =>
    `👥 *Inscripciones grupales*\n\n` +
    `En esta edición solo tenemos inscripciones individuales.\n\n` +
    `Si tenés un grupo de amigos o de entrenamiento, ` +
    `seleccionen todos el mismo horario y corren juntos!\n\n` +
    `👇 Inscribite acá:\n${INFO.inscripciones_link}`,

  no_entiendo: () =>
    `No estoy seguro de entender tu consulta. 🤔\n\n` +
    `Puedo ayudarte con:\n\n` +
    `📅 *fecha* — Cuándo y dónde es ROC\n` +
    `💰 *precios* — Valores e inscripción\n` +
    `🏆 *premios* — Qué se lleva el ganador\n` +
    `⚡ *categorías* — General, Competitiva o Elite\n` +
    `📋 *reglamento* — Las reglas del juego\n` +
    `✅ *inscripcion* — Cómo anotarte\n` +
    `💥 *obstáculos* — Qué nos espera en el recorrido\n` +
    `🎉 *servicios* — Qué hay en el predio\n` +
    `👥 *grupos* — Cómo correr con amigos\n\n` +
    `Escribí alguna de esas palabras y te cuento todo.`,
};

module.exports = { INFO, RESPUESTAS };
