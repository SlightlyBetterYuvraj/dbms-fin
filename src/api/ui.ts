/**
 * Phase Zero UI Stabilization — Single-Day Focused Timetable Grid & Multi-Role Simulator.
 * Strictly vanilla HTML/CSS/JS with ₹0 prototype constraints (no heavy frameworks or maps).
 * Adheres strictly to:
 * - DEC-04 (Period 4 12:00-13:00 explicit non-teaching lunch break)
 * - D16 (Textual room, building, floor venue representation - no maps or decorative canvas)
 * - D17 / D18 (Cancelled classes clearly marked; replacement sessions with prior cancellation reference)
 * - D44 (Two-slot practical lab sessions visibly spanning both consecutive slots)
 */

export function renderHtmlUI(config?: { supabaseUrl?: string; supabaseAnonKey?: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>University Timetable Management System</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <style>
    :root {
      --bg: #0b1120;
      --card: #1e293b;
      --card-hover: #24344d;
      --border: #334155;
      --border-focus: #38bdf8;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --primary-dim: rgba(56, 189, 248, 0.12);
      --danger: #ef4444;
      --danger-dim: rgba(239, 68, 68, 0.15);
      --success: #10b981;
      --warning: #f59e0b;
      --lunch-bg: rgba(245, 158, 11, 0.08);
      --lunch-border: #d97706;
      --lab-bg: rgba(168, 85, 247, 0.12);
      --lab-border: rgba(168, 85, 247, 0.4);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 20px; line-height: 1.5; }
    header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 15px; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    h1 { font-size: 22px; color: var(--text); }
    .subtitle { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
    
    /* Role Simulator Header Controls */
    .role-simulator-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .role-simulator-label { font-size: 13px; color: var(--text-muted); font-weight: 500; }
    .role-pill-group { display: flex; gap: 4px; background: #131d31; padding: 3px; border-radius: 8px; border: 1px solid var(--border); }
    .role-pill { background: transparent; border: none; padding: 6px 12px; border-radius: 6px; color: var(--text-muted); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
    .role-pill:hover { color: var(--text); background: rgba(255, 255, 255, 0.05); }
    .role-pill.active { background: var(--primary); color: #020617; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }

    /* Day Navigation Bar */
    .day-nav-bar { display: flex; justify-content: space-between; align-items: center; background: #131d31; border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
    .day-nav-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .nav-cycle-btn { background: var(--card); border: 1px solid var(--border); color: var(--text); padding: 7px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
    .nav-cycle-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
    .nav-cycle-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .day-tabs { display: flex; gap: 4px; }
    .day-tab { background: var(--card); border: 1px solid var(--border); color: var(--text-muted); padding: 7px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
    .day-tab:hover { color: var(--text); border-color: #475569; }
    .day-tab.active { background: var(--primary); color: #020617; border-color: var(--primary); font-weight: 700; }
    .active-day-info { display: flex; align-items: center; gap: 10px; }
    .active-day-badge { background: #1e293b; border: 1px solid var(--border); padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; color: var(--primary); }
    
    /* Context Banner */
    .context-banner { background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
    .context-info { font-size: 13px; color: var(--text); }
    .context-info strong { color: var(--primary); }
    .context-filters { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .context-filters select { background: var(--card); border: 1px solid var(--border); color: var(--text); padding: 5px 10px; border-radius: 6px; font-size: 12px; width: auto; margin: 0; }

    /* Single Day Timetable Grid Table */
    .grid-container { background: var(--card); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .grid-header-row { padding: 14px 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .grid-header-row h2 { font-size: 16px; color: var(--text); }
    .table-responsive { overflow-x: auto; width: 100%; }
    table.timetable-grid { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 1050px; font-size: 12px; table-layout: fixed; }
    
    table.timetable-grid th { background: #131d31; color: var(--text); padding: 10px 8px; border-bottom: 2px solid var(--border); border-right: 1px solid var(--border); text-align: center; font-weight: 600; }
    table.timetable-grid th:last-child { border-right: none; }
    table.timetable-grid th.col-track { width: 150px; text-align: left; padding-left: 14px; background: #0f172a; }
    table.timetable-grid th.col-period { width: calc((100% - 150px) / 8); }
    table.timetable-grid th.col-lunch { background: rgba(245, 158, 11, 0.12); color: #fbbf24; border-bottom: 2px solid var(--lunch-border); }
    .period-time { font-size: 11px; font-weight: normal; color: var(--text-muted); display: block; margin-top: 2px; }
    
    table.timetable-grid td { border-bottom: 1px solid var(--border); border-right: 1px solid var(--border); padding: 6px; vertical-align: top; background: rgba(15, 23, 42, 0.3); }
    table.timetable-grid td:last-child { border-right: none; }
    table.timetable-grid td.cell-track { background: #131d31; font-weight: 600; padding: 14px; color: var(--primary); font-size: 13px; }
    table.timetable-grid td.slot-lunch { background: var(--lunch-bg); border-left: 1px dashed var(--lunch-border); border-right: 1px dashed var(--lunch-border); text-align: center; padding: 16px 4px; }
    table.timetable-grid td.slot-empty { text-align: center; color: #475569; padding: 14px 4px; }
    table.timetable-grid td.slot-lab-cell { background: rgba(168, 85, 247, 0.05); }

    /* Slot Cards & Badges */
    .slot-card { border-radius: 6px; padding: 8px 10px; margin-bottom: 4px; font-size: 12px; line-height: 1.4; transition: all 0.15s ease; }
    .slot-scheduled { background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.28); }
    .slot-lab { background: var(--lab-bg); border: 1px solid var(--lab-border); }
    .slot-cancelled { background: var(--danger-dim); border: 1px dashed var(--danger); color: #fca5a5; }
    
    .card-badges { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 4px; }
    .badge-act { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .badge-lec { background: #0284c7; color: #f0f9ff; }
    .badge-tut { background: #d97706; color: #fffbeb; }
    .badge-lab { background: #7e22ce; color: #faf5ff; }
    .badge-extra { background: #059669; color: #ecfdf5; }
    .badge-cancel { background: #b91c1c; color: #fef2f2; }
    .badge-replace { background: #047857; color: #ecfdf5; }

    .card-title { font-weight: 700; color: var(--text); font-size: 12px; margin-bottom: 3px; }
    .card-meta { font-size: 11px; color: var(--text-muted); margin-bottom: 2px; }
    .card-meta strong { color: #cbd5e1; }
    .card-cancel-reason { font-size: 11px; color: #f87171; font-style: italic; margin-top: 3px; }
    .card-replace-notice { font-size: 10px; color: #34d399; font-weight: 600; margin-bottom: 4px; border-left: 2px solid #10b981; padding-left: 4px; }

    .card-actions { display: flex; gap: 4px; margin-top: 6px; }
    .btn-xs { padding: 2px 7px; font-size: 10px; font-weight: 600; border-radius: 4px; border: none; cursor: pointer; }
    .btn-xs-danger { background: var(--danger); color: #fff; }
    .btn-xs-danger:hover { opacity: 0.9; }
    .btn-xs-sec { background: #475569; color: #fff; }
    .btn-xs-sec:hover { background: #64748b; }
    .btn-book-free { background: transparent; border: 1px dashed #475569; color: #94a3b8; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; margin-top: 4px; }
    .btn-book-free:hover { border-color: var(--primary); color: var(--primary); background: rgba(56, 189, 248, 0.05); }

    /* Operational Cards Layout */
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 18px; }
    h2 { font-size: 16px; margin-bottom: 12px; color: var(--primary); }
    h3 { font-size: 14px; margin: 10px 0 6px 0; color: var(--text); }
    p, li { font-size: 13px; color: var(--text-muted); line-height: 1.5; }
    button { background: var(--primary); color: #000; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 8px; font-size: 13px; }
    button:hover { opacity: 0.9; }
    button.danger { background: var(--danger); color: #fff; }
    button.warning { background: var(--warning); color: #000; }
    button.secondary { background: #475569; color: #fff; }
    input, select, textarea { width: 100%; background: #0b1120; border: 1px solid var(--border); color: var(--text); padding: 8px; border-radius: 6px; margin: 6px 0 10px 0; font-size: 13px; }
    .status-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .status-scheduled { background: #064e3b; color: #34d399; }
    .status-cancelled { background: #7f1d1d; color: #f87171; }
    .status-draft { background: #78350f; color: #fbbf24; }
    .status-published { background: #064e3b; color: #34d399; }
    .status-superseded { background: #374151; color: #9ca3af; }
    .error-box { background: rgba(239, 68, 68, 0.15); border: 1px solid var(--danger); color: #fca5a5; padding: 10px; border-radius: 6px; margin-bottom: 16px; font-size: 13px; display: none; }
    .success-box { background: rgba(16, 185, 129, 0.15); border: 1px solid var(--success); color: #6ee7b7; padding: 10px; border-radius: 6px; margin-bottom: 16px; font-size: 13px; display: none; }
    
    .demo-callout-box { background: rgba(56, 189, 248, 0.08); border: 1px dashed var(--primary); border-radius: 8px; padding: 20px; text-align: center; margin: 20px; }
    .demo-callout-box p { color: var(--text); margin-bottom: 10px; font-size: 14px; }

    /* Modular Admin Navigation Tabs */
    .admin-subnav-bar { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 12px; flex-wrap: wrap; }
    .admin-subnav-tab { background: #131d31; border: 1px solid var(--border); color: var(--text-muted); padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
    .admin-subnav-tab:hover { color: var(--text); border-color: #475569; }
    .admin-subnav-tab.active { background: var(--primary); color: #020617; border-color: var(--primary); font-weight: 700; }
    .admin-tab-pane { display: none; }
    .admin-tab-pane.active { display: block; }

    /* Tables in modular management views */
    .data-table-container { background: #131d31; border: 1px solid var(--border); border-radius: 6px; overflow-x: auto; margin-top: 12px; max-height: 280px; }
    table.data-table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
    table.data-table th { background: #0f172a; padding: 8px 10px; color: var(--text-muted); font-weight: 600; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 2; }
    table.data-table td { padding: 8px 10px; border-bottom: 1px solid rgba(51, 65, 85, 0.5); color: var(--text); }
    table.data-table tr:hover td { background: rgba(255, 255, 255, 0.02); }

    /* Forms in modular cards */
    .form-row { display: flex; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
    .form-col { flex: 1; min-width: 140px; }
    .form-col label { display: block; font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 2px; }

    /* Guardrail & inline error badges */
    .err-badge { background: var(--danger-dim); border: 1px solid var(--danger); color: #fca5a5; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; margin: 8px 0; display: none; }
    .err-badge.visible { display: block; }
    .info-badge { background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); color: var(--primary); padding: 8px 12px; border-radius: 6px; font-size: 12px; margin: 8px 0; }
    .warn-badge { background: rgba(245, 158, 11, 0.12); border: 1px solid #d97706; color: #fbbf24; padding: 10px 14px; border-radius: 6px; font-size: 12px; margin: 10px 0; }

    /* Assembly Console styles */
    .assembly-box { background: #131d31; border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 16px; }
    .assembly-tree { margin-left: 14px; }
    .tree-term { font-weight: 700; color: var(--primary); margin: 6px 0; }
    .tree-sec { font-weight: 600; color: #cbd5e1; margin: 4px 0 4px 14px; }
    .tree-batch { color: var(--text-muted); margin: 2px 0 2px 28px; }
    .drag-drop-zone { border: 2px dashed #475569; border-radius: 8px; padding: 24px; text-align: center; background: rgba(15, 23, 42, 0.4); cursor: pointer; transition: all 0.2s ease; margin-bottom: 12px; }
    .drag-drop-zone.dragover { border-color: var(--primary); background: rgba(56, 189, 248, 0.08); }
    .cli-box { background: #020617; border: 1px solid #334155; border-radius: 6px; padding: 10px; font-family: monospace; font-size: 12px; color: #38bdf8; overflow-x: auto; margin: 8px 0; user-select: all; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-top: 10px; }
    .metric-card { background: #0b1120; border: 1px solid var(--border); border-radius: 6px; padding: 10px; text-align: center; }
    .metric-value { font-size: 18px; font-weight: 700; color: var(--primary); }
    .metric-label { font-size: 11px; color: var(--text-muted); }
    .toggle-slot-btn { padding: 4px 8px; font-size: 11px; border-radius: 4px; border: 1px solid var(--border); background: #1e293b; color: #f8fafc; cursor: pointer; }
    .toggle-slot-btn.unavailable { background: rgba(239, 68, 68, 0.25); border-color: var(--danger); color: #fca5a5; font-weight: 700; }
    
    /* Auth Header & Role Badges */
    .auth-bar { display: flex; align-items: center; gap: 10px; }
    .role-badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .role-badge-admin { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); }
    .role-badge-teacher { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35); }
    .role-badge-student { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.35); }
    .modal-backdrop { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); z-index: 1000; align-items: center; justify-content: center; }
    .modal-card { background: #1e293b; border: 1px solid var(--border); border-radius: 12px; width: 100%; max-width: 440px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>University Timetable Management System</h1>
      <p class="subtitle">Authoritative Timetable Engine • Supabase Auth & Row-Level Security</p>
    </div>
    <div class="auth-bar" id="authBar">
      <div id="unauthenticatedControls" style="display: flex; align-items: center; gap: 8px;">
        <button id="btnOpenLoginModal" class="btn-primary" onclick="openLoginModal()" style="padding: 7px 16px; font-size: 13px; font-weight: 600;">🔑 Sign In</button>
      </div>
      <div id="authenticatedControls" style="display: none; align-items: center; gap: 12px;">
        <div class="user-badge-container" style="display: flex; align-items: center; gap: 8px;">
          <span class="role-badge" id="navRoleBadge">👑 Administrator</span>
          <span class="user-display-name" id="navUserName" style="font-size: 13px; font-weight: 600; color: var(--text);">admin@university.edu</span>
        </div>
        <button id="btnLogout" class="btn-secondary" onclick="handleLogout()" style="padding: 5px 12px; font-size: 12px; border-radius: 6px; background: transparent; border: 1px solid var(--border); color: var(--text-muted); cursor: pointer;">🚪 Sign Out</button>
      </div>
    </div>
  </header>

  <!-- Real Authentication Modal -->
  <div id="loginModal" class="modal-backdrop">
    <div class="modal-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 id="authModalTitle" style="font-size: 18px; color: var(--text);">University Account Login</h3>
        <button onclick="closeLoginModal()" style="background: transparent; border: none; color: var(--text-muted); font-size: 22px; cursor: pointer;">&times;</button>
      </div>
      <div id="modalAlertBox" style="display: none; padding: 10px 12px; border-radius: 6px; margin-bottom: 14px; font-size: 13px;"></div>
      
      <div id="loginFormPane">
        <div style="margin-bottom: 12px;">
          <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Institutional Email</label>
          <input type="email" id="loginEmail" value="admin@university.edu" placeholder="e.g. admin@university.edu" style="width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid var(--border); border-radius: 6px; color: var(--text);">
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Password</label>
          <input type="password" id="loginPassword" value="AdminPassword123!" placeholder="••••••••" style="width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid var(--border); border-radius: 6px; color: var(--text);">
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <a href="javascript:void(0)" onclick="switchAuthPane('forgot')" style="font-size: 12px; color: var(--primary); text-decoration: none;">Forgot password?</a>
          <span style="font-size: 11px; color: var(--text-muted);">Supabase Auth Verified</span>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button onclick="closeLoginModal()" class="btn-secondary" style="padding: 8px 14px; font-size: 13px;">Cancel</button>
          <button onclick="handleLogin()" id="btnLoginSubmit" class="btn-primary" style="padding: 8px 18px; font-size: 13px; font-weight: 600;">Sign In</button>
        </div>
      </div>

      <div id="forgotFormPane" style="display: none;">
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">Enter your institutional email to dispatch a secure password reset link.</p>
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Institutional Email</label>
          <input type="email" id="forgotEmail" placeholder="e.g. faculty@university.edu" style="width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid var(--border); border-radius: 6px; color: var(--text);">
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button onclick="switchAuthPane('login')" class="btn-secondary" style="padding: 8px 14px; font-size: 13px;">Back to Login</button>
          <button onclick="handleForgotPassword()" id="btnForgotSubmit" class="btn-primary" style="padding: 8px 18px; font-size: 13px; font-weight: 600;">Dispatch Reset Link</button>
        </div>
      </div>
    </div>
  </div>

  <div id="alertBox" class="error-box"></div>
  <div id="infoBox" class="success-box"></div>

  <!-- Interactive Day Navigation Toolbar -->
  <div class="day-nav-bar">
    <div class="day-nav-controls">
      <button id="btnPrevDay" class="nav-cycle-btn" onclick="prevDay()">◀ Previous Day</button>
      <div class="day-tabs">
        <button class="day-tab active" id="dayTab1" onclick="setDay(0)">Mon (Day 1)</button>
        <button class="day-tab" id="dayTab2" onclick="setDay(1)">Tue (Day 2)</button>
        <button class="day-tab" id="dayTab3" onclick="setDay(2)">Wed (Day 3)</button>
        <button class="day-tab" id="dayTab4" onclick="setDay(3)">Thu (Day 4)</button>
        <button class="day-tab" id="dayTab5" onclick="setDay(4)">Fri (Day 5)</button>
      </div>
      <button id="btnNextDay" class="nav-cycle-btn" onclick="nextDay()">Next Day ▶</button>
    </div>
    <div class="active-day-info">
      <span class="active-day-badge" id="activeDayLabel">📅 Monday (Day 1) — 2026-09-07</span>
    </div>
  </div>

  <!-- Role Context Banner -->
  <div class="context-banner" id="roleContextBanner">
    <div class="context-info" id="contextInfoText">
      👑 <strong>Administrator View</strong> — Full campus view across sections, rooms, and teachers.
    </div>
    <div class="context-filters" id="adminFiltersRow">
      <label>Group by:</label>
      <select id="adminGroupBy" onchange="updateAdminGrouping(this.value)">
        <option value="section">Section</option>
        <option value="room">Room</option>
        <option value="teacher">Teacher</option>
      </select>
      <label>Filter:</label>
      <select id="adminFilterVal" onchange="updateAdminFilterVal(this.value)">
        <option value="all">All</option>
      </select>
      <button onclick="resetToSimpleMockData()" style="margin:0; padding:5px 10px; font-size:12px; background:#f43f5e;">🧹 Reset to Simple Mock Data</button>
      <button onclick="loadDemoSchedule()" style="margin:0; padding:5px 10px; font-size:12px;">⚡ 1-Click Load & Publish Demo</button>
    </div>
  </div>

  <!-- Single-Day Timetable Grid Container -->
  <div class="grid-container">
    <div class="grid-header-row">
      <h2 id="gridTitle">Daily Timetable Grid — Monday (Day 1)</h2>
      <div style="font-size:12px; color:var(--text-muted);" id="gridSubtitle">
        Periods 1 to 8 • Period 4 Lunch Break (DEC-04) • 2-Slot Practical Labs (D44)
      </div>
    </div>
    <div class="table-responsive">
      <div id="timetableGridWrapper">
        <div style="padding:24px; text-align:center; color:var(--text-muted);">Loading timetable schedule...</div>
      </div>
    </div>
  </div>

  <!-- ADMIN VIEW CONTROLS (Modular Administrative Management & Assembly Console) -->
  <div id="adminView" class="view-section">
    <!-- Sub-navigation tabs -->
    <div class="admin-subnav-bar">
      <button class="admin-subnav-tab active" id="tabBtnHierarchy" onclick="switchAdminTab('hierarchy')">🏛️ Academic Hierarchy</button>
      <button class="admin-subnav-tab" id="tabBtnCourses" onclick="switchAdminTab('courses')">📚 Course Catalog & Offerings</button>
      <button class="admin-subnav-tab" id="tabBtnVenues" onclick="switchAdminTab('venues')">🏢 Venues & Faculty</button>
      <button class="admin-subnav-tab" id="tabBtnSolver" onclick="switchAdminTab('solver')">⚙️ Timetable Generation Console</button>
      <button class="admin-subnav-tab" id="tabBtnOperations" onclick="switchAdminTab('operations')">📋 Operations & Versions</button>
      <button class="admin-subnav-tab" id="tabBtnUsers" onclick="switchAdminTab('users')">👥 User Provisioning</button>
    </div>

    <!-- TAB 1: ACADEMIC HIERARCHY -->
    <div id="adminTabHierarchy" class="admin-tab-pane active">
      <div class="grid">
        <!-- 1. Academic Years & Terms -->
        <div class="card">
          <h2>1. Academic Years & Terms (Semesters)</h2>
          <p>Configure Academic Terms and grid settings (PRD §4, 05_DATA_MODEL §1). Concurrently active terms can be scheduled jointly.</p>
          <div class="form-row">
            <div class="form-col">
              <label>Academic Year:</label>
              <input type="text" id="termYearLabel" value="2026-2027" placeholder="e.g. 2026-2027">
            </div>
            <div class="form-col">
              <label>Semester Number (1-8):</label>
              <input type="number" id="termSemesterNum" value="3" min="1" max="8">
            </div>
            <div class="form-col">
              <label>Cycle:</label>
              <select id="termCycle">
                <option value="odd">Odd (Semesters 1, 3, 5, 7)</option>
                <option value="even">Even (Semesters 2, 4, 6, 8)</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-col">
              <label>Start Date:</label>
              <input type="date" id="termStartDate" value="2026-09-01">
            </div>
            <div class="form-col">
              <label>End Date:</label>
              <input type="date" id="termEndDate" value="2026-12-20">
            </div>
            <div class="form-col">
              <label>Status:</label>
              <select id="termStatus">
                <option value="active">Active</option>
                <option value="planned">Planned</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <div style="background:#0b1120; border:1px solid var(--border); border-radius:6px; padding:8px 12px; margin:6px 0 10px 0; font-size:12px;">
            <strong>Campus Operating Grid (DEC-04):</strong> 5 Days/Week (Mon–Fri) • 8 One-Hour Periods (09:00–17:00) • Period 4 Lunch Break (12:00–13:00).
          </div>
          <button onclick="saveAcademicTerm()">Save / Add Term</button>
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr><th>ID</th><th>Year</th><th>Sem</th><th>Cycle</th><th>Dates</th><th>Status</th></tr>
              </thead>
              <tbody id="termsTableBody"></tbody>
            </table>
          </div>
        </div>

        <!-- 2. Sections -->
        <div class="card">
          <h2>2. Sections (Cohort Management)</h2>
          <p>Create sections belonging to an Academic Term. Total student cohort size is validated against venue capacities.</p>
          <div class="form-row">
            <div class="form-col">
              <label>Associated Term:</label>
              <select id="secTermSelect"></select>
            </div>
            <div class="form-col">
              <label>Section Name:</label>
              <input type="text" id="secNameInput" placeholder="e.g. Section B">
            </div>
            <div class="form-col">
              <label>Cohort Student Size:</label>
              <input type="number" id="secCohortSizeInput" value="50" min="1">
            </div>
          </div>
          <button onclick="createSection()">Create Section</button>
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr><th>ID</th><th>Term</th><th>Section Name</th><th>Cohort Size</th><th>Status</th></tr>
              </thead>
              <tbody id="sectionsTableBody"></tbody>
            </table>
          </div>
        </div>

        <!-- 3. Batches -->
        <div class="card">
          <h2>3. Batches (Practical / Tutorial Sub-Cohorts)</h2>
          <p>Sub-cohorts under parent sections for lab and tutorial sessions. Sibling batches may run simultaneously.</p>
          <div class="form-row">
            <div class="form-col">
              <label>Parent Section:</label>
              <select id="batchSecSelect"></select>
            </div>
            <div class="form-col">
              <label>Batch Name:</label>
              <input type="text" id="batchNameInput" placeholder="e.g. Batch A2">
            </div>
            <div class="form-col">
              <label>Batch Student Count:</label>
              <input type="number" id="batchCountInput" value="25" min="1">
            </div>
          </div>
          <div class="info-badge">
            ℹ️ <strong>Domain Invariant Check:</strong> Whole-section classes conflict with constituent batch sessions, while distinct batches (A1 and A2) may run concurrently.
          </div>
          <button onclick="createBatch()">Create Sub-Batch</button>
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr><th>ID</th><th>Parent Section</th><th>Batch Name</th><th>Student Count</th></tr>
              </thead>
              <tbody id="batchesTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: COURSE CATALOG & OFFERINGS -->
    <div id="adminTabCourses" class="admin-tab-pane">
      <div class="grid">
        <!-- 1. Course Definition -->
        <div class="card">
          <h2>1. Course Definition & Delivery Hours</h2>
          <p>Define courses and contact hours. Strict guardrail: Practical hours must be an even integer (2 consecutive slots per session).</p>
          <div class="form-row">
            <div class="form-col">
              <label>Course Code:</label>
              <input type="text" id="courseCodeInput" placeholder="e.g. CS202">
            </div>
            <div class="form-col">
              <label>Course Title:</label>
              <input type="text" id="courseNameInput" placeholder="e.g. Computer Networks">
            </div>
            <div class="form-col">
              <label>Academic Term:</label>
              <select id="courseTermSelect"></select>
            </div>
            <div class="form-col">
              <label>Department:</label>
              <input type="text" id="courseDeptInput" placeholder="e.g. Computer Science">
            </div>
          </div>
          <div class="form-row">
            <div class="form-col">
              <label>Lecture Hours (L):</label>
              <input type="number" id="courseLHours" value="3" min="0" oninput="validateCourseHours()">
              <small style="color:var(--text-muted);">1-hr slots</small>
            </div>
            <div class="form-col">
              <label>Tutorial Hours (T):</label>
              <input type="number" id="courseTHours" value="1" min="0" oninput="validateCourseHours()">
              <small style="color:var(--text-muted);">1-hr slots</small>
            </div>
            <div class="form-col">
              <label>Practical Hours (P):</label>
              <input type="number" id="coursePHours" value="2" min="0" oninput="validateCourseHours()">
              <small style="color:var(--text-muted);">Must be even (2 slots/session)</small>
            </div>
            <div class="form-col">
              <label>Required Venue Type:</label>
              <select id="courseVenueType">
                <option value="LT">LT (Lecture / Tutorial Room)</option>
                <option value="P">P (Practical / Lab Venue)</option>
              </select>
            </div>
          </div>

          <!-- Inline Guardrail Banner for ERR_ODD_P_HOURS -->
          <div id="oddHoursErrorBadge" class="err-badge">
            ⚠️ <strong>ERR_ODD_P_HOURS:</strong> Practical hours must be an even integer (2 consecutive slots per session). Rounding or conversion is prohibited.
          </div>

          <button id="btnSaveCourse" onclick="saveCourse()">Save Course</button>

          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr><th>Code</th><th>Title</th><th>Term</th><th>Dept</th><th>L / T / P</th><th>Venue Type</th></tr>
              </thead>
              <tbody id="coursesTableBody"></tbody>
            </table>
          </div>
        </div>

        <!-- 2. Course Offerings (Assignments) -->
        <div class="card">
          <h2>2. Course Offerings (Instructor & Cohort Mapping)</h2>
          <p>Map courses to assigned teachers and target cohorts (Section, Batch, or Elective Group).</p>
          <div class="form-row">
            <div class="form-col">
              <label>Course:</label>
              <select id="offeringCourseSelect"></select>
            </div>
            <div class="form-col">
              <label>Assigned Teacher:</label>
              <select id="offeringTeacherSelect"></select>
            </div>
            <div class="form-col">
              <label>Target Cohort Type:</label>
              <select id="offeringTargetType" onchange="updateOfferingTargetOptions()">
                <option value="section">Section</option>
                <option value="batch">Batch (Lab Sub-Cohort)</option>
                <option value="elective_group">Elective Group</option>
              </select>
            </div>
            <div class="form-col">
              <label>Target Cohort:</label>
              <select id="offeringTargetId"></select>
            </div>
            <div class="form-col">
              <label>Component / Activity:</label>
              <select id="offeringComponent">
                <option value="">All Components (Default L+T+P)</option>
                <option value="L">Lecture Only (L)</option>
                <option value="T">Tutorial Only (T)</option>
                <option value="P">Practical Only (P)</option>
              </select>
            </div>
          </div>
          <button onclick="createOffering()">Create Course Offering</button>
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr><th>Offering ID</th><th>Course</th><th>Teacher</th><th>Component</th><th>Target Cohort</th><th>Term</th></tr>
              </thead>
              <tbody id="offeringsTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: VENUES & FACULTY -->
    <div id="adminTabVenues" class="admin-tab-pane">
      <div class="grid">
        <!-- 1. Rooms -->
        <div class="card">
          <h2>1. Venues & Rooms (D16, D34)</h2>
          <p>Manage physical classrooms and laboratories with strict capability designation (LT vs P) and capacity validation.</p>
          <div class="form-row">
            <div class="form-col">
              <label>Room Number:</label>
              <input type="text" id="roomNumberInput" placeholder="e.g. 201 or Lab-B">
            </div>
            <div class="form-col">
              <label>Building:</label>
              <input type="text" id="roomBuildingInput" value="Engineering Block">
            </div>
            <div class="form-col">
              <label>Floor:</label>
              <input type="number" id="roomFloorInput" value="2" min="0">
            </div>
            <div class="form-col">
              <label>Seating Capacity:</label>
              <input type="number" id="roomCapacityInput" value="60" min="1">
            </div>
            <div class="form-col">
              <label>Capability (Type):</label>
              <select id="roomTypeInput">
                <option value="LT">LT (Lecture / Tutorial)</option>
                <option value="P">P (Practical / Lab)</option>
              </select>
            </div>
          </div>
          <button onclick="saveRoom()">Register Room</button>
          <div class="data-table-container">
            <table class="data-table">
              <thead>
                <tr><th>Room #</th><th>Building</th><th>Floor</th><th>Capacity</th><th>Type</th><th>Status</th></tr>
              </thead>
              <tbody id="roomsTableBody"></tbody>
            </table>
          </div>
        </div>

        <!-- 2. Faculty & Unavailability -->
        <div class="card">
          <h2>2. Faculty & Regular Unavailability Slots (D33)</h2>
          <p>Manage instructors and their regular weekly unavailable periods.</p>
          <div class="form-row">
            <div class="form-col">
              <label>Employee ID:</label>
              <input type="text" id="teacherEmpIdInput" placeholder="e.g. EMP-103">
            </div>
            <div class="form-col">
              <label>Teacher Name:</label>
              <input type="text" id="teacherNameInput" placeholder="e.g. Dr. Bob Jones">
            </div>
            <div class="form-col">
              <label>Email:</label>
              <input type="email" id="teacherEmailInput" placeholder="e.g. bob@uni.edu">
            </div>
            <div class="form-col">
              <label>Department:</label>
              <input type="text" id="teacherDeptInput" placeholder="e.g. Computer Science">
            </div>
          </div>
          <button onclick="saveTeacher()">Register Faculty</button>

          <h3 style="margin-top:20px;">Regular Weekly Unavailability Manager</h3>
          <p style="font-size:12px; color:var(--text-muted);">Select a teacher and click any slot to toggle regular unavailability.</p>
          <div class="form-row" style="margin-top:8px;">
            <div class="form-col" style="max-width:250px;">
              <label>Select Faculty Member:</label>
              <select id="availTeacherSelect" onchange="renderTeacherAvailabilityMatrix()"></select>
            </div>
          </div>
          <div id="unavailabilityMatrixContainer" style="margin-top:10px; overflow-x:auto;"></div>

          <div class="data-table-container" style="margin-top:14px;">
            <table class="data-table">
              <thead>
                <tr><th>Emp ID</th><th>Name</th><th>Email</th><th>Dept</th><th>Status</th></tr>
              </thead>
              <tbody id="teachersTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: SOLVER INPUT & ASSEMBLY CONSOLE -->
    <div id="adminTabSolver" class="admin-tab-pane">
      <div class="card" style="margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <h2>Timetable Solver Input & Assembly Console</h2>
            <p style="color:var(--text-muted);">Compose semester scheduling scope from modular prerequisites and execute/stage drafts.</p>
          </div>
          <div>
            <span class="status-tag status-draft" style="font-size:12px; padding:4px 10px;">⚡ Hosted Solver: Offline (₹0 Free Mode)</span>
          </div>
        </div>

        <div class="assembly-box" style="margin-top:14px;">
          <h3>Step 1: Concurrently Active Semester Scope (D10, D46)</h3>
          <p style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">Select the academic terms to schedule together in this run:</p>
          <div id="assemblyTermCheckboxes" style="display:flex; gap:12px; flex-wrap:wrap;"></div>
        </div>

        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-bottom:16px;">
          <!-- Included Cohorts Nested Tree -->
          <div class="assembly-box" style="margin-bottom:0;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h3>👥 Included Cohorts</h3>
              <button class="secondary" style="padding:2px 8px; font-size:11px; margin:0;" onclick="toggleAllCohorts(true)">Select All</button>
            </div>
            <div id="cohortNestedTree" style="margin-top:10px; max-height:220px; overflow-y:auto;"></div>
          </div>

          <!-- Included Course Offerings -->
          <div class="assembly-box" style="margin-bottom:0;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h3>📚 Course Offerings</h3>
              <button class="secondary" style="padding:2px 8px; font-size:11px; margin:0;" onclick="toggleAllOfferings(true)">Select All</button>
            </div>
            <div id="assemblyOfferingsList" style="margin-top:10px; max-height:220px; overflow-y:auto;"></div>
          </div>

          <!-- Available Venues -->
          <div class="assembly-box" style="margin-bottom:0;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h3>🏢 Available Venues</h3>
              <button class="secondary" style="padding:2px 8px; font-size:11px; margin:0;" onclick="toggleAllVenues(true)">Select All</button>
            </div>
            <div id="assemblyVenuesList" style="margin-top:10px; max-height:220px; overflow-y:auto;"></div>
          </div>

          <!-- Participating Faculty -->
          <div class="assembly-box" style="margin-bottom:0;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <h3>👨‍🏫 Participating Faculty</h3>
              <button class="secondary" style="padding:2px 8px; font-size:11px; margin:0;" onclick="toggleAllFaculty(true)">Select All</button>
            </div>
            <div id="assemblyFacultyList" style="margin-top:10px; max-height:220px; overflow-y:auto;"></div>
          </div>
        </div>

        <!-- Pre-Flight Feasibility & Capacity Badge -->
        <div id="preFlightMetricsContainer" class="assembly-box" style="background:#0b1120;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <h3 style="margin:0;">Pre-Flight Feasibility & Capacity Inspection</h3>
            <div id="feasibilityStatusBadge"></div>
          </div>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value" id="metricSlotsRequired">0</div>
              <div class="metric-label">Teaching Slots Req.</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" id="metricCapacity">0</div>
              <div class="metric-label">Venue-Period Capacity</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" id="metricSelectedOfferings">0</div>
              <div class="metric-label">Course Offerings</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" id="metricSelectedRooms">0</div>
              <div class="metric-label">Active Rooms</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" id="metricSelectedFaculty">0</div>
              <div class="metric-label">Active Faculty</div>
            </div>
          </div>
          <div id="preFlightWarningsContainer" style="margin-top:12px;"></div>
        </div>

        <!-- Assembly Actions & Local Solver Router -->
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px;">
          <button onclick="runSolverAndStageDraftDirectly()" style="background:#10b981; color:#020617; font-weight:700;">🚀 Run Solver & Stage Draft (Instant)</button>
          <button onclick="compileAssemblyPackage()" style="background:#38bdf8; color:#020617; font-weight:700;">⚡ Compile Generation Package</button>
          <button onclick="downloadAssembledPackage()" class="secondary">📥 Download Input Package (.json)</button>
        </div>
        <div id="compilationResultBox" style="margin-top:12px; display:none;"></div>

        <div class="assembly-box" style="margin-top:16px; border:1px dashed #38bdf8;">
          <h3>🖥️ Local CP-SAT Solver Execution (₹0 Mode)</h3>
          <p style="font-size:12px; color:var(--text-muted);">
            Download the generation package above, then run the exact versioned OR-Tools solver on your terminal:
          </p>
          <div class="cli-box" id="cliCommandBox">py -3.12 generator/run_local.py --input pkg-*.json --output draft.json</div>
          <p style="font-size:11px; color:var(--text-muted); margin-top:4px;">
            The solver enforces hard constraints (HC01–HC08) and computes a deterministic schedule.
          </p>
        </div>

        <!-- Draft Staging & File Upload -->
        <div class="assembly-box" style="margin-top:16px;">
          <h3>Step 2: Draft File Upload & Staging (D48, D50)</h3>
          <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">
            Select or drop your solver output <code>draft.json</code>. Server validates mandatory constraints, venue types, and input revision hash.
          </p>
          <div id="draftDropZone" class="drag-drop-zone" onclick="document.getElementById('draftFileInput').click()">
            <div style="font-size:24px; margin-bottom:6px;">📄</div>
            <div style="font-weight:600; color:var(--text);">Drag and drop <code>draft.json</code> here or click to browse</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">Accepts valid JSON files produced by local or hosted generator</div>
            <input type="file" id="draftFileInput" accept=".json" style="display:none;" onchange="handleDraftFileSelect(event)">
          </div>
          <details style="margin-bottom:12px;">
            <summary style="font-size:12px; color:var(--text-muted); cursor:pointer;">Or paste raw draft JSON</summary>
            <textarea id="assemblyDraftText" rows="4" placeholder="Paste draft.json contents here..." oninput="parseDraftText()"></textarea>
          </details>

          <div id="draftPreviewSummary" style="margin-bottom:12px; font-size:12px; display:none;"></div>

          <div id="staleRevisionBanner" class="warn-badge" style="display:none;">
            ⚠️ <strong>Stale Package Revision:</strong> The package hash in this draft differs from current university data.
            <div style="margin-top:6px;">
              <label><input type="checkbox" id="assemblyOverrideStale" style="width:auto;"> Allow audited administrator override</label>
              <input type="text" id="assemblyOverrideReason" placeholder="Audited reason for accepting stale draft...">
            </div>
          </div>

          <button id="btnValidateStage" onclick="validateAndStageDraft()" style="background:#10b981; color:#020617; font-weight:700;">✅ Validate & Stage Draft</button>
        </div>

        <!-- Explicit Publication -->
        <div class="assembly-box" style="margin-top:16px;">
          <h3>Step 3: Staged Draft Review & Explicit Publication (D13, D48)</h3>
          <p style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">
            Review staged drafts. Timetables are never published automatically. Publishing atomically promotes the version, archives prior versions, instantiates calendar occurrences, and notifies enrolled students.
          </p>
          <div id="stagedDraftsReviewList">Loading staged drafts...</div>
        </div>
      </div>
    </div>

    <!-- TAB 5: OPERATIONS & VERSIONS -->
    <div id="adminTabOperations" class="admin-tab-pane">
      <div class="grid">
        <div class="card">
          <h2>Timetable Versions & Historical Recovery</h2>
          <p>View published and archived versions. Restore a prior version atomically if needed.</p>
          <div id="versionsList">Loading versions...</div>
        </div>

        <div class="card">
          <h2>Teacher Unavailability Review</h2>
          <p>Review submitted unavailability requests. Confirmation lists affected class occurrences for explicit resolution.</p>
          <div id="unavailabilityList">Loading requests...</div>
        </div>

        <div class="card">
          <h2>Student Section Transfer</h2>
          <p>Transfer student to a new section/batch with effective date. Past classes remain unchanged; electives preserved.</p>
          <label>Student ID:</label>
          <input type="text" id="transferStudentId" value="stud-1">
          <label>New Group ID:</label>
          <input type="text" id="transferGroupId" value="sec-B">
          <label>Effective Date:</label>
          <input type="date" id="transferDate" value="2026-10-01">
          <button onclick="transferStudent()">Execute Transfer</button>
        </div>
      </div>
    </div>

    <!-- TAB 6: USER PROVISIONING -->
    <div id="adminTabUsers" class="admin-tab-pane">
      <div class="card">
        <h2>Administrator User Account Provisioning (D14)</h2>
        <p>Directly provision faculty and student accounts linked to Supabase Auth and authoritative profiles.</p>
        <div class="form-row">
          <div class="form-col">
            <label>Role:</label>
            <select id="provRole" onchange="handleProvRoleChange()">
              <option value="student">Student</option>
              <option value="teacher">Teacher (Faculty)</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div class="form-col" id="provEntitySelectCol">
            <label id="provEntityLabel">Select Student (Roll No):</label>
            <select id="provEntitySelect" onchange="handleProvEntitySelected()">
              <option value="">-- Choose Student by Roll No --</option>
            </select>
          </div>
          <div class="form-col">
            <label>Linked Entity ID / Roll No:</label>
            <input type="text" id="provEntityId" placeholder="e.g. 2025BTECH001 or stud-1">
          </div>
        </div>
        <div class="form-row">
          <div class="form-col">
            <label>Full Name:</label>
            <input type="text" id="provName" placeholder="e.g. Rohan Verma">
          </div>
          <div class="form-col">
            <label>Institutional Email:</label>
            <input type="email" id="provEmail" placeholder="e.g. rohan.verma@uni.edu">
          </div>
          <div class="form-col">
            <label>Temporary Password:</label>
            <input type="text" id="provPassword" value="TempPass123!" placeholder="TempPass123!">
          </div>
        </div>
        <!-- New Student Academic Enrollment Fields (Optional when not pre-populated) -->
        <div id="provStudentEnrollmentFields" style="margin-top:14px; padding:12px; border:1px solid rgba(56, 189, 248, 0.2); border-radius:8px; background:rgba(15, 23, 42, 0.5);">
          <div style="font-weight:600; color:var(--primary); font-size:13px; margin-bottom:8px;">
            🎓 Academic Enrollment (Assign Section, Batch & Electives to New Student)
          </div>
          <div class="form-row">
            <div class="form-col">
              <label>Enroll in Section:</label>
              <select id="provStudentSection" onchange="handleProvSectionChange()">
                <option value="">-- Select Section --</option>
              </select>
            </div>
            <div class="form-col">
              <label>Assign Practical Batch:</label>
              <select id="provStudentBatch">
                <option value="">-- Select Practical Batch --</option>
              </select>
            </div>
            <div class="form-col">
              <label>Optional Elective Group:</label>
              <select id="provStudentElective">
                <option value="">-- No Elective / Core Only --</option>
              </select>
            </div>
          </div>
          <p style="font-size:11px; color:var(--text-muted); margin:4px 0 0 0;">
            ℹ️ If the student is brand new and not yet in the master roster, selecting these fields will automatically create their Student profile, Section membership, Practical Lab sub-batch, and Elective enrollment atomically upon account provisioning.
          </p>
        </div>

        <div id="provStudentDetailsBanner" style="display:none; background:#0b1120; border:1px solid var(--border); border-radius:6px; padding:10px 14px; margin:10px 0; font-size:12px; color:var(--text-muted);"></div>
        <button onclick="handleProvisionUser()" class="btn-primary" style="margin-top:12px; font-weight:600;">Provision User Account</button>
      </div>
    </div>
  </div>

  <!-- TEACHER VIEW CONTROLS -->
  <div id="teacherView" class="view-section" style="display:none;">
    <div class="grid">
      <div class="card">
        <h2>Book One-Off Extra Class</h2>
        <p>Discovers free periods (cancellation-freed ranked first). Validates room capacity and type server-side.</p>
        <label>Date:</label>
        <input type="date" id="extraDate" value="2026-09-08">
        <label>Day of Week (1-5):</label>
        <input type="number" id="extraDay" min="1" max="5" value="2">
        <label>Activity Type:</label>
        <select id="extraActivity">
          <option value="L">Lecture (1 hour)</option>
          <option value="P">Practical / Lab (2 consecutive hours)</option>
        </select>
        <button onclick="queryFreeSlots()">Query Free Slots</button>
        <div id="slotsResults" style="margin-top:10px;"></div>
      </div>

      <div class="card">
        <h2>Teacher Unavailability Request</h2>
        <p>Submit date and slot ranges. Unconfirmed requests do not block scheduling until confirmed by an admin.</p>
        <label>Date:</label>
        <input type="date" id="unavailDate" value="2026-09-15">
        <label>Start Slot:</label>
        <input type="number" id="unavailStart" value="1" min="1" max="8">
        <label>End Slot:</label>
        <input type="number" id="unavailEnd" value="3" min="1" max="8">
        <label>Reason:</label>
        <input type="text" id="unavailReason" placeholder="Conference, illness...">
        <button onclick="submitUnavailability()">Submit Request</button>
      </div>
    </div>
  </div>

  <!-- STUDENT VIEW CONTROLS -->
  <div id="studentView" class="view-section" style="display:none;">
    <div class="grid">
      <div class="card" id="studentProfileCard">
        <h2>Enrolled Student Profile & Cohorts</h2>
        <div id="studentProfileContent">
          <p>Active student: <strong id="studentProfileName">Charlie Brown (stud-1)</strong> • <span id="studentProfileMeta">Roll CS2026-001 (Semester 3)</span></p>
          <ul style="margin: 10px 0 0 18px;" id="studentCohortsList">
            <li>Enrolled Section: <strong>Section 3A (sec-3A)</strong></li>
            <li>Assigned Practical Batch: <strong>Batch 3A1 (batch-3A1)</strong></li>
            <li>Enrolled Elective: <strong>Applied Machine Learning / Adv Algorithms</strong></li>
          </ul>
        </div>
        <p style="margin-top:10px; font-size:12px;">Only sessions mapped to these cohorts appear on the single-day grid.</p>
      </div>

      <div class="card">
        <h2>Persistent Inbox Notifications</h2>
        <p>Post-commit notifications for cancellations, reschedules, and extra classes.</p>
        <div id="studentInbox">Loading inbox...</div>
      </div>

      <div class="card">
        <h2>Student Security & Password Settings</h2>
        <p>Update your institutional account password securely.</p>
        <div style="margin-top:12px;">
          <label style="display:block; font-size:12px; color:var(--text-muted); margin-bottom:4px;">New Password (minimum 6 characters):</label>
          <input type="password" id="studentNewPassword" placeholder="••••••••" style="width:100%; max-width:280px; padding:6px 10px; border-radius:6px; background:#0f172a; border:1px solid var(--border); color:var(--text);">
          <div style="margin-top:10px;">
            <button onclick="handleStudentChangePassword()" class="btn-primary" style="padding:6px 14px; font-size:12px; font-weight:600;">Update Password</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const DAYS = [
      { dayOfWeek: 1, name: 'Monday', short: 'Mon', date: '2026-09-07' },
      { dayOfWeek: 2, name: 'Tuesday', short: 'Tue', date: '2026-09-08' },
      { dayOfWeek: 3, name: 'Wednesday', short: 'Wed', date: '2026-09-09' },
      { dayOfWeek: 4, name: 'Thursday', short: 'Thu', date: '2026-09-10' },
      { dayOfWeek: 5, name: 'Friday', short: 'Fri', date: '2026-09-11' },
    ];

    const PERIODS = [
      { index: 1, label: 'Period 1', time: '09:00 – 10:00', isLunch: false },
      { index: 2, label: 'Period 2', time: '10:00 – 11:00', isLunch: false },
      { index: 3, label: 'Period 3', time: '11:00 – 12:00', isLunch: false },
      { index: 4, label: 'Period 4 (Lunch)', time: '12:00 – 13:00', isLunch: true },
      { index: 5, label: 'Period 5', time: '13:00 – 14:00', isLunch: false },
      { index: 6, label: 'Period 6', time: '14:00 – 15:00', isLunch: false },
      { index: 7, label: 'Period 7', time: '15:00 – 16:00', isLunch: false },
      { index: 8, label: 'Period 8', time: '16:00 – 17:00', isLunch: false },
    ];

    let currentUser = null;
    let authToken = localStorage.getItem('timetable_auth_token') || '';
    let currentRole = 'admin';
    let currentState = {};
    let activeDayIndex = 0;
    let adminGroupBy = 'section';
    let adminFilterVal = 'all';

    const SUPABASE_URL = "${config?.supabaseUrl || ''}";
    const SUPABASE_ANON_KEY = "${config?.supabaseAnonKey || ''}";
    let realtimeEventSource = null;
    let supabaseChannelOccurrences = null;
    let supabaseChannelOutbox = null;

    function setupRealtime() {
      teardownRealtime();

      // 1. Supabase Realtime channel integration (D05, D22)
      if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
          const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { persistSession: false }
          });

          supabaseChannelOccurrences = client
            .channel('public:class_occurrences')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'class_occurrences' }, function() {
              handleOccurrenceRealtimeEvent();
            })
            .subscribe();

          supabaseChannelOutbox = client
            .channel('public:notification_outbox')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notification_outbox' }, function(payload) {
              if (payload && payload.new) handleNotificationRealtimeEvent(payload.new);
            })
            .subscribe();
        } catch (e) {
          console.warn('[Realtime] Supabase subscription warning:', e);
        }
      }

      // 2. Dual-channel Server-Sent Events (SSE) Stream (instant cross-window updates)
      if (window.EventSource) {
        try {
          realtimeEventSource = new EventSource('/api/realtime/stream');
          realtimeEventSource.onmessage = function(e) {
            try {
              const event = JSON.parse(e.data);
              if (event.type === 'OCCURRENCE_MUTATED' || event.type === 'TIMETABLE_PUBLISHED') {
                handleOccurrenceRealtimeEvent();
              } else if (event.type === 'NOTIFICATIONS_DISPATCHED') {
                const notices = Array.isArray(event.payload) ? event.payload : [event.payload];
                notices.forEach(handleNotificationRealtimeEvent);
              }
            } catch (err) {}
          };
        } catch (e) {
          console.warn('[Realtime] SSE subscription warning:', e);
        }
      }
    }

    function teardownRealtime() {
      if (realtimeEventSource) {
        try { realtimeEventSource.close(); } catch {}
        realtimeEventSource = null;
      }
      if (supabaseChannelOccurrences) {
        try { supabaseChannelOccurrences.unsubscribe(); } catch {}
        supabaseChannelOccurrences = null;
      }
      if (supabaseChannelOutbox) {
        try { supabaseChannelOutbox.unsubscribe(); } catch {}
        supabaseChannelOutbox = null;
      }
    }

    let realtimeDebounceTimer = null;
    function handleOccurrenceRealtimeEvent() {
      if (realtimeDebounceTimer) clearTimeout(realtimeDebounceTimer);
      realtimeDebounceTimer = setTimeout(function() {
        loadState().then(function() {
          showMsg('⚡ Real-time schedule update applied across campus.', false);
        });
      }, 300);
    }

    function handleNotificationRealtimeEvent(notice) {
      if (!notice) return;
      const targetStudent = currentUser && currentUser.role === 'student' && currentUser.entityId ? currentUser.entityId : 'stud-1';
      const studentId = notice.recipient_student_id || notice.recipientStudentId;
      if (!studentId || studentId === targetStudent || currentRole === 'student') {
        showMsg('🔔 New Alert: ' + (notice.title || 'Schedule Update') + ' — ' + (notice.message || ''), false);
        renderStudentInbox();
      }
    }

    function updateAuthNav() {

      const unauth = document.getElementById('unauthenticatedControls');
      const auth = document.getElementById('authenticatedControls');
      const roleBadge = document.getElementById('navRoleBadge');
      const userName = document.getElementById('navUserName');

      if (currentUser && authToken) {
        if (unauth) unauth.style.display = 'none';
        if (auth) auth.style.display = 'flex';
        if (roleBadge) {
          const roleLabels = {
            admin: '👑 Administrator',
            teacher: '👨‍🏫 Faculty',
            student: '🎓 Student'
          };
          roleBadge.textContent = roleLabels[currentUser.role] || currentUser.role;
          roleBadge.className = 'role-badge role-badge-' + currentUser.role;
        }
        if (userName) {
          userName.textContent = (currentUser.fullName || currentUser.email) + ' (' + currentUser.email + ')';
        }
        selectRole(currentUser.role);
      } else {
        if (unauth) unauth.style.display = 'flex';
        if (auth) auth.style.display = 'none';
        selectRole('student');
      }
    }

    function openLoginModal() {
      const modal = document.getElementById('loginModal');
      if (modal) {
        modal.style.display = 'flex';
        switchAuthPane('login');
      }
    }

    function closeLoginModal() {
      const modal = document.getElementById('loginModal');
      if (modal) modal.style.display = 'none';
    }

    function switchAuthPane(pane) {
      const loginPane = document.getElementById('loginFormPane');
      const forgotPane = document.getElementById('forgotFormPane');
      const modalTitle = document.getElementById('authModalTitle');
      const alertBox = document.getElementById('modalAlertBox');
      if (alertBox) alertBox.style.display = 'none';

      if (pane === 'forgot') {
        if (loginPane) loginPane.style.display = 'none';
        if (forgotPane) forgotPane.style.display = 'block';
        if (modalTitle) modalTitle.textContent = 'Password Recovery';
      } else {
        if (loginPane) loginPane.style.display = 'block';
        if (forgotPane) forgotPane.style.display = 'none';
        if (modalTitle) modalTitle.textContent = 'University Account Login';
      }
    }

    async function handleLogin() {
      const email = document.getElementById('loginEmail')?.value;
      const password = document.getElementById('loginPassword')?.value;
      const alertBox = document.getElementById('modalAlertBox');

      if (!email || !password) {
        if (alertBox) {
          alertBox.textContent = 'Please provide both institutional email and password.';
          alertBox.style.background = 'rgba(239, 68, 68, 0.15)';
          alertBox.style.color = '#fca5a5';
          alertBox.style.display = 'block';
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          if (data.error === 'AUTH_SERVICE_UNCONFIGURED') {
            throw new Error('AUTH_SERVICE_UNCONFIGURED: Supabase authentication service is not configured.');
          }
          throw new Error(data.message || data.error || 'Invalid credentials');
        }

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('timetable_auth_token', authToken);
        updateAuthNav();
        closeLoginModal();
        setupRealtime();
        showMsg('Signed in as ' + currentUser.fullName + ' (' + currentUser.role + ')', false);
        loadState();
      } catch (err) {
        if (alertBox) {
          alertBox.textContent = err.message;
          alertBox.style.background = 'rgba(239, 68, 68, 0.15)';
          alertBox.style.color = '#fca5a5';
          alertBox.style.display = 'block';
        }
      }
    }

    async function handleForgotPassword() {
      const email = document.getElementById('forgotEmail')?.value;
      const alertBox = document.getElementById('modalAlertBox');
      if (!email) {
        if (alertBox) {
          alertBox.textContent = 'Please enter your email.';
          alertBox.style.background = 'rgba(239, 68, 68, 0.15)';
          alertBox.style.color = '#fca5a5';
          alertBox.style.display = 'block';
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (alertBox) {
          alertBox.textContent = data.message || 'If the email exists, a reset link has been dispatched';
          alertBox.style.background = 'rgba(16, 185, 129, 0.15)';
          alertBox.style.color = '#6ee7b7';
          alertBox.style.display = 'block';
        }
      } catch (err) {
        if (alertBox) {
          alertBox.textContent = err.message;
          alertBox.style.display = 'block';
        }
      }
    }

    function handleLogout() {
      authToken = '';
      currentUser = null;
      localStorage.removeItem('timetable_auth_token');
      teardownRealtime();
      updateAuthNav();
      setupRealtime();
      showMsg('You have been signed out.', false);
      loadState();
    }


    function renderProvisioningEntityOptions() {
      const role = document.getElementById('provRole')?.value || 'student';
      const entitySel = document.getElementById('provEntitySelect');
      const label = document.getElementById('provEntityLabel');
      const banner = document.getElementById('provStudentDetailsBanner');
      const enrollFields = document.getElementById('provStudentEnrollmentFields');
      if (!entitySel || !label) return;

      if (banner) banner.style.display = 'none';

      if (role === 'student') {
        label.textContent = 'Select Existing Student (or choose -- Brand New Student --):';
        const students = currentState.students || [];
        let html = '<option value="">-- Brand New Student (Enter Roll No & Cohorts below) --</option>';
        students.forEach(function(s) {
          html += '<option value="' + s.id + '">' + s.rollNumber + ' — ' + s.name + '</option>';
        });
        entitySel.innerHTML = html;
        document.getElementById('provEntitySelectCol').style.display = 'block';
        if (enrollFields) enrollFields.style.display = 'block';
        populateProvisionStudentEnrollmentOptions();
      } else if (role === 'teacher') {
        label.textContent = 'Select Faculty (Emp ID):';
        const teachers = currentState.teachers || [];
        let html = '<option value="">-- Choose Faculty Member --</option>';
        teachers.forEach(function(t) {
          html += '<option value="' + t.id + '">' + t.empId + ' — ' + t.name + ' (' + (t.department || 'Faculty') + ')</option>';
        });
        entitySel.innerHTML = html;
        document.getElementById('provEntitySelectCol').style.display = 'block';
        if (enrollFields) enrollFields.style.display = 'none';
      } else {
        document.getElementById('provEntitySelectCol').style.display = 'none';
        if (enrollFields) enrollFields.style.display = 'none';
        const idInput = document.getElementById('provEntityId');
        if (idInput) idInput.value = '';
      }
    }

    function populateProvisionStudentEnrollmentOptions() {
      const secSel = document.getElementById('provStudentSection');
      const batchSel = document.getElementById('provStudentBatch');
      const elecSel = document.getElementById('provStudentElective');
      if (!secSel || !batchSel || !elecSel) return;

      const sections = currentState.sections || [];
      const terms = currentState.academicTerms || [];
      const electives = currentState.electiveGroups || [];

      let secHtml = '<option value="">-- Select Section --</option>';
      sections.forEach(function(s) {
        const term = terms.find(function(t) { return t.id === s.termId; });
        const termLabel = term ? (term.yearLabel + ' Sem ' + term.semesterNumber) : s.termId;
        secHtml += '<option value="' + s.id + '">' + s.name + ' (' + termLabel + ')</option>';
      });
      secSel.innerHTML = secHtml;

      handleProvSectionChange();

      let elecHtml = '<option value="">-- No Elective / Core Only --</option>';
      electives.forEach(function(e) {
        elecHtml += '<option value="' + e.id + '">' + e.name + ' (' + e.id + ')</option>';
      });
      elecSel.innerHTML = elecHtml;
    }

    function handleProvSectionChange() {
      const secId = document.getElementById('provStudentSection')?.value;
      const batchSel = document.getElementById('provStudentBatch');
      if (!batchSel) return;

      const batches = (currentState.batches || []).filter(function(b) {
        return !secId || b.sectionId === secId;
      });

      let bHtml = '<option value="">-- Select Practical Batch --</option>';
      batches.forEach(function(b) {
        bHtml += '<option value="' + b.id + '">' + b.name + ' (' + b.id + ')</option>';
      });
      batchSel.innerHTML = bHtml;
    }

    function handleProvRoleChange() {
      renderProvisioningEntityOptions();
      const role = document.getElementById('provRole')?.value;
      const idInput = document.getElementById('provEntityId');
      if (idInput) idInput.placeholder = role === 'student' ? 'e.g. 2025BTECH016' : (role === 'teacher' ? 'e.g. EMP-101' : 'e.g. admin-1');
    }

    function handleProvEntitySelected() {
      const role = document.getElementById('provRole')?.value;
      const entityId = document.getElementById('provEntitySelect')?.value;
      const idInput = document.getElementById('provEntityId');
      const nameInput = document.getElementById('provName');
      const emailInput = document.getElementById('provEmail');
      const banner = document.getElementById('provStudentDetailsBanner');
      const enrollFields = document.getElementById('provStudentEnrollmentFields');

      if (!entityId) {
        if (idInput) idInput.value = '';
        if (nameInput) nameInput.value = '';
        if (emailInput) emailInput.value = '';
        if (banner) banner.style.display = 'none';
        if (enrollFields && role === 'student') enrollFields.style.display = 'block';
        return;
      }

      if (role === 'student') {
        const student = (currentState.students || []).find(function(s) { return s.id === entityId; });
        if (student) {
          if (idInput) idInput.value = student.rollNumber || student.id;
          if (nameInput) nameInput.value = student.name;
          if (emailInput) emailInput.value = student.email;

          // Lookup enrolled cohorts
          const sections = [];
          const batches = [];
          const electives = [];
          (currentState.studentGroupMemberships || []).filter(function(m) { return m.studentId === student.id; }).forEach(function(m) {
            if (m.groupType === 'section') sections.push(m.groupId);
            if (m.groupType === 'batch') batches.push(m.groupId);
          });
          (currentState.electiveAssignments || []).filter(function(ea) { return ea.studentId === student.id && ea.status === 'active'; }).forEach(function(ea) {
            electives.push(ea.electiveGroupId);
          });

          if (banner) {
            banner.style.display = 'block';
            banner.innerHTML = '<strong>Enrolled Student:</strong> ' + student.name + ' (' + student.rollNumber + ')<br>' +
              'Section: <code>' + (sections.join(', ') || 'None') + '</code> • Sub-Batch: <code>' + (batches.join(', ') || 'None') + '</code> • Electives: <code>' + (electives.join(', ') || 'None') + '</code>';
          }
          if (enrollFields) enrollFields.style.display = 'none';
        }
      } else if (role === 'teacher') {
        const teacher = (currentState.teachers || []).find(function(t) { return t.id === entityId; });
        if (teacher) {
          if (idInput) idInput.value = teacher.empId || teacher.id;
          if (nameInput) nameInput.value = teacher.name;
          if (emailInput) emailInput.value = teacher.email;
          if (banner) {
            banner.style.display = 'block';
            banner.innerHTML = '<strong>Faculty Member:</strong> ' + teacher.name + ' (' + teacher.empId + ') — Dept: <code>' + (teacher.department || 'General') + '</code>';
          }
        }
      }
    }

    async function handleProvisionUser() {
      try {
        const name = document.getElementById('provName')?.value.trim();
        const email = document.getElementById('provEmail')?.value.trim();
        const role = document.getElementById('provRole')?.value;
        const entityId = document.getElementById('provEntityId')?.value.trim();
        const password = document.getElementById('provPassword')?.value;

        if (!name || !email || !role) {
          showMsg('Please specify Name, Email, and Role.', true);
          return;
        }

        let studentDetails = undefined;
        if (role === 'student') {
          const sec = document.getElementById('provStudentSection')?.value;
          const batch = document.getElementById('provStudentBatch')?.value;
          const elec = document.getElementById('provStudentElective')?.value;
          studentDetails = {
            rollNumber: entityId || ('2025BTECH' + Math.floor(100 + Math.random() * 900)),
            sectionId: sec || undefined,
            batchId: batch || undefined,
            electiveGroupId: elec || undefined,
          };
        }

        const data = await api('/api/auth/admin/provision-user', {
          method: 'POST',
          body: JSON.stringify({
            name,
            email,
            role,
            entityId: entityId || (studentDetails ? studentDetails.rollNumber : undefined),
            password,
            studentDetails,
          })
        });

        showMsg('User ' + data.user.fullName + ' (' + data.user.email + ') provisioned successfully as ' + data.user.role + '!', false);
        if (document.getElementById('provName')) document.getElementById('provName').value = '';
        if (document.getElementById('provEmail')) document.getElementById('provEmail').value = '';
        if (document.getElementById('provEntityId')) document.getElementById('provEntityId').value = '';
        if (document.getElementById('provEntitySelect')) document.getElementById('provEntitySelect').value = '';
        const banner = document.getElementById('provStudentDetailsBanner');
        if (banner) banner.style.display = 'none';

        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    // Role Switching without full page reload
    function selectRole(role) {
      currentRole = role;
      const adminView = document.getElementById('adminView');
      const teacherView = document.getElementById('teacherView');
      const studentView = document.getElementById('studentView');
      if (adminView) adminView.style.display = role === 'admin' ? 'block' : 'none';
      if (teacherView) teacherView.style.display = role === 'teacher' ? 'block' : 'none';
      if (studentView) studentView.style.display = role === 'student' ? 'block' : 'none';

      updateContextBanner();
      renderSingleDayGrid();

      if (role === 'student') {
        renderStudentProfile();
        renderStudentInbox();
      }
    }

    function updateContextBanner() {
      const bannerText = document.getElementById('contextInfoText');
      const filtersRow = document.getElementById('adminFiltersRow');

      if (!bannerText) return;
      if (currentRole === 'admin') {
        bannerText.innerHTML = '👑 <strong>Administrator View</strong> — Full campus view across sections, rooms, and teachers.';
        if (filtersRow) filtersRow.style.display = 'flex';
      } else if (currentRole === 'teacher') {
        const teacherName = (currentUser && currentUser.role === 'teacher') ? (currentUser.fullName || currentUser.email) : 'Prof. Rajesh Sharma';
        const teacherId = (currentUser && currentUser.role === 'teacher' && currentUser.entityId) ? currentUser.entityId : 'EMP-101';
        bannerText.innerHTML = '👨‍🏫 <strong>Teacher View: ' + teacherName + ' (' + teacherId + ')</strong> — Filtered to assigned classes across Sem 1 & Sem 5 and open booking slots.';
        if (filtersRow) filtersRow.style.display = 'none';
      } else {
        const studentEntity = (currentUser && currentUser.role === 'student' && currentUser.entityId) ? currentUser.entityId : 'stud-1';
        const studentObj = (currentState.students || []).find(function(s) { return s.id === studentEntity || s.rollNumber === studentEntity; });
        const studentName = (currentUser && currentUser.role === 'student') ? (currentUser.fullName || (studentObj ? studentObj.name : currentUser.email)) : (studentObj ? studentObj.name : 'Charlie Brown');
        const rollLabel = studentObj ? studentObj.rollNumber : studentEntity;
        bannerText.innerHTML = '🎓 <strong>Student View: ' + studentName + ' (' + rollLabel + ')</strong> — Filtered strictly to enrolled Section, Batch, and electives.';
        if (filtersRow) filtersRow.style.display = 'none';
      }
    }

    function renderStudentProfile() {
      const studentEntity = (currentUser && currentUser.role === 'student' && currentUser.entityId) ? currentUser.entityId : 'stud-1';
      const studentObj = (currentState.students || []).find(function(s) { return s.id === studentEntity || s.rollNumber === studentEntity; });
      const studentId = studentObj ? studentObj.id : studentEntity;
      const rollNumber = studentObj ? studentObj.rollNumber : studentEntity;
      const studentName = (currentUser && currentUser.role === 'student') ? (currentUser.fullName || (studentObj ? studentObj.name : currentUser.email)) : (studentObj ? studentObj.name : 'Charlie Brown');
      const nameEl = document.getElementById('studentProfileName');
      const metaEl = document.getElementById('studentProfileMeta');
      const cohortsEl = document.getElementById('studentCohortsList');
      if (nameEl) nameEl.textContent = studentName + ' (' + rollNumber + ')';

      if (metaEl) {
        metaEl.textContent = studentObj ? ('Roll ' + studentObj.rollNumber + ' • ' + (studentObj.email || '')) : (currentUser && currentUser.email ? currentUser.email : 'Enrolled Student');
      }

      if (cohortsEl) {
        const sections = [];
        const batches = [];
        const electives = [];
        (currentState.studentGroupMemberships || []).filter(function(m) { return m.studentId === studentId; }).forEach(function(m) {
          if (m.groupType === 'section') sections.push(m.groupId);
          if (m.groupType === 'batch') batches.push(m.groupId);
        });
        (currentState.electiveAssignments || []).filter(function(ea) { return ea.studentId === studentId && ea.status === 'active'; }).forEach(function(ea) {
          electives.push(ea.electiveGroupId);
        });

        cohortsEl.innerHTML = 
          '<li>Enrolled Section: <strong>' + (sections.length > 0 ? sections.join(', ') : 'Section 3A (sec-3A)') + '</strong></li>' +
          '<li>Assigned Practical Batch: <strong>' + (batches.length > 0 ? batches.join(', ') : 'Batch 3A1 (batch-3A1)') + '</strong></li>' +
          '<li>Enrolled Elective: <strong>' + (electives.length > 0 ? electives.join(', ') : 'Applied Machine Learning / Adv Algorithms') + '</strong></li>';
      }
    }

    async function handleStudentChangePassword() {
      const newPassword = document.getElementById('studentNewPassword')?.value;
      if (!newPassword || newPassword.length < 6) {
        showMsg('Password must be at least 6 characters.', true);
        return;
      }
      try {
        const data = await api('/api/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({ newPassword })
        });
        showMsg(data.message || 'Password updated successfully!', false);
        const pwdInput = document.getElementById('studentNewPassword');
        if (pwdInput) pwdInput.value = '';
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    function updateAdminGrouping(val) {
      adminGroupBy = val;
      populateAdminFilterOptions();
      renderSingleDayGrid();
    }

    function updateAdminFilterVal(val) {
      adminFilterVal = val;
      renderSingleDayGrid();
    }

    function populateAdminFilterOptions() {
      const select = document.getElementById('adminFilterVal');
      if (!select) return;
      let html = '<option value="all">All</option>';
      if (adminGroupBy === 'section') {
        (currentState.sections || []).forEach(function(s) {
          html += '<option value="' + s.id + '">' + s.name + '</option>';
        });
      } else if (adminGroupBy === 'room') {
        (currentState.rooms || []).forEach(function(r) {
          html += '<option value="' + r.id + '">Room ' + r.roomNumber + ' (' + r.building + ')</option>';
        });
      } else if (adminGroupBy === 'teacher') {
        (currentState.teachers || []).forEach(function(t) {
          html += '<option value="' + t.id + '">' + t.name + '</option>';
        });
      }
      select.innerHTML = html;
      adminFilterVal = 'all';
    }

    // Day Cycling Navigation
    function prevDay() {
      if (activeDayIndex > 0) {
        setDay(activeDayIndex - 1);
      }
    }

    function nextDay() {
      if (activeDayIndex < DAYS.length - 1) {
        setDay(activeDayIndex + 1);
      }
    }

    function setDay(index) {
      activeDayIndex = Math.max(0, Math.min(DAYS.length - 1, index));
      const activeDay = DAYS[activeDayIndex];

      for (let i = 0; i < DAYS.length; i++) {
        const tab = document.getElementById('dayTab' + (i + 1));
        if (tab) tab.classList.toggle('active', i === activeDayIndex);
      }

      const prevBtn = document.getElementById('btnPrevDay');
      const nextBtn = document.getElementById('btnNextDay');
      if (prevBtn) prevBtn.disabled = activeDayIndex === 0;
      if (nextBtn) nextBtn.disabled = activeDayIndex === DAYS.length - 1;

      const label = document.getElementById('activeDayLabel');
      const title = document.getElementById('gridTitle');
      if (label) label.textContent = '📅 ' + activeDay.name + ' (Day ' + activeDay.dayOfWeek + ') — ' + activeDay.date;
      if (title) title.textContent = 'Daily Timetable Grid — ' + activeDay.name + ' (Day ' + activeDay.dayOfWeek + ')';

      renderSingleDayGrid();
    }

    function showMsg(text, isError) {
      const errBox = document.getElementById('alertBox');
      const infoBox = document.getElementById('infoBox');
      if (isError) {
        if (errBox) { errBox.textContent = text; errBox.style.display = 'block'; }
        if (infoBox) infoBox.style.display = 'none';
      } else {
        if (infoBox) { infoBox.textContent = text; infoBox.style.display = 'block'; }
        if (errBox) errBox.style.display = 'none';
      }
      setTimeout(function() {
        if (errBox) errBox.style.display = 'none';
        if (infoBox) infoBox.style.display = 'none';
      }, 6000);
    }

    async function api(path, options) {
      options = options || {};
      const headers = Object.assign({
        'Content-Type': 'application/json',
      }, options.headers || {});

      if (authToken) {
        headers['Authorization'] = 'Bearer ' + authToken;
      } else {
        headers['x-user-role'] = currentRole;
        headers['x-user-id'] = currentRole === 'teacher' ? 't-1' : (currentRole === 'student' ? 'stud-1' : 'admin-1');
        headers['x-linked-id'] = currentRole === 'teacher' ? 't-1' : (currentRole === 'student' ? 'stud-1' : undefined);
      }

      options.headers = headers;
      const res = await fetch(path, options);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || data.error || 'Request failed');
      }
      return data;
    }

    async function loadState() {
      try {
        const res = await fetch('/api/state');
        currentState = await res.json();
        populateAdminFilterOptions();
        renderSingleDayGrid();
        renderAcademicHierarchy();
        renderCoursesAndOfferings();
        renderVenuesAndFaculty();
        renderSolverAssemblyConsole();
        renderVersions();
        renderUnavailability();
        renderStagedDraftsReview();
        renderProvisioningEntityOptions();
        if (currentRole === 'student') renderStudentInbox();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    // ------------------------------------------------------------------------
    // SINGLE-DAY TIMETABLE GRID RENDERING (Phase Zero Stabilization)
    // ------------------------------------------------------------------------
    function renderSingleDayGrid() {
      const container = document.getElementById('timetableGridWrapper');
      if (!container) return;

      const activeDay = DAYS[activeDayIndex];
      const allOccurrences = currentState.classOccurrences || [];
      const scheduledClasses = currentState.scheduledClasses || [];

      if (allOccurrences.length === 0 && scheduledClasses.length === 0) {
        container.innerHTML = '<div class="demo-callout-box">' +
          '<p>✨ <strong>No timetable occurrences published yet.</strong></p>' +
          '<p>Load the verified demo schedule with Monday Lecture, Tuesday Lecture, and Wednesday 2-Slot Lab!</p>' +
          '<button onclick="loadDemoSchedule()">⚡ 1-Click Load & Publish Demo Timetable</button>' +
        '</div>';
        return;
      }

      const roomsMap = new Map((currentState.rooms || []).map(function(r) { return [r.id, r]; }));
      const teachersMap = new Map((currentState.teachers || []).map(function(t) { return [t.id, t]; }));
      const coursesMap = new Map((currentState.courses || []).map(function(c) { return [c.id, c]; }));
      const sectionsMap = new Map((currentState.sections || []).map(function(s) { return [s.id, s]; }));
      const batchesMap = new Map((currentState.batches || []).map(function(b) { return [b.id, b]; }));
      const offeringsMap = new Map((currentState.courseOfferings || []).map(function(o) { return [o.id, o]; }));

      let dayOccs = allOccurrences.filter(function(o) { return o.date === activeDay.date && o.status !== 'superseded'; });
      if (dayOccs.length === 0) {
        dayOccs = allOccurrences.filter(function(o) { return o.dayOfWeek === activeDay.dayOfWeek && o.status !== 'superseded'; });
      }
      if (dayOccs.length === 0 && scheduledClasses.length > 0) {
        dayOccs = scheduledClasses.filter(function(c) { return c.dayOfWeek === activeDay.dayOfWeek; }).map(function(c) {
          return Object.assign({}, c, { date: activeDay.date, status: 'scheduled' });
        });
      }

      let rowsToRender = [];

      if (currentRole === 'student') {
        const studentEntity = (currentUser && currentUser.role === 'student' && currentUser.entityId) ? currentUser.entityId : 'stud-1';
        const studentObj = (currentState.students || []).find(function(s) { return s.id === studentEntity || s.rollNumber === studentEntity; });
        const studentId = studentObj ? studentObj.id : studentEntity;
        const studentName = (currentUser && currentUser.role === 'student') ? (currentUser.fullName || (studentObj ? studentObj.name : currentUser.email)) : (studentObj ? studentObj.name : 'Charlie Brown');
        const rollLabel = studentObj ? studentObj.rollNumber : studentId;
        const studentSections = new Set();
        const studentBatches = new Set();
        const studentElectives = new Set();

        (currentState.studentGroupMemberships || []).filter(function(m) {
          if (m.studentId !== studentId) return false;
          if (m.effectiveStartDate && m.effectiveStartDate > activeDay.date) return false;
          if (m.effectiveEndDate && m.effectiveEndDate < activeDay.date) return false;
          return true;
        }).forEach(function(m) {
          if (m.groupType === 'section') studentSections.add(m.groupId);
          if (m.groupType === 'batch') studentBatches.add(m.groupId);
        });
        if (studentSections.size === 0) studentSections.add('sec-A');
        if (studentBatches.size === 0) studentBatches.add('batch-A1');

        (currentState.electiveAssignments || []).filter(function(ea) { return ea.studentId === studentId && ea.status === 'active'; }).forEach(function(ea) {
          studentElectives.add(ea.electiveGroupId);
        });
        if (studentElectives.size === 0) studentElectives.add('elg-ai');

        const studentOccs = dayOccs.filter(function(o) {
          if (o.targetType === 'section') return studentSections.has(o.targetId);
          if (o.targetType === 'batch') return studentBatches.has(o.targetId);
          if (o.targetType === 'elective_group') return studentElectives.has(o.targetId);
          return false;
        });

        rowsToRender.push({
          label: studentName + ' (' + rollLabel + ')<br><small style="color:var(--text-muted); font-weight:normal;">' + Array.from(studentSections).join(', ') + ' • ' + Array.from(studentBatches).join(', ') + '</small>',
          occurrences: studentOccs
        });
      } else if (currentRole === 'teacher') {
        const teacherEntity = (currentUser && currentUser.role === 'teacher' && currentUser.entityId) ? currentUser.entityId : 't-1';
        const teacherObj = (currentState.teachers || []).find(function(t) { return t.id === teacherEntity; });
        const teacherName = teacherObj ? teacherObj.name : (currentUser ? currentUser.fullName || 'Teacher' : 'Prof. Rajesh Sharma');
        const teacherEmpId = teacherObj ? teacherObj.empId : teacherEntity;
        const teacherOccs = dayOccs.filter(function(o) { return o.teacherId === teacherEntity; });
        rowsToRender.push({
          label: teacherName + '<br><small style="color:var(--text-muted); font-weight:normal;">' + teacherEmpId + '</small>',
          occurrences: teacherOccs
        });
      } else {
        if (adminGroupBy === 'section') {
          let sections = currentState.sections || [];
          if (adminFilterVal !== 'all') {
            sections = sections.filter(function(s) { return s.id === adminFilterVal; });
          }
          sections.forEach(function(sec) {
            const secOccs = dayOccs.filter(function(o) {
              if (o.targetType === 'section' && o.targetId === sec.id) return true;
              if (o.targetType === 'batch') {
                const b = batchesMap.get(o.targetId);
                return b && b.sectionId === sec.id;
              }
              return false;
            });
            rowsToRender.push({
              label: sec.name + '<br><small style="color:var(--text-muted); font-weight:normal;">' + sec.id + '</small>',
              occurrences: secOccs
            });
          });
        } else if (adminGroupBy === 'room') {
          let rooms = currentState.rooms || [];
          if (adminFilterVal !== 'all') {
            rooms = rooms.filter(function(r) { return r.id === adminFilterVal; });
          }
          rooms.forEach(function(r) {
            const roomOccs = dayOccs.filter(function(o) { return o.roomId === r.id; });
            rowsToRender.push({
              label: 'Room ' + r.roomNumber + '<br><small style="color:var(--text-muted); font-weight:normal;">' + r.building + ' (Fl ' + r.floor + ')</small>',
              occurrences: roomOccs
            });
          });
        } else if (adminGroupBy === 'teacher') {
          let teachers = currentState.teachers || [];
          if (adminFilterVal !== 'all') {
            teachers = teachers.filter(function(t) { return t.id === adminFilterVal; });
          }
          teachers.forEach(function(t) {
            const teacherOccs = dayOccs.filter(function(o) { return o.teacherId === t.id; });
            rowsToRender.push({
              label: t.name + '<br><small style="color:var(--text-muted); font-weight:normal;">' + t.empId + '</small>',
              occurrences: teacherOccs
            });
          });
        }
      }

      let html = '<table class="timetable-grid"><thead><tr>';
      html += '<th class="col-track">Cohort / Track</th>';
      PERIODS.forEach(function(p) {
        const thClass = p.isLunch ? 'col-period col-lunch' : 'col-period';
        html += '<th class="' + thClass + '">' + p.label + '<span class="period-time">' + p.time + '</span></th>';
      });
      html += '</tr></thead><tbody>';

      if (rowsToRender.length === 0) {
        html += '<tr><td colspan="9" style="text-align:center; padding:24px; color:var(--text-muted);">No tracks matching the current filter.</td></tr>';
      }

      rowsToRender.forEach(function(row) {
        html += '<tr>';
        html += '<td class="cell-track">' + row.label + '</td>';

        let slot = 1;
        while (slot <= 8) {
          if (slot === 4) {
            html += '<td class="slot-lunch"><strong style="color:#fbbf24;">🍱 Lunch Break</strong><div style="font-size:10px; color:#f59e0b; margin-top:2px;">Non-teaching interval (DEC-04)</div></td>';
            slot++;
            continue;
          }

          const slotOccs = row.occurrences.filter(function(o) { return o.startSlot === slot; });

          if (slotOccs.length === 0) {
            html += '<td class="slot-empty">';
            html += '<span style="font-size:11px;">Free Slot</span>';
            if (currentRole === 'teacher') {
              html += '<br><button class="btn-book-free" data-slot="' + slot + '" onclick="quickBookTeacherSlot(parseInt(this.dataset.slot))">+ Book Extra</button>';
            }
            html += '</td>';
            slot++;
          } else {
            const isTwoSlotLab = slotOccs.some(function(o) { return o.duration === 2 || o.activityType === 'P'; });
            const colspan = isTwoSlotLab ? ' colspan="2"' : '';
            const cellClass = isTwoSlotLab ? 'slot-lab-cell' : '';

            html += '<td' + colspan + ' class="' + cellClass + '">';
            
            const cancelledInSlot = slotOccs.filter(function(o) { return o.status === 'cancelled'; });
            const activeInSlot = slotOccs.filter(function(o) { return o.status !== 'cancelled'; });

            if (activeInSlot.length > 0) {
              activeInSlot.forEach(function(o) {
                html += renderOccurrenceCard(o, cancelledInSlot.length > 0 ? cancelledInSlot[0] : null, roomsMap, teachersMap, coursesMap, sectionsMap, batchesMap, offeringsMap);
              });
            } else {
              cancelledInSlot.forEach(function(o) {
                html += renderCancelledCard(o, roomsMap, teachersMap, coursesMap, sectionsMap, batchesMap, offeringsMap);
              });
            }

            html += '</td>';
            slot += isTwoSlotLab ? 2 : 1;
          }
        }

        html += '</tr>';
      });

      html += '</tbody></table>';
      container.innerHTML = html;
    }

    // Helper: Render active scheduled occurrence card
    function renderOccurrenceCard(o, priorCancelled, roomsMap, teachersMap, coursesMap, sectionsMap, batchesMap, offeringsMap) {
      const offering = offeringsMap.get(o.courseOfferingId);
      const course = offering ? coursesMap.get(offering.courseId) : coursesMap.get('c-ds');
      const courseCode = course ? course.code : 'CS201';
      const courseName = course ? course.name : 'Data Structures';

      const teacher = teachersMap.get(o.teacherId);
      const teacherName = teacher ? teacher.name : o.teacherId;

      const room = roomsMap.get(o.roomId) || { roomNumber: o.roomId, building: 'Engineering Block', floor: 1 };
      
      let cohortName = o.targetId;
      if (o.targetType === 'section') {
        const s = sectionsMap.get(o.targetId);
        if (s) cohortName = s.name;
      } else if (o.targetType === 'batch') {
        const b = batchesMap.get(o.targetId);
        if (b) cohortName = b.name;
      }

      const isLab = o.duration === 2 || o.activityType === 'P';
      const cardClass = isLab ? 'slot-card slot-lab' : 'slot-card slot-scheduled';
      const actBadgeClass = isLab ? 'badge-lab' : (o.activityType === 'T' ? 'badge-tut' : 'badge-lec');
      const actBadgeText = isLab ? '🔬 Practical (P) • 2 Slots' : (o.activityType === 'T' ? '📙 Tutorial (T) • 1h' : '📘 Lecture (L) • 1h');

      let cardHtml = '<div class="' + cardClass + '">';

      if (priorCancelled) {
        cardHtml += '<div class="card-replace-notice">🔄 Replacement Class<br><span style="font-weight:normal; font-size:9px; color:#cbd5e1;">Replaces: ' + (priorCancelled.cancellationReason || 'Prior cancelled session') + '</span></div>';
      }

      cardHtml += '<div class="card-badges">';
      cardHtml += '<span class="badge-act ' + actBadgeClass + '">' + actBadgeText + '</span>';
      if (o.isExtraClass) {
        cardHtml += '<span class="badge-act badge-extra">⚡ Extra Class</span>';
      }
      cardHtml += '</div>';

      cardHtml += '<div class="card-title">' + courseCode + ': ' + courseName + '</div>';
      cardHtml += '<div class="card-meta">👨‍🏫 <strong>' + teacherName + '</strong></div>';
      cardHtml += '<div class="card-meta">🏛️ <strong>Room ' + room.roomNumber + '</strong> • ' + room.building + ' (Fl ' + room.floor + ')</div>';
      cardHtml += '<div class="card-meta">👥 Cohort: <strong>' + cohortName + '</strong></div>';

      if (currentRole === 'teacher' || currentRole === 'admin') {
        cardHtml += '<div class="card-actions">';
        cardHtml += '<button class="btn-xs btn-xs-danger" data-id="' + o.id + '" onclick="handleCancel(this)">Cancel</button>';
        cardHtml += '<button class="btn-xs btn-xs-sec" data-id="' + o.id + '" onclick="handleReschedule(this)">Reschedule</button>';
        cardHtml += '</div>';
      }

      cardHtml += '</div>';
      return cardHtml;
    }

    // Helper: Render cancelled occurrence card (D17)
    function renderCancelledCard(o, roomsMap, teachersMap, coursesMap, sectionsMap, batchesMap, offeringsMap) {
      const offering = offeringsMap.get(o.courseOfferingId);
      const course = offering ? coursesMap.get(offering.courseId) : coursesMap.get('c-ds');
      const courseCode = course ? course.code : 'CS201';
      const courseName = course ? course.name : 'Data Structures';

      const teacher = teachersMap.get(o.teacherId);
      const teacherName = teacher ? teacher.name : o.teacherId;

      const room = roomsMap.get(o.roomId) || { roomNumber: o.roomId, building: 'Engineering Block', floor: 1 };

      let html = '<div class="slot-card slot-cancelled">';
      html += '<div class="card-badges"><span class="badge-act badge-cancel">❌ CANCELLED</span></div>';
      html += '<div class="card-title" style="text-decoration:line-through; opacity:0.85;">' + courseCode + ': ' + courseName + '</div>';
      html += '<div class="card-cancel-reason">Reason: ' + (o.cancellationReason || 'Cancellation confirmed by admin/teacher') + '</div>';
      html += '<div class="card-meta" style="margin-top:3px;">Originally: Room ' + room.roomNumber + ', ' + room.building + ' (Fl ' + room.floor + ')</div>';
      html += '<div class="card-meta">Teacher: ' + teacherName + '</div>';
      html += '</div>';
      return html;
    }

    function renderVersions() {
      const versions = currentState.timetableVersions || [];
      let html = '<ul>';
      if (versions.length === 0) html += '<li>No draft or published versions yet.</li>';
      versions.forEach(function(v) {
        html += '<li style="margin-bottom:8px;">Version ' + v.versionNumber + ' (' + v.termId + ') — <span class="status-tag status-' + v.status + '">' + v.status + '</span>';
        if (v.status === 'draft' && currentRole === 'admin') {
          html += ' <button style="padding:3px 8px; font-size:12px;" data-id="' + v.id + '" onclick="handlePublish(this)">Publish Version</button>';
        } else if (v.status === 'superseded' && currentRole === 'admin') {
          html += ' <button class="warning" style="padding:3px 8px; font-size:12px;" data-id="' + v.id + '" onclick="handleRestore(this)">Restore Version</button>';
        }
        html += '</li>';
      });
      html += '</ul>';
      const list = document.getElementById('versionsList');
      if (list) list.innerHTML = html;
    }

    function renderUnavailability() {
      const list = document.getElementById('unavailabilityList');
      if (!list) return;
      const reqs = (currentState.auditEvents || []).filter(function(a) { return a.action === 'SUBMIT_UNAVAILABILITY'; });
      list.innerHTML = reqs.length === 0 ? '<p>No pending unavailability requests.</p>' : '<p>' + reqs.length + ' request(s) recorded in audit log.</p>';
    }

    async function renderStudentInbox() {
      const studentId = (currentUser && currentUser.role === 'student' && currentUser.entityId) ? currentUser.entityId : 'stud-1';
      try {
        const data = await api('/api/notifications/inbox?studentId=' + encodeURIComponent(studentId));
        const inboxEl = document.getElementById('studentInbox');
        if (!inboxEl) return;
        if (!data.notices || data.notices.length === 0) {
          inboxEl.innerHTML = '<p style="color:var(--text-muted); font-size:13px;">No notifications yet.</p>';
          return;
        }
        let html = '<ul style="margin:0; padding-left:18px;">';
        data.notices.forEach(function(n) {
          html += '<li style="margin-bottom:8px;"><strong>' + n.title + '</strong>: ' + n.message + ' <br><small style="color:var(--text-muted);">' + n.createdAt + '</small></li>';
        });
        html += '</ul>';
        inboxEl.innerHTML = html;
      } catch (err) {
        const inboxEl = document.getElementById('studentInbox');
        if (inboxEl) inboxEl.innerHTML = '<p style="color:var(--danger); font-size:12px;">Failed to load inbox: ' + err.message + '</p>';
      }
    }

    // ------------------------------------------------------------------------
    // ACTION HANDLERS (Safe Data Attribute Binding)
    // ------------------------------------------------------------------------
    function handleCancel(btn) {
      const id = btn.getAttribute('data-id');
      cancelOcc(id);
    }

    function handleReschedule(btn) {
      const id = btn.getAttribute('data-id');
      promptReschedule(id);
    }

    function handlePublish(btn) {
      const id = btn.getAttribute('data-id');
      publishVersion(id);
    }

    function handleRestore(btn) {
      const id = btn.getAttribute('data-id');
      restoreVersion(id);
    }

    function handleBookExtra(btn) {
      const slot = parseInt(btn.getAttribute('data-slot'));
      const roomId = btn.getAttribute('data-room');
      bookExtraSlot(slot, roomId);
    }

    // ------------------------------------------------------------------------
    // API OPERATIONS & ACTIONS
    // ------------------------------------------------------------------------
    async function cancelOcc(id) {
      const reason = prompt('Optional cancellation reason (recorded in audit log & student notifications):');
      try {
        await api('/api/classes/occurrences/' + id + '/cancel', {
          method: 'POST',
          body: JSON.stringify({ reason })
        });
        showMsg('Class occurrence cancelled successfully.');
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function promptReschedule(id) {
      const activeDay = DAYS[activeDayIndex];
      const date = prompt('New date (YYYY-MM-DD):', activeDay.date);
      const slot = prompt('New slot (1-8, Slot 4 is lunch):', '3');
      if (!date || !slot) return;
      try {
        await api('/api/classes/occurrences/' + id + '/reschedule', {
          method: 'POST',
          body: JSON.stringify({ date, dayOfWeek: activeDay.dayOfWeek, startSlot: parseInt(slot) })
        });
        showMsg('Occurrence rescheduled atomically.');
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    function quickBookTeacherSlot(slot) {
      const activeDay = DAYS[activeDayIndex];
      const dInput = document.getElementById('extraDate');
      const dayInput = document.getElementById('extraDay');
      if (dInput) dInput.value = activeDay.date;
      if (dayInput) dayInput.value = activeDay.dayOfWeek;
      selectRole('teacher');
      queryFreeSlots();
      showMsg('Checking available rooms for Slot ' + slot + ' on ' + activeDay.name + '...');
    }

    async function loadDemoSchedule() {
      try {
        showMsg('Loading & publishing demo timetable...');
        const res = await api('/api/demo/seed-and-publish', { method: 'POST' });
        showMsg('Demo timetable published successfully! ' + res.instantiatedOccurrences + ' occurrences created across term calendar.');
        await loadState();
      } catch (err) {
        showMsg('Demo loading error: ' + err.message, true);
      }
    }

    async function resetToSimpleMockData() {
      try {
        showMsg('Resetting university data to simple, clean mock data...');
        const res = await api('/api/demo/reset-to-simple', { method: 'POST' });
        showMsg(res.message);
        await loadState();
      } catch (err) {
        showMsg('Reset error: ' + err.message, true);
      }
    }

    async function requestGeneration() {
      try {
        const res = await api('/api/generation/request', {
          method: 'POST',
          body: JSON.stringify({ termIds: ['term-3'] })
        });
        const statusEl = document.getElementById('generationStatus');
        if (statusEl) {
          statusEl.innerHTML = '<p><strong>Status:</strong> ' + res.status + '<br>' + res.message + '</p>';
        }
        showMsg(res.message);
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    function downloadPackage() {
      window.location.href = '/api/generation/package/download';
    }

    async function uploadDraft() {
      const draftEl = document.getElementById('draftJsonInput');
      const overrideEl = document.getElementById('overrideStaleCheck');
      const reasonEl = document.getElementById('staleReasonInput');
      
      const text = draftEl ? draftEl.value.trim() : '';
      const allowOverride = overrideEl ? overrideEl.checked : false;
      const reason = reasonEl ? reasonEl.value.trim() : '';
      
      if (!text) { showMsg('Please paste draft JSON.', true); return; }
      try {
        const draft = JSON.parse(text);
        const res = await api('/api/generation/draft/upload', {
          method: 'POST',
          body: JSON.stringify({ draft, allowStaleOverride: allowOverride, staleOverrideReason: reason })
        });
        showMsg('Draft imported successfully as ' + res.version.status + ' (' + res.classCount + ' classes).');
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function publishVersion(id) {
      try {
        const res = await api('/api/timetable/versions/' + id + '/publish', { method: 'POST' });
        showMsg('Timetable version published! ' + res.instantiatedOccurrences + ' dated occurrences instantiated.');
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function restoreVersion(id) {
      try {
        await api('/api/timetable/versions/' + id + '/restore', { method: 'POST' });
        showMsg('Prior timetable version restored successfully.');
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function queryFreeSlots() {
      const dateEl = document.getElementById('extraDate');
      const dayEl = document.getElementById('extraDay');
      const actEl = document.getElementById('extraActivity');
      
      const date = dateEl ? dateEl.value : '2026-09-08';
      const day = dayEl ? dayEl.value : '2';
      const act = actEl ? actEl.value : 'L';
      
      try {
        const res = await api('/api/classes/extra/available-slots?date=' + date + '&dayOfWeek=' + day + '&activityType=' + act + '&teacherId=t-1&targetType=section&targetId=sec-A');
        let html = '<h4>Eligible Slots:</h4><ul>';
        if (res.slots.length === 0) html += '<li>No free slots found.</li>';
        res.slots.forEach(function(s) {
          html += '<li style="margin-bottom:6px;">Slot ' + s.slotIndex + (s.isCancellationFreed ? ' <strong style="color:#34d399;">[Cancellation-Freed]</strong>' : '') + ' — Rooms: ' + s.eligibleRooms.map(function(r) { return r.roomNumber; }).join(', ') + ' <button style="padding:2px 8px; font-size:11px;" data-slot="' + s.slotIndex + '" data-room="' + s.eligibleRooms[0].id + '" onclick="handleBookExtra(this)">Book Room ' + s.eligibleRooms[0].roomNumber + '</button></li>';
        });
        html += '</ul>';
        const resultsEl = document.getElementById('slotsResults');
        if (resultsEl) resultsEl.innerHTML = html;
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function bookExtraSlot(slot, roomId) {
      const dateEl = document.getElementById('extraDate');
      const dayEl = document.getElementById('extraDay');
      const actEl = document.getElementById('extraActivity');
      
      const date = dateEl ? dateEl.value : '2026-09-08';
      const day = dayEl ? dayEl.value : '2';
      const act = actEl ? actEl.value : 'L';

      try {
        await api('/api/classes/extra/book', {
          method: 'POST',
          body: JSON.stringify({
            date,
            dayOfWeek: day,
            startSlot: slot,
            activityType: act,
            courseOfferingId: 'off-ds-lec',
            termId: 'term-3',
            roomId,
            targetType: 'section',
            targetId: 'sec-A'
          })
        });
        showMsg('Extra class booked successfully.');
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function submitUnavailability() {
      const date = document.getElementById('unavailDate').value;
      const startSlot = document.getElementById('unavailStart').value;
      const endSlot = document.getElementById('unavailEnd').value;
      const reason = document.getElementById('unavailReason').value;
      try {
        await api('/api/teachers/unavailability/request', {
          method: 'POST',
          body: JSON.stringify({ date, startSlot, endSlot, reason })
        });
        showMsg('Unavailability request submitted (pending confirmation).');
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function transferStudent() {
      const studentId = document.getElementById('transferStudentId').value;
      const newGroupId = document.getElementById('transferGroupId').value;
      const effectiveDate = document.getElementById('transferDate').value;
      try {
        await api('/api/students/transfer', {
          method: 'POST',
          body: JSON.stringify({ studentId, newGroupId, newGroupType: 'section', effectiveDate })
        });
        showMsg('Student transfer executed with effective date ' + effectiveDate);
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    // ------------------------------------------------------------------------
    // MODULAR ADMINISTRATIVE MANAGEMENT (Sub-Tabs & Building Blocks)
    // ------------------------------------------------------------------------
    let currentAdminTab = 'hierarchy';
    function switchAdminTab(tab) {
      currentAdminTab = tab;
      const tabs = ['hierarchy', 'courses', 'venues', 'solver', 'operations', 'users'];
      tabs.forEach(function(t) {
        const btn = document.getElementById('tabBtn' + t.charAt(0).toUpperCase() + t.slice(1));
        const pane = document.getElementById('adminTab' + t.charAt(0).toUpperCase() + t.slice(1));
        if (btn) btn.classList.toggle('active', t === tab);
        if (pane) pane.classList.toggle('active', t === tab);
      });
      if (tab === 'solver') {
        updateAssemblyScope();
      }
    }

    // 1. Academic Hierarchy (Years/Terms -> Sections -> Batches)
    function renderAcademicHierarchy() {
      const terms = currentState.academicTerms || [];
      const sections = currentState.sections || [];
      const batches = currentState.batches || [];

      // Terms Table & Select options
      let termsHtml = '';
      let termOptionsHtml = '';
      terms.forEach(function(t) {
        termsHtml += '<tr><td><code>' + t.id + '</code></td><td>' + t.yearLabel + '</td><td>Sem ' + t.semesterNumber + '</td><td><span class="status-tag status-scheduled">' + t.cycle + '</span></td><td>' + t.startDate + ' to ' + t.endDate + '</td><td><span class="status-tag status-' + (t.status === 'active' ? 'scheduled' : 'draft') + '">' + t.status + '</span></td></tr>';
        termOptionsHtml += '<option value="' + t.id + '">' + t.yearLabel + ' — Sem ' + t.semesterNumber + ' (' + t.id + ')</option>';
      });
      const tBody = document.getElementById('termsTableBody');
      if (tBody) tBody.innerHTML = termsHtml || '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No terms configured yet.</td></tr>';

      const secTermSel = document.getElementById('secTermSelect');
      if (secTermSel) secTermSel.innerHTML = termOptionsHtml;
      const courseTermSel = document.getElementById('courseTermSelect');
      if (courseTermSel) courseTermSel.innerHTML = termOptionsHtml;

      // Sections Table & Batch parent options
      let secsHtml = '';
      let secOptionsHtml = '';
      sections.forEach(function(s) {
        const term = terms.find(function(t) { return t.id === s.termId; });
        const termLabel = term ? (term.yearLabel + ' Sem ' + term.semesterNumber) : s.termId;
        secsHtml += '<tr><td><code>' + s.id + '</code></td><td>' + termLabel + '</td><td><strong>' + s.name + '</strong></td><td>' + s.expectedCount + ' students</td><td><span class="status-tag status-scheduled">Active</span></td></tr>';
        secOptionsHtml += '<option value="' + s.id + '">' + s.name + ' (' + termLabel + ')</option>';
      });
      const sBody = document.getElementById('sectionsTableBody');
      if (sBody) sBody.innerHTML = secsHtml || '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No sections configured yet.</td></tr>';

      const batchSecSel = document.getElementById('batchSecSelect');
      if (batchSecSel) batchSecSel.innerHTML = secOptionsHtml;

      // Batches Table
      let batchesHtml = '';
      batches.forEach(function(b) {
        const parentSec = sections.find(function(s) { return s.id === b.sectionId; });
        const parentName = parentSec ? parentSec.name : b.sectionId;
        batchesHtml += '<tr><td><code>' + b.id + '</code></td><td>' + parentName + '</td><td><strong>' + b.name + '</strong></td><td>' + b.expectedCount + ' students</td></tr>';
      });
      const bBody = document.getElementById('batchesTableBody');
      if (bBody) bBody.innerHTML = batchesHtml || '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No batches configured yet.</td></tr>';
    }

    async function saveAcademicTerm() {
      const yearLabel = document.getElementById('termYearLabel').value.trim();
      const semesterNumber = parseInt(document.getElementById('termSemesterNum').value);
      const cycle = document.getElementById('termCycle').value;
      const startDate = document.getElementById('termStartDate').value;
      const endDate = document.getElementById('termEndDate').value;
      const status = document.getElementById('termStatus').value;

      try {
        await api('/api/academic/terms', {
          method: 'POST',
          body: JSON.stringify({ yearLabel, semesterNumber, cycle, startDate, endDate, status })
        });
        showMsg('Academic Term ' + yearLabel + ' (Sem ' + semesterNumber + ') saved successfully.');
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function createSection() {
      const termId = document.getElementById('secTermSelect').value;
      const name = document.getElementById('secNameInput').value.trim();
      const expectedCount = parseInt(document.getElementById('secCohortSizeInput').value);

      if (!name) { showMsg('Please enter a Section name.', true); return; }
      try {
        await api('/api/academic/sections', {
          method: 'POST',
          body: JSON.stringify({ termId, name, expectedCount })
        });
        showMsg('Section ' + name + ' created successfully.');
        document.getElementById('secNameInput').value = '';
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function createBatch() {
      const sectionId = document.getElementById('batchSecSelect').value;
      const name = document.getElementById('batchNameInput').value.trim();
      const expectedCount = parseInt(document.getElementById('batchCountInput').value);

      if (!name) { showMsg('Please enter a Batch name.', true); return; }
      try {
        await api('/api/academic/batches', {
          method: 'POST',
          body: JSON.stringify({ sectionId, name, expectedCount })
        });
        showMsg('Sub-Batch ' + name + ' created successfully.');
        document.getElementById('batchNameInput').value = '';
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    // 2. Course Catalog & Offerings (with D07/D44 Guardrail)
    function validateCourseHours() {
      const pHours = parseInt(document.getElementById('coursePHours').value || '0');
      const badge = document.getElementById('oddHoursErrorBadge');
      const btn = document.getElementById('btnSaveCourse');

      if (pHours % 2 !== 0) {
        if (badge) badge.classList.add('visible');
        if (btn) btn.disabled = true;
      } else {
        if (badge) badge.classList.remove('visible');
        if (btn) btn.disabled = false;
      }
    }

    async function saveCourse() {
      const code = document.getElementById('courseCodeInput').value.trim();
      const name = document.getElementById('courseNameInput').value.trim();
      const termId = document.getElementById('courseTermSelect').value;
      const department = document.getElementById('courseDeptInput').value.trim();
      const lectureHours = parseInt(document.getElementById('courseLHours').value || '0');
      const tutorialHours = parseInt(document.getElementById('courseTHours').value || '0');
      const practicalHours = parseInt(document.getElementById('coursePHours').value || '0');
      const requiredRoomType = document.getElementById('courseVenueType').value;

      if (!code || !name) { showMsg('Please provide course code and title.', true); return; }
      if (practicalHours % 2 !== 0) {
        showMsg('ERR_ODD_P_HOURS: Practical hours must be an even integer (2 consecutive slots per session).', true);
        return;
      }

      try {
        await api('/api/catalog/courses', {
          method: 'POST',
          body: JSON.stringify({ code, name, termId, department, lectureHours, tutorialHours, practicalHours, requiredRoomType })
        });
        showMsg('Course ' + code + ' (' + name + ') registered successfully.');
        document.getElementById('courseCodeInput').value = '';
        document.getElementById('courseNameInput').value = '';
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    function renderCoursesAndOfferings() {
      const courses = currentState.courses || [];
      const offerings = currentState.courseOfferings || [];
      const teachers = currentState.teachers || [];
      const sections = currentState.sections || [];
      const batches = currentState.batches || [];
      const electives = currentState.electiveGroups || [];

      // Courses Table & Select
      let cHtml = '';
      let courseOptionsHtml = '';
      courses.forEach(function(c) {
        const venueBadge = c.requiredRoomType === 'P' ? '<span class="badge-act badge-lab">Lab (P)</span>' : '<span class="badge-act badge-lec">Classroom (LT)</span>';
        cHtml += '<tr><td><strong>' + c.code + '</strong></td><td>' + c.name + '</td><td>' + c.termId + '</td><td>' + (c.department || '—') + '</td><td>' + c.lectureHours + 'L / ' + c.tutorialHours + 'T / ' + c.practicalHours + 'P</td><td>' + venueBadge + '</td></tr>';
        courseOptionsHtml += '<option value="' + c.id + '">' + c.code + ': ' + c.name + ' (' + c.termId + ')</option>';
      });
      const cBody = document.getElementById('coursesTableBody');
      if (cBody) cBody.innerHTML = cHtml || '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No courses defined yet.</td></tr>';

      const offCourseSel = document.getElementById('offeringCourseSelect');
      if (offCourseSel) offCourseSel.innerHTML = courseOptionsHtml;

      // Teachers Select
      let teacherOptionsHtml = '';
      teachers.forEach(function(t) {
        teacherOptionsHtml += '<option value="' + t.id + '">' + t.name + ' (' + t.empId + ')</option>';
      });
      const offTeacherSel = document.getElementById('offeringTeacherSelect');
      if (offTeacherSel) offTeacherSel.innerHTML = teacherOptionsHtml;

      updateOfferingTargetOptions();

      // Offerings Table
      let offHtml = '';
      offerings.forEach(function(o) {
        const c = courses.find(function(c) { return c.id === o.courseId; });
        const cLabel = c ? (c.code + ' — ' + c.name) : o.courseId;
        const t = teachers.find(function(t) { return t.id === o.teacherId; });
        const tName = t ? t.name : o.teacherId;

        let targetLabel = o.targetId;
        if (o.targetType === 'section') {
          const s = sections.find(function(s) { return s.id === o.targetId; });
          if (s) targetLabel = 'Section ' + s.name;
        } else if (o.targetType === 'batch') {
          const b = batches.find(function(b) { return b.id === o.targetId; });
          if (b) targetLabel = 'Batch ' + b.name;
        } else if (o.targetType === 'elective_group') {
          const e = electives.find(function(e) { return e.id === o.targetId; });
          if (e) targetLabel = 'Elective: ' + e.name;
        }

        let compBadge = '<span class="status-tag status-scheduled">All (L+T+P)</span>';
        if (o.component === 'L') compBadge = '<span class="badge-act badge-lec">Lecture (L)</span>';
        else if (o.component === 'T') compBadge = '<span class="status-tag status-scheduled" style="background:rgba(56,189,248,0.2);color:#38bdf8;">Tutorial (T)</span>';
        else if (o.component === 'P') compBadge = '<span class="badge-act badge-lab">Practical (P)</span>';

        offHtml += '<tr><td><code>' + o.id + '</code></td><td>' + cLabel + '</td><td>' + tName + '</td><td>' + compBadge + '</td><td>' + targetLabel + '</td><td>' + o.termId + '</td></tr>';
      });
      const oBody = document.getElementById('offeringsTableBody');
      if (oBody) oBody.innerHTML = offHtml || '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No offerings configured yet.</td></tr>';
    }

    function updateOfferingTargetOptions() {
      const typeSel = document.getElementById('offeringTargetType');
      const targetSel = document.getElementById('offeringTargetId');
      if (!typeSel || !targetSel) return;

      const type = typeSel.value;
      let html = '';
      if (type === 'section') {
        (currentState.sections || []).forEach(function(s) {
          html += '<option value="' + s.id + '">Section ' + s.name + ' (' + s.termId + ', ' + s.expectedCount + ' students)</option>';
        });
      } else if (type === 'batch') {
        (currentState.batches || []).forEach(function(b) {
          html += '<option value="' + b.id + '">Batch ' + b.name + ' (sec: ' + b.sectionId + ', ' + b.expectedCount + ' students)</option>';
        });
      } else if (type === 'elective_group') {
        (currentState.electiveGroups || []).forEach(function(e) {
          html += '<option value="' + e.id + '">Elective: ' + e.name + ' (' + e.termId + ')</option>';
        });
      }
      targetSel.innerHTML = html;
    }

    async function createOffering() {
      const courseId = document.getElementById('offeringCourseSelect').value;
      const teacherId = document.getElementById('offeringTeacherSelect').value;
      const targetType = document.getElementById('offeringTargetType').value;
      const targetId = document.getElementById('offeringTargetId').value;
      const componentEl = document.getElementById('offeringComponent');
      const component = componentEl ? componentEl.value : '';

      try {
        await api('/api/catalog/offerings', {
          method: 'POST',
          body: JSON.stringify({
            courseId,
            teacherId,
            targetType,
            targetId,
            component: component || undefined
          })
        });
        showMsg('Course offering created successfully.');
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    // 3. Venues & Faculty (Rooms, Teachers, Weekly Unavailability)
    async function saveRoom() {
      const roomNumber = document.getElementById('roomNumberInput').value.trim();
      const building = document.getElementById('roomBuildingInput').value.trim();
      const floor = parseInt(document.getElementById('roomFloorInput').value || '1');
      const capacity = parseInt(document.getElementById('roomCapacityInput').value || '60');
      const roomType = document.getElementById('roomTypeInput').value;

      if (!roomNumber) { showMsg('Please enter room number.', true); return; }
      try {
        await api('/api/resources/rooms', {
          method: 'POST',
          body: JSON.stringify({ roomNumber, building, floor, capacity, roomType })
        });
        showMsg('Room ' + roomNumber + ' registered successfully.');
        document.getElementById('roomNumberInput').value = '';
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function saveTeacher() {
      const empId = document.getElementById('teacherEmpIdInput').value.trim();
      const name = document.getElementById('teacherNameInput').value.trim();
      const email = document.getElementById('teacherEmailInput').value.trim();
      const department = document.getElementById('teacherDeptInput').value.trim();

      if (!empId || !name || !email) { showMsg('Please fill teacher Employee ID, Name, and Email.', true); return; }
      try {
        await api('/api/resources/teachers', {
          method: 'POST',
          body: JSON.stringify({ empId, name, email, department })
        });
        showMsg('Faculty member ' + name + ' registered successfully.');
        document.getElementById('teacherEmpIdInput').value = '';
        document.getElementById('teacherNameInput').value = '';
        document.getElementById('teacherEmailInput').value = '';
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    function renderVenuesAndFaculty() {
      const rooms = currentState.rooms || [];
      const teachers = currentState.teachers || [];

      // Rooms Table
      let rHtml = '';
      rooms.forEach(function(r) {
        const typeBadge = r.roomType === 'P' ? '<span class="badge-act badge-lab">Lab (P)</span>' : '<span class="badge-act badge-lec">Lecture (LT)</span>';
        rHtml += '<tr><td><strong>Room ' + r.roomNumber + '</strong></td><td>' + r.building + '</td><td>Fl ' + r.floor + '</td><td>' + r.capacity + ' seats</td><td>' + typeBadge + '</td><td><span class="status-tag status-scheduled">Active</span></td></tr>';
      });
      const rBody = document.getElementById('roomsTableBody');
      if (rBody) rBody.innerHTML = rHtml || '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No rooms configured yet.</td></tr>';

      // Teachers Table & Select
      let tHtml = '';
      let tOptionsHtml = '';
      teachers.forEach(function(t) {
        tHtml += '<tr><td><code>' + t.empId + '</code></td><td><strong>' + t.name + '</strong></td><td>' + t.email + '</td><td>' + (t.department || '—') + '</td><td><span class="status-tag status-scheduled">Active</span></td></tr>';
        tOptionsHtml += '<option value="' + t.id + '">' + t.name + ' (' + t.empId + ')</option>';
      });
      const tBody = document.getElementById('teachersTableBody');
      if (tBody) tBody.innerHTML = tHtml || '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No faculty registered yet.</td></tr>';

      const availTeacherSel = document.getElementById('availTeacherSelect');
      if (availTeacherSel) {
        const prevVal = availTeacherSel.value;
        availTeacherSel.innerHTML = tOptionsHtml;
        if (prevVal) availTeacherSel.value = prevVal;
      }

      renderTeacherAvailabilityMatrix();
    }

    function renderTeacherAvailabilityMatrix() {
      const container = document.getElementById('unavailabilityMatrixContainer');
      const select = document.getElementById('availTeacherSelect');
      if (!container || !select) return;

      const teacherId = select.value;
      if (!teacherId) {
        container.innerHTML = '<p style="color:var(--text-muted);">Please select a faculty member.</p>';
        return;
      }

      const unavailSet = new Set();
      (currentState.teacherAvailabilities || []).forEach(function(ta) {
        if (ta.teacherId === teacherId && ta.isAvailable === false) {
          unavailSet.add(ta.dayOfWeek + '-' + ta.slotIndex);
        }
      });

      let html = '<table class="data-table" style="min-width:600px;"><thead><tr><th>Day</th>';
      PERIODS.forEach(function(p) {
        html += '<th style="text-align:center;">' + p.label + (p.isLunch ? '<br><small>(Lunch)</small>' : '') + '</th>';
      });
      html += '</tr></thead><tbody>';

      DAYS.forEach(function(d) {
        html += '<tr><td><strong>' + d.name + '</strong></td>';
        PERIODS.forEach(function(p) {
          if (p.isLunch) {
            html += '<td style="text-align:center; background:rgba(245,158,11,0.06); color:#fbbf24; font-size:11px;">Break</td>';
          } else {
            const isUnavail = unavailSet.has(d.dayOfWeek + '-' + p.index);
            const btnClass = isUnavail ? 'toggle-slot-btn unavailable' : 'toggle-slot-btn';
            const btnText = isUnavail ? '⛔ Blocked' : '✓ Open';
            html += '<td style="text-align:center;"><button class="' + btnClass + '" data-teacher="' + teacherId + '" data-day="' + d.dayOfWeek + '" data-slot="' + p.index + '" data-unavail="' + (isUnavail ? '1' : '0') + '" onclick="handleToggleTeacherSlot(this)">' + btnText + '</button></td>';
          }
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
      container.innerHTML = html;
    }

    async function handleToggleTeacherSlot(btn) {
      const teacherId = btn.getAttribute('data-teacher');
      const dayOfWeek = parseInt(btn.getAttribute('data-day'));
      const slotIndex = parseInt(btn.getAttribute('data-slot'));
      const currentlyUnavail = btn.getAttribute('data-unavail') === '1';

      try {
        await api('/api/resources/teachers/' + teacherId + '/availability', {
          method: 'POST',
          body: JSON.stringify({
            dayOfWeek,
            slotIndex,
            isAvailable: currentlyUnavail
          })
        });
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    // 4. Solver Input & Assembly Console
    let latestCompiledPackage = null;
    let parsedDraftPayload = null;

    function renderSolverAssemblyConsole() {
      const terms = currentState.academicTerms || [];
      const container = document.getElementById('assemblyTermCheckboxes');
      if (!container) return;

      let html = '';
      terms.forEach(function(t, idx) {
        const checked = t.status === 'active' || idx === 0 ? 'checked' : '';
        html += '<label style="font-size:13px; font-weight:600; cursor:pointer;"><input type="checkbox" class="assembly-term-cb" value="' + t.id + '" ' + checked + ' onchange="updateAssemblyScope()" style="width:auto; margin-right:6px;"> ' + t.yearLabel + ' — Semester ' + t.semesterNumber + ' (' + t.id + ')</label>';
      });
      container.innerHTML = html || '<span style="color:var(--text-muted);">No academic terms found. Create terms in Academic Hierarchy tab.</span>';

      updateAssemblyScope();
      renderStagedDraftsReview();
    }

    function getSelectedTermIds() {
      const cbs = document.querySelectorAll('.assembly-term-cb:checked');
      const ids = [];
      cbs.forEach(function(cb) { ids.push(cb.value); });
      return ids;
    }

    function updateAssemblyScope() {
      const selectedTermIds = new Set(getSelectedTermIds());
      const terms = currentState.academicTerms || [];
      const sections = currentState.sections || [];
      const batches = currentState.batches || [];
      const courses = currentState.courses || [];
      const offerings = currentState.courseOfferings || [];
      const rooms = currentState.rooms || [];
      const teachers = currentState.teachers || [];

      // Cohort nested tree (Term -> Sections -> Batches)
      let treeHtml = '';
      terms.filter(function(t) { return selectedTermIds.has(t.id); }).forEach(function(t) {
        treeHtml += '<div class="tree-term">📅 ' + t.yearLabel + ' — Sem ' + t.semesterNumber + '</div>';
        const termSecs = sections.filter(function(s) { return s.termId === t.id; });
        if (termSecs.length === 0) {
          treeHtml += '<div style="margin-left:20px; font-size:11px; color:var(--text-muted);">(No sections in this term)</div>';
        }
        termSecs.forEach(function(s) {
          treeHtml += '<div class="tree-sec"><label><input type="checkbox" class="assembly-sec-cb" value="' + s.id + '" checked onchange="calculatePreFlightFeasibility()" style="width:auto; margin-right:4px;"> <strong>' + s.name + '</strong> (' + s.expectedCount + ' students)</label></div>';
          const secBatches = batches.filter(function(b) { return b.sectionId === s.id; });
          secBatches.forEach(function(b) {
            treeHtml += '<div class="tree-batch"><label><input type="checkbox" class="assembly-batch-cb" value="' + b.id + '" checked style="width:auto; margin-right:4px;"> ↳ ' + b.name + ' (' + b.expectedCount + ' students)</label></div>';
          });
        });
      });
      const treeEl = document.getElementById('cohortNestedTree');
      if (treeEl) treeEl.innerHTML = treeHtml || '<span style="color:var(--text-muted); font-size:12px;">Select at least one academic term above.</span>';

      // Course Offerings
      let offHtml = '';
      offerings.filter(function(o) { return selectedTermIds.has(o.termId); }).forEach(function(o) {
        const c = courses.find(function(c) { return c.id === o.courseId; });
        const cLabel = c ? (c.code + ' (' + c.lectureHours + 'L/' + c.tutorialHours + 'T/' + c.practicalHours + 'P)') : o.courseId;
        const t = teachers.find(function(t) { return t.id === o.teacherId; });
        const tName = t ? t.name : o.teacherId;
        offHtml += '<div style="margin-bottom:6px; font-size:12px;"><label><input type="checkbox" class="assembly-off-cb" value="' + o.id + '" checked onchange="calculatePreFlightFeasibility()" style="width:auto; margin-right:6px;"> <strong>' + cLabel + '</strong><br><span style="color:var(--text-muted); margin-left:20px;">' + tName + ' • Target: ' + o.targetId + '</span></label></div>';
      });
      const offEl = document.getElementById('assemblyOfferingsList');
      if (offEl) offEl.innerHTML = offHtml || '<span style="color:var(--text-muted); font-size:12px;">No course offerings mapped to selected terms.</span>';

      // Venues
      let venuesHtml = '';
      rooms.forEach(function(r) {
        const badge = r.roomType === 'P' ? '<span class="badge-act badge-lab">Lab</span>' : '<span class="badge-act badge-lec">LT</span>';
        venuesHtml += '<div style="margin-bottom:6px; font-size:12px;"><label><input type="checkbox" class="assembly-room-cb" value="' + r.id + '" checked onchange="calculatePreFlightFeasibility()" style="width:auto; margin-right:6px;"> <strong>Room ' + r.roomNumber + '</strong> (' + r.building + ') ' + badge + ' <span style="color:var(--text-muted);">' + r.capacity + ' seats</span></label></div>';
      });
      const venuesEl = document.getElementById('assemblyVenuesList');
      if (venuesEl) venuesEl.innerHTML = venuesHtml || '<span style="color:var(--text-muted); font-size:12px;">No rooms registered.</span>';

      // Faculty
      let facHtml = '';
      teachers.forEach(function(t) {
        const unavailCount = (currentState.teacherAvailabilities || []).filter(function(ta) { return ta.teacherId === t.id && ta.isAvailable === false; }).length;
        const unavailTag = unavailCount > 0 ? ' <span style="color:#f87171; font-size:10px;">(' + unavailCount + ' blocked slots)</span>' : '';
        facHtml += '<div style="margin-bottom:6px; font-size:12px;"><label><input type="checkbox" class="assembly-faculty-cb" value="' + t.id + '" checked onchange="calculatePreFlightFeasibility()" style="width:auto; margin-right:6px;"> <strong>' + t.name + '</strong> (' + t.empId + ')' + unavailTag + '</label></div>';
      });
      const facEl = document.getElementById('assemblyFacultyList');
      if (facEl) facEl.innerHTML = facHtml || '<span style="color:var(--text-muted); font-size:12px;">No faculty registered.</span>';

      calculatePreFlightFeasibility();
    }

    function toggleAllCohorts(check) {
      document.querySelectorAll('.assembly-sec-cb, .assembly-batch-cb').forEach(function(cb) { cb.checked = check; });
      calculatePreFlightFeasibility();
    }
    function toggleAllOfferings(check) {
      document.querySelectorAll('.assembly-off-cb').forEach(function(cb) { cb.checked = check; });
      calculatePreFlightFeasibility();
    }
    function toggleAllVenues(check) {
      document.querySelectorAll('.assembly-room-cb').forEach(function(cb) { cb.checked = check; });
      calculatePreFlightFeasibility();
    }
    function toggleAllFaculty(check) {
      document.querySelectorAll('.assembly-faculty-cb').forEach(function(cb) { cb.checked = check; });
      calculatePreFlightFeasibility();
    }

    function calculatePreFlightFeasibility() {
      const selectedOffIds = new Set();
      document.querySelectorAll('.assembly-off-cb:checked').forEach(function(cb) { selectedOffIds.add(cb.value); });
      const selectedRoomIds = new Set();
      document.querySelectorAll('.assembly-room-cb:checked').forEach(function(cb) { selectedRoomIds.add(cb.value); });
      const selectedFacultyIds = new Set();
      document.querySelectorAll('.assembly-faculty-cb:checked').forEach(function(cb) { selectedFacultyIds.add(cb.value); });

      const offerings = (currentState.courseOfferings || []).filter(function(o) { return selectedOffIds.has(o.id); });
      const rooms = (currentState.rooms || []).filter(function(r) { return selectedRoomIds.has(r.id); });
      const coursesMap = new Map((currentState.courses || []).map(function(c) { return [c.id, c]; }));

      let totalSlotsRequired = 0;
      const warnings = [];

      offerings.forEach(function(o) {
        const c = coursesMap.get(o.courseId);
        if (c) {
          totalSlotsRequired += (c.lectureHours || 0) + (c.tutorialHours || 0) + (c.practicalHours || 0);
          if ((c.practicalHours || 0) % 2 !== 0) {
            warnings.push('Course ' + c.code + ' has odd practical hours (' + c.practicalHours + '), violating ERR_ODD_P_HOURS.');
          }
        }
        if (!selectedFacultyIds.has(o.teacherId)) {
          warnings.push('Offering ' + o.id + ' requires instructor ' + o.teacherId + ' who is not checked in participating faculty.');
        }
      });

      const slotsPerRoomWeek = 7 * 5; // 7 teaching hours per day * 5 days = 35 slots per room
      const totalCapacity = rooms.length * slotsPerRoomWeek;
      const isFeasible = totalSlotsRequired <= totalCapacity;

      const hasLabRooms = rooms.some(function(r) { return r.roomType === 'P'; });
      const hasLtRooms = rooms.some(function(r) { return r.roomType === 'LT'; });

      offerings.forEach(function(o) {
        const c = coursesMap.get(o.courseId);
        if (c && c.practicalHours > 0 && !hasLabRooms) {
          warnings.push('Course ' + c.code + ' requires practical lab venue (P), but no lab rooms are selected.');
        }
        if (c && (c.lectureHours > 0 || c.tutorialHours > 0) && !hasLtRooms) {
          warnings.push('Course ' + c.code + ' requires lecture venue (LT), but no lecture halls are selected.');
        }
      });

      if (!isFeasible) {
        warnings.push('Capacity Deficit: Selected offerings require ' + totalSlotsRequired + ' slots, but venue capacity is only ' + totalCapacity + ' slots.');
      }

      const reqEl = document.getElementById('metricSlotsRequired');
      if (reqEl) reqEl.textContent = totalSlotsRequired;
      const capEl = document.getElementById('metricCapacity');
      if (capEl) capEl.textContent = totalCapacity;
      const offEl = document.getElementById('metricSelectedOfferings');
      if (offEl) offEl.textContent = offerings.length;
      const roomEl = document.getElementById('metricSelectedRooms');
      if (roomEl) roomEl.textContent = rooms.length;
      const facEl = document.getElementById('metricSelectedFaculty');
      if (facEl) facEl.textContent = selectedFacultyIds.size;

      const badgeEl = document.getElementById('feasibilityStatusBadge');
      if (badgeEl) {
        if (isFeasible && warnings.length === 0) {
          badgeEl.innerHTML = '<span class="status-tag status-scheduled" style="font-size:12px; padding:4px 10px;">✓ Pre-Flight Feasible</span>';
        } else if (isFeasible && warnings.length > 0) {
          badgeEl.innerHTML = '<span class="status-tag status-draft" style="font-size:12px; padding:4px 10px;">⚠️ Feasible with ' + warnings.length + ' Warning(s)</span>';
        } else {
          badgeEl.innerHTML = '<span class="status-tag status-cancelled" style="font-size:12px; padding:4px 10px;">⛔ Infeasible (Capacity Deficit)</span>';
        }
      }

      const warnContainer = document.getElementById('preFlightWarningsContainer');
      if (warnContainer) {
        if (warnings.length > 0) {
          let wHtml = '<div class="warn-badge" style="margin-bottom:0;"><strong>Pre-Flight Validation Alerts:</strong><ul style="margin:4px 0 0 16px;">';
          warnings.forEach(function(w) { wHtml += '<li>' + w + '</li>'; });
          wHtml += '</ul></div>';
          warnContainer.innerHTML = wHtml;
        } else {
          warnContainer.innerHTML = '<div style="font-size:11px; color:#34d399;">✓ All constraint pre-checks pass: Contact hours, teacher assignments, and venue capability requirements verified.</div>';
        }
      }
    }

    async function compileAssemblyPackage() {
      const termIds = getSelectedTermIds();
      const roomIds = [];
      document.querySelectorAll('.assembly-room-cb:checked').forEach(function(cb) { roomIds.push(cb.value); });
      const teacherIds = [];
      document.querySelectorAll('.assembly-faculty-cb:checked').forEach(function(cb) { teacherIds.push(cb.value); });
      const courseOfferingIds = [];
      document.querySelectorAll('.assembly-off-cb:checked').forEach(function(cb) { courseOfferingIds.push(cb.value); });
      const sectionIds = [];
      document.querySelectorAll('.assembly-sec-cb:checked').forEach(function(cb) { sectionIds.push(cb.value); });

      try {
        showMsg('Compiling generation package in memory...');
        const res = await api('/api/generation/compile-package', {
          method: 'POST',
          body: JSON.stringify({
            termIds,
            scope: { roomIds, teacherIds, courseOfferingIds, sectionIds }
          })
        });

        latestCompiledPackage = res.package;
        const resBox = document.getElementById('compilationResultBox');
        if (resBox) {
          resBox.style.display = 'block';
          resBox.innerHTML = '<div class="info-badge" style="background:rgba(16,185,129,0.12); border-color:#10b981; color:#6ee7b7;">' +
            '<strong>✓ Package Compiled: <code>' + res.package.packageId + '</code></strong><br>' +
            'Input Revision Hash: <code>' + res.package.inputRevision + '</code> • Terms: ' + res.package.termIds.join(', ') + '<br>' +
            'Included Offerings: ' + res.stats.offeringCount + ' • Teaching Slots: ' + res.stats.totalSlotsRequired + ' / Capacity: ' + res.stats.totalCapacity +
            '</div>';
        }

        const cmdBox = document.getElementById('cliCommandBox');
        if (cmdBox) {
          cmdBox.textContent = 'py -3.12 generator/run_local.py --input ' + res.package.packageId + '.json --output draft.json';
        }

        showMsg('Generation package compiled successfully (' + res.package.packageId + ')');
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    async function runSolverAndStageDraftDirectly() {
      const termIds = getSelectedTermIds();
      const roomIds = [];
      document.querySelectorAll('.assembly-room-cb:checked').forEach(function(cb) { roomIds.push(cb.value); });
      const teacherIds = [];
      document.querySelectorAll('.assembly-faculty-cb:checked').forEach(function(cb) { teacherIds.push(cb.value); });
      const courseOfferingIds = [];
      document.querySelectorAll('.assembly-off-cb:checked').forEach(function(cb) { courseOfferingIds.push(cb.value); });
      const sectionIds = [];
      document.querySelectorAll('.assembly-sec-cb:checked').forEach(function(cb) { sectionIds.push(cb.value); });

      try {
        showMsg('🚀 Invoking OR-Tools CP-SAT generator on current scope...');
        const res = await api('/api/generation/request', {
          method: 'POST',
          body: JSON.stringify({
            termIds,
            scope: { roomIds, teacherIds, courseOfferingIds, sectionIds }
          })
        });

        if (res.hostedAvailable && res.status === 'succeeded') {
          showMsg('✅ Solver succeeded! Automatically staging draft...');
          const uploadRes = await api('/api/generation/draft/upload', {
            method: 'POST',
            body: JSON.stringify({
              draft: res.package ? (await (await fetch('http://127.0.0.1:5001/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(res.package)
              })).json()) : null,
              allowStaleOverride: true
            })
          });
          showMsg('Draft staged successfully! Ready to publish in Step 3 below.');
          await loadState();
        } else if (res.package) {
          // If server reports unavailable or needs execution, compile package for local run
          latestCompiledPackage = res.package;
          showMsg(res.message);
          await loadState();
        } else {
          showMsg(res.message);
        }
      } catch (err) {
        // Fallback: compile package
        await compileAssemblyPackage();
        showMsg('Package compiled. ' + err.message, true);
      }
    }

    function downloadAssembledPackage() {
      const termIds = getSelectedTermIds();
      const roomIds = [];
      document.querySelectorAll('.assembly-room-cb:checked').forEach(function(cb) { roomIds.push(cb.value); });
      const teacherIds = [];
      document.querySelectorAll('.assembly-faculty-cb:checked').forEach(function(cb) { teacherIds.push(cb.value); });
      const courseOfferingIds = [];
      document.querySelectorAll('.assembly-off-cb:checked').forEach(function(cb) { courseOfferingIds.push(cb.value); });
      const sectionIds = [];
      document.querySelectorAll('.assembly-sec-cb:checked').forEach(function(cb) { sectionIds.push(cb.value); });

      let url = '/api/generation/package/download?';
      if (termIds.length > 0) url += 'termIds=' + encodeURIComponent(termIds.join(',')) + '&';
      if (roomIds.length > 0) url += 'roomIds=' + encodeURIComponent(roomIds.join(',')) + '&';
      if (teacherIds.length > 0) url += 'teacherIds=' + encodeURIComponent(teacherIds.join(',')) + '&';
      if (courseOfferingIds.length > 0) url += 'offeringIds=' + encodeURIComponent(courseOfferingIds.join(',')) + '&';
      if (sectionIds.length > 0) url += 'sectionIds=' + encodeURIComponent(sectionIds.join(',')) + '&';

      window.location.href = url;
    }

    // Draft Upload & Staging
    function handleDraftFileSelect(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      readDraftFile(file);
    }

    function setupDragAndDrop() {
      const dropZone = document.getElementById('draftDropZone');
      if (!dropZone) return;

      dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
      dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        dropZone.classList.remove('dragover');
      });
      dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) readDraftFile(file);
      });
    }

    function readDraftFile(file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        const text = evt.target.result;
        const txtEl = document.getElementById('assemblyDraftText');
        if (txtEl) txtEl.value = text;
        try {
          const draft = JSON.parse(text);
          processParsedDraft(draft);
        } catch (err) {
          showMsg('Invalid JSON file: ' + err.message, true);
        }
      };
      reader.readAsText(file);
    }

    function parseDraftText() {
      const txtEl = document.getElementById('assemblyDraftText');
      if (!txtEl) return;
      const text = txtEl.value.trim();
      if (!text) {
        parsedDraftPayload = null;
        const prevSummary = document.getElementById('draftPreviewSummary');
        if (prevSummary) prevSummary.style.display = 'none';
        return;
      }
      try {
        const draft = JSON.parse(text);
        processParsedDraft(draft);
      } catch (err) {
        // In-progress typing, wait for complete JSON
      }
    }

    function processParsedDraft(draft) {
      parsedDraftPayload = draft;
      const prevSummary = document.getElementById('draftPreviewSummary');
      const staleBanner = document.getElementById('staleRevisionBanner');

      if (prevSummary) {
        prevSummary.style.display = 'block';
        const classCount = (draft.classes || []).length;
        prevSummary.innerHTML = '<div style="background:#0b1120; border:1px solid var(--border); border-radius:6px; padding:10px;">' +
          '<strong>Draft Preview:</strong> Status: <span class="status-tag status-scheduled">' + (draft.status || 'succeeded') + '</span> • Package: <code>' + (draft.packageId || 'unknown') + '</code><br>' +
          'Revision: <code>' + (draft.inputRevision || '—') + '</code> • Placed Classes: <strong>' + classCount + ' sessions</strong>' +
          '</div>';
      }

      const expectedRevision = latestCompiledPackage ? latestCompiledPackage.inputRevision : null;
      if (expectedRevision && draft.inputRevision && draft.inputRevision !== expectedRevision) {
        if (staleBanner) staleBanner.style.display = 'block';
      } else {
        if (staleBanner) staleBanner.style.display = 'none';
      }
    }

    async function validateAndStageDraft() {
      if (!parsedDraftPayload) {
        parseDraftText();
      }
      if (!parsedDraftPayload) {
        showMsg('Please drop or paste a valid draft JSON file.', true);
        return;
      }

      const overrideEl = document.getElementById('assemblyOverrideStale');
      const reasonEl = document.getElementById('assemblyOverrideReason');
      const allowOverride = overrideEl ? overrideEl.checked : false;
      const reason = reasonEl ? reasonEl.value.trim() : '';

      try {
        showMsg('Validating hard constraints and staging draft...');
        const res = await api('/api/generation/draft/upload', {
          method: 'POST',
          body: JSON.stringify({
            draft: parsedDraftPayload,
            allowStaleOverride: allowOverride,
            staleOverrideReason: reason
          })
        });

        showMsg('Draft staged successfully with status ' + res.version.status + ' (' + res.classCount + ' classes).');
        parsedDraftPayload = null;
        const txtEl = document.getElementById('assemblyDraftText');
        if (txtEl) txtEl.value = '';
        const prevSummary = document.getElementById('draftPreviewSummary');
        if (prevSummary) prevSummary.style.display = 'none';
        const staleBanner = document.getElementById('staleRevisionBanner');
        if (staleBanner) staleBanner.style.display = 'none';

        await loadState();
      } catch (err) {
        showMsg('Validation error: ' + err.message, true);
      }
    }

    function renderStagedDraftsReview() {
      const container = document.getElementById('stagedDraftsReviewList');
      if (!container) return;

      const versions = currentState.timetableVersions || [];
      const drafts = versions.filter(function(v) { return v.status === 'draft'; });

      if (drafts.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted); font-size:12px;">No drafts currently staged. Stage a draft in Step 2 above or run 1-Click Demo.</div>';
        return;
      }

      let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
      drafts.forEach(function(v) {
        const classes = (currentState.scheduledClasses || []).filter(function(c) { return c.versionId === v.id; });
        html += '<div style="background:#0b1120; border:1px solid var(--border); border-radius:6px; padding:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">' +
          '<div>' +
            '<strong style="color:var(--primary); font-size:14px;">Version ' + v.versionNumber + ' (Draft)</strong> • Term: <code>' + v.termId + '</code><br>' +
            '<span style="font-size:12px; color:var(--text-muted);">Placed Sessions: <strong>' + classes.length + '</strong> • Conflicts: <strong style="color:#34d399;">0</strong> • Revision: <code>' + (v.inputRevision ? v.inputRevision.substring(0, 8) : '—') + '</code></span>' +
          '</div>' +
          '<div>' +
            '<button style="background:#10b981; color:#020617; font-weight:700; padding:6px 14px; font-size:12px;" data-id="' + v.id + '" onclick="handlePublish(this)">🚀 Publish Timetable</button>' +
          '</div>' +
        '</div>';
      });
      html += '</div>';
      container.innerHTML = html;
    }

    // Initial boot load: verify session token and load state
    async function initAuthAndLoad() {
      if (authToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': 'Bearer ' + authToken }
          });
          const data = await res.json();
          if (res.ok && data.success && data.user) {
            currentUser = data.user;
            currentRole = currentUser.role;
          } else {
            authToken = '';
            localStorage.removeItem('timetable_auth_token');
          }
        } catch {
          authToken = '';
          localStorage.removeItem('timetable_auth_token');
        }
      }
      updateAuthNav();
      setupRealtime();
      await loadState();
    }


    setupDragAndDrop();
    initAuthAndLoad();
  </script>
</body>
</html>`;
}
