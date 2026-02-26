import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type Locale = "en" | "es";

const translations = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.events": "Events",
    "nav.correlations": "Correlations",
    "nav.satellites": "Satellites",
    "nav.nodes": "Nodes",
    "nav.tools": "Tools",
    "app.title": "KAPPA",
    "app.subtitle": "SIGINT Platform",
    "dashboard.title": "Dashboard",
    "dashboard.description": "Multi-domain signal intelligence overview — Guacima, Costa Rica.",
    "dashboard.totalEvents": "Total Events",
    "dashboard.totalCorrelations": "Correlations",
    "dashboard.domainBreakdown": "Domain Breakdown",
    "dashboard.recentEvents": "Recent Events",
    "dashboard.noEvents": "No signal events ingested yet. Use the Events page or POST to /api/events.",
    "dashboard.observer": "Observer Location",
    "dashboard.observerDesc": "Guacima, Costa Rica",
    "dashboard.lat": "Latitude",
    "dashboard.lon": "Longitude",
    "dashboard.alt": "Altitude",
    "dashboard.minElev": "Min Elevation",
    "dashboard.kappaScore": "KAPPA Score",
    "dashboard.kappaScoreDesc": "Surveillance intensity index (0-100) based on correlated events in 5-min windows.",
    "events.title": "Signal Events",
    "events.description": "Unified multi-domain event feed — WiFi, BLE, LTE, 5G, Satellite, SDR, ELF.",
    "events.domain": "Domain",
    "events.source": "Source",
    "events.eventType": "Event Type",
    "events.frequency": "Frequency",
    "events.confidence": "Confidence",
    "events.time": "Time",
    "events.noData": "No signal events recorded. Ingest events via POST /api/events or use the ingest form.",
    "events.ingest": "Ingest Event",
    "events.all": "All Domains",
    "events.metadata": "Metadata",
    "events.submit": "Submit Event",
    "correlations.title": "Correlations",
    "correlations.description": "Cross-domain temporal pattern matching — detect coordinated surveillance events.",
    "correlations.run": "Run Correlation",
    "correlations.running": "Analyzing...",
    "correlations.rule": "Rule",
    "correlations.severity": "Severity",
    "correlations.linkedEvents": "Linked Events",
    "correlations.noData": "No correlations found. Ingest events across multiple domains, then run the correlation engine.",
    "correlations.rules": "Active Rules",
    "correlations.rulesDesc": "Pattern definitions for cross-domain temporal matching.",
    "correlations.window": "Window",
    "correlations.domains": "Domains",
    "correlations.condition": "Condition",
    "satellites.title": "Satellites",
    "satellites.description": "TLE-based satellite tracking with pass predictions for Guacima (9.95°N, 84.15°W).",
    "satellites.name": "Name",
    "satellites.norad": "NORAD ID",
    "satellites.elevation": "Elevation",
    "satellites.azimuth": "Azimuth",
    "satellites.range": "Range",
    "satellites.lastUpdate": "Last Update",
    "satellites.noData": "No satellite data loaded. Click Refresh TLE to fetch from CelesTrak.",
    "satellites.refresh": "Refresh TLE",
    "nodes.title": "SDR Nodes",
    "nodes.description": "KiwiSDR and remote SDR receivers used for signal collection.",
    "nodes.name": "Name",
    "nodes.url": "URL",
    "nodes.location": "Location",
    "nodes.status": "Status",
    "nodes.online": "Online",
    "nodes.offline": "Offline",
    "nodes.lastSeen": "Last Seen",
    "nodes.noData": "No SDR nodes configured.",
    "nodes.add": "Add Node",
    "nodes.submit": "Add Node",
    "tools.title": "Tool Catalog",
    "tools.description": "Open-source tools for multi-domain signal intelligence — organized by domain.",
    "tools.name": "Tool",
    "tools.repo": "Repository",
    "tools.toolDescription": "Description",
    "tools.domain": "Domain",
    "tools.all": "All",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "lang.en": "EN",
    "lang.es": "ES",
    "common.actions": "Actions",
    "common.loading": "Loading...",
    "common.error": "Something went wrong",
    "common.save": "Save",
    "common.cancel": "Cancel",
  },
  es: {
    "nav.dashboard": "Panel",
    "nav.events": "Eventos",
    "nav.correlations": "Correlaciones",
    "nav.satellites": "Satelites",
    "nav.nodes": "Nodos",
    "nav.tools": "Herramientas",
    "app.title": "KAPPA",
    "app.subtitle": "Plataforma SIGINT",
    "dashboard.title": "Panel",
    "dashboard.description": "Vista general de inteligencia de senales multi-dominio — Guacima, Costa Rica.",
    "dashboard.totalEvents": "Eventos Totales",
    "dashboard.totalCorrelations": "Correlaciones",
    "dashboard.domainBreakdown": "Desglose por Dominio",
    "dashboard.recentEvents": "Eventos Recientes",
    "dashboard.noEvents": "Sin eventos ingresados. Use la pagina de Eventos o POST a /api/events.",
    "dashboard.observer": "Ubicacion del Observador",
    "dashboard.observerDesc": "Guacima, Costa Rica",
    "dashboard.lat": "Latitud",
    "dashboard.lon": "Longitud",
    "dashboard.alt": "Altitud",
    "dashboard.minElev": "Elevacion Minima",
    "dashboard.kappaScore": "Puntuacion KAPPA",
    "dashboard.kappaScoreDesc": "Indice de intensidad de vigilancia (0-100) basado en eventos correlacionados en ventanas de 5 min.",
    "events.title": "Eventos de Senal",
    "events.description": "Feed unificado de eventos multi-dominio — WiFi, BLE, LTE, 5G, Satelite, SDR, ELF.",
    "events.domain": "Dominio",
    "events.source": "Fuente",
    "events.eventType": "Tipo de Evento",
    "events.frequency": "Frecuencia",
    "events.confidence": "Confianza",
    "events.time": "Hora",
    "events.noData": "Sin eventos de senal. Ingrese eventos via POST /api/events o use el formulario.",
    "events.ingest": "Ingerir Evento",
    "events.all": "Todos los Dominios",
    "events.metadata": "Metadatos",
    "events.submit": "Enviar Evento",
    "correlations.title": "Correlaciones",
    "correlations.description": "Coincidencia de patrones temporales entre dominios — detectar eventos de vigilancia coordinada.",
    "correlations.run": "Ejecutar Correlacion",
    "correlations.running": "Analizando...",
    "correlations.rule": "Regla",
    "correlations.severity": "Severidad",
    "correlations.linkedEvents": "Eventos Vinculados",
    "correlations.noData": "Sin correlaciones. Ingrese eventos en multiples dominios y ejecute el motor de correlacion.",
    "correlations.rules": "Reglas Activas",
    "correlations.rulesDesc": "Definiciones de patrones para coincidencia temporal entre dominios.",
    "correlations.window": "Ventana",
    "correlations.domains": "Dominios",
    "correlations.condition": "Condicion",
    "satellites.title": "Satelites",
    "satellites.description": "Seguimiento de satelites basado en TLE con predicciones de paso para Guacima (9.95°N, 84.15°W).",
    "satellites.name": "Nombre",
    "satellites.norad": "ID NORAD",
    "satellites.elevation": "Elevacion",
    "satellites.azimuth": "Azimut",
    "satellites.range": "Rango",
    "satellites.lastUpdate": "Ultima Actualizacion",
    "satellites.noData": "Sin datos de satelites. Haga clic en Actualizar TLE para obtener de CelesTrak.",
    "satellites.refresh": "Actualizar TLE",
    "nodes.title": "Nodos SDR",
    "nodes.description": "Receptores KiwiSDR y SDR remotos para recoleccion de senales.",
    "nodes.name": "Nombre",
    "nodes.url": "URL",
    "nodes.location": "Ubicacion",
    "nodes.status": "Estado",
    "nodes.online": "En linea",
    "nodes.offline": "Fuera de linea",
    "nodes.lastSeen": "Ultimo contacto",
    "nodes.noData": "Sin nodos SDR configurados.",
    "nodes.add": "Agregar Nodo",
    "nodes.submit": "Agregar Nodo",
    "tools.title": "Catalogo de Herramientas",
    "tools.description": "Herramientas de codigo abierto para inteligencia de senales multi-dominio — por dominio.",
    "tools.name": "Herramienta",
    "tools.repo": "Repositorio",
    "tools.toolDescription": "Descripcion",
    "tools.domain": "Dominio",
    "tools.all": "Todos",
    "theme.light": "Claro",
    "theme.dark": "Oscuro",
    "lang.en": "EN",
    "lang.es": "ES",
    "common.actions": "Acciones",
    "common.loading": "Cargando...",
    "common.error": "Algo salio mal",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem("kappa-locale");
    return (saved === "es" ? "es" : "en") as Locale;
  });

  const handleSetLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem("kappa-locale", newLocale);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[locale][key] || key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
