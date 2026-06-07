// Lawyer outreach — CL-273123 BLE surveillance platform / Jacó Beach incident
// From: Samuel Wotton <hello@echokappa.com>
// Tone: first contact inquiry — brief, professional, asking if they can advise

export interface LawyerContact {
  id: number;
  to: string;
  name: string;
  org: string;
  tier: string;
  subject: string;
  body: string;
}

export const LAWYER_CONTACTS: LawyerContact[] = [
  {
    id: 2001,
    to: "mparis@ecija.com",
    name: "Mauricio París",
    org: "ECIJA Legal Costa Rica",
    tier: "1",
    subject: "Inquiry — Ley 10.487 matter, documented electronic surveillance by vehicle-mounted BLE platform, Jacó Beach",
    body: `Dear Mr. París,

My name is Samuel Wotton. I am a British-Canadian national living in Jacó Beach, Puntarenas. I am writing to ask whether ECIJA Legal can advise me on a matter involving what I believe constitutes ongoing electronic harassment and surveillance under Ley 10.487.

THE CORE SITUATION

For the past 18 months I have been subjected to persistent and coordinated harassment in Jacó. On June 6–7, 2026 I was able to document a specific surveillance instrument in detail.

A 1997 Toyota Tacoma, plate CL-273123, registered to Esteban Hernández Fernández (cédula 1-0908-0533), was parked outside my accommodation on multiple occasions. The vehicle carries an active court seizure (embargo ejecutado) from 2016.

Inside the vehicle I identified a Bluetooth device named bdb-PKE-79E9, manufactured by MISHIK Pte Ltd (Bluetooth SIG company 0x0166, now rebranded PROX SG Pte. Ltd., Singapore, UEN 200917259N) — an OEM security hardware manufacturer. The device declares itself as a Human Interface Device (HID), which is the Bluetooth profile used for keyboards and mice that enables input event injection into paired host devices.

I documented:
— Two separate RSSI spikes from −95 dBm ambient baseline to −20 dBm peak (a 75 dB delta) consistent with the vehicle positioning to within 1–2 metres of my receiver
— Directional wall tests confirming the RF source is exterior and vehicle-mounted, not inside the building
— An associate of the operator admitting the truck uses Android Auto, which when paired with a target's phone grants access to contacts, call logs, SMS, and navigation data

I also have an audio recording made this morning (Recording 37, June 7, 2026, 9:30 AM) in which spectral analysis shows elevated high-frequency content (−14.7 dB peak at 6 kHz above a rain ambient baseline) correlating with the period the vehicle was in position.

The vehicle operator is known to me by name and is connected to a broader network of individuals I have documented in connection with this harassment.

WHY I AM CONTACTING YOU

I am not seeking criminal prosecution at this stage — I want to understand my options and whether this pattern of documented behaviour constitutes a Ley 10.487 or Ley 8968 matter that you could advise on. I have a substantial evidence chain (RSSI data, scanner captures, vehicle registry records, audio, the Registro Nacional vehicle certificate, and prior incident documentation).

Could you let me know whether this falls within your practice area and whether an initial consultation would be possible?

I am based in Jacó but can travel to San José or conduct a call at your convenience.

Thank you for your time.

Sincerely,
Samuel Wotton
Jacó Beach, Puntarenas, Costa Rica
hello@echokappa.com
+506 6377-3099`,
  },
  {
    id: 2002,
    to: "mdr@aguilarcastillolove.com",
    name: "Mary Ann Drake",
    org: "Aguilar Castillo Love",
    tier: "1",
    subject: "Inquiry — modified BLE surveillance hardware, mobile platform, Jacó Beach",
    body: `Dear Ms. Drake,

My name is Samuel Wotton, a British-Canadian national living in Jacó Beach, Puntarenas. I am writing because I believe you or your firm may have handled matters involving telecommunications hardware modification and packet-sniffing, and I have a documented case that may fall within that area.

THE DEVICE

A vehicle — plate CL-273123, a 1997 Toyota Tacoma registered to Esteban Hernández Fernández, cédula 1-0908-0533 — has been parked outside my accommodation on multiple occasions. Inside the vehicle I identified a Bluetooth device designated bdb-PKE-79E9, manufactured by MISHIK Pte Ltd (Bluetooth SIG company 0x0166), a Singapore-based OEM security hardware manufacturer (since rebranded PROX SG Pte. Ltd., UEN 200917259N).

The device is not a standard passive keyless entry module. It advertises as a Human Interface Device (HID) — the Bluetooth profile used for keyboards and mice — which allows a paired device to receive injected input events. An associate of the operator admitted the system incorporates a modified single-board computer (Raspberry Pi type) and connects to the truck's Android Auto head unit.

The combination creates a two-vector access capability:
— BLE proximity tracking and potential keystroke/event injection via the MISHIK HID device
— Android Auto pairing for contact list, call log, SMS, and navigation data access from a target's Android phone

I have scanner captures showing the device ID and manufacturer data, RSSI evidence of approach events and directional source confirmation, audio recordings with measurable high-frequency content, and the official Registro Nacional vehicle certificate.

MY QUESTION

I am not pursuing criminal action at this stage. I want to understand whether the operation of a modified BLE platform of this nature constitutes a telecommunications offence, and what options I might have for stopping it. Could you advise whether this is a matter your firm handles, and whether a consultation would be possible?

I am in Jacó but available by phone or email. Thank you.

Sincerely,
Samuel Wotton
Jacó Beach, Puntarenas, Costa Rica
hello@echokappa.com
+506 6377-3099`,
  },
  {
    id: 2003,
    to: "info@aralaw.cr",
    name: "Alejandro Rodríguez Castro",
    org: "ARA-Law Abogados",
    tier: "3",
    subject: "Inquiry — financial fraud matter, Jacó Beach, Costa Rica",
    body: `Dear ARA-Law team,

My name is Samuel Wotton, a British-Canadian national residing in Jacó Beach, Puntarenas. I am writing to inquire whether your firm handles penal complaint filings (denuncias penales) for financial fraud involving SINPE and PayPal transactions.

THE SITUATION

Over the past 18 months I have been subjected to coordinated harassment in Jacó. As part of this situation, two individuals — brothers, both of whom I have identified — have extracted money from me through a pattern of staged financial situations. The funds were transferred via SINPE Móvil and PayPal. The amounts are not enormous individually but the pattern is documented and repeated.

These same individuals are connected to a broader network of people I have documented in connection with the harassment. I have names, cédulas, phone numbers, and bank/payment transfer records for the transactions in question.

I am not seeking civil litigation at this stage — I want to understand whether I can file a penal complaint for the financial fraud component of this situation separately from the harassment matter, and whether your firm would handle that.

Could you let me know if this is something you could advise on?

Thank you for your time.

Sincerely,
Samuel Wotton
Jacó Beach, Puntarenas, Costa Rica
hello@echokappa.com
+506 6377-3099`,
  },
  {
    id: 2004,
    to: "info@lawyersofcostarica.com",
    name: "Christopher Pirie Gil",
    org: "Pirie Legal / CPG Legal",
    tier: "3",
    subject: "Inquiry — civil matter, ongoing documented harassment and surveillance, Jacó Beach",
    body: `Dear Mr. Pirie,

My name is Samuel Wotton. I am a British-Canadian national living in Jacó Beach, Puntarenas, Costa Rica. I am reaching out because I am looking for legal counsel regarding a civil matter arising from 18 months of documented harassment and electronic surveillance targeting me in Jacó.

OVERVIEW

The situation involves a coordinated group of individuals who have maintained a persistent pattern of proximity surveillance, electronic monitoring, and financial extraction directed at me. On June 6–7, 2026 I documented specific surveillance hardware in detail — a modified Bluetooth device (manufactured by a Singapore security hardware OEM) installed in a civilian vehicle, plate CL-273123, that has been parked outside multiple accommodations where I have stayed. I have RSSI signal data, scanner captures, vehicle registry records, audio recordings, and an 18-month incident log.

I have already reached out to specialist counsel regarding the technical (Ley 10.487) and criminal (financial fraud) aspects. I am writing to you to ask about civil options — specifically whether there is a path to civil restitution or a civil injunction that could run alongside any criminal matter.

I understand you work with international clients and have experience navigating Costa Rican civil and common law frameworks.

Could you let me know if this falls within what you handle, and whether a consultation would be possible?

Sincerely,
Samuel Wotton
Jacó Beach, Puntarenas, Costa Rica
hello@echokappa.com
+506 6377-3099`,
  },
];
