import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  KAPPA_CONSTANTS,
  ANALYSIS_POINTS,
  type SatellitePass,
  type SdrNode,
  type FlightData,
  type SignalEvent,
  type Correlation,
} from "@shared/schema";
import { Plane, Satellite, Radio, Activity, Link2, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

const observerIcon = new L.DivIcon({
  html: `<div style="background:#3b82f6;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  className: "",
});

const jacoIcon = new L.DivIcon({
  html: `<div style="background:#f59e0b;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  className: "",
});

const sjoIcon = new L.DivIcon({
  html: `<div style="background:#ef4444;width:14px;height:14px;border-radius:3px;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:8px;font-weight:bold;">A</span></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  className: "",
});

const ti0rcIcon = new L.DivIcon({
  html: `<div style="background:#22c55e;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  className: "",
});

const satIcon = new L.DivIcon({
  html: `<div style="background:#a855f7;width:8px;height:8px;border-radius:50%;border:1px solid white;box-shadow:0 0 3px rgba(168,85,247,0.6);"></div>`,
  iconSize: [8, 8],
  iconAnchor: [4, 4],
  className: "",
});

const overheadIcon = new L.DivIcon({
  html: `<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 8px rgba(239,68,68,0.7);animation:pulse 2s infinite;"><style>@keyframes pulse{0%,100%{box-shadow:0 0 8px rgba(239,68,68,0.7)}50%{box-shadow:0 0 16px rgba(239,68,68,1)}}</style></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  className: "",
});

const nodeIcon = new L.DivIcon({
  html: `<div style="background:#22c55e;width:12px;height:12px;border-radius:2px;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  className: "",
});

const domainMarkerColors: Record<string, string> = {
  satellite: "#a855f7",
  sdr: "#eab308",
  elf: "#06b6d4",
  radar: "#f43f5e",
  isp: "#64748b",
  rf: "#22c55e",
  morse: "#d97706",
};

function eventIcon(domain: string) {
  const color = domainMarkerColors[domain] || "#6b7280";
  return new L.DivIcon({
    html: `<div style="background:${color};width:10px;height:10px;border-radius:50%;border:1.5px solid white;box-shadow:0 0 3px ${color}80;opacity:0.85;"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
    className: "",
  });
}

function flightIcon(heading: number | null, altitude: number | null) {
  const rotation = heading ?? 0;
  let color = "#f97316";
  if (altitude != null) {
    if (altitude < 3000) color = "#22c55e";
    else if (altitude < 8000) color = "#eab308";
    else color = "#ef4444";
  }
  return new L.DivIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(${rotation}deg);filter:drop-shadow(0 0 2px rgba(0,0,0,0.5));"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    className: "",
  });
}

function FitBoundsOnce() {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([
      [KAPPA_CONSTANTS.JACO_LAT - 0.2, KAPPA_CONSTANTS.JACO_LON - 0.2],
      [KAPPA_CONSTANTS.OBSERVER_LAT + 0.2, KAPPA_CONSTANTS.OBSERVER_LON + 0.2],
    ]);
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map]);
  return null;
}

const severityLineColors = ["#6b7280", "#22c55e", "#eab308", "#f97316", "#ef4444", "#991b1b"];

function getPointIcon(id: string) {
  if (id === "observer") return observerIcon;
  if (id === "sjo") return sjoIcon;
  if (id === "ti0rc") return ti0rcIcon;
  return jacoIcon;
}

export default function MapPage() {
  const { t } = useI18n();
  const [showSatellites, setShowSatellites] = useState(true);
  const [showFlights, setShowFlights] = useState(true);
  const [showNodes, setShowNodes] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showCorrelations, setShowCorrelations] = useState(true);
  const [showCoverage, setShowCoverage] = useState(true);

  const { data: satellites } = useQuery<SatellitePass[]>({
    queryKey: ["/api/satellites"],
    refetchInterval: 60000,
  });

  const { data: nodes } = useQuery<SdrNode[]>({
    queryKey: ["/api/nodes"],
  });

  const { data: flights } = useQuery<FlightData[]>({
    queryKey: ["/api/flights"],
    refetchInterval: 30000,
  });

  const { data: events } = useQuery<SignalEvent[]>({
    queryKey: ["/api/events", "recent"],
    refetchInterval: 10000,
  });

  const { data: correlations } = useQuery<Correlation[]>({
    queryKey: ["/api/correlations"],
    refetchInterval: 30000,
  });

  const visibleSats = satellites?.filter(s => s.latitude != null && s.longitude != null) ?? [];
  const activeSats = visibleSats.filter(s => s.elevation != null && s.elevation >= KAPPA_CONSTANTS.MIN_ELEVATION);
  const overheadSats = visibleSats.filter(s => s.elevation != null && s.elevation >= KAPPA_CONSTANTS.OVERHEAD_ELEVATION);

  const geoEvents = events?.filter(e => e.latitude != null && e.longitude != null) ?? [];

  const correlationLines = (correlations ?? []).map(c => {
    const linked = (events ?? []).filter(e => c.eventIds.includes(e.id) && e.latitude && e.longitude);
    if (linked.length < 2) return null;
    return { correlation: c, positions: linked.map(e => [e.latitude!, e.longitude!] as [number, number]) };
  }).filter(Boolean) as { correlation: Correlation; positions: [number, number][] }[];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">{t("map.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("map.description")}</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Button variant={showFlights ? "default" : "outline"} size="sm" onClick={() => setShowFlights(!showFlights)} data-testid="button-toggle-flights">
            <Plane className="h-3.5 w-3.5 mr-1" />
            {t("collectors.flights")} {flights && `(${flights.length})`}
          </Button>
          <Button variant={showSatellites ? "default" : "outline"} size="sm" onClick={() => setShowSatellites(!showSatellites)} data-testid="button-toggle-satellites">
            <Satellite className="h-3.5 w-3.5 mr-1" />
            {t("collectors.satellites")} ({visibleSats.length})
          </Button>
          <Button variant={showEvents ? "default" : "outline"} size="sm" onClick={() => setShowEvents(!showEvents)} data-testid="button-toggle-events">
            <Activity className="h-3.5 w-3.5 mr-1" />
            {t("map.events")} ({geoEvents.length})
          </Button>
          <Button variant={showCorrelations ? "default" : "outline"} size="sm" onClick={() => setShowCorrelations(!showCorrelations)} data-testid="button-toggle-correlations">
            <Link2 className="h-3.5 w-3.5 mr-1" />
            {t("map.correlations")} ({correlationLines.length})
          </Button>
          <Button variant={showNodes ? "default" : "outline"} size="sm" onClick={() => setShowNodes(!showNodes)} data-testid="button-toggle-nodes">
            <Radio className="h-3.5 w-3.5 mr-1" />
            {t("map.sdr")}
          </Button>
          <Button variant={showCoverage ? "default" : "outline"} size="sm" onClick={() => setShowCoverage(!showCoverage)} data-testid="button-toggle-coverage">
            <MapPin className="h-3.5 w-3.5 mr-1" />
            {t("map.coverage")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-mono font-semibold" data-testid="text-map-flights">{flights?.length ?? 0}</div>
            <div className="text-xs text-muted-foreground">{t("collectors.flights")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-mono font-semibold" data-testid="text-map-satellites">{visibleSats.length}</div>
            <div className="text-xs text-muted-foreground">{t("collectors.satellites")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-mono font-semibold text-green-600" data-testid="text-map-visible">{activeSats.length}</div>
            <div className="text-xs text-muted-foreground">{t("map.visibleSats")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-mono font-semibold text-red-600" data-testid="text-map-overhead">{overheadSats.length}</div>
            <div className="text-xs text-muted-foreground">{t("map.overhead")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-mono font-semibold" data-testid="text-map-events">{geoEvents.length}</div>
            <div className="text-xs text-muted-foreground">{t("map.events")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-mono font-semibold">{correlationLines.length}</div>
            <div className="text-xs text-muted-foreground">{t("map.correlations")}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div style={{ height: "520px" }} data-testid="map-container">
          <MapContainer
            center={[KAPPA_CONSTANTS.OBSERVER_LAT, KAPPA_CONSTANTS.OBSERVER_LON]}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBoundsOnce />

            {ANALYSIS_POINTS.map((point) => (
              <Marker
                key={point.id}
                position={[point.lat, point.lon]}
                icon={getPointIcon(point.id)}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{point.name}</strong>
                    <br />
                    <span className="text-xs text-gray-600">{point.description}</span>
                    <br />
                    <span className="text-xs font-mono">{point.lat.toFixed(4)}N, {Math.abs(point.lon).toFixed(4)}W</span>
                  </div>
                </Popup>
              </Marker>
            ))}

            {showCoverage && (
              <>
                <Circle
                  center={[KAPPA_CONSTANTS.OBSERVER_LAT, KAPPA_CONSTANTS.OBSERVER_LON]}
                  radius={15000}
                  pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.05, weight: 1, dashArray: "4 4" }}
                />
                <Circle
                  center={[KAPPA_CONSTANTS.OBSERVER_LAT, KAPPA_CONSTANTS.OBSERVER_LON]}
                  radius={3000}
                  pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.08, weight: 1 }}
                />
                <Circle
                  center={[KAPPA_CONSTANTS.SJO_LAT, KAPPA_CONSTANTS.SJO_LON]}
                  radius={10000}
                  pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.05, weight: 1, dashArray: "4 4" }}
                />
                <Circle
                  center={[KAPPA_CONSTANTS.JACO_LAT, KAPPA_CONSTANTS.JACO_LON]}
                  radius={10000}
                  pathOptions={{ color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 0.05, weight: 1, dashArray: "4 4" }}
                />
                <Polyline
                  positions={[
                    [KAPPA_CONSTANTS.OBSERVER_LAT, KAPPA_CONSTANTS.OBSERVER_LON],
                    [KAPPA_CONSTANTS.SJO_LAT, KAPPA_CONSTANTS.SJO_LON],
                  ]}
                  pathOptions={{ color: "#94a3b8", weight: 1, dashArray: "6 4", opacity: 0.6 }}
                />
                <Polyline
                  positions={[
                    [KAPPA_CONSTANTS.OBSERVER_LAT, KAPPA_CONSTANTS.OBSERVER_LON],
                    [KAPPA_CONSTANTS.JACO_LAT, KAPPA_CONSTANTS.JACO_LON],
                  ]}
                  pathOptions={{ color: "#94a3b8", weight: 1, dashArray: "6 4", opacity: 0.6 }}
                />
              </>
            )}

            {showSatellites && visibleSats.map((sat) => {
              const isOverhead = sat.elevation != null && sat.elevation >= KAPPA_CONSTANTS.OVERHEAD_ELEVATION;
              return (
                <Marker
                  key={sat.id}
                  position={[sat.latitude!, sat.longitude!]}
                  icon={isOverhead ? overheadIcon : satIcon}
                >
                  <Popup>
                    <div className="text-xs">
                      <strong>{sat.satelliteName}</strong>
                      {isOverhead && <span style={{color:"#ef4444",fontWeight:"bold",marginLeft:4}}>OVERHEAD</span>}
                      <br />
                      NORAD: {sat.noradId} | {sat.category}
                      <br />
                      El: {sat.elevation?.toFixed(1)} | Az: {sat.azimuth?.toFixed(1)}
                      <br />
                      Alt: {sat.altitude?.toFixed(0)} km | Range: {sat.range?.toFixed(0)} km
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {showFlights && flights?.map((f) => {
              if (!f.latitude || !f.longitude) return null;
              return (
                <Marker
                  key={f.icao24}
                  position={[f.latitude, f.longitude]}
                  icon={flightIcon(f.heading, f.altitude)}
                >
                  <Popup>
                    <div className="text-xs">
                      <strong>{f.callsign || f.icao24}</strong>
                      <br />
                      ICAO24: {f.icao24} | {f.originCountry}
                      <br />
                      Alt: {f.altitude ? `${(f.altitude * 3.28084).toFixed(0)} ft` : "N/A"}
                      <br />
                      Speed: {f.velocity ? `${(f.velocity * 1.944).toFixed(0)} kts` : "N/A"}
                      <br />
                      Hdg: {f.heading?.toFixed(0)} | {f.onGround ? "GROUND" : "AIRBORNE"}
                      {f.squawk && <><br />Squawk: {f.squawk}</>}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {showEvents && geoEvents.map((evt) => (
              <Marker
                key={evt.id}
                position={[evt.latitude!, evt.longitude!]}
                icon={eventIcon(evt.domain)}
              >
                <Popup>
                  <div className="text-xs">
                    <strong>{evt.domain.toUpperCase()}: {evt.eventType}</strong>
                    <br />
                    Source: {evt.source}
                    <br />
                    Confidence: {(evt.confidence * 100).toFixed(0)}%
                    {evt.frequency && <><br />Freq: {evt.frequency}</>}
                    <br />
                    {new Date(evt.timestamp).toLocaleString()}
                  </div>
                </Popup>
              </Marker>
            ))}

            {showCorrelations && correlationLines.map(({ correlation, positions }) => (
              <Polyline
                key={correlation.id}
                positions={positions}
                pathOptions={{
                  color: severityLineColors[correlation.severity] || "#6b7280",
                  weight: 2,
                  opacity: 0.7,
                  dashArray: "4 4",
                }}
              />
            ))}

            {showNodes && nodes?.map((node) => (
              <Marker
                key={node.id}
                position={[node.latitude, node.longitude]}
                icon={nodeIcon}
              >
                <Popup>
                  <div className="text-xs">
                    <strong>{node.name}</strong>
                    <br />
                    {node.location}
                    <br />
                    <a href={node.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{node.url}</a>
                    <br />
                    {node.status}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </Card>

      {flights && flights.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h3 className="text-sm font-medium mb-3">{t("map.flightsTable")}</h3>
            <div className="border rounded-md">
              <div className="grid grid-cols-7 gap-2 p-2 text-xs font-medium text-muted-foreground border-b">
                <span>{t("map.callsign")}</span>
                <span>{t("map.icao24")}</span>
                <span>{t("map.origin")}</span>
                <span>{t("map.altitude")}</span>
                <span>{t("map.speed")}</span>
                <span>{t("map.heading")}</span>
                <span>{t("map.status")}</span>
              </div>
              {flights.slice(0, 20).map((f) => (
                <div key={f.icao24} className="grid grid-cols-7 gap-2 p-2 text-xs border-b last:border-b-0 items-center" data-testid={`row-flight-${f.icao24}`}>
                  <span className="font-mono font-medium">{f.callsign || "--"}</span>
                  <span className="font-mono text-muted-foreground">{f.icao24}</span>
                  <span>{f.originCountry}</span>
                  <span className="font-mono">{f.altitude ? `${(f.altitude * 3.28084).toFixed(0)} ft` : "--"}</span>
                  <span className="font-mono">{f.velocity ? `${(f.velocity * 1.944).toFixed(0)} kts` : "--"}</span>
                  <span className="font-mono">{f.heading?.toFixed(0)}</span>
                  <span>
                    <Badge variant={f.onGround ? "secondary" : "default"} className="text-[10px]">
                      {f.onGround ? "GROUND" : "AIR"}
                    </Badge>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
