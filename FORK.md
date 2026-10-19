# OpenRig Fork: Google Antigravity & Studio Sidecar

This fork of [OpenRig](https://github.com/mvschwarz/openrig) adds first-class support for **Google Antigravity** (`antigravity` / native `agy` CLI + `omp` with `google-antigravity` OAuth) and replaces the terminal TUI with an Antigravity 2.0 Obsidian-aesthetic standalone Web Sidecar.

---

## Key Features Added

### 1. Google Antigravity Runtime Adapter
- **Native `agy` Execution**:
  - Implemented `AntigravityRuntimeAdapter` in `packages/daemon/src/adapters/antigravity-runtime-adapter.ts`.
  - Supports `--model`, `--effort`, and non-interruptive permission policies (`--mode auto`, `--dangerously-skip-permissions`).
  - Automatically pre-trusts workspace directories in `~/.gemini/antigravity-cli/settings.json`.
- **Project Discovery & Auto-Grouping**:
  - Automatically identifies or creates Antigravity projects named `"OpenRig - <podname>"` in `~/.gemini/config/projects/`.
  - Passes `--project <projectId>` to `agy` to ensure all conversation sessions are neatly grouped under the pod/team project.
- **Oh My Pi (OMP) Credential Seeding**:
  - Added `seedOmpOAuth` to `packages/daemon/src/adapters/pi-runtime-adapter.ts` to copy `~/.omp/agent/agent.db` into isolated seat environments.

### 2. Antigravity Lifecycle Hook Relay
- Projects `<cwd>/.agents/hooks.json` mapping all 5 lifecycle events (`PreInvocation`, `PostInvocation`, `PreToolUse`, `PostToolUse`, `Stop`) to OpenRig's `activity-relay.cjs`.
- Implemented camelCase protojson parsing in `activity-relay.cjs` (`conversationId`, `stepIdx`, `toolCall.name`).
- Emits proper stdout contracts (`{"decision": "allow"}` for `PreToolUse`, `{}` for others) to unblock the agent loop without stalling.

### 3. Session Transport & Conversation ID Routing
- Updated `packages/daemon/src/domain/session-transport.ts` to resolve Antigravity conversation UUIDs by matching `sessions.resume_token`.
- External Antigravity UUID targets route through `agentapi send-message <uuid> "<text>"`.
- Response envelopes record and return the `conversationId`.

### 4. Standalone Sidecar Web Application
- Single-page application built in the **Antigravity 2.0 Obsidian aesthetic** (`#121212` background, hairline borders, rounded-lg geometry, Google blue accents).
- **Tab 1: Approvals & Attention**: Real-time cards with 1-click Approve, Reject with reason modal, and inline Reply directly to the agent.
- **Tab 2: Agent Topology**: Live fleet visualization of rigs, pods, and seats, displaying live status dots, runtime badges, Antigravity conversation IDs with 1-click copy, and quick Message actions.
- **Tab 3: Deliverables & Proofs**: Live contract viewer with 1-click Accept Proof (with evidence and attribution) and Reject Proof modals calling `POST /api/proof/judge`.
- **Dual Launch Modes**:
  - Standalone detached background daemon: `rig sidecar` (default detached, state saved in `~/.openrig/sidecar.json`, port 7434).
  - In-daemon native route: `http://127.0.0.1:7433/sidecar`.
