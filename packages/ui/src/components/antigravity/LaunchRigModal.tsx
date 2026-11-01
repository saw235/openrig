// One-step "Launch rig" dialog for the Antigravity workspace: pick a rig spec
// from the library, point it at a project folder, and start it.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSpecLibrary } from "../../hooks/useSpecLibrary.js";
import { missionControlAuthHeaders } from "../mission-control/missionControlAuth.js";

interface LaunchRigModalProps {
  open: boolean;
  onClose: () => void;
  onLaunched?: () => void;
}

export function LaunchRigModal({ open, onClose, onLaunched }: LaunchRigModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const specs = useSpecLibrary("rig");
  const queryClient = useQueryClient();
  const [specPath, setSpecPath] = useState("");
  const [cwd, setCwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const entries = specs.data ?? [];
  const selected = entries.find((e) => e.sourcePath === specPath) ?? entries[0] ?? null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/up", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...missionControlAuthHeaders() },
        body: JSON.stringify({
          sourceRef: selected.sourcePath,
          autoApprove: true,
          ...(cwd.trim() ? { cwdOverride: cwd.trim() } : {}),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) throw new Error(body.error ?? body.message ?? `Launch failed (HTTP ${res.status})`);
      await queryClient.invalidateQueries({ queryKey: ["rigs"] });
      onLaunched?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Launch failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="launch-rig-title"
      className="w-[28rem] max-w-[calc(100vw-2rem)] rounded-2xl border bg-surface-lowest p-0 text-foreground backdrop:bg-black/60"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4 p-5">
        <h2 id="launch-rig-title" className="text-base font-medium">Launch a rig</h2>

        <label className="flex flex-col gap-1 text-xs text-foreground-muted">
          Template
          <select
            value={selected?.sourcePath ?? ""}
            onChange={(e) => setSpecPath(e.target.value)}
            className="rounded-lg border bg-background px-2 py-2 text-sm text-foreground"
          >
            {entries.map((s) => (
              <option key={s.id} value={s.sourcePath}>{s.name}</option>
            ))}
          </select>
          {selected?.summary && <span className="text-xs text-foreground-muted">{selected.summary}</span>}
        </label>

        <label className="flex flex-col gap-1 text-xs text-foreground-muted">
          Project folder (optional)
          <input
            value={cwd}
            onChange={(e) => setCwd(e.target.value)}
            placeholder="/home/you/my-project"
            className="rounded-lg border bg-background px-2 py-2 text-sm text-foreground"
          />
        </label>

        {error && <p role="alert" className="text-xs text-error">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm hover:bg-surface-high">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !selected}
            className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-background disabled:opacity-40"
          >
            {busy ? "Launching…" : "Launch"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
