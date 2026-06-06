import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, CheckCircle, XCircle, ChevronDown, ChevronUp, Shield, Zap, AlertTriangle, Radio, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TEMPLATES: { label: string; to: string; subject: string; body: string }[] = [
  {
    label: "A — Fiscal General (v1)",
    to: "fgeneral@poder-judicial.go.cr",
    subject: "Posible vulnerabilidad de seguridad nacional — necesito confirmar a quién dirigirme",
    body: `Estimada Fiscal General Díaz,

Tengo identificada a una persona en Costa Rica que detenta el monopolio de distribución y mantenimiento de los controladores de generadores de respaldo de ICE, Liberty, hospitales de la CCSS, torres celulares y — por extensión — el Aeropuerto Internacional Juan Santamaría. La agencia CISA de Estados Unidos ha publicado vulnerabilidades críticas sobre esos mismos equipos, incluyendo apagado remoto sin autenticación. Esta persona publicó en YouTube las credenciales predeterminadas de acceso a esa infraestructura. La IP de su empresa tiene un puerto de control industrial abierto a internet, verificable en este momento.

Lo que me lleva a escribirle es que tengo dieciocho meses de documentación técnica que vincula a esta misma persona con una operación de hostigamiento electrónico sostenida contra mi persona en Jacó, Puntarenas — lo que sugiere que el acceso a esa infraestructura ya está siendo utilizado para fines distintos a su función declarada.

No incluyo el nombre en este correo. Quiero saber primero si el Ministerio Público tiene interés en recibirlo. Si me confirma que sí, le envío de inmediato el nombre, la empresa, los registros SUTEL, la documentación técnica y el enlace al material de YouTube.

¿Le puedo enviar el expediente?

Atentamente,

Samuel Wotton
Jacó, Puntarenas, Costa Rica`,
  },
  {
    label: "B — Fiscal General (v2)",
    to: "fgeneral@poder-judicial.go.cr",
    subject: "Consulta sobre denuncia — infraestructura crítica nacional expuesta",
    body: `Estimada Fiscal General Díaz,

Me dirijo a usted porque he identificado una situación que considero de interés para el Ministerio Público. Una sola empresa en Costa Rica controla el mantenimiento y acceso remoto a los sistemas de generación de respaldo de ICE, Liberty, los principales hospitales, las torres de telecomunicaciones y el Aeropuerto Juan Santamaría. Los equipos que esa empresa distribuye tienen vulnerabilidades de seguridad publicadas por el gobierno de Estados Unidos — entre ellas, una que permite apagar los generadores de forma remota sin ninguna credencial. El director de esa empresa subió a YouTube sesiones de capacitación donde aparecen las contraseñas de acceso a esos sistemas. El puerto de control industrial de su IP pública está abierto hoy.

Lo relevante para el Ministerio Público es lo siguiente: llevo dieciocho meses documentando que esa misma persona ha estado utilizando infraestructura vinculada a su empresa para hostigarme electrónicamente aquí en Jacó, Puntarenas. Eso implica que el acceso a infraestructura crítica nacional no está siendo usado únicamente para su función declarada.

Tengo el nombre, la empresa, sus frecuencias registradas en SUTEL, y el expediente técnico completo. No lo incluyo aquí porque prefiero confirmar primero que existe interés antes de enviar información identificatoria.

¿Tendría un momento para que le haga llegar el expediente?

Atentamente,

Samuel Wotton
Jacó, Puntarenas, Costa Rica`,
  },
  {
    label: "C — Fiscal General (v3, nombra a Mora)",
    to: "fgeneral@poder-judicial.go.cr",
    subject: "Denuncia formal — Ley 9048, acceso no autorizado a infraestructura crítica",
    body: `Fiscal General Díaz Sánchez,

En enero de 2026, ICE sufrió una brecha en la que aproximadamente 9 GB de correo interno fue exfiltrado por un grupo APT que utilizó la API de Google Sheets como canal de mando y control, con persistencia mediante un servicio systemd disfrazado. Ese ataque ocurrió sobre una red donde la única empresa con acceso técnico subcontratado a los sistemas de generación de respaldo es Setecom S.A., con sede en Heredia.

El director ejecutivo de Setecom S.A. es Héctor Mora Marín. El señor Mora publicó en YouTube sesiones de capacitación donde demostró las credenciales de acceso predeterminadas a los controladores DSE desplegados en ICE, Liberty, los hospitales de la CCSS y el Aeropuerto Internacional Juan Santamaría. La agencia CISA de Estados Unidos tiene cuatro vulnerabilidades publicadas sobre esos modelos exactos, incluyendo ejecución remota de código y apagado sin autenticación. El puerto Modbus 502 de la IP pública de Setecom está abierto en este momento.

Lo que me corresponde denunciar bajo la Ley 9048 es lo siguiente: el señor Mora ha estado ejecutando una operación de acceso e interferencia no autorizados sobre mis dispositivos y red doméstica en Jacó, Puntarenas durante dieciocho meses. Tengo logs forenses de reseteos de contraseña de router vía TR-069 sin acción de mi parte, un service worker de Setecom encontrado activo en mi computadora sin haber visitado su dominio, y un socket persistente hacia infraestructura de red empresarial. Tengo también registros de drones, grabación de RF y documentación de infraestructura física a 50 metros de mi residencia.

Adjunto expediente técnico disponible para envío inmediato en formato ZIP con hash SHA-256. ¿A cuál unidad del Ministerio Público debo dirigirlo — Delitos Tecnológicos o la Fiscalía Especializada?

Samuel Wotton
Jacó, Puntarenas, Costa Rica`,
  },
  {
    label: "CSIRT-CR — Cyber incident report",
    to: "csirt@micitt.go.cr",
    subject: "Reporte de incidente — acceso no autorizado a infraestructura SCADA nacional",
    body: `A quien corresponda,

Presento un reporte de incidente de ciberseguridad que afecta infraestructura crítica nacional. Una empresa con monopolio sobre los controladores DSE de generadores de ICE, Liberty, hospitales y aeropuerto opera hoy con: puerto Modbus 502 expuesto en IP pública, credenciales predeterminadas Admin/Password1234, y cuatro CVEs publicados por CISA (incluyendo RCE y apagado remoto sin autenticación). El director de esa empresa publicó los protocolos de acceso en YouTube. He documentado además acceso no autorizado persistente a mis redes domésticas vinculado a la misma infraestructura durante dieciocho meses.

Tengo el nombre, la empresa, la IP, los logs forenses y la documentación técnica. Solicito número de caso para envío del expediente.

Samuel Wotton
Jacó, Puntarenas, Costa Rica`,
  },
  {
    label: "SUTEL Spectrum — HF 7410 kHz report",
    to: "consultaespectro@sutel.go.cr",
    subject: "Emisión HF no licenciada en 7,410 kHz — correlación con infraestructura SCADA",
    body: `Estimado señor Fallas,

Quisiera reportar una emisión de radiofrecuencia de alta potencia (180W HF) en 7,410 kHz que he documentado durante dieciocho meses en la región de Alajuela. La frecuencia muestra correlación temporal estadísticamente significativa con señales anómalas registradas dentro de mis residencias. La persona que opera esa emisión es, a la vez, director ejecutivo de la única empresa en Costa Rica que distribuye y mantiene los controladores de generadores de respaldo de la red ICE y el aeropuerto nacional — equipos que hoy operan con credenciales predeterminadas y puertos industriales expuestos a internet.

No incluyo el nombre aquí. Quiero confirmar que SUTEL tiene expediente activo sobre esa frecuencia y si hay interés en recibir la documentación técnica completa.

¿Podría confirmarme el estado del expediente y el canal correcto para enviarlo?

Samuel Wotton
Jacó, Puntarenas, Costa Rica`,
  },
  {
    label: "ICE Security — DSE SCADA vulnerability",
    to: "seguridad@ice.go.cr",
    subject: "Vulnerabilidad activa en controladores DSE de generadores ICE",
    body: `A quien corresponda,

Me dirijo a su departamento porque he documentado una exposición de seguridad que afecta directamente la infraestructura de ICE. La empresa que mantiene y configura los controladores DSE de los generadores de respaldo de la red ICE opera con credenciales predeterminadas (Admin/Password1234) en todos los modelos desplegados, tiene el puerto Modbus 502 expuesto a internet sin autenticación, y su director publicó esas credenciales y los protocolos de acceso en YouTube. La agencia CISA publicó cuatro CVEs sobre esos modelos exactos, incluyendo ejecución remota de código y apagado no autenticado.

He verificado que esa IP pública está activa y expuesta en este momento. Tengo el nombre de la empresa y su director, y puedo enviar el expediente técnico completo de inmediato.

¿Hay un canal seguro para remitirlo?

Samuel Wotton
Jacó, Puntarenas, Costa Rica`,
  },
  {
    label: "OIJ Delitos Tecnológicos — intrusion report",
    to: "delitostecnologicos@poder-judicial.go.cr",
    subject: "Denuncia — intrusión informática persistente y acceso no autorizado a SCADA",
    body: `A quien corresponda,

Presento denuncia por intrusión informática sostenida durante dieciocho meses. Los hechos documentados incluyen: reseteo remoto de contraseña de router vía TR-069 sin acción del usuario, servicio de software de una empresa de infraestructura crítica encontrado activo en mi computadora sin haber visitado ese dominio, socket persistente no autorizado hacia infraestructura de red empresarial, y eliminación remota de archivos de evidencia de mi teléfono. El mismo operador responsable de estos accesos controla en monopolio los generadores de respaldo de ICE y el aeropuerto nacional mediante credenciales predeterminadas con CVEs publicados por CISA.

Tengo el nombre completo, empresa, IP, y expediente técnico. Solicito número de denuncia para remitir el material.

Samuel Wotton
Jacó, Puntarenas, Costa Rica`,
  },
  {
    label: "DIS — national security threat",
    to: "jtorres@gobnet.go.cr",
    subject: "Posible amenaza a infraestructura crítica nacional — información para DIS",
    body: `Estimado Director Torres,

Me dirijo a usted porque he identificado a una persona que controla en monopolio el acceso remoto a los generadores de respaldo de ICE, Liberty, hospitales y el aeropuerto nacional, y que ha demostrado disposición a usar ese acceso para fines distintos a su función declarada. Cuento con dieciocho meses de documentación técnica que vincula a esta persona con una operación de hostigamiento electrónico sostenida en territorio costarricense. Sus frecuencias de radio registradas ante SUTEL, la IP de su empresa, y un servicio de software de esa empresa encontrado activo en mi computadora sin haber visitado ese dominio forman una cadena de evidencia verificable.

No incluyo el nombre aquí. Si el DIS tiene interés en recibirlo junto al expediente completo, estoy disponible de inmediato.

Samuel Wotton
Jacó, Puntarenas, Costa Rica`,
  },

  // ── Italian Connection ──────────────────────────────────────────────────────

  {
    label: "IT-1 — COPASIR (parliamentary oversight)",
    to: "copasir@camera.it",
    subject: "Dual-use cadastral contract in Costa Rica — Telespazio Argentina, COSMO-SkyMed calibration, and Cy4gate D-SINT deployment",
    body: `To the President of COPASIR,

I am writing to bring to your committee's attention a matter that intersects Italian defence industrial interests, the dual-use application of civilian procurement contracts, and the deployment of offensive cyber-intelligence tools against individuals in Central America.

I am a British-Canadian national resident in Jacó, Puntarenas, Costa Rica. Since December 2024 I have been subjected to a sustained electronic harassment operation that I have documented with technical precision over eighteen months. That documentation — signal logs, packet captures, drone acoustic signatures, RF recordings — is available in full.

The reason I am addressing COPASIR specifically is that my investigation has identified an Italian industrial nexus as a structural layer of the surveillance architecture operating in this region.

In March 2020, Telespazio Argentina S.A. — a subsidiary of Telespazio SpA, the joint venture between Leonardo S.p.A. (67%) and Thales (33%) — was awarded contract 2019LN-000002-0005900001 by the Registro Nacional of Costa Rica. Valued at approximately USD 20 million, the contract mandated a cadastral survey covering more than one million land parcels across 50% of Costa Rican territory. The stated purpose was municipal tax modernisation under Ley 7509.

The technical parameters of that survey — sub-centimetre geodetic precision, dense parcel distribution at 10°N latitude, integration with the national Registro — correspond precisely to the calibration requirements of the COSMO-SkyMed Second Generation X-band SAR constellation, jointly operated by ASI and the Italian Ministry of Defence. The equatorial positioning at 10°N is optimal for sub-metric phase calibration of sun-synchronous orbits at 619 km altitude, reducing clutter from tropical canopy returns that degrade higher-latitude reference grids.

Compounding this, the Leonardo group exercises indirect control over Cy4gate S.p.A. via its minority stake in Elettronica S.p.A. (31.3%), which holds 38.38% of Cy4gate. Cy4gate's D-SINT platform ingests social media, deep web, and dark web data streams to construct target profiles and deliver those profiles to operators of the Aurora Group's RCS forensic implant suite. The convergence of space-based SAR calibration, terrestrial sensor networks, and offensive civilian cyber tools in the same operational geography is not, in my assessment, coincidental.

I am not asserting that Leonardo or Telespazio have direct knowledge of or responsibility for the individual harassment I have experienced. I am asserting that the infrastructure they have built and calibrated here has been leveraged by actors operating within or adjacent to it.

I am prepared to provide the full technical dossier, including GPS-tagged evidence, signal captures, and procurement cross-references, to COPASIR or to any parliamentary investigator you designate.

Samuel Wotton
Jacó, Puntarenas, Costa Rica
hello@echokappa.com`,
  },

  {
    label: "IT-2 — Garante Privacy (Cy4gate D-SINT)",
    to: "garante@gpdp.it",
    subject: "Richiesta di verifica — Cy4gate D-SINT e profilazione di soggetti extra-UE tramite infrastruttura italiana",
    body: `Gentile Garante,

Mi rivolgo alla sua autorità per segnalare una potenziale violazione dei principi del GDPR applicabili ai titolari del trattamento stabiliti nel territorio dell'Unione Europea.

Cy4gate S.p.A., società italiana con sede a Roma, commercializza la piattaforma di "decision intelligence" denominata D-SINT. Tale piattaforma acquisisce in modo continuo flussi di dati provenienti da social media, dal deep web e dal dark web, li correla attraverso algoritmi di intelligenza artificiale, e genera profili comportamentali di soggetti target — inclusi soggetti che non si trovano nel territorio dell'Unione Europea e che non hanno fornito alcun consenso al trattamento dei propri dati.

Sono cittadino britannico-canadese residente a Jacó, Puntarenas, Costa Rica. Ho documentato nel corso di diciotto mesi un'operazione di sorveglianza e interferenza elettronica sostenuta nei miei confronti. L'infrastruttura tecnica che ho identificato include componenti satellite (costellazione COSMO-SkyMed, operata da ASI e Ministero della Difesa italiano), reti di trasmissione dati transatlantiche gestite da Telecom Italia Sparkle (AS6762), e — stando alla documentazione disponibile — strumenti di accesso remoto riconducibili alla famiglia di prodotti distribuiti da Aurora Group in associazione con Cy4gate.

Domande specifiche che pongo alla sua attenzione:

1. Cy4gate S.p.A. è soggetta alla normativa GDPR in qualità di titolare o responsabile del trattamento per i dati personali acquisiti tramite D-SINT su soggetti extra-UE?
2. Esiste una base giuridica ai sensi dell'art. 6 GDPR per il trattamento sistematico di dati personali a fini di profilazione offensiva su soggetti non europei condotto da un operatore commerciale italiano?
3. Il Garante ha ricevuto notifiche di trattamenti ad alto rischio da parte di Cy4gate ai sensi dell'art. 35 GDPR (DPIA)?

Sono disponibile a fornire documentazione tecnica dettagliata a supporto di questa segnalazione.

Con rispetto,

Samuel Wotton
Jacó, Puntarenas, Costa Rica
hello@echokappa.com`,
  },

  {
    label: "IT-3 — Corte dei Conti (cadastral contract audit)",
    to: "urp@corteconti.it",
    subject: "Segnalazione — contratto Telespazio Argentina / Registro Nacional Costa Rica: uso duale non dichiarato",
    body: `Alla Corte dei Conti della Repubblica Italiana,

Segnalo una questione che potrebbe rilevare ai fini del controllo sulla gestione delle partecipate pubbliche italiane operanti all'estero, in particolare con riferimento a Telespazio S.p.A. (partecipata da Leonardo S.p.A. al 67%, a sua volta partecipata dal Ministero dell'Economia).

Nel marzo 2020, Telespazio Argentina S.A. — controllata di Telespazio SpA — si è aggiudicata il contratto 2019LN-000002-0005900001 emesso dal Registro Nacional della Repubblica di Costa Rica. Il contratto, del valore di circa 20 milioni di USD, prevedeva il rilievo catastale di oltre un milione di particelle su circa il 50% del territorio costaricano.

La mia analisi dei parametri tecnici del contratto — precisione geodetica sub-centimetrica, distribuzione capillare dei punti di controllo a 10°N di latitudine, integrazione con il Registro Nacional — indica una corrispondenza funzionale con i requisiti di calibrazione della costellazione SAR COSMO-SkyMed Seconda Generazione, operata congiuntamente da ASI e Ministero della Difesa italiano. COSMO-SkyMed è un asset militare-civile dual use; la calibrazione a terra in banda equatoriale riduce significativamente l'errore di fase nelle acquisizioni ad alta risoluzione.

Non è mia intenzione affermare che il contratto sia illegittimo in sé. Chiedo invece se la Corte dei Conti abbia valutato, nell'ambito del controllo sulla gestione di Leonardo/Telespazio, se i benefici derivanti dall'uso militare-duale dell'infrastruttura geodetica costaricana siano stati rendicontati separatamente rispetto ai ricavi commerciali del contratto, e se l'uso della partecipata argentina come veicolo per contratti di rilevanza strategica sia stato soggetto a preventiva autorizzazione ministeriale.

Sono disponibile a trasmettere documentazione tecnica e di procurement a supporto di questa segnalazione.

Con ossequio,

Samuel Wotton
hello@echokappa.com`,
  },

  {
    label: "IT-4 — European Parliament LIBE (Cy4gate / spyware)",
    to: "PEGA@europarl.europa.eu",
    subject: "Italian offensive cyber tools in Central America — Cy4gate D-SINT and Leonardo group targeting of a European-origin national",
    body: `To the Chair of the LIBE Committee / PEGA successor inquiry,

I am writing in my capacity as a British-Canadian national with European family ties, currently resident in Costa Rica, who has been subjected to an eighteen-month surveillance and interference operation that I have documented with technical rigor.

This communication concerns the extraterritorial deployment of Italian-origin surveillance technology and the structural role of Leonardo-group companies in enabling that deployment.

Cy4gate S.p.A., an Italian cyber-intelligence firm whose controlling shareholder is Elettronica S.p.A. (in which Leonardo S.p.A. holds 31.3% and Thales 33.3%), markets the D-SINT decision intelligence platform. D-SINT is engineered to continuously ingest social media, dark web, and OSINT streams, construct individual target profiles, and deliver those profiles to operators of offensive remote access tools — including the Aurora Group's RCS forensic implant suite.

In parallel, Telespazio Argentina — a subsidiary of the Leonardo-Thales joint venture Telespazio — executed a USD 20 million cadastral survey contract in Costa Rica between 2020 and 2024, establishing a geodetic calibration grid that serves the COSMO-SkyMed Second Generation military SAR constellation. The geographic node I am located in — Jacó, Puntarenas — is identified in open-source technical analysis as a primary terrestrial anchor point for this orbital calibration infrastructure.

The PEGA Committee's final report identified a systemic failure in EU member-state oversight of spyware exports. The Cy4gate / Elettronica / Leonardo ownership chain represents exactly the type of laundered control structure PEGA identified — where military-industrial shareholders exercise effective operational influence over offensive cyber vendors while maintaining plausible institutional separation.

I am requesting that the Committee or its successor inquiry note this case and consider whether:
— Cy4gate's D-SINT constitutes a dual-use export subject to Regulation (EU) 2021/821 when deployed against targets in third countries;
— The Leonardo group's simultaneous operation of cadastral ground-truth infrastructure (via Telespazio) and offensive targeting tools (via Cy4gate) in the same operational geography represents an undeclared vertical integration of surveillance capability that merits scrutiny under the EU Digital Services Act and dual-use export controls.

Full technical documentation is available on request.

Samuel Wotton
hello@echokappa.com`,
  },

  {
    label: "IT-5 — Wired Italia / investigative press",
    to: "redazione@wired.it",
    subject: "Story lead: Telespazio cadastral contract in Costa Rica, Cy4gate targeting, and the Leonardo surveillance stack in Latin America",
    body: `To the investigations desk at Wired Italia,

I am offering a story lead that connects Italian defence procurement, satellite calibration infrastructure, and offensive cyber tools in Central America.

In 2020, Telespazio Argentina — the Latin American subsidiary of the Leonardo-Thales space joint venture — won a USD 20 million public contract to survey one million land parcels across 50% of Costa Rica. The contract is verifiable in the Registro Nacional's public procurement database (contract ID: 2019LN-000002-0005900001, awarded September 2019). The stated purpose was municipal tax modernisation.

The technical parameters — sub-centimetre geodetic precision distributed across equatorial territory at 10°N latitude — match the ground-truth calibration requirements for the COSMO-SkyMed Second Generation X-band SAR constellation, a joint ASI/Italian Ministry of Defence military-civil dual-use system. Calibration grids at equatorial latitudes provide a coverage advantage that higher-latitude European reference stations cannot replicate.

Layered on top of this: the Leonardo group holds 31.3% of Elettronica S.p.A., which controls 38.38% of Cy4gate S.p.A. Cy4gate's D-SINT platform is an offensive intelligence product that generates target profiles for RCS-class forensic implant operators. The marketing materials and procurement records are public.

I am a resident of Jacó, Costa Rica — a town identified in technical analysis as the primary terrestrial anchor of this regional sensor network. I have spent eighteen months documenting what I assess to be a targeted surveillance and electronic harassment operation against me personally, with signal logs, acoustic drone recordings, packet captures, and RF frequency documentation.

The story is verifiable at multiple independent levels: procurement records, satellite orbital parameters, corporate ownership filings, and my own technical dossier. I am not asking you to accept my interpretation — I am asking whether your team has capacity to verify the procurement and corporate chain independently, which I believe would take two working days.

I am available for a call or to transmit the dossier via encrypted channel.

Samuel Wotton
hello@echokappa.com`,
  },

  {
    label: "IT-6 — Telespazio transparency request",
    to: "info@telespazio.com",
    subject: "Data subject access request and public interest inquiry — cadastral survey contract Costa Rica 2019LN-000002-0005900001",
    body: `To Telespazio S.p.A. Legal / Data Protection,

I am writing in two capacities: as a data subject under GDPR Article 15, and as an affected resident of the geographic area covered by your company's cadastral survey operations in Costa Rica.

Data Subject Access Request

I request confirmation of whether Telespazio S.p.A., Telespazio Argentina S.A., or any entity acting under their instruction has processed personal data relating to me — Samuel Wotton, British-Canadian national, currently resident in Jacó, Puntarenas, Costa Rica — in connection with:

(a) the cadastral survey contract 2019LN-000002-0005900001 awarded by the Registro Nacional of Costa Rica;
(b) any satellite imagery, SAR acquisition, or derived geospatial product covering the Jacó, Puntarenas region between 2020 and the present;
(c) any data sharing arrangement with e-GEOS S.p.A., ASI, the Italian Ministry of Defence, or any third-party intelligence customer relating to ground observations or imagery from the COSMO-SkyMed constellation over Costa Rican territory.

Please provide this confirmation within 30 days as required under GDPR Article 12(3).

Public Interest Inquiry

Separately, and without prejudice to the access request above, I am documenting the dual-use characteristics of your Costa Rica cadastral contract for a public interest investigation. I would welcome a formal response from your communications or legal team to the following questions:

1. Did Telespazio Argentina's performance of contract 2019LN-000002-0005900001 involve the installation of any geodetic reference markers, corner reflectors, or passive radar calibration targets?
2. Has any data product derived from that survey been made available to COSMO-SkyMed operators at ASI or the Italian Ministry of Defence?
3. Does Telespazio have a commercial or operational relationship with Cy4gate S.p.A. or any Aurora Group entity in the Central American region?

I understand that some of these questions may touch on matters your legal team considers sensitive. A response confirming only what can be answered publicly is preferable to no response.

Samuel Wotton
hello@echokappa.com`,
  },
];

interface SendResult {
  ok: boolean;
  id?: string;
  message?: string;
  error?: string;
  detail?: unknown;
}

interface CampaignResult {
  ok: boolean;
  sent: number;
  failed: number;
  total: number;
  results: { id: number; to: string; org: string; ok: boolean; mgId?: string; error?: string }[];
}

export default function MailerPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [fromEmail, setFromEmail] = useState("hello@echokappa.com");
  const [fromName, setFromName] = useState("Samuel Wotton");
  const [lastResult, setLastResult] = useState<SendResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [log, setLog] = useState<{ ts: string; to: string; subject: string; ok: boolean; id?: string }[]>([]);
  const [campaignResult, setCampaignResult] = useState<CampaignResult | null>(null);
  const [showCampaignResults, setShowCampaignResults] = useState(false);
  const [wbResult, setWbResult] = useState<CampaignResult | null>(null);
  const [showWbResults, setShowWbResults] = useState(false);

  const { data: status } = useQuery<{ configured: boolean; domain: string | null }>({
    queryKey: ["/api/mailer/status"],
  });

  const sendMutation = useMutation({
    mutationFn: (payload: { to: string; subject: string; body: string; fromName: string; fromEmail: string }) =>
      apiRequest("POST", "/api/mailer/send", payload),
    onSuccess: async (res) => {
      const data: SendResult = await res.json();
      setLastResult(data);
      if (data.ok) {
        setLog((prev) => [
          { ts: new Date().toLocaleTimeString(), to, subject, ok: true, id: data.id },
          ...prev,
        ]);
      }
    },
    onError: (err: any) => {
      setLastResult({ ok: false, error: err.message });
    },
  });

  const campaignMutation = useMutation({
    mutationFn: (payload: { fromEmail: string; fromName: string; dryRun?: boolean }) =>
      apiRequest("POST", "/api/mailer/campaign", payload),
    onSuccess: async (res) => {
      const data: CampaignResult = await res.json();
      setCampaignResult(data);
      setShowCampaignResults(true);
    },
    onError: (_err: any) => {
      setCampaignResult({ ok: false, sent: 0, failed: 0, total: 0, results: [] });
    },
  });

  const wbMutation = useMutation({
    mutationFn: (payload: { dryRun?: boolean }) =>
      apiRequest("POST", "/api/mailer/whistleblower", payload),
    onSuccess: async (res) => {
      const data: CampaignResult = await res.json();
      setWbResult(data);
      setShowWbResults(true);
    },
    onError: (_err: any) => {
      setWbResult({ ok: false, sent: 0, failed: 0, total: 0, results: [] });
    },
  });

  function loadTemplate(idx: number) {
    const t = TEMPLATES[idx];
    setTo(t.to);
    setSubject(t.subject);
    setBody(t.body);
  }

  function handleSend() {
    if (!to || !subject || !body) return;
    sendMutation.mutate({ to, subject, body, fromName, fromEmail });
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Secure Mailer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sends server-side via Mailgun — TLS verified, bypasses local network
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-500" />
          {status?.configured ? (
            <Badge variant="outline" className="text-green-600 border-green-400 text-xs">
              {status.domain}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-500 border-red-400 text-xs">
              not configured
            </Badge>
          )}
        </div>
      </div>

      {/* Templates */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Load template
        </p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t, i) => (
            t.label.startsWith("IT-1") ? (
              <div key={i} className="flex flex-wrap gap-2 w-full">
                <div className="w-full flex items-center gap-2 mt-1 mb-0.5">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Italian Connection</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <button
                  data-testid={`template-btn-${i}`}
                  onClick={() => loadTemplate(i)}
                  className="text-xs px-2.5 py-1 rounded border border-blue-300 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                >
                  {t.label}
                </button>
              </div>
            ) : t.label.startsWith("IT-") ? (
              <button
                key={i}
                data-testid={`template-btn-${i}`}
                onClick={() => loadTemplate(i)}
                className="text-xs px-2.5 py-1 rounded border border-blue-300 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
              >
                {t.label}
              </button>
            ) : (
              <button
                key={i}
                data-testid={`template-btn-${i}`}
                onClick={() => loadTemplate(i)}
                className="text-xs px-2.5 py-1 rounded border border-border hover:border-foreground/40 transition-colors bg-muted/40"
              >
                {t.label}
              </button>
            )
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">To</label>
          <Input
            data-testid="input-to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com"
            className="mt-1 font-mono text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subject</label>
          <Input
            data-testid="input-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="mt-1 text-sm"
          />
        </div>

        {/* Advanced: from fields */}
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setShowAdvanced(!showAdvanced)}
          data-testid="toggle-advanced"
        >
          {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          From address (optional)
        </button>
        {showAdvanced && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">From name</label>
              <Input
                data-testid="input-from-name"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">From email (leave blank for default)</label>
              <Input
                data-testid="input-from-email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder={`postmaster@${status?.domain || "yourdomain"}`}
                className="mt-1 font-mono text-sm"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Body</label>
          <Textarea
            data-testid="input-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={16}
            className="mt-1 font-mono text-sm resize-y"
            placeholder="Email body..."
          />
        </div>
      </div>

      {/* Send */}
      <div className="flex items-center gap-3">
        <Button
          data-testid="button-send"
          onClick={handleSend}
          disabled={sendMutation.isPending || !to || !subject || !body}
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          {sendMutation.isPending ? "Sending…" : "Send via Mailgun"}
        </Button>
        {lastResult && (
          <div className="flex items-center gap-1.5 text-sm">
            {lastResult.ok ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Delivered — {lastResult.id}</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-500">{lastResult.error}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Send log */}
      {log.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Send log (this session)
          </p>
          <div className="space-y-1">
            {log.map((entry, i) => (
              <div
                key={i}
                data-testid={`log-entry-${i}`}
                className="flex items-center gap-2 text-xs font-mono text-muted-foreground border border-border rounded px-3 py-1.5"
              >
                <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                <span className="text-foreground">{entry.ts}</span>
                <span className="truncate">{entry.to}</span>
                <span className="text-muted-foreground truncate">— {entry.subject}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Campaign: Send All 46 ── */}
      <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <p className="text-sm font-medium">Send All 52 Contacts</p>
          <Badge variant="outline" className="text-xs ml-auto">
            A · B · C · D · E · F
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Sends category-appropriate emails to all 52 unique addresses (350ms stagger).
          From address defaults to <span className="font-mono">hello@echokappa.com</span>.
        </p>

        {/* Confirm warning */}
        <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>This sends real emails. Use Dry Run first to verify the contact list without sending.</span>
        </div>

        <div className="flex gap-2">
          <Button
            data-testid="button-dry-run"
            variant="outline"
            size="sm"
            onClick={() => campaignMutation.mutate({ fromEmail: fromEmail || "hello@echokappa.com", fromName, dryRun: true })}
            disabled={campaignMutation.isPending}
          >
            Dry Run (list only)
          </Button>
          <Button
            data-testid="button-send-campaign"
            size="sm"
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => campaignMutation.mutate({ fromEmail: fromEmail || "hello@echokappa.com", fromName })}
            disabled={campaignMutation.isPending || !status?.configured}
          >
            <Zap className="w-3.5 h-3.5" />
            {campaignMutation.isPending ? "Sending… (46 emails, ~17s)" : "Send All 46 Now"}
          </Button>
        </div>

        {/* Campaign results */}
        {campaignResult && (
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-600 font-medium">{campaignResult.sent} sent</span>
              {campaignResult.failed > 0 && (
                <span className="text-red-500 font-medium">{campaignResult.failed} failed</span>
              )}
              <button
                className="text-xs text-muted-foreground underline ml-auto"
                onClick={() => setShowCampaignResults(!showCampaignResults)}
                data-testid="toggle-campaign-results"
              >
                {showCampaignResults ? "hide" : "show"} details
              </button>
            </div>

            {showCampaignResults && (
              <div className="max-h-64 overflow-y-auto space-y-0.5 border border-border rounded p-2">
                {campaignResult.results.map((r) => (
                  <div
                    key={r.id}
                    data-testid={`campaign-result-${r.id}`}
                    className="flex items-center gap-2 text-xs font-mono py-0.5"
                  >
                    {r.ok ? (
                      <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                    )}
                    <span className="text-muted-foreground w-5 shrink-0">{r.id}</span>
                    <span className="truncate text-foreground">{r.to}</span>
                    <span className="text-muted-foreground shrink-0">{r.org}</span>
                    {r.error && <span className="text-red-400 truncate">{r.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Whistleblower Blast — Italy's Long Leash ── */}
      <div className="border border-red-200 dark:border-red-900 rounded-lg p-4 space-y-3 bg-red-50/30 dark:bg-red-950/20">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-red-500" />
          <p className="text-sm font-medium">Whistleblower Blast — Italy's Long Leash</p>
          <Badge variant="outline" className="text-xs ml-auto border-red-300 dark:border-red-700 text-red-600 dark:text-red-400">
            ~118 recipients
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Sends the Leonardo S.p.A. / CSG SAR / Costa Rica whistleblower letter to all contacts:
          grassroots US media (Tucker Carlson, Shawn Ryan, Jimmy Dore, Taibbi, Kim Iversen, Russell Brand,
          Greenwald, Whitney Webb, Shellenberger…), investigative press (The Intercept, Bellingcat,
          Forbidden Stories, Lighthouse Reports…), digital rights watchdogs (Access Now, Privacy International,
          Citizen Lab, EDRi, Amnesty Tech, RSF…), JW accountability groups (JW Survey, Silent Lambs, AAWA,
          JW Facts…), Costa Rica press (CRHoy, La Nación, Teletica, Semanario Universidad…),
          plus all 52 existing government/regulatory contacts.
        </p>
        <p className="text-xs font-mono text-muted-foreground truncate">
          Subject: ITALY'S LONG LEASH: Leonardo S.p.A., CSG SAR, and the weaponization of Costa Rica's surveillance grid against U.S. citizens
        </p>

        <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Sends real emails to ~118 addresses. Dry Run first to verify the list without sending. Allow ~42 seconds at 350ms stagger.</span>
        </div>

        <div className="flex gap-2">
          <Button
            data-testid="button-wb-dry-run"
            variant="outline"
            size="sm"
            className="border-red-300 dark:border-red-700"
            onClick={() => wbMutation.mutate({ dryRun: true })}
            disabled={wbMutation.isPending}
          >
            Dry Run (list only)
          </Button>
          <Button
            data-testid="button-wb-send"
            size="sm"
            className="gap-2 bg-red-600 hover:bg-red-700 text-white"
            onClick={() => wbMutation.mutate({})}
            disabled={wbMutation.isPending || !status?.configured}
          >
            <Radio className="w-3.5 h-3.5" />
            {wbMutation.isPending ? "Broadcasting… (~42s)" : "Send Whistleblower Blast"}
          </Button>
        </div>

        {/* Whistleblower results */}
        {wbResult && (
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-600 font-medium">{wbResult.sent} sent</span>
              {wbResult.failed > 0 && (
                <span className="text-red-500 font-medium">{wbResult.failed} failed</span>
              )}
              <span className="text-muted-foreground text-xs">/ {wbResult.total} total</span>
              <button
                className="text-xs text-muted-foreground underline ml-auto"
                onClick={() => setShowWbResults(!showWbResults)}
                data-testid="toggle-wb-results"
              >
                {showWbResults ? "hide" : "show"} details
              </button>
            </div>
            {showWbResults && (
              <div className="max-h-72 overflow-y-auto space-y-0.5 border border-border rounded p-2">
                {wbResult.results.map((r) => (
                  <div
                    key={r.id}
                    data-testid={`wb-result-${r.id}`}
                    className="flex items-center gap-2 text-xs font-mono py-0.5"
                  >
                    {r.ok ? (
                      <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                    )}
                    <span className="text-muted-foreground w-6 shrink-0">{r.id}</span>
                    <span className="truncate text-foreground">{r.to}</span>
                    <span className="text-muted-foreground shrink-0 ml-auto pl-2">{r.org}</span>
                    {r.error && <span className="text-red-400 truncate">{r.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CR Authorities Blast — Physical Proximity Threat / JW Ground Layer ── */}
      <CRAuthPanel />

      {/* ── Expansion Blast — UK/DSE, Italy, Argentina, EU, Brazil, ICS, Aviation ── */}
      <ExpansionPanel />

      {/* ── Venezuela / US Blast — Danny Peralta / Daniela / IRS Fraud ── */}
      <VenezuelaPanel />

      {/* ── UPDATE BLAST — RE: all campaigns → forensic site CTA ── */}
      <UpdateAllPanel />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CR Authorities Panel
// ─────────────────────────────────────────────────────────────────────────────
function CRAuthPanel() {
  const { toast } = useToast();
  const [showResults, setShowResults] = React.useState(false);

  const mutation = useMutation({
    mutationFn: (payload: { dryRun?: boolean }) =>
      apiRequest("POST", "/api/mailer/cr-authorities", payload),
    onSuccess: (data: any) => {
      if (data.dryRun) {
        toast({ title: `Dry run: ${data.total} recipients queued`, description: data.contacts.map((c: any) => c.org).join(", ") });
      } else {
        toast({ title: `Sent ${data.sent}/${data.total}`, description: data.failed > 0 ? `${data.failed} failed` : "All delivered" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err?.message || String(err), variant: "destructive" });
    },
  });

  const result = mutation.data as any;

  return (
    <div className="border border-orange-200 dark:border-orange-900 rounded-lg p-4 space-y-3 bg-orange-50/30 dark:bg-orange-950/20">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-orange-500" />
        <p className="text-sm font-medium">CR Authorities — Physical Threat / JW Ground Layer</p>
        <Badge variant="outline" className="text-xs ml-auto border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400">
          36 recipients
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Targeted formal complaints to Costa Rican law enforcement (OIJ, Ministerio Público, Fiscalía Informáticos,
        CSIRT-CR, DIS, SUTEL, MICITT, AERIS, DGAC, Contraloría, Procuraduría, MSP, Defensoría), U.S. Embassy
        ACS / RSO, FBI IC3, CISA, and the IACHR / OAS — detailing the JW territory-card HUMINT network, rotating
        physical surveillance shifts, drone overflights, Héctor Mora / Setecom infrastructure nexus, and the
        Italian satellite collection architecture. Each agency receives a tailored letter in Spanish or English.
      </p>
      <div className="text-xs font-mono text-muted-foreground space-y-0.5">
        <p className="truncate">ES: Denuncia urgente: Amenazas físicas continuas, hostigamiento coordinado…</p>
        <p className="truncate">EN: Urgent formal complaint: Continuous physical threats, organized group proximity…</p>
        <p className="truncate">IACHR: Precautionary measures petition — Article 25 IACHR Rules…</p>
      </div>

      <div className="flex items-start gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded px-3 py-2">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>Sends formal complaints to 36 CR/US/IACHR addresses. Each receives a tailored letter (~400ms stagger, ~15s total).</span>
      </div>

      <div className="flex gap-2">
        <Button
          data-testid="button-cra-dry-run"
          variant="outline"
          size="sm"
          className="border-orange-300 dark:border-orange-700"
          onClick={() => mutation.mutate({ dryRun: true })}
          disabled={mutation.isPending}
        >
          Dry Run (list only)
        </Button>
        <Button
          data-testid="button-cra-send"
          size="sm"
          className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
          onClick={() => mutation.mutate({})}
          disabled={mutation.isPending}
        >
          <Send className="w-3.5 h-3.5" />
          {mutation.isPending ? "Sending… (~15s)" : "Send to CR Authorities"}
        </Button>
      </div>

      {result && !result.dryRun && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-600 font-medium">{result.sent} sent</span>
            {result.failed > 0 && <span className="text-red-500 font-medium">{result.failed} failed</span>}
            <span className="text-muted-foreground text-xs">/ {result.total} total</span>
            <button
              className="text-xs text-muted-foreground underline ml-auto"
              onClick={() => setShowResults(!showResults)}
              data-testid="toggle-cra-results"
            >
              {showResults ? "hide" : "show"} details
            </button>
          </div>
          {showResults && (
            <div className="max-h-60 overflow-y-auto space-y-0.5 border border-border rounded p-2">
              {result.results.map((r: any) => (
                <div key={r.id} data-testid={`cra-result-${r.id}`} className="flex items-center gap-2 text-xs font-mono py-0.5">
                  {r.ok ? <CheckCircle className="w-3 h-3 text-green-500 shrink-0" /> : <XCircle className="w-3 h-3 text-red-500 shrink-0" />}
                  <span className="text-muted-foreground w-6 shrink-0">{r.id}</span>
                  <span className="truncate text-foreground">{r.to}</span>
                  <span className="text-muted-foreground shrink-0 ml-auto pl-2">{r.org}</span>
                  {r.error && <span className="text-red-400 truncate">{r.error}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {result?.dryRun && (
        <div className="max-h-60 overflow-y-auto space-y-0.5 border border-border rounded p-2">
          {result.contacts.map((c: any) => (
            <div key={c.id} data-testid={`cra-dry-${c.id}`} className="flex items-center gap-2 text-xs font-mono py-0.5">
              <span className="text-muted-foreground w-6 shrink-0">{c.id}</span>
              <span className="truncate text-foreground">{c.to}</span>
              <Badge variant="outline" className="text-xs shrink-0 ml-auto">{c.category}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Expansion Panel — UK/DSE, Italy, Argentina, EU, Brazil, ICS/OT, Aviation
// ─────────────────────────────────────────────────────────────────────────────
function ExpansionPanel() {
  const { toast } = useToast();
  const [showResults, setShowResults] = React.useState(false);
  const [fired, setFired] = React.useState<{ sent?: number; failed?: number; total?: number } | null>(null);

  const fireExpansion = async (dryRun: boolean) => {
    try {
      const res = await fetch("/api/mailer/fire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: import.meta.env.VITE_MAILER_SECRET, target: "expansion", dryRun }),
      });
      const data = await res.json();
      if (dryRun) {
        toast({ title: "Dry run queued", description: "341 expansion contacts listed in server log — check console." });
      } else {
        toast({ title: "Expansion blast fired", description: "341 contacts queued async (~120s). Monitor server log." });
        setFired({ total: 341 });
      }
      return data;
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || String(err), variant: "destructive" });
    }
  };

  const VERTICALS = [
    { label: "UK / Deep Sea Electronics",  count: 28, color: "bg-blue-500" },
    { label: "Italy (Leonardo/Telespazio)", count: 25, color: "bg-green-500" },
    { label: "Argentina (Telespazio AR)",   count: 22, color: "bg-yellow-500" },
    { label: "EU Institutions",             count: 20, color: "bg-purple-500" },
    { label: "Brazil (ANATEL/MPF/Press)",   count: 17, color: "bg-pink-500" },
    { label: "ICS/OT Security Community",  count: 31, color: "bg-red-500" },
    { label: "Aviation Expansion",          count: 41, color: "bg-indigo-500" },
  ];

  return (
    <div className="border border-blue-200 dark:border-blue-900 rounded-lg p-4 space-y-3 bg-blue-50/30 dark:bg-blue-950/20">
      <div className="flex items-center gap-2">
        <Radio className="w-4 h-4 text-blue-500" />
        <p className="text-sm font-medium">Expansion Blast — DSE/Setecom Dossier</p>
        <Badge variant="outline" className="text-xs ml-auto border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400">
          341 recipients
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Multi-vertical campaign focused on the Héctor Mora Marín / Setecom / DSE critical infrastructure nexus.
        Covers Deep Sea Electronics UK home jurisdiction, Italian Garante + press (Leonardo/Telespazio),
        Argentine regulators (ENACOM, UIF), EU institutions (EDPB, OLAF, ENISA, Europol, EP committees),
        Brazilian authorities (ANATEL, MPF, COAF), ICS/OT security researchers (Dragos, Claroty, CISA ICS-CERT,
        KrebsOnSecurity), and expanded aviation (ICAO, FAA, NTSB, TSA + 20 airlines).
        Evidence anchor: Edson Martendal's public training video teaching Admin/Password1234 doctrine.
      </p>

      <div className="grid grid-cols-2 gap-1.5">
        {VERTICALS.map((v) => (
          <div key={v.label} className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full shrink-0 ${v.color}`} />
            <span className="text-muted-foreground truncate">{v.label}</span>
            <span className="ml-auto font-mono text-foreground shrink-0">{v.count}</span>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded px-3 py-2">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          Fires async via internal endpoint (~341 × 350ms ≈ 120s). Each vertical receives a tailored letter
          in the relevant language (EN/IT/ES/PT). Evidence: Martendal training video, CISA CVEs, Modbus:502 open IP.
        </span>
      </div>

      <div className="flex gap-2">
        <Button
          data-testid="button-expansion-dry-run"
          variant="outline"
          size="sm"
          className="border-blue-300 dark:border-blue-700"
          onClick={() => fireExpansion(true)}
        >
          Dry Run (log only)
        </Button>
        <Button
          data-testid="button-expansion-send"
          size="sm"
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => fireExpansion(false)}
        >
          <Send className="w-3.5 h-3.5" />
          Fire Expansion Blast
        </Button>
      </div>

      {fired && (
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-600 font-medium">Blast queued — {fired.total} contacts firing async</span>
          <span className="text-muted-foreground text-xs ml-auto">Monitor server log for per-contact status</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE BLAST — RE: to every contact across all 7 campaigns
// Russell Brunson / Dan Kennedy copywriting → single CTA to forensic site
// ─────────────────────────────────────────────────────────────────────────────
function UpdateAllPanel() {
  const { toast } = useToast();
  const [fired, setFired] = React.useState<{ total?: number } | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fire = async (dryRun: boolean) => {
    setLoading(true);
    try {
      const res = await fetch("/api/mailer/fire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: import.meta.env.VITE_MAILER_SECRET, target: "update-all", dryRun }),
      });
      await res.json();
      if (dryRun) {
        toast({ title: "Dry run complete", description: "Contact list logged to server console — check for count and RE: subjects." });
      } else {
        setFired({ total: 560 });
        toast({ title: "Update blast queued", description: "All contacts firing async with RE: subjects. Monitor server log." });
      }
    } catch (e) {
      toast({ title: "Error", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-orange-200 dark:border-orange-900 rounded-lg p-4 space-y-3 bg-orange-50/30 dark:bg-orange-950/20">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4 text-orange-500" />
        <p className="text-sm font-medium">UPDATE BLAST — RE: All Campaigns (~560 contacts)</p>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Sends a follow-up to every unique contact across all 7 campaigns with <span className="font-mono bg-muted px-1 rounded">RE:</span> prepended to their original subject line.
        Body uses pattern-interrupt opens, short punchy paragraphs, escalation hook, and a single CTA to{" "}
        <span className="font-medium text-foreground">echokappa.com/forensic-evidence</span>.
        Spanish variant auto-applied to CR judicial / spectrum contacts.
      </p>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-background border rounded p-2 space-y-0.5">
          <p className="font-medium text-foreground">~560 total</p>
          <p className="text-muted-foreground">Deduplicated unique addresses</p>
        </div>
        <div className="bg-background border rounded p-2 space-y-0.5">
          <p className="font-medium text-foreground">2 variants</p>
          <p className="text-muted-foreground">EN (default) · ES (CR judicial)</p>
        </div>
        <div className="bg-background border rounded p-2 space-y-0.5">
          <p className="font-medium text-foreground">1 CTA</p>
          <p className="text-muted-foreground">echokappa.com/forensic-evidence</p>
        </div>
      </div>

      <div className="text-xs text-muted-foreground bg-muted/40 border rounded px-3 py-2 space-y-1">
        <p className="text-foreground font-medium">Email preview (EN):</p>
        <p className="italic">"You heard from me recently."</p>
        <p className="italic">"Here's the update: It hasn't stopped."</p>
        <p className="italic">"23 violations. 18 months. 21 actors. All public."</p>
        <p className="italic">"→ echokappa.com/forensic-evidence"</p>
        <p className="italic text-orange-600 dark:text-orange-400">"P.S. The suspect holds sole-source contracts for SJO airport power..."</p>
      </div>

      <div className="flex items-start gap-2 text-xs text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded px-3 py-2">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          Fires to <strong>all prior contacts</strong> — media, authorities, NGOs, aviation, legal, CR judicial, US intel, Venezuela.
          Run dry-run first to confirm count and subjects in server log.
        </span>
      </div>

      <div className="flex gap-2">
        <Button
          data-testid="button-update-dry-run"
          variant="outline"
          size="sm"
          className="border-orange-300 dark:border-orange-700"
          onClick={() => fire(true)}
          disabled={loading}
        >
          Dry Run (log only)
        </Button>
        <Button
          data-testid="button-update-send"
          size="sm"
          className="gap-2 bg-orange-600 hover:bg-orange-700 text-white"
          onClick={() => fire(false)}
          disabled={loading}
        >
          <Send className="w-3.5 h-3.5" />
          {loading ? "Queuing…" : "Fire Update Blast"}
        </Button>
      </div>

      {fired && (
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-600 font-medium">Update blast queued — {fired.total} contacts firing async (~200s)</span>
          <span className="text-muted-foreground text-xs ml-auto">Monitor server log for per-contact status</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Venezuela / US Panel — Danny Peralta / Daniela Peralta Marquez / IRS Fraud
// ─────────────────────────────────────────────────────────────────────────────
function VenezuelaPanel() {
  const { toast } = useToast();
  const [fired, setFired] = React.useState<{ total?: number } | null>(null);

  const fire = async (dryRun: boolean) => {
    const res = await fetch("/api/mailer/fire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: import.meta.env.VITE_MAILER_SECRET, target: "venezuela", dryRun }),
    });
    const data = await res.json();
    if (dryRun) {
      toast({ title: "Dry run queued", description: "Venezuela blast logged — check server console for contact list." });
    } else {
      setFired({ total: 81 });
      toast({ title: "Venezuela blast fired", description: "81 contacts queued async (~30s). Monitor server log." });
    }
  };

  return (
    <div className="border border-red-200 dark:border-red-900 rounded-lg p-4 space-y-3 bg-red-50/30 dark:bg-red-950/20">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <p className="text-sm font-medium">Venezuela / US Blast — Danny Peralta & Genesis Daniela Peralta Marquez</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="space-y-1">
          <p className="font-medium text-foreground">US Federal (19)</p>
          <p>IRS Whistleblower, TIGTA, OFAC, FinCEN, FBI, HSI/DHS, DOJ, State Dept, Congress</p>
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground">Venezuela / OAS / UN (16)</p>
          <p>Asamblea Nacional, opposition parties, OAS, OHCHR, Venezuelan civil society NGOs</p>
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground">Argentina (10)</p>
          <p>UIF, INTERPOL, MPF, Cancillería, Migraciones, investigative media</p>
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground">Trafficking / HR / Media (36)</p>
          <p>Polaris, IJM, UNODC, HRW, Amnesty, OCCRP, InSight Crime, AP, Reuters, NYT, Univision, Telemundo</p>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded px-3 py-2">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          IRS Control # 16221 445 09691 5 cited in all US-facing letters. Danny Peralta framed as corrupt
          moderate / liability to both Caracas transition and Washington. Argentine presence of Daniela
          flagged to UIF + Migraciones. 4 tailored letter variants (US, VZ/ES, AR, trafficking).
        </span>
      </div>

      <div className="flex gap-2">
        <Button
          data-testid="button-venezuela-dry-run"
          variant="outline"
          size="sm"
          className="border-red-300 dark:border-red-700"
          onClick={() => fire(true)}
        >
          Dry Run (log only)
        </Button>
        <Button
          data-testid="button-venezuela-send"
          size="sm"
          className="gap-2 bg-red-600 hover:bg-red-700 text-white"
          onClick={() => fire(false)}
        >
          <Send className="w-3.5 h-3.5" />
          Fire Venezuela Blast
        </Button>
      </div>

      {fired && (
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-600 font-medium">Blast queued — {fired.total} contacts firing async</span>
          <span className="text-muted-foreground text-xs ml-auto">Monitor server log for per-contact status</span>
        </div>
      )}
    </div>
  );
}

