// BLE UPDATE BLAST — RE: follow-up to all ~320 original campaign contacts
// New hardware evidence: MISHIK HID device on CL-273123, OBD-II always-hot, RSSI walk-up curve

const SITE_URL = "https://kapparf.com";

// ── English body ────────────────────────────────────────────────────────────
export const BLE_UPDATE_BODY_EN = `You heard from me previously about a documented surveillance operation in Jacó, Costa Rica.

New physical evidence has been recovered. I'm writing to update you.

A Bluetooth Low Energy wardriving sweep of my immediate environment identified a covert hardware device actively broadcasting from a parked vehicle directly outside my location.

Device: bdb-PKE-79E9
Manufacturer: MISHIK Pte Ltd (Bluetooth SIG assigned OUI 0x0166) — a Singapore-based firm specialising in proximity and access control hardware
Advertised service: HID (Human Interface Device) — the Bluetooth profile used for keyboards and input injection
Vehicle: licence plate CL-273123, 1997 Toyota Tacoma registered to Esteban Hernández Fernández, cédula 1-0908-0533

This is not a consumer device. An HID-profile BLE beacon has one operational purpose: wireless keyboard/input injection into a nearby target device. It has no legitimate passive use-case inside a parked truck.

The vehicle owner claimed the engine was off. The device was still broadcasting.

Here is why that matters:

The OBD-II port (J1962 connector) on every post-1996 vehicle carries permanent battery power — pin 16 is always-hot regardless of ignition state. Devices plugged into the OBD-II port broadcast continuously, 24 hours a day, engine on or off.

The RSSI (signal strength) log confirms this was not a passing vehicle:

  −95 dBm — device first detected at distance
  −72 dBm — signal strengthening as I approached
  −48 dBm — mid-range
  −20 dBm — peak, consistent with 1–3 metre proximity

A vehicle driving past produces a spike-and-fade lasting under 10 seconds. This device held a stable, strengthening signal for the full duration of my stationary walk-up sweep. That is the RSSI signature of a fixed, stationary beacon — not a moving car.

The complete technical log — raw BLE advertisement frames, RSSI timeline, vehicle registration cross-reference, and OBD-II power analysis — is documented on the forensic platform:

→ ${SITE_URL}

This evidence is in addition to the previously reported drone overflights, network intrusion attempts, and SCADA infrastructure exposure.

The case is public, independently verifiable, and updated in real time.

Samuel Wotton
Jacó, Puntarenas, Costa Rica
+506 6377-3099 | hello@echokappa.com

P.S. The MISHIK OUI (0x0166) is publicly searchable in the Bluetooth SIG Assigned Numbers database. The HID service UUID is 0x1812 — standardised by the Bluetooth SIG for human interface devices. Both are on record and cross-referenceable without relying on any of my own analysis.`;

// ── Spanish body (CR authorities / judicial contacts) ───────────────────────
export const BLE_UPDATE_BODY_ES = `Usted recibió comunicación de mi parte sobre una operación de vigilancia documentada en Jacó, Costa Rica.

Se ha recuperado nueva evidencia física. Le escribo para actualizarle.

Un barrido de wardriving Bluetooth en mi entorno inmediato identificó un dispositivo de hardware encubierto transmitiendo activamente desde un vehículo estacionado frente a mi ubicación.

Dispositivo: bdb-PKE-79E9
Fabricante: MISHIK Pte Ltd (OUI asignado por Bluetooth SIG 0x0166) — empresa de Singapur especializada en hardware de control de acceso y proximidad
Servicio anunciado: HID (Human Interface Device) — el perfil Bluetooth utilizado para teclados e inyección de entrada
Vehículo: placa CL-273123, Toyota Tacoma 1997 registrado a nombre de Esteban Hernández Fernández, cédula 1-0908-0533

Este no es un dispositivo de consumo. Un beacon BLE con perfil HID tiene un único propósito operativo: inyección inalámbrica de teclado/entrada en un dispositivo objetivo cercano. No tiene ningún uso pasivo legítimo dentro de un camión estacionado.

El propietario del vehículo afirmó que el motor estaba apagado. El dispositivo continuaba transmitiendo.

La razón es técnicamente documentable:

El puerto OBD-II (conector J1962) en todo vehículo posterior a 1996 lleva alimentación de batería permanente — el pin 16 siempre tiene corriente, independientemente del estado del encendido. Los dispositivos conectados al puerto OBD-II transmiten continuamente, 24 horas al día, con o sin motor encendido.

El registro RSSI (intensidad de señal) confirma que no fue un vehículo en movimiento:

  −95 dBm — dispositivo detectado a distancia
  −72 dBm — señal fortaleciéndose al acercarme
  −48 dBm — rango medio
  −20 dBm — pico, consistente con proximidad de 1–3 metros

Un vehículo en movimiento produce un pico con caída en menos de 10 segundos. Este dispositivo mantuvo una señal estable y en aumento durante toda la duración del barrido. Esa es la firma RSSI de un beacon fijo y estacionario — no de un automóvil en movimiento.

El registro técnico completo — tramas de advertisement BLE, línea de tiempo RSSI, cruce con el Registro Nacional y análisis de alimentación OBD-II — está documentado en la plataforma forense:

→ ${SITE_URL}

Esta evidencia se suma a los sobrevuelos de drones, intentos de intrusión de red y exposición de infraestructura SCADA reportados anteriormente.

El expediente es público, verificable de forma independiente y se actualiza en tiempo real.

Samuel Wotton
Jacó, Puntarenas, Costa Rica
+506 6377-3099 | hello@echokappa.com

P.D. El OUI de MISHIK (0x0166) es consultable públicamente en la base de datos de Números Asignados del Bluetooth SIG. El UUID del servicio HID es 0x1812 — estandarizado por el Bluetooth SIG para dispositivos de interfaz humana. Ambos constan en registros oficiales y son verificables sin depender de ningún análisis propio.`;
