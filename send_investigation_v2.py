#!/usr/bin/env python3
"""
Investigation Email Sender v2 — Mailgun API Only
=================================================
Revised focus:
  • SETECOM S.A. / SETECOM Air S.A. corporate dichotomy
  • GRIDTIDE (UNC2814/Gallium) active infrastructure exposure
  • Héctor Mora Marín — new entity spawning / liability insulation pattern
  • Direct civil aviation risk chain: DSE fleet → SJO/MROC

Author: Samuel Wotton / Project KAPPA
Date:   2026-05-26
"""

import os
import json
import time
import random
import logging
import sys
from urllib import request as urllib_request, parse as urllib_parse, error as urllib_error
from datetime import datetime
from pathlib import Path

# ───────────────────────────────────────────────────────────────
# CONFIGURATION
# ───────────────────────────────────────────────────────────────

MAILGUN_API_KEY    = os.environ.get("MAILGUN_API_KEY", "")
MAILGUN_DOMAIN     = os.environ.get("MAILGUN_DOMAIN", "echokappa.com")
MAILGUN_API_BASE   = os.environ.get("MAILGUN_API_BASE", "https://api.mailgun.net")

FROM_EMAIL         = "hello@echokappa.com"
FROM_NAME          = "Samuel Wotton"

STATE_FILE         = "email_send_state_v2.json"
LOG_FILE           = "email_send_log_v2.txt"

MIN_DELAY_SECONDS  = 8
MAX_DELAY_SECONDS  = 18

# Placeholder / test addresses — never send to these
EXCLUDE_ADDRESSES = {
    "YOUR_LIVE_EMAIL@live.com",
    "hello@yourdomain.com",
    "sam@yourdomain.com",
    "yourname@proton.me",
    "samwotton1@gmail.com",
    "acadiasupplyco@gmail.com",
    "pupplussupplement@gmail.com",
    "spwotton@live.com",
}

RECIPIENTS_FILE = "attached_assets/new_recipients_unsent.txt"

# ───────────────────────────────────────────────────────────────
# SPANISH DOMAIN DETECTION
# ───────────────────────────────────────────────────────────────

SPANISH_DOMAINS = {
    "go.cr", "co.cr", "gob.ve", "gob.mx",
    "laprensalibre.cr", "monumental.cr", "teletica.com",
    "crhoy.com", "nacion.com", "grupoextra.com", "diarioextra.com",
    "ticotimes.net", "ucr.ac.cr", "el-nacional.com", "efectococuyo.com",
    "eluniversal.com", "caracaschronicles.com",
    "central-law.com", "aguilarcastillolove.com", "altalegal.com",
    "lexcounsel.com", "baccredomatic.cr", "dentons.com", "fayca.com",
    "pirielegal.com", "aralaw.cr", "ariaslaw.com", "consortiumlegal.com",
    "lexincorp.com", "corderoabogados.com", "sferalegal.com",
    "latinalliancecr.com", "guardiamontes.com", "guardiacubero.com",
    "crowehorwath.cr", "libertycr.com",
    "avianca.com", "copaair.com", "aeromexico.com", "volaris.com",
    "wingo.com", "latam.com", "arajet.com", "iberia.es",
    "sansa.com", "aerobell.com", "greenairways.com",
}

SPANISH_ADDRESSES = {
    "cr@jw.org", "heredia@jw.org", "costarica@jw.org",
    "denuncias@dgac.go.cr", "webmaster@dgac.go.cr",
    "accidentesincidentes@dgac.go.cr",
}


def should_use_spanish(recipient: str) -> bool:
    addr = recipient.lower().strip()
    if addr in {a.lower() for a in SPANISH_ADDRESSES}:
        return True
    domain = addr.split("@", 1)[1] if "@" in addr else ""
    for sd in SPANISH_DOMAINS:
        if domain == sd or domain.endswith("." + sd):
            return True
    return False


# ───────────────────────────────────────────────────────────────
# EMAIL CONTENT
# ───────────────────────────────────────────────────────────────

SUBJECT_EN = (
    "CIVIL AVIATION SAFETY NOTICE: SETECOM Air S.A. — DSE Generator Fleet "
    "Exposed via GRIDTIDE/UNC2814 Infrastructure — Direct Risk to SJO/MROC"
)

SUBJECT_ES = (
    "AVISO DE SEGURIDAD AÉREA: SETECOM Air S.A. — Flota DSE Expuesta vía "
    "Infraestructura GRIDTIDE/UNC2814 — Riesgo Directo para SJO/MROC"
)


def get_body_en() -> str:
    return """\
To Whom It May Concern,

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CIVIL AVIATION SAFETY & LIABILITY NOTICE
SETECOM / SETECOM Air S.A. — Critical Infrastructure Exposure
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

My name is Samuel Wotton. I am a US citizen, independent data analyst,
and former Deloitte / Federal Reserve consultant. I have been operating
Project KAPPA, an autonomous multi-domain signal intelligence platform,
from Costa Rica since late 2024. I am writing to formally notify your
organisation of a documented critical infrastructure exposure with direct
civil aviation implications.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. THE SETECOM / SETECOM AIR CORPORATE DICHOTOMY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SETECOM S.A. (Heredia, Costa Rica) holds the exclusive distribution
contract for Deep Sea Electronics (DSE) in Costa Rica. DSE manufactures
the generator controllers that manage backup power for:

  • ICE national electrical substations
  • Liberty CR / Telecable cellular tower infrastructure
  • Hospital emergency circuits
  • Airport runway and ATC backup systems
  • Data centres serving government and financial institutions

Owner: Héctor Eduardo Mora Marín (HMORA67 / YouTube / CircuitLab)
       Holder of a SUTEL-licensed 180W HF radio transceiver (7410 kHz)

SETECOM Air S.A. is a related civil-aviation-certified technical services
entity — same principal, separate corporate registration — contracted to
service aviation and logistics infrastructure. This corporate split is
significant: it creates a firewall between the OT/SCADA liability exposure
of SETECOM S.A. and the aviation contracts held by SETECOM Air S.A.

I have documented a pattern of new entity formation by Mora coinciding
with periods of heightened regulatory scrutiny and CISA/ZDI CVE publication.
This pattern is consistent with liability insulation strategy rather than
legitimate business diversification. Both entities share technical
infrastructure, personnel, and access credentials.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. GRIDTIDE — ACTIVE THREAT INTERSECTING THIS INFRASTRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GRIDTIDE is a custom backdoor attributed to UNC2814 (overlapping with
Gallium / HAFNIUM threat group). It is currently active in Costa Rican
critical infrastructure. Confirmed exfiltration: 9 gigabytes from ICE's
local mail server. Active across 53 organisations in 42 countries.

Technical profile:
  • Language:      C — compiled for Linux/systemd environments
  • C2 mechanism:  Google Sheets API — polls cell A1 for commands,
                   writes victim metadata to V1, exfiltrates data in
                   45 KB fragments across rows A2–An
  • Encryption:    AES-128-CBC with URL-safe Base64 encoding
  • Persistence:   systemd service named "xapt" (/etc/systemd/system/xapt)
                   executing from /usr/sbin/xapt
  • Tunnel:        SoftEther VPN Bridge (outbound, bypasses perimeter)

Why this matters for aviation:

The US-funded SOC (Mandiant / Google SecOps) monitors only above the
guest OS layer. UNC3886 (related cluster) operates at the hypervisor
level — below EDR visibility, with a documented median dwell time of
122 days. SETECOM's DSE Webnet gateway maintains a permanent 4G GSM
tunnel to servers in England, polling every four seconds, independent
of the local network.

IF the SETECOM master account on DSE Webnet is compromised via GRIDTIDE
or a related implant:

  → An attacker can issue a broadcast STOP command to every generator
    in the ICE/Liberty fleet simultaneously.
  → Airport runway lighting, ILS ground stations, ATC radar, and
    approach lighting systems depend on this backup generation layer.
  → Timing such a command to coincide with a grid event, severe weather,
    or high-traffic arrival window could create a runway incursion or
    approach-guidance failure scenario at SJO/MROC.

This is not theoretical. The attack surface is arithmetically confirmed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. CONFIRMED CVEs — DSE FLEET (CISA/ZDI, JUNE 2024)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CVE-2024-5947  Unauthenticated GET /Backup.bin returns SCADA credentials
               in plaintext. No login required.

CVE-2024-5950  Stack overflow in NXP LPC4357 web server allows remote
               code execution. Network-adjacent, no credentials.

CVE-2024-5949  Malformed multipart request → infinite loop → permanent
               DoS until manual reboot.

CVE-2024-5952  Unauthenticated remote reboot. No credentials required.

Default credentials across the fleet: Admin / Password1234.
Modbus TCP port 502: no authentication, no encryption (protocol dates
to 1979). SNMP v2 community strings: "public" and "private" (unchanged).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. LIABILITY CHAIN FOR AVIATION UNDERWRITERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The corporate split between SETECOM S.A. and SETECOM Air S.A. creates
an apparent liability firewall. Any underwriter, insurer, or regulator
relying on SETECOM Air's aviation certification without auditing the
underlying OT infrastructure of its parent SETECOM S.A. is accepting
undisclosed risk. The two entities share:

  • The same DSE Webnet master account credentials
  • The same field technician access to airport infrastructure
  • The same SUTEL-licensed HF radio transmission infrastructure
  • The same beneficial ownership (Héctor Mora Marín)

This email constitutes formal notice under:
  • ICAO Annex 10, Vol. I — Protection of aeronautical radio frequencies
  • ICAO Annex 17 — Security: Safeguarding International Civil Aviation
  • Chicago Convention, Art. 3bis
  • ITU Radio Regulations, Art. 15
  • FAA Advisory Circular AC 70/7460-1M
  • Costa Rica Ley General de Aviación Civil (Ley 5150)
  • CISA ICS Advisory framework (DSE CVEs published June 2024)

Any aviation insurer, OEM, or regulatory body receiving this notice has
a duty to investigate. Failure to act on documented OT exposure within
a certified aviation contractor may constitute negligence per se in the
event of a power-related incident at SJO/MROC or any other airport where
DSE-controlled generators provide backup power.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. PERSONAL IMPACT & INVESTIGATIVE RECORD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Since January 2025 I have been targeted by an active electronic
surveillance and harassment campaign in Costa Rica. My forensic
investigation directly surfaced SETECOM infrastructure as an
anchor point in that campaign — including documented injection of
a SETECOM-domain script into my browsers without my ever visiting
setecom.com, and confirmed HF transmission activity on Mora's
SUTEL-licensed frequency (7410 kHz) correlating with electronic
attack windows at multiple residences.

The full record — network PCAPs, KiwiSDR spectrograms, PCAPNG analysis,
satellite correlation data, Windows event logs, and evidence chain with
SHA-256 integrity hashing — is documented in Project KAPPA at:

    ciajw.com  (Operations → ICE Briefing / Evidence Chain)

I have sent this notice to ICE, DGAC, SUTEL, COCESNA, FAA, ICAO NACC,
and multiple aviation operators. I have received one automated reply.

I am available for secure interview at any time.

Respectfully,

Samuel Wotton
Independent Researcher / RF Signal Analyst / Project KAPPA
Costa Rica
Email: hello@echokappa.com
Platform: ciajw.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This notice was transmitted programmatically on 2026-05-26 to ensure
delivery integrity. Recipients are requested to confirm receipt and
acknowledge the safety hazard report per applicable duty-of-care
obligations. Evidence repository and full technical briefing available
at ciajw.com or via secure transfer upon request.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""


def get_body_es() -> str:
    return """\
Estimado/a Señor/a,

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AVISO DE SEGURIDAD AÉREA Y RESPONSABILIDAD CIVIL
SETECOM / SETECOM Air S.A. — Exposición de Infraestructura Crítica
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mi nombre es Samuel Wotton. Soy ciudadano estadounidense, analista de
datos independiente y ex consultor de Deloitte / Reserva Federal.
Opero Project KAPPA, una plataforma autónoma de inteligencia de señales,
desde Costa Rica. Escribo para notificarles formalmente de una exposición
crítica de infraestructura con implicaciones directas para la aviación civil.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. LA DICOTOMÍA CORPORATIVA SETECOM / SETECOM AIR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SETECOM S.A. (Heredia, Costa Rica) posee el contrato exclusivo de
distribución de Deep Sea Electronics (DSE) en Costa Rica. DSE fabrica
los controladores que administran la energía de respaldo para:

  • Subestaciones eléctricas nacionales del ICE
  • Infraestructura de torres celulares de Liberty CR / Telecable
  • Circuitos de emergencia hospitalarios
  • Sistemas de respaldo de pistas aeroportuarias y ATC
  • Centros de datos del gobierno e instituciones financieras

Propietario: Héctor Eduardo Mora Marín (HMORA67 / YouTube / CircuitLab)
             Titular de radio HF de 180W licenciada por SUTEL (7410 kHz)

SETECOM Air S.A. es una entidad relacionada — certificada para aviación
civil — con el mismo titular beneficiario pero inscripción corporativa
separada, contratada para servicios técnicos en aviación y logística.
Esta separación corporativa es significativa: crea un muro de contención
entre la exposición de responsabilidad OT/SCADA de SETECOM S.A. y los
contratos de aviación de SETECOM Air S.A.

He documentado un patrón de creación de nuevas entidades por parte de
Mora que coincide con períodos de mayor escrutinio regulatorio y
publicación de CVEs por parte de CISA/ZDI. Este patrón es consistente
con una estrategia de aislamiento de responsabilidad, no con una
diversificación legítima del negocio. Ambas entidades comparten
infraestructura técnica, personal y credenciales de acceso.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. GRIDTIDE — AMENAZA ACTIVA EN ESTA INFRAESTRUCTURA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GRIDTIDE es una puerta trasera personalizada atribuida a UNC2814
(solapamiento con Gallium / HAFNIUM). Actualmente activa en infraestructura
crítica costarricense. Exfiltración confirmada: 9 gigabytes del servidor
de correo local del ICE. Activo en 53 organizaciones en 42 países.

Perfil técnico:
  • Lenguaje:       C — compilado para entornos Linux/systemd
  • Mecanismo C2:   API de Google Sheets — sondea celda A1 para comandos,
                   escribe metadatos de víctima en V1, exfiltra datos en
                   fragmentos de 45 KB en filas A2–An
  • Cifrado:        AES-128-CBC con codificación Base64 URL-safe
  • Persistencia:   servicio systemd "xapt" (/etc/systemd/system/xapt)
                   ejecutándose desde /usr/sbin/xapt
  • Túnel:          SoftEther VPN Bridge (saliente, elude el perímetro)

Por qué esto importa para la aviación:

El SOC financiado por EE.UU. (Mandiant / Google SecOps) monitorea
únicamente por encima de la capa del sistema operativo invitado. UNC3886
(clúster relacionado) opera a nivel de hipervisor — por debajo de la
visibilidad de cualquier EDR — con un tiempo medio de permanencia
documentado de 122 días. La puerta de enlace DSE Webnet de SETECOM
mantiene un túnel GSM 4G permanente hacia servidores en Inglaterra,
sondeando cada cuatro segundos, independiente de la red local.

SI la cuenta maestra de SETECOM en DSE Webnet es comprometida:

  → Un atacante puede emitir un comando STOP de difusión a TODOS los
    generadores de la flota ICE/Liberty simultáneamente.
  → Las luces de pista, las estaciones terrestres ILS, el radar ATC y
    los sistemas de iluminación de aproximación dependen de esta capa
    de generación de respaldo.
  → Sincronizar dicho comando con un evento de red, clima severo o una
    ventana de alta afluencia podría crear una incursión en pista o
    falla de guía de aproximación en SJO/MROC.

Esto no es teórico. La superficie de ataque está confirmada aritméticamente.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. CVEs CONFIRMADOS — FLOTA DSE (CISA/ZDI, JUNIO 2024)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CVE-2024-5947  GET /Backup.bin sin autenticación devuelve credenciales
               SCADA en texto plano. Sin inicio de sesión requerido.

CVE-2024-5950  Desbordamiento de pila en servidor web NXP LPC4357
               permite ejecución remota de código.

CVE-2024-5949  Solicitud multipart malformada → bucle infinito → DoS
               permanente hasta reinicio manual.

CVE-2024-5952  Reinicio remoto sin autenticación. Sin credenciales.

Credenciales predeterminadas en toda la flota: Admin / Password1234.
Modbus TCP puerto 502: sin autenticación, sin cifrado.
SNMP v2 cadenas de comunidad: "public" y "private" (sin cambios).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. CADENA DE RESPONSABILIDAD PARA ASEGURADORAS Y REGULADORES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

La separación corporativa entre SETECOM S.A. y SETECOM Air S.A. crea
un muro de responsabilidad aparente. Cualquier aseguradora, regulador u
operador que confíe en la certificación de aviación de SETECOM Air sin
auditar la infraestructura OT subyacente de SETECOM S.A. está asumiendo
un riesgo no divulgado. Ambas entidades comparten:

  • Las mismas credenciales maestras de DSE Webnet
  • El mismo acceso de técnico de campo a infraestructura aeroportuaria
  • La misma infraestructura de transmisión HF licenciada por SUTEL
  • El mismo titular beneficiario (Héctor Mora Marín)

Este aviso constituye notificación formal bajo los marcos aplicables de
ICAO, ITU, FAA, y la Ley General de Aviación Civil de Costa Rica (Ley 5150).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. REGISTRO DE INVESTIGACIÓN Y DISPONIBILIDAD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

El expediente completo — PCAPs de red, espectrogramas KiwiSDR, análisis
PCAPNG, datos de correlación satelital, registros de eventos de Windows
y cadena de evidencia con hash SHA-256 — está documentado en Project KAPPA:

    ciajw.com  (Operaciones → Briefing ICE / Cadena de Evidencia)

Estoy disponible para entrevista en cualquier momento.

Respetuosamente,

Samuel Wotton
Investigador Independiente / Analista de Señales RF / Project KAPPA
Costa Rica
Email: hello@echokappa.com
Plataforma: ciajw.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Aviso transmitido programáticamente el 2026-05-26 para garantizar la
integridad de entrega. Se solicita a los destinatarios confirmar recepción
y reconocer el informe de peligro de seguridad conforme a las obligaciones
aplicables de deber de cuidado.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""


# ───────────────────────────────────────────────────────────────
# STATE MANAGEMENT
# ───────────────────────────────────────────────────────────────

def load_state() -> dict:
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    return {"sent": [], "failed": []}


def save_state(state: dict):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


# ───────────────────────────────────────────────────────────────
# LOGGING
# ───────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("InvestigationMailer")


# ───────────────────────────────────────────────────────────────
# MAILGUN SEND
# ───────────────────────────────────────────────────────────────

def send_via_mailgun(recipient: str) -> tuple:
    """Send one email via Mailgun API. Returns (ok, detail)."""
    if not MAILGUN_API_KEY:
        return False, "MAILGUN_API_KEY not set"

    spanish = should_use_spanish(recipient)
    subject  = SUBJECT_ES if spanish else SUBJECT_EN
    body     = get_body_es() if spanish else get_body_en()
    lang     = "ES" if spanish else "EN"

    url = f"{MAILGUN_API_BASE}/v3/{MAILGUN_DOMAIN}/messages"

    data = urllib_parse.urlencode({
        "from":    f"{FROM_NAME} <{FROM_EMAIL}>",
        "to":      recipient,
        "subject": subject,
        "text":    body,
        "h:X-Priority":  "1",
        "h:Importance":  "high",
        "h:X-Mailer":    "KAPPA-Investigation-Mailer-2.0",
    }).encode("utf-8")

    import base64
    credentials = base64.b64encode(f"api:{MAILGUN_API_KEY}".encode()).decode()
    req = urllib_request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )

    try:
        with urllib_request.urlopen(req, timeout=30) as resp:
            body_resp = resp.read().decode("utf-8", errors="replace")
            return True, f"HTTP {resp.status} [{lang}]: {body_resp[:120]}"
    except urllib_error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        return False, f"HTTP {e.code} [{lang}]: {err_body[:200]}"
    except Exception as e:
        return False, f"ERROR [{lang}]: {e}"


# ───────────────────────────────────────────────────────────────
# RECIPIENT LOADING
# ───────────────────────────────────────────────────────────────

def load_recipients() -> list:
    path = Path(RECIPIENTS_FILE)
    if not path.exists():
        log.error(f"Recipients file not found: {RECIPIENTS_FILE}")
        return []
    lines = path.read_text(encoding="utf-8").splitlines()
    recipients = []
    for line in lines:
        addr = line.strip()
        if not addr or addr.startswith("#"):
            continue
        if addr in EXCLUDE_ADDRESSES:
            log.info(f"  [SKIP] Placeholder excluded: {addr}")
            continue
        if "@" not in addr:
            continue
        recipients.append(addr)
    return recipients


# ───────────────────────────────────────────────────────────────
# MAIN
# ───────────────────────────────────────────────────────────────

def main(dry_run: bool = False, max_emails: int = 0):
    if not MAILGUN_API_KEY:
        log.error("MAILGUN_API_KEY environment variable not set. Cannot send.")
        return

    state        = load_state()
    already_sent = set(state.get("sent", []))

    all_recipients = load_recipients()
    remaining = [r for r in all_recipients if r not in already_sent]

    if max_emails > 0:
        remaining = remaining[:max_emails]

    total = len(remaining)
    already_count = len(already_sent)

    log.info("=" * 62)
    log.info("  KAPPA INVESTIGATION EMAIL CAMPAIGN v2")
    log.info(f"  Date:               2026-05-26")
    log.info(f"  Focus:              SETECOM/SETECOM Air + GRIDTIDE + Mora")
    log.info(f"  Total in list:      {len(all_recipients)}")
    log.info(f"  Already sent:       {already_count}")
    log.info(f"  Queued to send:     {total}")
    log.info(f"  Dry run:            {'YES' if dry_run else 'NO'}")
    log.info("=" * 62)

    if total == 0:
        log.info("Nothing to send — all recipients already processed.")
        log.info(f"  Delete {STATE_FILE} to reset and resend.")
        return

    success_count = 0
    fail_count    = 0

    for i, recipient in enumerate(remaining):
        progress = f"[{i+1}/{total}]"
        lang     = "ES" if should_use_spanish(recipient) else "EN"

        if dry_run:
            log.info(f"{progress} DRY RUN — {recipient} ({lang})")
            continue

        log.info(f"{progress} Sending → {recipient} ({lang}) ...")
        ok, detail = send_via_mailgun(recipient)

        if ok:
            log.info(f"  ✓ {detail}")
            already_sent.add(recipient)
            state["sent"] = list(already_sent)
            success_count += 1
        else:
            log.warning(f"  ✗ {detail}")
            if "failed" not in state:
                state["failed"] = []
            state["failed"].append({
                "recipient": recipient,
                "error":     detail,
                "time":      datetime.now().isoformat(),
            })
            fail_count += 1

        save_state(state)

        if i < total - 1:
            delay = random.randint(MIN_DELAY_SECONDS, MAX_DELAY_SECONDS)
            log.info(f"  ⏳ {delay}s delay ...")
            time.sleep(delay)

    log.info("=" * 62)
    log.info(f"  CAMPAIGN COMPLETE")
    log.info(f"  Sent:    {success_count}")
    log.info(f"  Failed:  {fail_count}")
    log.info(f"  Total sent (cumulative): {len(already_sent)}")
    log.info("=" * 62)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="KAPPA Investigation Mailer v2")
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview recipients without sending")
    parser.add_argument("--max", type=int, default=0,
                        help="Limit number of emails this session (0=all)")
    parser.add_argument("--status", action="store_true",
                        help="Show current campaign status and exit")
    parser.add_argument("--reset", action="store_true",
                        help="Clear state file and start fresh")
    args = parser.parse_args()

    if args.reset:
        if os.path.exists(STATE_FILE):
            os.remove(STATE_FILE)
            print(f"State file {STATE_FILE} deleted.")
        sys.exit(0)

    if args.status:
        state = load_state()
        sent      = state.get("sent", [])
        failed    = state.get("failed", [])
        all_recip = load_recipients()
        remaining = [r for r in all_recip if r not in set(sent)]
        print(f"\n  CAMPAIGN STATUS")
        print(f"  Total recipients:  {len(all_recip)}")
        print(f"  Successfully sent: {len(sent)}")
        print(f"  Failed attempts:   {len(failed)}")
        print(f"  Remaining:         {len(remaining)}")
    else:
        main(dry_run=args.dry_run, max_emails=args.max)
