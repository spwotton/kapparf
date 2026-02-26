import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { GOS_CONSTANTS } from "@shared/schema";
import { Calculator } from "lucide-react";

const constantsData = [
  {
    name: "Kappa",
    symbol: "\u03BA",
    value: GOS_CONSTANTS.KAPPA,
    definition: "4/\u03C0 \u2014 holographic compression constant (circle-squaring)",
    precision: 10,
  },
  {
    name: "Klein Twist",
    symbol: "\u03B8\u2096",
    value: GOS_CONSTANTS.THETA_K,
    definition: "180\u00B0 \u2212 arctan(4/\u03C0) \u2014 quantum-classical decoherence boundary",
    precision: 4,
  },
  {
    name: "Phi (Golden Ratio)",
    symbol: "\u03C6",
    value: GOS_CONSTANTS.PHI,
    definition: "(1 + \u221A5) / 2 \u2014 recursive growth scaling factor",
    precision: 10,
  },
  {
    name: "Kappa-Second",
    symbol: "\u03BA\u209B",
    value: GOS_CONSTANTS.KAPPA_SECOND,
    definition: "46.875 seconds \u2014 detection loop interval",
    precision: 3,
  },
  {
    name: "Target Frequency 1",
    symbol: "f\u2081",
    value: GOS_CONSTANTS.TARGET_FREQ_1,
    definition: "46.875 Hz \u2014 Congusto beacon carrier",
    precision: 3,
  },
  {
    name: "Target Frequency 2",
    symbol: "f\u2082",
    value: GOS_CONSTANTS.TARGET_FREQ_2,
    definition: "74.9 Hz \u2014 Hall sideband (1.598\u00D7 multiplier)",
    precision: 3,
  },
  {
    name: "Hall Multiplier",
    symbol: "\u03BB\u2095",
    value: GOS_CONSTANTS.HALL_MULTIPLIER,
    definition: "1.598 \u2014 f\u2082/f\u2081 frequency ratio",
    precision: 3,
  },
  {
    name: "FFT Size",
    symbol: "N",
    value: GOS_CONSTANTS.FFT_SIZE,
    definition: "1024-point FFT for bin alignment at 48 kHz",
    precision: 0,
  },
  {
    name: "Sample Rate",
    symbol: "f\u209B",
    value: GOS_CONSTANTS.SAMPLE_RATE,
    definition: "48,000 Hz \u2014 KiwiSDR standard sample rate",
    precision: 0,
  },
  {
    name: "Min Elevation",
    symbol: "el\u2098\u1D62\u2099",
    value: GOS_CONSTANTS.MIN_ELEVATION,
    definition: "30\u00B0 \u2014 minimum satellite elevation for trigger",
    precision: 0,
  },
];

export default function ConstantsPage() {
  const { t } = useI18n();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">{t("constants.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("constants.description")}</p>
      </div>

      <div className="border rounded-md">
        <div className="grid grid-cols-4 gap-2 p-3 text-xs font-medium text-muted-foreground border-b">
          <span>{t("constants.name")}</span>
          <span>{t("constants.symbol")}</span>
          <span>{t("constants.value")}</span>
          <span>{t("constants.definition")}</span>
        </div>
        {constantsData.map((c) => (
          <div
            key={c.name}
            className="grid grid-cols-4 gap-2 p-3 text-sm border-b last:border-b-0 items-start"
            data-testid={`row-constant-${c.symbol}`}
          >
            <span className="font-medium">{c.name}</span>
            <span className="font-serif text-base">{c.symbol}</span>
            <span className="font-mono text-xs tabular-nums">
              {c.precision === 0 ? c.value.toLocaleString() : c.value.toFixed(c.precision)}
            </span>
            <span className="text-xs text-muted-foreground leading-relaxed">{c.definition}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Derived Values</CardTitle>
          </div>
          <CardDescription className="text-xs">Computed from the primary constants.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                label: "Bin Resolution",
                value: `${(GOS_CONSTANTS.SAMPLE_RATE / GOS_CONSTANTS.FFT_SIZE).toFixed(6)} Hz`,
                formula: "f\u209B / N",
              },
              {
                label: "\u03BA \u00D7 \u03C6",
                value: (GOS_CONSTANTS.KAPPA * GOS_CONSTANTS.PHI).toFixed(10),
                formula: "(4/\u03C0) \u00D7 (1+\u221A5)/2",
              },
              {
                label: "7/4 Ratio",
                value: (7 / 4).toFixed(4),
                formula: "FMO clamping invariant",
              },
              {
                label: "\u03B8\u2096 + Pyramid Slope",
                value: (GOS_CONSTANTS.THETA_K + 51.84).toFixed(4) + "\u00B0",
                formula: "\u03B8\u2096 + 51.84\u00B0 \u2248 180\u00B0",
              },
            ].map((item) => (
              <div key={item.label} className="space-y-0.5">
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="text-sm font-mono">{item.value}</div>
                <div className="text-[11px] text-muted-foreground">{item.formula}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
