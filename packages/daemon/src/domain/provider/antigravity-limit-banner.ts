import {
  AGENT_ACTIVITY_FRESHNESS_MS,
  type AgentActivityStore,
} from "../agent-activity-store.js";

/**
 * Antigravity usage-limit banner detector.
 *
 * Matches quota/rate limit banners emitted by the `agy` CLI on its pane and records
 * an `at_limit` event in AgentActivityStore so seat status truthfully reports
 * usage_limit rather than falling back to motion detection and falsely reporting working.
 */
export interface AntigravityLimitBanner {
  /** The "Resets in …" text exactly as observed, or null when absent. */
  resetText: string | null;
  /** The banner line, truncated — audit trail for the verdict. */
  evidence: string;
}

const BANNER_LINE_RE = /^\s*(?:⚠\s*)?(?:Individual quota reached|You've reached your quota|quota reached|Rate limit reached|Rate limit exceeded)\b/i;
const RESET_RE = /(?:resets in|try again in|resets at|try again at)\s+([^\n.!]+)/i;
const FENCE_RE = /^\s*```/;
const INPUT_LINE_RE = /^\s*>(?:\s|$)/;
const FOOTER_LINE_RE = /^\?\s+for shortcuts\b/;
const RULE_LINE_RE = /^\s*─{3,}\s*$/;
const STATUS_DETAIL_RE = /^\s*(?:Error ID:|Please upgrade your subscription|limits\.)/i;

function isFenced(lines: string[], index: number): boolean {
  let fenced = false;
  for (let i = 0; i < index; i++) {
    if (FENCE_RE.test(lines[i]!)) fenced = !fenced;
  }
  return fenced;
}

function isMostRecent(lines: string[], index: number): boolean {
  const after = lines.slice(index + 1);
  return after.every(
    (line) =>
      /^\s*$/.test(line) ||
      RULE_LINE_RE.test(line) ||
      INPUT_LINE_RE.test(line) ||
      FOOTER_LINE_RE.test(line) ||
      STATUS_DETAIL_RE.test(line) ||
      RESET_RE.test(line)
  );
}

/**
 * Match the Antigravity limit banner in pane content.
 */
export function detectAntigravityLimitBanner(paneContent: string): AntigravityLimitBanner | null {
  const lines = paneContent.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (!BANNER_LINE_RE.test(line)) continue;
    if (isFenced(lines, i)) continue;

    let blockEnd = i;
    if (!RESET_RE.test(line)) {
      for (let j = i + 1; j <= Math.min(i + 3, lines.length - 1); j++) {
        if (RESET_RE.test(lines.slice(i, j + 1).join("\n"))) {
          blockEnd = j;
          break;
        }
      }
    }
    const window = lines.slice(i, blockEnd + 1).join("\n");
    const reset = RESET_RE.exec(window);
    if (!isMostRecent(lines, blockEnd)) continue;
    return {
      resetText: reset ? reset[1]!.trim() : null,
      evidence: line.trim().slice(0, 200),
    };
  }
  return null;
}

const lastRecordedBySession = new Map<string, string | null>();
const LAST_RECORDED_CAP = 1000;

export function clearRecordedAntigravityBanner(sessionName: string): void {
  lastRecordedBySession.delete(sessionName);
}

export function recordAntigravityLimitBanner(deps: {
  store: Pick<AgentActivityStore, "getLatestForNode" | "recordHookEvent">;
  resolveGeneration: (sessionName: string) => string | null;
  sessionName: string;
  banner: AntigravityLimitBanner | null;
  now?: () => Date;
}): boolean {
  const nowFn = deps.now ?? (() => new Date());
  const nowMs = nowFn().getTime();
  const latest = deps.store.getLatestForNode({ sessionName: deps.sessionName });
  if (!deps.banner) {
    clearRecordedAntigravityBanner(deps.sessionName);
    const generation = deps.resolveGeneration(deps.sessionName);
    if (latest?.rawEvent !== "at_limit" || latest.generation !== generation ||
        !(nowMs > Date.parse(latest.eventAt ?? ""))) return false;
    return deps.store.recordHookEvent({
      runtime: "antigravity",
      sessionName: deps.sessionName,
      hookEvent: "Notification",
      subtype: "usage_limit_cleared",
      occurredAt: new Date(nowMs).toISOString(),
      generation,
    }).ok;
  }

  if (latest?.rawEvent === "at_limit") {
    const eventMs = latest.eventAt ? Date.parse(latest.eventAt) : Number.NaN;
    if (Number.isFinite(eventMs) && nowMs - eventMs < AGENT_ACTIVITY_FRESHNESS_MS) return false;
  } else if (latest) {
    if (lastRecordedBySession.get(deps.sessionName) === deps.banner.resetText) return false;
  }

  deps.store.recordHookEvent({
    runtime: "antigravity",
    sessionName: deps.sessionName,
    hookEvent: "at_limit",
    subtype: deps.banner.resetText,
    generation: deps.resolveGeneration(deps.sessionName),
  });
  lastRecordedBySession.set(deps.sessionName, deps.banner.resetText);
  if (lastRecordedBySession.size > LAST_RECORDED_CAP) {
    const oldest = lastRecordedBySession.keys().next();
    if (!oldest.done) lastRecordedBySession.delete(oldest.value);
  }
  return true;
}
