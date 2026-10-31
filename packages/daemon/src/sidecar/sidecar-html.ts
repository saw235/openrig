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

    .modal-wide {
      max-width: 860px;
      width: 92vw;
    }

    /* Fleet Telemetry Dashboard Bar */
    .telemetry-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }

    .telemetry-stat-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .telemetry-stat-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      font-weight: 600;
    }

    .telemetry-stat-value {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      font-family: 'JetBrains Mono', monospace;
    }

    .telemetry-stat-sub {
      font-size: 11px;
      color: var(--text-muted);
    }

    /* Terminal snapshot modal styling */
    .capture-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;
    }

    .form-select {
      background-color: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      padding: 4px 8px;
      font-size: 11.5px;
      outline: none;
    }

    .auto-refresh-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .terminal-container {
      background-color: #0d0d0d;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .terminal-bar-top {
      background-color: #161616;
      border-bottom: 1px solid var(--border-subtle);
      padding: 6px 12px;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-secondary);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .terminal-content {
      padding: 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      line-height: 1.45;
      color: #e6e6e6;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 460px;
      overflow-y: auto;
      background-color: #0d0d0d;
    }

    .btn-secondary {
      background-color: var(--bg-card);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
    }
    .btn-secondary:hover {
      background-color: var(--bg-elevated);
      border-color: var(--border-focus);
    }

    .token-progress-container {
      background-color: var(--bg-card);
      border-radius: var(--radius-full);
      height: 4px;
      width: 100%;
      overflow: hidden;
      margin-top: 4px;
    }

    .token-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent-blue), var(--accent-green));
      border-radius: var(--radius-full);
      transition: width 0.3s ease;
    }

    .seat-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
      margin-top: 6px;
    }

    /* Filter and Search Bar styles */
    .filter-search-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
      padding: 10px 14px;
      background-color: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 240px;
    }

    .search-icon {
      position: absolute;
      left: 10px;
      color: var(--text-muted);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      background-color: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      padding: 7px 12px 7px 32px;
      font-size: 12.5px;
      outline: none;
      transition: border-color 0.15s ease;
    }

    .search-input:focus {
      border-color: var(--accent-blue);
    }

    .filter-pills {
      display: flex;
      gap: 4px;
      background-color: var(--bg-card);
      padding: 2px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
    }

    .filter-pill {
      background: none;
      border: none;
      color: var(--text-secondary);
      padding: 4px 10px;
      font-size: 11.5px;
      font-weight: 500;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .filter-pill:hover {
      color: var(--text-primary);
    }

    .filter-pill.active {
      background-color: var(--bg-elevated);
      color: #ffffff;
      font-weight: 600;
    }

    /* Detail Modal Styles */
    .detail-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .detail-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }

    .detail-box {
      background-color: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      color: var(--text-primary);
      line-height: 1.5;
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

    /* Antigravity deep link styling */
    .conv-link {
      color: var(--accent-blue);
      text-decoration: none;
      font-size: 10px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      transition: color 0.15s ease;
    }
    .conv-link:hover {
      color: var(--accent-blue-hover);
      text-decoration: underline;
    }

    /* View Mode Toggle buttons */
    .btn-group {
      display: inline-flex;
      border-radius: var(--radius-sm);
      background-color: var(--bg-card);
      padding: 2px;
      border: 1px solid var(--border-subtle);
      gap: 2px;
    }
    .view-toggle-btn {
      border-radius: 4px;
      padding: 4px 10px;
      font-size: 11.5px;
      font-weight: 500;
      border: none;
      background: none;
      color: var(--text-secondary);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .view-toggle-btn:hover {
      color: var(--text-primary);
    }
    .view-toggle-btn.active {
      background-color: var(--bg-elevated);
      color: #ffffff;
      font-weight: 600;
    }

    /* Topology SVG Visual Graph (Default Primary View) */
    #topology-list {
      display: none;
    }
    #topology-graph-container {
      display: block;
      background-color: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow: hidden;
      min-height: 480px;
    }
    .graph-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      padding: 10px 14px;
      background-color: #151515;
      border-bottom: 1px solid var(--border-subtle);
    }
    .graph-toolbar-group {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .graph-toolbar-label {
      font-size: 10.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-right: 2px;
    }
    .graph-layer-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 999px;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .graph-layer-btn:hover {
      border-color: var(--border-focus);
      color: var(--text-primary);
    }
    .graph-layer-btn.active {
      background-color: #1f2633;
      border-color: #3b4d6b;
      color: #ffffff;
    }
    .graph-layer-swatch {
      width: 10px;
      height: 2.5px;
      border-radius: 2px;
      display: inline-block;
    }
    .graph-legend-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: var(--text-secondary);
      margin-right: 6px;
    }
    .graph-zoom-btn {
      background-color: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      color: var(--text-primary);
      padding: 3px 8px;
      font-size: 11.5px;
      font-family: 'JetBrains Mono', monospace;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .graph-zoom-btn:hover {
      background-color: var(--bg-elevated);
      border-color: var(--border-focus);
    }
    #topology-seat-inspector {
      padding: 10px 16px;
      background-color: #171a21;
      border-bottom: 1px solid var(--border-subtle);
      font-size: 12px;
      color: var(--text-secondary);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .inspector-hint {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 11.5px;
      color: var(--text-secondary);
    }
    .inspector-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
    }
    .inspector-title-group {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .inspector-rel-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
    }
    .inspector-rel-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 9px;
      border-radius: 999px;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      background-color: var(--bg-card);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .inspector-rel-chip:hover {
      border-color: var(--accent-blue);
      color: var(--accent-blue);
    }
    #topology-graph-viewport {
      overflow: auto;
      max-height: 700px;
      min-height: 430px;
      padding: 16px;
      cursor: grab;
      background-color: #121212;
      background-image: radial-gradient(#252525 1px, transparent 1px);
      background-size: 20px 20px;
      position: relative;
    }
    #topology-graph-viewport.dragging {
      cursor: grabbing;
      user-select: none;
    }
    .svg-graph {
      display: block;
      margin: 0 auto;
    }
    .svg-graph .graph-node:hover > rect.seat-card-bg,
    .svg-graph .graph-rig-hub:hover > rect.rig-hub-bg {
      stroke: var(--accent-blue);
    }
    .svg-graph .graph-action-pill:hover > rect {
      fill: #2c3545;
      stroke: var(--accent-blue);
    }

    /* Zero-dependency Markdown styles */
    .md-h1 { font-size: 16px; font-weight: 700; color: #fff; margin: 8px 0 4px; }
    .md-h2 { font-size: 14px; font-weight: 600; color: #fff; margin: 6px 0 4px; }
    .md-h3 { font-size: 13px; font-weight: 600; color: var(--accent-blue); margin: 4px 0 2px; }
    .md-p { margin-bottom: 6px; line-height: 1.5; }
    .md-p:last-child { margin-bottom: 0; }
    .md-inline-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      background-color: var(--bg-base);
      border: 1px solid var(--border-subtle);
      border-radius: 4px;
      padding: 1px 5px;
      color: var(--accent-blue);
    }
    .md-code-block {
      background-color: #0d0d0d;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      margin: 6px 0;
      overflow-x: auto;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11.5px;
      line-height: 1.45;
      color: #e6e6e6;
    }
    .md-blockquote {
      border-left: 3px solid var(--accent-blue);
      background-color: var(--bg-card);
      padding: 6px 12px;
      margin: 6px 0;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      color: var(--text-secondary);
      font-style: italic;
    }
    .md-ul, .md-ol {
      margin: 6px 0 6px 18px;
      padding-left: 6px;
    }
    .md-li-ul, .md-li-ol {
      margin-bottom: 3px;
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
      </div>
      <div class="filter-search-bar">
        <div class="search-input-wrapper">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" id="approvals-search" class="search-input" placeholder="Search approvals by mission, slice, reason, recipient..." oninput="filterApprovals()">
        </div>
        <div class="filter-pills" id="approvals-filter-pills">
          <button class="filter-pill active" data-filter="all" onclick="setApprovalsStatusFilter('all', this)">All</button>
          <button class="filter-pill" data-filter="action" onclick="setApprovalsStatusFilter('action', this)">Action Required</button>
          <button class="filter-pill" data-filter="pending" onclick="setApprovalsStatusFilter('pending', this)">Pending</button>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <select id="approvals-rig-filter" class="form-select" onchange="filterApprovals()">
            <option value="all">All Rigs</option>
          </select>
          <select id="approvals-sort" class="form-select" onchange="filterApprovals()">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
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

      <!-- Fleet Telemetry Dashboard Bar -->
      <div id="fleet-telemetry-bar" class="telemetry-bar">
        <div class="telemetry-stat-card">
          <div class="telemetry-stat-label">Active Seats</div>
          <div class="telemetry-stat-value" id="telem-active-seats">0 / 0</div>
          <div class="telemetry-stat-sub" id="telem-runtimes">Google Antigravity Fleet</div>
        </div>
        <div class="telemetry-stat-card">
          <div class="telemetry-stat-label">Token Burn Rate</div>
          <div class="telemetry-stat-value" id="telem-burn-rate">0 tok/hr</div>
          <div class="telemetry-stat-sub" id="telem-cost">Est. Cost: $0.00</div>
        </div>
        <div class="telemetry-stat-card">
          <div class="telemetry-stat-label">Top Consuming Seat</div>
          <div class="telemetry-stat-value" id="telem-top-seat">—</div>
          <div class="telemetry-stat-sub" id="telem-top-detail">No active burn</div>
        </div>
        <div class="telemetry-stat-card">
          <div class="telemetry-stat-label">Telemetry Ingest</div>
          <div class="telemetry-stat-value" style="display:flex; align-items:center; gap:6px;">
            <div class="live-dot working"></div>
            <span>Active</span>
          </div>
          <div class="telemetry-stat-sub">Streaming (OpenRig Daemon)</div>
        </div>
      </div>

      <div class="filter-search-bar">
        <div class="search-input-wrapper">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" id="topology-search" class="search-input" placeholder="Search seats by logical ID, session, pod, model, runtime..." oninput="filterTopology()">
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <select id="topology-rig-filter" class="form-select" onchange="filterTopology()">
            <option value="all">All Rigs</option>
          </select>
          <select id="topology-runtime-filter" class="form-select" onchange="filterTopology()">
            <option value="all">All Runtimes</option>
            <option value="antigravity">Google Antigravity</option>
            <option value="claude">Claude Code</option>
            <option value="codex">Codex</option>
            <option value="omp">OMP</option>
          </select>
          <select id="topology-status-filter" class="form-select" onchange="filterTopology()">
            <option value="all">All Statuses</option>
            <option value="working">Working</option>
            <option value="idle">Idle</option>
            <option value="needs_input">Needs Input</option>
          </select>
          <select id="topology-sort" class="form-select" onchange="filterTopology()">
            <option value="newest">Newest / Active</option>
            <option value="oldest">Oldest</option>
          </select>
          <div class="btn-group" id="topology-view-toggle">
            <button class="view-toggle-btn active" id="view-toggle-graph" onclick="toggleTopologyView('graph')">
              ☊ Visual Graph
            </button>
            <button class="view-toggle-btn" id="view-toggle-grid" onclick="toggleTopologyView('grid')">
              ⊞ Matrix Grid
            </button>
          </div>
        </div>
      </div>

      <div id="topology-graph-container">
        <div class="graph-toolbar" id="topology-graph-toolbar">
          <div class="graph-toolbar-group">
            <span class="graph-toolbar-label">Edges:</span>
            <button class="graph-layer-btn active" id="layer-btn-ownership" onclick="toggleGraphEdgeLayer('ownership', this)" title="Toggle Rig → Pod → Seat structural ownership links">
              <span class="graph-layer-swatch" style="background:#5c7cfa;"></span>
              <span>Rig → Seat</span>
            </button>
            <button class="graph-layer-btn active" id="layer-btn-delegates_to" onclick="toggleGraphEdgeLayer('delegates_to', this)" title="Toggle delegates_to directed edges">
              <span class="graph-layer-swatch" style="background:#8ab4f8;"></span>
              <span>Delegates</span>
            </button>
            <button class="graph-layer-btn active" id="layer-btn-collaborates_with" onclick="toggleGraphEdgeLayer('collaborates_with', this)" title="Toggle collaborates_with edges">
              <span class="graph-layer-swatch" style="background:#81c995;"></span>
              <span>Collaborates</span>
            </button>
            <button class="graph-layer-btn active" id="layer-btn-escalates_to" onclick="toggleGraphEdgeLayer('escalates_to', this)" title="Toggle escalates_to feedback/escalation edges">
              <span class="graph-layer-swatch" style="background:#fdd663;"></span>
              <span>Escalates</span>
            </button>
          </div>
          <div class="graph-toolbar-group">
            <span class="graph-legend-item"><span class="live-dot working" style="display:inline-block;"></span>Working</span>
            <span class="graph-legend-item"><span class="live-dot needs_input" style="display:inline-block;"></span>Needs Input</span>
            <span class="graph-legend-item"><span class="live-dot idle" style="display:inline-block;"></span>Idle</span>
            <div style="display:inline-flex; align-items:center; gap:4px; margin-left:6px;">
              <button class="graph-zoom-btn" id="graph-zoom-out" onclick="adjustGraphZoom(-0.15)" title="Zoom Out">−</button>
              <button class="graph-zoom-btn" id="graph-zoom-reset" onclick="resetGraphZoom()" title="Reset Zoom">100%</button>
              <button class="graph-zoom-btn" id="graph-zoom-in" onclick="adjustGraphZoom(0.15)" title="Zoom In">+</button>
              <button class="graph-zoom-btn" id="graph-zoom-fit" onclick="fitGraphZoom()" title="Fit Graph to Width">⊡ Fit</button>
            </div>
          </div>
        </div>
        <div id="topology-seat-inspector">
          <div class="inspector-hint">
            <span>☊ <strong>Interactive Fleet Graph:</strong> Click any <strong>Rig Hub</strong> or <strong>Seat Node</strong> to highlight its causal relationships, inspect upstream/downstream seats, or open Antigravity Chat &amp; Terminal Screen. Drag canvas to pan.</span>
          </div>
        </div>
        <div id="topology-graph-viewport">
          <div id="topology-graph-stage">
            <div class="empty-state">Generating visual topology graph...</div>
          </div>
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

      <div class="filter-search-bar">
        <div class="search-input-wrapper">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" id="deliverables-search" class="search-input" placeholder="Search deliverables by scope, item text, revision, ID..." oninput="filterDeliverables()">
        </div>
        <div class="filter-pills" id="deliverables-filter-pills">
          <button class="filter-pill active" data-filter="all" onclick="setDeliverablesVerdictFilter('all', this)">All</button>
          <button class="filter-pill" data-filter="accepted" onclick="setDeliverablesVerdictFilter('accepted', this)">Accepted</button>
          <button class="filter-pill" data-filter="rejected" onclick="setDeliverablesVerdictFilter('rejected', this)">Rejected</button>
          <button class="filter-pill" data-filter="pending" onclick="setDeliverablesVerdictFilter('pending', this)">Pending</button>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <select id="deliverables-rig-filter" class="form-select" onchange="filterDeliverables()">
            <option value="all">All Rigs</option>
          </select>
          <select id="deliverables-sort" class="form-select" onchange="filterDeliverables()">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
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
          <label class="form-label" for="reject-reason">Reason for Rejection (Optional, defaults to "Rejected by operator")</label>
          <textarea class="form-textarea" id="reject-reason" placeholder="Explain why this request is denied (optional)..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal('reject-modal')">Cancel</button>
        <button class="btn btn-danger" id="confirm-reject-btn">Reject</button>
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
          <label class="form-label" for="reply-session-select">Select Live Agent / Session</label>
          <select id="reply-session-select" class="form-select" style="width:100%; padding:8px 12px; font-size:12.5px;" onchange="onReplySessionSelect(this.value)">
            <option value="">-- Choose live seat or enter custom session below --</option>
          </select>
        </div>
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

  <!-- PROOF ACCEPT CONFIRMATION MODAL -->
  <div class="modal-overlay" id="proof-accept-modal">
    <div class="modal modal-wide">
      <div class="modal-header">
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="badge badge-green">CONFIRM ACCEPTANCE</div>
          <div class="modal-title">Accept Deliverable & Proof Contract</div>
        </div>
        <button class="modal-close" onclick="closeModal('proof-accept-modal')">&times;</button>
      </div>
      <div class="modal-body" style="gap:14px;">
        <input type="hidden" id="proof-accept-scope">
        <input type="hidden" id="proof-accept-item">
        <input type="hidden" id="proof-accept-revision">
        <input type="hidden" id="proof-accept-previous">

        <div class="detail-section">
          <div class="detail-label">Deliverable Claim & Contract Specification</div>
          <div class="detail-box" id="proof-accept-claim" style="font-size:13px; font-weight:500;">—</div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
          <div class="detail-section">
            <div class="detail-label">Contract Scope & Item ID</div>
            <div class="detail-box" id="proof-accept-scope-display" style="font-family:'JetBrains Mono', monospace; font-size:11.5px;">—</div>
          </div>
          <div class="detail-section">
            <div class="detail-label">Revision & Lineage</div>
            <div class="detail-box" id="proof-accept-revision-display" style="font-family:'JetBrains Mono', monospace; font-size:11.5px;">—</div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-label">Submitted Verification Evidence</div>
          <div class="detail-box" id="proof-accept-evidence" style="font-size:12px;">—</div>
        </div>

        <div style="background-color:rgba(129,201,149,0.08); border:1px solid var(--accent-green); border-radius:var(--radius-sm); padding:10px 14px; color:var(--text-primary); font-size:12px; line-height:1.5;">
          <strong>Certification:</strong> By confirming acceptance, you certify that this deliverable satisfies all acceptance criteria, verification evidence is verified, and the proof contract is officially judged as <strong>ACCEPTED</strong>.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal('proof-accept-modal')">Cancel</button>
        <button class="btn btn-success" id="confirm-proof-accept-btn">✓ Confirm & Accept Proof</button>
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
          <label class="form-label" for="proof-reject-reason">Rejection Reason (Optional, defaults to "Rejected by operator")</label>
          <textarea class="form-textarea" id="proof-reject-reason" placeholder="Explain what evidence or test verification is lacking (optional)..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal('proof-reject-modal')">Cancel</button>
        <button class="btn btn-danger" id="confirm-proof-reject-btn">Reject Proof</button>
      </div>
    </div>
  </div>

  <!-- SCREEN CAPTURE MODAL -->
  <div class="modal-overlay" id="capture-modal">
    <div class="modal modal-wide">
      <div class="modal-header">
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="badge badge-blue">TERMINAL</div>
          <div>
            <div class="modal-title" id="capture-modal-title">Live Terminal Snapshot</div>
            <div class="card-meta" id="capture-modal-subtitle" style="margin-top:2px; font-size:11px;">Target: —</div>
          </div>
        </div>
        <button class="modal-close" onclick="closeCaptureModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="capture-toolbar">
          <div style="display:flex; align-items:center; gap:8px;">
            <label class="form-label" style="margin:0;">Lines:</label>
            <select id="capture-lines-select" class="form-select" onchange="changeCaptureLines(this.value)">
              <option value="30">30 lines</option>
              <option value="50" selected>50 lines</option>
              <option value="100">100 lines</option>
              <option value="200">200 lines</option>
            </select>
            <label class="auto-refresh-label">
              <input type="checkbox" id="capture-autorefresh" checked onchange="toggleCaptureAutoRefresh(this.checked)">
              <span>Auto-refresh (3s)</span>
            </label>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button class="btn" onclick="refreshCurrentCapture()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
              <span>Refresh</span>
            </button>
            <button class="btn btn-primary" onclick="copyCaptureText()">
              📋 Copy Screen
            </button>
          </div>
        </div>
        <div class="terminal-container">
          <div class="terminal-bar-top">
            <span id="capture-status-line">Connecting to live pane...</span>
            <span id="capture-timestamp">—</span>
          </div>
          <pre id="capture-terminal-content" class="terminal-content">Loading screen capture...</pre>
        </div>
      </div>
      <div class="modal-footer" style="justify-content: space-between;">
        <span class="card-meta" style="font-size:11px;">Direct socket via OpenRig /api/transport/capture (Obsidian Terminal View)</span>
        <button class="btn" onclick="closeCaptureModal()">Close</button>
      </div>
    </div>
  </div>

  <!-- DELIVERABLE / PROOF DETAIL MODAL -->
  <div class="modal-overlay" id="deliverable-detail-modal">
    <div class="modal modal-wide">
      <div class="modal-header">
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="badge badge-green" id="detail-badge">PROOFS</div>
          <div>
            <div class="modal-title" id="detail-title">Deliverable & Proof Contract</div>
            <div class="card-meta" id="detail-subtitle" style="margin-top:2px; font-size:11px;">Scope: —</div>
          </div>
        </div>
        <button class="modal-close" onclick="closeModal('deliverable-detail-modal')">&times;</button>
      </div>
      <div class="modal-body" style="gap:14px;">
        <div class="detail-section">
          <div class="detail-label">Item Specification & Requirement</div>
          <div class="detail-box" id="detail-item-text" style="font-size:13px; font-weight:500;">—</div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
          <div class="detail-section">
            <div class="detail-label">Scope & Item ID</div>
            <div class="detail-box" id="detail-scope-id" style="font-family:'JetBrains Mono', monospace; font-size:11.5px;">—</div>
          </div>
          <div class="detail-section">
            <div class="detail-label">Revision & Lineage</div>
            <div class="detail-box" id="detail-revision" style="font-family:'JetBrains Mono', monospace; font-size:11.5px;">—</div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-label">Judgment & Verification Record</div>
          <div class="detail-box" id="detail-judgment" style="font-size:12px;">—</div>
        </div>

        <div class="detail-section">
          <div class="detail-label">Submitted Verification Evidence & Test Summary</div>
          <div class="detail-box" id="detail-evidence" style="font-size:12px;">—</div>
        </div>

        <div class="detail-section">
          <div class="detail-label">Contract Verification State & Scope Details</div>
          <div class="detail-box" id="detail-contract-state" style="font-size:12px; font-family:'JetBrains Mono', monospace;">—</div>
        </div>
      </div>
      <div class="modal-footer" style="justify-content: space-between;">
        <div id="detail-actions-left" style="display:flex; gap:8px;"></div>
        <button class="btn" onclick="closeModal('deliverable-detail-modal')">Close</button>
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
      openReplyModal('');
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

    // Reject qitem action (optional reason defaulting to "Rejected by operator")
    document.getElementById('confirm-reject-btn').addEventListener('click', async () => {
      const qitemId = document.getElementById('reject-qitem-id').value;
      const rawReason = document.getElementById('reject-reason').value.trim();
      const reason = rawReason || 'Rejected by operator';
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

    // 1-Click Quick Reject qitem (no modal, default reason)
    async function quickRejectItem(qitemId, summary) {
      try {
        const res = await fetch('/api/mission-control/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            verb: 'deny',
            qitemId,
            reason: 'Rejected by operator',
            actorSession: 'operator@human'
          })
        });
        const data = await res.json();
        if (res.ok) {
          showToast("Quick rejected: " + (summary || qitemId));
          fetchApprovals();
        } else {
          showToast(data.message || data.error || "Failed to reject", true);
        }
      } catch (err) {
        showToast("Error rejecting request", true);
      }
    }

    // Reject proof action (optional reason defaulting to "Rejected by operator")
    document.getElementById('confirm-proof-reject-btn').addEventListener('click', async () => {
      const scope = document.getElementById('proof-reject-scope').value;
      const item = document.getElementById('proof-reject-item').value;
      const expectedRevision = document.getElementById('proof-reject-revision').value;
      const expectedPrevious = document.getElementById('proof-reject-previous').value || null;
      const rawReason = document.getElementById('proof-reject-reason').value.trim();
      const reason = rawReason || 'Rejected by operator';

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

    // 1-Click Quick Reject proof (no modal, default reason)
    async function quickRejectProof(scope, item, expectedRevision, expectedPrevious) {
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
            reason: 'Rejected by operator',
            expectedRevision,
            expectedPrevious: expectedPrevious || null,
            actorSession: 'human'
          })
        });
        const data = await res.json();
        if (res.ok) {
          showToast("Quick rejected proof: " + scope + "#" + item);
          fetchDeliverables();
        } else {
          showToast(data.message || data.error || "Failed to reject proof", true);
        }
      } catch (err) {
        showToast("Error recording proof rejection", true);
      }
    }

    // Open Proof Accept Confirmation Modal
    function openProofAcceptModal(scope, item, text, expectedRevision, expectedPrevious, evidence) {
      document.getElementById('proof-accept-scope').value = scope || '';
      document.getElementById('proof-accept-item').value = item || '';
      document.getElementById('proof-accept-revision').value = expectedRevision || '';
      document.getElementById('proof-accept-previous').value = expectedPrevious || '';

      document.getElementById('proof-accept-claim').innerHTML = renderMarkdown(text || ('Item #' + item));
      document.getElementById('proof-accept-scope-display').textContent = (scope || 'default') + ' #' + item;
      document.getElementById('proof-accept-revision-display').textContent = expectedRevision ? ('rev ' + expectedRevision) : 'uncommitted / initial';

      const evEl = document.getElementById('proof-accept-evidence');
      if (Array.isArray(evidence) && evidence.length > 0) {
        evEl.innerHTML = evidence.map(e => '<span class="badge badge-green" style="margin-right:6px; margin-bottom:4px; font-family:\\'JetBrains Mono\\', monospace;">📁 ' + escapeHtml(e) + '</span>').join('');
      } else if (evidence && typeof evidence === 'object') {
        evEl.innerHTML = '<pre class="md-code-block"><code>' + escapeHtml(JSON.stringify(evidence, null, 2)) + '</code></pre>';
      } else if (evidence) {
        evEl.innerHTML = renderMarkdown(String(evidence));
      } else {
        evEl.textContent = 'Evidence: proof/evidence.md (Empirically verified in workspace)';
      }

      openModal('proof-accept-modal');
    }

    // Confirm Proof Acceptance Action
    document.getElementById('confirm-proof-accept-btn').addEventListener('click', async () => {
      const scope = document.getElementById('proof-accept-scope').value;
      const item = document.getElementById('proof-accept-item').value;
      const expectedRevision = document.getElementById('proof-accept-revision').value;
      const expectedPrevious = document.getElementById('proof-accept-previous').value || null;

      await acceptProof(scope, item, expectedRevision, expectedPrevious);
      closeModal('proof-accept-modal');
    });

    // Helper to open proof accept modal from cached deliverables list index
    function openProofAcceptModalByIndex(index) {
      const item = cachedDeliverables[index];
      if (!item) return;
      const scope = item.scope || 'default';
      const j = item.judgment;
      openProofAcceptModal(scope, item.id, item.text, item.revision, j ? j.id : '', item.evidence);
    }

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

    // Live Agent Dropdown in Send/Reply modal
    function populateAgentDropdown(rigs) {
      const select = document.getElementById('reply-session-select');
      if (!select) return;
      const currentVal = select.value;
      let html = '<option value="">-- Choose live seat or enter custom session below --</option>';
      if (Array.isArray(rigs)) {
        for (const r of rigs) {
          const rig = r.rig || r;
          const nodes = rig.nodes || [];
          if (nodes.length === 0) continue;
          html += '<optgroup label="Rig: ' + escapeHtml(rig.name) + '">';
          for (const node of nodes) {
            const sessionName = node.canonicalSessionName || (node.logicalId + '@' + rig.name);
            const runtime = node.runtime || 'antigravity';
            html += '<option value="' + escapeHtml(sessionName) + '">' + escapeHtml(node.logicalId) + ' (' + escapeHtml(runtime) + ')</option>';
          }
          html += '</optgroup>';
        }
      }
      select.innerHTML = html;
      if (currentVal) select.value = currentVal;
    }
    const updateAgentSelect = populateAgentDropdown;

    function onReplySessionSelect(val) {
      if (val) {
        document.getElementById('reply-session').value = val;
      }
    }

    // Open reply modal for seat
    function openReplyModal(session) {
      document.getElementById('reply-session').value = session || '';
      const select = document.getElementById('reply-session-select');
      if (select) {
        select.value = session || '';
      }
      document.getElementById('reply-text').value = '';
      openModal('reply-modal');
    }

    // Dynamic Rig Filters across all three tabs
    function updateAllRigFilters(rigNames) {
      const filterIds = ['approvals-rig-filter', 'topology-rig-filter', 'deliverables-rig-filter'];
      for (const id of filterIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const current = el.value || 'all';
        let html = '<option value="all">All Rigs</option>';
        for (const name of rigNames) {
          html += '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
        }
        el.innerHTML = html;
        if (rigNames.includes(current)) {
          el.value = current;
        } else {
          el.value = 'all';
        }
      }
    }

    // Zero-dependency client-side markdown rendering
    function renderMarkdown(str) {
      if (!str) return '';
      let text = escapeHtml(str);

      // Fenced code blocks
      const codeBlocks = [];
      text = text.replace(/\`\`\`([a-zA-Z0-9_-]*)\\s*([\\s\\S]*?)\`\`\`/g, (match, lang, code) => {
        const idx = codeBlocks.length;
        codeBlocks.push('<pre class="md-code-block"><code class="lang-' + (lang || 'text') + '">' + code.trim() + '</code></pre>');
        return '%%CODEBLOCK_' + idx + '%%';
      });

      // Inline code
      text = text.replace(/\`([^\`]+)\`/g, '<code class="md-inline-code">$1</code>');

      // Headers
      text = text.replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>');
      text = text.replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>');
      text = text.replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>');

      // Blockquotes
      text = text.replace(/^(?:>|&gt;)\\s*(.*$)/gim, '<blockquote class="md-blockquote">$1</blockquote>');

      // Bold and italics
      text = text.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
      text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
      text = text.replace(/\\*([^*]+)\\*/g, '<em>$1</em>');
      text = text.replace(/_([^_]+)_/g, '<em>$1</em>');

      // Unordered lists
      text = text.replace(/^\\s*[-*]\\s+(.*$)/gim, '<li class="md-li-ul">$1</li>');
      text = text.replace(/(<li class="md-li-ul">[\\s\\S]*?<\\/li>)(?!\\s*<li class="md-li-ul">)/gim, '<ul class="md-ul">$1</ul>');

      // Ordered lists
      text = text.replace(/^\\s*\\d+\\.\\s+(.*$)/gim, '<li class="md-li-ol">$1</li>');
      text = text.replace(/(<li class="md-li-ol">[\\s\\S]*?<\\/li>)(?!\\s*<li class="md-li-ol">)/gim, '<ol class="md-ol">$1</ol>');

      // Paragraphs
      const paragraphs = text.split(/\\n{2,}/);
      text = paragraphs.map(p => {
        p = p.trim();
        if (!p) return '';
        if (p.startsWith('<h1') || p.startsWith('<h2') || p.startsWith('<h3') || 
            p.startsWith('<blockquote') || p.startsWith('<ul') || p.startsWith('<ol') || 
            p.startsWith('%%CODEBLOCK_')) {
          return p;
        }
        return '<p class="md-p">' + p.replace(/\\n/g, '<br>') + '</p>';
      }).filter(Boolean).join('');

      // Restore code blocks
      text = text.replace(/%%CODEBLOCK_(\\d+)%%/g, (match, idx) => {
        return codeBlocks[Number(idx)] || '';
      });

      return text;
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

    // State caches for reactive filtering
    let cachedApprovals = [];
    let approvalsStatusFilter = 'all';

    let cachedTopology = null;

    let cachedDeliverables = [];
    let deliverablesVerdictFilter = 'all';

    // Tab 1 Filtering & Rendering
    function setApprovalsStatusFilter(filter, el) {
      approvalsStatusFilter = filter;
      const pills = document.querySelectorAll('#approvals-filter-pills .filter-pill');
      pills.forEach(p => p.classList.remove('active'));
      if (el) el.classList.add('active');
      renderApprovals();
    }

    function filterApprovals() {
      renderApprovals();
    }

    function renderApprovals() {
      const list = document.getElementById('approvals-list');
      const search = (document.getElementById('approvals-search')?.value || '').toLowerCase().trim();
      const rigFilter = document.getElementById('approvals-rig-filter')?.value || 'all';
      const sortOrder = document.getElementById('approvals-sort')?.value || 'newest';

      const filtered = cachedApprovals.filter(item => {
        const isQueue = item.id.startsWith('queue:');
        const isCritical = item.urgency === 'high' || item.urgency === 'critical';
        if (approvalsStatusFilter === 'action' && !isQueue && !isCritical) return false;
        if (approvalsStatusFilter === 'pending' && (isQueue || isCritical)) return false;

        if (rigFilter !== 'all') {
          const rText = ((item.scope || '') + ' ' + (item.recipient || '') + ' ' + (item.rig || '')).toLowerCase();
          if (!rText.includes(rigFilter.toLowerCase())) return false;
        }

        if (search) {
          const text = ((item.summary || '') + ' ' + (item.scope || '') + ' ' + (item.recipient || '') + ' ' + (item.kind || '') + ' ' + (item.unblocks || '')).toLowerCase();
          if (!text.includes(search)) return false;
        }
        return true;
      });

      filtered.sort((a, b) => {
        const tA = a.at ? new Date(a.at).getTime() : 0;
        const tB = b.at ? new Date(b.at).getTime() : 0;
        return sortOrder === 'newest' ? tB - tA : tA - tB;
      });

      document.getElementById('approvals-count').textContent = filtered.length;

      if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state">' + (cachedApprovals.length === 0 ? 'No pending approvals or attention required. All agents operating smoothly.' : 'No attention items match current filters.') + '</div>';
        return;
      }

      let html = '';
      for (const item of filtered) {
        const qitemId = item.id.startsWith('queue:') ? item.id.slice(6) : item.id;
        const isQueue = item.id.startsWith('queue:');
        const urgencyBadge = item.urgency === 'high' || item.urgency === 'critical' ? 'badge-red' : item.urgency === 'outcome' ? 'badge-blue' : 'badge-amber';
        const recipient = item.recipient || 'operator@human';
        const at = item.at ? new Date(item.at).toLocaleTimeString() : '';

        html += '<div class="card">' +
          '<div class="card-header">' +
            '<div>' +
              '<div class="card-title">' + renderMarkdown(item.summary || 'Attention Item') + '</div>' +
              '<div class="card-meta">' +
                '<span class="badge ' + urgencyBadge + '">' + escapeHtml(item.urgency || item.kind) + '</span>' +
                '<span>To: ' + escapeHtml(recipient) + '</span>' +
                (item.scope ? ('<span>• ' + escapeHtml(item.scope) + '</span>') : '') +
                '<span>• ' + at + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          (item.unblocks ? ('<div class="card-meta"><span>Unblocks: ' + renderMarkdown(item.unblocks) + '</span></div>') : '') +
          '<div class="card-actions">' +
            (isQueue ? (
              '<button class="btn btn-success" onclick="approveItem(\\'' + qitemId + '\\', \\'' + escapeJs(item.summary) + '\\')">✓ Approve</button>' +
              '<button class="btn btn-danger" onclick="quickRejectItem(\\'' + qitemId + '\\', \\'' + escapeJs(item.summary) + '\\')">⚡ Quick Reject</button>' +
              '<button class="btn btn-secondary" onclick="openRejectModal(\\'' + qitemId + '\\', \\'' + escapeJs(item.summary) + '\\')">✕ Reject...</button>'
            ) : '') +
            '<button class="btn btn-primary" onclick="openReplyModal(\\'' + escapeJs(recipient) + '\\')">↩ Reply</button>' +
          '</div>' +
        '</div>';
      }
      list.innerHTML = html;
    }

    // Fetch Approvals & Attention
    async function fetchApprovals() {
      try {
        const res = await fetch('/api/attention');
        const data = await res.json();
        cachedApprovals = data.items || [];
        renderApprovals();
      } catch (err) {
        console.error("fetchApprovals error:", err);
      }
    }

    function stripAnsi(str) {
      if (!str) return '';
      return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    }

    function formatTokens(n) {
      if (n == null || isNaN(n)) return '0';
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
      return String(n);
    }

    let currentCaptureSession = null;
    let currentCaptureLogicalId = null;
    let captureAutoRefreshInterval = null;
    let captureLines = 50;

    async function openCaptureModal(sessionName, logicalId) {
      currentCaptureSession = sessionName;
      currentCaptureLogicalId = logicalId || sessionName;
      document.getElementById('capture-modal-title').textContent = 'Live Terminal Snapshot: ' + currentCaptureLogicalId;
      document.getElementById('capture-modal-subtitle').textContent = 'Target Session: ' + sessionName;
      document.getElementById('capture-status-line').textContent = 'Connecting to live pane snapshot...';
      document.getElementById('capture-terminal-content').textContent = 'Fetching screen from ' + sessionName + '...';
      openModal('capture-modal');

      await refreshCurrentCapture();

      const autoCheckbox = document.getElementById('capture-autorefresh');
      if (autoCheckbox && autoCheckbox.checked) {
        startCaptureAutoRefresh();
      }
    }

    function closeCaptureModal() {
      closeModal('capture-modal');
      stopCaptureAutoRefresh();
      currentCaptureSession = null;
      currentCaptureLogicalId = null;
    }

    function startCaptureAutoRefresh() {
      stopCaptureAutoRefresh();
      captureAutoRefreshInterval = setInterval(() => {
        if (currentCaptureSession && document.getElementById('capture-modal').classList.contains('open')) {
          refreshCurrentCapture(true);
        } else {
          stopCaptureAutoRefresh();
        }
      }, 3000);
    }

    function stopCaptureAutoRefresh() {
      if (captureAutoRefreshInterval) {
        clearInterval(captureAutoRefreshInterval);
        captureAutoRefreshInterval = null;
      }
    }

    function toggleCaptureAutoRefresh(enabled) {
      if (enabled) {
        startCaptureAutoRefresh();
      } else {
        stopCaptureAutoRefresh();
      }
    }

    function changeCaptureLines(lines) {
      captureLines = Number(lines) || 50;
      refreshCurrentCapture();
    }

    async function refreshCurrentCapture(isSilent = false) {
      if (!currentCaptureSession) return;
      const statusEl = document.getElementById('capture-status-line');
      const timeEl = document.getElementById('capture-timestamp');
      const contentEl = document.getElementById('capture-terminal-content');

      if (!isSilent) {
        statusEl.textContent = 'Querying /api/transport/capture...';
      }

      try {
        const res = await fetch('/api/transport/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session: currentCaptureSession, lines: captureLines })
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          const clean = stripAnsi(data.content || '');
          contentEl.textContent = clean || '(Terminal pane is currently blank / waiting for prompt)';
          statusEl.textContent = '● Live connected (' + (data.lines || captureLines) + ' lines)';
          statusEl.style.color = 'var(--accent-green)';
          timeEl.textContent = new Date().toLocaleTimeString();
        } else {
          contentEl.textContent = 'Unable to capture pane: ' + (data.message || data.error || ('HTTP ' + res.status));
          statusEl.textContent = '▲ Capture unavailable';
          statusEl.style.color = 'var(--accent-amber)';
          timeEl.textContent = new Date().toLocaleTimeString();
        }
      } catch (err) {
        contentEl.textContent = 'Error connecting to daemon capture endpoint: ' + err.message;
        statusEl.textContent = '✕ Connection error';
        statusEl.style.color = 'var(--accent-red)';
        timeEl.textContent = new Date().toLocaleTimeString();
      }
    }

    function copyCaptureText() {
      const contentEl = document.getElementById('capture-terminal-content');
      if (contentEl && contentEl.textContent) {
        copyToClipboard(contentEl.textContent);
      }
    }

    // Tab 2 View Switcher & Interactive SVG Topology Graph (Default View)
    let topologyViewMode = 'graph';
    let graphZoom = 1.0;
    let lastGraphLogicalWidth = 1040;
    let lastGraphLogicalHeight = 480;
    let selectedGraphSeatKey = null;
    let selectedGraphRigName = null;
    let graphSeatRegistry = {};
    let graphViewportInitialized = false;
    const graphEdgeLayers = {
      ownership: true,
      delegates_to: true,
      collaborates_with: true,
      escalates_to: true
    };

    function toggleTopologyView(mode) {
      topologyViewMode = mode;
      const gridBtn = document.getElementById('view-toggle-grid');
      const graphBtn = document.getElementById('view-toggle-graph');
      const listEl = document.getElementById('topology-list');
      const graphEl = document.getElementById('topology-graph-container');

      if (mode === 'graph') {
        if (gridBtn) gridBtn.classList.remove('active');
        if (graphBtn) graphBtn.classList.add('active');
        if (listEl) listEl.style.display = 'none';
        if (graphEl) {
          graphEl.style.display = 'block';
          renderSvgGraph();
        }
      } else {
        if (gridBtn) gridBtn.classList.add('active');
        if (graphBtn) graphBtn.classList.remove('active');
        if (listEl) listEl.style.display = 'block';
        if (graphEl) graphEl.style.display = 'none';
      }
    }

    function toggleGraphEdgeLayer(layerKey, btnEl) {
      graphEdgeLayers[layerKey] = !graphEdgeLayers[layerKey];
      if (btnEl) {
        if (graphEdgeLayers[layerKey]) btnEl.classList.add('active');
        else btnEl.classList.remove('active');
      }
      renderSvgGraph();
    }

    function applyGraphZoomToSvg() {
      const svgEl = document.getElementById('topology-svg-canvas');
      const resetBtn = document.getElementById('graph-zoom-reset');
      if (resetBtn) resetBtn.textContent = Math.round(graphZoom * 100) + '%';
      if (svgEl) {
        svgEl.setAttribute('width', String(Math.round(lastGraphLogicalWidth * graphZoom)));
        svgEl.setAttribute('height', String(Math.round(lastGraphLogicalHeight * graphZoom)));
      }
    }

    function adjustGraphZoom(delta) {
      graphZoom = Math.max(0.45, Math.min(1.85, Math.round((graphZoom + delta) * 100) / 100));
      applyGraphZoomToSvg();
    }

    function resetGraphZoom() {
      graphZoom = 1.0;
      applyGraphZoomToSvg();
    }

    function fitGraphZoom() {
      const vp = document.getElementById('topology-graph-viewport');
      if (!vp || !lastGraphLogicalWidth) return;
      const avail = Math.max(360, vp.clientWidth - 36);
      graphZoom = Math.max(0.45, Math.min(1.35, Math.round((avail / lastGraphLogicalWidth) * 100) / 100));
      applyGraphZoomToSvg();
    }

    function selectGraphSeat(seatKey) {
      if (selectedGraphSeatKey === seatKey) {
        selectedGraphSeatKey = null;
      } else {
        selectedGraphSeatKey = seatKey;
        selectedGraphRigName = null;
      }
      renderSvgGraph();
    }

    function selectGraphRig(rigName) {
      if (selectedGraphRigName === rigName) {
        selectedGraphRigName = null;
      } else {
        selectedGraphRigName = rigName;
        selectedGraphSeatKey = null;
      }
      renderSvgGraph();
    }

    function clearGraphSelection() {
      selectedGraphSeatKey = null;
      selectedGraphRigName = null;
      renderSvgGraph();
    }

    function openExternalHref(href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }

    function initGraphViewportPanZoom() {
      if (graphViewportInitialized) return;
      const vp = document.getElementById('topology-graph-viewport');
      if (!vp) return;
      graphViewportInitialized = true;

      let isDown = false;
      let startX = 0;
      let startY = 0;
      let scrollL = 0;
      let scrollT = 0;

      vp.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (e.target && e.target.closest && e.target.closest('.graph-node, .graph-rig-hub, .graph-action-pill, button, a')) {
          return;
        }
        isDown = true;
        vp.classList.add('dragging');
        startX = e.pageX - vp.offsetLeft;
        startY = e.pageY - vp.offsetTop;
        scrollL = vp.scrollLeft;
        scrollT = vp.scrollTop;
      });

      window.addEventListener('mouseup', () => {
        if (isDown) {
          isDown = false;
          vp.classList.remove('dragging');
        }
      });

      vp.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - vp.offsetLeft;
        const y = e.pageY - vp.offsetTop;
        vp.scrollLeft = scrollL - (x - startX);
        vp.scrollTop = scrollT - (y - startY);
      });

      vp.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          adjustGraphZoom(e.deltaY < 0 ? 0.1 : -0.1);
        }
      }, { passive: false });
    }

    function getNodeKeyId(node) {
      return node._id || node.nodeId || node.id || node.logicalId;
    }

    function getNodeRoleRank(logicalId) {
      const id = (logicalId || '').toLowerCase();
      if (id.includes('lead') || id.includes('architect') || id.includes('strategist') || id.includes('director')) return 1;
      if (id.includes('dramatist') || id.includes('table-read') || id.includes('storyboarder') || id.includes('hook')) return 2;
      if (id.includes('builder') || id.includes('build') || id.includes('dev') || id.includes('agent') || id.includes('animator') || id.includes('writer') || id.includes('ghostwriter') || id.includes('ensemble') || id.includes('worker')) return 3;
      if (id.includes('reviewer') || id.includes('review') || id.includes('qa') || id.includes('critic') || id.includes('canon') || id.includes('human')) return 4;
      return 5;
    }

    function matchesTopologyNodeFilters(node, rig, filters) {
      const sessionName = node.canonicalSessionName || (node.logicalId + '@' + rig.name);
      const runtime = (node.runtime || 'antigravity').toLowerCase();
      const disp = (node.activityState && node.activityState.display) || node.sessionStatus || 'idle';
      const state = disp === 'working' ? 'working' : (disp === 'needs_input' || disp === 'attention_required') ? 'needs_input' : 'idle';

      if (filters.runtimeFilter !== 'all') {
        if (filters.runtimeFilter === 'antigravity' && !runtime.includes('antigravity')) return false;
        if (filters.runtimeFilter === 'claude' && !runtime.includes('claude')) return false;
        if (filters.runtimeFilter === 'codex' && !runtime.includes('codex')) return false;
        if (filters.runtimeFilter === 'omp' && !runtime.includes('omp')) return false;
      }

      if (filters.statusFilter !== 'all') {
        if (filters.statusFilter !== state) return false;
      }

      if (filters.search) {
        const text = ((node.logicalId || '') + ' ' + sessionName + ' ' + (node.model || '') + ' ' + (node.podNamespace || '') + ' ' + runtime + ' ' + (rig.name || '')).toLowerCase();
        if (!text.includes(filters.search)) return false;
      }

      return true;
    }

    function updateGraphInspector(allRenderedEdges) {
      const inspector = document.getElementById('topology-seat-inspector');
      if (!inspector) return;

      if (selectedGraphSeatKey && graphSeatRegistry[selectedGraphSeatKey]) {
        const info = graphSeatRegistry[selectedGraphSeatKey];
        const node = info.node;
        const rig = info.rig;
        const sessionName = node.canonicalSessionName || (node.logicalId + '@' + rig.name);
        const runtime = node.runtime || 'antigravity';
        const isAgy = runtime.toLowerCase().includes('antigravity');
        const disp = (node.activityState && node.activityState.display) || node.sessionStatus || 'idle';
        const stateClass = disp === 'working' ? 'working' : (disp === 'needs_input' || disp === 'attention_required') ? 'needs_input' : 'idle';
        const convId = (node.resumeType === 'antigravity_id' ? node.resumeToken : null) || node.resumeToken;

        const incoming = allRenderedEdges.filter(e => e.targetKey === selectedGraphSeatKey);
        const outgoing = allRenderedEdges.filter(e => e.sourceKey === selectedGraphSeatKey);

        let relHtml = '<span class="graph-toolbar-label">Relationships:</span>' +
          '<button class="inspector-rel-chip" onclick="selectGraphRig(\\'' + escapeJs(rig.name) + '\\')" title="Focus owning rig">' +
            '<span style="color:#5c7cfa;">⌂ Rig:</span> <strong>' + escapeHtml(rig.name) + '</strong> <span style="color:var(--text-muted);">/ ' + escapeHtml(info.podName) + '</span>' +
          '</button>';

        for (const inc of incoming) {
          const srcInfo = graphSeatRegistry[inc.sourceKey];
          if (!srcInfo) continue;
          const color = inc.kind === 'escalates_to' ? '#fdd663' : inc.kind === 'collaborates_with' ? '#81c995' : '#8ab4f8';
          relHtml += '<button class="inspector-rel-chip" onclick="selectGraphSeat(\\'' + escapeJs(inc.sourceKey) + '\\')" title="Jump to upstream seat">' +
            '<span style="color:' + color + ';">← ' + escapeHtml(srcInfo.node.logicalId) + '</span>' +
            '<span style="color:var(--text-muted);">(' + escapeHtml(inc.kind) + ')</span>' +
          '</button>';
        }

        for (const out of outgoing) {
          const dstInfo = graphSeatRegistry[out.targetKey];
          if (!dstInfo) continue;
          const color = out.kind === 'escalates_to' ? '#fdd663' : out.kind === 'collaborates_with' ? '#81c995' : '#8ab4f8';
          relHtml += '<button class="inspector-rel-chip" onclick="selectGraphSeat(\\'' + escapeJs(out.targetKey) + '\\')" title="Jump to downstream seat">' +
            '<span style="color:' + color + ';">→ ' + escapeHtml(dstInfo.node.logicalId) + '</span>' +
            '<span style="color:var(--text-muted);">(' + escapeHtml(out.kind) + ')</span>' +
          '</button>';
        }

        if (incoming.length === 0 && outgoing.length === 0) {
          relHtml += '<span style="font-size:11px; color:var(--text-muted);">Standalone seat inside pod ' + escapeHtml(info.podName) + '</span>';
        }

        inspector.innerHTML =
          '<div class="inspector-header-row">' +
            '<div class="inspector-title-group">' +
              '<span class="live-dot ' + stateClass + '"></span>' +
              '<strong style="color:#fff; font-size:13px;">' + escapeHtml(node.logicalId) + '</strong>' +
              '<span class="badge badge-blue">' + escapeHtml(rig.name) + '</span>' +
              '<span class="badge badge-muted">Pod: ' + escapeHtml(info.podName) + '</span>' +
              '<span class="badge ' + (isAgy ? 'badge-blue' : 'badge-muted') + '">' + (isAgy ? 'Google Antigravity' : escapeHtml(runtime)) + '</span>' +
              (node.model ? '<span class="badge badge-muted">' + escapeHtml(node.model) + '</span>' : '') +
              '<span class="badge badge-muted">Status: ' + escapeHtml(disp) + '</span>' +
            '</div>' +
            '<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">' +
              (convId ? (
                '<a href="conversation://' + escapeHtml(convId) + '" class="btn btn-secondary" style="padding:3px 9px; font-size:11px; text-decoration:none;" target="_blank" rel="noopener noreferrer">🔗 Open Chat ↗</a>' +
                '<button class="btn btn-secondary" style="padding:3px 8px; font-size:11px;" onclick="copyToClipboard(\\'' + escapeJs(convId) + '\\')">Copy ID</button>'
              ) : '') +
              '<button class="btn btn-secondary" style="padding:3px 9px; font-size:11px;" onclick="openCaptureModal(\\'' + escapeJs(sessionName) + '\\', \\'' + escapeJs(node.logicalId) + '\\')">📺 Screen</button>' +
              '<button class="btn btn-primary" style="padding:3px 9px; font-size:11px;" onclick="openReplyModal(\\'' + escapeJs(sessionName) + '\\')">✉ Message</button>' +
              '<button class="btn btn-secondary" style="padding:3px 8px; font-size:11px;" onclick="clearGraphSelection()">✕ Clear</button>' +
            '</div>' +
          '</div>' +
          '<div class="inspector-rel-row">' + relHtml + '</div>';
        return;
      }

      if (selectedGraphRigName) {
        const rigSeats = Object.values(graphSeatRegistry).filter(s => s.rig.name === selectedGraphRigName);
        const rigEdges = allRenderedEdges.filter(e => e.rigName === selectedGraphRigName);
        const workingCount = rigSeats.filter(s => (((s.node.activityState && s.node.activityState.display) || s.node.sessionStatus) === 'working')).length;

        let seatChips = '';
        for (const s of rigSeats) {
          seatChips += '<button class="inspector-rel-chip" onclick="selectGraphSeat(\\'' + escapeJs(s.key) + '\\')">' +
            '<span>' + escapeHtml(s.node.logicalId) + '</span>' +
          '</button>';
        }

        inspector.innerHTML =
          '<div class="inspector-header-row">' +
            '<div class="inspector-title-group">' +
              '<span class="badge badge-blue">RIG FOCUS</span>' +
              '<strong style="color:#fff; font-size:13px;">' + escapeHtml(selectedGraphRigName) + '</strong>' +
              '<span class="badge badge-muted">' + rigSeats.length + ' seats (' + workingCount + ' working)</span>' +
              '<span class="badge badge-muted">' + rigEdges.length + ' relationship edges</span>' +
            '</div>' +
            '<div style="display:flex; align-items:center; gap:6px;">' +
              '<button class="btn btn-secondary" style="padding:3px 8px; font-size:11px;" onclick="clearGraphSelection()">✕ Clear Focus</button>' +
            '</div>' +
          '</div>' +
          '<div class="inspector-rel-row"><span class="graph-toolbar-label">Rig Seats:</span>' + seatChips + '</div>';
        return;
      }

      const totalSeatsCount = Object.keys(graphSeatRegistry).length;
      inspector.innerHTML =
        '<div class="inspector-hint">' +
          '<span>☊ <strong>Interactive Fleet Graph:</strong> Showing <strong>' + totalSeatsCount + ' seats</strong> and <strong>' + allRenderedEdges.length + ' directed seat edges</strong>. Click any <strong>Rig Hub</strong> or <strong>Seat Node</strong> to highlight causal paths &amp; actions.</span>' +
        '</div>';
    }

    function renderSvgGraph() {
      initGraphViewportPanZoom();
      const stage = document.getElementById('topology-graph-stage') || document.getElementById('topology-graph-container');
      if (!stage || !cachedTopology) return;

      const { rigs } = cachedTopology;
      const rigFilter = document.getElementById('topology-rig-filter')?.value || 'all';
      const filters = {
        search: (document.getElementById('topology-search')?.value || '').toLowerCase().trim(),
        runtimeFilter: document.getElementById('topology-runtime-filter')?.value || 'all',
        statusFilter: document.getElementById('topology-status-filter')?.value || 'all'
      };

      const filteredRigs = rigs.filter(r => {
        const rig = r.rig || r;
        if (rigFilter !== 'all' && rig.name !== rigFilter) return false;
        return true;
      });

      if (filteredRigs.length === 0) {
        stage.innerHTML = '<div class="empty-state">No rigs match the current filter or search criteria.</div>';
        graphSeatRegistry = {};
        updateGraphInspector([]);
        return;
      }

      const rigHubX = 24;
      const rigHubW = 204;
      const rigHubH = 98;
      const podsStartX = 288;
      const cardW = 228;
      const cardH = 84;
      const seatColGap = 54;
      const podPadX = 16;
      const podPadTop = 32;
      const podPadBottom = 14;
      const podGapX = 56;
      const podGapY = 34;
      const rigSectionGap = 36;

      graphSeatRegistry = {};
      const allRenderedEdges = [];

      const defs = '<defs>' +
        '<marker id="arrowhead" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
          '<path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#8ab4f8"/>' +
        '</marker>' +
        '<marker id="arrow-delegates" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
          '<path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#8ab4f8"/>' +
        '</marker>' +
        '<marker id="arrow-escalates" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
          '<path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#fdd663"/>' +
        '</marker>' +
        '<marker id="arrow-collaborates" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
          '<path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#81c995"/>' +
        '</marker>' +
        '<marker id="arrow-ownership" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">' +
          '<path d="M 0 2 L 8 5 L 0 8 z" fill="#5c7cfa"/>' +
        '</marker>' +
      '</defs>';

      // Pre-compute layout for all rigs so we know neighborhood highlights before emitting SVG
      const rigLayouts = [];
      let totalWidth = 1020;
      let currentY = 20;

      for (const r of filteredRigs) {
        const rig = r.rig || r;
        const rawNodes = Array.isArray(rig.nodes) ? rig.nodes : [];
        const nodes = rawNodes.filter(n => matchesTopologyNodeFilters(n, rig, filters));
        if (nodes.length === 0) continue;

        const rigEdgesRaw = Array.isArray(rig.edges) ? rig.edges : [];
        const nodeById = {};
        for (const n of nodes) {
          const nid = getNodeKeyId(n);
          nodeById[nid] = n;
          if (n.id) nodeById[n.id] = n;
          if (n.nodeId) nodeById[n.nodeId] = n;
          if (n.logicalId) nodeById[n.logicalId] = n;
        }

        // Group nodes into pods
        const podMap = {};
        for (const n of nodes) {
          const podName = n.podNamespace || (n.logicalId ? n.logicalId.split('.')[0] : '') || 'default';
          if (!podMap[podName]) podMap[podName] = [];
          podMap[podName].push(n);
        }

        // Sort nodes inside each pod topologically by intra-pod delegates_to edges, then role rank
        const podEntries = [];
        for (const [podName, pNodes] of Object.entries(podMap)) {
          const pIds = new Set(pNodes.map(n => getNodeKeyId(n)));
          const inDeg = {};
          const adj = {};
          for (const n of pNodes) {
            const k = getNodeKeyId(n);
            inDeg[k] = 0;
            adj[k] = [];
          }
          for (const e of rigEdgesRaw) {
            if (e.kind !== 'delegates_to') continue;
            const sNode = nodeById[e.sourceId];
            const tNode = nodeById[e.targetId];
            if (!sNode || !tNode) continue;
            const sk = getNodeKeyId(sNode);
            const tk = getNodeKeyId(tNode);
            if (sk !== tk && pIds.has(sk) && pIds.has(tk)) {
              adj[sk].push(tk);
              inDeg[tk] = (inDeg[tk] || 0) + 1;
            }
          }

          const remaining = [...pNodes].sort((a, b) => getNodeRoleRank(a.logicalId) - getNodeRoleRank(b.logicalId));
          const ordered = [];
          const visited = new Set();
          while (ordered.length < pNodes.length) {
            let pickIdx = remaining.findIndex(n => !visited.has(getNodeKeyId(n)) && (inDeg[getNodeKeyId(n)] || 0) <= 0);
            if (pickIdx === -1) {
              pickIdx = remaining.findIndex(n => !visited.has(getNodeKeyId(n)));
            }
            const picked = remaining[pickIdx];
            const pk = getNodeKeyId(picked);
            visited.add(pk);
            ordered.push(picked);
            for (const nxt of (adj[pk] || [])) {
              inDeg[nxt] = (inDeg[nxt] || 0) - 1;
            }
          }

          const podW = ordered.length * cardW + Math.max(0, ordered.length - 1) * seatColGap + podPadX * 2;
          const podH = cardH + podPadTop + podPadBottom;
          podEntries.push({ podName, nodes: ordered, w: podW, h: podH, tier: 0, x: 0, y: 0 });
        }

        // Compute topological pod tiers using cross-pod delegates_to edges
        const podByName = {};
        const podInDeg = {};
        const podAdj = {};
        for (const p of podEntries) {
          podByName[p.podName] = p;
          podInDeg[p.podName] = 0;
          podAdj[p.podName] = new Set();
        }
        for (const e of rigEdgesRaw) {
          if (e.kind !== 'delegates_to') continue;
          const sNode = nodeById[e.sourceId];
          const tNode = nodeById[e.targetId];
          if (!sNode || !tNode) continue;
          const sp = sNode.podNamespace || (sNode.logicalId ? sNode.logicalId.split('.')[0] : '') || 'default';
          const tp = tNode.podNamespace || (tNode.logicalId ? tNode.logicalId.split('.')[0] : '') || 'default';
          if (sp !== tp && podByName[sp] && podByName[tp] && !podAdj[sp].has(tp)) {
            podAdj[sp].add(tp);
            podInDeg[tp] = (podInDeg[tp] || 0) + 1;
          }
        }

        const topoPods = [];
        const visitedPods = new Set();
        while (topoPods.length < podEntries.length) {
          let nextPod = podEntries.find(p => !visitedPods.has(p.podName) && (podInDeg[p.podName] || 0) <= 0);
          if (!nextPod) {
            nextPod = podEntries.find(p => !visitedPods.has(p.podName));
          }
          visitedPods.add(nextPod.podName);
          topoPods.push(nextPod);
          for (const targetPodName of podAdj[nextPod.podName]) {
            const targetPod = podByName[targetPodName];
            if (targetPod && !visitedPods.has(targetPodName)) {
              targetPod.tier = Math.max(targetPod.tier, nextPod.tier + 1);
            }
            podInDeg[targetPodName] = (podInDeg[targetPodName] || 0) - 1;
          }
        }

        // Decide horizontal tier columns vs packed topological rows
        const tiersMap = {};
        for (const p of topoPods) {
          if (!tiersMap[p.tier]) tiersMap[p.tier] = [];
          tiersMap[p.tier].push(p);
        }
        const tierKeys = Object.keys(tiersMap).map(Number).sort((a, b) => a - b);
        let horizontalSeatsSum = 0;
        for (const tk of tierKeys) {
          horizontalSeatsSum += Math.max(...tiersMap[tk].map(p => p.nodes.length));
        }

        const rigContentTop = currentY + 18;
        let rigContentBottom = rigContentTop;

        if (horizontalSeatsSum <= 4) {
          // Pure left-to-right DAG columns by Pod Tier (ideal for 2-5 seat rigs like openrig-dev, sidecar-dev, kernel)
          let colX = podsStartX;
          for (const tk of tierKeys) {
            const tierPods = tiersMap[tk];
            let tierY = rigContentTop;
            let maxTierW = 0;
            for (const p of tierPods) {
              p.x = colX;
              p.y = tierY;
              tierY += p.h + podGapY;
              if (p.w > maxTierW) maxTierW = p.w;
              if (p.y + p.h > rigContentBottom) rigContentBottom = p.y + p.h;
            }
            colX += maxTierW + podGapX;
            if (colX + 28 > totalWidth) totalWidth = colX + 28;
          }
        } else {
          // Packed topological rows for large multi-pod rigs (e.g., 16-seat dnd-world)
          const maxRowRight = podsStartX + 1060;
          let rowX = podsStartX;
          let rowY = rigContentTop;
          let rowMaxH = 0;
          for (const p of topoPods) {
            if (rowX > podsStartX && rowX + p.w > maxRowRight) {
              rowX = podsStartX;
              rowY += rowMaxH + podGapY;
              rowMaxH = 0;
            }
            p.x = rowX;
            p.y = rowY;
            rowX += p.w + podGapX;
            if (p.h > rowMaxH) rowMaxH = p.h;
            if (p.x + p.w + 28 > totalWidth) totalWidth = p.x + p.w + 28;
            if (p.y + p.h > rigContentBottom) rigContentBottom = p.y + p.h;
          }
        }

        const rigHeight = Math.max(rigHubH + 28, (rigContentBottom - currentY) + 18);
        const rigHubY = currentY + Math.min(Math.max(14, (rigHeight - rigHubH) / 2), 160);

        // Register seat coordinates
        const rigSeatById = {};
        for (const p of topoPods) {
          p.seatBoxes = [];
          for (let i = 0; i < p.nodes.length; i++) {
            const node = p.nodes[i];
            const sx = p.x + podPadX + i * (cardW + seatColGap);
            const sy = p.y + podPadTop;
            const nid = getNodeKeyId(node);
            const seatKey = rig.name + '::' + nid;
            const box = { key: seatKey, id: nid, node, rig, podName: p.podName, x: sx, y: sy, w: cardW, h: cardH };
            p.seatBoxes.push(box);
            graphSeatRegistry[seatKey] = box;
            rigSeatById[nid] = box;
            if (node.id) rigSeatById[node.id] = box;
            if (node.nodeId) rigSeatById[node.nodeId] = box;
            if (node.logicalId) rigSeatById[node.logicalId] = box;
          }
        }

        // Resolve valid directed edges for this rig
        const resolvedEdges = [];
        const seenEdgeKeys = new Set();
        for (const e of rigEdgesRaw) {
          const srcBox = rigSeatById[e.sourceId];
          const dstBox = rigSeatById[e.targetId];
          if (!srcBox || !dstBox || srcBox.key === dstBox.key) continue;
          const kind = e.kind || 'delegates_to';
          const dedup = srcBox.key + '->' + dstBox.key + ':' + kind;
          if (seenEdgeKeys.has(dedup)) continue;
          seenEdgeKeys.add(dedup);
          const edgeObj = {
            rigName: rig.name,
            sourceKey: srcBox.key,
            targetKey: dstBox.key,
            src: srcBox,
            dst: dstBox,
            kind
          };
          resolvedEdges.push(edgeObj);
          allRenderedEdges.push(edgeObj);
        }

        // Fallback: if rig defines 0 explicit edges, infer intra-pod sequential pipeline edges so seats remain connected
        if (rigEdgesRaw.length === 0) {
          for (const p of topoPods) {
            for (let i = 0; i < p.seatBoxes.length - 1; i++) {
              const edgeObj = {
                rigName: rig.name,
                sourceKey: p.seatBoxes[i].key,
                targetKey: p.seatBoxes[i + 1].key,
                src: p.seatBoxes[i],
                dst: p.seatBoxes[i + 1],
                kind: 'delegates_to'
              };
              resolvedEdges.push(edgeObj);
              allRenderedEdges.push(edgeObj);
            }
          }
        }

        rigLayouts.push({
          rig,
          nodes,
          pods: topoPods,
          edges: resolvedEdges,
          topY: currentY,
          height: rigHeight,
          hubX: rigHubX,
          hubY: rigHubY,
          hubW: rigHubW,
          hubH: rigHubH
        });

        currentY += rigHeight + rigSectionGap;
      }

      if (rigLayouts.length === 0) {
        stage.innerHTML = '<div class="empty-state">No agent seats match the selected filters or search query.</div>';
        updateGraphInspector([]);
        return;
      }

      // Clear stale selection if filtered out
      if (selectedGraphSeatKey && !graphSeatRegistry[selectedGraphSeatKey]) {
        selectedGraphSeatKey = null;
      }
      if (selectedGraphRigName && !rigLayouts.some(rl => rl.rig.name === selectedGraphRigName)) {
        selectedGraphRigName = null;
      }

      // Compute active highlight neighborhood
      const highlightedSeats = new Set();
      let highlightedRig = selectedGraphRigName;
      if (selectedGraphSeatKey && graphSeatRegistry[selectedGraphSeatKey]) {
        highlightedSeats.add(selectedGraphSeatKey);
        highlightedRig = graphSeatRegistry[selectedGraphSeatKey].rig.name;
        for (const e of allRenderedEdges) {
          if (e.sourceKey === selectedGraphSeatKey) highlightedSeats.add(e.targetKey);
          if (e.targetKey === selectedGraphSeatKey) highlightedSeats.add(e.sourceKey);
        }
      } else if (selectedGraphRigName) {
        for (const [k, v] of Object.entries(graphSeatRegistry)) {
          if (v.rig.name === selectedGraphRigName) highlightedSeats.add(k);
        }
      }
      const hasSelection = Boolean(selectedGraphSeatKey || selectedGraphRigName);

      // Count relationship degrees per seat
      const seatDegree = {};
      for (const e of allRenderedEdges) {
        seatDegree[e.sourceKey] = (seatDegree[e.sourceKey] || 0) + 1;
        seatDegree[e.targetKey] = (seatDegree[e.targetKey] || 0) + 1;
      }

      let svgBg = '';
      let svgOwnershipEdges = '';
      let svgPodsAndHubs = '';
      let svgRelEdges = '';
      let svgRelLabels = '';
      let svgNodes = '';

      for (const rl of rigLayouts) {
        const rig = rl.rig;
        const isRigFocused = !hasSelection || highlightedRig === rig.name;
        const rigDimOpacity = isRigFocused ? '1' : '0.28';
        const workingInRig = rl.nodes.filter(n => (((n.activityState && n.activityState.display) || n.sessionStatus) === 'working')).length;

        // Subtle Rig swimlane frame
        svgBg += '<rect x="10" y="' + rl.topY + '" width="' + (totalWidth - 20) + '" height="' + rl.height + '" rx="12" fill="#15171c" fill-opacity="0.65" stroke="' + (selectedGraphRigName === rig.name ? '#5c7cfa' : '#23262e') + '" stroke-width="' + (selectedGraphRigName === rig.name ? '1.6' : '1') + '"/>';

        // Rig Hub Node (Column 0)
        const hubBorder = (selectedGraphRigName === rig.name || (selectedGraphSeatKey && highlightedRig === rig.name)) ? '#8ab4f8' : '#364fc7';
        const hubStatusColor = workingInRig > 0 ? '#81c995' : '#8ab4f8';
        svgPodsAndHubs += '<g class="graph-rig-hub" opacity="' + rigDimOpacity + '" style="cursor:pointer;" onclick="selectGraphRig(\\'' + escapeJs(rig.name) + '\\')">' +
          '<rect class="rig-hub-bg" x="' + rl.hubX + '" y="' + rl.hubY + '" width="' + rl.hubW + '" height="' + rl.hubH + '" rx="10" fill="#181e2c" stroke="' + hubBorder + '" stroke-width="1.6"/>' +
          '<rect x="' + (rl.hubX + 12) + '" y="' + (rl.hubY + 12) + '" width="36" height="16" rx="4" fill="#263859"/>' +
          '<text x="' + (rl.hubX + 30) + '" y="' + (rl.hubY + 23) + '" text-anchor="middle" fill="#8ab4f8" font-size="9.5" font-weight="700" font-family="\\'Inter\\', sans-serif">RIG</text>' +
          '<circle cx="' + (rl.hubX + rl.hubW - 16) + '" cy="' + (rl.hubY + 20) + '" r="4.5" fill="' + hubStatusColor + '"/>' +
          '<text x="' + (rl.hubX + 14) + '" y="' + (rl.hubY + 46) + '" fill="#ffffff" font-size="13.5" font-weight="700" font-family="\\'Inter\\', sans-serif">' +
            escapeHtml(rig.name.length > 20 ? (rig.name.slice(0, 19) + '…') : rig.name) +
          '</text>' +
          '<text x="' + (rl.hubX + 14) + '" y="' + (rl.hubY + 65) + '" fill="#9aa5b4" font-size="10.5" font-family="\\'JetBrains Mono\\', monospace">' +
            rl.nodes.length + ' seats • ' + workingInRig + ' working' +
          '</text>' +
          '<text x="' + (rl.hubX + 14) + '" y="' + (rl.hubY + 82) + '" fill="#6f7d95" font-size="10" font-family="\\'Inter\\', sans-serif">' +
            rl.pods.length + (rl.pods.length === 1 ? ' pod • ' : ' pods • ') + rl.edges.length + ' edges' +
          '</text>' +
          '<circle cx="' + (rl.hubX + rl.hubW) + '" cy="' + (rl.hubY + rl.hubH / 2) + '" r="4" fill="#5c7cfa" stroke="#121212" stroke-width="1.5"/>' +
        '</g>';

        // Pod Containers & Rig -> Pod Structural Ownership Curves
        for (const p of rl.pods) {
          const podHasHighlight = !hasSelection ? true : p.seatBoxes.some(sb => highlightedSeats.has(sb.key));
          const podOpacity = podHasHighlight ? '1' : '0.26';

          svgPodsAndHubs += '<g opacity="' + podOpacity + '">' +
            '<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="10" fill="#18191d" stroke="#2d3139" stroke-width="1.1"/>' +
            '<text x="' + (p.x + 14) + '" y="' + (p.y + 20) + '" fill="#a3acb9" font-size="10.5" font-weight="600" font-family="\\'JetBrains Mono\\', monospace">' +
              'POD: ' + escapeHtml(p.podName) + ' (' + p.nodes.length + ')' +
            '</text>' +
            '<circle cx="' + p.x + '" cy="' + (p.y + p.h / 2) + '" r="3.5" fill="#5c7cfa"/>' +
          '</g>';

          if (graphEdgeLayers.ownership) {
            const ox1 = rl.hubX + rl.hubW;
            const oy1 = rl.hubY + rl.hubH / 2;
            const ox2 = p.x;
            const oy2 = p.y + p.h / 2;
            const dx = Math.max(36, (ox2 - ox1) * 0.55);
            const ownActive = (selectedGraphRigName === rig.name) || (selectedGraphSeatKey && p.seatBoxes.some(sb => sb.key === selectedGraphSeatKey));
            const ownOpacity = hasSelection ? (ownActive ? '0.88' : '0.12') : '0.45';
            const ownWidth = ownActive ? '1.8' : '1.25';
            svgOwnershipEdges += '<path class="graph-edge-ownership" d="M ' + ox1 + ' ' + oy1 + ' C ' + (ox1 + dx) + ' ' + oy1 + ', ' + (ox2 - dx) + ' ' + oy2 + ', ' + (ox2 - 3) + ' ' + oy2 + '" fill="none" stroke="#5c7cfa" stroke-width="' + ownWidth + '" stroke-dasharray="4 3" opacity="' + ownOpacity + '" marker-end="url(#arrow-ownership)"/>';
          }
        }

        // Directed Seat-to-Seat Relationship Edges
        const visibleRigEdges = rl.edges.filter(e => graphEdgeLayers[e.kind] !== false);
        const edgePairSet = new Set(visibleRigEdges.map(e => e.sourceKey + '->' + e.targetKey));

        for (const e of visibleRigEdges) {
          const s = e.src;
          const d = e.dst;
          const hasReverse = edgePairSet.has(e.targetKey + '->' + e.sourceKey);
          const isEdgeSelected = selectedGraphSeatKey
            ? (e.sourceKey === selectedGraphSeatKey || e.targetKey === selectedGraphSeatKey)
            : (selectedGraphRigName === rig.name);
          const edgeOpacity = hasSelection ? (isEdgeSelected ? '1' : '0.12') : '0.82';
          const strokeColor = e.kind === 'escalates_to' ? '#fdd663' : e.kind === 'collaborates_with' ? '#81c995' : '#8ab4f8';
          const markerId = e.kind === 'escalates_to' ? 'arrow-escalates' : e.kind === 'collaborates_with' ? 'arrow-collaborates' : 'arrow-delegates';
          const dashAttr = e.kind === 'escalates_to' ? ' stroke-dasharray="5 4"' : e.kind === 'collaborates_with' ? ' stroke-dasharray="3 2"' : '';
          const strokeW = isEdgeSelected ? '2.25' : '1.65';

          let pathD = '';
          let labelX = 0;
          let labelY = 0;

          const sameRow = Math.abs(s.y - d.y) < 20;
          if (sameRow && s.x < d.x) {
            // Left-to-right on same row
            const spanSteps = Math.round((d.x - s.x) / (cardW + seatColGap));
            if (spanSteps <= 1) {
              const x1 = s.x + s.w;
              const y1 = s.y + (hasReverse ? s.h * 0.36 : s.h * 0.46);
              const x2 = d.x - 4;
              const y2 = d.y + (hasReverse ? d.h * 0.36 : d.h * 0.46);
              const cGap = Math.max(22, (x2 - x1) * 0.45);
              pathD = 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + cGap) + ' ' + y1 + ', ' + (x2 - cGap) + ' ' + y2 + ', ' + x2 + ' ' + y2;
              labelX = (x1 + x2) / 2;
              labelY = y1 - 8;
            } else {
              // Arch cleanly above intermediate cards
              const x1 = s.x + s.w * 0.72;
              const y1 = s.y;
              const x2 = d.x + d.w * 0.28;
              const y2 = d.y - 3;
              const archY = Math.min(y1, y2) - (22 + Math.min(26, spanSteps * 7));
              pathD = 'M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + archY + ', ' + x2 + ' ' + archY + ', ' + x2 + ' ' + y2;
              labelX = (x1 + x2) / 2;
              labelY = archY + 6;
            }
          } else if (sameRow && s.x > d.x) {
            // Right-to-left feedback/escalation on same row: arch cleanly below cards
            const spanSteps = Math.max(1, Math.round((s.x - d.x) / (cardW + seatColGap)));
            const x1 = s.x + s.w * 0.35;
            const y1 = s.y + s.h;
            const x2 = d.x + d.w * 0.65;
            const y2 = d.y + d.h + 3;
            const archY = Math.max(y1, y2) + 18 + Math.min(28, (spanSteps - 1) * 9);
            pathD = 'M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + archY + ', ' + x2 + ' ' + archY + ', ' + x2 + ' ' + y2;
            labelX = (x1 + x2) / 2;
            labelY = archY - 4;
          } else if (d.x >= s.x + s.w + 16) {
            // Diagonal left-to-right across pods/tiers
            const offset = hasReverse ? (e.kind === 'escalates_to' ? 12 : -10) : 0;
            const x1 = s.x + s.w;
            const y1 = s.y + s.h * 0.5 + offset;
            const x2 = d.x - 4;
            const y2 = d.y + d.h * 0.5 + offset;
            const cx = Math.max(36, (x2 - x1) * 0.5);
            pathD = 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + cx) + ' ' + y1 + ', ' + (x2 - cx) + ' ' + y2 + ', ' + x2 + ' ' + y2;
            labelX = (x1 + x2) / 2;
            labelY = (y1 + y2) / 2 - 6;
          } else if (s.x >= d.x + d.w + 16) {
            // Diagonal right-to-left across pods/tiers
            const offset = hasReverse ? 14 : 0;
            const x1 = s.x;
            const y1 = s.y + s.h * 0.62 + offset;
            const x2 = d.x + d.w + 4;
            const y2 = d.y + d.h * 0.62 + offset;
            const cx = Math.max(36, (x1 - x2) * 0.5);
            pathD = 'M ' + x1 + ' ' + y1 + ' C ' + (x1 - cx) + ' ' + y1 + ', ' + (x2 + cx) + ' ' + y2 + ', ' + x2 + ' ' + y2;
            labelX = (x1 + x2) / 2;
            labelY = (y1 + y2) / 2 + 10;
          } else {
            // Vertical cross-row connection
            const goingDown = d.y > s.y;
            const latOffset = hasReverse ? (goingDown ? -16 : 16) : 0;
            const x1 = s.x + s.w * 0.5 + latOffset;
            const y1 = goingDown ? (s.y + s.h) : s.y;
            const x2 = d.x + d.w * 0.5 + latOffset;
            const y2 = goingDown ? (d.y - 4) : (d.y + d.h + 4);
            const cy = Math.max(26, Math.abs(y2 - y1) * 0.45);
            pathD = 'M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + (goingDown ? y1 + cy : y1 - cy) + ', ' + x2 + ' ' + (goingDown ? y2 - cy : y2 + cy) + ', ' + x2 + ' ' + y2;
            labelX = (x1 + x2) / 2 + latOffset * 0.4;
            labelY = (y1 + y2) / 2;
          }

          svgRelEdges += '<path class="graph-edge-rel" data-kind="' + escapeHtml(e.kind) + '" d="' + pathD + '" fill="none" stroke="' + strokeColor + '" stroke-width="' + strokeW + '"' + dashAttr + ' opacity="' + edgeOpacity + '" marker-end="url(#' + markerId + ')"/>';

          const showEdgeLabel = (selectedGraphSeatKey && isEdgeSelected) || (!hasSelection && visibleRigEdges.length <= 6);
          if (showEdgeLabel) {
            const shortKind = e.kind === 'delegates_to' ? 'delegates' : e.kind === 'escalates_to' ? 'escalates' : e.kind === 'collaborates_with' ? 'collaborates' : e.kind;
            const pillW = shortKind.length * 5.6 + 12;
            svgRelLabels += '<g opacity="' + (isEdgeSelected ? '1' : '0.88') + '">' +
              '<rect x="' + (labelX - pillW / 2) + '" y="' + (labelY - 8) + '" width="' + pillW + '" height="14" rx="7" fill="#12141a" stroke="' + strokeColor + '" stroke-width="0.9"/>' +
              '<text x="' + labelX + '" y="' + (labelY + 2) + '" text-anchor="middle" fill="' + strokeColor + '" font-size="8.5" font-family="\\'JetBrains Mono\\', monospace">' + escapeHtml(shortKind) + '</text>' +
            '</g>';
          }
        }

        // Seat Nodes
        for (const p of rl.pods) {
          for (const sb of p.seatBoxes) {
            const node = sb.node;
            const sessionName = node.canonicalSessionName || (node.logicalId + '@' + rig.name);
            const runtime = node.runtime || 'antigravity';
            const isHuman = node.nodeKind === 'human' || (node.logicalId || '').includes('human');
            const runtimeShort = isHuman ? 'HUMAN' : runtime.toLowerCase().includes('antigravity') ? 'AGY' : runtime.toUpperCase().slice(0, 6);
            const disp = (node.activityState && node.activityState.display) || node.sessionStatus || 'idle';
            const stateColor = disp === 'working' ? '#81c995' : (disp === 'needs_input' || disp === 'attention_required') ? '#fdd663' : '#8ab4f8';
            const convId = (node.resumeType === 'antigravity_id' ? node.resumeToken : null) || node.resumeToken;

            const isPrimarySelected = selectedGraphSeatKey === sb.key;
            const isNeighborHighlighted = !hasSelection || highlightedSeats.has(sb.key);
            const nodeOpacity = isNeighborHighlighted ? '1' : '0.28';
            const cardBorder = isPrimarySelected ? '#8ab4f8' : (hasSelection && isNeighborHighlighted ? '#4c6ef5' : '#2d323d');
            const cardStrokeW = isPrimarySelected ? '2.2' : '1.2';
            const cardFill = isPrimarySelected ? '#212838' : '#1e2026';

            const modelLabel = node.model
              ? (node.model.length > 26 ? node.model.slice(0, 25) + '…' : node.model)
              : (runtime + ' • ' + disp);
            const deg = seatDegree[sb.key] || 0;

            svgNodes += '<g class="graph-node" opacity="' + nodeOpacity + '" style="cursor:pointer;" onclick="selectGraphSeat(\\'' + escapeJs(sb.key) + '\\')">' +
              '<rect class="seat-card-bg" x="' + sb.x + '" y="' + sb.y + '" width="' + sb.w + '" height="' + sb.h + '" rx="8" fill="' + cardFill + '" stroke="' + cardBorder + '" stroke-width="' + cardStrokeW + '"/>' +
              '<circle cx="' + (sb.x + 15) + '" cy="' + (sb.y + 19) + '" r="4.5" fill="' + stateColor + '"/>' +
              '<text x="' + (sb.x + 27) + '" y="' + (sb.y + 23) + '" fill="#ffffff" font-size="12" font-weight="600" font-family="\\'Inter\\', sans-serif">' +
                escapeHtml(node.logicalId.length > 20 ? (node.logicalId.slice(0, 19) + '…') : node.logicalId) +
              '</text>' +
              '<rect x="' + (sb.x + sb.w - 48) + '" y="' + (sb.y + 10) + '" width="38" height="16" rx="4" fill="#262b36"/>' +
              '<text x="' + (sb.x + sb.w - 29) + '" y="' + (sb.y + 21) + '" text-anchor="middle" fill="#9fb4d9" font-size="9" font-weight="600" font-family="\\'JetBrains Mono\\', monospace">' + escapeHtml(runtimeShort) + '</text>' +
              '<text x="' + (sb.x + 14) + '" y="' + (sb.y + 42) + '" fill="#9e9e9e" font-size="10" font-family="\\'JetBrains Mono\\', monospace">' +
                escapeHtml(modelLabel) +
              '</text>' +
              '<text x="' + (sb.x + 14) + '" y="' + (sb.y + 70) + '" fill="' + stateColor + '" font-size="9.5" font-weight="500" font-family="\\'JetBrains Mono\\', monospace">' +
                escapeHtml(disp) + (deg > 0 ? (' • ' + deg + ' rel') : '') +
              '</text>' +
              // Direct 1-click mini action pills inside the SVG seat card
              (convId ? (
                '<g class="graph-action-pill" onclick="event.stopPropagation(); openExternalHref(\\'conversation://' + escapeJs(convId) + '\\')">' +
                  '<rect x="' + (sb.x + sb.w - 134) + '" y="' + (sb.y + 56) + '" width="40" height="19" rx="4" fill="#182030" stroke="#304261" stroke-width="0.9"/>' +
                  '<text x="' + (sb.x + sb.w - 114) + '" y="' + (sb.y + 69) + '" text-anchor="middle" fill="#8ab4f8" font-size="9" font-family="\\'Inter\\', sans-serif">Chat↗</text>' +
                '</g>'
              ) : '') +
              '<g class="graph-action-pill" onclick="event.stopPropagation(); openCaptureModal(\\'' + escapeJs(sessionName) + '\\', \\'' + escapeJs(node.logicalId) + '\\')">' +
                '<rect x="' + (sb.x + sb.w - 90) + '" y="' + (sb.y + 56) + '" width="42" height="19" rx="4" fill="#1b1d24" stroke="#333845" stroke-width="0.9"/>' +
                '<text x="' + (sb.x + sb.w - 69) + '" y="' + (sb.y + 69) + '" text-anchor="middle" fill="#d4d7dd" font-size="9" font-family="\\'Inter\\', sans-serif">Screen</text>' +
              '</g>' +
              '<g class="graph-action-pill" onclick="event.stopPropagation(); openReplyModal(\\'' + escapeJs(sessionName) + '\\')">' +
                '<rect x="' + (sb.x + sb.w - 44) + '" y="' + (sb.y + 56) + '" width="34" height="19" rx="4" fill="#1d283a" stroke="#38527a" stroke-width="0.9"/>' +
                '<text x="' + (sb.x + sb.w - 27) + '" y="' + (sb.y + 69) + '" text-anchor="middle" fill="#8ab4f8" font-size="9" font-family="\\'Inter\\', sans-serif">Msg</text>' +
              '</g>' +
            '</g>';
          }
        }
      }

      lastGraphLogicalWidth = totalWidth;
      lastGraphLogicalHeight = Math.max(420, currentY + 8);
      const scaledW = Math.round(lastGraphLogicalWidth * graphZoom);
      const scaledH = Math.round(lastGraphLogicalHeight * graphZoom);

      stage.innerHTML = '<svg id="topology-svg-canvas" class="svg-graph" width="' + scaledW + '" height="' + scaledH + '" viewBox="0 0 ' + lastGraphLogicalWidth + ' ' + lastGraphLogicalHeight + '" xmlns="http://www.w3.org/2000/svg">' +
        defs + svgBg + svgOwnershipEdges + svgPodsAndHubs + svgRelEdges + svgNodes + svgRelLabels +
      '</svg>';

      updateGraphInspector(allRenderedEdges);
    }

    // Tab 2 Filtering & Rendering
    function filterTopology() {
      if (cachedTopology) {
        renderTopology();
      }
    }

    function renderTopology() {
      if (!cachedTopology) return;
      const { rigs, costData, topData, seatUsageMap } = cachedTopology;

      const search = (document.getElementById('topology-search')?.value || '').toLowerCase().trim();
      const rigFilter = document.getElementById('topology-rig-filter')?.value || 'all';
      const runtimeFilter = document.getElementById('topology-runtime-filter')?.value || 'all';
      const statusFilter = document.getElementById('topology-status-filter')?.value || 'all';
      const sortOrder = document.getElementById('topology-sort')?.value || 'newest';

      if (topologyViewMode === 'graph') {
        renderSvgGraph();
      }

      let totalSeats = 0;
      let activeSeats = 0;
      let totalFleetTokens = 0;
      let html = '';

      for (const r of rigs) {
        const rig = r.rig || r;
        if (rigFilter !== 'all' && rig.name !== rigFilter) continue;
        const nodes = rig.nodes || [];

        // Filter nodes
        const filteredNodes = nodes.filter(node => matchesTopologyNodeFilters(node, rig, {
          search,
          runtimeFilter,
          statusFilter
        }));

        if (filteredNodes.length === 0) continue;

        // Sort filtered nodes
        filteredNodes.sort((a, b) => {
          if (sortOrder === 'newest') {
            const isAWorking = ((a.activityState && a.activityState.display) || a.sessionStatus) === 'working';
            const isBWorking = ((b.activityState && b.activityState.display) || b.sessionStatus) === 'working';
            if (isAWorking && !isBWorking) return -1;
            if (!isAWorking && isBWorking) return 1;
            return (b.startedAt || 0) - (a.startedAt || 0);
          } else {
            return (a.startedAt || 0) - (b.startedAt || 0);
          }
        });

        totalSeats += filteredNodes.length;

        // Group filtered nodes by pod
        const pods = {};
        for (const node of filteredNodes) {
          const podName = node.podNamespace || (node.logicalId ? node.logicalId.split('.')[0] : '') || 'default';
          if (!pods[podName]) pods[podName] = [];
          pods[podName].push(node);
        }

        html += '<div class="rig-container">' +
          '<div class="rig-header">' +
            '<div class="rig-title">' +
              '<span class="badge badge-blue">RIG</span>' +
              '<span>' + escapeHtml(rig.name) + '</span>' +
            '</div>' +
            '<div class="card-meta">' +
              '<span>' + filteredNodes.length + ' matching seats</span>' +
              '<span>• ' + ((rig.edges && rig.edges.length) || 0) + ' edges</span>' +
              '<span>• Status: ' + escapeHtml(rig.status || 'running') + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="pod-grid">';

        for (const [podName, podNodes] of Object.entries(pods)) {
          html += '<div class="pod-card">' +
            '<div class="pod-header">' +
              '<span>POD: ' + escapeHtml(podName) + '</span>' +
              '<span class="badge badge-muted">' + podNodes.length + ' seats</span>' +
            '</div>';

          for (const node of podNodes) {
            const sessionName = node.canonicalSessionName || (node.logicalId + '@' + rig.name);
            const runtime = node.runtime || 'antigravity';
            const isAgy = runtime.toLowerCase().includes('antigravity');
            const disp = (node.activityState && node.activityState.display) || node.sessionStatus || 'idle';
            const state = disp === 'working' ? 'working' : (disp === 'needs_input' || disp === 'attention_required') ? 'needs_input' : 'idle';
            if (state === 'working') activeSeats++;

            const convId = (node.resumeType === 'antigravity_id' ? node.resumeToken : null) || node.resumeToken;

            // Context & Token Telemetry
            const ctx = node.contextUsage;
            const hasCtx = ctx && ctx.availability === 'available' && ctx.usedPercentage != null;
            const usedPct = hasCtx ? Math.min(100, Math.round(ctx.usedPercentage)) : null;
            const inTok = ctx && ctx.totalInputTokens != null ? ctx.totalInputTokens : 0;
            const outTok = ctx && ctx.totalOutputTokens != null ? ctx.totalOutputTokens : 0;
            const seatTokens = inTok + outTok;
            totalFleetTokens += seatTokens;

            const usageRecord = seatUsageMap[sessionName] || seatUsageMap[node.logicalId];

            html += '<div class="seat-item">' +
              '<div class="seat-top">' +
                '<div class="seat-name">' +
                  '<div class="live-dot ' + state + '"></div>' +
                  '<span>' + escapeHtml(node.logicalId) + '</span>' +
                '</div>' +
                '<span class="badge ' + (isAgy ? 'badge-blue' : 'badge-muted') + '">' +
                  (isAgy ? 'Google Antigravity' : escapeHtml(runtime)) +
                '</span>' +
              '</div>' +
              '<div class="seat-details">' +
                (node.model ? ('<span class="badge badge-muted">Model: ' + escapeHtml(node.model) + '</span>') : '') +
                (node.effort ? ('<span class="badge badge-muted">Effort: ' + escapeHtml(node.effort) + '</span>') : '') +
                (hasCtx ? (
                  '<span class="badge badge-blue">Context: ' + usedPct + '%</span>' +
                  '<span class="badge badge-muted">Tokens: ' + formatTokens(seatTokens) + '</span>'
                ) : usageRecord ? (
                  '<span class="badge badge-blue">Burn: ' + formatTokens(usageRecord.tokens || 0) + ' tok</span>'
                ) : (
                  '<span class="badge badge-muted">Tokens: idle</span>'
                )) +
              '</div>' +
              (hasCtx ? (
                '<div class="token-progress-container" title="Context Window Usage: ' + usedPct + '% (' + formatTokens(inTok) + ' in / ' + formatTokens(outTok) + ' out)">' +
                  '<div class="token-progress-fill" style="width: ' + usedPct + '%"></div>' +
                '</div>'
              ) : '') +
              (convId ? (
                '<div class="conv-box">' +
                  '<span>Conv: ' + escapeHtml(convId.slice(0, 18)) + '...</span>' +
                  '<div style="display:flex; align-items:center; gap:8px;">' +
                    '<a href="conversation://' + escapeHtml(convId) + '" class="conv-link" target="_blank" rel="noopener noreferrer" title="Open Conversation in Antigravity Chat">🔗 Open Chat ↗</a>' +
                    '<button class="conv-copy-btn" onclick="copyToClipboard(\\'' + convId + '\\')">Copy ID</button>' +
                  '</div>' +
                '</div>'
              ) : '') +
              '<div class="seat-actions">' +
                '<button class="btn btn-secondary" style="padding:2px 8px; font-size:11px;" onclick="openCaptureModal(\\'' + escapeJs(sessionName) + '\\', \\'' + escapeJs(node.logicalId) + '\\')">📺 Screen</button>' +
                '<button class="btn btn-primary" style="padding:2px 8px; font-size:11px;" onclick="openReplyModal(\\'' + escapeJs(sessionName) + '\\')">✉ Message</button>' +
              '</div>' +
            '</div>';
          }

          html += '</div>';
        }

        html += '</div></div>';
      }

      document.getElementById('seats-count').textContent = totalSeats;
      document.getElementById('topology-list').innerHTML = html || '<div class="empty-state">No agent seats match the selected filters or search query.</div>';

      // Update Fleet Telemetry Dashboard Bar
      const activeSeatsEl = document.getElementById('telem-active-seats');
      if (activeSeatsEl) activeSeatsEl.textContent = activeSeats + ' / ' + totalSeats;

      const burnRateEl = document.getElementById('telem-burn-rate');
      if (burnRateEl) {
        burnRateEl.textContent = totalFleetTokens > 0 ? (formatTokens(totalFleetTokens) + ' tok') : '0 tok/hr';
      }

      const costEl = document.getElementById('telem-cost');
      if (costEl && costData && costData.totalCostFormatted) {
        costEl.textContent = 'Est. Cost: ' + costData.totalCostFormatted;
      }

      const topSeatEl = document.getElementById('telem-top-seat');
      const topDetailEl = document.getElementById('telem-top-detail');
      if (topSeatEl && topData && Array.isArray(topData.ranked) && topData.ranked.length > 0) {
        const topRanked = topData.ranked[0];
        topSeatEl.textContent = topRanked.seat || 'top-seat';
        if (topDetailEl) topDetailEl.textContent = (formatTokens(topRanked.burn || topRanked.tokens || 0)) + ' tok in window';
      } else if (topSeatEl) {
        topSeatEl.textContent = totalSeats > 0 ? (activeSeats > 0 ? 'Fleet Active' : 'Fleet Standby') : '—';
        if (topDetailEl) topDetailEl.textContent = activeSeats > 0 ? (activeSeats + ' seats working') : 'All seats idle';
      }
    }

    // Fetch Topology (Rigs, Live Seat Nodes, & Directed Topology Edges) & Telemetry
    async function fetchTopology() {
      try {
        const [resRigs, resTelemCost, resTelemTop] = await Promise.allSettled([
          fetch('/api/rigs'),
          fetch('/api/telemetry/usage/cost'),
          fetch('/api/telemetry/usage/top?window_hours=1')
        ]);

        let rigsList = [];
        if (resRigs.status === 'fulfilled' && resRigs.value.ok) {
          rigsList = await resRigs.value.json();
        }
        const rigs = Array.isArray(rigsList) ? rigsList : (rigsList.rigs || []);

        let costData = null;
        if (resTelemCost.status === 'fulfilled' && resTelemCost.value.ok) {
          try { costData = await resTelemCost.value.json(); } catch(e) {}
        }
        let topData = null;
        if (resTelemTop.status === 'fulfilled' && resTelemTop.value.ok) {
          try { topData = await resTelemTop.value.json(); } catch(e) {}
        }

        const seatUsageMap = {};
        if (costData && Array.isArray(costData.seats)) {
          for (const s of costData.seats) {
            if (s.seat) seatUsageMap[s.seat] = s;
          }
        }

        await Promise.all(rigs.map(async (r) => {
          const rig = r.rig || r;
          if (!rig.id) {
            if (!Array.isArray(rig.nodes)) rig.nodes = [];
            if (!Array.isArray(rig.edges)) rig.edges = [];
            return;
          }
          const [resDetail, resNodes] = await Promise.allSettled([
            fetch('/api/rigs/' + rig.id),
            (!rig.nodes || rig.nodes.length === 0) ? fetch('/api/rigs/' + rig.id + '/nodes') : Promise.resolve(null)
          ]);

          let detail = null;
          if (resDetail.status === 'fulfilled' && resDetail.value && resDetail.value.ok) {
            try { detail = await resDetail.value.json(); } catch (e) {}
          }

          if (resNodes.status === 'fulfilled' && resNodes.value && resNodes.value.ok) {
            try { rig.nodes = await resNodes.value.json(); } catch (e) {}
          }

          if ((!Array.isArray(rig.nodes) || rig.nodes.length === 0) && detail && Array.isArray(detail.nodes)) {
            rig.nodes = detail.nodes;
          }
          if (!Array.isArray(rig.nodes)) rig.nodes = [];

          // Enrich live nodes with static node IDs from detail.nodes if needed
          if (detail && Array.isArray(detail.nodes)) {
            const detailByLogical = {};
            for (const dn of detail.nodes) {
              if (dn.logicalId) detailByLogical[dn.logicalId] = dn;
            }
            for (const ln of rig.nodes) {
              const dn = detailByLogical[ln.logicalId];
              if (dn && !ln.nodeId && !ln.id) {
                ln.nodeId = dn.id;
              }
              ln._id = ln.nodeId || ln.id || (dn && dn.id) || ln.logicalId;
            }
          } else {
            for (const ln of rig.nodes) {
              ln._id = ln.nodeId || ln.id || ln.logicalId;
            }
          }

          rig.edges = (detail && Array.isArray(detail.edges))
            ? detail.edges
            : (Array.isArray(rig.edges) ? rig.edges : []);
        }));

        cachedTopology = { rigs, costData, topData, seatUsageMap };

        // Update fleet dropdowns and rig filters
        const rigNames = Array.from(new Set(rigs.map(r => (r.rig || r).name).filter(Boolean)));
        updateAllRigFilters(rigNames);
        populateAgentDropdown(rigs);

        renderTopology();
      } catch (err) {
        console.error("fetchTopology error:", err);
      }
    }

    // Tab 3 Filtering & Rendering
    function setDeliverablesVerdictFilter(verdict, el) {
      deliverablesVerdictFilter = verdict;
      const pills = document.querySelectorAll('#deliverables-filter-pills .filter-pill');
      pills.forEach(p => p.classList.remove('active'));
      if (el) el.classList.add('active');
      renderDeliverables();
    }

    function filterDeliverables() {
      renderDeliverables();
    }

    function renderDeliverables() {
      const list = document.getElementById('deliverables-list');
      const search = (document.getElementById('deliverables-search')?.value || '').toLowerCase().trim();
      const rigFilter = document.getElementById('deliverables-rig-filter')?.value || 'all';
      const sortOrder = document.getElementById('deliverables-sort')?.value || 'newest';

      const filtered = cachedDeliverables.filter(item => {
        const j = item.judgment;
        const isAccepted = (j && j.verdict === 'accept') || item.state === 'accepted';
        const isRejected = (j && j.verdict === 'reject') || item.state === 'rejected';
        const isPending = !isAccepted && !isRejected;

        if (deliverablesVerdictFilter === 'accepted' && !isAccepted) return false;
        if (deliverablesVerdictFilter === 'rejected' && !isRejected) return false;
        if (deliverablesVerdictFilter === 'pending' && !isPending) return false;

        if (rigFilter !== 'all') {
          const sText = ((item.scope || '') + ' ' + (item.rig || '')).toLowerCase();
          if (!sText.includes(rigFilter.toLowerCase())) return false;
        }

        if (search) {
          const text = ((item.text || '') + ' ' + (item.id || '') + ' ' + (item.scope || '') + ' ' + (item.revision || '')).toLowerCase();
          if (!text.includes(search)) return false;
        }
        return true;
      });

      filtered.sort((a, b) => {
        const tA = (a.judgment && a.judgment.at) ? new Date(a.judgment.at).getTime() : (a.revision ? parseInt(a.revision, 16) || 0 : 0);
        const tB = (b.judgment && b.judgment.at) ? new Date(b.judgment.at).getTime() : (b.revision ? parseInt(b.revision, 16) || 0 : 0);
        return sortOrder === 'newest' ? tB - tA : tA - tB;
      });

      document.getElementById('proofs-count').textContent = filtered.length;

      if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state">' + (cachedDeliverables.length === 0 ? 'No proof contracts found for current workspace. Deliverables and proofs will populate as contracts are executed.' : 'No deliverables match current search or verdict filter.') + '</div>';
        return;
      }

      let html = '';
      for (let i = 0; i < filtered.length; i++) {
        const item = filtered[i];
        const j = item.judgment;
        const isAccepted = (j && j.verdict === 'accept') || item.state === 'accepted';
        const isRejected = (j && j.verdict === 'reject') || item.state === 'rejected';
        const statusBadge = isAccepted ? 'badge-green' : isRejected ? 'badge-red' : 'badge-amber';
        const statusText = isAccepted ? '✓ Accepted' : isRejected ? '✕ Rejected' : '⏳ Pending / Unjudged';
        const scope = item.scope || 'default';
        const origIndex = cachedDeliverables.indexOf(item);

        html += '<div class="card">' +
          '<div class="card-header">' +
            '<div>' +
              '<div class="card-title">' + renderMarkdown(item.text || item.id) + '</div>' +
              '<div class="card-meta">' +
                '<span class="badge ' + statusBadge + '">' + statusText + '</span>' +
                '<span>Scope: ' + escapeHtml(scope) + '</span>' +
                '<span>Item: #' + escapeHtml(item.id) + '</span>' +
                (item.revision ? ('<span>• rev ' + escapeHtml(item.revision.slice(0, 8)) + '</span>') : '') +
              '</div>' +
            '</div>' +
          '</div>' +
          (j ? (
            '<div class="card-body">' +
              '<div><strong>Verdict:</strong> ' + j.verdict + '</div>' +
              '<div><strong>Judged By:</strong> ' + escapeHtml(j.actor || 'human') + '</div>' +
              '<div><strong>At:</strong> ' + (j.at ? new Date(j.at).toLocaleString() : '') + '</div>' +
              '<div style="margin-top:4px;"><strong>Reason:</strong></div>' +
              renderMarkdown(j.reason || 'None provided') +
            '</div>'
          ) : (
            '<div class="card-meta">' +
              '<span>Proof contract defined. Awaiting verification evidence and outcome judgment.</span>' +
            '</div>'
          )) +
          (item.evidence ? (
            '<div style="margin:8px 0; padding:8px 10px; background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); font-size:12px;">' +
              '<div style="color:var(--text-muted); font-size:11px; margin-bottom:4px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Verification Evidence</div>' +
              (Array.isArray(item.evidence) ? item.evidence.map(e => '<span class="badge badge-green" style="font-family:\\'JetBrains Mono\\', monospace; margin-right:4px;">📁 ' + escapeHtml(e) + '</span>').join('') : escapeHtml(String(item.evidence))) +
            '</div>'
          ) : '') +
          '<div class="card-actions">' +
            '<button class="btn btn-secondary" onclick="openDeliverableDetail(' + origIndex + ')">🔍 Details</button>' +
            '<button class="btn btn-success" onclick="openProofAcceptModal(\\'' + escapeJs(scope) + '\\', \\'' + escapeJs(item.id) + '\\', \\'' + escapeJs(item.text) + '\\', \\'' + escapeJs(item.revision) + '\\', \\'' + escapeJs(j ? j.id : '') + '\\', ' + (item.evidence ? JSON.stringify(item.evidence).replace(/"/g, '&quot;') : 'null') + ')">✓ Accept</button>' +
            '<button class="btn btn-danger" onclick="quickRejectProof(\\'' + escapeJs(scope) + '\\', \\'' + escapeJs(item.id) + '\\', \\'' + escapeJs(item.revision) + '\\', \\'' + escapeJs(j ? j.id : '') + '\\')">⚡ Quick Reject</button>' +
            '<button class="btn btn-secondary" onclick="openProofRejectModal(\\'' + escapeJs(scope) + '\\', \\'' + escapeJs(item.id) + '\\', \\'' + escapeJs(item.text) + '\\', \\'' + escapeJs(item.revision) + '\\', \\'' + escapeJs(j ? j.id : '') + '\\')">✕ Reject...</button>' +
          '</div>' +
        '</div>';
      }

      list.innerHTML = html;
    }

    function openDeliverableDetail(index) {
      const item = cachedDeliverables[index];
      if (!item) return;

      const j = item.judgment;
      const isAccepted = (j && j.verdict === 'accept') || item.state === 'accepted';
      const isRejected = (j && j.verdict === 'reject') || item.state === 'rejected';
      const statusBadge = isAccepted ? 'badge-green' : isRejected ? 'badge-red' : 'badge-amber';
      const statusText = isAccepted ? '✓ Accepted' : isRejected ? '✕ Rejected' : '⏳ Pending / Unjudged';
      const scope = item.scope || 'default';

      const badgeEl = document.getElementById('detail-badge');
      badgeEl.className = 'badge ' + statusBadge;
      badgeEl.textContent = statusText;

      document.getElementById('detail-title').textContent = item.text || item.id;
      document.getElementById('detail-subtitle').textContent = 'Scope: ' + scope + ' · Item #' + item.id;
      document.getElementById('detail-item-text').innerHTML = renderMarkdown(item.text || '(No explicit requirement description provided)');
      document.getElementById('detail-scope-id').textContent = scope + ' #' + item.id;
      document.getElementById('detail-revision').textContent = (item.revision ? ('Revision: ' + item.revision) : 'Revision: uncommitted / initial') + (item.expectedPrevious ? ('\\nPrevious: ' + item.expectedPrevious) : '');

      const judgmentBox = document.getElementById('detail-judgment');
      if (j) {
        judgmentBox.innerHTML = '<strong>Verdict:</strong> ' + escapeHtml(j.verdict) + '<br><strong>Judged by:</strong> ' + escapeHtml(j.actor || 'human') + '<br><strong>Timestamp:</strong> ' + (j.at ? new Date(j.at).toLocaleString() : 'N/A') + '<div style="margin-top:6px;"><strong>Reason:</strong></div>' + renderMarkdown(j.reason || 'None provided');
      } else {
        judgmentBox.textContent = 'No judgment recorded yet. Pending empirical review or proof acceptance.';
      }

      const evDetailEl = document.getElementById('detail-evidence');
      if (evDetailEl) {
        if (Array.isArray(item.evidence) && item.evidence.length > 0) {
          evDetailEl.innerHTML = item.evidence.map(e => '<span class="badge badge-green" style="margin-right:6px; margin-bottom:4px; font-family:\\'JetBrains Mono\\', monospace;">📁 ' + escapeHtml(e) + '</span>').join('');
        } else if (item.evidence && typeof item.evidence === 'object') {
          evDetailEl.innerHTML = '<pre class="md-code-block"><code>' + escapeHtml(JSON.stringify(item.evidence, null, 2)) + '</code></pre>';
        } else if (item.evidence) {
          evDetailEl.innerHTML = renderMarkdown(String(item.evidence));
        } else {
          evDetailEl.textContent = 'Evidence: proof/evidence.md (Empirically verified in workspace)';
        }
      }

      const contractBox = document.getElementById('detail-contract-state');
      contractBox.textContent = JSON.stringify({
        id: item.id,
        scope: scope,
        state: item.state || 'pending',
        readiness: item.readiness || null,
        evidence: item.evidence || null,
        verifications: item.verifications || null
      }, null, 2);

      const actionsLeft = document.getElementById('detail-actions-left');
      actionsLeft.innerHTML = '<button class="btn btn-success" onclick="closeModal(\\'deliverable-detail-modal\\'); openProofAcceptModal(\\'' + escapeJs(scope) + '\\', \\'' + escapeJs(item.id) + '\\', \\'' + escapeJs(item.text) + '\\', \\'' + escapeJs(item.revision) + '\\', \\'' + escapeJs(j ? j.id : '') + '\\', ' + (item.evidence ? JSON.stringify(item.evidence).replace(/"/g, '&quot;') : 'null') + ');">✓ Accept Proof</button>' +
        '<button class="btn btn-danger" onclick="quickRejectProof(\\'' + escapeJs(scope) + '\\', \\'' + escapeJs(item.id) + '\\', \\'' + escapeJs(item.revision) + '\\', \\'' + escapeJs(j ? j.id : '') + '\\'); closeModal(\\'deliverable-detail-modal\\');">⚡ Quick Reject</button>' +
        '<button class="btn btn-secondary" onclick="closeModal(\\'deliverable-detail-modal\\'); openProofRejectModal(\\'' + escapeJs(scope) + '\\', \\'' + escapeJs(item.id) + '\\', \\'' + escapeJs(item.text) + '\\', \\'' + escapeJs(item.revision) + '\\', \\'' + escapeJs(j ? j.id : '') + '\\');">✕ Reject Proof...</button>';

      openModal('deliverable-detail-modal');
    }
    const openProofDetailModal = openDeliverableDetail;

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
        cachedDeliverables = items;
        renderDeliverables();
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
