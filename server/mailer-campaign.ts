// Full 50-contact campaign — one send per unique address, category-appropriate templates
// From: Samuel Wotton <hello@echokappa.com>

export interface CampaignContact {
  id: number;
  to: string;
  name: string;
  org: string;
  category: "A" | "B" | "C" | "D" | "E" | "F";
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

// ── Category F: Italian Connection ────────────────────────────────────────────

const bodyF_copasir = `To the President of COPASIR,

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
hello@echokappa.com`;

const bodyF_garante = `Gentile Garante,

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
hello@echokappa.com`;

const bodyF_corteconti = `Alla Corte dei Conti della Repubblica Italiana,

Segnalo una questione che potrebbe rilevare ai fini del controllo sulla gestione delle partecipate pubbliche italiane operanti all'estero, in particolare con riferimento a Telespazio S.p.A. (partecipata da Leonardo S.p.A. al 67%, a sua volta partecipata dal Ministero dell'Economia).

Nel marzo 2020, Telespazio Argentina S.A. — controllata di Telespazio SpA — si è aggiudicata il contratto 2019LN-000002-0005900001 emesso dal Registro Nacional della Repubblica di Costa Rica. Il contratto, del valore di circa 20 milioni di USD, prevedeva il rilievo catastale di oltre un milione di particelle su circa il 50% del territorio costaricano.

La mia analisi dei parametri tecnici del contratto — precisione geodetica sub-centimetrica, distribuzione capillare dei punti di controllo a 10°N di latitudine, integrazione con il Registro Nacional — indica una corrispondenza funzionale con i requisiti di calibrazione della costellazione SAR COSMO-SkyMed Seconda Generazione, operata congiuntamente da ASI e Ministero della Difesa italiano. COSMO-SkyMed è un asset militare-civile dual use; la calibrazione a terra in banda equatoriale riduce significativamente l'errore di fase nelle acquisizioni ad alta risoluzione.

Non è mia intenzione affermare che il contratto sia illegittimo in sé. Chiedo invece se la Corte dei Conti abbia valutato, nell'ambito del controllo sulla gestione di Leonardo/Telespazio, se i benefici derivanti dall'uso militare-duale dell'infrastruttura geodetica costaricana siano stati rendicontati separatamente rispetto ai ricavi commerciali del contratto, e se l'uso della partecipata argentina come veicolo per contratti di rilevanza strategica sia stato soggetto a preventiva autorizzazione ministeriale.

Sono disponibile a trasmettere documentazione tecnica e di procurement a supporto di questa segnalazione.

Con ossequio,

Samuel Wotton
hello@echokappa.com`;

const bodyF_europarl = `To the Chair of the LIBE Committee / PEGA successor inquiry,

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
hello@echokappa.com`;

const bodyF_wired = `To the investigations desk at Wired Italia,

I am offering a story lead that connects Italian defence procurement, satellite calibration infrastructure, and offensive cyber tools in Central America.

In 2020, Telespazio Argentina — the Latin American subsidiary of the Leonardo-Thales space joint venture — won a USD 20 million public contract to survey one million land parcels across 50% of Costa Rica. The contract is verifiable in the Registro Nacional's public procurement database (contract ID: 2019LN-000002-0005900001, awarded September 2019). The stated purpose was municipal tax modernisation.

The technical parameters — sub-centimetre geodetic precision distributed across equatorial territory at 10°N latitude — match the ground-truth calibration requirements for the COSMO-SkyMed Second Generation X-band SAR constellation, a joint ASI/Italian Ministry of Defence military-civil dual-use system. Calibration grids at equatorial latitudes provide a coverage advantage that higher-latitude European reference stations cannot replicate.

Layered on top of this: the Leonardo group holds 31.3% of Elettronica S.p.A., which controls 38.38% of Cy4gate S.p.A. Cy4gate's D-SINT platform is an offensive intelligence product that generates target profiles for RCS-class forensic implant operators. The marketing materials and procurement records are public.

I am a resident of Jacó, Costa Rica — a town identified in technical analysis as the primary terrestrial anchor of this regional sensor network. I have spent eighteen months documenting what I assess to be a targeted surveillance and electronic harassment operation against me personally, with signal logs, acoustic drone recordings, packet captures, and RF frequency documentation.

The story is verifiable at multiple independent levels: procurement records, satellite orbital parameters, corporate ownership filings, and my own technical dossier. I am not asking you to accept my interpretation — I am asking whether your team has capacity to verify the procurement and corporate chain independently, which I believe would take two working days.

I am available for a call or to transmit the dossier via encrypted channel.

Samuel Wotton
hello@echokappa.com`;

const bodyF_telespazio = `To Telespazio S.p.A. Legal / Data Protection,

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
hello@echokappa.com`;

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
  // ── Category F: Italian Connection ────────────────────────────────────────
  { id: 47, to: "copasir@camera.it",              name: "COPASIR President",           org: "Italian Parliament",  category: "F", subject: "Dual-use cadastral contract in Costa Rica — Telespazio Argentina, COSMO-SkyMed calibration, and Cy4gate D-SINT deployment",   body: bodyF_copasir },
  { id: 48, to: "garante@gpdp.it",               name: "Garante Privacy",             org: "Garante GDPR Italy",  category: "F", subject: "Richiesta di verifica — Cy4gate D-SINT e profilazione di soggetti extra-UE tramite infrastruttura italiana",                 body: bodyF_garante },
  { id: 49, to: "urp@corteconti.it",             name: "Corte dei Conti",             org: "Corte dei Conti",     category: "F", subject: "Segnalazione — contratto Telespazio Argentina / Registro Nacional Costa Rica: uso duale non dichiarato",                      body: bodyF_corteconti },
  { id: 50, to: "PEGA@europarl.europa.eu",        name: "LIBE / PEGA Committee",       org: "European Parliament", category: "F", subject: "Italian offensive cyber tools in Central America — Cy4gate D-SINT and Leonardo group targeting of a European-origin national", body: bodyF_europarl },
  { id: 51, to: "redazione@wired.it",            name: "Wired Italia Investigations", org: "Wired Italia",        category: "F", subject: "Story lead: Telespazio cadastral contract in Costa Rica, Cy4gate targeting, and the Leonardo surveillance stack in Latin America", body: bodyF_wired },
  { id: 52, to: "info@telespazio.com",           name: "Telespazio Legal / DPO",      org: "Telespazio S.p.A.",   category: "F", subject: "Data subject access request and public interest inquiry — cadastral survey contract Costa Rica 2019LN-000002-0005900001",       body: bodyF_telespazio },
];
