import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RecentRow {
  articleId: string;
  headline: string;
  apRigidity: number;
  premiseAbsurdity: number;
  jokeDiscipline: number;
  specificityCarrier: number;
  resolutionUnresolved: number;
  overall: number;
  summary: string;
  scoredAt: string;
}

interface HumorStats {
  rollingAvg: {
    apRigidity: number;
    premiseAbsurdity: number;
    jokeDiscipline: number;
    specificityCarrier: number;
    resolutionUnresolved: number;
    overall: number;
    sampleSize: number;
  };
  exemplars: Array<{ headline: string; overall: number; whyItWorked: string }>;
  failures: Array<{ headline: string; overall: number; whatToAvoid: string }>;
  recent?: RecentRow[];
  hypervisor?: { running: boolean; cycleCount: number; lastCycleAt: number | null; cycleMs: number };
}

const DIMS: Array<{ key: keyof RecentRow; label: string; short: string }> = [
  { key: "apRigidity", label: "AP Rigidity", short: "AP" },
  { key: "premiseAbsurdity", label: "Premise Absurdity", short: "Premise" },
  { key: "jokeDiscipline", label: "Joke Discipline", short: "Discipline" },
  { key: "specificityCarrier", label: "Specificity Carrier", short: "Carrier" },
  { key: "resolutionUnresolved", label: "Resolution Unresolved", short: "Resolution" },
];

function toneClass(score: number): string {
  if (score >= 75) return "text-green-600 dark:text-green-400";
  if (score >= 55) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length === 0) {
    return <div className="text-xs text-gray-500 dark:text-gray-400">No data</div>;
  }
  const w = 160;
  const h = 36;
  const min = 0;
  const max = 100;
  const step = values.length > 1 ? w / (values.length - 1) : 0;
  const pts = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / (max - min)) * h).toFixed(1)}`)
    .join(" ");
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const avgY = h - ((avg - min) / (max - min)) * h;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible"
      data-testid={`sparkline-${label}`}
    >
      <line
        x1={0}
        x2={w}
        y1={avgY}
        y2={avgY}
        stroke="currentColor"
        strokeOpacity={0.15}
        strokeDasharray="2 2"
      />
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={1.5} />
      {values.map((v, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={h - ((v - min) / (max - min)) * h}
          r={1.5}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

interface ArticleDetail {
  article: {
    id: string;
    headline: string;
    subhead: string | null;
    body: string;
    tag: string;
    publishedAt: string;
    authorByline: string | null;
  };
  score: {
    overall: number;
    apRigidity: number;
    premiseAbsurdity: number;
    jokeDiscipline: number;
    specificityCarrier: number;
    resolutionUnresolved: number;
    rubricVersion: number;
    scoredAt: string;
  } | null;
  notes: Record<string, string> | null;
  summary: string | null;
}

function ArticleRow({
  row,
  expanded,
  onToggle,
}: {
  row: RecentRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: detail, isLoading: detailLoading } = useQuery<ArticleDetail>({
    queryKey: ["/api/goose/articles", row.articleId],
    enabled: expanded,
  });

  const rejudge = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/humor-hypervisor/evaluate/${row.articleId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Re-judged", description: "Fresh scores saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/goose/humor-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goose/articles", row.articleId] });
    },
    onError: (e: any) => {
      toast({
        title: "Re-judge failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <tr
        className="border-b border-gray-100 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-gray-950 cursor-pointer"
        data-testid={`row-article-${row.articleId}`}
        onClick={onToggle}
      >
        <td className="px-4 py-2">
          <div className="flex items-start gap-2">
            <span
              className="text-gray-400 dark:text-gray-600 font-mono text-xs mt-0.5 select-none"
              aria-hidden
            >
              {expanded ? "▾" : "▸"}
            </span>
            <div className="min-w-0">
              <div className="font-medium truncate max-w-xs" title={row.headline}>
                {row.headline}
              </div>
              {row.summary && (
                <div
                  className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs"
                  title={row.summary}
                >
                  {row.summary}
                </div>
              )}
            </div>
          </div>
        </td>
        {DIMS.map((d) => (
          <td
            key={d.key as string}
            className={`px-2 py-2 text-right font-mono ${toneClass(row[d.key] as number)}`}
          >
            {row[d.key] as number}
          </td>
        ))}
        <td className={`px-2 py-2 text-right font-mono font-semibold ${toneClass(row.overall)}`}>
          {row.overall}
        </td>
        <td className="px-4 py-2 text-right text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {new Date(row.scoredAt).toLocaleString()}
        </td>
      </tr>
      {expanded && (
        <tr
          className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800"
          data-testid={`row-detail-${row.articleId}`}
        >
          <td colSpan={DIMS.length + 3} className="px-6 py-4">
            {detailLoading && (
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading details…</div>
            )}
            {!detailLoading && detail && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Judge breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                      Judge Breakdown
                    </h3>
                    <button
                      type="button"
                      onClick={() => rejudge.mutate()}
                      disabled={rejudge.isPending}
                      className="text-xs px-2.5 py-1 border border-gray-300 dark:border-gray-700 rounded hover:bg-white dark:hover:bg-black disabled:opacity-50"
                      data-testid={`button-rejudge-${row.articleId}`}
                    >
                      {rejudge.isPending ? "Re-judging…" : "Re-judge"}
                    </button>
                  </div>
                  {detail.summary && (
                    <div
                      className="text-sm text-gray-700 dark:text-gray-300 border-l-2 border-gray-300 dark:border-gray-700 pl-3 italic"
                      data-testid={`text-overall-summary-${row.articleId}`}
                    >
                      {detail.summary}
                    </div>
                  )}
                  <ul className="space-y-2">
                    {DIMS.map((d) => {
                      const score = row[d.key] as number;
                      const note = detail.notes?.[d.key as string] ?? "";
                      return (
                        <li
                          key={d.key as string}
                          className="text-sm"
                          data-testid={`note-${d.key as string}-${row.articleId}`}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {d.label}
                            </span>
                            <span className={`font-mono ${toneClass(score)}`}>{score}</span>
                          </div>
                          {note ? (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              {note}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 dark:text-gray-600 mt-0.5 italic">
                              No note recorded.
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Article body */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                    Original Article
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {detail.article.tag}
                    {detail.article.authorByline ? ` · ${detail.article.authorByline}` : ""}
                  </div>
                  <h4
                    className="text-base font-semibold text-gray-900 dark:text-gray-100"
                    data-testid={`text-article-headline-${row.articleId}`}
                  >
                    {detail.article.headline}
                  </h4>
                  {detail.article.subhead && (
                    <div
                      className="text-sm text-gray-700 dark:text-gray-300"
                      data-testid={`text-article-subhead-${row.articleId}`}
                    >
                      {detail.article.subhead}
                    </div>
                  )}
                  <div
                    className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto pr-2"
                    data-testid={`text-article-body-${row.articleId}`}
                  >
                    {detail.article.body}
                  </div>
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function GooseHumorPage() {
  const { data, isLoading } = useQuery<HumorStats>({
    queryKey: ["/api/goose/humor-stats"],
    refetchInterval: 60 * 1000,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const recent = data?.recent ?? [];
  // Sparklines: oldest -> newest, so reverse from API (which is newest-first)
  const chrono = [...recent].reverse();

  const handleDownloadCsv = () => {
    const headers = [
      "articleId",
      "headline",
      "apRigidity",
      "premiseAbsurdity",
      "jokeDiscipline",
      "specificityCarrier",
      "resolutionUnresolved",
      "overall",
      "scoredAt",
      "summary",
    ];
    const escape = (val: unknown): string => {
      const s = val === null || val === undefined ? "" : String(val);
      if (/[",\n\r]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const rows = recent.map((r) =>
      [
        r.articleId,
        r.headline,
        r.apRigidity,
        r.premiseAbsurdity,
        r.jokeDiscipline,
        r.specificityCarrier,
        r.resolutionUnresolved,
        r.overall,
        r.scoredAt,
        r.summary,
      ]
        .map(escape)
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `goose-humor-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="min-h-screen bg-white dark:bg-black text-black dark:text-gray-100 p-6"
      data-testid="page-goose-humor"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">
              Humor Hypervisor
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Per-article humor scores across 5 dimensions, judged by gpt-4o-mini.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={recent.length === 0}
              className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-download-csv"
            >
              Download CSV
            </button>
            <Link
              href="/goose"
              className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-900"
              data-testid="link-back-gazette"
            >
              ← Gazette
            </Link>
          </div>
        </div>

        {/* Status row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="border border-gray-200 dark:border-gray-800 rounded p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Overall κ-humor
            </div>
            <div
              className={`text-2xl font-mono mt-1 ${toneClass(data?.rollingAvg.overall ?? 0)}`}
              data-testid="text-overall-avg"
            >
              {data?.rollingAvg.overall?.toFixed(1) ?? "—"}
            </div>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Sample Size
            </div>
            <div className="text-2xl font-mono mt-1" data-testid="text-sample-size">
              {data?.rollingAvg.sampleSize ?? 0}
            </div>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Cycles
            </div>
            <div className="text-2xl font-mono mt-1" data-testid="text-cycle-count">
              {data?.hypervisor?.cycleCount ?? 0}
            </div>
          </div>
          <div className="border border-gray-200 dark:border-gray-800 rounded p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Last Cycle
            </div>
            <div className="text-sm font-mono mt-1" data-testid="text-last-cycle">
              {data?.hypervisor?.lastCycleAt
                ? new Date(data.hypervisor.lastCycleAt).toLocaleTimeString()
                : "—"}
            </div>
          </div>
        </div>

        {/* Sparklines per dimension */}
        <section className="border border-gray-200 dark:border-gray-800 rounded p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-3">
            Rolling Trend by Dimension
          </h2>
          {isLoading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>
          ) : chrono.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400" data-testid="text-no-data">
              No scored articles yet. The Humor Hypervisor warms up 5 minutes after server start
              and runs every 10 minutes.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DIMS.map((d) => {
                const vals = chrono.map((r) => r[d.key] as number);
                const avg = (data?.rollingAvg[d.key as keyof typeof data.rollingAvg] as number) ?? 0;
                return (
                  <div
                    key={d.key as string}
                    className="space-y-1"
                    data-testid={`card-dim-${d.key as string}`}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{d.label}</span>
                      <span className={`font-mono text-lg ${toneClass(avg)}`}>
                        {avg.toFixed(1)}
                      </span>
                    </div>
                    <div className={toneClass(avg)}>
                      <Sparkline values={vals} label={d.key as string} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Exemplars + Failures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="border border-gray-200 dark:border-gray-800 rounded p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-green-700 dark:text-green-400 mb-3">
              Top 3 Exemplars
            </h2>
            <ul className="space-y-3">
              {(data?.exemplars ?? []).map((e, i) => (
                <li
                  key={i}
                  className="text-sm border-l-2 border-green-700/40 pl-3"
                  data-testid={`item-exemplar-${i}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">{e.headline}</span>
                    <span className={`font-mono ${toneClass(e.overall)}`}>{e.overall}</span>
                  </div>
                  {e.whyItWorked && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {e.whyItWorked}
                    </div>
                  )}
                </li>
              ))}
              {(data?.exemplars ?? []).length === 0 && (
                <li className="text-sm text-gray-500 dark:text-gray-400">No exemplars yet.</li>
              )}
            </ul>
          </section>

          <section className="border border-gray-200 dark:border-gray-800 rounded p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-red-700 dark:text-red-400 mb-3">
              Bottom 3 Failures
            </h2>
            <ul className="space-y-3">
              {(data?.failures ?? []).map((f, i) => (
                <li
                  key={i}
                  className="text-sm border-l-2 border-red-700/40 pl-3"
                  data-testid={`item-failure-${i}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">{f.headline}</span>
                    <span className={`font-mono ${toneClass(f.overall)}`}>{f.overall}</span>
                  </div>
                  {f.whatToAvoid && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {f.whatToAvoid}
                    </div>
                  )}
                </li>
              ))}
              {(data?.failures ?? []).length === 0 && (
                <li className="text-sm text-gray-500 dark:text-gray-400">No failures yet.</li>
              )}
            </ul>
          </section>
        </div>

        {/* Per-article table */}
        <section className="border border-gray-200 dark:border-gray-800 rounded">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Recent Articles ({recent.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-recent-articles">
              <thead className="text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-4 py-2">Headline</th>
                  {DIMS.map((d) => (
                    <th key={d.key as string} className="px-2 py-2 text-right" title={d.label}>
                      {d.short}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-right">Overall</th>
                  <th className="px-4 py-2 text-right">Scored</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <ArticleRow
                    key={r.articleId}
                    row={r}
                    expanded={expandedId === r.articleId}
                    onToggle={() =>
                      setExpandedId((cur) => (cur === r.articleId ? null : r.articleId))
                    }
                  />
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td
                      colSpan={DIMS.length + 3}
                      className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No scored articles yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
