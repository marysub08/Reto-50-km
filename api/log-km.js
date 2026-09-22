// api/log-km.js
//
// Guarda los kilómetros REALES que el alumno recorrió en una salida
// puntual del plan (identificada por el número de día, 1–30). Se llama
// cada vez que toca "Cargar km" en una salida de bici — así el contador
// de "120 km" que ve arriba de su plan siempre refleja lo que realmente
// hizo, no lo planificado.
//
// Guardamos un objeto { "<dia>": km } en la columna km_log — cargar de
// nuevo el mismo día simplemente actualiza ese valor (no lo duplica), así
// que el alumno puede corregir un número sin miedo a inflar el total.

const { getSql } = require('./_db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const body = req.body || {};
  const token = String(body.token || '').trim();
  const dayNum = Number(body.dayNum);
  const km = Number(body.km);

  if (!token) {
    res.status(400).json({ error: 'Falta el token' });
    return;
  }
  if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 30) {
    res.status(400).json({ error: 'Día inválido' });
    return;
  }
  if (!Number.isFinite(km) || km < 0 || km > 300) {
    res.status(400).json({ error: 'Kilómetros inválidos' });
    return;
  }
  const kmRounded = Math.round(km * 10) / 10;

  try {
    const sql = getSql();

    const rows = await sql`SELECT km_log FROM students WHERE token = ${token}`;
    if (rows.length === 0) {
      res.status(404).json({ error: 'No encontramos ese acceso.' });
      return;
    }

    const kmLog = (rows[0].km_log && typeof rows[0].km_log === 'object') ? rows[0].km_log : {};
    kmLog[String(dayNum)] = kmRounded;
    const kmTotal = Object.values(kmLog).reduce((sum, v) => sum + (Number(v) || 0), 0);

    await sql`
      UPDATE students SET km_log = ${JSON.stringify(kmLog)}::jsonb, updated_at = now()
      WHERE token = ${token}
    `;

    res.status(200).json({ saved: true, kmLog, kmTotal: Math.round(kmTotal * 10) / 10 });
  } catch (err) {
    console.error('Error guardando km cargados:', err);
    res.status(500).json({ error: 'No pudimos guardar tus kilómetros en este momento.' });
  }
};
