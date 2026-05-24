# Email — Fiscal General / Poder Judicial CR
**To:** fgeneral@poder-judicial.go.cr  
**Subject:** Alerta de Seguridad Nacional: Una Sola Persona Controla la Infraestructura Crítica de Costa Rica — Backdoor Activo, Vulnerabilidad de Aviación Internacional  
**From:** Samuel Wotton  
**Date:** 24 de mayo, 2026  

---

## EMAIL BODY

---

Estimada Fiscal General Díaz,

**Existe una sola persona en Costa Rica que tiene acceso remoto, con credenciales predeterminadas públicamente conocidas, a los generadores de respaldo de ICE, Liberty, los hospitales principales del país, las torres celulares, y — por extensión directa — a la infraestructura de energía del Aeropuerto Internacional Juan Santamaría. Esa persona está enseñando esas credenciales en YouTube. Esta no es una hipótesis. Es un hecho documentado, verificable hoy mismo por cualquier investigador técnico, y constituye una exposición activa de seguridad nacional que involucra la seguridad aérea internacional.**

Le escribo para notificarle de esta vulnerabilidad porque he documentado que esta misma persona ha utilizado su posición de monopolio sobre esta infraestructura para fines operativos distintos a su función declarada — lo que significa que el backdoor no es solo teórico: ya está siendo explotado.

---

### I. EL MONOPOLIO — UN SOLO PUNTO DE FALLA NACIONAL

Una empresa registrada en Costa Rica detenta la distribución exclusiva en todo el territorio nacional de los controladores de generadores Deep Sea Electronics (DSE) — los mismos equipos que gestionan el encendido y apagado de los generadores de respaldo en:

- Subestaciones y plantas de ICE (infraestructura eléctrica nacional)
- Torres y centros de datos de Liberty (telecomunicaciones nacionales)
- Hospitales de la CCSS
- Torres de telefonía celular
- Instalaciones industriales y gubernamentales

El director ejecutivo de esa empresa es una sola persona. No hay redundancia humana. No hay competencia. Toda la cadena de distribución, configuración, mantenimiento y acceso remoto pasa por esa empresa y, en última instancia, por ese individuo.

---

### II. EL BACKDOOR — CISA LO DOCUMENTÓ, ÉL LO ENSEÑA EN YOUTUBE

La Agencia de Seguridad de Infraestructura y Ciberseguridad de los Estados Unidos (CISA) ha publicado cuatro CVEs sobre los modelos DSE855, DSE890, DSE891 y DSE892 — los mismos gateways que esta empresa distribuye:

- **CVE-2024-5947**: Divulgación de información — el archivo de configuración completo (incluyendo credenciales) es accesible sin autenticación.
- **CVE-2024-5948**: Desbordamiento de búfer — permite ejecución remota de código arbitrario en el gateway, lo que equivale a control total del generador desde internet.
- **CVE-2024-5952**: Ausencia de autenticación — permite que cualquier usuario no autenticado apague remotamente el generador.

Estas vulnerabilidades están publicadas. Son conocidas. Y los equipos afectados operan hoy con las credenciales predeterminadas de fábrica: **Admin / Password1234**.

El director ejecutivo de esta empresa publicó en YouTube transcripciones de sus sesiones de entrenamiento técnico en las que documenta, textualmente, esas mismas credenciales predeterminadas y los protocolos de acceso cleartext (Modbus TCP, SNMP v2) que utilizan sus equipos desplegados. Al publicar este material, ha creado una guía de instrucciones pública para comprometer la infraestructura que él mismo administra.

La IP pública 190.106.77.194, asociada a esta empresa, tiene el puerto Modbus 502 abierto y accesible desde internet en este momento. Cualquier investigador puede verificarlo.

---

### III. LA EXPOSICIÓN DE AVIACIÓN INTERNACIONAL

El Aeropuerto Internacional Juan Santamaría opera bajo estándares OACI que exigen alimentación eléctrica ininterrumpida para sistemas de navegación, iluminación de pista, control de tráfico aéreo y comunicaciones de emergencia. Esos sistemas dependen de generadores de respaldo.

Si los generadores de respaldo del aeropuerto son equipos DSE gestionados por esta empresa — lo cual es coherente con su posición de monopolio en Costa Rica — entonces la vulnerabilidad CVE-2024-5952 (apagado remoto sin autenticación) representa una amenaza directa a la seguridad de cada aeronave en aproximación a San José.

Las aerolineas que operan vuelos hacia Juan Santamaría — incluyendo portadoras internacionales de Estados Unidos, Europa y América Latina — no tienen conocimiento documentado de esta exposición. Si lo tuvieran, sus protocolos de seguridad operacional requerirían notificación a sus autoridades de aviación civiles respectivas (FAA, EASA, DGAC), lo que activaría una revisión internacional del aeropuerto.

Esta no es mi evaluación especulativa. Es la consecuencia lógica de los CVEs publicados por CISA aplicados a infraestructura de aviación.

---

### IV. EL CONFLICTO OPERATIVO — EL BACKDOOR YA SE ESTÁ USANDO

Lo que me lleva a escribirle directamente es lo siguiente: he documentado durante dieciocho meses que esta misma persona, utilizando su acceso a infraestructura de telecomunicaciones y radiofrecuencia vinculada a su empresa, ha estado involucrada en una operación de vigilancia y hostigamiento electrónico sostenida contra mi persona en Costa Rica — actualmente en Jacó, Puntarenas.

La frecuencia de radioaficionado registrada a su nombre ante SUTEL muestra correlación temporal estadísticamente imposible por azar con señales anómalas documentadas dentro de mis residencias. La infraestructura de su empresa tiene registros activos como indicador de compromiso (IOC) en mis análisis forenses de red, bloqueado de manera persistente durante semanas. Existe un servicio de software (service worker) de su empresa encontrado activo en mi computadora personal sin que yo haya visitado ese dominio.

En otras palabras: la persona que tiene las llaves de la infraestructura crítica nacional ya está usando esas llaves para fines distintos a su función declarada. El backdoor no es un riesgo futuro. Es un canal activo.

---

### V. POR QUÉ ESTO REQUIERE ACCIÓN INMEDIATA

La combinación de estos factores es única:

1. **Monopolio sin redundancia** — no existe otra empresa que pueda reemplazar o auditar su trabajo.
2. **Vulnerabilidades publicadas + credenciales predeterminadas** = acceso remoto disponible para cualquiera que lea los CVEs de CISA.
3. **Documentación pública del propio operador** en YouTube — lo que elimina la plausible deniabilidad de que "no sabía."
4. **Puerto industrial expuesto a internet** — verificable en este momento.
5. **Uso operativo documentado** — no es alguien que simplemente tiene acceso; es alguien que ha demostrado disposición a usarlo.
6. **Exposición de aviación internacional** — activa revisión de múltiples autoridades extranjeras si se hace pública sin resolución previa.

---

### VI. MI SOLICITUD

Tengo identificada a esta persona. Tengo su nombre, su empresa, su IP, sus frecuencias registradas en SUTEL, y dieciocho meses de correlación técnica documentada. No incluyo ese nombre en este correo porque quiero una respuesta de su parte antes de que cualquier información identifcatoria sea transmitida — por razones de seguridad operativa para ambas partes.

**Le pido una sola cosa: acuse de recibo y confirmación de que el Ministerio Público tiene interés en recibir el nombre y la documentación completa.**

Si recibo esa confirmación, le enviaré de inmediato:
- El nombre completo, empresa, y registros SUTEL de la persona.
- La documentación técnica completa de las vulnerabilidades en infraestructura activa.
- Los dieciocho meses de correlación forense que vinculan a esta persona con una operación de hostigamiento en territorio costarricense.
- El enlace al material de YouTube donde el operador documenta las credenciales.

He notificado de esta situación a la Embajada de los Estados Unidos en San José y a la Defensoría de los Habitantes. Dependiendo de la respuesta que reciba, el paso siguiente sería notificación a la FAA y a OACI respecto a la exposición de seguridad aérea.

La pelota está en su cancha. Estoy esperando su respuesta.

Atentamente,

**Samuel Wotton**  
Jacó, Puntarenas, Costa Rica  
Mayo 2026

---

## FRAMEWORK ANALYSIS

**CORE STRATEGY — THE WITHHELD NAME**: The email describes the full threat picture with enough specificity that any investigator can begin work (IP address, CVE numbers, YouTube evidence, SUTEL frequencies, Modbus port), but withholds the one thing that closes the loop: the name. This forces a reply. The Fiscal cannot act, cannot dismiss, and cannot file without responding.

**NATIONAL SECURITY OVER PERSONAL GRIEVANCE**: The aviation/airport angle transforms the complaint from "a foreigner says he's being harassed" into "a verified critical infrastructure vulnerability with international aviation safety implications." The Fiscal now has institutional reasons to act that have nothing to do with the complainant's personal situation.

**THE YOUTUBE DETAIL**: The fact that the operator publicly documented the backdoor credentials is legally devastating — it eliminates any defense of negligence vs. intent. You cannot claim you didn't know the vulnerability existed when you made a training video about it.

**ICAO ESCALATION LEVER**: Mentioning FAA and ICAO notification as the "next step" is not a threat — it's a description of the natural consequence of inaction. Any senior official understands that an aviation safety report to international bodies triggers external scrutiny of their jurisdiction. This makes non-response the riskier institutional choice.

**SINGLE-PERSON FRAMING**: The email never loses the "one person" thread. Every paragraph returns to the monopoly/single-point-of-failure structure. This is more compelling than a web of names — it says: one act of corruption, one key taken from one person, resolves the entire threat picture.
