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
async function findOrCreateStudent(externalReference, paymentId) {
  const sql = getSql();

  const existing = await sql`
    SELECT token FROM students WHERE external_reference = ${externalReference}
  `;
  if (existing.length > 0) return existing[0].token;

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateToken();
    try {
      await sql`
        INSERT INTO students (token, external_reference, payment_id)
        VALUES (${candidate}, ${externalReference}, ${paymentId})
      `;
      return candidate;
    } catch (err) {
      // Choque de token o de external_reference (carrera entre dos
      // llamadas simultáneas para el mismo pago) — reintentamos.
      if (attempt === 4) throw err;
    }
  }
}

module.exports = { getSql, generateToken, findOrCreateStudent };
