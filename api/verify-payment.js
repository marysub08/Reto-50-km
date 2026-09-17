// api/verify-payment.js
//
// El navegador vuelve de Mercado Pago con un payment_id en la URL. Antes
// de mostrarle al comprador la pantalla de "compra confirmada", este
// endpoint le pregunta DIRECTAMENTE a Mercado Pago (con tu access token
// privado) si ese pago realmente está aprobado. Así evitamos que alguien
// simplemente escriba ?status=approved en la URL para entrar gratis.
//
// Si el pago está aprobado, además crea (o recupera) la "cuenta" del
// alumno en la base de datos y le devuelve su token de acceso personal —
// el link con ese token es lo que le permite entrar desde cualquier
// dispositivo sin perder el progreso. Si todavía no configuraste la base
// de datos (DATABASE_URL), el pago se sigue confirmando igual; solo no
// habrá token todavía (el sitio sigue funcionando con el respaldo local).

const { MercadoPagoConfig, Payment } = require('mercadopago');
const { findOrCreateStudent, claimWelcomeEmail } = require('./_db');
const { sendWelcomeEmail } = require('./_email');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const paymentId = req.query.payment_id;
  if (!paymentId) {
    res.status(400).json({ error: 'Falta el parámetro payment_id' });
    return;
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    res.status(500).json({ error: 'Falta configurar MERCADOPAGO_ACCESS_TOKEN en el servidor.' });
    return;
  }

  try {
    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);
    const info = await payment.get({ id: paymentId });
    const approved = info.status === 'approved';

    let token = null;
    if (approved) {
      const payerEmail = info.payer && info.payer.email;
      const payerNombre = info.payer && info.payer.first_name;
      try {
        token = await findOrCreateStudent(info.external_reference, String(paymentId), payerEmail);
      } catch (dbErr) {
        // No dejamos que un problema de base de datos le arruine la compra
        // ya aprobada a alguien — solo avisamos en los logs del servidor.
        console.error('No se pudo crear/recuperar la cuenta del alumno:', dbErr);
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
          console.error('No se pudo enviar el email de bienvenida:', mailErr);
        }
      }
    }

    res.status(200).json({
      approved,
      status: info.status,
      amount: info.transaction_amount,
      external_reference: info.external_reference,
      token,
    });
  } catch (err) {
    console.error('Error verificando pago en Mercado Pago:', err);
    res.status(500).json({ error: 'No se pudo verificar el pago.' });
  }
};
