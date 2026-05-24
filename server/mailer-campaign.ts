// Full 50-contact campaign — one send per unique address, category-appropriate templates
// From: Samuel Wotton <hello@ekhokappa.com>

export interface CampaignContact {
  id: number;
  to: string;
  name: string;
  org: string;
  category: "A" | "B" | "C" | "D" | "E";
  subject: string;
  body: string;
}

const bodyA_named = (name: string) => `Estimado/a ${name},

Tengo documentado que una sola empresa detenta el monopolio de distribución y mantenimiento de los controladores de generadores de respaldo Deep Sea Electronics en Costa Rica — equipos que dan soporte a ICE, Liberty, hospitales, torres celulares y, por extensión, el Aeropuerto Juan Santamaría. La agencia CISA de Estados Unidos ha publicado vulnerabilidades sobre esos modelos específicos, incluyendo una que permite el apagado remoto sin ninguna credencial. El director de esa empresa publicó en YouTube las contraseñas de acceso predeterminadas a esos mismos equipos. Su IP pública tiene un puerto de control industrial abierto a internet ahora mismo.

Lo que me preocupa en relación a su área es que si los generadores del aeropuerto forman parte de esa flota — lo cual es coherente con el monopolio nacional — la combinación de esas vulnerabilidades representa un riesgo operativo real para las aeronaves en aproximación.

Tengo el nombre de la persona, su empresa, y la documentación técnica completa. No lo incluyo aquí porque quiero confirmar primero que hay interés en recibirlo.

¿Le puedo enviar el expediente?

Atentamente,
Samuel Wotton
Jacó, Puntarenas, Costa Rica`;

const bodyA_institutional = `A quien corresponda,

Por medio de este correo presento una consulta formal sobre una posible vulnerabilidad de seguridad que afecta la infraestructura de generación de respaldo del Aeropuerto Internacional Juan Santamaría. Una empresa con monopolio nacional sobre los controladores DSE — los mismos equipos que gestionan el arranque de emergencia en instalaciones críticas — opera hoy con credenciales predeterminadas publicadas por su propio director en YouTube, y con un puerto de control industrial expuesto a internet sin autenticación. La agencia CISA de Estados Unidos ha catalogado vulnerabilidades de ejecución remota de código sobre esos modelos exactos.

Tengo identificada a la persona responsable y cuento con dieciocho meses de documentación técnica. Solicito indicación sobre el canal correcto para presentar el expediente completo.

Samuel Wotton
Jacó, Puntarenas, Costa Rica`;

const bodyB_named = (name: string) => `Estimado/a ${name},

Me dirijo a usted porque he documentado una situación que podría tener implicaciones para la seguridad del espacio aéreo en Costa Rica. Una empresa con monopolio sobre los controladores de generadores de respaldo en el país — incluyendo instalaciones vinculadas al Aeropuerto Juan Santamaría — tiene vulnerabilidades de apagado remoto sin autenticación publicadas por CISA, y su director publicó en YouTube las credenciales predeterminadas de acceso a esa infraestructura. Adicionalmente, he documentado operaciones de drones no autorizados en la región de Jacó con aparente capacidad técnica profesional, y emisiones de radiofrecuencia sin licencia en 7,410 kHz desde un operador vinculado a la misma empresa.

Si esto afecta la integridad del espacio aéreo regional, su organización tendría la autoridad para emitir una notificación formal. Tengo el nombre completo de la persona y la documentación disponible para transferencia.

¿Tendría interés en recibir el expediente?

Samuel Wotton
Jacó, Puntarenas, Costa Rica`;

const bodyB_institutional = `A quien corresponda,

Cuento con documentación sobre una empresa costarricense que controla en monopolio los generadores de respaldo de infraestructura crítica nacional, incluyendo infraestructura aeroportuaria, y que opera hoy con vulnerabilidades de acceso remoto no autenticado publicadas por CISA. El director de la empresa documentó las contraseñas de acceso en YouTube. Hay también emisiones de RF no licenciadas en banda de 40 metros y operaciones de drones no autorizados vinculados a la misma red, con posibles implicaciones para el espacio aéreo de la región.

Quedo disponible para enviar el expediente completo si hay interés.

Samuel Wotton — Jacó, Costa Rica`;

const bodyC_ministra = `Estimada Ministra Bogantes,

Me permito informarle de una situación que considero de interés para el MICITT. Una empresa registrada en Costa Rica detenta el monopolio sobre los controladores industriales de generadores de respaldo de ICE, Liberty, hospitales y el aeropuerto nacional. La agencia CISA de Estados Unidos ha publicado cuatro vulnerabilidades sobre esos equipos, entre ellas una de ejecución remota de código y otra de apagado no autenticado. El director de esa empresa publicó los protocolos de acceso en YouTube. La IP pública de la empresa tiene abierto el puerto Modbus 502 en este momento.

Tengo además dieciocho meses de evidencia que vincula a esa misma persona con una operación de hostigamiento electrónico en mi contra en Jacó — lo que sugiere que su acceso a infraestructura crítica ya está siendo ejercido fuera de su función declarada.

Tengo el nombre y el expediente completo. ¿A qué división debo enviarlo?

Samuel Wotton — Jacó, Puntarenas`;

const bodyC_radio = `Estimada señora Vargas,

Quisiera reportar una emisión de radiofrecuencia de alta potencia (180W HF) en 7,410 kHz que he documentado durante dieciocho meses en la región de Alajuela. La frecuencia muestra correlación temporal estadísticamente significativa con señales anómalas registradas dentro de mis residencias. La persona que opera esa emisión es, a la vez, director ejecutivo de la única empresa en Costa Rica que distribuye y mantiene los controladores de generadores de respaldo de la red ICE y el aeropuerto nacional — equipos que hoy operan con credenciales predeterminadas y puertos industriales expuestos a internet.

No incluyo el nombre aquí. ¿Podría confirmarme si SUTEL tiene expediente activo sobre esa frecuencia y cuál es el canal correcto para presentar documentación técnica?

Samuel Wotton — Jacó, Puntarenas`;

const bodyC_csirt = `A quien corresponda,

Presento un reporte de incidente de ciberseguridad que afecta infraestructura crítica nacional. Una empresa con monopolio sobre los controladores DSE de generadores de ICE, Liberty, hospitales y aeropuerto opera hoy con: puerto Modbus 502 expuesto en IP pública, credenciales predeterminadas Admin/Password1234, y cuatro CVEs publicados por CISA (incluyendo RCE y apagado remoto sin autenticación). El director de esa empresa publicó los protocolos de acceso en YouTube. He documentado además acceso no autorizado persistente a mis redes domésticas vinculado a la misma infraestructura durante dieciocho meses.

Tengo el nombre, la empresa, la IP, los logs forenses y la documentación técnica. Solicito número de caso para envío del expediente.

Samuel Wotton — Jacó, Puntarenas`;

const bodyC_spectrum = `Estimado señor Fallas,

Quisiera reportar una emisión de radiofrecuencia de alta potencia (180W HF) en 7,410 kHz que he documentado durante dieciocho meses en la región de Alajuela. La frecuencia muestra correlación temporal estadísticamente significativa con señales anómalas registradas dentro de mis residencias. La persona que opera esa emisión es, a la vez, director ejecutivo de la única empresa en Costa Rica que distribuye y mantiene los controladores de generadores de respaldo de la red ICE y el aeropuerto nacional — equipos que hoy operan con credenciales predeterminadas y puertos industriales expuestos a internet.

No incluyo el nombre aquí. ¿Podría confirmarme el estado del expediente y el canal correcto para enviarlo?

Samuel Wotton — Jacó, Puntarenas`;

const bodyC_sutel_general = `A quien corresponda,

Presento consulta sobre dos situaciones vinculadas a un mismo operador en Costa Rica: (1) una frecuencia HF de 180W en 7,410 kHz que no aparece correctamente licenciada para la potencia utilizada, y (2) la IP pública de su empresa tiene el puerto Modbus 502 abierto a internet, con credenciales predeterminadas que el propio director publicó en YouTube. Esta empresa mantiene contratos de mantenimiento de infraestructura crítica nacional. Cuento con documentación técnica extensa y el nombre completo del operador.

¿Cuál es el proceso para presentar el expediente formalmente?

Samuel Wotton — Jacó, Puntarenas`;

const bodyD_dis = `Estimado Director Torres,

Me dirijo a usted porque he identificado a una persona que controla en monopolio el acceso remoto a los generadores de respaldo de ICE, Liberty, hospitales y el aeropuerto nacional, y que ha demostrado disposición a usar ese acceso para fines distintos a su función declarada. Cuento con dieciocho meses de documentación técnica que vincula a esta persona con una operación de hostigamiento electrónico sostenida en territorio costarricense. Sus frecuencias de radio registradas ante SUTEL, la IP de su empresa, y un servicio de software de esa empresa encontrado activo en mi computadora sin haber visitado ese dominio forman una cadena de evidencia verificable.

No incluyo el nombre aquí. Si el DIS tiene interés en recibirlo junto al expediente completo, estoy disponible de inmediato.

Samuel Wotton — Jacó, Puntarenas`;

const bodyD_dis_ct = `A quien corresponda,

He identificado a una persona en Costa Rica que controla en monopolio el mantenimiento técnico de los generadores de respaldo de ICE, Liberty, hospitales y el aeropuerto nacional, y que opera simultáneamente una red de vigilancia electrónica no autorizada contra mi persona en Jacó. Los indicadores técnicos documentados incluyen: interceptación SSL verificada por error SSLV3_ALERT_HANDSHAKE_FAILURE, reseteo remoto de credenciales de router vía TR-069 sin acción del usuario, y emisiones HF de 180W en 7,410 kHz sin licencia adecuada. La misma empresa tiene el puerto Modbus 502 expuesto con credenciales predeterminadas en IP pública.

Tengo el nombre, la empresa y el expediente. ¿Es éste el canal correcto para trasladarlo?

Samuel Wotton — Jacó, Puntarenas`;

const bodyD_oij_tech = `A quien corresponda,

Presento denuncia por intrusión informática sostenida durante dieciocho meses. Los hechos documentados incluyen: reseteo remoto de contraseña de router vía TR-069 sin acción del usuario, servicio de software de una empresa de infraestructura crítica encontrado activo en mi computadora sin haber visitado ese dominio, socket persistente no autorizado hacia infraestructura de red empresarial, y eliminación remota de archivos de evidencia de mi teléfono. El mismo operador responsable de estos accesos controla en monopolio los generadores de respaldo de ICE y el aeropuerto nacional mediante credenciales predeterminadas con CVEs publicados por CISA.

Tengo el nombre completo, empresa, IP, y expediente técnico. Solicito número de denuncia para remitir el material.

Samuel Wotton — Jacó, Puntarenas`;

const bodyD_cico = `A quien corresponda,

Remito esta información de forma confidencial. Tengo identificada a una persona en Costa Rica que controla en monopolio los sistemas de generación de respaldo de la infraestructura crítica nacional (ICE, aeropuerto, hospitales) y que ha estado, de manera paralela, operando una red de hostigamiento electrónico contra mi persona durante dieciocho meses en Jacó. Cuento con su nombre, empresa, frecuencias SUTEL, IP, y documentación forense extensa. No lo publico en este canal por razones de seguridad. ¿Cuál es el procedimiento para trasladar la información de forma segura?

Samuel Wotton`;

const bodyD_oij_general = `A quien corresponda,

Presento denuncia formal por acceso e interferencia no autorizados a dispositivos de telecomunicaciones y red doméstica, en violación de la Ley 9048. Los hechos ocurren en Jacó, Puntarenas, Costa Rica. Tengo dieciocho meses de documentación técnica que incluye: logs de reseteo de credenciales de router vía TR-069, service worker de empresa de infraestructura crítica encontrado activo sin haber visitado su dominio, socket persistente no autorizado, y registros de interferencia electromagnética correlacionada con actividad del operador. La persona identificada tiene monopolio sobre el mantenimiento de los generadores de ICE y el aeropuerto nacional.

Solicito número de denuncia para presentar el expediente completo.

Samuel Wotton — Jacó, Puntarenas, Costa Rica`;

const bodyD_fiscal = `Fiscal General Díaz Sánchez,

En enero de 2026, ICE sufrió una brecha en la que aproximadamente 9 GB de correo interno fue exfiltrado por un grupo APT que utilizó la API de Google Sheets como canal de mando y control, con persistencia mediante un servicio systemd disfrazado. Ese ataque ocurrió sobre una red donde la única empresa con acceso técnico subcontratado a los sistemas de generación de respaldo es Setecom S.A., con sede en Heredia.

El director ejecutivo de Setecom S.A. es Héctor Mora Marín. El señor Mora publicó en YouTube sesiones de capacitación donde demostró las credenciales de acceso predeterminadas a los controladores DSE desplegados en ICE, Liberty, los hospitales de la CCSS y el Aeropuerto Internacional Juan Santamaría. La agencia CISA de Estados Unidos tiene cuatro vulnerabilidades publicadas sobre esos modelos exactos, incluyendo ejecución remota de código y apagado sin autenticación. El puerto Modbus 502 de la IP pública de Setecom está abierto en este momento.

Lo que me corresponde denunciar bajo la Ley 9048 es lo siguiente: el señor Mora ha estado ejecutando una operación de acceso e interferencia no autorizados sobre mis dispositivos y red doméstica en Jacó, Puntarenas durante dieciocho meses. Tengo logs forenses de reseteos de contraseña de router vía TR-069, un service worker de Setecom encontrado activo en mi computadora sin haber visitado su dominio, y un socket persistente hacia infraestructura de red empresarial.

¿A cuál unidad del Ministerio Público debo dirigir el expediente — Delitos Tecnológicos o la Fiscalía Especializada?

Samuel Wotton — Jacó, Puntarenas, Costa Rica`;

const bodyD_informaticos = `A quien corresponda,

Cuento con evidencia forense de dieciocho meses sobre una operación de intrusión informática sostenida que incluye: interceptación MitM confirmada por error SSLV3_ALERT_HANDSHAKE_FAILURE con certificado "WE2" de Google Trust Services, service worker de empresa de infraestructura crítica activo en mis dispositivos sin visita a ese dominio, socket persistente no autorizado hacia IP empresarial, y reseteo remoto de credenciales de router vía TR-069. El operador identificado es director ejecutivo de la empresa con monopolio sobre los generadores de respaldo de ICE y el aeropuerto nacional.

Tengo el nombre, empresa, IP y expediente técnico completo. Solicito número de caso para remitir el material.

Samuel Wotton — Jacó, Puntarenas`;

const bodyD_sva = `Estimado/a,

Me dirijo a su unidad porque he documentado durante dieciocho meses: (1) emisiones HF de alta potencia (180W, 7,410 kHz) sin licencia adecuada vinculadas a un operador de infraestructura crítica aeroportuaria, y (2) una flota de drones con capacidad técnica profesional operando en la región de Jacó–Esterillos desde 2023, con rastreo activo documentado en mayo 2026. El mismo operador HF mantiene contratos de mantenimiento de los generadores de respaldo del aeropuerto mediante credenciales predeterminadas con vulnerabilidades de apagado remoto publicadas por CISA.

Si su unidad monitorea el espectro en la región del aeropuerto, es posible que tengan registros coincidentes. Tengo el nombre y el expediente disponibles.

Samuel Wotton — Jacó, Puntarenas`;

const bodyE_ice_security = `A quien corresponda,

Me dirijo a su departamento porque he documentado una exposición de seguridad que afecta directamente la infraestructura de ICE. La empresa que mantiene y configura los controladores DSE de los generadores de respaldo de la red ICE opera con credenciales predeterminadas (Admin/Password1234) en todos los modelos desplegados, tiene el puerto Modbus 502 expuesto a internet sin autenticación, y su director publicó esas credenciales y los protocolos de acceso en YouTube. La agencia CISA publicó cuatro CVEs sobre esos modelos exactos, incluyendo ejecución remota de código y apagado no autenticado.

He verificado que esa IP pública está activa y expuesta en este momento. Tengo el nombre de la empresa y su director, y puedo enviar el expediente técnico completo de inmediato.

¿Hay un canal seguro para remitirlo?

Samuel Wotton — Jacó, Puntarenas`;

const bodyE_ice_abuse = `A quien corresponda,

Reporto un posible abuso de red relacionado con infraestructura de ICE. Una empresa subcontratista de ICE para mantenimiento de generadores de respaldo tiene el puerto Modbus 502 expuesto en IP pública con credenciales predeterminadas (Admin/Password1234), lo que constituye un vector de acceso remoto no autenticado a los sistemas de control industrial de esa empresa. El director publicó en YouTube los protocolos de acceso exactos. La agencia CISA publicó cuatro CVEs sobre esos modelos. He verificado que el puerto está abierto en este momento.

Tengo el nombre, empresa e IP disponibles para coordinación.

Samuel Wotton — Jacó, Puntarenas`;

const bodyE_ice_general = `A quien corresponda,

Comunico una situación que afecta la seguridad de la infraestructura de ICE. Los controladores de generadores de respaldo instalados y mantenidos por el subcontratista exclusivo de esos equipos en Costa Rica operan hoy con credenciales predeterminadas publicadas en YouTube por el propio director de esa empresa. El puerto de control industrial está expuesto a internet sin autenticación. La agencia CISA tiene publicadas cuatro vulnerabilidades sobre esos modelos, incluyendo una de apagado remoto.

Cuento con el nombre de la empresa, su director, y la documentación técnica. ¿Cuál es el canal correcto para trasladarlo?

Samuel Wotton — Jacó, Puntarenas`;

const bodyE_ice_substation = `Estimado señor Fernández,

Me dirijo a usted porque gestiona las subestaciones regionales de ICE y el asunto que le reporto afecta directamente esa infraestructura. La empresa que mantiene los controladores DSE de los generadores de respaldo de ICE en todo el país opera con credenciales predeterminadas, puertos industriales expuestos a internet, y cuatro CVEs publicados por CISA sobre esos modelos exactos. Su director subió a YouTube los protocolos de acceso. Eso significa que cualquier persona con acceso a esa red puede enviar comandos a los generadores vinculados a las subestaciones.

Tengo el nombre y el expediente disponibles. ¿Le puedo enviar la documentación técnica?

Samuel Wotton — Jacó, Puntarenas`;

const bodyE_ice_power = `Estimado señor Murillo,

Me dirijo a usted como coordinador de sistemas de generación de ICE porque el asunto que reporto afecta directamente su área. La empresa con monopolio sobre los controladores DSE de los generadores de respaldo de la red ICE opera con credenciales predeterminadas publicadas en YouTube, puerto Modbus 502 expuesto a internet, y cuatro CVEs de CISA incluyendo apagado remoto sin autenticación. El Webnet DSE 890 MKII mantiene un túnel inverso permanente a servidores UK que puede ser reutilizado por cualquier actor con acceso al canal C2.

Tengo el nombre del director y el expediente técnico. ¿Hay un canal seguro para enviarlo?

Samuel Wotton — Jacó, Puntarenas`;

const bodyE_icetel = `Estimado señor Gómez,

Como representante regulatorio de ICETEL me permito reportar una situación que involucra la infraestructura de telecomunicaciones nacional. La empresa con monopolio sobre los controladores DSE de los generadores de respaldo de ICE opera en incumplimiento de estándares básicos de ciberseguridad: credenciales predeterminadas publicadas en YouTube, puerto Modbus 502 expuesto a internet, y cuatro vulnerabilidades publicadas por CISA. Un auditor independiente podría verificar esas condiciones en tiempo real. Cuento con el expediente técnico y el nombre del director.

¿Tendría posibilidad de solicitar una auditoría del contrato?

Samuel Wotton — Jacó, Puntarenas`;

const bodyE_racsa_security = `A quien corresponda,

Cuento con evidencia forense de dieciocho meses que documenta acceso no autorizado persistente a través de infraestructura de red vinculada a una empresa con monopolio sobre los generadores de respaldo de ICE y el aeropuerto nacional. Los indicadores incluyen: socket persistente hacia IP de infraestructura de red empresarial extranjera, service worker de esa empresa encontrado en dispositivo personal sin haber visitado su dominio, y puerto Modbus 502 expuesto en IP pública con credenciales predeterminadas confirmadas. CISA publicó CVEs de RCE sobre esos equipos.

Su SOC podría tener telemetría relevante sobre ese tráfico. Tengo el nombre, la IP y el expediente técnico disponibles para coordinación.

Samuel Wotton — Jacó, Puntarenas`;

const bodyE_racsa_support = `A quien corresponda,

Reporto una situación de backdoor activo en infraestructura crítica nacional con posible tráfico malicioso en la red estatal. Una empresa subcontratista de ICE tiene el puerto Modbus 502 expuesto a internet con credenciales predeterminadas, un túnel inverso permanente a servidores en Reino Unido (DSE 890 MKII Webnet), y cuatro CVEs de CISA. He documentado además acceso no autorizado sostenido a mis redes domésticas desde infraestructura vinculada a esa empresa.

Tengo el nombre, la empresa, la IP y la documentación técnica. ¿Es éste el canal correcto para presentar la denuncia técnica?

Samuel Wotton — Jacó, Puntarenas`;

const bodyE_racsa_audit = `A quien corresponda,

Presento información sobre una posible irregularidad en la estructura de contratos de mantenimiento de infraestructura crítica estatal. La empresa con monopolio nacional sobre los controladores de generadores de respaldo de ICE, Liberty y el aeropuerto opera en incumplimiento documentado de estándares mínimos de seguridad — credenciales predeterminadas públicas, puertos industriales expuestos a internet, cuatro CVEs de CISA sin aplicar. El incumplimiento de requisitos de seguridad en contratos de infraestructura crítica podría constituir causal de rescisión y responsabilidad por daños.

Cuento con el expediente técnico y el nombre del director. ¿Cuál es el canal para presentarlo formalmente?

Samuel Wotton — Jacó, Puntarenas`;

const bodyE_hacienda = `A quien corresponda,

Presento información sobre posibles irregularidades fiscales vinculadas a contratos de mantenimiento de infraestructura crítica estatal. Una empresa con monopolio nacional sobre los controladores DSE de generadores de ICE, Liberty y aeropuerto opera hoy en incumplimiento documentado de estándares de seguridad incluidos en sus contratos. Adicionalmente, la empresa tiene vínculos documentados con estructuras societarias en Jacó y con una red de propiedades comerciales que presenta patrones financieros irregulares. Cuento con el expediente y el nombre del director.

¿Cuál es el canal formal para presentar este tipo de denuncia?

Samuel Wotton — Jacó, Puntarenas`;

const bodyE_contraloria = `A quien corresponda,

Me dirijo a la Contraloría para reportar una posible irregularidad en contratos de mantenimiento de infraestructura crítica estatal. La empresa que mantiene los controladores de generadores de respaldo de ICE, Liberty y el aeropuerto nacional opera en incumplimiento documentado de estándares básicos de ciberseguridad: credenciales predeterminadas publicadas en YouTube, puertos industriales expuestos a internet, cuatro CVEs publicados por CISA sin aplicar. El incumplimiento de requisitos de seguridad contractuales en concesiones de infraestructura crítica podría constituir causal de rescisión y responsabilidad fiscal del contratante.

Cuento con el nombre, la empresa y la documentación técnica. ¿Cuál es el canal correcto para presentar el expediente?

Samuel Wotton — Jacó, Puntarenas`;

const bodyE_procuraduria = `A quien corresponda,

Me dirijo a la Procuraduría General porque he documentado una situación que puede requerir una medida cautelar urgente. Una empresa con monopolio sobre el mantenimiento de los generadores de respaldo de ICE, Liberty, hospitales y el aeropuerto nacional opera hoy con cuatro vulnerabilidades de CISA sin parchear, credenciales predeterminadas públicas y un puerto de control industrial expuesto a internet. El director de esa empresa tiene simultáneamente dieciocho meses de acceso e interferencia no autorizados documentados contra mis dispositivos en Jacó. El riesgo de que ese acceso sea usado para sabotaje de infraestructura es verificable en tiempo real.

Tengo el nombre, la empresa y el expediente técnico. ¿La Procuraduría puede emitir una medida preventiva mientras se tramita la denuncia penal?

Samuel Wotton — Jacó, Puntarenas`;

const bodyE_presidencia = `Estimado/a,

Me dirijo a la Casa Presidencial porque he identificado una situación de seguridad nacional que no ha encontrado respuesta en los canales técnicos regulares. Una sola empresa controla en monopolio el mantenimiento de los generadores de respaldo de ICE, Liberty, los hospitales de la CCSS, las torres celulares y el aeropuerto Juan Santamaría. Esa empresa opera hoy con credenciales predeterminadas públicamente conocidas, cuatro vulnerabilidades publicadas por el gobierno de Estados Unidos (incluyendo apagado remoto sin autenticación), y su director subió a YouTube los protocolos de acceso. He documentado además que esa misma persona ha utilizado infraestructura vinculada a su empresa para hostigarme electrónicamente durante dieciocho meses en Jacó.

Tengo el nombre, el expediente técnico y la documentación forense completa. La notifiqué también a la Embajada de los Estados Unidos y a la DGAC. Si la Presidencia considera que este expediente debe derivarse a otra instancia, agradezco la orientación.

Samuel Wotton — Jacó, Puntarenas`;

const bodyE_transparencia = `A quien corresponda,

Me dirijo a la División de Transparencia de la Presidencia para reportar una posible falla de integridad en el sistema de contratación de infraestructura crítica. Una empresa con monopolio nacional sobre el mantenimiento de los generadores de respaldo de ICE, Liberty y el aeropuerto nacional opera en incumplimiento documentado de estándares de ciberseguridad contractuales — credenciales predeterminadas publicadas por su propio director en YouTube, puertos industriales expuestos a internet, y cuatro CVEs de CISA sin aplicar. La misma empresa tiene vínculos documentados con estructuras que presentan irregularidades en las regiones de Jacó y La Guácima.

Cuento con el expediente técnico y el nombre del director. ¿Cuál es el canal para presentarlo formalmente?

Samuel Wotton — Jacó, Puntarenas`;

export const CAMPAIGN_CONTACTS: CampaignContact[] = [
  // ── Category A: Civil Aviation ─────────────────────────────────────────────
  { id: 1,  to: "comunicaciones@aeris.cr",         name: "Rafael Mencia Ochoa",        org: "AERIS",               category: "A", subject: "Consulta sobre seguridad de generadores de respaldo en SJO",                           body: bodyA_named("Rafael Mencia Ochoa") },
  { id: 2,  to: "htello@aeris.cr",                 name: "César Tello",                org: "AERIS Operaciones",   category: "A", subject: "Consulta sobre seguridad de generadores de respaldo en SJO",                           body: bodyA_named("César Tello") },
  { id: 3,  to: "jbelliard@aeris.cr",              name: "Juan Belliard",              org: "AERIS Seguridad",     category: "A", subject: "Seguridad aeroportuaria — vulnerabilidad en generadores de respaldo SJO",               body: bodyA_named("Juan Belliard") },
  { id: 4,  to: "mcastillo@dgac.go.cr",            name: "Marcos Castillo Masís",      org: "DGAC",                category: "A", subject: "Denuncia — vulnerabilidad en infraestructura de respaldo aeroportuaria",                body: bodyA_named("Marcos Castillo Masís") },
  { id: 5,  to: "kjackson@dgac.go.cr",             name: "Kenneth Jackson",            org: "DGAC Navegación",     category: "A", subject: "Posible interferencia en espectro de navegación aérea — SJO",                         body: bodyA_named("Kenneth Jackson") },
  { id: 6,  to: "lgarcia@dgac.go.cr",              name: "Luis Diego García Palma",    org: "DGAC Seguridad Op.",  category: "A", subject: "Hazard a operaciones de vuelo — infraestructura de respaldo aeroportuaria",             body: bodyA_named("Luis Diego García Palma") },
  { id: 7,  to: "wrodriguezf@dgac.go.cr",          name: "Waner Rodríguez Fallas",     org: "DGAC Legal",          category: "A", subject: "Consulta legal — contrato de mantenimiento aeroportuario y vulnerabilidades CISA",      body: bodyA_named("Waner Rodríguez Fallas") },
  { id: 8,  to: "dmesen@dgac.go.cr",               name: "Diego Mesén Portela",        org: "DGAC Contraloría",    category: "A", subject: "Denuncia formal — riesgo físico en sistemas de aviación",                              body: bodyA_named("Diego Mesén Portela") },
  { id: 9,  to: "ventanillaunica@dgac.go.cr",      name: "Ventanilla Única",           org: "DGAC",                category: "A", subject: "Denuncia formal — vulnerabilidad en infraestructura de respaldo aeroportuaria",         body: bodyA_institutional },
  // ── Category B: COCESNA ───────────────────────────────────────────────────
  { id: 10, to: "notam@cocesna.org",               name: "AIS Tegucigalpa",            org: "COCESNA",             category: "B", subject: "Alerta de seguridad regional — infraestructura crítica costarricense expuesta",          body: bodyB_institutional },
  { id: 11, to: "calvin.zuniga@cocesna.org",       name: "Calvin Zuñiga",              org: "COCESNA Tech",        category: "B", subject: "Posible interferencia en espacio aéreo costarricense — consulta",                       body: bodyB_named("Calvin Zuñiga") },
  { id: 12, to: "karim.alvarez@cocesna.org",       name: "Karim Alvarez",              org: "COCESNA Safety",      category: "B", subject: "Seguridad aérea regional — emisiones HF y drones no autorizados",                      body: bodyB_named("Karim Alvarez") },
  { id: 13, to: "invoices@cocesna.org",            name: "Auditoría COCESNA",          org: "COCESNA Finance",     category: "B", subject: "Alerta de seguridad — contratista de infraestructura crítica CR",                      body: bodyB_institutional },
  // ── Category C: Telecom / SUTEL / CSIRT ──────────────────────────────────
  { id: 14, to: "despacho.ministra@micitt.go.cr",  name: "Paula Bogantes Zamora",      org: "MICITT",              category: "C", subject: "Vulnerabilidad activa en infraestructura SCADA nacional — solicito orientación",          body: bodyC_ministra },
  { id: 15, to: "evargas@micitt.go.cr",            name: "Eylin Vargas Moya",          org: "MICITT Radio",        category: "C", subject: "Emisión HF no licenciada en 7,410 kHz — solicito orientación",                         body: bodyC_radio },
  { id: 16, to: "csirt@micitt.go.cr",              name: "CSIRT-CR",                   org: "MICITT",              category: "C", subject: "Reporte de incidente — acceso no autorizado a infraestructura SCADA nacional",            body: bodyC_csirt },
  { id: 17, to: "csirt@micit.go.cr",               name: "Ciberseguridad MICITT",      org: "MICITT Cyber",        category: "C", subject: "Incidente activo — infraestructura SCADA crítica expuesta, acceso no autorizado",        body: bodyC_csirt },
  { id: 18, to: "info@sutel.go.cr",                name: "SUTEL",                      org: "SUTEL",               category: "C", subject: "Denuncia — protocolo industrial expuesto y frecuencia HF sin licencia",                  body: bodyC_sutel_general },
  { id: 19, to: "gestiondocumental@sutel.go.cr",   name: "Gestión Documental SUTEL",   org: "SUTEL",               category: "C", subject: "Denuncia formal — operador con frecuencia HF no licenciada e infraestructura expuesta",  body: bodyC_sutel_general },
  { id: 20, to: "consultaespectro@sutel.go.cr",    name: "Glenn Fallas Fallas",        org: "SUTEL Espectro",      category: "C", subject: "Emisión HF no licenciada en 7,410 kHz — correlación con infraestructura SCADA",          body: bodyC_spectrum },
  { id: 21, to: "soporte@sutel.go.cr",             name: "Soporte SUTEL",              org: "SUTEL",               category: "C", subject: "Reporte técnico — transceptor HF 180W no licenciado y puerto SCADA expuesto",            body: bodyC_sutel_general },
  // ── Category D: Intelligence / OIJ / Prosecution ─────────────────────────
  { id: 22, to: "jtorres@gobnet.go.cr",            name: "Jorge Torres Carrillo",      org: "DIS",                 category: "D", subject: "Posible amenaza a infraestructura crítica nacional — información para DIS",              body: bodyD_dis },
  { id: 23, to: "mmongech@gobnet.go.cr",           name: "Jefatura Contraterrorismo",  org: "DIS",                 category: "D", subject: "Red de vigilancia ilegal y acceso a infraestructura crítica — reporte urgente",          body: bodyD_dis_ct },
  { id: 24, to: "Alj-DelegacionOIJ@poder-judicial.go.cr", name: "Delegación OIJ Alajuela", org: "OIJ Alajuela",  category: "D", subject: "Denuncia — intrusión informática y red de hostigamiento en La Guácima",                   body: bodyD_oij_tech },
  { id: 25, to: "delitostecnologicos@poder-judicial.go.cr", name: "Delitos Tecnológicos OIJ", org: "OIJ",          category: "D", subject: "Denuncia — intrusión informática persistente y acceso no autorizado a SCADA",            body: bodyD_oij_tech },
  { id: 26, to: "cicooij@poder-judicial.go.cr",    name: "CICO OIJ",                   org: "OIJ Confidencial",    category: "D", subject: "Información confidencial — infraestructura crítica y operador identificado",             body: bodyD_cico },
  { id: 27, to: "oij_denuncias@poder-judicial.go.cr", name: "Recepción OIJ",           org: "OIJ",                 category: "D", subject: "Denuncia formal — Ley 9048, acceso no autorizado a dispositivos y red",                  body: bodyD_oij_general },
  { id: 28, to: "fgeneral@poder-judicial.go.cr",   name: "Carlo Israel Díaz Sánchez",  org: "Ministerio Público",  category: "D", subject: "Denuncia formal — Ley 9048, acceso no autorizado a infraestructura crítica",            body: bodyD_fiscal },
  { id: 29, to: "delitosinformaticos@oij.go.cr",   name: "Delitos Informáticos OIJ",   org: "OIJ",                 category: "D", subject: "Denuncia — MitM activo, service worker no autorizado, socket persistente",              body: bodyD_informaticos },
  { id: 30, to: "operacionesva@gmail.com",         name: "Comandante Juan Vargas",     org: "SVA",                 category: "D", subject: "Emisiones HF no licenciadas y drones — posible interferencia en área SJO",              body: bodyD_sva },
  { id: 31, to: "csiisva@gmail.com",               name: "ISR SVA",                    org: "SVA Técnico",         category: "D", subject: "Señales HF no licenciadas 7,410 kHz — posible correlación con área aeroportuaria",      body: bodyD_sva },
  // ── Category E: ICE / RACSA / Fiscal ─────────────────────────────────────
  { id: 32, to: "seguridad@ice.go.cr",             name: "Ciberseguridad ICE",         org: "ICE",                 category: "E", subject: "Vulnerabilidad activa en controladores DSE de generadores ICE",                         body: bodyE_ice_security },
  { id: 33, to: "abuse@ice.go.cr",                 name: "Network Abuse ICE",          org: "ICE",                 category: "E", subject: "Abuso de red — puerto SCADA expuesto en subcontratista de ICE",                         body: bodyE_ice_abuse },
  { id: 34, to: "contactenos@ice.go.cr",           name: "Atención al Cliente ICE",    org: "ICE",                 category: "E", subject: "Reporte de seguridad — infraestructura de respaldo ICE con credenciales expuestas",     body: bodyE_ice_general },
  { id: 35, to: "fernande@ice.co.cr",              name: "E. Fernández",               org: "ICE Subestaciones",   category: "E", subject: "Vulnerabilidad en controladores de generadores — afecta subestaciones regionales",       body: bodyE_ice_substation },
  { id: 36, to: "roymurillo@ice.go.cr",            name: "Roy Murillo",                org: "ICE Sistemas Poder",  category: "E", subject: "Exposición crítica — controladores DSE de generadores ICE con acceso remoto abierto",   body: bodyE_ice_power },
  { id: 37, to: "ggomezlo@icetel.go.cr",           name: "G. Gómez Lo.",               org: "ICETEL",              category: "E", subject: "Auditoría urgente — contrato DSE con subcontratista incumple estándares de seguridad",  body: bodyE_icetel },
  { id: 38, to: "seguridad@racsa.go.cr",           name: "SOC RACSA",                  org: "RACSA",               category: "E", subject: "Backdoor activo en infraestructura crítica — posible tráfico malicioso red estatal",     body: bodyE_racsa_security },
  { id: 39, to: "soporte@racsa.go.cr",             name: "Soporte RACSA",              org: "RACSA",               category: "E", subject: "Reporte técnico — backdoor y TR-069 en subcontratista de infraestructura crítica",       body: bodyE_racsa_support },
  { id: 40, to: "denunciaauditoria@racsa.go.cr",   name: "Auditoría RACSA",            org: "RACSA",               category: "E", subject: "Posible irregularidad contractual — subcontratista de ICE incumple seguridad",           body: bodyE_racsa_audit },
  { id: 41, to: "reportes@hacienda.go.cr",         name: "Fraude Fiscal Hacienda",     org: "Hacienda",            category: "E", subject: "Posible irregularidad fiscal — contratos de infraestructura crítica estatal",            body: bodyE_hacienda },
  { id: 42, to: "contralor.general@contraloria.go.cr", name: "Contraloría General",   org: "Contraloría",         category: "E", subject: "Posible irregularidad en contrato de mantenimiento de infraestructura crítica estatal",  body: bodyE_contraloria },
  { id: 43, to: "denuncias@contraloria.go.cr",     name: "Denuncias Contraloría",      org: "Contraloría",         category: "E", subject: "Denuncia — subcontratista incumple requisitos de seguridad en contratos ICE",            body: bodyE_contraloria },
  { id: 44, to: "denuncias@pgr.go.cr",             name: "Procuraduría General",       org: "PGR",                 category: "E", subject: "Solicitud medida cautelar — infraestructura crítica con vulnerabilidad activa",           body: bodyE_procuraduria },
  { id: 45, to: "casapresidencial@presidencia.go.cr", name: "Casa Presidencial",       org: "Presidencia",         category: "E", subject: "Alerta de seguridad nacional — monopolio en infraestructura crítica con backdoor activo", body: bodyE_presidencia },
  { id: 46, to: "transparencia@presidencia.go.cr", name: "Transparencia Presidencia",  org: "Presidencia",         category: "E", subject: "Denuncia de integridad — contratista de infraestructura crítica incumple contratos",     body: bodyE_transparencia },
];
