"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import type { Medicion } from "@/lib/db";
import { generateDispersionData } from "@/lib/simulation";

// Fix Leaflet default marker icons in Next.js/webpack
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const newIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: "hue-rotate-[120deg]",
});

const LAT_PER_M = 1 / 111320;
const CX_LAT = -13.53195;
const LNG_PER_M = 1 / (111320 * Math.cos((CX_LAT * Math.PI) / 180));

function HeatLayer({ mediciones }: { mediciones: Medicion[] }) {
  const map = useMap();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatRef = useRef<any>(null);

  useEffect(() => {
    if (heatRef.current) {
      map.removeLayer(heatRef.current);
      heatRef.current = null;
    }
    if (mediciones.length === 0) return;

    const points: [number, number, number][] = [];
    for (const m of mediciones) {
      const data = generateDispersionData(Number(m.emision), Number(m.viento), 10, 1500);
      for (const d of data) {
        const intensity = Math.min(1, d.concentration * 2e6);
        if (intensity > 0.005) {
          points.push([m.lat + d.x * LAT_PER_M, m.lng + d.y * LNG_PER_M, intensity]);
        }
      }
    }

    if (points.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      heatRef.current = (L as any)
        .heatLayer(points, {
          radius: 22,
          blur: 15,
          maxZoom: 17,
          gradient: { 0.3: "#3b82f6", 0.55: "#22c55e", 0.75: "#eab308", 1.0: "#ef4444" },
        })
        .addTo(map);
    }

    return () => {
      if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null; }
    };
  }, [map, mediciones]);

  return null;
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

interface Props {
  mediciones: Medicion[];
  onMapClick: (lat: number, lng: number) => void;
  markerPos: [number, number] | null;
}

export default function MapaDispersion({ mediciones, onMapClick, markerPos }: Props) {
  return (
    <MapContainer
      center={[CX_LAT, -71.96746]}
      zoom={13}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <HeatLayer mediciones={mediciones} />
      <ClickHandler onMapClick={onMapClick} />

      {markerPos && (
        <Marker position={markerPos} icon={newIcon}>
          <Popup>Nueva medición aquí</Popup>
        </Marker>
      )}

      {mediciones.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]}>
          <Popup>
            <strong>{m.ubicacion}</strong><br />
            PM2.5: <b>{m.pm25}</b> µg/m³ · PM10: <b>{m.pm10}</b> µg/m³<br />
            Emisión: {m.emision} g/s · Viento: {m.viento} m/s<br />
            {m.notas && <><em>{m.notas}</em><br /></>}
            <span style={{ fontSize: "0.75rem", color: "#888" }}>
              {new Date(m.created_at).toLocaleString("es-PE")}
            </span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
