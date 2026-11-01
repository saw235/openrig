// Antigravity 2.0-style workspace: left sidebar (rigs + seats), center canvas
// (live seat session + capsule composer), right auxiliary pane (tabs).
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useRigSummary } from "../../hooks/useRigSummary.js";
import { useNodeInventory, type NodeInventoryEntry } from "../../hooks/useNodeInventory.js";
import { RigGraph } from "../RigGraph.js";
import { FocusedTerminal } from "../terminal/FocusedTerminal.js";
import { missionControlAuthHeaders } from "../mission-control/missionControlAuth.js";
import { runtimeBrand } from "../../lib/runtime-brand.js";
import { LaunchRigModal } from "./LaunchRigModal.js";

type AuxTab = "topology" | "terminal";

function statusDot(n: NodeInventoryEntry): { cls: string; label: string } {
  const s = n.agentActivity?.state;
  if (s === "needs_input") return { cls: "bg-warning", label: "Needs input" };
  if (s === "running") return { cls: "bg-secondary", label: "Working" };
  if (n.startupStatus === "failed" || n.startupStatus === "attention_required") return { cls: "bg-error", label: "Attention" };
  return { cls: "bg-success", label: "Ready" };
}

async function sendToSession(session: string, text: string): Promise<void> {
  const res = await fetch("/api/transport/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...missionControlAuthHeaders() },
    body: JSON.stringify({ session, text }),
  });
  if (!res.ok) throw new Error(`Send failed (HTTP ${res.status})`);
}

export function AntigravityWorkspace() {
  const rigs = useRigSummary();
  const [rigId, setRigId] = useState<string | null>(null);
  const activeRigId = rigId ?? rigs.data?.[0]?.id ?? null;
  const nodes = useNodeInventory(activeRigId);
  const agents = useMemo(() => (nodes.data ?? []).filter((n) => n.nodeKind === "agent"), [nodes.data]);
  const [seat, setSeat] = useState<string | null>(null);
  const active = agents.find((n) => n.logicalId === seat) ?? agents[0] ?? null;
  const session = active?.canonicalSessionName ?? null;

  const [tab, setTab] = useState<AuxTab>("topology");
  const [auxOpen, setAuxOpen] = useState(true);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [launchOpen, setLaunchOpen] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session || !text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await sendToSession(session, text);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-testid="antigravity-workspace" className="flex h-full min-h-0 w-full bg-background text-foreground">
      {/* Left sidebar */}
      <aside className="flex w-64 shrink-0 flex-col gap-3 border-r bg-surface-low p-3 min-w-0">
        <button
          type="button"
          onClick={() => setLaunchOpen(true)}
          className="rounded-xl bg-secondary px-3 py-2 text-center text-sm font-medium text-background"
        >
          + Launch rig
        </button>
        <LaunchRigModal open={launchOpen} onClose={() => setLaunchOpen(false)} />
        <nav aria-label="Rigs" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {(rigs.data ?? []).map((r) => (
            <div key={r.id} className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => { setRigId(r.id); setSeat(null); }}
                className={`rounded-lg px-2 py-1.5 text-left text-sm ${r.id === activeRigId ? "bg-surface-lowest" : "hover:bg-surface-lowest"}`}
              >
                {r.name}
              </button>
              {r.id === activeRigId &&
                agents.map((n) => {
                  const d = statusDot(n);
                  return (
                    <button
                      key={n.logicalId}
                      type="button"
                      onClick={() => setSeat(n.logicalId)}
                      className={`ml-3 flex items-center gap-2 rounded-lg px-2 py-1 text-left text-xs ${n.logicalId === active?.logicalId ? "bg-surface-lowest" : "hover:bg-surface-lowest"}`}
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${d.cls}`} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{n.logicalId}</span>
                      <span className="text-foreground-muted">{d.label}</span>
                    </button>
                  );
                })}
            </div>
          ))}
          {rigs.data?.length === 0 && (
            <p className="px-2 text-xs text-foreground-muted">No rigs yet. Launch one to get started.</p>
          )}
        </nav>
        <div className="flex flex-col gap-1 border-t pt-2 text-xs">
          <Link to="/for-you" className="rounded-lg px-2 py-1 hover:bg-surface-lowest">Inbox / For You</Link>
          <Link to="/project" className="rounded-lg px-2 py-1 hover:bg-surface-lowest">Tasks &amp; artifacts</Link>
          <Link to="/files" className="rounded-lg px-2 py-1 hover:bg-surface-lowest">Files</Link>
          <Link to="/topology" className="rounded-lg px-2 py-1 hover:bg-surface-lowest">Topology</Link>
          <Link to="/specs" className="rounded-lg px-2 py-1 hover:bg-surface-lowest">Specs</Link>
          <Link to="/settings" className="rounded-lg px-2 py-1 hover:bg-surface-lowest">Settings</Link>
        </div>
      </aside>

      {/* Center canvas */}
      <main className="flex min-w-0 flex-1 flex-col" style={{ minInlineSize: 0 }}>
        <header className="flex items-center gap-3 border-b px-4 py-2">
          <h1 className="min-w-0 flex-1 truncate text-sm font-medium">{active ? active.logicalId : "No seat selected"}</h1>
          {active && (
            <span className="rounded-full bg-surface-lowest px-2 py-0.5 text-xs">
              {runtimeBrand(active.runtime).shortLabel}
            </span>
          )}
          {active?.contextUsage?.usedPercentage != null && (
            <span className="text-xs text-foreground-muted">{Math.round(active.contextUsage.usedPercentage)}% context</span>
          )}
          <button
            type="button"
            onClick={() => setAuxOpen((v) => !v)}
            className="rounded-lg px-2 py-1 text-xs hover:bg-surface-lowest"
            aria-pressed={auxOpen}
          >
            Panel
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto bg-surface-low p-3">
          {session ? (
            <FocusedTerminal key={session} sessionName={session} fit="width" />
          ) : (
            <p className="text-sm text-foreground-muted">Select a seat on the left to talk to it.</p>
          )}
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-1 border-t p-3">
          {error && <p role="alert" className="text-xs text-error">{error}</p>}
          <div className="flex items-center gap-2 rounded-2xl border bg-surface-lowest px-3 py-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!session || busy}
              placeholder={session ? `Message ${active?.logicalId}…` : "Select a seat"}
              aria-label="Message composer"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <button
              type="submit"
              disabled={!session || busy || !text.trim()}
              className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-background disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </form>
      </main>

      {/* Right auxiliary pane */}
      {auxOpen && (
        <aside className="flex w-[28rem] shrink-0 flex-col border-l bg-surface-low min-w-0">
          <div role="tablist" className="flex gap-1 border-b p-2 text-xs">
            {(["topology", "terminal"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-3 py-1 capitalize ${tab === t ? "bg-surface-lowest" : "hover:bg-surface-lowest"}`}
              >
                {t === "topology" ? "Subagents" : "Terminal"}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            {tab === "topology" ? (
              <RigGraph rigId={activeRigId} />
            ) : session ? (
              <FocusedTerminal key={`aux-${session}`} sessionName={session} fit="contain" />
            ) : null}
          </div>
        </aside>
      )}
    </div>
  );
}
