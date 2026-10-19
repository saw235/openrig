// Standalone Antigravity-aesthetic HTML application for OpenRig Sidecar

export function renderSidecarHtml(daemonUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenRig Sidecar</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #121212;
      --bg-surface: #181818;
      --bg-card: #1e1e1e;
      --bg-elevated: #262626;
      --border-subtle: #2d2d2d;
      --border-focus: #444444;
      --text-primary: #e6e6e6;
      --text-secondary: #9e9e9e;
      --text-muted: #6b6b6b;
      --accent-blue: #8ab4f8;
      --accent-blue-hover: #aecbfa;
      --accent-green: #81c995;
      --accent-green-hover: #a8dab5;
      --accent-red: #f28b82;
      --accent-red-hover: #f6aea9;
      --accent-amber: #fdd663;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --radius-full: 9999px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-base);
      color: var(--text-primary);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      line-height: 1.5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    header {
      background-color: var(--bg-surface);
      border-bottom: 1px solid var(--border-subtle);
      padding: 0 24px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      font-size: 15px;
      letter-spacing: -0.01em;
    }

    .brand-mark {
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, #8ab4f8 0%, #4285f4 100%);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #121212;
      font-weight: 700;
      font-size: 14px;
    }

    .brand-sub {
      color: var(--text-secondary);
      font-weight: 400;
      font-size: 12px;
      padding-left: 6px;
      border-left: 1px solid var(--border-subtle);
    }

    .nav-tabs {
      display: flex;
      gap: 6px;
      background-color: var(--bg-card);
      padding: 3px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      padding: 6px 14px;
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.15s ease;
    }

    .tab-btn:hover {
      color: var(--text-primary);
    }

    .tab-btn.active {
      background-color: var(--bg-elevated);
      color: #ffffff;
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 1px 6px;
      border-radius: var(--radius-full);
      font-size: 10px;
      font-weight: 600;
      line-height: 1.4;
    }

    .badge-blue { background: rgba(138, 180, 248, 0.15); color: var(--accent-blue); }
    .badge-green { background: rgba(129, 201, 149, 0.15); color: var(--accent-green); }
    .badge-red { background: rgba(242, 139, 130, 0.15); color: var(--accent-red); }
    .badge-amber { background: rgba(253, 214, 99, 0.15); color: var(--accent-amber); }
    .badge-muted { background: var(--bg-elevated); color: var(--text-secondary); }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--text-secondary);
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: var(--accent-green);
      box-shadow: 0 0 6px rgba(129, 201, 149, 0.6);
    }

    .btn {
      background-color: var(--bg-card);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }

    .btn:hover {
      background-color: var(--bg-elevated);
      border-color: var(--border-focus);
    }

    .btn-primary {
      background-color: rgba(138, 180, 248, 0.15);
      color: var(--accent-blue);
      border-color: rgba(138, 180, 248, 0.3);
    }
    .btn-primary:hover {
      background-color: rgba(138, 180, 248, 0.25);
    }

    .btn-success {
      background-color: rgba(129, 201, 149, 0.15);
      color: var(--accent-green);
      border-color: rgba(129, 201, 149, 0.3);
    }
    .btn-success:hover {
      background-color: rgba(129, 201, 149, 0.25);
    }

    .btn-danger {
      background-color: rgba(242, 139, 130, 0.15);
      color: var(--accent-red);
      border-color: rgba(242, 139, 130, 0.3);
    }
    .btn-danger:hover {
      background-color: rgba(242, 139, 130, 0.25);
    }

    main {
      flex: 1;
      padding: 24px;
      max-width: 1300px;
      width: 100%;
      margin: 0 auto;
    }

    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 16px;
    }

    .card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .card:hover {
      border-color: var(--border-focus);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
      line-height: 1.4;
    }

    .card-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 11px;
      color: var(--text-secondary);
    }

    .card-body {
      background-color: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5px;
      color: var(--text-primary);
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 180px;
      overflow-y: auto;
    }

    .card-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      margin-top: auto;
      padding-top: 8px;
      border-top: 1px solid var(--border-subtle);
    }

    /* Topology styles */
    .rig-container {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 20px;
      margin-bottom: 24px;
    }

    .rig-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .rig-title {
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .pod-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .pod-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .pod-header {
      font-size: 13px;
      font-weight: 600;
      color: var(--accent-blue);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .seat-item {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .seat-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .seat-name {
      font-weight: 600;
      font-size: 12.5px;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #666;
    }
    .live-dot.working { background-color: var(--accent-green); box-shadow: 0 0 6px rgba(129, 201, 149, 0.8); }
    .live-dot.idle { background-color: var(--accent-blue); box-shadow: 0 0 6px rgba(138, 180, 248, 0.8); }
    .live-dot.needs_input { background-color: var(--accent-amber); box-shadow: 0 0 6px rgba(253, 214, 99, 0.8); }
    .live-dot.stopped { background-color: #666; }

    .seat-details {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 11px;
    }

    .conv-box {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10.5px;
      background-color: var(--bg-base);
      padding: 4px 8px;
      border-radius: 4px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      margin-top: 4px;
    }

    .conv-copy-btn {
      background: none;
      border: none;
      color: var(--accent-blue);
      cursor: pointer;
      font-size: 10px;
    }

    /* Modal styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .modal-overlay.open {
      display: flex;
    }

    .modal {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 520px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title {
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 18px;
      cursor: pointer;
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .form-input, .form-textarea {
      background-color: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      padding: 8px 12px;
      font-family: inherit;
      font-size: 12.5px;
      outline: none;
      transition: border-color 0.15s ease;
    }

    .form-input:focus, .form-textarea:focus {
      border-color: var(--accent-blue);
    }

    .form-textarea {
      min-height: 100px;
      resize: vertical;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid var(--border-subtle);
    }

    /* Toast notification */
    #toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background-color: var(--bg-elevated);
      border: 1px solid var(--border-focus);
      color: #ffffff;
      padding: 10px 16px;
      border-radius: var(--radius-md);
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      display: none;
      align-items: center;
      gap: 8px;
      z-index: 200;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--text-secondary);
      background-color: var(--bg-surface);
      border: 1px dashed var(--border-subtle);
      border-radius: var(--radius-lg);
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-mark">A</div>
      <span>OpenRig Sidecar</span>
      <span class="brand-sub">Google Antigravity</span>
    </div>

    <nav class="nav-tabs">
      <button class="tab-btn active" data-tab="approvals">
        <span>Approvals & Attention</span>
        <span class="badge badge-amber" id="approvals-count">0</span>
      </button>
      <button class="tab-btn" data-tab="topology">
        <span>Agent Topology</span>
        <span class="badge badge-blue" id="seats-count">0</span>
      </button>
      <button class="tab-btn" data-tab="deliverables">
        <span>Deliverables & Proofs</span>
        <span class="badge badge-green" id="proofs-count">0</span>
      </button>
    </nav>

    <div class="header-actions">
      <div class="status-indicator">
        <div class="status-dot"></div>
        <span id="daemon-label">${daemonUrl}</span>
      </div>
      <button class="btn" id="refresh-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
        <span>Refresh</span>
      </button>
    </div>
  </header>

  <main>
    <!-- TAB 1: Approvals & Attention -->
    <section id="tab-approvals" class="tab-content active">
      <div class="section-header">
        <div class="section-title">
          <span>Pending Approvals & Attention</span>
          <span class="badge badge-amber" id="approvals-header-badge">Live</span>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn" id="filter-all-approvals">All</button>
          <button class="btn btn-primary" id="open-new-send-btn">+ Send to Agent</button>
        </div>
      </div>
      <div id="approvals-list" class="card-grid">
        <div class="empty-state">Loading pending attention items...</div>
      </div>
    </section>

    <!-- TAB 2: Agent Topology -->
    <section id="tab-topology" class="tab-content">
      <div class="section-header">
        <div class="section-title">
          <span>Fleet & Agent Topology</span>
          <span class="badge badge-blue" id="topology-header-badge">Live</span>
        </div>
      </div>
      <div id="topology-list">
        <div class="empty-state">Loading agent topology...</div>
      </div>
    </section>

    <!-- TAB 3: Deliverables & Proofs -->
    <section id="tab-deliverables" class="tab-content">
      <div class="section-header">
        <div class="section-title">
          <span>Deliverables & Proof Contracts</span>
          <span class="badge badge-green" id="deliverables-header-badge">Proof System</span>
        </div>
      </div>
      <div id="deliverables-list" class="card-grid">
        <div class="empty-state">Loading deliverables and proof contracts...</div>
      </div>
    </section>
  </main>

  <!-- REJECT REASON MODAL -->
  <div class="modal-overlay" id="reject-modal">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">Reject Request</div>
        <button class="modal-close" onclick="closeModal('reject-modal')">&times;</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="reject-qitem-id">
        <div class="form-group">
          <label class="form-label">Item to Reject</label>
          <div id="reject-summary" style="font-weight:600; color:#fff;"></div>
        </div>
        <div class="form-group">
          <label class="form-label" for="reject-reason">Reason for Rejection (sent to the agent)</label>
          <textarea class="form-textarea" id="reject-reason" placeholder="Explain what needs fixing or why this request is denied..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal('reject-modal')">Cancel</button>
        <button class="btn btn-danger" id="confirm-reject-btn">Reject with Reason</button>
      </div>
    </div>
  </div>

  <!-- REPLY TO AGENT MODAL -->
  <div class="modal-overlay" id="reply-modal">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">Reply to Agent</div>
        <button class="modal-close" onclick="closeModal('reply-modal')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label" for="reply-session">Target Agent / Session</label>
          <input type="text" class="form-input" id="reply-session" placeholder="e.g. operator.agent@kernel or conversation UUID">
        </div>
        <div class="form-group">
          <label class="form-label" for="reply-text">Message / Instruction</label>
          <textarea class="form-textarea" id="reply-text" placeholder="Type your instruction or reply to the agent..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal('reply-modal')">Cancel</button>
        <button class="btn btn-primary" id="confirm-reply-btn">Send Message</button>
      </div>
    </div>
  </div>

  <!-- PROOF REJECT MODAL -->
  <div class="modal-overlay" id="proof-reject-modal">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">Reject Proof Contract Item</div>
        <button class="modal-close" onclick="closeModal('proof-reject-modal')">&times;</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="proof-reject-scope">
        <input type="hidden" id="proof-reject-item">
        <input type="hidden" id="proof-reject-revision">
        <input type="hidden" id="proof-reject-previous">
        <div class="form-group">
          <label class="form-label">Proof Item</label>
          <div id="proof-reject-text" style="font-weight:600; color:#fff;"></div>
        </div>
        <div class="form-group">
          <label class="form-label" for="proof-reject-reason">Rejection Reason / Required Evidence</label>
          <textarea class="form-textarea" id="proof-reject-reason" placeholder="Explain what evidence or test verification is lacking..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal('proof-reject-modal')">Cancel</button>
        <button class="btn btn-danger" id="confirm-proof-reject-btn">Reject Proof</button>
      </div>
    </div>
  </div>

  <div id="toast"></div>

  <script>
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById('tab-' + tabId).classList.add('active');
      });
    });

    function showToast(message, isError = false) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.style.borderColor = isError ? 'var(--accent-red)' : 'var(--accent-green)';
      toast.style.display = 'flex';
      setTimeout(() => { toast.style.display = 'none'; }, 4000);
    }

    function openModal(id) {
      document.getElementById(id).classList.add('open');
    }
    function closeModal(id) {
      document.getElementById(id).classList.remove('open');
    }

    // Modal triggers
    document.getElementById('open-new-send-btn').addEventListener('click', () => {
      document.getElementById('reply-session').value = '';
      document.getElementById('reply-text').value = '';
      openModal('reply-modal');
    });

    // Send reply action
    document.getElementById('confirm-reply-btn').addEventListener('click', async () => {
      const session = document.getElementById('reply-session').value.trim();
      const text = document.getElementById('reply-text').value.trim();
      if (!session || !text) {
        showToast("Please provide both target session and message.", true);
        return;
      }
      try {
        const res = await fetch('/api/transport/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session, text, actorSession: 'operator@human' })
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          showToast("Message sent to " + session);
          closeModal('reply-modal');
        } else {
          showToast(data.error || "Failed to send message", true);
        }
      } catch (err) {
        showToast("Network error sending message", true);
      }
    });

    // Reject qitem action
    document.getElementById('confirm-reject-btn').addEventListener('click', async () => {
      const qitemId = document.getElementById('reject-qitem-id').value;
      const reason = document.getElementById('reject-reason').value.trim();
      if (!reason) {
        showToast("Please enter a reason for rejection.", true);
        return;
      }
      try {
        const res = await fetch('/api/mission-control/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            verb: 'deny',
            qitemId,
            reason,
            actorSession: 'operator@human'
          })
        });
        const data = await res.json();
        if (res.ok) {
          showToast("Request rejected: " + reason);
          closeModal('reject-modal');
          fetchApprovals();
        } else {
          showToast(data.message || data.error || "Failed to reject", true);
        }
      } catch (err) {
        showToast("Error rejecting request", true);
      }
    });

    // Reject proof action
    document.getElementById('confirm-proof-reject-btn').addEventListener('click', async () => {
      const scope = document.getElementById('proof-reject-scope').value;
      const item = document.getElementById('proof-reject-item').value;
      const expectedRevision = document.getElementById('proof-reject-revision').value;
      const expectedPrevious = document.getElementById('proof-reject-previous').value || null;
      const reason = document.getElementById('proof-reject-reason').value.trim();

      if (!reason) {
        showToast("Please enter a reason for rejecting this proof.", true);
        return;
      }

      try {
        const res = await fetch('/api/proof/judge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-OpenRig-Session': 'human'
          },
          body: JSON.stringify({
            scope,
            item,
            verdict: 'reject',
            reason,
            expectedRevision,
            expectedPrevious: expectedPrevious || null,
            actorSession: 'human'
          })
        });
        const data = await res.json();
        if (res.ok) {
          showToast("Proof rejected: " + reason);
          closeModal('proof-reject-modal');
          fetchDeliverables();
        } else {
          showToast(data.message || data.error || "Failed to reject proof", true);
        }
      } catch (err) {
        showToast("Error recording proof rejection", true);
      }
    });

    // 1-Click Approve qitem
    async function approveItem(qitemId, summary) {
      try {
        const res = await fetch('/api/mission-control/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            verb: 'approve',
            qitemId,
            actorSession: 'operator@human',
            body: 'Approved via Sidecar'
          })
        });
        const data = await res.json();
        if (res.ok) {
          showToast("Approved: " + (summary || qitemId));
          fetchApprovals();
        } else {
          showToast(data.message || data.error || "Approval failed", true);
        }
      } catch (err) {
        showToast("Error processing approval", true);
      }
    }

    // Open reject modal for qitem
    function openRejectModal(qitemId, summary) {
      document.getElementById('reject-qitem-id').value = qitemId;
      document.getElementById('reject-summary').textContent = summary || qitemId;
      document.getElementById('reject-reason').value = '';
      openModal('reject-modal');
    }

    // Open reply modal for seat
    function openReplyModal(session) {
      document.getElementById('reply-session').value = session;
      document.getElementById('reply-text').value = '';
      openModal('reply-modal');
    }

    // 1-Click Accept proof
    async function acceptProof(scope, item, expectedRevision, expectedPrevious) {
      try {
        const res = await fetch('/api/proof/judge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-OpenRig-Session': 'human'
          },
          body: JSON.stringify({
            scope,
            item,
            verdict: 'accept',
            reason: 'Observed and accepted via OpenRig Sidecar',
            evidence: ['proof/evidence.md'],
            expectedRevision,
            expectedPrevious: expectedPrevious || null,
            actorSession: 'human'
          })
        });
        const data = await res.json();
        if (res.ok) {
          showToast("Proof accepted for " + scope + "#" + item);
          fetchDeliverables();
        } else {
          showToast(data.message || data.error || "Acceptance failed", true);
        }
      } catch (err) {
        showToast("Error recording proof acceptance", true);
      }
    }

    // Open reject proof modal
    function openProofRejectModal(scope, item, text, expectedRevision, expectedPrevious) {
      document.getElementById('proof-reject-scope').value = scope;
      document.getElementById('proof-reject-item').value = item;
      document.getElementById('proof-reject-text').textContent = text || (scope + '#' + item);
      document.getElementById('proof-reject-revision').value = expectedRevision;
      document.getElementById('proof-reject-previous').value = expectedPrevious || '';
      document.getElementById('proof-reject-reason').value = '';
      openModal('proof-reject-modal');
    }

    // Fetch Approvals & Attention
    async function fetchApprovals() {
      try {
        const res = await fetch('/api/attention');
        const data = await res.json();
        const items = data.items || [];
        document.getElementById('approvals-count').textContent = items.length;

        const list = document.getElementById('approvals-list');
        if (items.length === 0) {
          list.innerHTML = '<div class="empty-state">No pending approvals or attention required. All agents operating smoothly.</div>';
          return;
        }

        let html = '';
        for (const item of items) {
          const qitemId = item.id.startsWith('queue:') ? item.id.slice(6) : item.id;
          const isQueue = item.id.startsWith('queue:');
          const urgencyBadge = item.urgency === 'high' || item.urgency === 'critical' ? 'badge-red' : item.urgency === 'outcome' ? 'badge-blue' : 'badge-amber';
          const recipient = item.recipient || 'operator@human';
          const at = item.at ? new Date(item.at).toLocaleTimeString() : '';

          html += \`
            <div class="card">
              <div class="card-header">
                <div>
                  <div class="card-title">\${escapeHtml(item.summary || 'Attention Item')}</div>
                  <div class="card-meta">
                    <span class="badge \${urgencyBadge}">\${escapeHtml(item.urgency || item.kind)}</span>
                    <span>To: \${escapeHtml(recipient)}</span>
                    \${item.scope ? \`<span>• \${escapeHtml(item.scope)}</span>\` : ''}
                    <span>• \${at}</span>
                  </div>
                </div>
              </div>
              \${item.unblocks ? \`<div class="card-meta"><span>Unblocks: \${escapeHtml(item.unblocks)}</span></div>\` : ''}
              <div class="card-actions">
                \${isQueue ? \`
                  <button class="btn btn-success" onclick="approveItem('\${qitemId}', '\${escapeJs(item.summary)}')">
                    ✓ Approve
                  </button>
                  <button class="btn btn-danger" onclick="openRejectModal('\${qitemId}', '\${escapeJs(item.summary)}')">
                    ✕ Reject
                  </button>
                \` : ''}
                <button class="btn btn-primary" onclick="openReplyModal('\${escapeJs(recipient)}')">
                  ↩ Reply
                </button>
              </div>
            </div>
          \`;
        }
        list.innerHTML = html;
      } catch (err) {
        console.error("fetchApprovals error:", err);
      }
    }

    // Fetch Topology
    async function fetchTopology() {
      try {
        const resRigs = await fetch('/api/rigs');
        const rigsList = await resRigs.json();
        const rigs = Array.isArray(rigsList) ? rigsList : (rigsList.rigs || []);

        let totalSeats = 0;
        let html = '';

        for (const r of rigs) {
          const rig = r.rig || r;
          let nodes = rig.nodes || [];
          if (nodes.length === 0 && rig.id) {
            try {
              const resNodes = await fetch('/api/rigs/' + rig.id + '/nodes');
              nodes = await resNodes.json();
            } catch (e) {}
          }
          if (!Array.isArray(nodes)) nodes = [];
          totalSeats += nodes.length;

          // Group by pod
          const pods = {};
          for (const node of nodes) {
            const podName = node.logicalId.split('.')[0] || 'default';
            if (!pods[podName]) pods[podName] = [];
            pods[podName].push(node);
          }

          html += \`
            <div class="rig-container">
              <div class="rig-header">
                <div class="rig-title">
                  <span class="badge badge-blue">RIG</span>
                  <span>\${escapeHtml(rig.name)}</span>
                </div>
                <div class="card-meta">
                  <span>\${nodes.length} seats</span>
                  <span>• Status: \${escapeHtml(rig.status || 'running')}</span>
                </div>
              </div>
              <div class="pod-grid">
          \`;

          for (const [podName, podNodes] of Object.entries(pods)) {
            html += \`
              <div class="pod-card">
                <div class="pod-header">
                  <span>POD: \${escapeHtml(podName)}</span>
                  <span class="badge badge-muted">\${podNodes.length} seats</span>
                </div>
            \`;

            for (const node of podNodes) {
              const sessionName = node.canonicalSessionName || (node.logicalId + '@' + rig.name);
              const runtime = node.runtime || 'antigravity';
              const isAgy = runtime.toLowerCase().includes('antigravity');
              const disp = (node.activityState && node.activityState.display) || node.sessionStatus || 'idle';
              const state = disp === 'working' ? 'working' : (disp === 'needs_input' || disp === 'attention_required') ? 'needs_input' : 'idle';
              const convId = (node.resumeType === 'antigravity_id' ? node.resumeToken : null) || node.resumeToken;

              html += \`
                <div class="seat-item">
                  <div class="seat-top">
                    <div class="seat-name">
                      <div class="live-dot \${state}"></div>
                      <span>\${escapeHtml(node.logicalId)}</span>
                    </div>
                    <span class="badge \${isAgy ? 'badge-blue' : 'badge-muted'}">
                      \${isAgy ? 'Google Antigravity' : escapeHtml(runtime)}
                    </span>
                  </div>
                  <div class="seat-details">
                    \${node.model ? \`<span class="badge badge-muted">Model: \${escapeHtml(node.model)}</span>\` : ''}
                    \${node.effort ? \`<span class="badge badge-muted">Effort: \${escapeHtml(node.effort)}</span>\` : ''}
                  </div>
                  \${convId ? \`
                    <div class="conv-box">
                      <span>Conv: \${escapeHtml(convId.slice(0, 18))}...</span>
                      <button class="conv-copy-btn" onclick="copyToClipboard('\${convId}')">Copy ID</button>
                    </div>
                  \` : ''}
                  <div style="margin-top:4px; display:flex; justify-content:flex-end;">
                    <button class="btn btn-primary" style="padding:2px 8px; font-size:11px;" onclick="openReplyModal('\${sessionName}')">
                      Message
                    </button>
                  </div>
                </div>
              \`;
            }

            html += \`</div>\`;
          }

          html += \`
              </div>
            </div>
          \`;
        }

        document.getElementById('seats-count').textContent = totalSeats;
        document.getElementById('topology-list').innerHTML = html || '<div class="empty-state">No rigs running. Launch a rig to populate topology.</div>';
      } catch (err) {
        console.error("fetchTopology error:", err);
      }
    }

    // Fetch Deliverables & Proofs
    async function fetchDeliverables() {
      try {
        const res = await fetch('/api/proof');
        const data = await res.json();
        let items = data.items || [];
        if (items.length === 0 && data.missions) {
          for (const m of data.missions) {
            for (const s of (m.slices || [])) {
              const sliceItems = (s.readiness && s.readiness.items) || [];
              for (const it of sliceItems) {
                items.push({
                  ...it,
                  scope: m.name + '/slices/' + s.id
                });
              }
            }
          }
        }
        document.getElementById('proofs-count').textContent = items.length;

        const list = document.getElementById('deliverables-list');
        if (items.length === 0) {
          list.innerHTML = '<div class="empty-state">No proof contracts found for current workspace. Deliverables and proofs will populate as contracts are executed.</div>';
          return;
        }

        let html = '';
        for (const item of items) {
          const j = item.judgment;
          const isAccepted = (j && j.verdict === 'accept') || item.state === 'accepted';
          const isRejected = (j && j.verdict === 'reject') || item.state === 'rejected';
          const statusBadge = isAccepted ? 'badge-green' : isRejected ? 'badge-red' : 'badge-amber';
          const statusText = isAccepted ? '✓ Accepted' : isRejected ? '✕ Rejected' : '⏳ Pending / Unjudged';
          const scope = item.scope || data.scope || 'default';

          html += \`
            <div class="card">
              <div class="card-header">
                <div>
                  <div class="card-title">\${escapeHtml(item.text || item.id)}</div>
                  <div class="card-meta">
                    <span class="badge \${statusBadge}">\${statusText}</span>
                    <span>Scope: \${escapeHtml(scope)}</span>
                    <span>Item: #\${escapeHtml(item.id)}</span>
                    \${item.revision ? \`<span>• rev \${escapeHtml(item.revision.slice(0, 8))}</span>\` : ''}
                  </div>
                </div>
              </div>
              \${j ? \`
                <div class="card-body">
<strong>Verdict:</strong> \${j.verdict}
<strong>Judged By:</strong> \${escapeHtml(j.actor || 'human')}
<strong>At:</strong> \${j.at ? new Date(j.at).toLocaleString() : ''}
<strong>Reason:</strong> \${escapeHtml(j.reason || 'None provided')}
                </div>
              \` : \`
                <div class="card-meta">
                  <span>Proof contract defined. Awaiting verification evidence and outcome judgment.</span>
                </div>
              \`}
              <div class="card-actions">
                <button class="btn btn-success" onclick="acceptProof('\${escapeJs(scope)}', '\${escapeJs(item.id)}', '\${escapeJs(item.revision)}', '\${escapeJs(j ? j.id : '')}')">
                  ✓ Accept Proof
                </button>
                <button class="btn btn-danger" onclick="openProofRejectModal('\${escapeJs(scope)}', '\${escapeJs(item.id)}', '\${escapeJs(item.text)}', '\${escapeJs(item.revision)}', '\${escapeJs(j ? j.id : '')}')">
                  ✕ Reject Proof
                </button>
              </div>
            </div>
          \`;
        }

        list.innerHTML = html;
      } catch (err) {
        console.error("fetchDeliverables error:", err);
      }
    }

    function copyToClipboard(text) {
      navigator.clipboard.writeText(text);
      showToast("Copied to clipboard: " + text);
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      })[m]);
    }

    function escapeJs(str) {
      if (!str) return '';
      return String(str).replace(/[\\\\'\\"]/g, '\\\\$&').replace(/\\n/g, '\\\\n');
    }

    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => {
      fetchApprovals();
      fetchTopology();
      fetchDeliverables();
      showToast("Refreshed all views.");
    });

    // Initial load
    fetchApprovals();
    fetchTopology();
    fetchDeliverables();

    // Auto-poll every 3.5 seconds
    setInterval(() => {
      fetchApprovals();
      fetchTopology();
      fetchDeliverables();
    }, 3500);
  </script>
</body>
</html>`;
}
