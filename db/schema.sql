-- Esquema de la base de datos del Desafío 50 km.
--
-- Cómo usarlo: entrá a tu proyecto de Neon (lo conectás desde Vercel →
-- Storage → Connect Database → Neon), abrí la pestaña "SQL Editor" y pegá
-- todo este archivo. Es seguro volver a correrlo aunque ya hayas creado la
-- tabla antes (por ejemplo, después de este cambio que agrega altura/peso/
-- IMC) — las líneas ALTER TABLE de abajo no rompen nada si la columna ya
-- existe.

CREATE TABLE IF NOT EXISTS students (
  token               TEXT PRIMARY KEY,
  external_reference  TEXT UNIQUE,
  payment_id          TEXT,

  -- Perfil (lo que responde en el cuestionario con Mar IA)
  nombre              TEXT DEFAULT '',
  edad                INTEGER DEFAULT 0,
  sexo                TEXT DEFAULT '',
  altura              INTEGER DEFAULT 0,  -- cm
  peso                NUMERIC DEFAULT 0,  -- kg
  imc                 NUMERIC DEFAULT 0,  -- índice de masa corporal calculado
  bici                TEXT DEFAULT '',
  nivel               TEXT DEFAULT '',
  salud               JSONB DEFAULT '[]',
  motiv               JSONB DEFAULT '[]',

  -- Progreso a lo largo de los 30 días
  cur_week            INTEGER DEFAULT 1,
  week_perf           JSONB DEFAULT '[]',
  week_answers        JSONB DEFAULT '{}',
  ci_answers          JSONB DEFAULT '{}',

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Si la tabla ya existía de antes (sin estas columnas), esto las agrega sin tocar nada más.
ALTER TABLE students ADD COLUMN IF NOT EXISTS altura INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS peso NUMERIC DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS imc NUMERIC DEFAULT 0;

CREATE INDEX IF NOT EXISTS students_external_reference_idx ON students (external_reference);
