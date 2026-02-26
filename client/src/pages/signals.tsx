import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { GOS_CONSTANTS, type DetectionEvent } from "@shared/schema";
import { Radio, Settings2 } from "lucide-react";

export default function SignalsPage() {
  const { t } = useI18n();

  const binResolution = GOS_CONSTANTS.SAMPLE_RATE / GOS_CONSTANTS.FFT_SIZE;
  const targetBin1 = Math.round(GOS_CONSTANTS.TARGET_FREQ_1 / binResolution);
  const targetBin2 = Math.round(GOS_CONSTANTS.TARGET_FREQ_2 / binResolution);

  const { data: detections, isLoading } = useQuery<DetectionEvent[]>({
    queryKey: ["/api/detections"],
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">{t("signals.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("signals.description")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("signals.target1")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm text-muted-foreground">{t("signals.freq")}</span>
                <span className="text-sm font-mono" data-testid="text-target-freq-1">{GOS_CONSTANTS.TARGET_FREQ_1} Hz</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm text-muted-foreground">Bin</span>
                <span className="text-sm font-mono">#{targetBin1}</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="text-sm">Congusto beacon carrier</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t("signals.target2")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm text-muted-foreground">{t("signals.freq")}</span>
                <span className="text-sm font-mono" data-testid="text-target-freq-2">{GOS_CONSTANTS.TARGET_FREQ_2} Hz</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm text-muted-foreground">Multiplier</span>
                <span className="text-sm font-mono">{GOS_CONSTANTS.HALL_MULTIPLIER}x</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm text-muted-foreground">Bin</span>
                <span className="text-sm font-mono">#{targetBin2}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{t("signals.fftConfig")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t("signals.fftSize"), value: `${GOS_CONSTANTS.FFT_SIZE} pt` },
              { label: t("signals.sampleRate"), value: `${GOS_CONSTANTS.SAMPLE_RATE} Hz` },
              { label: t("signals.binRes"), value: `${binResolution.toFixed(3)} Hz` },
              { label: t("signals.targetBin1"), value: `#${targetBin1}` },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                <div className="text-sm font-mono" data-testid={`text-fft-${item.label}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-medium mb-3">{t("signals.recentTitle")}</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : !detections || detections.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {t("signals.noData")}
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-md">
            <div className="grid grid-cols-6 gap-2 p-3 text-xs font-medium text-muted-foreground border-b">
              <span>{t("signals.freq")}</span>
              <span>{t("signals.amplitude")}</span>
              <span>{t("signals.snr")}</span>
              <span>{t("signals.confidence")}</span>
              <span>{t("signals.source")}</span>
              <span>{t("signals.time")}</span>
            </div>
            {detections.map((d) => (
              <div key={d.id} className="grid grid-cols-6 gap-2 p-3 text-sm border-b last:border-b-0" data-testid={`row-detection-${d.id}`}>
                <span className="font-mono">{d.frequency.toFixed(3)}</span>
                <span className="font-mono">{d.amplitude.toFixed(2)}</span>
                <span className="font-mono">{d.snr.toFixed(1)} dB</span>
                <span className="font-mono">{d.confidence.toFixed(0)}%</span>
                <Badge variant="secondary" className="w-fit">{d.source}</Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date(d.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
