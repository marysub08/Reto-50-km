// api/create-preference.js
//
// Crea una preferencia de pago de Mercado Pago (Checkout Pro) para el
// Desafío 200 km y devuelve el link (init_point) al que hay que redirigir
// al comprador. El precio se define ACÁ, en el servidor — nunca confíes
// en un precio que venga del navegador.
//
// El comprador ya nos dio su email en la propia página (antes de ir a
// pagar) — lo guardamos en "metadata" de la preferencia para poder
// recuperarlo después en verify-payment.js / webhook.js. Así, el email al
// que le mandamos el link de acceso es el que el comprador eligió en
// nuestro sitio, y no depende de cuál tenga cargado en su cuenta de
// Mercado Pago (que puede ser un correo viejo o de otro uso).
//
// Requiere la variable de entorno MERCADOPAGO_ACCESS_TOKEN (Access Token
// de PRODUCCIÓN de tu cuenta de Mercado Pago).

const { MercadoPagoConfig, Preference } = require('mercadopago');

const PRECIO_ARS = 20000;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    res.status(500).json({ error: 'Falta configurar MERCADOPAGO_ACCESS_TOKEN en el servidor.' });
    return;
  }

  const emailComprador = (req.body && req.body.email || '').trim();
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailComprador);
  if (!emailValido) {
    res.status(400).json({ error: 'Falta un email válido para continuar con el pago.' });
    return;
  }

  const siteUrl = process.env.SITE_URL || `https://${req.headers.host}`;
  const externalReference = `desafio50k-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            id: 'desafio-50k',
            title: 'Desafío 200 km en 30 días',
            description: 'Plan personalizado de 30 días + coaching de Mar IA',
            quantity: 1,
            unit_price: PRECIO_ARS,
            currency_id: 'ARS',
          },
        ],
        back_urls: {
          success: `${siteUrl}/desafio-50km.html`,
          failure: `${siteUrl}/desafio-50km.html?status=failure`,
          pending: `${siteUrl}/desafio-50km.html?status=pending`,
        },
        auto_return: 'approved',
        external_reference: externalReference,
        statement_descriptor: 'DESAFIO50K',
        metadata: {
          buyer_email: emailComprador,
        },
      },
    });

    res.status(200).json({
      init_point: response.init_point,
      external_reference: externalReference,
    });
  } catch (err) {
    console.error('Error creando preferencia de Mercado Pago:', err);
    res.status(500).json({ error: 'No se pudo iniciar el pago. Intentá de nuevo en un momento.' });
  }
};
