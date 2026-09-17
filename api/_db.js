// api/_db.js
//
// Conexión compartida a la base de datos (Neon Postgres, vía la integración
// de Vercel Marketplace). El guion bajo en el nombre del archivo evita que
// Vercel lo trate como un endpoint público — es solo un helper interno.
//
// Requiere la variable de entorno DATABASE_URL (la pone sola la integración
// de Neon cuando la conectás desde el panel de Vercel).

const { neon } = require('@neondatabase/serverless');

let _sql = null;

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Falta configurar DATABASE_URL en el servidor (conectá Neon desde Vercel → Storage).');
  }
  if (!_sql) {
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

// Genera un código corto y difícil de adivinar para el link personal del
// alumno (ej: "k3f9m2ab"). No es una contraseña — es la llave de acceso.
function generateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  const bytes = require('crypto').randomBytes(10);
  for (let i = 0; i < 10; i++) out += chars[bytes[i] % chars.length];
  return out;
}

// Busca al alumno de un pago por su external_reference; si no existe
// todavía, le crea la cuenta con un token nuevo. Usado tanto por
// verify-payment.js (cuando el navegador vuelve) como por webhook.js
// (cuando Mercado Pago avisa aunque el navegador no vuelva) — así nunca
// se crea una cuenta duplicada para el mismo pago, sin importar cuál de
// los dos caminos llegue primero.
async function findOrCreateStudent(externalReference, paymentId, email) {
  const sql = getSql();

  const existing = await sql`
    SELECT token FROM students WHERE external_reference = ${externalReference}
  `;
  if (existing.length > 0) return existing[0].token;

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateToken();
    try {
      await sql`
        INSERT INTO students (token, external_reference, payment_id, email)
        VALUES (${candidate}, ${externalReference}, ${paymentId}, ${email || ''})
      `;
      return candidate;
    } catch (err) {
      // Si ya existe una cuenta para este external_reference (la creó la
      // otra vía — verify-payment o webhook — justo antes), la usamos.
      const existingNow = await sql`
        SELECT token FROM students WHERE external_reference = ${externalReference}
      `;
      if (existingNow.length > 0) return existingNow[0].token;
      // Si fue solo choque de token, reintentamos con uno nuevo.
      if (attempt === 4) throw err;
    }
  }
}

// Marca "email de bienvenida enviado" para un alumno, pero SOLO si todavía
// no se había marcado — así, aunque verify-payment.js y webhook.js lleguen
// casi al mismo tiempo, el email se manda una única vez. Devuelve true
// solo a quien "gana" el derecho de mandarlo.
async function claimWelcomeEmail(token) {
  const sql = getSql();
  const rows = await sql`
    UPDATE students SET welcome_email_sent = true
    WHERE token = ${token} AND welcome_email_sent = false
    RETURNING token
  `;
  return rows.length > 0;
}

module.exports = { getSql, generateToken, findOrCreateStudent, claimWelcomeEmail };
