import OpenAI from "openai";
import { type Correlation, type SignalEvent, type CorrelationFeedback } from "@shared/schema";

let openai: OpenAI | null = null;
let openrouterClient: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (openai) return openai;
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
    openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
    return openai;
  }
  return null;
}

function getOpenRouterClient(): OpenAI | null {
  if (openrouterClient) return openrouterClient;
  if (process.env.OPENROUTER_API_KEY) {
    openrouterClient = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });
    return openrouterClient;
  }
  return null;
}

type ModelRoute = "reasoning" | "generation" | "vision";

function pickModel(route: ModelRoute): { client: OpenAI; model: string; provider: string } | null {
  const or = getOpenRouterClient();
  const ai = getClient();

  if (route === "reasoning") {
    if (or) return { client: or, model: "openai/o3-mini", provider: "openrouter" };
    if (ai) return { client: ai, model: "o3-mini", provider: "replit-ai" };
    return null;
  }
  if (route === "generation") {
    if (or) return { client: or, model: "deepseek/deepseek-chat-v3-0324", provider: "openrouter" };
    if (ai) return { client: ai, model: "gpt-4o-mini", provider: "replit-ai" };
    return null;
  }
  if (route === "vision") {
    if (ai) return { client: ai, model: "gpt-4o", provider: "replit-ai" };
    if (or) return { client: or, model: "openai/gpt-4o", provider: "openrouter" };
    return null;
  }
  return null;
}

const callTimestamps: number[] = [];
const MAX_CALLS_PER_MINUTE = 10;

async function rateLimitedCall<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const windowStart = now - 60000;
  while (callTimestamps.length > 0 && callTimestamps[0] < windowStart) {
    callTimestamps.shift();
  }
  if (callTimestamps.length >= MAX_CALLS_PER_MINUTE) {
    const waitMs = callTimestamps[0] - windowStart + 100;
    await new Promise(r => setTimeout(r, waitMs));
  }
  callTimestamps.push(Date.now());
  return fn();
}

export interface CorrelationAnalysis {
  significance: string;
  explanation: string;
  recommendedActions: string[];
  patternType: string;
  confidence: number;
  fallback?: boolean;
}

export interface IntelligenceReport {
  summary: string;
  trends: string[];
  anomalies: string[];
  recommendations: string[];
  fallback?: boolean;
}

export interface RuleAdjustment {
  ruleId: string;
  suggestedWeight: number;
  reason: string;
}

function heuristicAnalysis(correlation: Correlation, events: SignalEvent[]): CorrelationAnalysis {
  const domains = new Set(events.map(e => e.domain));
  const severity = correlation.severity;
  const domainCount = domains.size;

  let significance = "Low";
  let patternType = "temporal-coincidence";

  if (severity >= 4) {
    significance = "High";
    patternType = "multi-domain-correlation";
  } else if (severity >= 3) {
    significance = "Medium";
    patternType = "cross-domain-pattern";
  }

  if (domainCount >= 3) {
    significance = "High";
    patternType = "full-spectrum-correlation";
  }

  return {
    significance,
    explanation: `${domainCount} domain(s) correlated via rule "${correlation.ruleName}" with severity ${severity}/5. Events span ${domains.size} signal domains: ${Array.from(domains).join(", ")}.`,
    recommendedActions: [
      "Continue monitoring affected domains",
      domainCount >= 3 ? "Investigate cross-domain timing patterns" : "Watch for additional domain involvement",
      severity >= 4 ? "Escalate to active analysis" : "Log for trend analysis",
    ],
    patternType,
    confidence: Math.min(0.95, 0.3 + severity * 0.12 + domainCount * 0.08),
    fallback: true,
  };
}

function heuristicReport(correlations: Correlation[]): IntelligenceReport {
  const ruleFreq: Record<string, number> = {};
  let highSeverity = 0;
  for (const c of correlations) {
    ruleFreq[c.ruleName] = (ruleFreq[c.ruleName] || 0) + 1;
    if (c.severity >= 4) highSeverity++;
  }

  const topRules = Object.entries(ruleFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return {
    summary: `${correlations.length} correlations detected. ${highSeverity} high-severity events. Top pattern: ${topRules[0]?.[0] || "none"} (${topRules[0]?.[1] || 0} occurrences).`,
    trends: topRules.map(([name, count]) => `${name}: ${count} occurrences`),
    anomalies: highSeverity > 0
      ? [`${highSeverity} high-severity correlations detected — potential coordinated activity`]
      : ["No high-severity patterns detected in this window"],
    recommendations: [
      "Review top correlation rules for tuning opportunities",
      highSeverity > 0 ? "Investigate high-severity correlation clusters" : "Continue baseline monitoring",
    ],
    fallback: true,
  };
}

export async function analyzeCorrelation(
  correlation: Correlation,
  events: SignalEvent[]
): Promise<CorrelationAnalysis> {
  const routed = pickModel("reasoning");
  if (!routed) return heuristicAnalysis(correlation, events);

  try {
    return await rateLimitedCall(async () => {
      const response = await routed.client.chat.completions.create({
        model: routed.model,
        messages: [
          {
            role: "system",
            content: "You are a SIGINT analyst. Analyze the correlation and return JSON with fields: significance (string), explanation (string), recommendedActions (string[]), patternType (string), confidence (number 0-1). Be concise and technical.",
          },
          {
            role: "user",
            content: JSON.stringify({
              correlation: {
                ruleName: correlation.ruleName,
                description: correlation.description,
                severity: correlation.severity,
                eventCount: correlation.eventIds.length,
                metadata: correlation.metadata,
              },
              events: events.slice(0, 10).map(e => ({
                domain: e.domain,
                source: e.source,
                eventType: e.eventType,
                frequency: e.frequency,
                confidence: e.confidence,
                timestamp: e.timestamp,
                metadata: e.metadata,
              })),
            }),
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return heuristicAnalysis(correlation, events);

      const parsed = JSON.parse(content);
      return {
        significance: parsed.significance || "Unknown",
        explanation: parsed.explanation || "",
        recommendedActions: parsed.recommendedActions || [],
        patternType: parsed.patternType || "unknown",
        confidence: parsed.confidence || 0.5,
      };
    });
  } catch (err) {
    console.error("[llm-analyst] analyzeCorrelation error:", err);
    return heuristicAnalysis(correlation, events);
  }
}

export async function generateReport(
  correlations: Correlation[],
  timeWindowHours: number
): Promise<IntelligenceReport> {
  const routed = pickModel("generation");
  if (!routed) return heuristicReport(correlations);

  try {
    return await rateLimitedCall(async () => {
      const response = await routed.client.chat.completions.create({
        model: routed.model,
        messages: [
          {
            role: "system",
            content: "You are a SIGINT intelligence analyst. Generate a report summarizing correlations. Return JSON with: summary (string), trends (string[]), anomalies (string[]), recommendations (string[]). Be concise.",
          },
          {
            role: "user",
            content: JSON.stringify({
              timeWindowHours,
              totalCorrelations: correlations.length,
              correlations: correlations.slice(0, 50).map(c => ({
                ruleName: c.ruleName,
                description: c.description,
                severity: c.severity,
                eventCount: c.eventIds.length,
                timestamp: c.timestamp,
              })),
            }),
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return heuristicReport(correlations);

      const parsed = JSON.parse(content);
      return {
        summary: parsed.summary || "",
        trends: parsed.trends || [],
        anomalies: parsed.anomalies || [],
        recommendations: parsed.recommendations || [],
      };
    });
  } catch (err) {
    console.error("[llm-analyst] generateReport error:", err);
    return heuristicReport(correlations);
  }
}

export async function suggestRuleWeights(
  feedback: CorrelationFeedback[]
): Promise<{ ruleAdjustments: RuleAdjustment[] }> {
  const routed = pickModel("reasoning");

  if (!routed || feedback.length === 0) {
    return { ruleAdjustments: [] };
  }

  try {
    return await rateLimitedCall(async () => {
      const response = await routed.client.chat.completions.create({
        model: routed.model,
        messages: [
          {
            role: "system",
            content: "Analyze user feedback on SIGINT correlations. Return JSON with ruleAdjustments: array of {ruleId: string, suggestedWeight: number 0-2, reason: string}. Weight >1 means increase importance, <1 means decrease.",
          },
          {
            role: "user",
            content: JSON.stringify({
              feedback: feedback.slice(0, 100).map(f => ({
                correlationId: f.correlationId,
                rating: f.rating,
                notes: f.notes,
              })),
            }),
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return { ruleAdjustments: [] };

      return JSON.parse(content);
    });
  } catch (err) {
    console.error("[llm-analyst] suggestRuleWeights error:", err);
    return { ruleAdjustments: [] };
  }
}

export interface SocialCaption {
  caption: string;
  hashtags: string[];
  altText: string;
  fallback?: boolean;
}

export async function generateSocialCaption(
  template: string,
  data: {
    kappaScore: number;
    threatLevel: string;
    totalEvents: number;
    totalCorrelations: number;
    satelliteCount: number;
    visibleSatellites: number;
    overheadSatellites: number;
    activeDomains: string[];
    eveningWindowActive: boolean;
    topCorrelationRules: string[];
  }
): Promise<SocialCaption> {
  const client = getClient();

  const templateDescriptions: Record<string, string> = {
    kappa: "KAPPA surveillance intensity score dashboard",
    satellite: "satellite orbital intelligence tracking",
    correlation: "cross-domain signal correlation alert",
    domains: "multi-domain signal event breakdown",
    evening: "evening window surveillance activity pattern",
  };

  const routed = pickModel("generation");

  if (!routed) {
    const desc = templateDescriptions[template] || template;
    const lines = [
      `KAPPA SIGINT — ${desc.toUpperCase()}`,
      "",
      `Surveillance Index: ${data.kappaScore}/100 (${data.threatLevel})`,
      `${data.totalEvents} signal events across ${data.activeDomains.length} domains`,
      `${data.satelliteCount} satellites tracked | ${data.visibleSatellites} visible`,
      data.eveningWindowActive ? "Evening window ACTIVE — historically elevated pattern" : "",
      "",
      "Passive monitoring from 9.9536°N 84.2907°W",
    ].filter(Boolean);

    return {
      caption: lines.join("\n"),
      hashtags: ["#SIGINT", "#OSINT", "#surveillance", "#satellites", "#signals", "#intelligence", "#KAPPA"],
      altText: `KAPPA ${desc} showing ${data.kappaScore} score with ${data.totalEvents} events`,
      fallback: true,
    };
  }

  try {
    return await rateLimitedCall(async () => {
      const response = await routed.client.chat.completions.create({
        model: routed.model,
        messages: [
          {
            role: "system",
            content: `You are a social media content writer for a SIGINT (signal intelligence) research project called KAPPA. The platform passively monitors electromagnetic signals across 7 active domains (Satellite, SDR, ELF, Radar, ISP, RF, Morse) from Costa Rica.

Write Instagram-optimized content. Be factual, technical but accessible, and compelling. The tone should be serious and informational — like a research lab posting updates, NOT promotional or clickbait.

Return JSON with:
- caption: string (Instagram caption, 150-300 words, include line breaks for readability, mention specific data points)
- hashtags: string[] (15-20 relevant hashtags, mix of broad and niche, include #SIGINT #OSINT #KAPPA)
- altText: string (accessible image description, 1-2 sentences)`,
          },
          {
            role: "user",
            content: JSON.stringify({
              cardTemplate: template,
              templateDescription: templateDescriptions[template],
              liveData: data,
            }),
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error("Empty LLM response");

      const parsed = JSON.parse(content);
      const caption = typeof parsed.caption === "string" ? parsed.caption : "";
      const hashtags = Array.isArray(parsed.hashtags)
        ? parsed.hashtags.filter((h: unknown) => typeof h === "string").map((h: string) => h.trim())
        : [];
      const altText = typeof parsed.altText === "string" ? parsed.altText : "";

      return { caption, hashtags, altText };
    });
  } catch (err) {
    console.error("[llm-analyst] generateSocialCaption error:", err);
    const desc = templateDescriptions[template] || template;
    const lines = [
      `KAPPA SIGINT — ${desc.toUpperCase()}`,
      "",
      `Surveillance Index: ${data.kappaScore}/100 (${data.threatLevel})`,
      `${data.totalEvents} signal events across ${data.activeDomains.length} domains`,
      `${data.satelliteCount} satellites tracked | ${data.visibleSatellites} visible`,
      data.eveningWindowActive ? "Evening window ACTIVE — historically elevated pattern" : "",
      "",
      "Passive monitoring from 9.9536°N 84.2907°W",
    ].filter(Boolean);

    return {
      caption: lines.join("\n"),
      hashtags: ["#SIGINT", "#OSINT", "#surveillance", "#satellites", "#signals", "#intelligence", "#KAPPA"],
      altText: `KAPPA ${desc} showing ${data.kappaScore} score with ${data.totalEvents} events`,
      fallback: true,
    };
  }
}
