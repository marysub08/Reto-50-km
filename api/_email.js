// api/_email.js
//
// Envía el email de bienvenida con el link personal del alumno, usando
// Resend (https://resend.com) — tiene un plan gratis (100 emails/día) que
// alcanza de sobra para este proyecto. No agrega ninguna librería nueva:
// usa `fetch`, que ya viene incluido en el entorno de Vercel.
//
// Requiere la variable de entorno RESEND_API_KEY. Si no está configurada,
// no se manda el email pero tampoco se rompe nada — el pago se sigue
// confirmando igual, y el alumno todavía ve su link en pantalla.

async function sendWelcomeEmail({ to, nombre, link }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY no configurado: no se envió el email de bienvenida.');
    return false;
  }
  if (!to) {
    console.warn('No hay email del comprador — no se pudo enviar el email de bienvenida.');
    return false;
  }

  const nombreAlumno = (nombre || '').trim();
  const saludo = nombreAlumno ? `Hola ${nombreAlumno}` : 'Hola';

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a;">
      <h1 style="font-size: 20px; margin-bottom: 8px;">¡Compra confirmada! 🚴</h1>
      <p style="font-size: 15px; line-height: 1.5;">${saludo}, gracias por sumarte al <strong>Desafío 200 km en 30 días</strong>.</p>
      <p style="font-size: 15px; line-height: 1.5;">Este es tu link personal — guardalo, es tu acceso de por vida al programa desde cualquier celular o computadora, sin usuario ni contraseña:</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${link}" style="background: #1d4ed8; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; display: inline-block;">Entrar a mi plan</a>
      </p>
      <p style="font-size: 13px; color: #475569; word-break: break-all;">O copiá y pegá este link en tu navegador:<br>${link}</p>
      <p style="font-size: 13px; color: #64748b; margin-top: 24px;">Ante cualquier duda, respondé este email.</p>
    </div>
  `;

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Desafío 200 km <onboarding@resend.dev>',
        reply_to: process.env.RESEND_REPLY_TO || undefined,
        to: [to],
        subject: 'Tu acceso al Desafío 200 km — guardá este email',
        html,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Resend devolvió un error al enviar el email:', resp.status, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.error('No se pudo enviar el email de bienvenida:', err);
    return false;
  }
}

// Le avisa al coach (FEEDBACK_TO_EMAIL, por defecto el gmail de contacto)
// cuando un alumno completa la encuesta de cierre del Desafío — llegue o
// no a los 200 km. Así se enteran de cómo le fue sin depender de que el
// alumno decida escribirles por su cuenta.
async function sendFeedbackEmail({ nombre, rating, comment, reached, kmTotal, link }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY no configurado: no se envió el aviso de encuesta de cierre.');
    return false;
  }

  const to = process.env.FEEDBACK_TO_EMAIL || 'contactodesafio50km@gmail.com';
  const nombreAlumno = (nombre || 'Un alumno').trim();
  const estado = reached ? '✅ Llegó a los 200 km' : '⚠️ No llegó a los 200 km';
  const ratingLabels = { 5: 'Buenísima', 4: 'Buena', 3: 'Regular', 2: 'Difícil' };
  const ratingTxt = ratingLabels[rating] || String(rating || '—');

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #0f172a;">
      <h1 style="font-size: 18px; margin-bottom: 12px;">Encuesta de cierre — Desafío 200 km</h1>
      <p style="font-size: 14px;"><strong>Alumno/a:</strong> ${nombreAlumno}</p>
      <p style="font-size: 14px;"><strong>Resultado:</strong> ${estado} (sumó ${kmTotal} km)</p>
      <p style="font-size: 14px;"><strong>Calificación de la experiencia:</strong> ${ratingTxt}</p>
      <p style="font-size: 14px;"><strong>Comentario:</strong><br>${comment ? comment.replace(/\n/g, '<br>') : '(sin comentario)'}</p>
      ${link ? `<p style="font-size: 12px; color: #64748b;">Link del alumno: ${link}</p>` : ''}
    </div>
  `;

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Desafío 200 km <onboarding@resend.dev>',
        to: [to],
        subject: `${estado} — ${nombreAlumno}`,
        html,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Resend devolvió un error al enviar el aviso de encuesta de cierre:', resp.status, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.error('No se pudo enviar el aviso de encuesta de cierre:', err);
    return false;
  }
}

module.exports = { sendWelcomeEmail, sendFeedbackEmail };
