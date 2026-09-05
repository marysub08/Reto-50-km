# Chat de dudas puntuales de Mar IA — cómo ponerlo en marcha

Esto agrega el botón "Preguntale a Mar IA" que aparece flotando en la pantalla del plan. El alumno escribe una duda puntual del día a día — por ejemplo "hoy llueve, ¿hago fuerza hoy y bici mañana?" — y recibe una respuesta a medida, generada con la API de Claude, usando el contexto real de su plan (nivel, semana, qué le toca ese día, su motivación y sus condiciones de salud).

Se eligió este camino (un chat de texto) en vez de un avatar en vivo con cara y voz porque el costo es muchísimo menor: acá se paga por texto generado, no por minutos de video o voz — con el volumen esperado de alumnos, esto sale centavos de dólar por pregunta, no varios miles de pesos por alumno como salía el avatar en vivo.

## Qué se agregó

- `api/ask-mar-ia.js` — recibe la pregunta y el contexto del alumno, arma un prompt con la personalidad de Mar IA y llama a la API de Claude (modelo económico, pensado para respuestas cortas).
- `desafio-50km.html` — el botón flotante y el panel de chat en la pantalla del plan.

## 1. Conseguir tu clave de la API de Claude

1. Entrá a [console.anthropic.com](https://console.anthropic.com), creá una cuenta si no tenés (es de Anthropic, la misma empresa detrás de Claude).
2. Andá a **API Keys** y creá una clave nueva.
3. En Vercel, andá a tu proyecto → **Settings → Environment Variables** y agregá `ANTHROPIC_API_KEY` con esa clave.
4. Redesplegá el sitio para que tome la variable nueva.

Sin esta variable configurada, el botón de todas formas aparece, pero si alguien pregunta algo va a ver un aviso de que el chat no está disponible por el momento — nunca rompe el resto del sitio.

## 2. Cuánto cuesta

El modelo usado (`claude-haiku-4-5`) es el más económico y rápido de Claude, pensado justo para este tipo de preguntas cortas. Cada pregunta-respuesta cuesta una fracción de centavo de dólar — con un uso normal (algunas preguntas por semana por alumno), el costo mensual es prácticamente insignificante comparado con el precio del programa.

## 3. Probar

1. Con la clave ya configurada, completá el cuestionario con Mar IA como un alumno de prueba y llegá a la pantalla del plan.
2. Vas a ver el botón celeste "Preguntale a Mar IA" flotando abajo a la derecha.
3. Escribí una pregunta puntual (por ejemplo sobre reordenar el entrenamiento por lluvia) y confirmá que la respuesta tiene sentido con el nivel y la semana del alumno de prueba.

## Qué NO hace (a propósito)

- No da diagnósticos médicos ni indicaciones sobre medicación — ante preguntas de ese tipo, redirige a consultar a un profesional.
- No reemplaza el check-in semanal ni cambia el plan guardado — solo responde dudas puntuales, en el momento.
- No guarda historial de las preguntas entre sesiones (por ahora) — cada vez que el alumno entra arranca una conversación nueva. Si más adelante querés guardar ese historial para vos, es un paso más y se puede agregar.
