import { sql } from "@vercel/postgres";

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS mediciones (
      id         SERIAL          PRIMARY KEY,
      lat        DOUBLE PRECISION NOT NULL,
      lng        DOUBLE PRECISION NOT NULL,
      ubicacion  TEXT            NOT NULL DEFAULT 'Cusco',
      pm25       NUMERIC(8,2)    NOT NULL CHECK (pm25 >= 0),
      pm10       NUMERIC(8,2)    NOT NULL CHECK (pm10 >= 0),
      emision    NUMERIC(8,2)    NOT NULL DEFAULT 10 CHECK (emision > 0),
      viento     NUMERIC(5,2)    NOT NULL DEFAULT 5  CHECK (viento > 0),
      notas      TEXT,
      created_at TIMESTAMPTZ     NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS mediciones_created_at_idx ON mediciones (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS mediciones_ubicacion_idx  ON mediciones (ubicacion)`;
  await sql`CREATE INDEX IF NOT EXISTS mediciones_latng_idx      ON mediciones (lat, lng)`;
}

export interface Medicion {
  id: number;
  lat: number;
  lng: number;
  ubicacion: string;
  pm25: number;
  pm10: number;
  emision: number;
  viento: number;
  notas: string | null;
  created_at: string;
}
