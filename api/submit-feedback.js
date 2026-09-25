// api/submit-feedback.js
//
// Guarda la encuesta de cierre que el alumno completa en la semana final
// del Desafío — llegue o no a los 200 km — y le avisa por email al coach
// (contactodesafio50km@gmail.com) para que se entere sin depender de que
// el alumno le escriba por su cuenta.

const { getSql, claimFeedbackEmail } = require('./_db');
const { sendFeedbackEmail } = require('./_email');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const body = req.body || {};
  const token = String(body.token || '').trim();
  const rating = Number(body.rating);
  const comment = String(body.comment || '').slice(0, 2000);
  const reached = !!body.reached;
  const kmTotal = Number.isFinite(Number(body.kmTotal)) ? Number(body.kmTotal) : 0;

  if (!token) {
    res.status(400).json({ error: 'Falta el token' });
    return;
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Falta una calificación válida' });
    return;
  }

  const feedback = { rating, comment, reached, kmTotal, submittedAt: new Date().toISOString() };

  try {
    const sql = getSql();
    const rows = await sql`
      UPDATE students SET final_feedback = ${JSON.stringify(feedback)}::jsonb, updated_at = now()
      WHERE token = ${token}
      RETURNING token, nombre
    `;

    if (rows.length === 0) {
      res.status(404).json({ error: 'No encontramos ese acceso.' });
      return;
    }

    const nombre = rows[0].nombre;

    try {
      const puedeMandar = await claimFeedbackEmail(token);
      if (puedeMandar) {
        const siteUrl = process.env.SITE_URL || `https://${req.headers.host}`;
        await sendFeedbackEmail({
          nombre,
          rating,
          comment,
          reached,
          kmTotal,
          link: `${siteUrl}/desafio-50km.html?u=${token}`,
        });
      }
    } catch (mailErr) {
      console.error('No se pudo enviar el aviso de encuesta de cierre:', mailErr);
    }

    res.status(200).json({ saved: true });
  } catch (err) {
    console.error('Error guardando la encuesta de cierre:', err);
    res.status(500).json({ error: 'No pudimos guardar tu respuesta en este momento.' });
  }
};
