# Cobro del Desafío 50 km — cómo ponerlo en marcha

Esto agrega el cobro con Mercado Pago (Checkout Pro) a `desafio-50km.html`. El alumno ve el precio, paga en Mercado Pago, y vuelve automáticamente a la pantalla de Mar IA solo si el pago se confirmó de verdad (se valida contra Mercado Pago desde el servidor, no se puede "hacer trampa" escribiendo la URL).

## Qué se agregó

- `desafio-50km.html` — ahora arranca en una pantalla de compra ($20.000 ARS). Recién después de un pago aprobado pasa a la pantalla de "compra confirmada" y el chat con Mar IA.
- `api/create-preference.js` — crea el link de pago de Mercado Pago.
- `api/verify-payment.js` — confirma con Mercado Pago que un pago realmente se aprobó.
- `api/webhook.js` — recibe el aviso de Mercado Pago aunque el alumno cierre la pestaña antes de volver, y también crea su cuenta ahí (ver `README-CUENTAS.md`).

## 1. Conseguir tus credenciales de Mercado Pago

1. Entrá a [mercadopago.com.ar/developers/panel](https://www.mercadopago.com.ar/developers/panel) con tu cuenta de Mercado Pago (la misma donde querés que caiga la plata).
2. Creá una aplicación (cualquier nombre, ej. "Desafío 50K").
3. En **Credenciales de producción**, copiá el **Access Token** (empieza con `APP_USR-...`). Ese va a la variable `MERCADOPAGO_ACCESS_TOKEN`.
4. En **Webhooks**, configurá la URL `https://TU-DOMINIO/api/webhook` y copiá la **Clave secreta** — esa va a `MP_WEBHOOK_SECRET`.

Mientras probás, usá las **credenciales de prueba** (Access Token que empieza con `TEST-...`) en vez de las de producción, así podés pagar con las tarjetas de prueba de Mercado Pago sin que se mueva plata real.

## 2. Publicar el sitio (gratis, con Vercel)

1. Subí esta carpeta completa a un repositorio de GitHub (podés arrastrar los archivos desde github.com si no usás git desde la terminal).
2. Entrá a [vercel.com](https://vercel.com), creá una cuenta gratis, y elegí "Import Project" apuntando a ese repositorio.
3. Antes de desplegar, andá a **Settings → Environment Variables** y cargá:
   - `MERCADOPAGO_ACCESS_TOKEN` = tu access token (de prueba primero, de producción cuando estés list@ para cobrar de verdad)
   - `MP_WEBHOOK_SECRET` = tu clave secreta de webhooks
   - `SITE_URL` = la URL que te da Vercel (algo como `https://desafio-50k.vercel.app`) — actualizala si cambia
4. Desplegá. Vercel sirve `desafio-50km.html` como página y las funciones de `api/` como backend automáticamente — no hace falta configurar nada más.

## 3. Probar antes de cobrar de verdad

Con las credenciales `TEST-...` cargadas, entrá a tu sitio, hacé clic en "Comprar ahora" y pagá con una [tarjeta de prueba de Mercado Pago](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards). Confirmá que después de pagar volvés a la pantalla de "¡Compra confirmada!" con Mar IA.

Cuando esté todo probado, reemplazá el Access Token de prueba por el de producción en las variables de entorno de Vercel y volvé a desplegar (Vercel lo hace solo con "Redeploy").

## Progreso entre dispositivos

Este documento cubre solo el cobro. Para que el progreso del alumno no dependa de un solo navegador (cuenta + link personal + guardado en la nube), ver `README-CUENTAS.md`.
