import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, CheckCircle, XCircle, ChevronDown, ChevronUp, Shield, Zap, AlertTriangle } from "lucide-react";

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
  const [fromEmail, setFromEmail] = useState("hello@ekhokappa.com");
  const [fromName, setFromName] = useState("Samuel Wotton");
  const [lastResult, setLastResult] = useState<SendResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [log, setLog] = useState<{ ts: string; to: string; subject: string; ok: boolean; id?: string }[]>([]);
  const [campaignResult, setCampaignResult] = useState<CampaignResult | null>(null);
  const [showCampaignResults, setShowCampaignResults] = useState(false);

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
    onError: (err: any) => {
      setCampaignResult({ ok: false, sent: 0, failed: 0, total: 0, results: [] });
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
            <button
              key={i}
              data-testid={`template-btn-${i}`}
              onClick={() => loadTemplate(i)}
              className="text-xs px-2.5 py-1 rounded border border-border hover:border-foreground/40 transition-colors bg-muted/40"
            >
              {t.label}
            </button>
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
          <p className="text-sm font-medium">Send All 46 Contacts</p>
          <Badge variant="outline" className="text-xs ml-auto">
            A · B · C · D · E
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Sends category-appropriate emails to all 46 unique addresses (350ms stagger).
          From address defaults to <span className="font-mono">hello@ekhokappa.com</span>.
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
            onClick={() => campaignMutation.mutate({ fromEmail: fromEmail || "hello@ekhokappa.com", fromName, dryRun: true })}
            disabled={campaignMutation.isPending}
          >
            Dry Run (list only)
          </Button>
          <Button
            data-testid="button-send-campaign"
            size="sm"
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => campaignMutation.mutate({ fromEmail: fromEmail || "hello@ekhokappa.com", fromName })}
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
    </div>
  );
}
