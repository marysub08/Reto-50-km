// api/ask-mar-ia.js
//
// Chat de dudas puntuales de Mar IA: el alumno pregunta algo concreto del
// día a día — "hoy llueve, ¿hago fuerza hoy y bici mañana?" — y esto le
// responde usando el contexto real de su plan (nivel, semana, qué le toca
// hoy, su motivación, sus condiciones de salud), llamando a la API de
// Claude. Se eligió este camino (chat de texto) en vez de un avatar en
// vivo con cara y voz porque el costo por pregunta es mínimo — acá se
// paga por texto, no por minutos de video/voz generado.
//
// Requiere la variable de entorno ANTHROPIC_API_KEY (la conseguís en
// console.anthropic.com → API Keys). Sin esa variable, el chat responde
// con un error prolijo en vez de romper el resto del sitio.

const MODEL = 'claude-haiku-4-5-20251001'; // el más económico y rápido: alcanza de sobra para esto

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Falta configurar ANTHROPIC_API_KEY en el servidor.' });
    return;
  }

  const body = req.body || {};
  const question = String(body.question || '').trim().slice(0, 500);
  if (!question) {
    res.status(400).json({ error: 'Falta la pregunta.' });
    return;
  }

  const ctx = body.context || {};
  const nombre = String(ctx.nombre || '').slice(0, 100);
  const edad = Number.isFinite(ctx.edad) ? Math.max(0, Math.min(120, Math.round(ctx.edad))) : null;
  const sexo = String(ctx.sexo || '').slice(0, 5);
  const altura = Number.isFinite(ctx.altura) ? Math.max(0, Math.min(250, Math.round(ctx.altura))) : null;
  const peso = Number.isFinite(ctx.peso) ? Math.max(0, Math.min(300, ctx.peso)) : null;
  const imc = Number.isFinite(ctx.imc) ? Math.max(0, Math.min(100, ctx.imc)) : null;
  const bici = String(ctx.bici || '').slice(0, 10);
  const nivel = String(ctx.nivel || '').slice(0, 20);
  const semana = Number.isFinite(ctx.semana) ? Math.max(1, Math.min(4, Math.round(ctx.semana))) : 1;
  const diaLabel = String(ctx.diaLabel || '').slice(0, 150);
  const bikeKm = Array.isArray(ctx.bikeKm) ? ctx.bikeKm.map(Number).filter(Number.isFinite).slice(0, 3) : [];
  const motiv = Array.isArray(ctx.motiv) ? ctx.motiv.map(String).slice(0, 5) : [];
  const salud = Array.isArray(ctx.salud) ? ctx.salud.map(String).slice(0, 5) : [];
  const checkins = Array.isArray(ctx.checkins) ? ctx.checkins.slice(0, 4).map(c => ({
    semana: Number.isFinite(c.semana) ? Math.round(c.semana) : null,
    q1: String(c.q1 || '').slice(0, 30),
    q2: String(c.q2 || '').slice(0, 30),
    q3: String(c.q3 || '').slice(0, 30),
    q4: String(c.q4 || '').slice(0, 30),
    perf: String(c.perf || '').slice(0, 20),
  })) : [];

  const CONTACT_EMAIL = 'contactodesafio50km@gmail.com';

  const checkinsTxt = checkins.length
    ? checkins.map(c => `  · Semana ${c.semana}: bici=${c.q1 || 's/d'}, salida larga=${c.q2 || 's/d'}, fuerza=${c.q3 || 's/d'}, cuerpo=${c.q4 || 's/d'} (resultado: ${c.perf || 's/d'})`).join('\n')
    : '  (todavía no completó ningún check-in semanal)';

  const systemPrompt = `Sos Mar IA, la coach virtual del "Desafío 50 km en 30 días" (un programa de 30 días que combina salidas en bici progresivas con sesiones de fuerza, terminando en un recorrido de 50 km el día 30).

Tu único trabajo es responder preguntas puntuales del día a día de ESTE alumno sobre SU plan: entrenamientos (bici y fuerza), nutrición del programa, cómo adaptar o reordenar su semana, dudas sobre su progreso o el cuestionario que completó. No sos un asistente general.

Escribís en español rioplatense, con calidez cercana pero sin exagerar, y siempre corto: 2 a 4 oraciones como máximo, nunca un ensayo.

Toda la información que tenés de este alumno (usala para responder, y no le pidas de nuevo datos que ya están acá):
- Nombre: ${nombre || 'sin especificar'}
- Edad: ${edad ?? 'sin especificar'} · Sexo: ${sexo || 'sin especificar'}
- Altura: ${altura ?? 'sin especificar'} cm · Peso: ${peso ?? 'sin especificar'} kg · IMC: ${imc ?? 'sin especificar'}
- ¿Tiene bici propia?: ${bici || 'sin especificar'}
- Nivel: ${nivel || 'sin especificar'}
- Semana actual del plan: ${semana} de 4
- Lo que le toca hoy: ${diaLabel || 'sin especificar'}
- Kilómetros de bici planeados esta semana: ${bikeKm.length ? bikeKm.join(' / ') + ' km' : 'sin especificar'}
- Motivación principal: ${motiv.join(', ') || 'sin especificar'}
- Condiciones de salud a considerar: ${salud.join(', ') || 'ninguna'}
- Historial de check-ins semanales:
${checkinsTxt}

Reglas:
- Respondé SOLO preguntas relacionadas al programa (entrenamiento, bici, fuerza, nutrición del plan, el cuestionario, su progreso). Si la pregunta no tiene nada que ver con eso (temas personales, otros temas, pedidos generales sin relación), decilo con amabilidad y redirigí la conversación a algo del plan en lo que sí puedas ayudar — no la respondas igual.
- Podés sugerir reordenar entrenamientos dentro de la misma semana (por ejemplo mover una sesión de fuerza y la salida en bici) si eso evita que el alumno se salte el entrenamiento por completo — pero nunca sugieras juntar dos salidas largas seguidas, ni saltear el día de descanso.
- Nunca des diagnósticos médicos ni indicaciones sobre medicación. Si la pregunta suena a algo médico serio (dolor fuerte, mareos, dolor en el pecho, lesión, etc.), decile con calidez que consulte a un profesional de la salud antes de seguir entrenando, y no ofrezcas una alternativa de entrenamiento para ese caso.
- Si la duda es algo que vos no podés resolver con la información que tenés (por ejemplo: pedidos de reembolso, reclamos, problemas de pago o de acceso a la cuenta, o cualquier cosa puntual de su plan que se escape de lo que sabés), decile con calidez que te escriba a ${CONTACT_EMAIL} contando su caso, en vez de intentar adivinar una respuesta.
- Nunca inventes datos del plan que no tenés en el contexto de arriba — si te falta información para responder bien algo que sí es del programa, pedísela en vez de asumir.`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: question }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Error de la API de Claude:', resp.status, errText);
      res.status(502).json({ error: 'Mar IA no pudo responder en este momento. Probá de nuevo en un rato.' });
      return;
    }

    const data = await resp.json();
    const answer = (data.content && data.content[0] && data.content[0].text) || 'No tengo una respuesta para eso ahora mismo.';
    res.status(200).json({ answer });
  } catch (err) {
    console.error('Error llamando a la API de Claude:', err);
    res.status(500).json({ error: 'Mar IA no pudo responder en este momento.' });
  }
};
