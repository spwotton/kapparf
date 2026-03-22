import { DEEP_RESEARCH_AGENTS } from "@shared/schema";
import { queryModel, getAvailableModels } from "./research-engine";
import { storage } from "./storage";

export function generateHypervisorPrompts(topic: string): { agentId: string; prompt: string }[] {
  return DEEP_RESEARCH_AGENTS.map(agent => {
    const prompt = `${agent.preamble}

═══════════════════════════════════════════════════════════════════
RESEARCH DIRECTIVE
═══════════════════════════════════════════════════════════════════

You are Agent "${agent.name}" reporting to the Hypervisor.
Your mathematical framework: ${agent.framework}
Your domain specialization: ${agent.domain}

RESEARCH TOPIC:
${topic}

INSTRUCTIONS:
1. Analyze the research topic EXCLUSIVELY through the lens of your mathematical framework
2. Apply your specific constants, formulas, and geometric structures to the topic
3. Identify connections, patterns, and implications that only your framework reveals
4. Produce concrete, quantitative findings where possible
5. Reference specific mathematical objects (zeros, lattice points, group elements, etc.)
6. Conclude with actionable insights and predictions

OUTPUT FORMAT:
Produce a comprehensive markdown research report with:
- Executive Summary (2-3 sentences)
- Mathematical Analysis (your framework applied to the topic)
- Key Findings (numbered list with confidence levels)
- Cross-Domain Connections (how your findings relate to the broader KAPPA platform)
- Predictions & Implications
- Technical Appendix (relevant formulas, constants, computations)

Be thorough, technical, and specific. This report will be fed to another AI for further deep research, so include all relevant mathematical context.`;

    return { agentId: agent.id, prompt };
  });
}

export async function executeDeepResearchRun(runId: string, topic: string): Promise<void> {
  const prompts = generateHypervisorPrompts(topic);
  const models = getAvailableModels().filter(m => m.available);

  if (models.length === 0) {
    await storage.updateDeepResearchRun(runId, {
      status: "failed",
      metadata: { error: "No models available. Configure API keys for OpenAI, OpenRouter, or HuggingFace." },
    });
    return;
  }

  await storage.updateDeepResearchRun(runId, { status: "running" });

  const reportRecords = [];
  for (const { agentId, prompt } of prompts) {
    const agent = DEEP_RESEARCH_AGENTS.find(a => a.id === agentId)!;
    const report = await storage.createDeepResearchReport({
      runId,
      agentId,
      frameworkName: agent.framework,
      agentName: agent.name,
      prompt,
      status: "pending",
    });
    reportRecords.push({ report, agentId, prompt });
  }

  let completed = 0;
  let errorCount = 0;

  for (const { report, agentId, prompt } of reportRecords) {
    const modelIdx = DEEP_RESEARCH_AGENTS.findIndex(a => a.id === agentId);
    const targetModel = models[modelIdx % models.length];

    try {
      await storage.updateDeepResearchReport(report.id, { status: "running" });

      const result = await queryModel(
        targetModel.provider,
        targetModel.name,
        [{ role: "user", content: prompt }],
        4
      );

      completed++;

      if (result.error) {
        errorCount++;
        await storage.updateDeepResearchReport(report.id, {
          status: "error",
          response: result.error,
          durationMs: result.durationMs,
          modelProvider: targetModel.provider,
          modelName: targetModel.name,
        });
      } else {
        await storage.updateDeepResearchReport(report.id, {
          status: "completed",
          response: result.response,
          durationMs: result.durationMs,
          modelProvider: targetModel.provider,
          modelName: targetModel.name,
        });
      }

      await storage.updateDeepResearchRun(runId, { agentsCompleted: completed });
    } catch (err: unknown) {
      completed++;
      errorCount++;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[deep-research] Agent ${agentId} error:`, errMsg);
      await storage.updateDeepResearchReport(report.id, {
        status: "error",
        response: `Error: ${errMsg}`,
        durationMs: 0,
        modelProvider: targetModel.provider,
        modelName: targetModel.name,
      });
      await storage.updateDeepResearchRun(runId, { agentsCompleted: completed });
    }
  }

  const totalAgents = reportRecords.length;
  const finalStatus = errorCount === totalAgents ? "failed" : errorCount > 0 ? "partial" : "completed";

  await storage.updateDeepResearchRun(runId, {
    status: finalStatus,
    completedAt: new Date(),
    agentsCompleted: completed,
    metadata: { errorCount, successCount: completed - errorCount },
  });
}
