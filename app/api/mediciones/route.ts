import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { initDB } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await initDB();
    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, parseInt(searchParams.get("page")  ?? "1", 10));
    const limit    = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const ubicacion = searchParams.get("ubicacion");
    const offset   = (page - 1) * limit;

    const rows = ubicacion
      ? await sql`
          SELECT id, lat, lng, ubicacion, pm25, pm10, emision, viento, notas, created_at
          FROM mediciones WHERE ubicacion ILIKE ${"%" + ubicacion + "%"}
          ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
      : await sql`
          SELECT id, lat, lng, ubicacion, pm25, pm10, emision, viento, notas, created_at
          FROM mediciones
          ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const count = ubicacion
      ? await sql`SELECT COUNT(*)::int AS total FROM mediciones WHERE ubicacion ILIKE ${"%" + ubicacion + "%"}`
      : await sql`SELECT COUNT(*)::int AS total FROM mediciones`;

    return NextResponse.json({ mediciones: rows.rows, total: count.rows[0].total, page, limit });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al obtener mediciones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDB();
    const body = await req.json();
    const { lat, lng, ubicacion = "Cusco", pm25, pm10, emision = 10, viento = 5, notas = null } = body;

    if (lat == null || lng == null || pm25 == null || pm10 == null) {
      return NextResponse.json({ error: "lat, lng, pm25 y pm10 son requeridos" }, { status: 400 });
    }
    if (pm25 < 0 || pm10 < 0) {
      return NextResponse.json({ error: "pm25 y pm10 deben ser >= 0" }, { status: 400 });
    }
    if (emision <= 0 || viento <= 0) {
      return NextResponse.json({ error: "emision y viento deben ser > 0" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO mediciones (lat, lng, ubicacion, pm25, pm10, emision, viento, notas)
      VALUES (${lat}, ${lng}, ${ubicacion}, ${pm25}, ${pm10}, ${emision}, ${viento}, ${notas})
      RETURNING id, created_at
    `;
    return NextResponse.json({ id: result.rows[0].id, created_at: result.rows[0].created_at }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al guardar medición" }, { status: 500 });
  }
}
