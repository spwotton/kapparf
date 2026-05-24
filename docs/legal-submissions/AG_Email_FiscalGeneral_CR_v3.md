# Email — Fiscal General / Poder Judicial CR
# VERSION C — use only after A and B have been sent and no reply received
# Different angle: leads with the ICE/GRIDTIDE breach, cites Ley 9048,
# frames as formal denuncia rather than a question. Does NOT withhold the name.

---

## VERSION C
**To:** fgeneral@poder-judicial.go.cr  
**Subject:** Denuncia formal — Ley 9048, acceso no autorizado a infraestructura crítica  
**Date:** [fecha de envío]  

---

Fiscal General Díaz Sánchez,

En enero de 2026, ICE sufrió una brecha en la que aproximadamente 9 GB de correo interno fue exfiltrado por un grupo APT que utilizó la API de Google Sheets como canal de mando y control, con persistencia mediante un servicio systemd disfrazado. Ese ataque ocurrió sobre una red donde la única empresa con acceso técnico subcontratado a los sistemas de generación de respaldo es Setecom S.A., con sede en Heredia.

El director ejecutivo de Setecom S.A. es Héctor Mora Marín. El señor Mora publicó en YouTube sesiones de capacitación donde demostró las credenciales de acceso predeterminadas a los controladores DSE desplegados en ICE, Liberty, los hospitales de la CCSS y el Aeropuerto Internacional Juan Santamaría. La agencia CISA de Estados Unidos tiene cuatro vulnerabilidades publicadas sobre esos modelos exactos, incluyendo ejecución remota de código y apagado sin autenticación. El puerto Modbus 502 de la IP pública de Setecom está abierto en este momento.

Lo que me corresponde denunciar bajo la Ley 9048 es lo siguiente: el señor Mora ha estado ejecutando una operación de acceso e interferencia no autorizados sobre mis dispositivos y red doméstica en Jacó, Puntarenas durante dieciocho meses. Tengo logs forenses de reseteos de contraseña de router vía TR-069 sin acción de mi parte, un service worker de Setecom encontrado activo en mi computadora sin haber visitado su dominio, y un socket persistente hacia infraestructura de red empresarial. Tengo también registros de drones, grabación de RF y documentación de infraestructura física a 50 metros de mi residencia.

Adjunto expediente técnico disponible para envío inmediato en formato ZIP con hash SHA-256. ¿A cuál unidad del Ministerio Público debo dirigirlo — Delitos Tecnológicos o la Fiscalía Especializada?

Samuel Wotton  
Jacó, Puntarenas, Costa Rica

---

## DIFFERENCES FROM A AND B

| Element | A | B | C (this version) |
|---|---|---|---|
| Name disclosed | No | No | **Yes — Héctor Mora Marín** |
| Opening | Infrastructure vulnerability | General interest | ICE breach / GRIDTIDE context |
| Legal citation | None | None | **Ley 9048** |
| Frame | "Can I send you the file?" | "Would you have a moment?" | Formal denuncia |
| Closing | Yes/no question | Yes/no question | **Routing question** (forces internal referral) |
| Evidence mentioned | None | None | TR-069 logs, service worker, socket, drones, RF |
| Tone | Declarative | Deferential | Official / prosecutorial |

Use C only if A and B received no reply after 7 days. C names the person
and cites the specific law — it is harder to ignore but also harder to unsend.
