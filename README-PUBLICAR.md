# Publicar el sitio por primera vez — guía completa

Esto es lo único que falta en el roadmap. Junta en un solo lugar los tres pasos que ya estaban documentados por separado (`README-PAGO.md`, `README-CUENTAS.md`, `README-CHAT.md`) en el orden en que hay que hacerlos, de punta a punta, para que un alumno de verdad pueda entrar a comprar.

No hace falta que sepas programar — son todo clics en páginas web. Vas a necesitar unos 20-30 minutos.

## Paso 1 — Subir la carpeta a GitHub

Vercel publica tu sitio a partir de un repositorio de GitHub, así que primero el proyecto tiene que vivir ahí.

1. Entrá a [github.com](https://github.com) y creá una cuenta gratis si no tenés.
2. Creá un repositorio nuevo (botón verde "New") — podés ponerlo como **privado**, así nadie más lo ve. Nombralo por ejemplo `desafio-50km`.
3. Subí todos los archivos de tu carpeta "Pagina julio + Mar IA" a ese repositorio. La forma más simple sin usar la terminal: en la página del repositorio recién creado, hacé clic en "uploading an existing file" y arrastrá los archivos (`desafio-50km.html`, la carpeta `api/`, la carpeta `db/`, `package.json`, los favicons, etc.) — **no hace falta subir la carpeta `.git`** si ya existe, GitHub la maneja solo.

> Si esa carpeta ya tiene un repositorio de git conectado (vi que tenés una carpeta `.git` ahí adentro), puede que ya esté conectada a GitHub desde antes — en ese caso este paso puede ya estar hecho, avisame y lo confirmamos antes de duplicar nada.

## Paso 2 — Importar el proyecto en Vercel

1. Entrá a [vercel.com](https://vercel.com) y creá una cuenta gratis (podés entrar directo con tu cuenta de GitHub, es lo más simple).
2. Hacé clic en "Add New" → "Project".
3. Elegí el repositorio `desafio-50km` que subiste en el paso 1.
4. Dejá la configuración por defecto (Vercel detecta solo que `desafio-50km.html` es la página y que `api/` son funciones de servidor) y hacé clic en **Deploy**.
5. Al terminar, Vercel te va a dar una URL propia, algo como `https://desafio-50km.vercel.app`. Ese es tu sitio en vivo — aunque todavía no puede cobrar ni guardar nada, porque faltan las variables de entorno de los pasos siguientes.

## Paso 3 — Cargar las credenciales (variables de entorno)

En tu proyecto de Vercel: **Settings → Environment Variables**. Cargá una por una:

| Variable | De dónde sale |
|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | Tu panel de [mercadopago.com.ar/developers/panel](https://www.mercadopago.com.ar/developers/panel) → tu aplicación → Credenciales de producción → Access Token (empieza con `APP_USR-...`) |
| `MP_WEBHOOK_SECRET` | El mismo panel → Webhooks → Clave secreta (ver Paso 5, hay que configurar la URL del webhook primero para que te la muestre) |
| `SITE_URL` | La URL que te dio Vercel en el Paso 2, por ejemplo `https://desafio-50km.vercel.app` |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys (esta es la que hace funcionar el chat "Preguntale a Mar IA") |

`DATABASE_URL` no la cargás vos a mano — la agrega sola Vercel en el paso siguiente, al conectar Neon.

**Recomendación:** la primera vez, cargá el Access Token de **prueba** (empieza con `TEST-...`, lo sacás del mismo panel de Mercado Pago) en vez del de producción, hacé una compra de prueba completa (Paso 6), y recién cuando esté todo confirmado volvés a esta pantalla y lo reemplazás por el de producción.

## Paso 4 — Conectar la base de datos (Neon)

1. En tu proyecto de Vercel: pestaña **Storage** → **Connect Database** → elegí **Neon** (Postgres) → seguí los pasos para crear una base gratis. Vercel conecta todo solo y agrega la variable `DATABASE_URL` — no copiás ni pegás ninguna contraseña a mano.
2. Abrí el proyecto de Neon (el mismo panel de Vercel te da un link, o entrás desde [neon.tech](https://neon.tech)) y andá a **SQL Editor**.
3. Pegá ahí el contenido completo del archivo `db/schema.sql` de tu carpeta, y ejecutalo. Esto crea la tabla donde se guarda el progreso de cada alumno — se hace **una sola vez**.

## Paso 5 — Configurar el webhook de Mercado Pago

1. En el panel de Mercado Pago Developers, dentro de tu aplicación → **Webhooks** → **Configurar notificaciones**.
2. Poné como URL: `https://TU-SITIO.vercel.app/api/webhook` (con tu URL real del Paso 2).
3. Copiá la **Clave secreta** que te muestra ahí y cargala en Vercel como `MP_WEBHOOK_SECRET` (Paso 3), si todavía no lo habías hecho.

## Paso 6 — Redesplegar y probar

1. Volvé a Vercel → tu proyecto → **Deployments** → los tres puntos del último deploy → **Redeploy**. Esto hace que el sitio tome todas las variables que acabás de cargar.
2. Con el Access Token de **prueba** cargado: entrá a tu sitio publicado, hacé clic en comprar, y pagá con una [tarjeta de prueba de Mercado Pago](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards). Confirmá que:
   - Volvés a la pantalla de "¡Compra confirmada!"
   - Te muestra tu link personal
   - Podés completar el cuestionario con Mar IA y llegar a la pantalla del plan
   - Aparece el botón "Preguntale a Mar IA" y responde algo con sentido
3. Cuando todo eso funcione bien, volvé a **Settings → Environment Variables**, reemplazá `MERCADOPAGO_ACCESS_TOKEN` por el de **producción**, y hacé un último **Redeploy**.
4. Como verificación final, te recomiendo hacerte una compra real a vos misma (con tu propia tarjeta) para confirmar que con dinero de verdad también funciona de punta a punta.

## Listo

A partir de acá el sitio queda funcionando solo, todo el tiempo, sin que dependa de tu computadora. Cualquier cambio que hagamos después en el código, se sube de nuevo a GitHub y Vercel lo publica solo en un par de minutos.
