// api/save-progress.js
//
// Guarda el perfil y el progreso actual del alumno en la base de datos,
// identificado por su token de acceso. Se llama en los momentos clave:
// apenas termina el cuestionario con Mar IA, y cada vez que completa el
// check-in semanal — así nunca depende de un solo navegador.

const { getSql } = require('./_db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const body = req.body || {};
  const token = String(body.token || '').trim();
  if (!token) {
    res.status(400).json({ error: 'Falta el token' });
    return;
  }

  const p = body.profile || {};
  const pr = body.progress || {};

  const nombre = String(p.nombre || '').slice(0, 100);
  const edad = Number.isFinite(p.edad) ? Math.max(0, Math.min(120, Math.round(p.edad))) : 0;
  const sexo = String(p.sexo || '').slice(0, 10);
  const altura = Number.isFinite(p.altura) ? Math.max(0, Math.min(250, Math.round(p.altura))) : 0;
  const peso = Number.isFinite(p.peso) ? Math.max(0, Math.min(300, Math.round(p.peso * 10) / 10)) : 0;
  const imc = Number.isFinite(p.imc) ? Math.max(0, Math.min(100, Math.round(p.imc * 10) / 10)) : 0;
  const bici = String(p.bici || '').slice(0, 10);
  const nivel = String(p.nivel || '').slice(0, 20);
  const salud = Array.isArray(p.salud) ? p.salud.map(String).slice(0, 10) : [];
  const motiv = Array.isArray(p.motiv) ? p.motiv.map(String).slice(0, 10) : [];

  const curWeek = Number.isFinite(pr.curWeek) ? Math.max(1, Math.min(4, Math.round(pr.curWeek))) : 1;
  const weekPerf = Array.isArray(pr.weekPerf) ? pr.weekPerf.map(String).slice(0, 10) : [];
  const weekAnswers = (pr.weekAnswers && typeof pr.weekAnswers === 'object') ? pr.weekAnswers : {};
  const ciAnswers = (pr.ciAnswers && typeof pr.ciAnswers === 'object') ? pr.ciAnswers : {};

  try {
    const sql = getSql();
    const result = await sql`
      UPDATE students SET
        nombre = ${nombre},
        edad = ${edad},
        sexo = ${sexo},
        altura = ${altura},
        peso = ${peso},
        imc = ${imc},
        bici = ${bici},
        nivel = ${nivel},
        salud = ${JSON.stringify(salud)}::jsonb,
        motiv = ${JSON.stringify(motiv)}::jsonb,
        cur_week = ${curWeek},
        week_perf = ${JSON.stringify(weekPerf)}::jsonb,
        week_answers = ${JSON.stringify(weekAnswers)}::jsonb,
        ci_answers = ${JSON.stringify(ciAnswers)}::jsonb,
        updated_at = now()
      WHERE token = ${token}
      RETURNING token
    `;

    if (result.length === 0) {
      res.status(404).json({ error: 'No encontramos ese acceso.' });
      return;
    }

    res.status(200).json({ saved: true });
  } catch (err) {
    console.error('Error guardando el progreso del alumno:', err);
    res.status(500).json({ error: 'No pudimos guardar tu progreso en este momento.' });
  }
};
