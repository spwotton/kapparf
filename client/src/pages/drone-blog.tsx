/**
 * MIKHAIL HAMMER ENERGY PRESENTS:
 * Following Señor Zumbido — Daily Dispatches from the Jacó Crane
 * A sub-blog of The Goose Gazette | UAV Wildlife Division
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  RefreshCw, Zap, Camera, Trash2, Radio, Wifi,
  CloudRain, Moon, Sun, Briefcase, Coffee, AlertTriangle, Eye
} from "lucide-react";

interface DroneBlogPost {
  id: string;
  timestamp: string;
  category: "MORNING" | "WORK" | "LUNCH" | "SURVEILLANCE" | "INCIDENT" | "EVENING" | "NIGHT" | "BREAKING";
  headline: string;
  body: string;
  tweetText: string;
  imagePrompt: string;
  imageUrl?: string;
  realDataTags: string[];
  kappaScore?: number;
  bpf?: number;
  author: string;
}

const CATEGORY_META: Record<string, { icon: any; color: string; label: string }> = {
  MORNING:     { icon: Sun,          color: "bg-amber-100 text-amber-800 border-amber-200",    label: "MORNING DISPATCH" },
  WORK:        { icon: Briefcase,    color: "bg-slate-100 text-slate-800 border-slate-200",    label: "WORK UPDATE" },
  LUNCH:       { icon: Coffee,       color: "bg-stone-100 text-stone-800 border-stone-200",    label: "LUNCH BREAK" },
  SURVEILLANCE:{ icon: Eye,          color: "bg-zinc-100 text-zinc-800 border-zinc-200",       label: "SURVEILLANCE LOG" },
  INCIDENT:    { icon: AlertTriangle,color: "bg-orange-100 text-orange-800 border-orange-200", label: "INCIDENT REPORT" },
  EVENING:     { icon: CloudRain,    color: "bg-indigo-100 text-indigo-800 border-indigo-200", label: "EVENING WIND-DOWN" },
  NIGHT:       { icon: Moon,         color: "bg-gray-900 text-gray-300 border-gray-700",       label: "NIGHT MODE" },
  BREAKING:    { icon: Radio,        color: "bg-red-100 text-red-900 border-red-300",          label: "BREAKING" },
};

const CATEGORIES = ["MORNING","WORK","LUNCH","SURVEILLANCE","INCIDENT","EVENING","NIGHT","BREAKING"] as const;

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-CR", {
    timeZone: "America/Costa_Rica",
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function BpfIndicator({ bpf = 87.7 }: { bpf?: number }) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const iv = setInterval(() => setPulse(p => !p), 60000 / bpf);
    return () => clearInterval(iv);
  }, [bpf]);
  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-600 dark:text-emerald-400">
      <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 transition-all duration-75 ${pulse ? "opacity-100 scale-125" : "opacity-40"}`} />
      {bpf} Hz
    </span>
  );
}

function PostCard({
  post,
  onDelete,
  onGenImage,
  imageLoading,
}: {
  post: DroneBlogPost;
  onDelete: (id: string) => void;
  onGenImage: (id: string, prompt: string) => void;
  imageLoading: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[post.category] ?? CATEGORY_META.WORK;
  const Icon = meta.icon;

  return (
    <article
      data-testid={`drone-post-${post.id}`}
      className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 mb-4"
    >
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <span className={`inline-flex items-center gap-1 text-[10px] font-black tracking-widest uppercase px-2 py-0.5 border ${meta.color}`}>
          <Icon size={10} />
          {meta.label}
        </span>
        {post.category === "BREAKING" && (
          <span className="animate-pulse text-[10px] font-black text-red-600 tracking-widest">● LIVE</span>
        )}
        <span className="ml-auto text-[10px] text-gray-400 font-mono">{formatTime(post.timestamp)}</span>
        <BpfIndicator bpf={post.bpf} />
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-900" style={{ maxHeight: 320 }}>
          <img
            src={post.imageUrl}
            alt={`Señor Zumbido — ${post.category}`}
            className="w-full object-cover"
            data-testid={`drone-post-image-${post.id}`}
          />
          <div className="absolute bottom-0 left-0 right-0 px-3 py-1 bg-black/60 text-[9px] text-gray-300 font-sans">
            AI-generated illustration — <em>Mikhail Hammer / The Goose Gazette UAV Division</em>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="px-5 py-4">
        <h2
          className="font-black font-serif text-lg leading-tight text-gray-950 dark:text-gray-50 mb-1 cursor-pointer hover:underline"
          onClick={() => setExpanded(e => !e)}
          data-testid={`drone-headline-${post.id}`}
        >
          {post.headline}
        </h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-500 font-sans mb-3">
          By <strong>{post.author}</strong> · Jacó Bureau
        </p>

        {expanded ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {post.body.split("\n\n").map((para, i) => (
              <p key={i} className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{para}</p>
            ))}
          </div>
        ) : (
          <p
            className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3 cursor-pointer"
            onClick={() => setExpanded(true)}
          >
            {post.body.slice(0, 220)}…
          </p>
        )}

        {/* Tweet card */}
        {expanded && post.tweetText && (
          <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">𝕏 Post</span>
            </div>
            <p className="text-sm font-mono text-gray-800 dark:text-gray-200">{post.tweetText}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 text-xs h-6"
              onClick={() => {
                const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.tweetText)}`;
                window.open(url, "_blank");
              }}
              data-testid={`tweet-btn-${post.id}`}
            >
              Post to 𝕏
            </Button>
          </div>
        )}

        {/* Real data tags */}
        <div className="mt-3 flex flex-wrap gap-1">
          {post.realDataTags.map(tag => (
            <span
              key={tag}
              className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-2 px-5 py-2 border-t border-gray-100 dark:border-gray-800">
        {!post.imageUrl && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs gap-1"
            disabled={imageLoading === post.id}
            onClick={() => onGenImage(post.id, post.imagePrompt)}
            data-testid={`gen-image-btn-${post.id}`}
          >
            <Camera size={10} />
            {imageLoading === post.id ? "Generating…" : "Generate Image"}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-xs gap-1 ml-auto text-gray-400 hover:text-red-500"
          onClick={() => onDelete(post.id)}
          data-testid={`delete-post-btn-${post.id}`}
        >
          <Trash2 size={10} />
        </Button>
      </div>
    </article>
  );
}

function KappaLiveFeed({ onKappaCtx }: { onKappaCtx: (ctx: any) => void }) {
  const { data } = useQuery<any>({
    queryKey: ["/api/kappa/status"],
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (data) {
      onKappaCtx({
        kappaScore: data.kappaScore,
        threatLevel: data.threatLevel,
        totalEvents: data.totalEvents,
        activeDomains: data.activeDomains,
        satelliteCount: data.satelliteCount,
        weatherCondition: data.weatherCondition,
        recentEvents: (data.recentEvents ?? []).slice(0, 5),
      });
    }
  }, [data, onKappaCtx]);

  if (!data) return null;

  return (
    <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 mb-4">
      <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2">Live KAPPA Feed → Zumbido Mood</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">Stress Level</p>
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${data.kappaScore ?? 0}%`, backgroundColor: (data.kappaScore ?? 0) > 70 ? "#ef4444" : (data.kappaScore ?? 0) > 40 ? "#f59e0b" : "#10b981" }}
              />
            </div>
            <span className="text-xs font-black font-mono">{data.kappaScore ?? "–"}</span>
          </div>
        </div>
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">Heartbeat</p>
          <BpfIndicator bpf={87.7} />
          <span className="text-[9px] text-gray-400 ml-1">confirmed</span>
        </div>
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">Mood</p>
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
            {(data.kappaScore ?? 0) > 70 ? "OVERWORKED" : (data.kappaScore ?? 0) > 40 ? "FOCUSED" : "LEISURE HOVER"}
          </p>
        </div>
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">Management</p>
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
            {data.satelliteCount ?? 0} satellites overhead
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DroneBlogPage() {
  const qc = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>("WORK");
  const [imageLoading, setImageLoading] = useState<string | null>(null);
  const [kappaCtx, setKappaCtx] = useState<any>({});

  const { data: feedData, isLoading } = useQuery<{ posts: DroneBlogPost[]; count: number }>({
    queryKey: ["/api/drone-blog/feed"],
    refetchInterval: 60000,
  });

  const generateMutation = useMutation({
    mutationFn: (vars: { category: string; kappaCtx: any }) =>
      apiRequest("POST", "/api/drone-blog/generate", vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/drone-blog/feed"] }),
  });

  const seedMutation = useMutation({
    mutationFn: (ctx: any) => apiRequest("POST", "/api/drone-blog/seed", { kappaCtx: ctx }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/drone-blog/feed"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/drone-blog/post/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/drone-blog/feed"] }),
  });

  const imageMutation = useMutation({
    mutationFn: ({ postId, prompt }: { postId: string; prompt: string }) =>
      apiRequest("POST", "/api/drone-blog/generate-image", { postId, prompt }),
    onSuccess: () => {
      setImageLoading(null);
      qc.invalidateQueries({ queryKey: ["/api/drone-blog/feed"] });
    },
    onError: () => setImageLoading(null),
  });

  const posts = feedData?.posts ?? [];
  const isEmpty = !isLoading && posts.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-serif">
      {/* Masthead */}
      <header className="border-b-4 border-black dark:border-gray-100 bg-white dark:bg-black text-black dark:text-white">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <p className="text-[9px] font-sans font-black tracking-[0.3em] uppercase text-gray-500 mb-1">
            The Goose Gazette · UAV Wildlife Division · Sub-Publication №7
          </p>
          <h1 className="text-4xl font-black font-serif leading-none tracking-tight">
            MIKHAIL HAMMER ENERGY
          </h1>
          <p className="text-[11px] font-sans tracking-[0.2em] uppercase text-gray-600 dark:text-gray-400 mt-0.5">
            Following Señor Zumbido · Jacó Bureau · Aerial Life Correspondent
          </p>
          <Separator className="my-3 bg-black dark:bg-gray-100" />
          <div className="flex items-center gap-4 text-[9px] font-sans font-black tracking-widest uppercase text-gray-600 dark:text-gray-400">
            <span>87.7 Hz · DJI Mini 2/3 Class</span>
            <span>·</span>
            <span>Vista Las Palmas Crane · Jacó, CR</span>
            <span>·</span>
            <span>Est. 2026 (drone est. unknown)</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main feed */}
        <div className="lg:col-span-2">
          {/* Dateline */}
          <p className="text-[10px] font-sans text-gray-400 uppercase tracking-widest mb-4">
            {new Date().toLocaleDateString("en-CR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} · Jacó, Costa Rica
          </p>

          {isLoading && (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-48 bg-gray-100 dark:bg-gray-900 animate-pulse border border-gray-200 dark:border-gray-800" />
              ))}
            </div>
          )}

          {isEmpty && (
            <div className="border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
              <p className="text-2xl mb-2">🚁</p>
              <p className="text-sm font-serif text-gray-600 dark:text-gray-400 mb-4">
                Señor Zumbido has not yet been documented.<br />
                Mikhail Hammer is standing by.
              </p>
              <Button
                onClick={() => seedMutation.mutate(kappaCtx)}
                disabled={seedMutation.isPending}
                data-testid="seed-posts-btn"
                className="gap-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                <Zap size={14} />
                {seedMutation.isPending ? "Filing first dispatches…" : "Begin Coverage"}
              </Button>
            </div>
          )}

          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={id => deleteMutation.mutate(id)}
              onGenImage={(id, prompt) => {
                setImageLoading(id);
                imageMutation.mutate({ postId: id, prompt });
              }}
              imageLoading={imageLoading}
            />
          ))}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Live KAPPA feed */}
          <KappaLiveFeed onKappaCtx={setKappaCtx} />

          {/* Generate controls */}
          <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
            <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-3">
              File a New Dispatch
            </p>
            <div className="grid grid-cols-2 gap-1 mb-3">
              {CATEGORIES.map(cat => {
                const meta = CATEGORY_META[cat];
                const Icon = meta.icon;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    data-testid={`category-btn-${cat}`}
                    className={`flex items-center gap-1 text-[9px] font-black tracking-wider uppercase px-2 py-1.5 border transition-all ${
                      selectedCategory === cat
                        ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400"
                    }`}
                  >
                    <Icon size={9} />
                    {cat}
                  </button>
                );
              })}
            </div>
            <Button
              className="w-full gap-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 text-xs"
              onClick={() => generateMutation.mutate({ category: selectedCategory, kappaCtx })}
              disabled={generateMutation.isPending}
              data-testid="generate-post-btn"
            >
              <RefreshCw size={12} className={generateMutation.isPending ? "animate-spin" : ""} />
              {generateMutation.isPending ? "Mikhail is filing…" : `File ${selectedCategory} Dispatch`}
            </Button>
            {generateMutation.isSuccess && (
              <p className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-2 font-sans text-center">
                ✓ Dispatch filed successfully
              </p>
            )}
          </div>

          {/* About */}
          <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
            <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2">About This Correspondent</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-sans">
              <strong className="font-black text-gray-900 dark:text-gray-100">Mikhail Hammer</strong> covers UAV wildlife for the Goose Gazette's aerial life division. He has followed Señor Zumbido since his first recorded hover on Vista Las Palmas Street, and considers the drone's 87.7 Hz heartbeat "one of the most emotionally complex signatures I have ever had the privilege to document."
            </p>
            <Separator className="my-3" />
            <p className="text-[9px] text-gray-400 font-sans leading-relaxed">
              All posts are generated from <strong>real KAPPA signal intelligence data</strong> including forensic acoustic analysis (BPF 87.7 Hz confirmed, DJI Mini 2/3 class), live Kappa Score, satellite tracking, and KiwiSDR RF detections. The narrative layer is fictional. The drone is real.
            </p>
          </div>

          {/* Signal facts */}
          <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
            <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-3">Confirmed Field Data</p>
            <div className="space-y-2 font-mono text-xs">
              {[
                { label: "BPF Primary", value: "87.7 Hz" },
                { label: "Harmonic", value: "194.4 Hz (×2.22)" },
                { label: "DJI Band Hit", value: "101.8 Hz" },
                { label: "Platform", value: "DJI Mini 2/3 class" },
                { label: "Duration", value: "112.23s hover" },
                { label: "Drone band", value: "64–88% spectral power" },
                { label: "Rotor RPM", value: "~1,315 RPM" },
                { label: "Location", value: "Hotel Pochote Grande" },
                { label: "Filed", value: "NR14 forensic report" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-400 text-[10px]">{label}</span>
                  <span className="text-gray-800 dark:text-gray-200 text-[10px] font-black">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
