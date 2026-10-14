/**
 * TimeTable+ Visual Identity & Enterprise Academic Schedule Management Platform.
 * Features:
 * - Brand Landing Page Hero ("Smarter Timetables, Brighter Days") with 2.5D graphics and value props
 * - Role Selection Gate (Admin, Teacher, Student) with soft pastel cards
 * - Role-Based Secure Login Modal with custom role graphics & Supabase Auth integration
 * - Student Timetable Dashboard with color-coded badges, 2-slot lab spanning, and live alerts
 * - Teacher Dashboard with personal schedule, slot drawer, quick cancel/reschedule, and empty room finder
 * - Admin Command Center with summary metrics, campus audit grid, modular management, CP-SAT solver console, user provisioning, and room utilization matrix
 * - Trademark bottom-wave graphical divider anchoring the page
 * Adheres strictly to D01–D50, DEC-01–DEC-15, and AGENTS.md.
 */

export function renderHtmlUI(config?: { supabaseUrl?: string; supabaseAnonKey?: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TimeTable+ • Modern University Timetable & Academic Management</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <style>
    :root {
      --primary: #5842E3;
      --primary-hover: #4A35D0;
      --primary-light: #EBE9FC;
      --secondary: #6C5CE7;
      --accent-pink: #E05697;
      --accent-pink-light: #FCE8F3;
      --accent-blue: #0284C7;
      --accent-blue-light: #E0F2FE;
      --accent-amber: #D97706;
      --accent-amber-light: #FFFBEB;
      --accent-emerald: #059669;
      --accent-emerald-light: #ECFDF5;
      --accent-purple: #7C3AED;
      --accent-purple-light: #F3E8FF;
      --danger: #DC2626;
      --danger-light: #FEF2F2;
      --bg: #F8F9FD;
      --card: #FFFFFF;
      --border: #E8EBF5;
      --border-focus: #5842E3;
      --text: #0F172A;
      --text-muted: #64748B;
      --radius-sm: 10px;
      --radius-md: 16px;
      --radius-lg: 24px;
      --shadow-sm: 0 2px 6px rgba(88, 66, 227, 0.04);
      --shadow-md: 0 10px 25px -5px rgba(88, 66, 227, 0.08), 0 4px 10px -2px rgba(0, 0, 0, 0.03);
      --shadow-lg: 0 20px 35px -5px rgba(88, 66, 227, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.04);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
    h1, h2, h3, h4, .brand-font { font-family: 'Poppins', sans-serif; }

    body {
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      overflow-x: hidden;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Top Navigation Bar */
    .navbar {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s ease;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      cursor: pointer;
    }
    .logo-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #5842E3, #6C5CE7);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(88, 66, 227, 0.3);
      color: #fff;
      font-size: 20px;
    }
    .logo-text {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: var(--text);
    }
    .logo-text span {
      color: var(--primary);
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .nav-link {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-muted);
      text-decoration: none;
      cursor: pointer;
      transition: color 0.15s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .nav-link:hover, .nav-link.active {
      color: var(--primary);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* Buttons */
    .btn {
      padding: 9px 18px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 600;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.18s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      text-decoration: none;
    }
    .btn-primary {
      background: var(--primary);
      color: #FFFFFF;
      box-shadow: 0 4px 14px rgba(88, 66, 227, 0.28);
    }
    .btn-primary:hover {
      background: var(--primary-hover);
      box-shadow: 0 6px 18px rgba(88, 66, 227, 0.38);
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: #FFFFFF;
      border: 1px solid var(--border);
      color: var(--text);
    }
    .btn-secondary:hover {
      background: var(--primary-light);
      border-color: #D5D1FA;
      color: var(--primary);
    }
    .btn-accent {
      background: var(--accent-pink);
      color: #fff;
    }
    .btn-accent:hover {
      opacity: 0.92;
    }
    .btn-danger {
      background: var(--danger);
      color: #fff;
    }
    .btn-danger:hover {
      opacity: 0.9;
    }
    .btn-outline-danger {
      background: transparent;
      border: 1px solid #FCA5A5;
      color: var(--danger);
    }
    .btn-outline-danger:hover {
      background: var(--danger-light);
    }

    /* Main Container */
    .main-content {
      flex: 1;
      max-width: 1380px;
      width: 100%;
      margin: 0 auto;
      padding: 24px;
    }

    /* PAGE 1: HERO LANDING SECTION */
    .hero-section {
      background: radial-gradient(circle at 80% 20%, #EDE9FE 0%, rgba(248, 249, 253, 0) 65%), #FFFFFF;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 56px 48px;
      margin-bottom: 32px;
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 40px;
      align-items: center;
      box-shadow: var(--shadow-md);
      position: relative;
      overflow: hidden;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--primary-light);
      color: var(--primary);
      padding: 6px 14px;
      border-radius: 30px;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 20px;
    }
    .hero-title {
      font-size: 44px;
      font-weight: 800;
      line-height: 1.15;
      color: var(--text);
      letter-spacing: -1px;
      margin-bottom: 16px;
    }
    .hero-title span {
      background: linear-gradient(135deg, #5842E3, #E05697);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-desc {
      font-size: 16px;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 28px;
      max-width: 540px;
    }
    .hero-actions {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
    }

    .hero-graphic {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .hero-card-stack {
      width: 100%;
      max-width: 400px;
      background: linear-gradient(145deg, #6C5CE7, #5842E3);
      border-radius: 24px;
      padding: 28px;
      color: #fff;
      box-shadow: 0 20px 40px rgba(88, 66, 227, 0.35);
      position: relative;
      animation: floatWidget 4s ease-in-out infinite;
    }
    @keyframes floatWidget {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }
    .hero-mock-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .hero-mock-chip {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .hero-mock-class {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 14px;
      padding: 14px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .hero-mock-class-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: var(--primary);
    }

    /* 4 Value Proposition Cards */
    .value-props-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
      margin-bottom: 36px;
    }
    .value-prop-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 24px;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .value-prop-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-3px);
      border-color: #D0C9FA;
    }
    .vp-icon-bubble {
      width: 50px;
      height: 50px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin-bottom: 16px;
    }
    .vp-title {
      font-size: 17px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 8px;
    }
    .vp-desc {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* PAGE 2: ROLE SELECTION GATE */
    .role-gate-section {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 40px;
      margin-bottom: 32px;
      box-shadow: var(--shadow-md);
      text-align: center;
    }
    .role-gate-title {
      font-size: 28px;
      font-weight: 800;
      color: var(--text);
      margin-bottom: 8px;
    }
    .role-gate-subtitle {
      font-size: 15px;
      color: var(--text-muted);
      margin-bottom: 32px;
    }
    .role-cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      text-align: left;
    }
    .role-select-card {
      background: var(--bg);
      border: 2px solid transparent;
      border-radius: var(--radius-md);
      padding: 28px 24px;
      transition: all 0.22s ease;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .role-select-card:hover {
      border-color: var(--primary);
      background: #FFFFFF;
      box-shadow: var(--shadow-md);
      transform: translateY(-4px);
    }
    .role-select-card.active {
      border-color: var(--primary);
      background: #FFFFFF;
      box-shadow: 0 0 0 3px rgba(88, 66, 227, 0.15);
    }
    .role-card-avatar {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin-bottom: 18px;
    }
    .role-card-name {
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 6px;
    }
    .role-card-desc {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 20px;
    }

    /* Day Navigation Pill Bar */
    .day-selector-bar {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 12px 18px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow-sm);
      flex-wrap: wrap;
      gap: 12px;
    }
    .day-pills-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .day-pill {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 8px 16px;
      border-radius: 24px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .day-pill:hover {
      border-color: #C0B9F7;
      color: var(--primary);
    }
    .day-pill.active {
      background: var(--primary);
      color: #FFFFFF;
      border-color: var(--primary);
      box-shadow: 0 3px 10px rgba(88, 66, 227, 0.25);
    }
    .active-day-heading {
      font-size: 14px;
      font-weight: 700;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* The Timetable Grid Card */
    .timetable-wrapper-card {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
      margin-bottom: 32px;
      box-shadow: var(--shadow-md);
    }
    .grid-header-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .grid-header-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
    }
    .grid-header-subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* Table Styles */
    .table-scroll {
      overflow-x: auto;
      width: 100%;
    }
    table.tt-grid {
      width: 100%;
      border-collapse: separate;
      border-spacing: 6px;
      min-width: 1100px;
      table-layout: fixed;
    }
    table.tt-grid th {
      background: #F1F4FA;
      color: var(--text-muted);
      padding: 12px 8px;
      border-radius: 8px;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    table.tt-grid th.col-track {
      width: 170px;
      text-align: left;
      padding-left: 14px;
      background: var(--primary-light);
      color: var(--primary);
    }
    table.tt-grid th.col-lunch {
      background: var(--accent-amber-light);
      color: var(--accent-amber);
      border: 1px dashed var(--accent-amber);
    }
    table.tt-grid th .th-time {
      display: block;
      font-size: 11px;
      font-weight: normal;
      opacity: 0.8;
      margin-top: 2px;
    }

    table.tt-grid td {
      vertical-align: top;
      padding: 6px;
      border-radius: 12px;
      background: #FDFEFE;
      border: 1px solid var(--border);
      height: 105px;
    }
    table.tt-grid td.cell-track {
      background: #FAF9FE;
      border: 1px solid #E8E5FA;
      padding: 14px;
      font-weight: 700;
      color: var(--primary);
      font-size: 13px;
      height: auto;
    }
    table.tt-grid td.slot-lunch-break {
      background: var(--accent-amber-light);
      border: 1px dashed var(--accent-amber);
      text-align: center;
      padding: 16px 6px;
      vertical-align: middle;
    }
    table.tt-grid td.slot-free {
      background: #FAFAFC;
      border: 1px dashed #CBD5E1;
      text-align: center;
      padding: 14px 4px;
      color: #94A3B8;
      vertical-align: middle;
      transition: all 0.15s ease;
    }
    table.tt-grid td.slot-free:hover {
      background: var(--primary-light);
      border-color: var(--primary);
    }

    /* Class Occurrence Cards */
    .class-card {
      border-radius: 12px;
      padding: 10px 12px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .class-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }

    .class-lecture {
      background: var(--accent-blue-light);
      border: 1px solid #BAE6FD;
      color: #0369A1;
    }
    .class-practical {
      background: var(--accent-purple-light);
      border: 1px solid #E9D5FF;
      color: #6B21A8;
    }
    .class-tutorial {
      background: var(--accent-amber-light);
      border: 1px solid #FDE68A;
      color: #B45309;
    }
    .class-extra {
      background: var(--accent-emerald-light);
      border: 1px solid #A7F3D0;
      color: #047857;
    }
    .class-cancelled {
      background: var(--danger-light);
      border: 1px dashed #FCA5A5;
      color: var(--danger);
    }

    .badge-pill {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .badge-pill-lec { background: #0284C7; color: #fff; }
    .badge-pill-lab { background: #7C3AED; color: #fff; }
    .badge-pill-tut { background: #D97706; color: #fff; }
    .badge-pill-extra { background: #059669; color: #fff; }
    .badge-pill-cancel { background: #DC2626; color: #fff; }

    .class-code { font-weight: 800; font-size: 13px; }
    .class-meta { font-size: 11px; margin-top: 2px; opacity: 0.9; }

    /* Modal Styles */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(6px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card-custom {
      background: #FFFFFF;
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 520px;
      box-shadow: 0 25px 50px -12px rgba(88, 66, 227, 0.25);
      border: 1px solid var(--border);
      overflow: hidden;
      animation: modalPop 0.2s ease-out;
    }
    @keyframes modalPop {
      0% { opacity: 0; transform: scale(0.96); }
      100% { opacity: 1; transform: scale(1); }
    }
    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-body {
      padding: 24px;
    }
    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--border);
      background: #FAFBFD;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    /* Sub-nav tabs for Admin */
    .admin-nav-pills {
      display: flex;
      gap: 6px;
      margin-bottom: 24px;
      background: #FFFFFF;
      padding: 6px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      flex-wrap: wrap;
    }
    .admin-pill-btn {
      background: transparent;
      border: none;
      padding: 9px 18px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .admin-pill-btn:hover {
      color: var(--primary);
      background: var(--primary-light);
    }
    .admin-pill-btn.active {
      background: var(--primary);
      color: #FFFFFF;
      box-shadow: 0 2px 8px rgba(88, 66, 227, 0.25);
    }

    /* Content Cards & Forms */
    .card-box {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 24px;
      box-shadow: var(--shadow-sm);
      margin-bottom: 24px;
    }
    .card-box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .card-box-title {
      font-size: 17px;
      font-weight: 700;
      color: var(--text);
    }
    .card-box-desc {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 16px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 6px;
    }
    .form-control {
      width: 100%;
      background: #FFFFFF;
      border: 1px solid var(--border);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      color: var(--text);
      transition: border-color 0.15s ease;
    }
    .form-control:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(88, 66, 227, 0.12);
    }

    /* Modern Data Tables */
    .data-table-wrap {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      overflow-x: auto;
      max-height: 320px;
    }
    table.styled-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    table.styled-table th {
      background: #F8FAFC;
      padding: 10px 14px;
      font-weight: 700;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 2;
    }
    table.styled-table td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      color: var(--text);
    }
    table.styled-table tr:hover td {
      background: #F8F9FE;
    }

    /* Status Tags */
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .status-badge-published { background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; }
    .status-badge-draft { background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A; }
    .status-badge-superseded { background: #F1F5F9; color: #64748B; border: 1px solid #CBD5E1; }

    /* Footer Bottom Wave */
    .footer-wave-wrap {
      margin-top: auto;
      background: #FFFFFF;
      border-top: 1px solid var(--border);
      padding: 32px 24px;
      text-align: center;
      position: relative;
    }
    .footer-wave-svg {
      width: 100%;
      height: 60px;
      position: absolute;
      top: -60px;
      left: 0;
      pointer-events: none;
    }
    .footer-text {
      font-size: 13px;
      color: var(--text-muted);
    }
    .footer-text strong {
      color: var(--primary);
    }

    /* Drawer Styles */
    .drawer-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      z-index: 1050;
      justify-content: flex-end;
    }
    .drawer-card {
      background: #FFFFFF;
      width: 100%;
      max-width: 480px;
      height: 100%;
      box-shadow: -10px 0 30px rgba(0,0,0,0.15);
      padding: 32px 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow-y: auto;
      animation: slideInRight 0.25s ease-out;
    }
    @keyframes slideInRight {
      0% { transform: translateX(100%); }
      100% { transform: translateX(0); }
    }

    /* Notification Toasts */
    .toast-box {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2000;
      padding: 14px 20px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      display: none;
      align-items: center;
      gap: 10px;
      animation: slideUpToast 0.2s ease;
    }
    @keyframes slideUpToast {
      0% { transform: translateY(20px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    .toast-success { background: #059669; color: #FFFFFF; }
    .toast-error { background: #DC2626; color: #FFFFFF; }

    @media (max-width: 900px) {
      .hero-section { grid-template-columns: 1fr; padding: 36px 24px; }
      .navbar { padding: 12px 16px; }
      .main-content { padding: 16px; }
    }
  </style>
</head>
<body>

  <!-- Top Navigation Bar -->
  <nav class="navbar">
    <a class="brand-logo" onclick="switchView('landing')">
      <div class="logo-icon">📅</div>
      <div class="logo-text">TimeTable<span>+</span></div>
    </a>

    <div class="nav-links">
      <a class="nav-link" id="navLinkHome" onclick="switchView('landing')">Home</a>
      <a class="nav-link" id="navLinkDashboard" onclick="switchView('dashboard')">Timetable Grid</a>
      <a class="nav-link" id="navLinkRoleGate" onclick="switchView('roles')">Switch Roles</a>
    </div>

    <div class="nav-actions">
      <!-- Unauthenticated View -->
      <div id="unauthNav">
        <button class="btn btn-secondary" onclick="switchView('roles')">Select Role</button>
        <button class="btn btn-primary" onclick="openLoginModal()">🔑 Sign In</button>
      </div>

      <!-- Authenticated View -->
      <div id="authNav" style="display: none; align-items: center; gap: 12px;">
        <span class="status-badge" id="navRoleBadge" style="background:var(--primary-light); color:var(--primary);">👑 Admin</span>
        <div style="font-size: 13px; font-weight: 600; color: var(--text);" id="navUserName">admin@university.edu</div>
        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="handleLogout()">🚪 Sign Out</button>
      </div>
    </div>
  </nav>

  <main class="main-content">
    
    <!-- Toast notifications -->
    <div id="appToast" class="toast-box"></div>

    <!-- ==================================================================== -->
    <!-- VIEW 1: BRAND LANDING PAGE HERO (Page 1 in Spec) -->
    <!-- ==================================================================== -->
    <div id="landingView">
      <div class="hero-section">
        <div>
          <div class="hero-badge">✨ Next-Generation University Schedule Engine</div>
          <h1 class="hero-title">Smarter Timetables, <span>Brighter Days</span></h1>
          <p class="hero-desc">
            A simple and smart solution for students, teachers, and admins to manage and generate academic schedules effortlessly. Backed by Google OR-Tools CP-SAT constraint optimization.
          </p>
          <div class="hero-actions">
            <button class="btn btn-primary" onclick="switchView('dashboard')" style="padding: 12px 24px; font-size: 15px;">
              🚀 Explore Dashboard
            </button>
            <button class="btn btn-secondary" onclick="switchView('roles')" style="padding: 12px 24px; font-size: 15px;">
              ✨ Select Your Role
            </button>
            <button class="btn btn-secondary" onclick="resetToSimpleMockData()" style="padding: 12px 18px; font-size: 13px; color:#F43F5E;">
              🧹 Reset Simple Data
            </button>
            <button class="btn btn-secondary" onclick="loadDemoSchedule()" style="padding: 12px 18px; font-size: 13px;">
              ⚡ 1-Click Load & Publish
            </button>
          </div>
        </div>

        <div class="hero-graphic">
          <div class="hero-card-stack">
            <div class="hero-mock-header">
              <span class="hero-mock-chip">Monday • Term 3</span>
              <span style="font-size: 14px;">⚡ Verified Conflict-Free</span>
            </div>
            <div class="hero-mock-class">
              <div class="hero-mock-class-icon">📘</div>
              <div>
                <div style="font-weight: 700; font-size: 14px;">CS201 Data Structures</div>
                <div style="font-size: 12px; opacity: 0.85;">09:00–10:00 • Room 101 (Floor 1)</div>
              </div>
            </div>
            <div class="hero-mock-class">
              <div class="hero-mock-class-icon" style="color:var(--accent-purple);">🔬</div>
              <div>
                <div style="font-weight: 700; font-size: 14px;">CS201 Lab (Batch 3A1)</div>
                <div style="font-size: 12px; opacity: 0.85;">10:00–12:00 • Lab 1 (2-Slot Spanning)</div>
              </div>
            </div>
            <div style="margin-top: 16px; font-size: 12px; opacity: 0.8; text-align: center;">
              🍱 Non-Teaching Lunch Interval at 12:00–13:00 (DEC-04)
            </div>
          </div>
        </div>
      </div>

      <!-- 4 Dynamic Value Proposition Cards -->
      <div class="value-props-grid">
        <div class="value-prop-card" onclick="switchView('dashboard')">
          <div class="vp-icon-bubble" style="background:#E0F2FE; color:#0284C7;">📅</div>
          <div class="vp-title">View Timetable</div>
          <div class="vp-desc">Personalized calendars for students and teachers with color-coded classes, practical lab spans, and instant venue guidance.</div>
        </div>
        <div class="value-prop-card" onclick="selectRole('admin'); switchView('dashboard'); switchAdminTab('solver');">
          <div class="vp-icon-bubble" style="background:#EDE9FE; color:#6C5CE7;">⚡</div>
          <div class="vp-title">Smart Generation</div>
          <div class="vp-desc">OR-Tools CP-SAT constraint optimization generates clash-free schedules across concurrent semesters in under 300ms.</div>
        </div>
        <div class="value-prop-card" onclick="selectRole('student'); switchView('dashboard');">
          <div class="vp-icon-bubble" style="background:#DCFCE7; color:#059669;">🔔</div>
          <div class="vp-title">Real-Time Updates</div>
          <div class="vp-desc">Post-commit live subscriptions deliver immediate alerts for cancellations, venue relocations, and extra classes.</div>
        </div>
        <div class="value-prop-card" onclick="switchView('roles')">
          <div class="vp-icon-bubble" style="background:#FCE8F3; color:#E05697;">👥</div>
          <div class="vp-title">Multi-User Access</div>
          <div class="vp-desc">Dedicated, role-isolated workspaces for Students, Faculty, and University Administrators with Supabase Auth.</div>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- VIEW 2: ROLE SELECTION GATE (Page 2 in Spec) -->
    <!-- ==================================================================== -->
    <div id="rolesView" style="display: none;">
      <div class="role-gate-section">
        <h2 class="role-gate-title">Select Your Academic Portal</h2>
        <p class="role-gate-subtitle">Choose your institutional role to access tailored scheduling tools and calendar views.</p>

        <div class="role-cards-container">
          <!-- Student Card -->
          <div class="role-select-card" id="roleCardStudent">
            <div>
              <div class="role-card-avatar" style="background: #E0F2FE; color: #0284C7;">🎓</div>
              <div class="role-card-name">Student Portal</div>
              <div class="role-card-desc">
                View your section lectures, practical lab groups, elective subjects, and real-time alerts for room changes or cancellations.
              </div>
            </div>
            <button class="btn btn-secondary" onclick="selectRole('student'); switchView('dashboard');" style="width: 100%;">
              Enter as Student ➔
            </button>
          </div>

          <!-- Teacher Card -->
          <div class="role-select-card" id="roleCardTeacher">
            <div>
              <div class="role-card-avatar" style="background: #FCE8F3; color: #E05697;">🧑‍🏫</div>
              <div class="role-card-name">Teacher Hub</div>
              <div class="role-card-desc">
                Review your assigned lectures and labs, cancel/reschedule individual occurrences, claim free teaching slots, and submit unavailability.
              </div>
            </div>
            <button class="btn btn-secondary" onclick="selectRole('teacher'); switchView('dashboard');" style="width: 100%;">
              Enter as Teacher ➔
            </button>
          </div>

          <!-- Admin Card -->
          <div class="role-select-card" id="roleCardAdmin">
            <div>
              <div class="role-card-avatar" style="background: #EDE9FE; color: #5842E3;">👑</div>
              <div class="role-card-name">Admin Command Center</div>
              <div class="role-card-desc">
                Configure curriculum, manage venues and instructors, run CP-SAT generation, stage drafts, publish timetables, and provision users.
              </div>
            </div>
            <button class="btn btn-primary" onclick="selectRole('admin'); switchView('dashboard');" style="width: 100%;">
              Enter as Administrator ➔
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================================================================== -->
    <!-- VIEW 3: MAIN DASHBOARD & TIMETABLE GRID (Pages 4, 5, 6 in Spec) -->
    <!-- ==================================================================== -->
    <div id="dashboardView" style="display: none;">

      <!-- Day Navigation Pill Bar -->
      <div class="day-selector-bar">
        <div class="day-pills-group">
          <button class="day-pill active" id="dayPill0" onclick="setDay(0)">Mon</button>
          <button class="day-pill" id="dayPill1" onclick="setDay(1)">Tue</button>
          <button class="day-pill" id="dayPill2" onclick="setDay(2)">Wed</button>
          <button class="day-pill" id="dayPill3" onclick="setDay(3)">Thu</button>
          <button class="day-pill" id="dayPill4" onclick="setDay(4)">Fri</button>
        </div>

        <div class="active-day-heading" id="activeDayText">
          📅 Monday • September 7, 2026
        </div>

        <!-- Role simulator quick switcher for testing -->
        <div style="display: flex; gap: 6px; align-items: center;">
          <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Active View:</span>
          <select id="quickRoleSelect" onchange="selectRole(this.value)" style="padding: 5px 10px; border-radius: 8px; border: 1px solid var(--border); font-size: 12px; background: #fff; font-weight: 600; color: var(--primary);">
            <option value="student">🎓 Student View</option>
            <option value="teacher">🧑‍🏫 Teacher View</option>
            <option value="admin">👑 Admin Center</option>
          </select>
        </div>
      </div>

      <!-- Admin Filters Toolbar (Only visible when Admin) -->
      <div id="adminFiltersToolbar" class="card-box" style="padding: 14px 20px; margin-bottom: 20px; display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 13px; font-weight: 700; color: var(--text);">Audit Campus Grid:</span>
            <label style="font-size: 12px; color: var(--text-muted);">Group by</label>
            <select id="adminGroupBy" onchange="updateAdminGrouping(this.value)" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); font-size: 12px;">
              <option value="section">Section Cohort</option>
              <option value="room">Classroom Venue</option>
              <option value="teacher">Faculty Instructor</option>
            </select>
            <label style="font-size: 12px; color: var(--text-muted);">Filter:</label>
            <select id="adminFilterVal" onchange="updateAdminFilterVal(this.value)" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); font-size: 12px;">
              <option value="all">All Records</option>
            </select>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" onclick="resetToSimpleMockData()" style="padding: 6px 12px; font-size: 12px; color:#F43F5E;">🧹 Reset Data</button>
            <button class="btn btn-primary" onclick="loadDemoSchedule()" style="padding: 6px 12px; font-size: 12px;">⚡ 1-Click Demo</button>
          </div>
        </div>
      </div>

      <!-- The Timetable Grid Card -->
      <div class="timetable-wrapper-card">
        <div class="grid-header-meta">
          <div>
            <h2 class="grid-header-title" id="gridTitle">Daily Schedule Grid</h2>
            <p class="grid-header-subtitle">
              Periods 1 to 8 • Period 4 Non-Teaching Lunch Interval (DEC-04) • 2-Slot Practical Labs (D44)
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" onclick="prevDay()" style="padding: 6px 12px; font-size: 12px;">◀ Prev Day</button>
            <button class="btn btn-secondary" onclick="nextDay()" style="padding: 6px 12px; font-size: 12px;">Next Day ▶</button>
          </div>
        </div>

        <div class="table-scroll">
          <div id="timetableGridWrapper">
            <div style="padding: 40px; text-align: center; color: var(--text-muted);">
              ⏳ Loading timetable schedule...
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================== -->
      <!-- STUDENT VIEW EXCLUSIVE PANELS (Page 4 in Spec) -->
      <!-- ================================================================== -->
      <div id="studentViewPanels" style="display: none;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 32px;">
          
          <!-- Student Profile & Cohorts Card -->
          <div class="card-box">
            <div class="card-box-header">
              <h3 class="card-box-title">🎓 Student Profile & Cohorts</h3>
            </div>
            <p style="font-size: 14px; margin-bottom: 12px;">
              Active Student: <strong id="studentProfileName">Charlie Brown</strong> • <span id="studentProfileMeta" style="color:var(--text-muted);">Roll CS2026-001</span>
            </p>
            <ul id="studentCohortsList" style="list-style: none; font-size: 13px; line-height: 1.8; color: var(--text-muted);">
              <li>🏛️ Section: <strong style="color:var(--text);" id="stdSecLabel">Section 3A (sec-3A)</strong></li>
              <li>🔬 Practical Lab Batch: <strong style="color:var(--text);" id="stdBatchLabel">Batch 3A1 (batch-3A1)</strong></li>
              <li>📚 Enrolled Elective: <strong style="color:var(--text);" id="stdElecLabel">Applied Machine Learning</strong></li>
            </ul>
            <p style="font-size: 11px; color: var(--text-muted); margin-top: 14px; border-top: 1px solid var(--border); padding-top: 8px;">
              ℹ️ Your daily grid shows lectures for your section and lab sessions reserved for your practical batch.
            </p>
          </div>

          <!-- Announcements & Inbox Card -->
          <div class="card-box">
            <div class="card-box-header">
              <h3 class="card-box-title">🔔 Schedule Announcements</h3>
            </div>
            <div id="studentInbox" style="max-height: 200px; overflow-y: auto;">
              Loading inbox...
            </div>
          </div>

          <!-- Student Password Settings Card -->
          <div class="card-box">
            <div class="card-box-header">
              <h3 class="card-box-title">🔒 Account Security & Password</h3>
            </div>
            <p class="card-box-desc">Update your institutional student password securely.</p>
            <div class="form-group" style="margin-bottom: 12px;">
              <label>New Password (minimum 6 characters):</label>
              <input type="password" id="studentNewPassword" class="form-control" placeholder="••••••••">
            </div>
            <button class="btn btn-primary" onclick="handleStudentChangePassword()">Update Password</button>
          </div>
        </div>
      </div>

      <!-- ================================================================== -->
      <!-- TEACHER VIEW EXCLUSIVE PANELS (Page 5 in Spec) -->
      <!-- ================================================================== -->
      <div id="teacherViewPanels" style="display: none;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 32px;">
          
          <!-- Book One-Off Extra Class -->
          <div class="card-box">
            <div class="card-box-header">
              <h3 class="card-box-title">⚡ Book One-Off Extra Class</h3>
            </div>
            <p class="card-box-desc">Search freed or unoccupied slots to schedule an extra session (D02, D25).</p>
            <div class="form-grid">
              <div class="form-group">
                <label>Date:</label>
                <input type="date" id="extraDate" class="form-control" value="2026-09-08">
              </div>
              <div class="form-group">
                <label>Activity:</label>
                <select id="extraActivity" class="form-control">
                  <option value="L">Lecture (1 hour)</option>
                  <option value="P">Practical / Lab (2 hours)</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary" onclick="queryFreeSlots()">Search Free Slots</button>
            <div id="slotsResults" style="margin-top: 14px;"></div>
          </div>

          <!-- Teacher Unavailability Request -->
          <div class="card-box">
            <div class="card-box-header">
              <h3 class="card-box-title">🏖️ Submit Unavailability Request</h3>
            </div>
            <p class="card-box-desc">Request leave for a date. Admin review confirms absence and resolves occurrences (D29, D30).</p>
            <div class="form-grid">
              <div class="form-group">
                <label>Date:</label>
                <input type="date" id="unavailDate" class="form-control" value="2026-09-15">
              </div>
              <div class="form-group">
                <label>Start Slot:</label>
                <input type="number" id="unavailStart" class="form-control" value="1" min="1" max="8">
              </div>
              <div class="form-group">
                <label>End Slot:</label>
                <input type="number" id="unavailEnd" class="form-control" value="3" min="1" max="8">
              </div>
            </div>
            <div class="form-group" style="margin-bottom: 12px;">
              <label>Reason for Leave:</label>
              <input type="text" id="unavailReason" class="form-control" placeholder="e.g. Conference presentation or medical appointment">
            </div>
            <button class="btn btn-secondary" onclick="submitUnavailability()">Submit Request</button>
          </div>

          <!-- Empty Classroom Finder (Spec Page 5 Extra Feature) -->
          <div class="card-box">
            <div class="card-box-header">
              <h3 class="card-box-title">🔍 Empty Classroom Finder</h3>
            </div>
            <p class="card-box-desc">Quickly find empty rooms on campus for impromptu study sessions or office hours.</p>
            <div class="form-grid">
              <div class="form-group">
                <label>Period Slot:</label>
                <select id="finderSlotSelect" class="form-control" onchange="runEmptyRoomFinder()">
                  <option value="1">Period 1 (09:00 - 10:00)</option>
                  <option value="2">Period 2 (10:00 - 11:00)</option>
                  <option value="3">Period 3 (11:00 - 12:00)</option>
                  <option value="5">Period 5 (13:00 - 14:00)</option>
                  <option value="6">Period 6 (14:00 - 15:00)</option>
                  <option value="7">Period 7 (15:00 - 16:00)</option>
                  <option value="8">Period 8 (16:00 - 17:00)</option>
                </select>
              </div>
            </div>
            <div id="finderResults" style="font-size: 13px; color: var(--text-muted); margin-top: 8px;">
              Select a period to list free classrooms.
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================================== -->
      <!-- ADMIN VIEW EXCLUSIVE PANELS (Page 6 in Spec) -->
      <!-- ================================================================== -->
      <div id="adminViewPanels" style="display: none;">
        
        <!-- Summary Metrics Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 24px;">
          <div class="card-box" style="padding: 16px; text-align: center; margin-bottom: 0;">
            <div style="font-size: 26px; font-weight: 800; color: var(--primary);" id="metricTerms">0</div>
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Academic Terms</div>
          </div>
          <div class="card-box" style="padding: 16px; text-align: center; margin-bottom: 0;">
            <div style="font-size: 26px; font-weight: 800; color: var(--accent-blue);" id="metricRooms">0</div>
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Registered Venues</div>
          </div>
          <div class="card-box" style="padding: 16px; text-align: center; margin-bottom: 0;">
            <div style="font-size: 26px; font-weight: 800; color: var(--accent-pink);" id="metricTeachers">0</div>
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Faculty Instructors</div>
          </div>
          <div class="card-box" style="padding: 16px; text-align: center; margin-bottom: 0;">
            <div style="font-size: 26px; font-weight: 800; color: var(--accent-purple);" id="metricSections">0</div>
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Student Cohorts</div>
          </div>
          <div class="card-box" style="padding: 16px; text-align: center; margin-bottom: 0;">
            <div style="font-size: 26px; font-weight: 800; color: var(--accent-emerald);" id="metricTimetables">0</div>
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Published Timetables</div>
          </div>
        </div>

        <!-- Admin Sub-navigation Tabs -->
        <div class="admin-nav-pills">
          <button class="admin-pill-btn active" id="tabBtnHierarchy" onclick="switchAdminTab('hierarchy')">🏛️ Academic Hierarchy</button>
          <button class="admin-pill-btn" id="tabBtnCourses" onclick="switchAdminTab('courses')">📚 Course Catalog & Offerings</button>
          <button class="admin-pill-btn" id="tabBtnVenues" onclick="switchAdminTab('venues')">🏢 Venues & Faculty</button>
          <button class="admin-pill-btn" id="tabBtnSolver" onclick="switchAdminTab('solver')">⚙️ Solver & Generation</button>
          <button class="admin-pill-btn" id="tabBtnOperations" onclick="switchAdminTab('operations')">📋 Operations & Revisions</button>
          <button class="admin-pill-btn" id="tabBtnUsers" onclick="switchAdminTab('users')">👥 User Provisioning</button>
          <button class="admin-pill-btn" id="tabBtnMatrix" onclick="switchAdminTab('matrix')">📊 Room Utilization</button>
        </div>

        <!-- ADMIN TAB 1: ACADEMIC HIERARCHY -->
        <div id="adminTabHierarchy" class="admin-tab-pane">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
            <!-- Terms Card -->
            <div class="card-box">
              <h3 class="card-box-title">1. Academic Terms & Calendar</h3>
              <p class="card-box-desc">Configure academic cycles and operating boundaries (PRD §4).</p>
              <div class="form-grid">
                <div class="form-group">
                  <label>Academic Year:</label>
                  <input type="text" id="termYearLabel" class="form-control" value="2026-2027">
                </div>
                <div class="form-group">
                  <label>Semester Number (1-8):</label>
                  <input type="number" id="termSemesterNum" class="form-control" value="3" min="1" max="8">
                </div>
                <div class="form-group">
                  <label>Cycle:</label>
                  <select id="termCycle" class="form-control">
                    <option value="odd">Odd (Sem 1, 3, 5, 7)</option>
                    <option value="even">Even (Sem 2, 4, 6, 8)</option>
                  </select>
                </div>
              </div>
              <button class="btn btn-primary" onclick="saveAcademicTerm()">Add Academic Term</button>
              <div class="data-table-wrap" style="margin-top: 14px;">
                <table class="styled-table">
                  <thead><tr><th>ID</th><th>Year</th><th>Sem</th><th>Cycle</th><th>Status</th></tr></thead>
                  <tbody id="termsTableBody"></tbody>
                </table>
              </div>
            </div>

            <!-- Sections Card -->
            <div class="card-box">
              <h3 class="card-box-title">2. Sections (Class Cohorts)</h3>
              <p class="card-box-desc">Manage primary cohorts for lecture courses.</p>
              <div class="form-grid">
                <div class="form-group">
                  <label>Term:</label>
                  <select id="secTermSelect" class="form-control"></select>
                </div>
                <div class="form-group">
                  <label>Section Name:</label>
                  <input type="text" id="secNameInput" class="form-control" placeholder="e.g. Section B">
                </div>
                <div class="form-group">
                  <label>Cohort Size:</label>
                  <input type="number" id="secCohortSizeInput" class="form-control" value="60">
                </div>
              </div>
              <button class="btn btn-primary" onclick="createSection()">Create Section</button>
              <div class="data-table-wrap" style="margin-top: 14px;">
                <table class="styled-table">
                  <thead><tr><th>ID</th><th>Term</th><th>Name</th><th>Count</th></tr></thead>
                  <tbody id="sectionsTableBody"></tbody>
                </table>
              </div>
            </div>

            <!-- Batches Card -->
            <div class="card-box">
              <h3 class="card-box-title">3. Practical Sub-Batches</h3>
              <p class="card-box-desc">Sub-cohorts for parallel laboratory practical sessions.</p>
              <div class="form-grid">
                <div class="form-group">
                  <label>Parent Section:</label>
                  <select id="batchSecSelect" class="form-control"></select>
                </div>
                <div class="form-group">
                  <label>Batch Name:</label>
                  <input type="text" id="batchNameInput" class="form-control" placeholder="e.g. Batch A2">
                </div>
                <div class="form-group">
                  <label>Student Count:</label>
                  <input type="number" id="batchCountInput" class="form-control" value="30">
                </div>
              </div>
              <button class="btn btn-primary" onclick="createBatch()">Create Lab Batch</button>
              <div class="data-table-wrap" style="margin-top: 14px;">
                <table class="styled-table">
                  <thead><tr><th>ID</th><th>Section</th><th>Batch</th><th>Count</th></tr></thead>
                  <tbody id="batchesTableBody"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- ADMIN TAB 2: COURSE CATALOG & OFFERINGS -->
        <div id="adminTabCourses" class="admin-tab-pane" style="display: none;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
            <!-- Course Definition -->
            <div class="card-box">
              <h3 class="card-box-title">1. Course Definition & Contact Hours</h3>
              <p class="card-box-desc">Strict guardrail: Practical hours must be an even integer (2-slot lab blocks).</p>
              <div class="form-grid">
                <div class="form-group">
                  <label>Code:</label>
                  <input type="text" id="courseCodeInput" class="form-control" placeholder="e.g. CS201">
                </div>
                <div class="form-group">
                  <label>Title:</label>
                  <input type="text" id="courseNameInput" class="form-control" placeholder="Data Structures">
                </div>
                <div class="form-group">
                  <label>Term:</label>
                  <select id="courseTermSelect" class="form-control"></select>
                </div>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Lecture (L) Hrs:</label>
                  <input type="number" id="courseLHours" class="form-control" value="3" min="0" oninput="validateCourseHours()">
                </div>
                <div class="form-group">
                  <label>Tutorial (T) Hrs:</label>
                  <input type="number" id="courseTHours" class="form-control" value="0" min="0" oninput="validateCourseHours()">
                </div>
                <div class="form-group">
                  <label>Practical (P) Hrs (Even):</label>
                  <input type="number" id="coursePHours" class="form-control" value="2" min="0" oninput="validateCourseHours()">
                </div>
                <div class="form-group">
                  <label>Venue Type:</label>
                  <select id="courseVenueType" class="form-control">
                    <option value="LT">Lecture / Tutorial (LT)</option>
                    <option value="P">Practical Lab (P)</option>
                  </select>
                </div>
              </div>
              <div id="oddPracticalWarning" style="display: none; background:#FEF2F2; color:#DC2626; border:1px solid #FCA5A5; padding:8px 12px; border-radius:8px; font-size:12px; font-weight:600; margin-bottom:12px;">
                ⚠️ ERR_ODD_P_HOURS: Practical hours must be an even number (2 slots per session).
              </div>
              <button class="btn btn-primary" onclick="saveCourse()">Save Course</button>
              <div class="data-table-wrap" style="margin-top: 14px;">
                <table class="styled-table">
                  <thead><tr><th>Code</th><th>Title</th><th>L/T/P</th><th>Venue</th></tr></thead>
                  <tbody id="coursesTableBody"></tbody>
                </table>
              </div>
            </div>

            <!-- Course Offerings -->
            <div class="card-box">
              <h3 class="card-box-title">2. Course Offerings (Instructor & Cohort Mapping)</h3>
              <p class="card-box-desc">Map courses to faculty and target cohorts (with optional L/T/P component filter).</p>
              <div class="form-grid">
                <div class="form-group">
                  <label>Course:</label>
                  <select id="offCourseSelect" class="form-control"></select>
                </div>
                <div class="form-group">
                  <label>Assigned Faculty:</label>
                  <select id="offTeacherSelect" class="form-control"></select>
                </div>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Target Cohort Type:</label>
                  <select id="offTargetType" class="form-control" onchange="handleOffTargetTypeChange()">
                    <option value="section">Section</option>
                    <option value="batch">Practical Batch</option>
                    <option value="elective_group">Elective Group</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Target Cohort ID:</label>
                  <select id="offTargetIdSelect" class="form-control"></select>
                </div>
                <div class="form-group">
                  <label>Component Filter:</label>
                  <select id="offComponentSelect" class="form-control">
                    <option value="">All Components (Default)</option>
                    <option value="L">Lecture Only (L)</option>
                    <option value="T">Tutorial Only (T)</option>
                    <option value="P">Practical Only (P)</option>
                  </select>
                </div>
              </div>
              <button class="btn btn-primary" onclick="createOffering()">Create Course Offering</button>
              <div class="data-table-wrap" style="margin-top: 14px;">
                <table class="styled-table">
                  <thead><tr><th>Course</th><th>Faculty</th><th>Target</th><th>Comp</th></tr></thead>
                  <tbody id="offeringsTableBody"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- ADMIN TAB 3: VENUES & FACULTY -->
        <div id="adminTabVenues" class="admin-tab-pane" style="display: none;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
            <!-- Classroom / Lab Venues -->
            <div class="card-box">
              <h3 class="card-box-title">1. Classrooms & Lab Venues</h3>
              <p class="card-box-desc">Register university facilities with capacities and floor levels (D16).</p>
              <div class="form-grid">
                <div class="form-group">
                  <label>Room Number:</label>
                  <input type="text" id="roomNumberInput" class="form-control" placeholder="e.g. 101">
                </div>
                <div class="form-group">
                  <label>Building:</label>
                  <input type="text" id="roomBuildingInput" class="form-control" placeholder="Main Block">
                </div>
                <div class="form-group">
                  <label>Floor:</label>
                  <input type="number" id="roomFloorInput" class="form-control" value="1" min="0">
                </div>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Capacity:</label>
                  <input type="number" id="roomCapacityInput" class="form-control" value="60">
                </div>
                <div class="form-group">
                  <label>Room Type:</label>
                  <select id="roomTypeSelect" class="form-control">
                    <option value="LT">Lecture Hall / Tutorial (LT)</option>
                    <option value="P">Practical Lab (P)</option>
                  </select>
                </div>
              </div>
              <button class="btn btn-primary" onclick="saveRoom()">Register Room</button>
              <div class="data-table-wrap" style="margin-top: 14px;">
                <table class="styled-table">
                  <thead><tr><th>Room</th><th>Building</th><th>Fl</th><th>Cap</th><th>Type</th></tr></thead>
                  <tbody id="roomsTableBody"></tbody>
                </table>
              </div>
            </div>

            <!-- Faculty Teachers & Weekly Availability Matrix -->
            <div class="card-box">
              <h3 class="card-box-title">2. Faculty & Availability Matrix</h3>
              <p class="card-box-desc">Register instructors and toggle weekly slot availability.</p>
              <div class="form-grid">
                <div class="form-group">
                  <label>Full Name:</label>
                  <input type="text" id="teacherNameInput" class="form-control" placeholder="Dr. Jane Smith">
                </div>
                <div class="form-group">
                  <label>Employee ID:</label>
                  <input type="text" id="teacherEmpIdInput" class="form-control" placeholder="EMP-101">
                </div>
                <div class="form-group">
                  <label>Institutional Email:</label>
                  <input type="email" id="teacherEmailInput" class="form-control" placeholder="jsmith@university.edu">
                </div>
              </div>
              <button class="btn btn-primary" onclick="saveTeacher()">Register Faculty</button>
              <div class="data-table-wrap" style="margin-top: 14px;">
                <table class="styled-table">
                  <thead><tr><th>Name</th><th>EMP ID</th><th>Email</th></tr></thead>
                  <tbody id="teachersTableBody"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- ADMIN TAB 4: SOLVER & GENERATION CONSOLE -->
        <div id="adminTabSolver" class="admin-tab-pane" style="display: none;">
          <div class="card-box">
            <h3 class="card-box-title">⚙️ Google OR-Tools CP-SAT Solver Console</h3>
            <p class="card-box-desc">
              Compiles canonical timetable input package, calls local/hosted Python solver, and stages conflict-free drafts for administrative publication.
            </p>
            <div style="display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;">
              <button class="btn btn-primary" onclick="triggerGeneration()">🚀 Run CP-SAT Solver</button>
              <button class="btn btn-secondary" onclick="compilePackage()">📦 Compile JSON Package</button>
              <button class="btn btn-secondary" onclick="downloadPackage()">📥 Download Package</button>
            </div>
            <div id="generationStatusBox" style="background:#F8FAFC; border:1px solid var(--border); border-radius:12px; padding:16px; font-size:13px; color:var(--text-muted);">
              Ready to generate timetable draft.
            </div>
            
            <div id="stagedDraftsSection" style="margin-top: 24px;">
              <h4 style="font-size: 15px; margin-bottom: 12px; color: var(--text);">Staged Timetable Drafts Ready for Publication:</h4>
              <div id="stagedDraftsList">Loading drafts...</div>
            </div>
          </div>
        </div>

        <!-- ADMIN TAB 5: OPERATIONS & REVISIONS -->
        <div id="adminTabOperations" class="admin-tab-pane" style="display: none;">
          <div class="card-box">
            <h3 class="card-box-title">📋 Operations & Timetable Version Archive (D13, D40)</h3>
            <p class="card-box-desc">Audit retained timetable versions and restore previous conflict-free schedules.</p>
            <div class="data-table-wrap">
              <table class="styled-table">
                <thead><tr><th>Version</th><th>Term</th><th>Status</th><th>Published</th><th>Action</th></tr></thead>
                <tbody id="versionsTableBody"></tbody>
              </table>
            </div>

            <div style="margin-top: 24px;">
              <h4 style="font-size: 15px; margin-bottom: 10px; color: var(--text);">Pending Faculty Unavailability Requests:</h4>
              <div id="adminUnavailList">Loading requests...</div>
            </div>
          </div>
        </div>

        <!-- ADMIN TAB 6: USER PROVISIONING -->
        <div id="adminTabUsers" class="admin-tab-pane" style="display: none;">
          <div class="card-box">
            <h3 class="card-box-title">👥 User Account Provisioning & Roles</h3>
            <p class="card-box-desc">Directly provision accounts linked to Supabase Auth and authoritative profiles.</p>
            <div class="form-grid">
              <div class="form-group">
                <label>Role:</label>
                <select id="provRole" class="form-control" onchange="handleProvRoleChange()">
                  <option value="student">Student</option>
                  <option value="teacher">Teacher (Faculty)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div class="form-group">
                <label>Full Name:</label>
                <input type="text" id="provName" class="form-control" placeholder="Rohan Verma">
              </div>
              <div class="form-group">
                <label>Institutional Email:</label>
                <input type="email" id="provEmail" class="form-control" placeholder="rohan@university.edu">
              </div>
              <div class="form-group">
                <label>Entity ID / Roll No:</label>
                <input type="text" id="provEntityId" class="form-control" placeholder="2025BTECH101">
              </div>
              <div class="form-group">
                <label>Temporary Password:</label>
                <input type="text" id="provPassword" class="form-control" value="TempPass123!">
              </div>
            </div>

            <!-- Student Academic Enrollment Section -->
            <div id="provStudentEnrollmentFields" style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:12px; padding:16px; margin:16px 0;">
              <div style="font-weight: 700; color: #166534; font-size: 13px; margin-bottom: 8px;">
                🎓 Academic Enrollment (Assign Section & Batch for New Students)
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Assign Section:</label>
                  <select id="provStudentSection" class="form-control" onchange="handleProvSectionChange()"></select>
                </div>
                <div class="form-group">
                  <label>Assign Practical Batch:</label>
                  <select id="provStudentBatch" class="form-control"></select>
                </div>
                <div class="form-group">
                  <label>Optional Elective Group:</label>
                  <select id="provStudentElective" class="form-control"></select>
                </div>
              </div>
            </div>

            <button class="btn btn-primary" onclick="handleProvisionUser()">Provision User Account</button>
          </div>
        </div>

        <!-- ADMIN TAB 7: ROOM UTILIZATION MATRIX (Spec Page 6 Feature) -->
        <div id="adminTabMatrix" class="admin-tab-pane" style="display: none;">
          <div class="card-box">
            <h3 class="card-box-title">📊 Campus Room Utilization Matrix</h3>
            <p class="card-box-desc">Visualizes classroom usage across all 8 periods on the active day.</p>
            <div id="roomMatrixContainer">Loading matrix...</div>
          </div>
        </div>

      </div>

    </div>

  </main>

  <!-- ==================================================================== -->
  <!-- MODAL: LOGIN / AUTHENTICATION (Page 3 in Spec) -->
  <!-- ==================================================================== -->
  <div id="loginModal" class="modal-overlay">
    <div class="modal-card-custom" style="max-width: 720px; display: grid; grid-template-columns: 1fr 1fr;">
      
      <!-- Left Column: Form -->
      <div style="padding: 32px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
          <div class="logo-icon" style="width:32px; height:32px; font-size:16px;">📅</div>
          <div class="logo-text" style="font-size:18px;">TimeTable<span>+</span></div>
        </div>

        <h3 id="authModalTitle" style="font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 6px;">Sign In</h3>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">Access your verified university timetable.</p>

        <div id="modalAlertBox" style="display: none; padding: 10px; border-radius: 8px; margin-bottom: 14px; font-size: 12px; font-weight: 600;"></div>

        <div id="loginFormPane">
          <div class="form-group" style="margin-bottom: 12px;">
            <label>Institutional Email</label>
            <input type="email" id="loginEmail" class="form-control" value="admin@university.edu" placeholder="name@university.edu">
          </div>
          <div class="form-group" style="margin-bottom: 16px;">
            <label>Password</label>
            <input type="password" id="loginPassword" class="form-control" value="AdminPassword123!" placeholder="••••••••">
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <a href="javascript:void(0)" onclick="switchAuthPane('forgot')" style="font-size: 12px; color: var(--primary); text-decoration: none; font-weight: 600;">Forgot Password?</a>
            <span style="font-size: 11px; color: var(--text-muted);">Supabase Verified</span>
          </div>
          <button class="btn btn-primary" onclick="handleLogin()" style="width: 100%; padding: 11px;">Sign In to TimeTable+</button>
          
          <div style="margin-top: 16px; text-align: center; font-size: 12px; color: var(--text-muted);">
            Need access? Contact your university administrator.
          </div>
        </div>

        <div id="forgotFormPane" style="display: none;">
          <div class="form-group" style="margin-bottom: 16px;">
            <label>Institutional Email</label>
            <input type="email" id="forgotEmail" class="form-control" placeholder="name@university.edu">
          </div>
          <button class="btn btn-primary" onclick="handleForgotPassword()" style="width: 100%; padding: 11px; margin-bottom: 12px;">Dispatch Reset Link</button>
          <button class="btn btn-secondary" onclick="switchAuthPane('login')" style="width: 100%;">Back to Login</button>
        </div>
      </div>

      <!-- Right Column: Visual Graphic -->
      <div style="background: linear-gradient(135deg, #5842E3, #6C5CE7); color: #fff; padding: 32px; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
        <button onclick="closeLoginModal()" style="position: absolute; top: 16px; right: 16px; background: transparent; border: none; color: #fff; font-size: 22px; cursor: pointer;">&times;</button>
        
        <div>
          <span style="background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;">TimeTable+ Cloud</span>
          <h4 style="font-size: 24px; font-weight: 800; margin-top: 16px; line-height: 1.3;">One Smart System for the Whole Campus.</h4>
          <p style="font-size: 13px; opacity: 0.85; margin-top: 8px;">Seamlessly synchronizing thousands of student cohorts, faculty rooms, and contact hours in real time.</p>
        </div>

        <div style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 12px; font-size: 12px;">
          🔒 Enterprise Row-Level Security & Role Verification
        </div>
      </div>

    </div>
  </div>

  <!-- ==================================================================== -->
  <!-- DRAWER: OCCURRENCE DETAILS & OVERRIDE (Page 5 in Spec) -->
  <!-- ==================================================================== -->
  <div id="occurrenceDrawer" class="drawer-overlay" onclick="closeDrawer(event)">
    <div class="drawer-card" onclick="event.stopPropagation()">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-bottom: 20px;">
          <h3 style="font-size: 18px; font-weight: 700; color: var(--text);" id="drawerTitle">Class Session Details</h3>
          <button onclick="closeDrawer()" style="background: transparent; border: none; font-size: 24px; color: var(--text-muted); cursor: pointer;">&times;</button>
        </div>

        <div id="drawerBody">
          <!-- Populated dynamically -->
        </div>
      </div>

      <div style="border-top: 1px solid var(--border); padding-top: 20px; display: flex; flex-direction: column; gap: 8px;">
        <div id="drawerTeacherActions">
          <!-- Cancel / Reschedule buttons -->
        </div>
        <button class="btn btn-secondary" onclick="closeDrawer()" style="width: 100%;">Close Details</button>
      </div>
    </div>
  </div>

  <!-- Trademark Bottom Wave Graphical Divider -->
  <footer class="footer-wave-wrap">
    <svg class="footer-wave-svg" viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none">
      <path d="M0,20 C320,60 480,0 800,30 C1120,60 1280,10 1440,30 L1440,60 L0,60 Z" fill="#FFFFFF"></path>
    </svg>
    <div class="footer-text">
      <strong>TimeTable+</strong> • University Academic Scheduling Platform • Google OR-Tools CP-SAT Solver Integration
      <div style="margin-top: 4px; font-size: 12px;">Designed to the TimeTable+ SaaS Specification (D01–D50). ₹0 Prototype Target.</div>
    </div>
  </footer>

  <!-- ==================================================================== -->
  <!-- JAVASCRIPT LOGIC & STATE (100% Preserved & Enhanced) -->
  <!-- ==================================================================== -->
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
    let currentMainView = 'landing'; // 'landing', 'roles', 'dashboard'
    let currentState = {};
    let activeDayIndex = 0;
    let adminGroupBy = 'section';
    let adminFilterVal = 'all';

    const SUPABASE_URL = "${config?.supabaseUrl || ''}";
    const SUPABASE_ANON_KEY = "${config?.supabaseAnonKey || ''}";
    let realtimeEventSource = null;
    let supabaseChannelOccurrences = null;
    let supabaseChannelOutbox = null;

    // View Switching
    function switchView(viewName) {
      currentMainView = viewName;
      document.getElementById('landingView').style.display = viewName === 'landing' ? 'block' : 'none';
      document.getElementById('rolesView').style.display = viewName === 'roles' ? 'block' : 'none';
      document.getElementById('dashboardView').style.display = viewName === 'dashboard' ? 'block' : 'none';

      document.getElementById('navLinkHome')?.classList.toggle('active', viewName === 'landing');
      document.getElementById('navLinkDashboard')?.classList.toggle('active', viewName === 'dashboard');
      document.getElementById('navLinkRoleGate')?.classList.toggle('active', viewName === 'roles');

      if (viewName === 'dashboard') {
        renderSingleDayGrid();
        updateRoleViews();
      }
    }

    // Toast Helper
    function showMsg(message, isError) {
      const toast = document.getElementById('appToast');
      if (!toast) return;
      toast.className = 'toast-box ' + (isError ? 'toast-error' : 'toast-success');
      toast.innerHTML = (isError ? '⚠️ ' : '✅ ') + message;
      toast.style.display = 'flex';
      setTimeout(() => { toast.style.display = 'none'; }, 4000);
    }

    // Authenticated API request helper
    async function api(path, options) {
      options = options || {};
      options.headers = options.headers || {};
      options.headers['Content-Type'] = 'application/json';
      if (authToken) {
        options.headers['Authorization'] = 'Bearer ' + authToken;
      }
      const res = await fetch(path, options);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || ('Request failed (' + res.status + ')'));
      }
      return data;
    }

    // Real-Time Subscriptions
    function setupRealtime() {
      teardownRealtime();
      if (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
          const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
          supabaseChannelOccurrences = client.channel('public:class_occurrences')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'class_occurrences' }, () => handleRealtimeUpdate())
            .subscribe();
        } catch (e) {
          console.warn('[Realtime] Supabase warning:', e);
        }
      }

      if (window.EventSource) {
        try {
          realtimeEventSource = new EventSource('/api/realtime/stream');
          realtimeEventSource.onmessage = function(e) {
            try {
              const event = JSON.parse(e.data);
              if (event.type === 'OCCURRENCE_MUTATED' || event.type === 'TIMETABLE_PUBLISHED') {
                handleRealtimeUpdate();
              }
            } catch (err) {}
          };
        } catch (e) {
          console.warn('[Realtime] SSE warning:', e);
        }
      }
    }

    function teardownRealtime() {
      if (realtimeEventSource) { try { realtimeEventSource.close(); } catch {} realtimeEventSource = null; }
      if (supabaseChannelOccurrences) { try { supabaseChannelOccurrences.unsubscribe(); } catch {} supabaseChannelOccurrences = null; }
    }

    let debounceTimer = null;
    function handleRealtimeUpdate() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadState().then(() => showMsg('⚡ Timetable updated in real time.', false));
      }, 300);
    }

    // Role Switching
    function selectRole(role) {
      currentRole = role;
      const select = document.getElementById('quickRoleSelect');
      if (select) select.value = role;

      document.getElementById('roleCardStudent')?.classList.toggle('active', role === 'student');
      document.getElementById('roleCardTeacher')?.classList.toggle('active', role === 'teacher');
      document.getElementById('roleCardAdmin')?.classList.toggle('active', role === 'admin');

      updateRoleViews();
      renderSingleDayGrid();
    }

    function updateRoleViews() {
      const studentPanels = document.getElementById('studentViewPanels');
      const teacherPanels = document.getElementById('teacherViewPanels');
      const adminPanels = document.getElementById('adminViewPanels');
      const adminToolbar = document.getElementById('adminFiltersToolbar');

      if (studentPanels) studentPanels.style.display = currentRole === 'student' ? 'block' : 'none';
      if (teacherPanels) teacherPanels.style.display = currentRole === 'teacher' ? 'block' : 'none';
      if (adminPanels) adminPanels.style.display = currentRole === 'admin' ? 'block' : 'none';
      if (adminToolbar) adminToolbar.style.display = currentRole === 'admin' ? 'block' : 'none';

      if (currentRole === 'student') renderStudentInbox();
      if (currentRole === 'teacher') runEmptyRoomFinder();
      if (currentRole === 'admin') renderRoomMatrix();
    }

    // Day Cycling
    function setDay(index) {
      activeDayIndex = Math.max(0, Math.min(DAYS.length - 1, index));
      for (let i = 0; i < DAYS.length; i++) {
        const pill = document.getElementById('dayPill' + i);
        if (pill) pill.className = 'day-pill ' + (i === activeDayIndex ? 'active' : '');
      }
      const dayObj = DAYS[activeDayIndex];
      const text = document.getElementById('activeDayText');
      if (text) text.innerHTML = '📅 ' + dayObj.name + ' • September ' + dayObj.date.split('-')[2] + ', 2026';
      renderSingleDayGrid();
      if (currentRole === 'teacher') runEmptyRoomFinder();
      if (currentRole === 'admin') renderRoomMatrix();
    }

    function prevDay() { if (activeDayIndex > 0) setDay(activeDayIndex - 1); }
    function nextDay() { if (activeDayIndex < DAYS.length - 1) setDay(activeDayIndex + 1); }

    // Load Complete Campus State
    async function loadState() {
      try {
        const res = await fetch('/api/state');
        currentState = await res.json();
        
        // Populate Metric counters
        document.getElementById('metricTerms').textContent = (currentState.academicTerms || []).length;
        document.getElementById('metricRooms').textContent = (currentState.rooms || []).length;
        document.getElementById('metricTeachers').textContent = (currentState.teachers || []).length;
        document.getElementById('metricSections').textContent = (currentState.sections || []).length;
        document.getElementById('metricTimetables').textContent = (currentState.timetableVersions || []).filter(v => v.status === 'published').length;

        populateFormDropdowns();
        renderAdminTables();
        renderSingleDayGrid();
        renderStagedDraftsReview();
      } catch (err) {
        showMsg('Failed to load state: ' + err.message, true);
      }
    }

    // Grid Rendering
    function renderSingleDayGrid() {
      const container = document.getElementById('timetableGridWrapper');
      if (!container) return;

      const activeDay = DAYS[activeDayIndex];
      const allOccurrences = currentState.classOccurrences || [];
      const scheduledClasses = currentState.scheduledClasses || [];

      const roomsMap = new Map((currentState.rooms || []).map(r => [r.id, r]));
      const teachersMap = new Map((currentState.teachers || []).map(t => [t.id, t]));
      const coursesMap = new Map((currentState.courses || []).map(c => [c.id, c]));
      const sectionsMap = new Map((currentState.sections || []).map(s => [s.id, s]));
      const batchesMap = new Map((currentState.batches || []).map(b => [b.id, b]));
      const offeringsMap = new Map((currentState.courseOfferings || []).map(o => [o.id, o]));

      // Filter active non-superseded occurrences for the day
      let dayOccs = allOccurrences.filter(o => o.date === activeDay.date && o.status !== 'superseded');
      if (dayOccs.length === 0) {
        dayOccs = allOccurrences.filter(o => o.dayOfWeek === activeDay.dayOfWeek && o.status !== 'superseded');
      }
      if (dayOccs.length === 0 && scheduledClasses.length > 0) {
        dayOccs = scheduledClasses.filter(c => c.dayOfWeek === activeDay.dayOfWeek).map(c => ({
          ...c, date: activeDay.date, status: 'scheduled'
        }));
      }

      let rowsToRender = [];

      if (currentRole === 'student') {
        const studentEntity = (currentUser && currentUser.role === 'student' && currentUser.entityId) ? currentUser.entityId : 'stud-1';
        const studentObj = (currentState.students || []).find(s => s.id === studentEntity || s.rollNumber === studentEntity);
        const studentId = studentObj ? studentObj.id : studentEntity;
        const studentName = (currentUser && currentUser.role === 'student') ? (currentUser.fullName || studentObj?.name || currentUser.email) : (studentObj ? studentObj.name : 'Charlie Brown');
        const rollLabel = studentObj ? studentObj.rollNumber : studentId;

        const studentSections = new Set();
        const studentBatches = new Set();
        const studentElectives = new Set();

        (currentState.studentGroupMemberships || []).filter(m => {
          if (m.studentId !== studentId) return false;
          if (m.effectiveStartDate && m.effectiveStartDate > activeDay.date) return false;
          if (m.effectiveEndDate && m.effectiveEndDate < activeDay.date) return false;
          return true;
        }).forEach(m => {
          if (m.groupType === 'section') studentSections.add(m.groupId);
          if (m.groupType === 'batch') studentBatches.add(m.groupId);
        });
        if (studentSections.size === 0) studentSections.add('sec-A');
        if (studentBatches.size === 0) studentBatches.add('batch-A1');

        (currentState.electiveAssignments || []).filter(ea => ea.studentId === studentId && ea.status === 'active').forEach(ea => {
          studentElectives.add(ea.electiveGroupId);
        });

        const studentOccs = dayOccs.filter(o => {
          if (o.targetType === 'section') return studentSections.has(o.targetId);
          if (o.targetType === 'batch') return studentBatches.has(o.targetId);
          if (o.targetType === 'elective_group') return studentElectives.has(o.targetId);
          return false;
        });

        // Update profile labels
        document.getElementById('studentProfileName').textContent = studentName;
        document.getElementById('studentProfileMeta').textContent = 'Roll ' + rollLabel;
        document.getElementById('stdSecLabel').textContent = Array.from(studentSections).join(', ');
        document.getElementById('stdBatchLabel').textContent = Array.from(studentBatches).join(', ');

        rowsToRender.push({
          label: studentName + '<br><small style="color:var(--text-muted); font-weight:normal;">' + Array.from(studentSections).join(', ') + ' • ' + Array.from(studentBatches).join(', ') + '</small>',
          occurrences: studentOccs
        });

      } else if (currentRole === 'teacher') {
        const teacherEntity = (currentUser && currentUser.role === 'teacher' && currentUser.entityId) ? currentUser.entityId : 't-1';
        const teacherObj = (currentState.teachers || []).find(t => t.id === teacherEntity);
        const teacherName = teacherObj ? teacherObj.name : 'Dr. Faculty Instructor';
        const teacherEmpId = teacherObj ? teacherObj.empId : teacherEntity;
        const teacherOccs = dayOccs.filter(o => o.teacherId === teacherEntity);

        rowsToRender.push({
          label: teacherName + '<br><small style="color:var(--text-muted); font-weight:normal;">' + teacherEmpId + '</small>',
          occurrences: teacherOccs
        });

      } else {
        // Admin View
        if (adminGroupBy === 'section') {
          let sections = currentState.sections || [];
          if (adminFilterVal !== 'all') sections = sections.filter(s => s.id === adminFilterVal);
          sections.forEach(sec => {
            const secOccs = dayOccs.filter(o => {
              if (o.targetType === 'section' && o.targetId === sec.id) return true;
              if (o.targetType === 'batch') {
                const b = batchesMap.get(o.targetId);
                return b && b.sectionId === sec.id;
              }
              return false;
            });
            rowsToRender.push({ label: sec.name, occurrences: secOccs });
          });
        } else if (adminGroupBy === 'room') {
          let rooms = currentState.rooms || [];
          if (adminFilterVal !== 'all') rooms = rooms.filter(r => r.id === adminFilterVal);
          rooms.forEach(r => {
            const rOccs = dayOccs.filter(o => o.roomId === r.id);
            rowsToRender.push({ label: 'Room ' + r.roomNumber + '<br><small style="color:var(--text-muted);">' + r.building + '</small>', occurrences: rOccs });
          });
        } else if (adminGroupBy === 'teacher') {
          let teachers = currentState.teachers || [];
          if (adminFilterVal !== 'all') teachers = teachers.filter(t => t.id === adminFilterVal);
          teachers.forEach(t => {
            const tOccs = dayOccs.filter(o => o.teacherId === t.id);
            rowsToRender.push({ label: t.name, occurrences: tOccs });
          });
        }
      }

      // Build HTML Table
      let html = '<table class="tt-grid"><thead><tr>';
      html += '<th class="col-track">Cohort / Track</th>';
      PERIODS.forEach(p => {
        const thClass = p.isLunch ? 'col-period col-lunch' : 'col-period';
        html += '<th class="' + thClass + '">' + p.label + '<span class="th-time">' + p.time + '</span></th>';
      });
      html += '</tr></thead><tbody>';

      if (rowsToRender.length === 0) {
        html += '<tr><td colspan="9" style="text-align:center; padding:32px; color:var(--text-muted);">No scheduled tracks match the current filter.</td></tr>';
      }

      rowsToRender.forEach(row => {
        html += '<tr>';
        html += '<td class="cell-track">' + row.label + '</td>';

        let slot = 1;
        while (slot <= 8) {
          if (slot === 4) {
            html += '<td class="slot-lunch-break"><div style="font-size:16px;">🍱</div><strong style="color:var(--accent-amber); font-size:11px;">Lunch Break</strong><div style="font-size:10px; color:var(--accent-amber); opacity:0.8;">Non-teaching (DEC-04)</div></td>';
            slot++;
            continue;
          }

          const slotOccs = row.occurrences.filter(o => o.startSlot === slot);

          if (slotOccs.length === 0) {
            html += '<td class="slot-free">';
            html += '<span style="font-size:11px;">Free Slot</span>';
            if (currentRole === 'teacher') {
              html += '<br><button class="btn btn-secondary" style="padding:2px 8px; font-size:10px; margin-top:4px;" onclick="quickBookTeacherSlot(' + slot + ')">+ Extra</button>';
            }
            html += '</td>';
            slot++;
          } else {
            const isTwoSlotLab = slotOccs.some(o => o.duration === 2 || o.activityType === 'P');
            const colspan = isTwoSlotLab ? ' colspan="2"' : '';

            html += '<td' + colspan + '>';
            slotOccs.forEach(o => {
              html += renderOccurrenceCard(o, roomsMap, teachersMap, coursesMap, offeringsMap);
            });
            html += '</td>';
            slot += isTwoSlotLab ? 2 : 1;
          }
        }

        html += '</tr>';
      });

      html += '</tbody></table>';
      container.innerHTML = html;
    }

    // Render individual occurrence card
    function renderOccurrenceCard(o, roomsMap, teachersMap, coursesMap, offeringsMap) {
      const offering = offeringsMap.get(o.courseOfferingId);
      const course = offering ? coursesMap.get(offering.courseId) : null;
      const courseCode = course ? course.code : 'CS201';
      const courseName = course ? course.name : 'Data Structures';
      const teacher = teachersMap.get(o.teacherId);
      const teacherName = teacher ? teacher.name : o.teacherId;
      const room = roomsMap.get(o.roomId) || { roomNumber: o.roomId, building: 'Main Block', floor: 1 };

      const isCancelled = o.status === 'cancelled';
      let cardClass = 'class-lecture';
      let badgeClass = 'badge-pill-lec';
      let badgeLabel = 'LECTURE (L) • 1H';

      if (o.activityType === 'P' || o.duration === 2) {
        cardClass = 'class-practical';
        badgeClass = 'badge-pill-lab';
        badgeLabel = 'PRACTICAL (P) • 2H';
      } else if (o.activityType === 'T') {
        cardClass = 'class-tutorial';
        badgeClass = 'badge-pill-tut';
        badgeLabel = 'TUTORIAL (T) • 1H';
      } else if (o.isExtraClass) {
        cardClass = 'class-extra';
        badgeClass = 'badge-pill-extra';
        badgeLabel = 'EXTRA CLASS';
      }

      if (isCancelled) {
        cardClass = 'class-cancelled';
        badgeClass = 'badge-pill-cancel';
        badgeLabel = 'CANCELLED';
      }

      return '<div class="class-card ' + cardClass + '" onclick="openDrawer(\\'' + o.id + '\\')">' +
        '<div>' +
          '<span class="badge-pill ' + badgeClass + '">' + badgeLabel + '</span>' +
          '<div class="class-code">' + courseCode + ' ' + (isCancelled ? '<span style="text-decoration:line-through;">' + courseName + '</span>' : courseName) + '</div>' +
          '<div class="class-meta">📍 Room ' + room.roomNumber + ' (' + room.building + ')</div>' +
          '<div class="class-meta">🧑‍🏫 ' + teacherName + '</div>' +
        '</div>' +
        (isCancelled && o.cancellationReason ? '<div style="font-size:10px; color:#DC2626; font-style:italic; margin-top:4px;">Reason: ' + o.cancellationReason + '</div>' : '') +
      '</div>';
    }

    // Occurrence Details Drawer (Page 5 Spec Requirement)
    function openDrawer(occId) {
      const occ = (currentState.classOccurrences || []).find(o => o.id === occId);
      if (!occ) return;

      const offeringsMap = new Map((currentState.courseOfferings || []).map(o => [o.id, o]));
      const coursesMap = new Map((currentState.courses || []).map(c => [c.id, c]));
      const roomsMap = new Map((currentState.rooms || []).map(r => [r.id, r]));
      const teachersMap = new Map((currentState.teachers || []).map(t => [t.id, t]));

      const offering = offeringsMap.get(occ.courseOfferingId);
      const course = offering ? coursesMap.get(offering.courseId) : null;
      const room = roomsMap.get(occ.roomId);
      const teacher = teachersMap.get(occ.teacherId);

      document.getElementById('drawerTitle').textContent = (course ? course.code + ' — ' + course.name : 'Session Details');

      let bodyHtml = '<div style="font-size:13px; line-height:1.7;">' +
        '<div style="margin-bottom:12px;"><strong>Activity Type:</strong> ' + (occ.activityType === 'P' ? 'Practical Lab (2 consecutive hours)' : occ.activityType === 'T' ? 'Tutorial' : 'Lecture') + '</div>' +
        '<div style="margin-bottom:12px;"><strong>Venue:</strong> Room ' + (room ? room.roomNumber + ' (' + room.building + ', Floor ' + room.floor + ')' : occ.roomId) + '</div>' +
        '<div style="margin-bottom:12px;"><strong>Instructor:</strong> ' + (teacher ? teacher.name + ' (' + teacher.empId + ')' : occ.teacherId) + '</div>' +
        '<div style="margin-bottom:12px;"><strong>Target Cohort:</strong> ' + occ.targetType.toUpperCase() + ' ' + occ.targetId + '</div>' +
        '<div style="margin-bottom:12px;"><strong>Current Status:</strong> <span class="status-badge ' + (occ.status === 'scheduled' ? 'status-badge-published' : 'status-badge-superseded') + '">' + occ.status.toUpperCase() + '</span></div>' +
      '</div>';

      document.getElementById('drawerBody').innerHTML = bodyHtml;

      const actionsEl = document.getElementById('drawerTeacherActions');
      if (currentRole === 'teacher' || currentRole === 'admin') {
        if (occ.status === 'scheduled') {
          actionsEl.innerHTML = '<div style="display:flex; gap:8px;">' +
            '<button class="btn btn-outline-danger" style="flex:1;" onclick="cancelOccurrencePrompt(\\'' + occ.id + '\\')">Cancel Session</button>' +
            '<button class="btn btn-primary" style="flex:1;" onclick="rescheduleOccurrencePrompt(\\'' + occ.id + '\\')">Reschedule</button>' +
          '</div>';
        } else {
          actionsEl.innerHTML = '<div style="font-size:12px; color:var(--text-muted); text-align:center;">This occurrence is already cancelled.</div>';
        }
      } else {
        actionsEl.innerHTML = '';
      }

      document.getElementById('occurrenceDrawer').style.display = 'flex';
    }

    function closeDrawer() {
      document.getElementById('occurrenceDrawer').style.display = 'none';
    }

    // Prompt cancel occurrence with reason
    async function cancelOccurrencePrompt(occId) {
      const reason = prompt('Please enter a cancellation reason for students:');
      if (reason === null) return;
      try {
        await api('/api/classes/occurrences/' + occId + '/cancel', {
          method: 'POST',
          body: JSON.stringify({ reason: reason || 'Faculty operational leave' })
        });
        showMsg('Class occurrence cancelled. Students notified instantly.', false);
        closeDrawer();
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    // Prompt reschedule occurrence
    async function rescheduleOccurrencePrompt(occId) {
      const newDate = prompt('Enter new date (YYYY-MM-DD):', '2026-09-08');
      if (!newDate) return;
      const newSlot = prompt('Enter new period slot index (1 to 8):', '2');
      if (!newSlot) return;

      try {
        await api('/api/classes/occurrences/' + occId + '/reschedule', {
          method: 'POST',
          body: JSON.stringify({
            date: newDate,
            dayOfWeek: new Date(newDate).getDay() === 0 ? 7 : new Date(newDate).getDay(),
            startSlot: parseInt(newSlot, 10)
          })
        });
        showMsg('Occurrence rescheduled successfully.', false);
        closeDrawer();
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    // Empty Classroom Finder (Spec Page 5)
    function runEmptyRoomFinder() {
      const slot = parseInt(document.getElementById('finderSlotSelect')?.value || '1', 10);
      const activeDay = DAYS[activeDayIndex];
      const rooms = currentState.rooms || [];
      const occs = (currentState.classOccurrences || []).filter(o => o.date === activeDay.date && o.status === 'scheduled');

      const occupiedRooms = new Set();
      occs.forEach(o => {
        const occEnd = o.startSlot + o.duration - 1;
        if (slot >= o.startSlot && slot <= occEnd) {
          occupiedRooms.add(o.roomId);
        }
      });

      const freeRooms = rooms.filter(r => !occupiedRooms.has(r.id));
      const resEl = document.getElementById('finderResults');
      if (!resEl) return;

      if (freeRooms.length === 0) {
        resEl.innerHTML = '<span style="color:#DC2626;">No free rooms found during Period ' + slot + '.</span>';
      } else {
        let html = '<div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">';
        freeRooms.forEach(r => {
          html += '<span style="background:var(--accent-emerald-light); color:#047857; border:1px solid #A7F3D0; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:700;">' +
            'Room ' + r.roomNumber + ' (' + r.building + ', Cap ' + r.capacity + ')' +
          '</span>';
        });
        html += '</div>';
        resEl.innerHTML = '<strong>' + freeRooms.length + ' Free Rooms Available on ' + activeDay.name + ' Period ' + slot + ':</strong>' + html;
      }
    }

    // Room Utilization Matrix (Spec Page 6)
    function renderRoomMatrix() {
      const container = document.getElementById('roomMatrixContainer');
      if (!container) return;
      const activeDay = DAYS[activeDayIndex];
      const rooms = currentState.rooms || [];
      const occs = (currentState.classOccurrences || []).filter(o => o.date === activeDay.date && o.status === 'scheduled');

      let html = '<table class="styled-table" style="font-size:12px;"><thead><tr><th>Room Venue</th>';
      for (let s = 1; s <= 8; s++) {
        html += '<th style="text-align:center;">P' + s + (s === 4 ? ' (Lunch)' : '') + '</th>';
      }
      html += '</tr></thead><tbody>';

      rooms.forEach(r => {
        html += '<tr><td><strong>Room ' + r.roomNumber + '</strong> (' + r.building + ')</td>';
        for (let s = 1; s <= 8; s++) {
          if (s === 4) {
            html += '<td style="background:#FFFBEB; text-align:center; color:#D97706; font-size:10px;">Lunch</td>';
            continue;
          }
          const occInSlot = occs.find(o => o.roomId === r.id && s >= o.startSlot && s <= (o.startSlot + o.duration - 1));
          if (occInSlot) {
            html += '<td style="background:#EDE9FE; color:#5842E3; text-align:center; font-weight:700; font-size:10px;">BUSY</td>';
          } else {
            html += '<td style="background:#ECFDF5; color:#059669; text-align:center; font-size:10px;">FREE</td>';
          }
        }
        html += '</tr>';
      });

      html += '</tbody></table>';
      container.innerHTML = html;
    }

    // Admin Tab Navigation
    function switchAdminTab(tabKey) {
      const tabs = ['hierarchy', 'courses', 'venues', 'solver', 'operations', 'users', 'matrix'];
      tabs.forEach(k => {
        const pane = document.getElementById('adminTab' + k.charAt(0).toUpperCase() + k.slice(1));
        const btn = document.getElementById('tabBtn' + k.charAt(0).toUpperCase() + k.slice(1));
        if (pane) pane.style.display = k === tabKey ? 'block' : 'none';
        if (btn) btn.className = 'admin-pill-btn ' + (k === tabKey ? 'active' : '');
      });
      if (tabKey === 'matrix') renderRoomMatrix();
    }

    // Auth & Login Modal
    function openLoginModal() {
      const modal = document.getElementById('loginModal');
      if (modal) { modal.style.display = 'flex'; switchAuthPane('login'); }
    }
    function closeLoginModal() {
      const modal = document.getElementById('loginModal');
      if (modal) modal.style.display = 'none';
    }
    function switchAuthPane(pane) {
      document.getElementById('loginFormPane').style.display = pane === 'login' ? 'block' : 'none';
      document.getElementById('forgotFormPane').style.display = pane === 'forgot' ? 'block' : 'none';
      document.getElementById('authModalTitle').textContent = pane === 'login' ? 'Sign In to TimeTable+' : 'Password Recovery';
    }

    async function handleLogin() {
      const email = document.getElementById('loginEmail')?.value;
      const password = document.getElementById('loginPassword')?.value;
      const alertBox = document.getElementById('modalAlertBox');

      if (!email || !password) {
        if (alertBox) {
          alertBox.textContent = 'Please enter both email and password.';
          alertBox.style.background = '#FEF2F2';
          alertBox.style.color = '#DC2626';
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
        if (!res.ok || !data.success) throw new Error(data.message || 'Login failed');

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('timetable_auth_token', authToken);

        closeLoginModal();
        updateAuthNav();
        selectRole(currentUser.role);
        switchView('dashboard');
        showMsg('Signed in successfully as ' + currentUser.fullName, false);
        await loadState();
      } catch (err) {
        if (alertBox) {
          alertBox.textContent = err.message;
          alertBox.style.background = '#FEF2F2';
          alertBox.style.color = '#DC2626';
          alertBox.style.display = 'block';
        }
      }
    }

    function handleLogout() {
      authToken = '';
      currentUser = null;
      localStorage.removeItem('timetable_auth_token');
      updateAuthNav();
      switchView('landing');
      showMsg('Logged out successfully.', false);
    }

    async function handleForgotPassword() {
      const email = document.getElementById('forgotEmail')?.value;
      if (!email) { showMsg('Please enter your institutional email.', true); return; }
      try {
        await api('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
        showMsg('If the account exists, a reset link has been dispatched.', false);
        switchAuthPane('login');
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    function updateAuthNav() {
      const unauth = document.getElementById('unauthNav');
      const auth = document.getElementById('authNav');
      const roleBadge = document.getElementById('navRoleBadge');
      const userName = document.getElementById('navUserName');

      if (currentUser && authToken) {
        if (unauth) unauth.style.display = 'none';
        if (auth) auth.style.display = 'flex';
        if (roleBadge) {
          const icons = { admin: '👑 Admin', teacher: '🧑‍🏫 Faculty', student: '🎓 Student' };
          roleBadge.textContent = icons[currentUser.role] || currentUser.role;
        }
        if (userName) userName.textContent = currentUser.fullName || currentUser.email;
      } else {
        if (unauth) unauth.style.display = 'flex';
        if (auth) auth.style.display = 'none';
      }
    }

    // Student Inbox Notifications
    function renderStudentInbox() {
      const inboxEl = document.getElementById('studentInbox');
      if (!inboxEl) return;
      const targetStudent = (currentUser && currentUser.role === 'student' && currentUser.entityId) ? currentUser.entityId : 'stud-1';
      const notifications = (currentState.notifications || []).filter(n => !n.recipientStudentId || n.recipientStudentId === targetStudent);

      if (notifications.length === 0) {
        inboxEl.innerHTML = '<div style="font-size:13px; color:var(--text-muted); padding:10px 0;">✨ All caught up! No unread notifications.</div>';
        return;
      }

      let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
      notifications.slice(-6).reverse().forEach(n => {
        html += '<div style="background:#F8FAFC; border:1px solid var(--border); border-left:3px solid var(--primary); padding:10px 12px; border-radius:8px; font-size:12px;">' +
          '<div style="font-weight:700; color:var(--text);">' + n.title + '</div>' +
          '<div style="color:var(--text-muted); margin-top:2px;">' + n.message + '</div>' +
          '<div style="font-size:10px; color:#94A3B8; margin-top:4px;">' + new Date(n.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) + '</div>' +
        '</div>';
      });
      html += '</div>';
      inboxEl.innerHTML = html;
    }

    // Student Password Change
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

    // Populate Dropdowns in Admin & Teacher panels
    function populateFormDropdowns() {
      const terms = currentState.academicTerms || [];
      const sections = currentState.sections || [];
      const teachers = currentState.teachers || [];
      const courses = currentState.courses || [];

      // Sec Term Select
      const secTerm = document.getElementById('secTermSelect');
      if (secTerm) secTerm.innerHTML = terms.map(t => '<option value="' + t.id + '">' + t.yearLabel + ' (Sem ' + t.semesterNumber + ')</option>').join('');

      // Batch Sec Select
      const batchSec = document.getElementById('batchSecSelect');
      if (batchSec) batchSec.innerHTML = sections.map(s => '<option value="' + s.id + '">' + s.name + '</option>').join('');

      // Course Term Select
      const courseTerm = document.getElementById('courseTermSelect');
      if (courseTerm) courseTerm.innerHTML = terms.map(t => '<option value="' + t.id + '">' + t.yearLabel + ' (Sem ' + t.semesterNumber + ')</option>').join('');

      // Offering Selects
      const offCourse = document.getElementById('offCourseSelect');
      if (offCourse) offCourse.innerHTML = courses.map(c => '<option value="' + c.id + '">' + c.code + ': ' + c.name + '</option>').join('');

      const offTeacher = document.getElementById('offTeacherSelect');
      if (offTeacher) offTeacher.innerHTML = teachers.map(t => '<option value="' + t.id + '">' + t.name + ' (' + t.empId + ')</option>').join('');

      handleOffTargetTypeChange();
      renderProvisioningEntityOptions();
    }

    function handleOffTargetTypeChange() {
      const type = document.getElementById('offTargetType')?.value || 'section';
      const sel = document.getElementById('offTargetIdSelect');
      if (!sel) return;

      if (type === 'section') {
        sel.innerHTML = (currentState.sections || []).map(s => '<option value="' + s.id + '">' + s.name + '</option>').join('');
      } else if (type === 'batch') {
        sel.innerHTML = (currentState.batches || []).map(b => '<option value="' + b.id + '">' + b.name + '</option>').join('');
      } else {
        sel.innerHTML = '<option value="elg-ai">Applied Machine Learning</option><option value="elg-cloud">Cloud Computing</option>';
      }
    }

    function handleProvRoleChange() {
      const role = document.getElementById('provRole')?.value;
      const enrollmentFields = document.getElementById('provStudentEnrollmentFields');
      if (enrollmentFields) enrollmentFields.style.display = role === 'student' ? 'block' : 'none';
    }

    function renderProvisioningEntityOptions() {
      const secSel = document.getElementById('provStudentSection');
      if (secSel) secSel.innerHTML = (currentState.sections || []).map(s => '<option value="' + s.id + '">' + s.name + '</option>').join('');
      handleProvSectionChange();
    }

    function handleProvSectionChange() {
      const secId = document.getElementById('provStudentSection')?.value;
      const batchSel = document.getElementById('provStudentBatch');
      if (!batchSel) return;
      const batches = (currentState.batches || []).filter(b => !secId || b.sectionId === secId);
      batchSel.innerHTML = batches.map(b => '<option value="' + b.id + '">' + b.name + '</option>').join('');

      const elecSel = document.getElementById('provStudentElective');
      if (elecSel) elecSel.innerHTML = '<option value="">-- No Elective / Core Only --</option><option value="elg-ai">Applied Machine Learning</option><option value="elg-cloud">Cloud Systems</option>';
    }

    // User Provisioning (Admin)
    async function handleProvisionUser() {
      const name = document.getElementById('provName')?.value.trim();
      const email = document.getElementById('provEmail')?.value.trim();
      const role = document.getElementById('provRole')?.value;
      const entityId = document.getElementById('provEntityId')?.value.trim();
      const password = document.getElementById('provPassword')?.value;

      if (!name || !email || !role) {
        showMsg('Please provide Name, Email, and Role.', true);
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

      try {
        const data = await api('/api/auth/admin/provision-user', {
          method: 'POST',
          body: JSON.stringify({
            name, email, role,
            entityId: entityId || (studentDetails ? studentDetails.rollNumber : undefined),
            password, studentDetails
          })
        });

        showMsg('User ' + data.user.fullName + ' provisioned successfully as ' + data.user.role + '!', false);
        if (document.getElementById('provName')) document.getElementById('provName').value = '';
        if (document.getElementById('provEmail')) document.getElementById('provEmail').value = '';
        if (document.getElementById('provEntityId')) document.getElementById('provEntityId').value = '';
        await loadState();
      } catch (err) {
        showMsg(err.message, true);
      }
    }

    // Admin Entity Management Actions
    async function saveAcademicTerm() {
      try {
        await api('/api/academic/terms', {
          method: 'POST',
          body: JSON.stringify({
            yearLabel: document.getElementById('termYearLabel')?.value,
            semesterNumber: parseInt(document.getElementById('termSemesterNum')?.value, 10),
            cycle: document.getElementById('termCycle')?.value,
            status: 'active'
          })
        });
        showMsg('Academic Term created.', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    async function createSection() {
      try {
        await api('/api/academic/sections', {
          method: 'POST',
          body: JSON.stringify({
            termId: document.getElementById('secTermSelect')?.value,
            name: document.getElementById('secNameInput')?.value,
            expectedCount: parseInt(document.getElementById('secCohortSizeInput')?.value, 10)
          })
        });
        showMsg('Section created.', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    async function createBatch() {
      try {
        await api('/api/academic/batches', {
          method: 'POST',
          body: JSON.stringify({
            sectionId: document.getElementById('batchSecSelect')?.value,
            name: document.getElementById('batchNameInput')?.value,
            expectedCount: parseInt(document.getElementById('batchCountInput')?.value, 10)
          })
        });
        showMsg('Practical Batch created.', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    function validateCourseHours() {
      const pHours = parseInt(document.getElementById('coursePHours')?.value || '0', 10);
      const warn = document.getElementById('oddPracticalWarning');
      if (warn) warn.style.display = (pHours % 2 !== 0) ? 'block' : 'none';
    }

    async function saveCourse() {
      const pHours = parseInt(document.getElementById('coursePHours')?.value, 10);
      if (pHours % 2 !== 0) {
        showMsg('ERR_ODD_P_HOURS: Practical hours must be even (2 slots/session).', true);
        return;
      }
      try {
        await api('/api/catalog/courses', {
          method: 'POST',
          body: JSON.stringify({
            code: document.getElementById('courseCodeInput')?.value,
            name: document.getElementById('courseNameInput')?.value,
            termId: document.getElementById('courseTermSelect')?.value,
            lectureHours: parseInt(document.getElementById('courseLHours')?.value, 10),
            tutorialHours: parseInt(document.getElementById('courseTHours')?.value, 10),
            practicalHours: pHours,
            requiredRoomType: document.getElementById('courseVenueType')?.value
          })
        });
        showMsg('Course registered successfully.', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    async function createOffering() {
      try {
        await api('/api/catalog/offerings', {
          method: 'POST',
          body: JSON.stringify({
            courseId: document.getElementById('offCourseSelect')?.value,
            teacherId: document.getElementById('offTeacherSelect')?.value,
            targetType: document.getElementById('offTargetType')?.value,
            targetId: document.getElementById('offTargetIdSelect')?.value,
            component: document.getElementById('offComponentSelect')?.value || undefined
          })
        });
        showMsg('Course Offering mapped.', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    async function saveRoom() {
      try {
        await api('/api/resources/rooms', {
          method: 'POST',
          body: JSON.stringify({
            roomNumber: document.getElementById('roomNumberInput')?.value,
            building: document.getElementById('roomBuildingInput')?.value,
            floor: parseInt(document.getElementById('roomFloorInput')?.value, 10),
            capacity: parseInt(document.getElementById('roomCapacityInput')?.value, 10),
            roomType: document.getElementById('roomTypeSelect')?.value
          })
        });
        showMsg('Venue registered.', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    async function saveTeacher() {
      try {
        await api('/api/resources/teachers', {
          method: 'POST',
          body: JSON.stringify({
            name: document.getElementById('teacherNameInput')?.value,
            empId: document.getElementById('teacherEmpIdInput')?.value,
            email: document.getElementById('teacherEmailInput')?.value
          })
        });
        showMsg('Faculty registered.', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    // Solver Actions
    async function triggerGeneration() {
      const statusBox = document.getElementById('generationStatusBox');
      if (statusBox) statusBox.innerHTML = '⚡ Invoking Python CP-SAT solver...';
      try {
        const terms = (currentState.academicTerms || []).map(t => t.id);
        const data = await api('/api/generation/request', {
          method: 'POST',
          body: JSON.stringify({ termIds: terms })
        });
        if (data.status === 'optimal' || data.status === 'feasible') {
          if (statusBox) statusBox.innerHTML = '<span style="color:#059669; font-weight:700;">✅ Solver Optimal (' + (data.solveTimeMs || 250) + 'ms): ' + data.classesCount + ' classes staged as draft Version ' + data.draftVersionNumber + '!</span>';
          showMsg('Solver succeeded. Staged draft ready for publication.', false);
          await loadState();
        } else {
          if (statusBox) statusBox.innerHTML = '<span style="color:#DC2626;">❌ Infeasible: ' + (data.message || data.error) + '</span>';
        }
      } catch (err) {
        if (statusBox) statusBox.innerHTML = '<span style="color:#DC2626;">❌ Generation Error: ' + err.message + '</span>';
        showMsg(err.message, true);
      }
    }

    async function compilePackage() {
      try {
        const terms = (currentState.academicTerms || []).map(t => t.id);
        const data = await api('/api/generation/compile-package', {
          method: 'POST',
          body: JSON.stringify({ termIds: terms })
        });
        showMsg('Package compiled successfully: Revision ' + data.package.inputRevision, false);
      } catch (err) { showMsg(err.message, true); }
    }

    function downloadPackage() {
      window.open('/api/generation/package/download', '_blank');
    }

    // Staged Drafts Review & Publish
    function renderStagedDraftsReview() {
      const container = document.getElementById('stagedDraftsList');
      if (!container) return;
      const drafts = (currentState.timetableVersions || []).filter(v => v.status === 'draft');

      if (drafts.length === 0) {
        container.innerHTML = '<div style="font-size:13px; color:var(--text-muted);">No uncommitted drafts pending publication.</div>';
        return;
      }

      let html = '<div style="display:flex; flex-direction:column; gap:10px;">';
      drafts.forEach(d => {
        html += '<div style="background:#FFFFFF; border:1px solid var(--border); border-left:4px solid var(--accent-amber); padding:14px; border-radius:10px; display:flex; justify-content:space-between; align-items:center;">' +
          '<div>' +
            '<div style="font-weight:700;">Draft Version ' + d.versionNumber + ' (Term: ' + d.termId + ')</div>' +
            '<div style="font-size:12px; color:var(--text-muted); margin-top:2px;">Created: ' + new Date(d.createdAt).toLocaleString() + '</div>' +
          '</div>' +
          '<button class="btn btn-primary" onclick="publishDraft(\\'' + d.id + '\\')">🚀 Publish Version ' + d.versionNumber + '</button>' +
        '</div>';
      });
      html += '</div>';
      container.innerHTML = html;
    }

    async function publishDraft(versionId) {
      if (!confirm('Publish official timetable? Prior version will be superseded atomically.')) return;
      try {
        const data = await api('/api/timetable/versions/' + versionId + '/publish', { method: 'POST' });
        showMsg('Timetable published! Instantiated ' + data.instantiatedOccurrences + ' occurrences.', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    // Reset and Demo schedule loaders
    async function resetToSimpleMockData() {
      if (!confirm('Reset campus state to single-cohort simple mock data?')) return;
      try {
        const data = await api('/api/demo/reset-to-simple', { method: 'POST' });
        showMsg(data.message, false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    async function loadDemoSchedule() {
      try {
        const data = await api('/api/demo/seed-and-publish', { method: 'POST' });
        showMsg('Loaded & published verified demo schedule with ' + data.instantiatedOccurrences + ' occurrences!', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    // Render Admin Tables
    function renderAdminTables() {
      // Terms
      const termsBody = document.getElementById('termsTableBody');
      if (termsBody) {
        termsBody.innerHTML = (currentState.academicTerms || []).map(t =>
          '<tr><td>' + t.id + '</td><td>' + t.yearLabel + '</td><td>' + t.semesterNumber + '</td><td>' + t.cycle + '</td><td><span class="status-badge status-badge-published">' + t.status + '</span></td></tr>'
        ).join('');
      }

      // Sections
      const secBody = document.getElementById('sectionsTableBody');
      if (secBody) {
        secBody.innerHTML = (currentState.sections || []).map(s =>
          '<tr><td>' + s.id + '</td><td>' + s.termId + '</td><td>' + s.name + '</td><td>' + s.expectedCount + '</td></tr>'
        ).join('');
      }

      // Batches
      const batchBody = document.getElementById('batchesTableBody');
      if (batchBody) {
        batchBody.innerHTML = (currentState.batches || []).map(b =>
          '<tr><td>' + b.id + '</td><td>' + b.sectionId + '</td><td>' + b.name + '</td><td>' + b.expectedCount + '</td></tr>'
        ).join('');
      }

      // Courses
      const coursesBody = document.getElementById('coursesTableBody');
      if (coursesBody) {
        coursesBody.innerHTML = (currentState.courses || []).map(c =>
          '<tr><td>' + c.code + '</td><td>' + c.name + '</td><td>' + c.lectureHours + 'L / ' + c.tutorialHours + 'T / ' + c.practicalHours + 'P</td><td>' + c.requiredRoomType + '</td></tr>'
        ).join('');
      }

      // Offerings
      const offBody = document.getElementById('offeringsTableBody');
      if (offBody) {
        const cMap = new Map((currentState.courses || []).map(c => [c.id, c.code]));
        const tMap = new Map((currentState.teachers || []).map(t => [t.id, t.name]));
        offBody.innerHTML = (currentState.courseOfferings || []).map(o =>
          '<tr><td>' + (cMap.get(o.courseId) || o.courseId) + '</td><td>' + (tMap.get(o.teacherId) || o.teacherId) + '</td><td>' + o.targetType + ' ' + o.targetId + '</td><td>' + (o.component || 'All') + '</td></tr>'
        ).join('');
      }

      // Rooms
      const roomsBody = document.getElementById('roomsTableBody');
      if (roomsBody) {
        roomsBody.innerHTML = (currentState.rooms || []).map(r =>
          '<tr><td>Room ' + r.roomNumber + '</td><td>' + r.building + '</td><td>' + r.floor + '</td><td>' + r.capacity + '</td><td>' + r.roomType + '</td></tr>'
        ).join('');
      }

      // Teachers
      const teachersBody = document.getElementById('teachersTableBody');
      if (teachersBody) {
        teachersBody.innerHTML = (currentState.teachers || []).map(t =>
          '<tr><td>' + t.name + '</td><td>' + t.empId + '</td><td>' + t.email + '</td></tr>'
        ).join('');
      }

      // Versions
      const versionsBody = document.getElementById('versionsTableBody');
      if (versionsBody) {
        versionsBody.innerHTML = (currentState.timetableVersions || []).map(v =>
          '<tr><td>Version ' + v.versionNumber + '</td><td>' + v.termId + '</td><td><span class="status-badge ' + (v.status === 'published' ? 'status-badge-published' : 'status-badge-superseded') + '">' + v.status + '</span></td><td>' + (v.publishedAt ? new Date(v.publishedAt).toLocaleString() : '—') + '</td><td>' + (v.status === 'superseded' ? '<button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="restoreVersion(\\'' + v.id + '\\')">Restore</button>' : '—') + '</td></tr>'
        ).join('');
      }
    }

    async function restoreVersion(versionId) {
      if (!confirm('Restore this timetable version as active published?')) return;
      try {
        await api('/api/timetable/versions/' + versionId + '/restore', { method: 'POST' });
        showMsg('Version restored successfully.', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    // Teacher slot query & booking
    async function queryFreeSlots() {
      const date = document.getElementById('extraDate')?.value;
      const dayOfWeek = new Date(date).getDay() === 0 ? 7 : new Date(date).getDay();
      const activityType = document.getElementById('extraActivity')?.value;
      const targetId = 'sec-A';

      try {
        const data = await api('/api/classes/extra/slots?date=' + date + '&dayOfWeek=' + dayOfWeek + '&activityType=' + activityType + '&targetId=' + targetId);
        const resEl = document.getElementById('slotsResults');
        if (!resEl) return;

        if (!data.slots || data.slots.length === 0) {
          resEl.innerHTML = '<span style="color:#DC2626;">No conflict-free slots available on this date.</span>';
          return;
        }

        let html = '<div style="font-size:12px; font-weight:700; margin-bottom:6px;">Available Free Slots:</div><div style="display:flex; flex-direction:column; gap:6px;">';
        data.slots.slice(0, 5).forEach(s => {
          html += '<div style="background:#FFFFFF; border:1px solid var(--border); padding:8px 12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">' +
            '<div><strong>Period ' + s.startSlot + '</strong> (' + s.roomNumber + ', ' + s.building + ') ' + (s.freedByCancellation ? '<span style="color:#059669; font-weight:700;">★ Freed</span>' : '') + '</div>' +
            '<button class="btn btn-primary" style="padding:4px 10px; font-size:11px;" onclick="bookExtraClassDirect(\\'' + date + '\\', ' + dayOfWeek + ', ' + s.startSlot + ', \\'' + s.roomId + '\\', \\'' + activityType + '\\')">Book Slot</button>' +
          '</div>';
        });
        html += '</div>';
        resEl.innerHTML = html;
      } catch (err) { showMsg(err.message, true); }
    }

    async function bookExtraClassDirect(date, dayOfWeek, startSlot, roomId, activityType) {
      try {
        await api('/api/classes/extra/book', {
          method: 'POST',
          body: JSON.stringify({
            termId: 'term-1',
            courseOfferingId: 'off-cs101',
            date, dayOfWeek, startSlot,
            activityType, roomId,
            targetType: 'section', targetId: 'sec-A'
          })
        });
        showMsg('Extra class booked! Students notified.', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    async function quickBookTeacherSlot(slot) {
      const activeDay = DAYS[activeDayIndex];
      const rooms = currentState.rooms || [];
      const defaultRoom = rooms.length > 0 ? rooms[0].id : 'r-101';
      try {
        await api('/api/classes/extra/book', {
          method: 'POST',
          body: JSON.stringify({
            termId: 'term-1',
            courseOfferingId: 'off-cs101',
            date: activeDay.date,
            dayOfWeek: activeDay.dayOfWeek,
            startSlot: slot,
            activityType: 'L',
            roomId: defaultRoom,
            targetType: 'section',
            targetId: 'sec-A'
          })
        });
        showMsg('Extra class booked on ' + activeDay.name + ' Period ' + slot + '!', false);
        await loadState();
      } catch (err) { showMsg(err.message, true); }
    }

    async function submitUnavailability() {
      try {
        await api('/api/teachers/unavailability/request', {
          method: 'POST',
          body: JSON.stringify({
            date: document.getElementById('unavailDate')?.value,
            startSlot: parseInt(document.getElementById('unavailStart')?.value, 10),
            endSlot: parseInt(document.getElementById('unavailEnd')?.value, 10),
            reason: document.getElementById('unavailReason')?.value || 'Operational leave'
          })
        });
        showMsg('Leave request submitted. Admin will review.', false);
      } catch (err) { showMsg(err.message, true); }
    }

    function updateAdminGrouping(val) { adminGroupBy = val; renderSingleDayGrid(); }
    function updateAdminFilterVal(val) { adminFilterVal = val; renderSingleDayGrid(); }

    // Init Application
    async function init() {
      if (authToken) {
        try {
          const res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + authToken } });
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
      switchView(authToken ? 'dashboard' : 'landing');
    }

    window.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>`;
}
