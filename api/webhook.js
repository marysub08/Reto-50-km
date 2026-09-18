// api/webhook.js
//
// Mercado Pago llama a esta URL en cuanto un pago cambia de estado,
// incluso si el comprador cerró la pestaña antes de volver a tu sitio.
// Además de registrar el pago, crea (o recupera) la cuenta del alumno en
// la base de datos — el mismo helper que usa api/verify-payment.js, así
// que da lo mismo cuál de los dos caminos llegue primero: nunca se crea
// una cuenta duplicada para el mismo pago. Esto es solo una red de
// seguridad: si el navegador del alumno nunca vuelve a la página, este
// webhook igual deja su cuenta lista, aunque él no vea su link personal
// hasta que vuelva a intentar entrar.
//
// Configurá esta URL en tu cuenta de Mercado Pago:
// Tus integraciones → tu aplicación → Webhooks → https://tu-dominio/api/webhook
// y copiá la "Clave secreta" a la variable de entorno MP_WEBHOOK_SECRET.

const { MercadoPagoConfig, Payment, WebhookSignatureValidator } = require('mercadopago');
const { findOrCreateStudent, claimWelcomeEmail } = require('./_db');
const { sendWelcomeEmail } = require('./_email');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const secret = process.env.MP_WEBHOOK_SECRET;
  const dataId = req.query['data.id'] || (req.body && req.body.data && req.body.data.id);

  if (secret) {
    try {
      WebhookSignatureValidator.validate({
        xSignature: req.headers['x-signature'],
        xRequestId: req.headers['x-request-id'],
        dataId,
        secret,
        toleranceSeconds: 300,
      });
    } catch (err) {
      console.warn('Webhook con firma inválida — se ignora:', err.reason || err.message);
      // Respondemos 200 igual: si devolvés error, Mercado Pago reintenta sin parar.
      res.status(200).end();
      return;
    }
  } else {
    console.warn('MP_WEBHOOK_SECRET no configurado: no se está validando la firma del webhook.');
  }

  const type = req.body && req.body.type;
  if (type === 'payment' && dataId) {
    try {
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      const client = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(client);
      const info = await payment.get({ id: dataId });
      console.log(`[webhook] pago ${dataId} → estado: ${info.status} · referencia: ${info.external_reference}`);

      if (info.status === 'approved') {
        // Preferimos el email que el comprador escribió en nuestra propia
        // página (guardado en metadata al crear la preferencia) — es el que
        // él eligió para recibir el acceso. Si por algún motivo no está
        // disponible, usamos el de su cuenta de Mercado Pago como respaldo.
        const payerEmail = (info.metadata && info.metadata.buyer_email) || (info.payer && info.payer.email);
        const payerNombre = info.payer && info.payer.first_name;
        let token = null;
        try {
          token = await findOrCreateStudent(info.external_reference, String(dataId), payerEmail);
        } catch (dbErr) {
          console.error('No se pudo crear/recuperar la cuenta del alumno desde el webhook:', dbErr);
        }

        if (token) {
          try {
            const puedeMandar = await claimWelcomeEmail(token);
            if (puedeMandar) {
              const siteUrl = process.env.SITE_URL || `https://${req.headers.host}`;
              await sendWelcomeEmail({
                to: payerEmail,
                nombre: payerNombre,
                link: `${siteUrl}/desafio-50km.html?u=${token}`,
              });
            }
          } catch (mailErr) {
            console.error('No se pudo enviar el email de bienvenida desde el webhook:', mailErr);
          }
        }
      }
    } catch (err) {
      console.error('Error procesando webhook de pago:', err);
    }
  }

  res.status(200).end();
};
