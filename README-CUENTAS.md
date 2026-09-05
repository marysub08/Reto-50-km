# Cuenta de alumno + progreso en la nube — cómo ponerlo en marcha

Esto agrega lo que faltaba en el roadmap: que el progreso de cada alumno (perfil, semana en la que va, resultados de los check-ins) no dependa de un solo navegador. Ahora vive en una base de datos, y cada alumno tiene un **link personal** con el que entra desde cualquier celular o computadora sin perder nada.

## Cómo funciona (sin contraseñas)

Elegimos el camino más simple para tus alumnos: **no hay usuario ni contraseña que puedan olvidar**. Apenas Mercado Pago confirma el pago, el servidor le crea una cuenta con un código propio (por ejemplo `k3f9m2ab7c`) y arma un link tipo:

```
https://tu-sitio.vercel.app/desafio-50km.html?u=k3f9m2ab7c
```

Ese link se le muestra en pantalla ("¡Compra confirmada!") con un botón de "Copiar", para que lo guarde, se lo mande por WhatsApp a sí mismo, o lo agregue a favoritos. Cada vez que abre ese link — desde el celular, la compu, donde sea — el sitio reconoce quién es y lo lleva directo a la semana del plan en la que se había quedado.

El progreso se guarda solo en dos momentos: apenas termina el cuestionario con Mar IA, y cada vez que completa el check-in semanal. No hace falta que hagas nada para que esto pase.

## Qué se agregó

- `api/_db.js` — la conexión a la base de datos y la función que crea/recupera la cuenta de un alumno (código con guion bajo: Vercel no lo trata como una URL pública, es solo un helper interno).
- `api/get-progress.js` — dado un token, devuelve el perfil y el progreso del alumno.
- `api/save-progress.js` — guarda el perfil y el progreso actual.
- `api/verify-payment.js` y `api/webhook.js` — ahora, además de confirmar el pago, crean la cuenta del alumno (los dos están preparados para que no se dupliquen si ambos caminos llegan a procesar el mismo pago).
- `db/schema.sql` — la definición de la tabla donde se guarda todo. Se corre una sola vez.
- `desafio-50km.html` — muestra el link personal en la pantalla de bienvenida, y al abrir un link con `?u=...` restaura automáticamente el perfil y la semana correspondiente.

## 1. Conectar la base de datos (Neon, gratis)

1. Entrá al panel de tu proyecto en [vercel.com](https://vercel.com).
2. Andá a la pestaña **Storage** → **Connect Database** → elegí **Neon** (Postgres) → seguí los pasos para crear una base gratis. Vercel conecta todo solo y agrega la variable de entorno `DATABASE_URL` a tu proyecto — no tenés que copiar ni pegar ninguna contraseña a mano.
3. Una vez creada, abrí el proyecto de Neon (el mismo panel te da un link, o entrás desde [neon.tech](https://neon.tech)) y andá a **SQL Editor**.
4. Pegá el contenido completo de `db/schema.sql` y ejecutalo. Esto crea la tabla `students` — se hace **una sola vez**.

## 2. Redesplegar

Con `DATABASE_URL` ya configurada por la integración, solo falta que Vercel vuelva a desplegar el sitio para que las funciones nuevas la usen (`Deployments` → los tres puntos del último deploy → `Redeploy`, o simplemente esperá a que se dispare solo si subiste cambios al repositorio).

## 3. Probar

1. Hacé una compra de prueba (con tus credenciales `TEST-...` de Mercado Pago, como en `README-PAGO.md`).
2. En la pantalla "¡Compra confirmada!" tiene que aparecer el cuadro con tu link personal.
3. Completá el cuestionario con Mar IA y hacé un check-in semanal.
4. Copiá el link, abrilo en una ventana de incógnito (simula "otro dispositivo") y confirmá que te lleva directo a la semana correcta, con tu nombre y sin tener que repetir nada.

## Qué pasa si el alumno pierde el link

Hoy no hay forma de recuperarlo solo — dependé de que vos se lo reenvíes (Mercado Pago te muestra el email y el nombre de quien pagó en el panel de "Actividad" o "Cobros"). Si más adelante querés automatizar esto (por ejemplo, mandar el link por email apenas se confirma el pago, usando el email que ya te da Mercado Pago del comprador), avisame y lo armamos — es un paso más, no algo que haga falta para lanzar.
