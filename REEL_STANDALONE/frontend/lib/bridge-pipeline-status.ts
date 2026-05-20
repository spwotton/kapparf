// Cross-component channel for the Cathedral → Reel bridge pipeline.
//
// When the user summons a bridge in the Cathedral and hands the session off
// to the Reel hook, the auto-pipeline (repair → clips → stitch) runs after
// the Cathedral has typically been unmounted (the user navigates to the
// Reel view). To honour the "failures surface in the Cathedral inspector"
// contract, we keep the most recent pipeline error in module-level state
// and dispatch a `omega:bridge-reel-status` window event so any mounted
// CathedralView can react in real time. The Cathedral also reads
// getLastBridgeStatus() on mount so post-navigation errors aren't lost.

export type BridgeStage = "repair" | "clips" | "stitch";

// `resumedFrom` is set on any pipeline run that was started via
// `resumePipeline` (i.e. picked up from a prior cancel/error checkpoint).
// `clipsSkipped` reports how many clips were already `done` at resume time
// — useful so the status pill can say "resumed from clips · 3 already done"
// instead of just naming the stage.
export type BridgePipelineStatus =
  | { kind: "running"; reelId: string; stage: string; resumedFrom?: BridgeStage; clipsSkipped?: number }
  | { kind: "complete"; reelId: string; resumedFrom?: BridgeStage; clipsSkipped?: number }
  | { kind: "cancelled"; reelId: string; stage: string; clipsDone: number; clipsTotal: number; resumedFrom?: BridgeStage; clipsSkipped?: number }
  | { kind: "error"; reelId?: string; message: string; resumedFrom?: BridgeStage; clipsSkipped?: number }
  | { kind: "idle" };

let lastStatus: BridgePipelineStatus = { kind: "idle" };

export function setBridgeStatus(status: BridgePipelineStatus) {
  lastStatus = status;
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("omega:bridge-reel-status", { detail: status }),
    );
  }
}

export function getLastBridgeStatus(): BridgePipelineStatus {
  return lastStatus;
}

export function clearBridgeStatus() {
  lastStatus = { kind: "idle" };
}

// User-initiated cancellation request for the bridge auto-pipeline.
//
// The pipeline runs inside the useReel hook (mounted on the Reel view), but
// the cancel control lives on the Cathedral status pill — which may have
// been navigated away from. We bridge the gap with a window event plus a
// module-level "pending cancel" flag: useReel listens to flip its in-flight
// refs, and any pipeline that starts shortly after a cancel request still
// sees the flag and bails immediately.
let cancelRequested = false;

export function requestBridgeCancel() {
  cancelRequested = true;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("omega:bridge-reel-cancel"));
  }
}

export function consumeBridgeCancelRequest(): boolean {
  const wanted = cancelRequested;
  cancelRequested = false;
  return wanted;
}

export function isBridgeCancelRequested(): boolean {
  return cancelRequested;
}

// Pending bridge-reel hand-off queue.
//
// The Cathedral dispatches a `omega:bridge-reel` event right before
// navigating to the Reel view, but in `Home` the ReelPanel (and therefore
// the useReel listener) is mounted only when `view === "reel"`. That means
// the dispatch usually loses its listener and the auto-pipeline never
// fires. We sidestep the race by also pushing the hand-off onto this
// queue; the useReel hook drains it on mount and re-runs the same
// session-handoff logic so the auto-pipeline always kicks off.
import type { ReelSession } from "./reel-store";

export type PendingBridgeHandoff = {
  session: ReelSession;
  autoRun: boolean;
};

const pending: PendingBridgeHandoff[] = [];

export function queueBridgeHandoff(handoff: PendingBridgeHandoff) {
  pending.push(handoff);
}

export function drainBridgeHandoffs(): PendingBridgeHandoff[] {
  const out = pending.splice(0, pending.length);
  return out;
}
