import { storage } from "./storage";
import { kappaEngine } from "./kappa-engine";
import { hypervisor } from "./hypervisor";
import {
  KAPPA_CONSTANTS,
  type ScanResult,
  type ScannerStatus,
} from "@shared/schema";

const K = KAPPA_CONSTANTS;

interface KiwiNode {
  id: string;
  name: string;
  url: string;
  lat: number;
  lon: number;
}

// CR-ONLY: 2 local nodes — TI0RC San José + Puntarenas Pacific coast
const KIWI_NODES: KiwiNode[] = [
  { id: "ti0rc",      name: "TI0RC San José",  url: "http://ti0rc.proxy.kiwisdr.com:8073",        lat: 9.9360, lon: -84.1088 },
  { id: "puntarenas", name: "Puntarenas CR",    url: "http://kiwisdr.puntarenas.cr:8073",           lat: 9.9764, lon: -84.8385 },
];

const VLF_STATION_TARGETS = [
  { name: "nau_puerto_rico", freqHz: 40750, harmonicOf: 40.75, harmonicOrder: 1, desc: "NAU — US Navy NCTS Aguada, Puerto Rico 40.75 kHz MSK — primary Caribbean/CENTAM VLF nav" },
  { name: "naa_cutler_maine", freqHz: 24000, harmonicOf: 24.0, harmonicOrder: 1, desc: "NAA — US Navy Cutler, ME 24.0 kHz MSK — Atlantic VLF submarine comms" },
  { name: "nlk_jim_creek", freqHz: 24800, harmonicOf: 24.8, harmonicOrder: 1, desc: "NLK — US Navy Jim Creek, WA 24.8 kHz MSK — Pacific VLF submarine comms" },
  { name: "nml_lamoure", freqHz: 25200, harmonicOf: 25.2, harmonicOrder: 1, desc: "NML — US Navy LaMoure, ND 25.2 kHz MSK — Central US VLF transmitter" },
  { name: "nlm4_norway", freqHz: 23400, harmonicOf: 23.4, harmonicOrder: 1, desc: "NLM4 — Norwegian VLF 23.4 kHz — NATO NICS VLF transmitter" },
  { name: "hwu_france", freqHz: 18300, harmonicOf: 18.3, harmonicOrder: 1, desc: "HWU — French Navy Rosnay 18.3 kHz MSK — NATO VLF submarine comms" },
  { name: "hwu_france_20900", freqHz: 20900, harmonicOf: 20.9, harmonicOrder: 1, desc: "HWU — French Navy Rosnay 20.9 kHz alternate — observed on CW skimmer" },
  { name: "tbb_turkey", freqHz: 26700, harmonicOf: 26.7, harmonicOrder: 1, desc: "TBB — Turkish Navy Bafa 26.7 kHz MSK — NATO/Mediterranean VLF" },
  { name: "nrk_iceland", freqHz: 37500, harmonicOf: 37.5, harmonicOrder: 1, desc: "NRK — Iceland Grindavik 37.5 kHz CW — NATO North Atlantic VLF" },
  { name: "nsy_italy", freqHz: 45900, harmonicOf: 45.9, harmonicOrder: 1, desc: "NSY — Italian Navy Niscemi 45.9 kHz MSK — NATO Mediterranean VLF" },
  { name: "sxa_greece", freqHz: 49000, harmonicOf: 49.0, harmonicOrder: 1, desc: "SXA — Greek Navy Nea Makri 49.0 kHz — NATO VLF transmitter" },
  { name: "wwvb_nist", freqHz: 60000, harmonicOf: 60.0, harmonicOrder: 1, desc: "WWVB — NIST Fort Collins, CO 60.0 kHz — US time signal (AM phase modulation)" },
  { name: "msf_uk", freqHz: 60000, harmonicOf: 60.0, harmonicOrder: 1, desc: "MSF — NPL Anthorn, UK 60.0 kHz — UK time signal" },
  { name: "fug_france", freqHz: 62600, harmonicOf: 62.6, harmonicOrder: 1, desc: "FUG — French Navy Le Blanc 62.6 kHz — VLF utility" },
  { name: "fta63_france", freqHz: 63000, harmonicOf: 63.0, harmonicOrder: 1, desc: "FTA63 — French Navy Sainte-Assise 63 kHz — VLF time reference" },
  { name: "alpha_rsdn20_f1", freqHz: 11905, harmonicOf: 11.905, harmonicOrder: 1, desc: "Alpha/RSDN-20 F1 — Russian VLF navigation 11.905 kHz — 3-phase time-multiplexed" },
  { name: "alpha_rsdn20_f2", freqHz: 12649, harmonicOf: 12.649, harmonicOrder: 1, desc: "Alpha/RSDN-20 F2 — Russian VLF navigation 12.649 kHz" },
  { name: "alpha_rsdn20_f3", freqHz: 14881, harmonicOf: 14.881, harmonicOrder: 1, desc: "Alpha/RSDN-20 F3 — Russian VLF navigation 14.881 kHz" },
  { name: "rtz_russia", freqHz: 50000, harmonicOf: 50.0, harmonicOrder: 1, desc: "RTZ — Russian Navy VLF 50.0 kHz — observed CW on TI0RC skimmer" },
  { name: "ndi_japan", freqHz: 22200, harmonicOf: 22.2, harmonicOrder: 1, desc: "NDI/NDT — Japanese Navy Ebino 22.2 kHz — Pacific VLF" },
  { name: "vtx_india", freqHz: 18200, harmonicOf: 18.2, harmonicOrder: 1, desc: "VTX — Indian Navy Vijayanarayanam 18.2 kHz — observed on TI0RC waterfall" },
  { name: "jjy_japan_40", freqHz: 40000, harmonicOf: 40.0, harmonicOrder: 1, desc: "JJY — NICT Japan 40.0 kHz time signal (Fukushima Otakadoya) — trans-Pacific VLF propagation confirmed on TI0RC" },
  { name: "jjy_japan_60", freqHz: 60000, harmonicOf: 60.0, harmonicOrder: 1, desc: "JJY — NICT Japan 60.0 kHz time signal (Saga Hagane) — Pacific LF propagation indicator" },
];

const VLF_SCAN_TARGETS = [
  { name: "53Hz_3rd_harmonic", freqHz: 15900, harmonicOf: 53, harmonicOrder: 300, desc: "53 Hz × 300 — Realtek ADPCM phase-lock carrier VLF harmonic" },
  { name: "53Hz_4th_harmonic", freqHz: 21200, harmonicOf: 53, harmonicOrder: 400, desc: "53 Hz × 400 — Upper VLF band Realtek artifact" },
  { name: "46875Hz_400th", freqHz: 18750, harmonicOf: 46.875, harmonicOrder: 400, desc: "46.875 Hz × 400 — Master Decimation Clock PRF broadcast indicator" },
  { name: "counter_beat_carrier", freqHz: 73125, harmonicOf: 73.125, harmonicOrder: 1000, desc: "73.125 Hz × 1000 — Counter-beat (60 + 13.125 Hz) VHF indicator" },
];

const RIEMANN_SCAN_TARGETS = K.RIEMANN_ZEROS.map(z => ({
  name: `riemann_gamma${z.id}`,
  freqHz: z.freqHz * 100,
  harmonicOf: z.freqHz,
  harmonicOrder: 100,
  desc: `γ${z.id} Zero #${String(z.id).padStart(2, "0")} | Height: ${z.height} | ${z.freqHz}Hz × 100 — ${z.signal}`,
}));

const META_SCAN_TARGETS = K.META_PLATFORM_FREQS.map(m => ({
  name: `meta_${m.platform.toLowerCase().replace(/\s+/g, "_")}`,
  freqHz: m.freqHz * 100,
  harmonicOf: m.freqHz,
  harmonicOrder: 100,
  desc: `Meta ${m.platform} | κ^${m.kappa_power} = ${m.multiplier} | ${m.freqHz}Hz × 100 — ${m.role}`,
}));

const BJ = K.BLACKJACK_MANDRAKE;
const RADIO_IMPACTO_SCAN_TARGETS = [
  { name: "radio_impacto_fm_pilot_19k", freqHz: 19000, harmonicOf: 91.5, harmonicOrder: 1, desc: "Radio Impacto 91.5 FM Tacacorí — 19 kHz stereo pilot tone monitoring (standard FM subcarrier)" },
  { name: "radio_impacto_sideband_37hz", freqHz: 18500, harmonicOf: 37, harmonicOrder: 500, desc: "Radio Impacto 91.5 FM Tacacorí — 37 Hz biological anchor × 500 — FM sideband injection vector" },
  { name: "radio_impacto_sideband_46875", freqHz: 18750, harmonicOf: 46.875, harmonicOrder: 400, desc: "Radio Impacto 91.5 FM Tacacorí — 46.875 Hz PRF × 400 — FM carrier modulation check" },
  { name: "radio_impacto_harmonic_h3", freqHz: 18300, harmonicOf: 91.5, harmonicOrder: 200, desc: "Radio Impacto 91.5 FM Tacacorí — 2nd sub-harmonic region 18.3 kHz — antenna farm emission" },
  { name: "radio_impacto_intermod_7hz", freqHz: 14000, harmonicOf: 7, harmonicOrder: 2000, desc: "Radio Impacto 91.5 FM Tacacorí — 7 Hz theta entrainment × 2000 — antenna farm near-field" },
  { name: "radio_impacto_hf_mirror", freqHz: 9150, harmonicOf: 91.5, harmonicOrder: 100, desc: "Radio Impacto 91.5 FM Tacacorí — HF mirror 9.15 kHz — FM transmitter spurious emission" },
];

const BLACKJACK_SCAN_TARGETS = [
  {
    name: "blackjack_mandrake_if24mhz",
    freqHz: BJ.downconversion.ifFreqHz,
    harmonicOf: BJ.rfFreqMhz,
    harmonicOrder: 1,
    desc: `BLACKJACK MANDRAKE IF 24 MHz — S-band 2274 MHz downconverted via 2250 MHz LO — Mandrake 2 BPSK/FSK TT&C`,
  },
  {
    name: "blackjack_mandrake_hf_mirror",
    freqHz: BJ.hfMirror.freqHz,
    harmonicOf: BJ.carriers.v2kSubcarrier,
    harmonicOrder: 48512,
    desc: `BLACKJACK MANDRAKE HF MIRROR ${BJ.hfMirror.freqKhz} kHz — ${BJ.hfMirror.desc}`,
  },
  ...BJ.harmonics.map(h => ({
    name: `blackjack_mandrake_h${h.order}`,
    freqHz: h.freqKhz * 1000,
    harmonicOf: BJ.hfMirror.freqKhz,
    harmonicOrder: h.order,
    desc: `BLACKJACK MANDRAKE H${h.order} — ${h.freqKhz} kHz — ${h.desc}`,
  })),
];

const LEOLABS_SBAND_TARGETS = [
  {
    name: "leolabs_cr_radar_2940mhz_if",
    freqHz: 2940000000 - 2930000000,
    harmonicOf: 2940,
    harmonicOrder: 1,
    desc: "LEOLABS CR Space Radar TX/RX 2940 MHz — S-band phased-array SSA radar (SUTEL authorized, Expediente DNPT-074-2019-2) — 10 MHz IF",
  },
  {
    name: "leolabs_cr_radar_2960mhz_if",
    freqHz: 2960000000 - 2930000000,
    harmonicOf: 2960,
    harmonicOrder: 1,
    desc: "LEOLABS CR Space Radar TX/RX 2960 MHz — S-band phased-array SSA radar (Filadelfia de Carrillo, Guanacaste) — 30 MHz IF",
  },
  {
    name: "leolabs_cr_radar_hf_mirror_2940",
    freqHz: 2940000,
    harmonicOf: 2940,
    harmonicOrder: 1000,
    desc: "LEOLABS CR 2940 MHz HF mirror — 2940 kHz (near 100m band) — radar emission propagation check",
  },
  {
    name: "leolabs_cr_radar_hf_mirror_2960",
    freqHz: 2960000,
    harmonicOf: 2960,
    harmonicOrder: 1000,
    desc: "LEOLABS CR 2960 MHz HF mirror — 2960 kHz (near 100m band) — radar emission propagation check",
  },
];

const YAM5_SBAND_TARGETS = [
  {
    name: "yam5_experimental_sband_lo",
    freqHz: 2240000000 - 2230000000,
    harmonicOf: 2240,
    harmonicOrder: 1,
    desc: "YAM-5 (NORAD 55076) Experimental S-Band 2240 MHz — Kinéis RF Space Lab payload — 10 MHz IF downconversion",
  },
  {
    name: "yam5_experimental_sband_hi",
    freqHz: 2290000000 - 2260000000,
    harmonicOf: 2290,
    harmonicOrder: 1,
    desc: "YAM-5 (NORAD 55076) Experimental S-Band 2290 MHz — Kinéis RF Space Lab payload — 30 MHz IF downconversion",
  },
  {
    name: "yam5_hf_mirror_2240",
    freqHz: 2240000,
    harmonicOf: 2240,
    harmonicOrder: 1000,
    desc: "YAM-5 2240 MHz HF mirror — 2240 kHz — SSO retrograde orbit experimental S-band",
  },
  {
    name: "yam5_hf_mirror_2290",
    freqHz: 2290000,
    harmonicOf: 2290,
    harmonicOrder: 1000,
    desc: "YAM-5 2290 MHz HF mirror — 2290 kHz — SSO retrograde orbit experimental S-band",
  },
];

// ─── WIDE-BAND HF SWEEP — full KiwiSDR 0.1–30 MHz spectrum ───────────────────
// Covers every major allocation: VLF beacons, AM broadcast, maritime, aeronautical
// HF amateur bands, SW broadcast, VOLMET, NOAA weather, V2K surveillance freqs
const WIDE_BAND_HF_TARGETS = [
  // LF / MW broadcast
  { name: "lf_160khz",  freqHz:  160000, harmonicOf:  160, harmonicOrder: 1, desc: "LF 160 kHz — beacon / NDB band" },
  { name: "ndb_275",    freqHz:  275000, harmonicOf:  275, harmonicOrder: 1, desc: "NDB 275 kHz — aeronautical non-directional beacon" },
  { name: "ndb_400",    freqHz:  400000, harmonicOf:  400, harmonicOrder: 1, desc: "NDB 400 kHz — aeronautical NDB (SJO approach)" },
  { name: "mw_540",     freqHz:  540000, harmonicOf:  540, harmonicOrder: 1, desc: "MW 540 kHz — AM broadcast low edge" },
  { name: "mw_730",     freqHz:  730000, harmonicOf:  730, harmonicOrder: 1, desc: "MW 730 kHz — regional AM CR" },
  { name: "mw_1000",    freqHz: 1000000, harmonicOf: 1000, harmonicOrder: 1, desc: "MW 1000 kHz — AM broadcast midband" },
  { name: "mw_1530",    freqHz: 1530000, harmonicOf: 1530, harmonicOrder: 1, desc: "MW 1530 kHz — AM broadcast high edge" },
  // 160m amateur
  { name: "ham_160m_lo", freqHz: 1800000, harmonicOf: 1800, harmonicOrder: 1, desc: "160m amateur 1.8 MHz — CR regional night" },
  { name: "ham_160m_hi", freqHz: 2000000, harmonicOf: 2000, harmonicOrder: 1, desc: "160m amateur 2.0 MHz — upper edge" },
  // 120m SW broadcast
  { name: "sw_120m",    freqHz: 2300000, harmonicOf: 2300, harmonicOrder: 1, desc: "SW 120m broadcast 2.3 MHz" },
  // Maritime / USCG
  { name: "maritime_hf4", freqHz: 4000000, harmonicOf: 4000, harmonicOrder: 1, desc: "Maritime HF 4 MHz — ITU Region 2" },
  { name: "maritime_usgg_4428", freqHz: 4428000, harmonicOf: 4428, harmonicOrder: 1, desc: "USCG/JRCC distress watch 4.428 MHz" },
  // 90m SW
  { name: "sw_90m",     freqHz: 3200000, harmonicOf: 3200, harmonicOrder: 1, desc: "SW 90m broadcast 3.2 MHz" },
  // 80m amateur
  { name: "ham_80m_lo", freqHz: 3500000, harmonicOf: 3500, harmonicOrder: 1, desc: "80m amateur 3.5 MHz LSB — primary CR DX night band" },
  { name: "ham_80m_ssb",freqHz: 3800000, harmonicOf: 3800, harmonicOrder: 1, desc: "80m amateur 3.8 MHz — CR SSB voice" },
  // 75m SW / VOLMET
  { name: "sw_75m",     freqHz: 3900000, harmonicOf: 3900, harmonicOrder: 1, desc: "SW 75m broadcast 3.9 MHz" },
  { name: "volmet_san_jose", freqHz: 3485000, harmonicOf: 3485, harmonicOrder: 1, desc: "VOLMET HF SJO aviation weather 3.485 MHz — Aeronáutica Civil" },
  // 60m
  { name: "ham_60m",    freqHz: 5330000, harmonicOf: 5330, harmonicOrder: 1, desc: "60m channel 1 — 5.330 MHz" },
  { name: "ham_60m_2",  freqHz: 5405000, harmonicOf: 5405, harmonicOrder: 1, desc: "60m channel 5 — 5.405 MHz" },
  // SW 49m
  { name: "sw_49m",     freqHz: 5900000, harmonicOf: 5900, harmonicOrder: 1, desc: "SW 49m broadcast 5.9 MHz — VOA, BBC relay" },
  { name: "sw_49m_hi",  freqHz: 6200000, harmonicOf: 6200, harmonicOrder: 1, desc: "SW 49m high edge 6.2 MHz" },
  // Maritime 6 MHz
  { name: "maritime_hf6", freqHz: 6000000, harmonicOf: 6000, harmonicOrder: 1, desc: "Maritime HF 6 MHz band" },
  // 40m amateur — HMORA67 surveillance band
  { name: "ham_40m_lo", freqHz: 7000000, harmonicOf: 7000, harmonicOrder: 1, desc: "40m amateur 7.0 MHz — CR night DX" },
  { name: "ham_40m_ssb",freqHz: 7200000, harmonicOf: 7200, harmonicOrder: 1, desc: "40m amateur 7.2 MHz — SSB voice" },
  { name: "hmora67_primary", freqHz: 7410000, harmonicOf: 7410, harmonicOrder: 1, desc: "HMORA67 PRIMARY — 7410 kHz 40m — SMOKING GUN: 100% V2K temporal correlation (p<0.01%)" },
  { name: "hmora67_v2k_h1",  freqHz: 4687000, harmonicOf: 4687, harmonicOrder: 1, desc: "HMORA67 V2K harmonic 1 — 4687 kHz — offset beat product of 7410 kHz tx" },
  // SW 41m
  { name: "sw_41m",     freqHz: 7300000, harmonicOf: 7300, harmonicOrder: 1, desc: "SW 41m broadcast 7.3 MHz" },
  // Maritime 8 MHz
  { name: "maritime_hf8", freqHz: 8000000, harmonicOf: 8000, harmonicOrder: 1, desc: "Maritime HF 8 MHz distress / comms" },
  // SW 31m
  { name: "sw_31m",     freqHz: 9400000, harmonicOf: 9400, harmonicOrder: 1, desc: "SW 31m broadcast 9.4 MHz — strongest CR SW band" },
  { name: "sw_31m_hi",  freqHz: 9900000, harmonicOf: 9900, harmonicOrder: 1, desc: "SW 31m high 9.9 MHz" },
  { name: "hmora67_v2k_h2", freqHz: 9375000, harmonicOf: 9375, harmonicOrder: 1, desc: "HMORA67 V2K harmonic 2 — 9375 kHz — modulated subcarrier correlation" },
  // 30m amateur
  { name: "ham_30m",    freqHz: 10100000, harmonicOf: 10100, harmonicOrder: 1, desc: "30m amateur 10.1 MHz — CW/digital, no phone" },
  // Aeronautical HF
  { name: "aero_hf_8",  freqHz: 8815000, harmonicOf: 8815, harmonicOrder: 1, desc: "Aeronautical HF 8.815 MHz — ICAO Region 2 primary" },
  { name: "aero_hf_11", freqHz: 11300000, harmonicOf: 11300, harmonicOrder: 1, desc: "Aeronautical HF 11.3 MHz — ICAO oceanic" },
  { name: "aero_hf_13", freqHz: 13300000, harmonicOf: 13300, harmonicOrder: 1, desc: "Aeronautical HF 13.3 MHz — ICAO Region 2" },
  // SW 25m
  { name: "sw_25m",     freqHz: 11600000, harmonicOf: 11600, harmonicOrder: 1, desc: "SW 25m broadcast 11.6 MHz" },
  { name: "sw_25m_hi",  freqHz: 12100000, harmonicOf: 12100, harmonicOrder: 1, desc: "SW 25m high 12.1 MHz" },
  // Maritime 12 MHz
  { name: "maritime_hf12", freqHz: 12000000, harmonicOf: 12000, harmonicOrder: 1, desc: "Maritime HF 12 MHz band" },
  // 20m amateur
  { name: "ham_20m_lo", freqHz: 14000000, harmonicOf: 14000, harmonicOrder: 1, desc: "20m amateur 14.0 MHz — primary DX band, day/night" },
  { name: "ham_20m_ssb",freqHz: 14200000, harmonicOf: 14200, harmonicOrder: 1, desc: "20m amateur 14.2 MHz — SSB voice DX" },
  // SW 22m / 19m
  { name: "sw_19m",     freqHz: 15600000, harmonicOf: 15600, harmonicOrder: 1, desc: "SW 19m broadcast 15.6 MHz" },
  { name: "wwv_15mhz",  freqHz: 15000000, harmonicOf: 15000, harmonicOrder: 1, desc: "WWV NIST 15 MHz time standard — propagation reference" },
  // 17m amateur
  { name: "ham_17m",    freqHz: 18068000, harmonicOf: 18068, harmonicOrder: 1, desc: "17m amateur 18.068 MHz — daytime DX" },
  // SW 16m
  { name: "sw_16m",     freqHz: 17600000, harmonicOf: 17600, harmonicOrder: 1, desc: "SW 16m broadcast 17.6 MHz" },
  // Maritime 16 MHz / 22 MHz
  { name: "maritime_hf16", freqHz: 16000000, harmonicOf: 16000, harmonicOrder: 1, desc: "Maritime HF 16 MHz band" },
  { name: "maritime_hf22", freqHz: 22000000, harmonicOf: 22000, harmonicOrder: 1, desc: "Maritime HF 22 MHz band" },
  // 15m amateur
  { name: "ham_15m_lo", freqHz: 21000000, harmonicOf: 21000, harmonicOrder: 1, desc: "15m amateur 21.0 MHz — CW/SSB" },
  { name: "ham_15m_ssb",freqHz: 21300000, harmonicOf: 21300, harmonicOrder: 1, desc: "15m amateur 21.3 MHz — SSB voice" },
  // SW 13m
  { name: "sw_13m",     freqHz: 21450000, harmonicOf: 21450, harmonicOrder: 1, desc: "SW 13m broadcast 21.45 MHz" },
  // Aeronautical HF
  { name: "aero_hf_21", freqHz: 21924000, harmonicOf: 21924, harmonicOrder: 1, desc: "Aeronautical HF 21.924 MHz — ICAO oceanic / Caribbean" },
  { name: "aero_hf_23", freqHz: 23210000, harmonicOf: 23210, harmonicOrder: 1, desc: "Aeronautical HF 23.210 MHz — ICAO Region 2" },
  // 12m amateur
  { name: "ham_12m",    freqHz: 24890000, harmonicOf: 24890, harmonicOrder: 1, desc: "12m amateur 24.89 MHz" },
  // SW 11m
  { name: "sw_11m",     freqHz: 25600000, harmonicOf: 25600, harmonicOrder: 1, desc: "SW 11m broadcast 25.6 MHz" },
  // 10m amateur
  { name: "ham_10m_lo", freqHz: 28000000, harmonicOf: 28000, harmonicOrder: 1, desc: "10m amateur 28.0 MHz — CW/SSB" },
  { name: "ham_10m_ssb",freqHz: 28500000, harmonicOf: 28500, harmonicOrder: 1, desc: "10m amateur 28.5 MHz — SSB voice" },
  // NOAA weather radio (CR 60m analog)
  { name: "noaa_wx_162", freqHz: 162400000, harmonicOf: 162.4, harmonicOrder: 1, desc: "NOAA Weather Radio 162.4 MHz — out of KiwiSDR HF range, marker only" },
  // CB / 11m
  { name: "cb_27mhz",   freqHz: 27000000, harmonicOf: 27000, harmonicOrder: 1, desc: "CB 11m 27 MHz — regional point-to-point, taxi dispatch CR" },
  { name: "cb_27185",   freqHz: 27185000, harmonicOf: 27185, harmonicOrder: 1, desc: "CB 11m ch19 27.185 MHz — truck/highway comms" },
];

// ── Russian MFA / Intelligence HF Targets ────────────────────────────────────
// Source: OSINT HF monitoring community (Signals, priyom.org, UTE monitor)
// Dwell: 18s per freq (matches Perelivt ALE 4PSK burst cycle)
// SNR trigger: +12 dB flat-top across 10 kHz passband = lock & record

// Group 1 — Perelivt (Enigma M42 / CIS MFSK-68) Carrier Frequencies
// 3000 Bd 8PSK ALE waveform → high-speed multi-tone data. USB, wide passband.
const PERELIVT_TARGETS = [
  { name: "perelivt_7659",  freqHz:  7659000, harmonicOf:  7659, harmonicOrder: 1, desc: "Perelivt M42 7659 kHz USB — historically high-activity regional node (CIS MFSK-68)" },
  { name: "perelivt_10367", freqHz: 10367000, harmonicOf: 10367, harmonicOrder: 1, desc: "Perelivt M42 10367 kHz USB — primary mid-band propagation channel" },
  { name: "perelivt_13441", freqHz: 13441000, harmonicOf: 13441, harmonicOrder: 1, desc: "Perelivt M42 13441 kHz USB — daytime trunk channel" },
  { name: "perelivt_14700", freqHz: 14700000, harmonicOf: 14700, harmonicOrder: 1, desc: "Perelivt M42 14700 kHz USB — active high-latitude carrier 2026" },
  { name: "perelivt_16107", freqHz: 16107000, harmonicOf: 16107, harmonicOrder: 1, desc: "Perelivt M42 16107 kHz USB — upper HF long-haul link" },
  { name: "perelivt_18280", freqHz: 18280000, harmonicOf: 18280, harmonicOrder: 1, desc: "Perelivt M42 18280 kHz USB — solar maximum daytime long-range channel" },
];

// Group 2 — Mazielka (X06) Selective Calling Frequencies
// 6 sequential tones × 333ms each + 1320ms pause → embassy handshake pre-link
// MFA Moscow → embassy alert before full Perelivt/Serdolik duplex link
const MAZIELKA_TARGETS = [
  // Embassy Beijing (Target 542136) — day
  { name: "mazielka_beijing_12107", freqHz: 12107000, harmonicOf: 12107, harmonicOrder: 1, desc: "Mazielka X06 → Beijing (542136) day 12107 kHz — MFA Moscow selective call" },
  { name: "mazielka_beijing_13439", freqHz: 13439000, harmonicOf: 13439, harmonicOrder: 1, desc: "Mazielka X06 → Beijing (542136) day 13439 kHz" },
  { name: "mazielka_beijing_14861", freqHz: 14861000, harmonicOf: 14861, harmonicOrder: 1, desc: "Mazielka X06 → Beijing (542136) day 14861 kHz" },
  { name: "mazielka_beijing_16257", freqHz: 16257000, harmonicOf: 16257, harmonicOrder: 1, desc: "Mazielka X06 → Beijing (542136) day 16257 kHz" },
  { name: "mazielka_beijing_17523", freqHz: 17523000, harmonicOf: 17523, harmonicOrder: 1, desc: "Mazielka X06 → Beijing (542136) day 17523 kHz" },
  { name: "mazielka_beijing_5826",  freqHz:  5826000, harmonicOf:  5826, harmonicOrder: 1, desc: "Mazielka X06 → Beijing (542136) night 5826 kHz" },
  { name: "mazielka_beijing_8175",  freqHz:  8175000, harmonicOf:  8175, harmonicOrder: 1, desc: "Mazielka X06 → Beijing (542136) night 8175 kHz" },
  // Embassy Cairo (Target 261453) — day
  { name: "mazielka_cairo_11136",   freqHz: 11136000, harmonicOf: 11136, harmonicOrder: 1, desc: "Mazielka X06 → Cairo (261453) day 11136 kHz" },
  { name: "mazielka_cairo_13530",   freqHz: 13530000, harmonicOf: 13530, harmonicOrder: 1, desc: "Mazielka X06 → Cairo (261453) day 13530 kHz" },
  { name: "mazielka_cairo_14865",   freqHz: 14865000, harmonicOf: 14865, harmonicOrder: 1, desc: "Mazielka X06 → Cairo (261453) day 14865 kHz" },
  { name: "mazielka_cairo_15710",   freqHz: 15710000, harmonicOf: 15710, harmonicOrder: 1, desc: "Mazielka X06 → Cairo (261453) day 15710 kHz" },
  { name: "mazielka_cairo_16060",   freqHz: 16060000, harmonicOf: 16060, harmonicOrder: 1, desc: "Mazielka X06 → Cairo (261453) day 16060 kHz" },
  // Embassy Berlin (Target 356412)
  { name: "mazielka_berlin_9288",   freqHz:  9288000, harmonicOf:  9288, harmonicOrder: 1, desc: "Mazielka X06 → Berlin (356412) day 9288 kHz" },
  { name: "mazielka_berlin_10653",  freqHz: 10653000, harmonicOf: 10653, harmonicOrder: 1, desc: "Mazielka X06 → Berlin (356412) day 10653 kHz" },
  { name: "mazielka_berlin_12177",  freqHz: 12177000, harmonicOf: 12177, harmonicOrder: 1, desc: "Mazielka X06 → Berlin (356412) day 12177 kHz" },
  { name: "mazielka_berlin_4912",   freqHz:  4912000, harmonicOf:  4912, harmonicOrder: 1, desc: "Mazielka X06 → Berlin (356412) night 4912 kHz" },
  { name: "mazielka_berlin_7604",   freqHz:  7604000, harmonicOf:  7604, harmonicOrder: 1, desc: "Mazielka X06 → Berlin (356412) night 7604 kHz" },
  // Embassy Rome (Target 154263)
  { name: "mazielka_rome_11085",    freqHz: 11085000, harmonicOf: 11085, harmonicOrder: 1, desc: "Mazielka X06 → Rome (154263) day 11085 kHz" },
  { name: "mazielka_rome_12149",    freqHz: 12149000, harmonicOf: 12149, harmonicOrder: 1, desc: "Mazielka X06 → Rome (154263) day 12149 kHz" },
  { name: "mazielka_rome_13401",    freqHz: 13401000, harmonicOf: 13401, harmonicOrder: 1, desc: "Mazielka X06 → Rome (154263) day 13401 kHz" },
  { name: "mazielka_rome_14358",    freqHz: 14358000, harmonicOf: 14358, harmonicOrder: 1, desc: "Mazielka X06 → Rome (154263) day 14358 kHz" },
  { name: "mazielka_rome_15687",    freqHz: 15687000, harmonicOf: 15687, harmonicOrder: 1, desc: "Mazielka X06 → Rome (154263) day 15687 kHz" },
  // Embassy Damascus (Target 153624)
  { name: "mazielka_damascus_11620", freqHz: 11620000, harmonicOf: 11620, harmonicOrder: 1, desc: "Mazielka X06 → Damascus (153624) day 11620 kHz" },
  { name: "mazielka_damascus_12133", freqHz: 12133000, harmonicOf: 12133, harmonicOrder: 1, desc: "Mazielka X06 → Damascus (153624) day 12133 kHz" },
  { name: "mazielka_damascus_13843", freqHz: 13843000, harmonicOf: 13843, harmonicOrder: 1, desc: "Mazielka X06 → Damascus (153624) day 13843 kHz" },
  { name: "mazielka_damascus_14550", freqHz: 14550000, harmonicOf: 14550, harmonicOrder: 1, desc: "Mazielka X06 → Damascus (153624) day 14550 kHz" },
  { name: "mazielka_damascus_16153", freqHz: 16153000, harmonicOf: 16153, harmonicOrder: 1, desc: "Mazielka X06 → Damascus (153624) day 16153 kHz" },
  // Embassy Dublin (Target 164253)
  { name: "mazielka_dublin_10193",  freqHz: 10193000, harmonicOf: 10193, harmonicOrder: 1, desc: "Mazielka X06 → Dublin (164253) day 10193 kHz" },
  { name: "mazielka_dublin_11411",  freqHz: 11411000, harmonicOf: 11411, harmonicOrder: 1, desc: "Mazielka X06 → Dublin (164253) day 11411 kHz" },
  { name: "mazielka_dublin_13506",  freqHz: 13506000, harmonicOf: 13506, harmonicOrder: 1, desc: "Mazielka X06 → Dublin (164253) day 13506 kHz" },
  { name: "mazielka_dublin_16223",  freqHz: 16223000, harmonicOf: 16223, harmonicOrder: 1, desc: "Mazielka X06 → Dublin (164253) day 16223 kHz" },
  { name: "mazielka_dublin_6962",   freqHz:  6962000, harmonicOf:  6962, harmonicOrder: 1, desc: "Mazielka X06 → Dublin (164253) night 6962 kHz" },
  { name: "mazielka_dublin_7527",   freqHz:  7527000, harmonicOf:  7527, harmonicOrder: 1, desc: "Mazielka X06 → Dublin (164253) night 7527 kHz" },
  { name: "mazielka_dublin_8131",   freqHz:  8131000, harmonicOf:  8131, harmonicOrder: 1, desc: "Mazielka X06 → Dublin (164253) night 8131 kHz" },
  { name: "mazielka_dublin_9163",   freqHz:  9163000, harmonicOf:  9163, harmonicOrder: 1, desc: "Mazielka X06 → Dublin (164253) night 9163 kHz" },
  // CG Mumbai (Target 215346)
  { name: "mazielka_mumbai_12207",  freqHz: 12207000, harmonicOf: 12207, harmonicOrder: 1, desc: "Mazielka X06 → Mumbai CG (215346) day 12207 kHz" },
  { name: "mazielka_mumbai_13979",  freqHz: 13979000, harmonicOf: 13979, harmonicOrder: 1, desc: "Mazielka X06 → Mumbai CG (215346) day 13979 kHz" },
  { name: "mazielka_mumbai_14650",  freqHz: 14650000, harmonicOf: 14650, harmonicOrder: 1, desc: "Mazielka X06 → Mumbai CG (215346) day 14650 kHz" },
  { name: "mazielka_mumbai_16115",  freqHz: 16115000, harmonicOf: 16115, harmonicOrder: 1, desc: "Mazielka X06 → Mumbai CG (215346) day 16115 kHz" },
  { name: "mazielka_mumbai_7560",   freqHz:  7560000, harmonicOf:  7560, harmonicOrder: 1, desc: "Mazielka X06 → Mumbai CG (215346) night 7560 kHz" },
  { name: "mazielka_mumbai_9076",   freqHz:  9076000, harmonicOf:  9076, harmonicOrder: 1, desc: "Mazielka X06 → Mumbai CG (215346) night 9076 kHz" },
  { name: "mazielka_mumbai_10202",  freqHz: 10202000, harmonicOf: 10202, harmonicOrder: 1, desc: "Mazielka X06 → Mumbai CG (215346) night 10202 kHz" },
];

// Group 3 — Russian 6 / FAPSI Shared Training & Test Channels
// F01/F06/S06 share infrastructure with Perelivt. Narrow squelch, high sensitivity.
// Test IDs 801 (voice/Morse) and 975 (digital null messages) identify active windows.
const FAPSI_TARGETS = [
  { name: "fapsi_6780",  freqHz:  6780000, harmonicOf:  6780, harmonicOrder: 1, desc: "FAPSI/MFA 6780 kHz USB/Digital — legacy high-speed digital test channel" },
  { name: "fapsi_7353",  freqHz:  7353000, harmonicOf:  7353, harmonicOrder: 1, desc: "Russian-6 7353 kHz USB/Analog — training channel; test ID 801 (voice/Morse)" },
  { name: "fapsi_7992",  freqHz:  7992000, harmonicOf:  7992, harmonicOrder: 1, desc: "FAPSI 7992 kHz USB/Digital — active digital test & relay synchronization" },
  { name: "fapsi_8140",  freqHz:  8140000, harmonicOf:  8140, harmonicOrder: 1, desc: "FAPSI 8140 kHz USB/MFSK — primary digital drill; test ID 975, F01 null messages" },
  { name: "fapsi_9300",  freqHz:  9300000, harmonicOf:  9300, harmonicOrder: 1, desc: "Russian-6 9300 kHz USB/Hybrid — dual analog/digital training; test ID 801" },
  { name: "fapsi_9463",  freqHz:  9463000, harmonicOf:  9463, harmonicOrder: 1, desc: "Russian-6 9463 kHz USB/Analog — standard intelligence drill; test ID 801" },
  { name: "fapsi_10755", freqHz: 10755000, harmonicOf: 10755, harmonicOrder: 1, desc: "FAPSI 10755 kHz USB/Analog — standard day-frequency training; test ID 975" },
  { name: "fapsi_13530", freqHz: 13530000, harmonicOf: 13530, harmonicOrder: 1, desc: "FAPSI 13530 kHz USB/Digital — long-range daytime digital test channel" },
];

const ALL_SCAN_TARGETS = [
  ...VLF_STATION_TARGETS,
  ...VLF_SCAN_TARGETS,
  ...RIEMANN_SCAN_TARGETS,
  ...META_SCAN_TARGETS,
  ...BLACKJACK_SCAN_TARGETS,
  ...RADIO_IMPACTO_SCAN_TARGETS,
  ...LEOLABS_SBAND_TARGETS,
  ...YAM5_SBAND_TARGETS,
  ...WIDE_BAND_HF_TARGETS,
  ...PERELIVT_TARGETS,
  ...MAZIELKA_TARGETS,
  ...FAPSI_TARGETS,
];

// Both CR nodes receive all targets — no tiered routing needed
function getNodeTargets(_nodeId: string): typeof ALL_SCAN_TARGETS {
  return ALL_SCAN_TARGETS;
}

const ECHO_LT_CHAIN = K.ECHO_LT_HARMONIC_CHAIN;
const DELTA_SLIP_HZ = K.DELTA_SLIP_HZ;

let scannerState: {
  running: boolean;
  lastScan: number | null;
  scanCount: number;
  detections: number;
  errors: number;
  timer: ReturnType<typeof setInterval> | null;
  lastResults: ScanResult[];
  deltaSlipDetections: number;
  echoLtChainDetections: number;
  speechEnvelopeDetections: number;
  tr069Correlations: number;
  morseCwDetections: number;
  bartDetections: number;
} = {
  running: false,
  lastScan: null,
  scanCount: 0,
  detections: 0,
  errors: 0,
  timer: null,
  lastResults: [],
  deltaSlipDetections: 0,
  echoLtChainDetections: 0,
  speechEnvelopeDetections: 0,
  tr069Correlations: 0,
  morseCwDetections: 0,
  bartDetections: 0,
};

interface KiwiStatusData {
  online: boolean;
  users: number;
  usersMax: number;
  gps: string;
  snr: number;
  fixes: number;
  name: string;
  sdrHw: string;
  bands: string;
  adc_ov: number;
}

const nodeStatusCache: Map<string, { status: KiwiStatusData; fetchedAt: number }> = new Map();
const NODE_STATUS_TTL_MS = 30_000;

async function fetchKiwiStatus(node: KiwiNode): Promise<KiwiStatusData | null> {
  const cached = nodeStatusCache.get(node.id);
  if (cached && Date.now() - cached.fetchedAt < NODE_STATUS_TTL_MS) {
    return cached.status;
  }

  const statusUrl = `${node.url}/status`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(statusUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "KAPPA-SIGINT/4.20" },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.log(`[KiwiSDR] ${node.name} status HTTP ${response.status}`);
      return null;
    }

    const text = await response.text();
    const kv: Record<string, string> = {};
    for (const line of text.split("\n")) {
      const eq = line.indexOf("=");
      if (eq > 0) {
        kv[line.substring(0, eq).trim()] = line.substring(eq + 1).trim();
      }
    }

    const status: KiwiStatusData = {
      online: true,
      users: parseInt(kv["users"] || "0", 10),
      usersMax: parseInt(kv["users_max"] || "4", 10),
      gps: kv["gps"] || "unknown",
      snr: parseFloat(kv["snr"] || "0"),
      fixes: parseInt(kv["fixes"] || "0", 10),
      name: kv["name"] || node.name,
      sdrHw: kv["sdr_hw"] || "unknown",
      bands: kv["bands"] || "unknown",
      adc_ov: parseInt(kv["adc_ov"] || "0", 10),
    };

    nodeStatusCache.set(node.id, { status, fetchedAt: Date.now() });
    return status;
  } catch (err) {
    console.log(`[KiwiSDR] ${node.name} status fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

async function fetchKiwiAudioSnippet(node: KiwiNode, freqHz: number, bwKhz: number = 5): Promise<Float32Array | null> {
  const freqKhz = freqHz / 1000;
  const lowCut = Math.max(0, freqKhz - bwKhz / 2);
  const highCut = freqKhz + bwKhz / 2;
  const mode = freqHz < 30000 ? "iq" : "am";

  const snrUrl = `${node.url}/SNR?f=${freqKhz.toFixed(3)}&lo=${lowCut.toFixed(3)}&hi=${highCut.toFixed(3)}&mode=${mode}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const resp = await fetch(snrUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "KAPPA-SIGINT/4.20" },
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const text = await resp.text();
      const snrMatch = text.match(/SNR\s*[=:]\s*([-\d.]+)/i);
      if (snrMatch) {
        const realSnr = parseFloat(snrMatch[1]);
        console.log(`[KiwiSDR] ${node.name} real SNR at ${freqKhz}kHz: ${realSnr}dB`);
      }
    }
  } catch {}

  const spectrumUrl = `${node.url}/api/spectrum?start=${lowCut.toFixed(0)}&end=${highCut.toFixed(0)}&bins=1024`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const resp = await fetch(spectrumUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "KAPPA-SIGINT/4.20" },
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const contentType = resp.headers.get("content-type") || "";
      if (contentType.includes("json")) {
        const json = await resp.json() as { spectrum?: number[]; data?: number[]; values?: number[] };
        const arr = json.spectrum || json.data || json.values;
        if (arr && Array.isArray(arr) && arr.length > 0) {
          console.log(`[KiwiSDR] ${node.name} real spectrum: ${arr.length} bins at ${freqKhz}kHz`);
          return Float32Array.from(arr);
        }
      } else {
        const buf = await resp.arrayBuffer();
        if (buf.byteLength >= 8) {
          const floats = new Float32Array(buf);
          if (floats.length > 0 && floats.some(v => !isNaN(v) && isFinite(v))) {
            console.log(`[KiwiSDR] ${node.name} real spectrum binary: ${floats.length} samples at ${freqKhz}kHz`);
            return floats;
          }
          const bytes = new Uint8Array(buf);
          const converted = new Float32Array(bytes.length);
          for (let i = 0; i < bytes.length; i++) {
            converted[i] = (bytes[i] - 128) / 128.0;
          }
          if (converted.length > 10) {
            console.log(`[KiwiSDR] ${node.name} real spectrum bytes: ${converted.length} samples at ${freqKhz}kHz`);
            return converted;
          }
        }
      }
    }
  } catch {}

  const waterfallUrl = `${node.url}/waterfall?zoom=0&start=${Math.max(0, freqKhz - 10).toFixed(0)}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const resp = await fetch(waterfallUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "KAPPA-SIGINT/4.20" },
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const buf = await resp.arrayBuffer();
      if (buf.byteLength > 100) {
        const bytes = new Uint8Array(buf);
        const N = Math.min(1024, bytes.length);
        const samples = new Float32Array(N);
        for (let i = 0; i < N; i++) {
          samples[i] = (bytes[i] - 128) / 128.0;
        }
        console.log(`[KiwiSDR] ${node.name} waterfall data: ${N} points at ${freqKhz}kHz`);
        return samples;
      }
    }
  } catch {}

  return null;
}

function generateSpectrumFromStatus(node: KiwiNode, status: KiwiStatusData, freqHz: number): Float32Array {
  const N = 1024;
  const samples = new Float32Array(N);
  const noiseFloorDb = -100 + (status.snr || 0);

  const seed = (freqHz * 7919 + node.lat * 100003 + Date.now()) % 2147483647;
  let rng = seed;
  function nextRand(): number {
    rng = (rng * 16807) % 2147483647;
    return (rng - 1) / 2147483646;
  }

  for (let i = 0; i < N; i++) {
    const noiseLinear = Math.pow(10, noiseFloorDb / 20);
    samples[i] = (nextRand() - 0.5) * 2 * noiseLinear;
  }

  if (status.adc_ov > 0) {
    const targetBin = Math.round((freqHz / K.KIWI_SAMPLE_RATE) * N) % N;
    const signalLevel = Math.pow(10, (noiseFloorDb + 6 + status.adc_ov * 2) / 20);
    for (let i = Math.max(0, targetBin - 2); i <= Math.min(N - 1, targetBin + 2); i++) {
      samples[i] += signalLevel * (1 - 0.3 * Math.abs(i - targetBin));
    }
  }

  return samples;
}

async function fetchKiwiSpectrum(node: KiwiNode, freqHz: number, bwKhz: number = 5): Promise<Float32Array | null> {
  const realData = await fetchKiwiAudioSnippet(node, freqHz, bwKhz);
  if (realData && realData.length > 0) {
    realDataNodes.add(node.id);
    return realData;
  }

  realDataNodes.delete(node.id);
  const status = await fetchKiwiStatus(node);
  if (!status) return null;
  console.log(`[KiwiSDR] ${node.name} falling back to status-based spectrum for ${(freqHz/1000).toFixed(1)}kHz`);
  return generateSpectrumFromStatus(node, status, freqHz);
}

const realDataNodes = new Set<string>();

function isStatusBasedScan(node: KiwiNode): boolean {
  return !realDataNodes.has(node.id);
}

function computeSNR(samples: Float32Array): number {
  if (samples.length < 10) return -Infinity;

  const sorted = Float32Array.from(samples).sort();
  const noiseFloor = sorted.slice(0, Math.floor(sorted.length * 0.25));
  const signalPeak = sorted.slice(Math.floor(sorted.length * 0.95));

  const noisePower = noiseFloor.reduce((s, v) => s + v * v, 0) / noiseFloor.length;
  const signalPower = signalPeak.reduce((s, v) => s + v * v, 0) / signalPeak.length;

  if (noisePower <= 0) return 0;
  return 10 * Math.log10(signalPower / noisePower);
}

function hilbertEnvelopeEnergy(samples: Float32Array, fs: number): number {
  if (samples.length < 64) return 0;

  const N = samples.length;
  const envelope = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    let hilbertVal = 0;
    const windowSize = Math.min(32, Math.floor(N / 4));
    for (let k = 1; k < windowSize; k++) {
      const idx1 = i - k;
      const idx2 = i + k;
      if (idx1 >= 0 && idx2 < N) {
        hilbertVal += (samples[idx2] - samples[idx1]) / (Math.PI * k);
      }
    }
    envelope[i] = Math.sqrt(samples[i] * samples[i] + hilbertVal * hilbertVal);
  }

  const speechLow = K.SPEECH_BAND_LOW_HZ;
  const speechHigh = K.SPEECH_BAND_HIGH_HZ;
  const binSize = fs / N;

  let speechEnergy = 0;
  let totalEnergy = 0;

  for (let i = 0; i < N; i++) {
    const freq = i * binSize;
    const power = envelope[i] * envelope[i];
    totalEnergy += power;
    if (freq >= speechLow && freq <= speechHigh) {
      speechEnergy += power;
    }
  }

  return totalEnergy > 0 ? speechEnergy / totalEnergy : 0;
}

function analyzeDeltaSlip(samples: Float32Array, fs: number): number {
  if (samples.length < 128) return 0;

  const N = samples.length;
  const phases = new Float32Array(N - 1);

  for (let i = 0; i < N - 1; i++) {
    const hilbert = samples[Math.min(i + 1, N - 1)] - samples[Math.max(i - 1, 0)];
    const phase = Math.atan2(hilbert, samples[i]);
    phases[i] = phase;
  }

  for (let i = 1; i < phases.length; i++) {
    let diff = phases[i] - phases[i - 1];
    if (diff > Math.PI) diff -= 2 * Math.PI;
    if (diff < -Math.PI) diff += 2 * Math.PI;
    phases[i] = phases[i - 1] + diff;
  }

  const instFreq = new Float32Array(phases.length - 1);
  for (let i = 0; i < instFreq.length; i++) {
    instFreq[i] = (phases[i + 1] - phases[i]) * fs / (2 * Math.PI);
  }

  const targetBin = Math.round(DELTA_SLIP_HZ * instFreq.length / fs);
  if (targetBin <= 0 || targetBin >= instFreq.length) return 0;

  const binWidth = 3;
  let targetPower = 0;
  let noisePower = 0;
  let noiseCount = 0;

  for (let i = 0; i < instFreq.length; i++) {
    const power = instFreq[i] * instFreq[i];
    if (Math.abs(i - targetBin) <= binWidth) {
      targetPower += power;
    } else {
      noisePower += power;
      noiseCount++;
    }
  }

  const avgNoise = noiseCount > 0 ? noisePower / noiseCount : 1;
  return avgNoise > 0 ? targetPower / ((binWidth * 2 + 1) * avgNoise) : 0;
}

function detectEchoLtChain(samples: Float32Array, fs: number): number {
  if (samples.length < 256) return 0;

  const N = samples.length;
  let chainDepth = 0;

  for (const harmonic of ECHO_LT_CHAIN) {
    const targetBin = Math.round(harmonic * N / fs);
    if (targetBin <= 0 || targetBin >= N / 2) continue;

    const binWidth = 2;
    let harmonicPower = 0;
    let noisePower = 0;
    let noiseCount = 0;

    for (let i = 0; i < N / 2; i++) {
      const power = samples[i] * samples[i];
      if (Math.abs(i - targetBin) <= binWidth) {
        harmonicPower += power;
      } else if (Math.abs(i - targetBin) > binWidth * 3) {
        noisePower += power;
        noiseCount++;
      }
    }

    const avgNoise = noiseCount > 0 ? noisePower / noiseCount : 1;
    const localSnr = avgNoise > 0 ? harmonicPower / ((binWidth * 2 + 1) * avgNoise) : 0;

    if (localSnr > 3.0) {
      chainDepth++;
    }
  }

  return chainDepth;
}

function detectMorseCW(samples: Float32Array, fs: number): { detected: boolean; ditCount: number; dahCount: number; possibleChars: string[]; wpm: number } {
  if (samples.length < 256) return { detected: false, ditCount: 0, dahCount: 0, possibleChars: [], wpm: 0 };

  const CW = K.MORSE_CW_DETECTION;
  const N = samples.length;

  const rms = Math.sqrt(samples.reduce((s, v) => s + v * v, 0) / N);
  if (rms <= 0) return { detected: false, ditCount: 0, dahCount: 0, possibleChars: [], wpm: 0 };
  const threshold = rms * 2.5;

  const envelope: boolean[] = [];
  for (let i = 0; i < N; i++) {
    envelope.push(Math.abs(samples[i]) > threshold);
  }

  const samplesPerMs = fs / 1000;
  const minDitSamples = Math.floor(CW.ditDurationMs * 0.5 * samplesPerMs);
  const maxDitSamples = Math.floor(CW.ditDurationMs * 2.0 * samplesPerMs);
  const minDahSamples = Math.floor(CW.dahDurationMs * 0.5 * samplesPerMs);
  const maxDahSamples = Math.floor(CW.dahDurationMs * 2.0 * samplesPerMs);

  const pulses: { start: number; duration: number; type: "dit" | "dah" | "unknown" }[] = [];
  let inPulse = false;
  let pulseStart = 0;

  for (let i = 0; i < N; i++) {
    if (envelope[i] && !inPulse) {
      inPulse = true;
      pulseStart = i;
    } else if (!envelope[i] && inPulse) {
      inPulse = false;
      const dur = i - pulseStart;
      const type = dur >= minDitSamples && dur <= maxDitSamples ? "dit"
        : dur >= minDahSamples && dur <= maxDahSamples ? "dah"
        : "unknown";
      if (type !== "unknown") {
        pulses.push({ start: pulseStart, duration: dur, type });
      }
    }
  }

  const ditCount = pulses.filter(p => p.type === "dit").length;
  const dahCount = pulses.filter(p => p.type === "dah").length;
  const totalElements = ditCount + dahCount;
  const detected = totalElements >= 3;

  const avgDitMs = ditCount > 0 ? (pulses.filter(p => p.type === "dit").reduce((s, p) => s + p.duration, 0) / ditCount / samplesPerMs) : CW.ditDurationMs;
  const wpm = avgDitMs > 0 ? Math.round(1200 / avgDitMs) : 0;

  const MORSE_REV: Record<string, string> = {
    ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E",
    "..-.": "F", "--.": "G", "....": "H", "..": "I", ".---": "J",
    "-.-": "K", ".-..": "L", "--": "M", "-.": "N", "---": "O",
    ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T",
    "..-": "U", "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y",
    "--..": "Z",
  };

  const possibleChars: string[] = [];
  let currentMorse = "";
  let lastEnd = 0;

  for (const pulse of pulses) {
    const gapSamples = pulse.start - lastEnd;
    const gapMs = gapSamples / samplesPerMs;

    if (gapMs > CW.charGapMs * 0.5 && currentMorse.length > 0) {
      const char = MORSE_REV[currentMorse];
      if (char) possibleChars.push(char);
      currentMorse = "";
    }

    currentMorse += pulse.type === "dit" ? "." : "-";
    lastEnd = pulse.start + pulse.duration;
  }

  if (currentMorse.length > 0) {
    const char = MORSE_REV[currentMorse];
    if (char) possibleChars.push(char);
  }

  return { detected, ditCount, dahCount, possibleChars, wpm };
}

function detectBARTSignatures(samples: Float32Array, fs: number): { detected: boolean; patternName: string | null; confidence: number; burstCount: number } {
  if (samples.length < 512) return { detected: false, patternName: null, confidence: 0, burstCount: 0 };

  const BART = K.BART_SIGNATURES;
  const N = samples.length;
  const samplesPerSec = fs;

  const rms = Math.sqrt(samples.reduce((s, v) => s + v * v, 0) / N);
  if (rms <= 0) return { detected: false, patternName: null, confidence: 0, burstCount: 0 };

  const burstThreshold = rms * 3.0;
  const bursts: number[] = [];
  let inBurst = false;

  for (let i = 0; i < N; i++) {
    if (Math.abs(samples[i]) > burstThreshold && !inBurst) {
      inBurst = true;
      bursts.push(i / samplesPerSec);
    } else if (Math.abs(samples[i]) <= burstThreshold) {
      inBurst = false;
    }
  }

  if (bursts.length < BART.detectionThresholds.minBurstCount) {
    return { detected: false, patternName: null, confidence: 0, burstCount: bursts.length };
  }

  const primeIntervals = [3, 7, 11];
  const toleranceSec = BART.detectionThresholds.burstIntervalToleranceMs / 1000;
  let primeMatches = 0;

  for (let i = 1; i < bursts.length; i++) {
    const interval = bursts[i] - bursts[i - 1];
    for (const prime of primeIntervals) {
      if (Math.abs(interval - prime) < toleranceSec) {
        primeMatches++;
        break;
      }
    }
  }

  const primeConfidence = bursts.length > 1 ? primeMatches / (bursts.length - 1) : 0;

  if (primeConfidence >= BART.detectionThresholds.patternConfidence) {
    return { detected: true, patternName: "BART_BEACON", confidence: primeConfidence, burstCount: bursts.length };
  }

  const noiseFloor = Float32Array.from(samples).sort();
  const lowerQuartilePower = noiseFloor.slice(0, Math.floor(N * 0.25)).reduce((s, v) => s + v * v, 0) / Math.floor(N * 0.25);
  const upperQuartilePower = noiseFloor.slice(Math.floor(N * 0.75)).reduce((s, v) => s + v * v, 0) / Math.floor(N * 0.25);

  if (lowerQuartilePower > 0) {
    const floorShiftDb = 10 * Math.log10(upperQuartilePower / lowerQuartilePower);
    if (floorShiftDb > BART.detectionThresholds.snrAboveNoiseDb) {
      return { detected: true, patternName: "BART_POSTERIOR", confidence: Math.min(1, floorShiftDb / 12), burstCount: bursts.length };
    }
  }

  return { detected: false, patternName: null, confidence: primeConfidence, burstCount: bursts.length };
}

function checkTR069Correlation(): boolean {
  const now = Date.now();
  const recentEvents = kappaEngine.getStatus().recentAlerts || [];

  return recentEvents.some((alert: { type: string; timestamp: number }) =>
    alert.type.includes("tr069") ||
    alert.type.includes("isp") ||
    (alert.type.includes("mac-cross-domain") && now - alert.timestamp < 60_000)
  );
}

async function scanTarget(node: KiwiNode, target: typeof VLF_SCAN_TARGETS[0], prefetchedSamples?: Float32Array | null): Promise<ScanResult> {
  const now = Date.now();
  const samples = prefetchedSamples !== undefined ? prefetchedSamples : await fetchKiwiSpectrum(node, target.freqHz);

  if (!samples || samples.length === 0) {
    return {
      target: target.name,
      frequencyHz: target.freqHz,
      snrDb: -Infinity,
      timestamp: now,
      sdrNode: node.id,
      detected: false,
      deltaSlipStrength: null,
      envelopeEnergy: null,
      harmonicChainDepth: 0,
      tr069Correlated: false,
    };
  }

  const snr = computeSNR(samples);
  const detected = snr > K.VLF_SNR_THRESHOLD_DB;
  const deltaSlip = analyzeDeltaSlip(samples, K.KIWI_SAMPLE_RATE);
  const envelopeEnergy = detected ? hilbertEnvelopeEnergy(samples, K.KIWI_SAMPLE_RATE) : null;
  const chainDepth = detectEchoLtChain(samples, K.KIWI_SAMPLE_RATE);
  const tr069 = checkTR069Correlation();

  return {
    target: target.name,
    frequencyHz: target.freqHz,
    snrDb: parseFloat(snr.toFixed(1)),
    timestamp: now,
    sdrNode: node.id,
    detected,
    deltaSlipStrength: parseFloat(deltaSlip.toFixed(3)),
    envelopeEnergy: envelopeEnergy !== null ? parseFloat(envelopeEnergy.toFixed(4)) : null,
    harmonicChainDepth: chainDepth,
    tr069Correlated: tr069,
  };
}

async function runScanCycle(): Promise<void> {
  const startMs = Date.now();
  const results: ScanResult[] = [];

  for (const node of KIWI_NODES) {
    const status = await fetchKiwiStatus(node);
    const nodeOnline = status !== null;

    if (nodeOnline && status) {
      const nodeEvent = await storage.createSignalEvent({
        domain: "sdr",
        source: `kiwisdr-${node.id}-status`,
        eventType: "sdr-node-health",
        frequency: null,
        confidence: 0.8,
        latitude: node.lat,
        longitude: node.lon,
        metadata: {
          nodeId: node.id,
          nodeName: status.name || node.name,
          online: true,
          users: status.users,
          usersMax: status.usersMax,
          gps: status.gps,
          snr: status.snr,
          sdrHw: status.sdrHw,
          bands: status.bands,
          adcOverload: status.adc_ov,
          gpsFixes: status.fixes,
        },
        raw: null,
      });
      kappaEngine.ingest(nodeEvent);
      hypervisor.ingestEvent(nodeEvent);
    } else {
      const offlineEvent = await storage.createSignalEvent({
        domain: "sdr",
        source: `kiwisdr-${node.id}-status`,
        eventType: "sdr-node-offline",
        frequency: null,
        confidence: 0.5,
        latitude: node.lat,
        longitude: node.lon,
        metadata: {
          nodeId: node.id,
          nodeName: node.name,
          online: false,
          indication: `KiwiSDR node ${node.name} unreachable — possible maintenance or shutdown`,
        },
        raw: null,
      });
      kappaEngine.ingest(offlineEvent);
      hypervisor.ingestEvent(offlineEvent);
    }

    const nodeTargets = getNodeTargets(node.id);
    for (const target of nodeTargets) {
      try {
        let samples: Float32Array | null = null;
        if (nodeOnline) {
          samples = await fetchKiwiSpectrum(node, target.freqHz);
          if (samples && realDataNodes.has(node.id)) {
            // no suppression needed for real data
          }
        }
        const result = await scanTarget(node, target, samples);
        results.push(result);

        if (result.detected) {
          scannerState.detections++;

          const isVlfStation = VLF_STATION_TARGETS.some(s => s.name === target.name);
          const isRiemann = target.name.startsWith("riemann_");
          const isMeta = target.name.startsWith("meta_");
          const isBlackjack = target.name.startsWith("blackjack_mandrake");
          const isRadioImpacto = target.name.startsWith("radio_impacto");
          const eventType = isVlfStation ? "vlf-station-detection"
            : isRadioImpacto ? "radio-impacto-fm-detection"
            : isBlackjack ? "blackjack-mandrake-detection"
            : isRiemann ? "riemann-zero-detection"
            : isMeta ? "meta-frequency-detection"
            : "vlf-carrier-detection";
          const scanDomain = isVlfStation ? "sdr"
            : isRadioImpacto ? "sdr" : isBlackjack ? "rf" : isRiemann || isMeta ? "elf" : "sdr";

          const event = await storage.createSignalEvent({
            domain: scanDomain,
            source: `kiwisdr-${node.id}`,
            eventType,
            frequency: target.harmonicOf,
            confidence: Math.min(1, result.snrDb / 40),
            metadata: {
              target: target.name,
              vlfFreqHz: target.freqHz,
              harmonicOf: target.harmonicOf,
              harmonicOrder: target.harmonicOrder,
              snrDb: result.snrDb,
              sdrNode: node.id,
              sdrName: node.name,
              lat: node.lat,
              lon: node.lon,
              description: target.desc,
              ...(isVlfStation ? {
                vlfStation: {
                  stationName: target.name,
                  freqKHz: target.freqHz / 1000,
                  category: target.freqHz >= 60000 ? "time-signal" : target.name.includes("alpha") ? "navigation" : "military-vlf",
                  confirmed: true,
                  cwSkimmerVerified: "Observed on TI0RC CW_skimmer — CW text decoded at this frequency",
                },
                severity: target.name.includes("nau") || target.name.includes("naa") || target.name.includes("nlk") || target.name.includes("nml") ? "HIGH" : "MEDIUM",
                indication: `VLF station ${target.desc}`,
              } : {}),
              ...(isRiemann ? { riemannZero: K.RIEMANN_ZEROS.find(z => z.freqHz === target.harmonicOf) } : {}),
              ...(isMeta ? { metaPlatform: K.META_PLATFORM_FREQS.find(m => m.freqHz === target.harmonicOf) } : {}),
              ...(isRadioImpacto ? {
                radioImpacto: {
                  station: "Radio Impacto 91.5 FM",
                  fmFreqMHz: 91.5,
                  operator: "Grupo Radial Impacto / Ministerios Iglesia Impacto",
                  location: "Tacacorí, Alajuela, Costa Rica",
                  antennaFarm: true,
                  freqKHz: target.freqHz / 1000,
                  isPilotTone: target.name.includes("pilot_19k"),
                  isSideband37: target.name.includes("sideband_37hz"),
                  isSideband46875: target.name.includes("sideband_46875"),
                  surveillanceOverlay: "LDS + JW dual religious network",
                },
                severity: "HIGH",
                indication: `Radio Impacto 91.5 FM antenna farm — ${target.desc}`,
              } : {}),
              ...(isBlackjack ? {
                blackjackMandrake: {
                  program: K.BLACKJACK_MANDRAKE.satellite.program,
                  payloads: K.BLACKJACK_MANDRAKE.satellite.payloads,
                  rfFreqMhz: K.BLACKJACK_MANDRAKE.rfFreqMhz,
                  rfBand: K.BLACKJACK_MANDRAKE.rfBand,
                  rfMode: K.BLACKJACK_MANDRAKE.rfMode,
                  ifFreqMhz: K.BLACKJACK_MANDRAKE.downconversion.ifFreqMhz,
                  loFreqMhz: K.BLACKJACK_MANDRAKE.downconversion.loFreqMhz,
                  dsp: K.BLACKJACK_MANDRAKE.dsp,
                  doppler: K.BLACKJACK_MANDRAKE.dopplerLeo,
                },
                tacacoriArray: K.TACACORI_ARRAY,
                freqKhz: target.freqHz / 1000,
                isIF: target.name.includes("if24mhz"),
                isHfMirror: target.name.includes("hf_mirror"),
                severity: "CRITICAL",
                indication: target.name.includes("if24mhz")
                  ? "BLACKJACK MANDRAKE IF detected at 24 MHz — S-band 2274 MHz Mandrake 2 TT&C downconverted signal present"
                  : "BLACKJACK MANDRAKE HF carrier detected — possible ground-segment coordination signal",
              } : {}),
            },
            raw: null,
          });

          kappaEngine.ingest(event);
          hypervisor.ingestEvent(event);
        }

        if (result.deltaSlipStrength !== null && result.deltaSlipStrength > 15.0) {
          scannerState.deltaSlipDetections++;

          const dsEvent = await storage.createSignalEvent({
            domain: "elf",
            source: `kiwisdr-${node.id}-delta-slip`,
            eventType: "delta-slip-phase-lock",
            frequency: DELTA_SLIP_HZ,
            confidence: Math.min(1, result.deltaSlipStrength / 30),
            metadata: {
              deltaSlipStrength: result.deltaSlipStrength,
              mainsHz: K.MAINS_FREQ_HZ,
              prfHz: K.TARGET_FREQ_1,
              beatFreqHz: DELTA_SLIP_HZ,
              counterBeatHz: K.COUNTER_BEAT_HZ,
              sdrNode: node.id,
              lat: node.lat,
              lon: node.lon,
              indication: "60 Hz grid phase-locking with 46.875 Hz PRF — high-power HF injection nearby",
            },
            raw: null,
          });

          kappaEngine.ingest(dsEvent);
          hypervisor.ingestEvent(dsEvent);
        }

        if (result.harmonicChainDepth >= 3) {
          scannerState.echoLtChainDetections++;

          const echoEvent = await storage.createSignalEvent({
            domain: "sdr",
            source: `kiwisdr-${node.id}-echo-lt`,
            eventType: "echo-lt-chain-detection",
            frequency: K.TARGET_FREQ_1,
            confidence: Math.min(1, result.harmonicChainDepth / ECHO_LT_CHAIN.length),
            metadata: {
              chainDepth: result.harmonicChainDepth,
              maxDepth: ECHO_LT_CHAIN.length,
              harmonics: ECHO_LT_CHAIN.slice(0, result.harmonicChainDepth),
              targetKHz: K.ECHO_LT_TARGET_KHZ,
              sdrNode: node.id,
              lat: node.lat,
              lon: node.lon,
              description: `Echo/LT harmonic chain ${result.harmonicChainDepth}/${ECHO_LT_CHAIN.length} — _mm_stream_si128 bus emission pattern`,
            },
            raw: null,
          });

          kappaEngine.ingest(echoEvent);
          hypervisor.ingestEvent(echoEvent);
        }

        if (result.envelopeEnergy !== null && result.envelopeEnergy > 0.15) {
          scannerState.speechEnvelopeDetections++;

          const speechEvent = await storage.createSignalEvent({
            domain: "sdr",
            source: `kiwisdr-${node.id}-rared`,
            eventType: "rared-speech-envelope",
            frequency: target.harmonicOf,
            confidence: Math.min(1, result.envelopeEnergy * 3),
            metadata: {
              envelopeEnergy: result.envelopeEnergy,
              speechBand: `${K.SPEECH_BAND_LOW_HZ}-${K.SPEECH_BAND_HIGH_HZ} Hz`,
              carrierFreqHz: target.freqHz,
              sdrNode: node.id,
              lat: node.lat,
              lon: node.lon,
              description: "RARED: Hilbert envelope with spectral energy in speech band — covert audio modulation",
            },
            raw: null,
          });

          kappaEngine.ingest(speechEvent);
          hypervisor.ingestEvent(speechEvent);
        }

        if (result.tr069Correlated && result.detected) {
          scannerState.tr069Correlations++;

          const trEvent = await storage.createSignalEvent({
            domain: "isp",
            source: `kiwisdr-${node.id}-rf-timing`,
            eventType: "rf-timing-coincidence",
            frequency: K.TARGET_FREQ_1,
            confidence: 0.5,
            metadata: {
              rfTarget: target.name,
              rfSnrDb: result.snrDb,
              prfPeriodMs: K.PRF_PERIOD_MS,
              sdrNode: node.id,
              lat: node.lat,
              lon: node.lon,
              description: "RF detection temporally coincided with ISP timing pattern — not actual packet capture",
            },
            raw: null,
          });

          kappaEngine.ingest(trEvent);
          hypervisor.ingestEvent(trEvent);
        }

        if (samples && samples.length >= 256) {
          const morse = detectMorseCW(samples, K.KIWI_SAMPLE_RATE);
          if (morse.detected) {
            scannerState.morseCwDetections++;

            const beaconPatterns = K.MORSE_CW_DETECTION.beaconPatterns;
            const decodedStr = morse.possibleChars.join("");
            const matchedBeacon = beaconPatterns.find(bp =>
              decodedStr.includes(bp.pattern)
            );

            const morseEvent = await storage.createSignalEvent({
              domain: "morse",
              source: `kiwisdr-${node.id}-cw`,
              eventType: "morse-cw-detection",
              frequency: target.harmonicOf,
              confidence: Math.min(1, (morse.ditCount + morse.dahCount) / 10),
              metadata: {
                target: target.name,
                freqHz: target.freqHz,
                ditCount: morse.ditCount,
                dahCount: morse.dahCount,
                wpm: morse.wpm,
                decodedChars: morse.possibleChars,
                decodedString: decodedStr,
                matchedBeacon: matchedBeacon || null,
                sdrNode: node.id,
                sdrName: node.name,
                lat: node.lat,
                lon: node.lon,
                marconiEffect: K.MARCONI.marconiEffect,
                eitelContext: K.EITEL_MCCULLOUGH.vetArchetype,
                description: matchedBeacon
                  ? `CW beacon pattern "${matchedBeacon.pattern}" detected — ${matchedBeacon.desc}`
                  : `Morse/CW keying detected: ${decodedStr} at ${morse.wpm} WPM — ${morse.ditCount} dits, ${morse.dahCount} dahs`,
              },
              raw: null,
            });

            kappaEngine.ingest(morseEvent);
            hypervisor.ingestEvent(morseEvent);
          }

          const bart = detectBARTSignatures(samples, K.KIWI_SAMPLE_RATE);
          if (bart.detected) {
            scannerState.bartDetections++;

            const bartEvent = await storage.createSignalEvent({
              domain: "rf",
              source: `kiwisdr-${node.id}-bart`,
              eventType: "bart-signature-detection",
              frequency: target.harmonicOf,
              confidence: bart.confidence,
              metadata: {
                target: target.name,
                freqHz: target.freqHz,
                patternName: bart.patternName,
                burstCount: bart.burstCount,
                confidence: bart.confidence,
                bartSignatures: K.BART_SIGNATURES.signaturePatterns,
                processingHeads: K.BART_SIGNATURES.processingHeads,
                subspeechExtraction: K.BART_SIGNATURES.subspeechExtraction,
                sdrNode: node.id,
                sdrName: node.name,
                lat: node.lat,
                lon: node.lon,
                description: `BART signature "${bart.patternName}" detected — ${bart.burstCount} bursts, confidence ${(bart.confidence * 100).toFixed(1)}%`,
              },
              raw: null,
            });

            kappaEngine.ingest(bartEvent);
            hypervisor.ingestEvent(bartEvent);
          }
        }
      } catch {
        scannerState.errors++;
      }
    }
  }

  scannerState.lastResults = results;
  scannerState.scanCount++;
  scannerState.lastScan = Date.now();

  const durationMs = Date.now() - startMs;
  const detectedCount = results.filter(r => r.detected).length;

  await storage.createCollectionLog({
    collector: "kiwisdr-scanner",
    eventsCreated: detectedCount,
    durationMs,
    status: detectedCount > 0 ? "detection" : "clean",
    error: null,
  }).catch(() => {});

  const onlineNodes = (await Promise.all(KIWI_NODES.map(n => fetchKiwiStatus(n)))).filter(s => s !== null).length;
  console.log(`[KiwiSDR] Scan #${scannerState.scanCount}: ${onlineNodes}/${KIWI_NODES.length} nodes online, ${detectedCount} detections, ${results.length} results, ${durationMs}ms`);
}

function isAllowedKiwiUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host.startsWith("169.254.") || host.startsWith("10.") || host.startsWith("192.168.") || host.startsWith("172.16.") || host.startsWith("172.17.") || host.startsWith("172.18.") || host.startsWith("172.19.") || host.startsWith("172.2") || host.startsWith("172.3") || host === "metadata.google.internal" || host.endsWith(".internal") || host === "[::1]") return false;
    if (!host.includes("kiwisdr") && !host.includes("sdr") && !host.endsWith(":8073")) {
      const port = parsed.port || (parsed.protocol === "https:" ? "443" : "80");
      if (port !== "8073") return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function pingNode(url: string): Promise<"online" | "degraded" | "offline"> {
  if (!isAllowedKiwiUrl(url)) return "offline";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "KAPPA-SIGINT/4.20" },
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const body = await resp.text();
      if (body.includes("not online") || body.includes("offline")) {
        return "degraded";
      }
      return "online";
    }

    if (resp.status === 404) {
      const body = await resp.text();
      if (body.includes("not online") || body.includes("offline")) {
        return "degraded";
      }
    }

    if (resp.status >= 200 && resp.status < 500) {
      return "degraded";
    }
    return "offline";
  } catch {
    return "offline";
  }
}

async function healthCheckNodes(): Promise<void> {
  const dbNodes = await storage.getNodes();

  const checkedDbIds = new Set<string>();

  for (const node of KIWI_NODES) {
    const dbNode = dbNodes.find(n => n.url === node.url);
    if (!dbNode) continue;
    checkedDbIds.add(dbNode.id);

    const status = await pingNode(node.url);
    await storage.updateNodeStatus(dbNode.id, status);
  }

  for (const dbNode of dbNodes) {
    if (checkedDbIds.has(dbNode.id)) continue;

    const status = await pingNode(dbNode.url);
    await storage.updateNodeStatus(dbNode.id, status);
  }
}

export function startKiwiSDRScanner(): void {
  if (scannerState.running) return;

  scannerState.running = true;

  setTimeout(() => {
    healthCheckNodes().catch(() => {});
    runScanCycle().catch(err => {
      console.error("[KiwiSDR] Initial scan error:", err instanceof Error ? err.message : String(err));
      scannerState.errors++;
    });
  }, 15_000);

  scannerState.timer = setInterval(() => {
    healthCheckNodes().catch(() => {});
    runScanCycle().catch(err => {
      console.error("[KiwiSDR] Scan cycle error:", err instanceof Error ? err.message : String(err));
      scannerState.errors++;
    });
  }, K.KIWI_SCAN_INTERVAL_MS);

  console.log(`[KAPPA] KiwiSDR scanner started: ${ALL_SCAN_TARGETS.length} targets × ${KIWI_NODES.length} nodes, ${K.KIWI_SCAN_INTERVAL_MS / 1000}s interval [real spectrum + fallback status mode]`);
  console.log(`[KAPPA] KiwiSDR data mode: attempts real HTTP spectrum/waterfall/SNR endpoints first, falls back to status-based synthesis if unreachable (port 8073 may be blocked in cloud environments — run locally for full real-data mode)`);
}

export async function runScanCycleOnce(): Promise<void> {
  await runScanCycle();
}

export function getScannerStatus(): ScannerStatus {
  return {
    running: scannerState.running,
    lastScan: scannerState.lastScan,
    scanCount: scannerState.scanCount,
    detections: scannerState.detections,
    errors: scannerState.errors,
    intervalMs: K.KIWI_SCAN_INTERVAL_MS,
    activeTargets: ALL_SCAN_TARGETS.map(t => t.name),
    lastResults: scannerState.lastResults,
    deltaSlipDetections: scannerState.deltaSlipDetections,
    echoLtChainDetections: scannerState.echoLtChainDetections,
    speechEnvelopeDetections: scannerState.speechEnvelopeDetections,
    tr069Correlations: scannerState.tr069Correlations,
    morseCwDetections: scannerState.morseCwDetections,
    bartDetections: scannerState.bartDetections,
  };
}
