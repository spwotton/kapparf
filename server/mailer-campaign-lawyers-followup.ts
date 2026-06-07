// Lawyer follow-up — RE: same subjects, new OBD2 always-hot evidence
// Explains why bdb-PKE-79E9 broadcasts from ignition-off vehicle (kills "passing car" objection)
// From: Samuel Wotton <hello@echokappa.com>

export interface LawyerFollowupContact {
  id: number;
  to: string;
  name: string;
  org: string;
  subject: string;
  body: string;
}

export const LAWYER_FOLLOWUP_CONTACTS: LawyerFollowupContact[] = [
  {
    id: 2101,
    to: "mparis@ecija.com",
    name: "Mauricio París",
    org: "ECIJA Legal Costa Rica",
    subject: "RE: Inquiry — Ley 10.487 matter, documented electronic surveillance by vehicle-mounted BLE platform, Jacó Beach",
    body: `Dear Mr. París,

Following my previous message regarding vehicle CL-273123 and the bdb-PKE-79E9 BLE device, I wanted to add one technical detail that I believe is legally relevant.

In my initial message I noted that the device was transmitting while the truck was parked and unoccupied. A reasonable question would be: how was the device powered with the ignition off?

The answer: the J1962 OBD-II diagnostic port — the 16-pin socket under the dashboard that mechanics use for vehicle diagnostics — carries constant 12V power directly from the battery under all automotive regulations, regardless of whether the ignition is on or off. Any device plugged into the OBD-II port remains fully powered and operational 24 hours a day as long as the vehicle battery holds charge.

This is standard automotive specification. It means:

— The bdb-PKE-79E9 was not dependent on the vehicle being running or occupied to broadcast
— The device was capable of transmitting advertising packets continuously, indefinitely, from a parked vehicle
— The RSSI approach sequence I documented (signal rising from −95 dBm ambient to −20 dBm saturation as I walked toward the vehicle) reflects a stationary, always-on beacon — not a device that happened to be active during a brief window

This removes the most obvious alternative explanation for the signal data: that the device was a passive OBD-II diagnostic dongle that a driver happened to have plugged in while parked nearby. A passive diagnostic dongle would behave exactly this way — but so would a purpose-built surveillance platform using the same always-hot power tap. The distinction lies in the HID service declaration and the −20 dBm saturation level, both of which I have documented.

I wanted to include this before you had a chance to review the initial inquiry, as it directly addresses the powering question.

I remain available for a consultation at your convenience.

Sincerely,
Samuel Wotton
Jacó Beach, Puntarenas, Costa Rica
hello@echokappa.com
+506 6377-3099`,
  },
  {
    id: 2102,
    to: "mdr@aguilarcastillolove.com",
    name: "Mary Ann Drake",
    org: "Aguilar Castillo Love",
    subject: "RE: Inquiry — modified BLE surveillance hardware, mobile platform, Jacó Beach",
    body: `Dear Ms. Drake,

A quick follow-up to my previous message regarding the modified BLE device in vehicle CL-273123.

One technical point I should have included: the device was transmitting while the truck was parked with the ignition off. The reason this is possible — and is standard behaviour for any OBD-II connected device — is that the J1962 OBD-II port carries constant 12V power directly from the battery under all automotive regulations, independent of ignition state. Any device plugged in remains fully powered around the clock.

This is relevant to the legal characterisation for two reasons:

1. It means the platform was designed for persistent, unattended operation — not incidental use while driving. A device powered through the OBD-II tap and left broadcasting while the vehicle is parked is functioning as a fixed surveillance node, not a passive diagnostic tool that happens to emit a Bluetooth signal.

2. The RSSI approach data I documented — signal rising from a −95 dBm ambient floor to −20 dBm saturation (a 75 dB delta) as I walked toward the stationary vehicle — is consistent with a continuously broadcasting, directional beacon mounted inside the vehicle cabin, not with ambient BLE traffic from surrounding devices.

Combined with the HID service declaration (input injection capability), the always-on power architecture points toward a purpose-built platform rather than off-the-shelf hardware.

I thought this worth flagging before your team reviews the initial inquiry.

Sincerely,
Samuel Wotton
Jacó Beach, Puntarenas, Costa Rica
hello@echokappa.com
+506 6377-3099`,
  },
  {
    id: 2103,
    to: "info@aralaw.cr",
    name: "Alejandro Rodríguez Castro",
    org: "ARA-Law Abogados",
    subject: "RE: Inquiry — financial fraud matter, Jacó Beach, Costa Rica",
    body: `Dear ARA-Law team,

A brief follow-up to my earlier message regarding the financial fraud matter.

I wanted to add that in parallel with the fraud documentation, I have now documented specific surveillance hardware being operated from a vehicle registered to an associate of the individuals involved in the financial extraction — a modified Bluetooth platform installed in a Toyota Tacoma, plate CL-273123, registered to Esteban Hernández Fernández (cédula 1-0908-0533).

I mention this because it suggests the financial pattern was supported by active proximity surveillance: the ability to monitor my movements and communications at close range. This may be relevant context if a penal complaint for the fraud also touches on the coercive or coordinated nature of the scheme.

I have signal strength data, device identification, and vehicle registry documentation if that context is useful to your assessment.

The core question in my initial message stands: can your firm advise on filing a penal complaint for the financial fraud component specifically?

Thank you again for your time.

Sincerely,
Samuel Wotton
Jacó Beach, Puntarenas, Costa Rica
hello@echokappa.com
+506 6377-3099`,
  },
  {
    id: 2104,
    to: "info@lawyersofcostarica.com",
    name: "Christopher Pirie Gil",
    org: "Pirie Legal / CPG Legal",
    subject: "RE: Inquiry — civil matter, ongoing documented harassment and surveillance, Jacó Beach",
    body: `Dear Mr. Pirie,

Following my initial message, one additional technical detail relevant to the civil matter.

The Bluetooth surveillance device I documented in vehicle CL-273123 was transmitting while the truck was parked with the ignition off. This is possible because the J1962 OBD-II port — the diagnostic socket under the dashboard — carries constant 12V battery power under all automotive specifications, regardless of ignition state. A device plugged into that port runs continuously, indefinitely.

The practical implication: the platform was not incidentally present during a drive-by. It was deployed as a stationary, always-on surveillance node — parked outside my accommodation and broadcasting around the clock. The RSSI data I collected (signal rising from −95 dBm ambient to −20 dBm saturation as I approached the vehicle on foot) is consistent with exactly this: a fixed, continuously transmitting device positioned deliberately.

For a civil claim, this shifts the characterisation from "a device that happened to be nearby" to "a surveillance instrument that was deliberately positioned and left running." That distinction may be relevant to establishing intent and the sustained nature of the conduct.

I remain available for a consultation. Thank you for your time.

Sincerely,
Samuel Wotton
Jacó Beach, Puntarenas, Costa Rica
hello@echokappa.com
+506 6377-3099`,
  },
];
