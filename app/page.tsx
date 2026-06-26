"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { Medicion } from "@/lib/db";

const MapaDispersion = dynamic(() => import("@/components/MapaDispersion"), { ssr: false });

const INPUT = "w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-600";
const LABEL = "text-xs text-neutral-500 block mb-1";

export default function Home() {
  const [mediciones, setMediciones]   = useState<Medicion[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [markerPos, setMarkerPos]     = useState<[number, number] | null>(null);

  const [ubicacion, setUbicacion] = useState("Cusco");
  const [pm25, setPm25]           = useState("");
  const [pm10, setPm10]           = useState("");
  const [emision, setEmision]     = useState("10");
  const [viento, setViento]       = useState("5");
  const [notas, setNotas]         = useState("");

  const [enviando, setEnviando]   = useState(false);
  const [mensaje, setMensaje]     = useState<{ text: string; ok: boolean } | null>(null);

  const fetchMediciones = useCallback(async () => {
    const res  = await fetch("/api/mediciones?limit=100");
    const data = await res.json();
    setMediciones(data.mediciones ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMediciones(); }, [fetchMediciones]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!markerPos) {
      setMensaje({ text: "Hacé clic en el mapa para seleccionar el punto de emisión.", ok: false });
      return;
    }
    if (!pm25 || !pm10) {
      setMensaje({ text: "PM2.5 y PM10 son obligatorios.", ok: false });
      return;
    }
    setEnviando(true);
    setMensaje(null);

    const res = await fetch("/api/mediciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: markerPos[0],
        lng: markerPos[1],
        ubicacion,
        pm25: parseFloat(pm25),
        pm10: parseFloat(pm10),
        emision: parseFloat(emision) || 10,
        viento: parseFloat(viento)   || 5,
        notas: notas || null,
      }),
    });

    if (res.ok) {
      setMensaje({ text: "Medición registrada correctamente.", ok: true });
      setPm25(""); setPm10(""); setNotas(""); setMarkerPos(null);
      await fetchMediciones();
    } else {
      const d = await res.json();
      setMensaje({ text: d.error ?? "Error al guardar.", ok: false });
    }
    setEnviando(false);
  }

  async function eliminar(id: number) {
    await fetch(`/api/mediciones/${id}`, { method: "DELETE" });
    await fetchMediciones();
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8 gap-6 max-w-3xl mx-auto">
      <header className="w-full text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Mis Mapas</h1>
        <p className="text-neutral-400 text-sm mt-1">
          Dispersión de contaminantes atmosféricos · Modelo de pluma gaussiana
        </p>
      </header>

      {/* Map */}
      <div className="w-full rounded-2xl overflow-hidden border border-neutral-800" style={{ height: 420 }}>
        <MapaDispersion
          mediciones={mediciones}
          onMapClick={(lat, lng) => setMarkerPos([lat, lng])}
          markerPos={markerPos}
        />
      </div>

      <p className="text-neutral-500 text-xs -mt-3">
        {markerPos
          ? `📍 ${markerPos[0].toFixed(5)}, ${markerPos[1].toFixed(5)} — completá el formulario y registrá`
          : "Hacé clic en el mapa para colocar el punto de emisión"}
      </p>

      {/* Form */}
      <section className="w-full flex flex-col gap-3">
        <h2 className="text-white font-semibold text-xs uppercase tracking-wider text-neutral-400">
          Nueva medición
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className={LABEL}>Ubicación</label>
            <input className={INPUT} value={ubicacion} onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Ej: Cusco - Wanchaq" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>PM2.5 (µg/m³)</label>
              <input className={INPUT} type="number" min="0" step="0.1" value={pm25}
                onChange={(e) => setPm25(e.target.value)} placeholder="Ej: 35.5" required />
            </div>
            <div>
              <label className={LABEL}>PM10 (µg/m³)</label>
              <input className={INPUT} type="number" min="0" step="0.1" value={pm10}
                onChange={(e) => setPm10(e.target.value)} placeholder="Ej: 60.0" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Tasa de emisión (g/s)</label>
              <input className={INPUT} type="number" min="0.1" step="0.1" value={emision}
                onChange={(e) => setEmision(e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Velocidad del viento (m/s)</label>
              <input className={INPUT} type="number" min="0.1" step="0.1" value={viento}
                onChange={(e) => setViento(e.target.value)} />
            </div>
          </div>

          <div>
            <label className={LABEL}>Notas (opcional)</label>
            <input className={INPUT} value={notas} onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Medición manual, hora pico" />
          </div>

          <button
            type="submit"
            disabled={enviando || !markerPos}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-semibold transition-colors text-sm"
          >
            {enviando ? "Guardando…" : "Registrar medición"}
          </button>
        </form>

        {mensaje && (
          <p className={`text-sm ${mensaje.ok ? "text-emerald-400" : "text-red-400"}`}>
            {mensaje.text}
          </p>
        )}
      </section>

      {/* History */}
      <section className="w-full flex flex-col gap-3 pb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Historial de mediciones
          </h2>
          <span className="text-xs text-neutral-600">{total} registros</span>
        </div>

        {loading && <p className="text-neutral-500 text-sm">Cargando…</p>}

        {!loading && mediciones.length === 0 && (
          <p className="text-neutral-600 text-sm">
            No hay mediciones todavía. Hacé clic en el mapa y registrá la primera.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {mediciones.map((m) => (
            <div key={m.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-white font-semibold text-sm truncate">{m.ubicacion}</span>
                  <span className="text-xs text-emerald-400 font-mono">
                    {Number(m.lat).toFixed(4)}, {Number(m.lng).toFixed(4)}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-neutral-400 flex-wrap">
                  <span>PM2.5 <strong className="text-white">{m.pm25}</strong> µg/m³</span>
                  <span>PM10 <strong className="text-white">{m.pm10}</strong> µg/m³</span>
                  <span>Q={m.emision} g/s</span>
                  <span>u={m.viento} m/s</span>
                </div>
                {m.notas && <p className="text-neutral-600 text-xs mt-1 italic">{m.notas}</p>}
                <p className="text-neutral-700 text-xs mt-1">
                  {new Date(m.created_at).toLocaleString("es-PE", {
                    day: "numeric", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
              <button
                onClick={() => eliminar(m.id)}
                className="text-neutral-600 hover:text-red-400 transition-colors text-xs flex-shrink-0 mt-1"
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
