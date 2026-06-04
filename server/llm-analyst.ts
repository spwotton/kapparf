import { type Correlation, type SignalEvent, type CorrelationFeedback } from "@shared/schema";
import {
  routeCall,
  triadicAnalysis,
  classifyTier,
  logRouterEvent,
} from "./kappa-router";

// Re-export router stats for routes.ts
export { getRouterStats } from "./kappa-router";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CorrelationAnalysis {
  significance: string;
  explanation: string;
  recommendedActions: string[];
  patternType: string;
  confidence: number;
  fallback?: boolean;
  triadic?: boolean;
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

export interface SocialCaption {
  caption: string;
  hashtags: string[];
  altText: string;
  fallback?: boolean;
}

// ── Heuristic fallbacks (no LLM required) ────────────────────────────────────

function heuristicAnalysis(correlation: Correlation, events: SignalEvent[]): CorrelationAnalysis {
  const domains = new Set(events.map(e => e.domain));
  const severity = correlation.severity;
  const domainCount = domains.size;

  let significance = "Low";
  let patternType = "temporal-coincidence";

  if (severity >= 4 || domainCount >= 3) {
    significance = "High";
    patternType = domainCount >= 3 ? "full-spectrum-correlation" : "multi-domain-correlation";
  } else if (severity >= 3) {
    significance = "Medium";
    patternType = "cross-domain-pattern";
  }

  return {
    significance,
    explanation: `${domainCount} domain(s) correlated via rule "${correlation.ruleName}" with severity ${severity}/5. Domains: ${Array.from(domains).join(", ")}.`,
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

// ── Get current KAPPA score for routing decisions ────────────────────────────

function getKappaScore(): number {
  try {
    const { kappaEngine } = require("./kappa-engine");
    return kappaEngine.getStatus().score ?? 0;
  } catch {
    return 0;
  }
}

// ── analyzeCorrelation ───────────────────────────────────────────────────────

export async function analyzeCorrelation(
  correlation: Correlation,
  events: SignalEvent[]
): Promise<CorrelationAnalysis> {
  const kappaScore = getKappaScore();
  const tier = classifyTier(kappaScore, "correlation");

  // Use triadic analysis for CRITICAL/PURPLE tier — Observer/Critic/Synthesizer
  // gives significantly better intelligence than a single pass
  if (tier === "purple") {
    try {
      const subject = `Correlation: ${correlation.ruleName} | Severity: ${correlation.severity}/5`;
      const subjectData = JSON.stringify({
        correlation: {
          ruleName: correlation.ruleName,
          description: correlation.description,
          severity: correlation.severity,
          eventCount: correlation.eventIds.length,
          metadata: correlation.metadata,
        },
        events: events.slice(0, 12).map(e => ({
          domain: e.domain,
          source: e.source,
          eventType: e.eventType,
          frequency: e.frequency,
          confidence: e.confidence,
          timestamp: e.timestamp,
          metadata: e.metadata,
        })),
      }, null, 0);

      const triadic = await triadicAnalysis(subject, subjectData, kappaScore);
      const ts = Date.now();

      // Parse synthesizer JSON output
      let parsed: any = {};
      try {
        parsed = JSON.parse(triadic.synthesis);
      } catch {
        // synthesis might be non-JSON if model degraded; extract via heuristic
        parsed = {
          significance: correlation.severity >= 4 ? "High" : "Medium",
          explanation: triadic.synthesis.slice(0, 500),
          confidence: 0.7,
          recommendedActions: [],
          patternType: "triadic-synthesis",
        };
      }

      logRouterEvent({
        ts, model: triadic.model_synth, tier: "purple",
        fromCache: false, latencyMs: 0, success: true,
      });

      return {
        significance: parsed.significance || "High",
        explanation: parsed.explanation || triadic.synthesis.slice(0, 400),
        recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [
          `Observer: ${triadic.observation.slice(0, 120)}`,
          `Critic: ${triadic.critique.slice(0, 120)}`,
        ],
        patternType: parsed.patternType || "triadic-synthesis",
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.75,
        triadic: true,
      };
    } catch (err) {
      console.error("[llm-analyst] triadic analysis error:", err);
      // Fall through to single-pass
    }
  }

  // Single-pass for GREEN/AMBER tier
  const systemPrompt = `You are a SIGINT analyst. Analyze the correlation and return JSON:
{"significance":"string","explanation":"string","recommendedActions":["string"],"patternType":"string","confidence":0-1}
Be concise and technical.`;

  const userPrompt = JSON.stringify({
    correlation: {
      ruleName: correlation.ruleName,
      description: correlation.description,
      severity: correlation.severity,
      eventCount: correlation.eventIds.length,
      metadata: correlation.metadata,
    },
    events: events.slice(0, 10).map(e => ({
      domain: e.domain, source: e.source, eventType: e.eventType,
      frequency: e.frequency, confidence: e.confidence,
      timestamp: e.timestamp, metadata: e.metadata,
    })),
  });

  const ts = Date.now();
  const result = await routeCall({
    tier,
    kappaScore,
    queryClass: "correlation",
    systemPrompt,
    userPrompt,
    jsonMode: true,
    maxTokens: 600,
    cacheKey: `corr:${correlation.ruleName}:${correlation.severity}:${events.slice(0,3).map(e=>e.domain).join(",")}`,
  });

  logRouterEvent({
    ts, model: result.model, tier: result.tier,
    fromCache: result.fromCache, latencyMs: result.latencyMs, success: true,
  });

  if (result.model === "heuristic") return heuristicAnalysis(correlation, events);

  try {
    const parsed = JSON.parse(result.content);
    return {
      significance: parsed.significance || "Unknown",
      explanation: parsed.explanation || "",
      recommendedActions: parsed.recommendedActions || [],
      patternType: parsed.patternType || "unknown",
      confidence: parsed.confidence || 0.5,
    };
  } catch {
    console.error("[llm-analyst] JSON parse error from", result.model);
    return heuristicAnalysis(correlation, events);
  }
}

// ── generateReport ───────────────────────────────────────────────────────────

export async function generateReport(
  correlations: Correlation[],
  timeWindowHours: number
): Promise<IntelligenceReport> {
  const kappaScore = getKappaScore();

  const systemPrompt = `You are a SIGINT intelligence analyst. Summarize correlations.
Return JSON: {"summary":"string","trends":["string"],"anomalies":["string"],"recommendations":["string"]}`;

  const userPrompt = JSON.stringify({
    timeWindowHours,
    totalCorrelations: correlations.length,
    correlations: correlations.slice(0, 50).map(c => ({
      ruleName: c.ruleName,
      description: c.description,
      severity: c.severity,
      eventCount: c.eventIds.length,
      timestamp: c.timestamp,
    })),
  });

  const ts = Date.now();
  const result = await routeCall({
    kappaScore,
    queryClass: "report",
    systemPrompt,
    userPrompt,
    jsonMode: true,
    maxTokens: 1000,
    cacheKey: `report:${timeWindowHours}h:${correlations.length}c`,
    cacheThreshold: 0.82,
  });

  logRouterEvent({
    ts, model: result.model, tier: result.tier,
    fromCache: result.fromCache, latencyMs: result.latencyMs, success: true,
  });

  if (result.model === "heuristic") return heuristicReport(correlations);

  try {
    const parsed = JSON.parse(result.content);
    return {
      summary: parsed.summary || "",
      trends: parsed.trends || [],
      anomalies: parsed.anomalies || [],
      recommendations: parsed.recommendations || [],
    };
  } catch {
    return heuristicReport(correlations);
  }
}

// ── suggestRuleWeights ───────────────────────────────────────────────────────

export async function suggestRuleWeights(
  feedback: CorrelationFeedback[]
): Promise<{ ruleAdjustments: RuleAdjustment[] }> {
  if (feedback.length === 0) return { ruleAdjustments: [] };

  const result = await routeCall({
    tier: "amber",
    queryClass: "correlation",
    systemPrompt: `Analyze user feedback on SIGINT correlations. Return JSON:
{"ruleAdjustments":[{"ruleId":"string","suggestedWeight":0-2,"reason":"string"}]}
Weight >1 = increase importance, <1 = decrease.`,
    userPrompt: JSON.stringify({
      feedback: feedback.slice(0, 100).map(f => ({
        correlationId: f.correlationId,
        rating: f.rating,
        notes: f.notes,
      })),
    }),
    jsonMode: true,
    maxTokens: 800,
  });

  if (result.model === "heuristic") return { ruleAdjustments: [] };

  try {
    return JSON.parse(result.content);
  } catch {
    return { ruleAdjustments: [] };
  }
}

// ── generateSocialCaption ────────────────────────────────────────────────────

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
  const templateDescriptions: Record<string, string> = {
    kappa: "KAPPA surveillance intensity score dashboard",
    satellite: "satellite orbital intelligence tracking",
    correlation: "cross-domain signal correlation alert",
    domains: "multi-domain signal event breakdown",
    evening: "evening window surveillance activity pattern",
    quantum_ghz: "John's Circuit — 4-qubit GHZ entanglement on Rigetti QPU",
    quantum_sonnet: "Quantum Sonnet in 25 Languages — Shakespeare's Sonnet 18 in a quantum circuit",
    quantum_apocalypse: "Apocalypse Circuit — 7-Trumpet quantum gates mapping Revelation 8:1-2",
    quantum_bell: "Bell Nonlocality verification — CHSH inequality violation S=2√2",
  };

  const fallbackCaption = (): SocialCaption => {
    const desc = templateDescriptions[template] || template;
    return {
      caption: [
        `KAPPA SIGINT — ${desc.toUpperCase()}`,
        "",
        `Surveillance Index: ${data.kappaScore}/100 (${data.threatLevel})`,
        `${data.totalEvents} signal events across ${data.activeDomains.length} domains`,
        `${data.satelliteCount} satellites tracked | ${data.visibleSatellites} visible`,
        data.eveningWindowActive ? "Evening window ACTIVE — historically elevated pattern" : "",
        "",
        "Passive monitoring from 9.9536°N 84.2907°W",
      ].filter(Boolean).join("\n"),
      hashtags: ["#SIGINT", "#OSINT", "#surveillance", "#satellites", "#signals", "#intelligence", "#KAPPA"],
      altText: `KAPPA ${desc} showing ${data.kappaScore} score with ${data.totalEvents} events`,
      fallback: true,
    };
  };

  const result = await routeCall({
    tier: "green",
    queryClass: "caption",
    systemPrompt: `You are a social media content writer for a SIGINT research project called KAPPA.
The platform passively monitors electromagnetic signals from Costa Rica.
Write Instagram-optimized content. Be factual, technical, and compelling. NOT promotional.
Return JSON: {"caption":"string (150-300 words, with line breaks)","hashtags":["string (15-20)"],"altText":"string (1-2 sentences)"}`,
    userPrompt: JSON.stringify({
      cardTemplate: template,
      templateDescription: templateDescriptions[template],
      liveData: data,
    }),
    jsonMode: true,
    maxTokens: 800,
  });

  if (result.model === "heuristic") return fallbackCaption();

  try {
    const parsed = JSON.parse(result.content);
    return {
      caption: typeof parsed.caption === "string" ? parsed.caption : "",
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.filter((h: unknown) => typeof h === "string") : [],
      altText: typeof parsed.altText === "string" ? parsed.altText : "",
    };
  } catch {
    return fallbackCaption();
  }
}
