// api/get-progress.js
//
// Dado el token del link personal de un alumno, devuelve su perfil y en
// qué parte del plan de 30 días se quedó. Esto es lo que permite que
// entre desde cualquier celular o computadora sin perder nada.

const { getSql } = require('./_db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const token = (req.query.token || '').trim();
  if (!token) {
    res.status(400).json({ error: 'Falta el parámetro token' });
    return;
  }

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT nombre, edad, sexo, altura, peso, imc, bici, nivel, salud, motiv,
             cur_week, week_perf, week_answers, ci_answers, km_log
      FROM students
      WHERE token = ${token}
    `;

    if (rows.length === 0) {
      res.status(404).json({ error: 'No encontramos ese acceso. Revisá el link.' });
      return;
    }

    const r = rows[0];
    res.status(200).json({
      found: true,
      profile: {
        nombre: r.nombre || '',
        edad: r.edad || 0,
        sexo: r.sexo || '',
        altura: r.altura || 0,
        peso: r.peso || 0,
        imc: r.imc || 0,
        bici: r.bici || '',
        nivel: r.nivel || '',
        salud: r.salud || [],
        motiv: r.motiv || [],
      },
      progress: {
        curWeek: r.cur_week || 1,
        weekPerf: r.week_perf || [],
        weekAnswers: r.week_answers || {},
        ciAnswers: r.ci_answers || {},
        kmLog: r.km_log || {},
      },
    });
  } catch (err) {
    console.error('Error recuperando el progreso del alumno:', err);
    res.status(500).json({ error: 'No pudimos recuperar tu progreso en este momento.' });
  }
};
