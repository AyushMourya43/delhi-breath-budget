"use client";

import { useState, type ReactNode } from "react";
import {
  Activity,
  ChevronLeft,
  FlaskConical,
  Gauge,
  Home,
  Leaf,
  Map as MapIcon,
  Menu,
  Route as RouteIcon,
  Sparkles,
  Zap,
} from "lucide-react";

import SmokeBackground from "../background/SmokeBackground";
import FloatingAssistant from "../assistant/FloatingAssistant";
import { useDemoMode } from "../../lib/demo-mode";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  section: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home, section: "Main" },
  { href: "/#map", label: "Pollution map", icon: MapIcon, section: "Main" },
  { href: "/#routes", label: "Route planner", icon: RouteIcon, section: "Main" },
  { href: "/#forecast", label: "Forecast", icon: Gauge, section: "Main" },
  { href: "/plan-my-day", label: "Plan my day", icon: Sparkles, section: "Main" },
  { href: "/api-status", label: "API status", icon: Activity, section: "System" },
];

const NAV_SECTIONS = ["Main", "System"] as const;

interface AppShellProps {
  children: ReactNode;
  pageTitle: string;
  pageEyebrow?: string;
  headerStatus?: ReactNode;
}

export default function AppShell({
  children,
  pageTitle,
  pageEyebrow = "DELHI · NCR",
  headerStatus,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const demo = useDemoMode();

  // Determine active route by checking the URL hash/path on the client
  const activeHref =
    typeof window !== "undefined"
      ? window.location.pathname === "/"
        ? "/"
        : window.location.pathname
      : "/";

  return (
    <div className={`dbb-shell ${collapsed ? "dbb-collapsed" : ""}`}>
      <SmokeBackground />

      {/* Mobile scrim */}
      <div
        className={`dbb-sidebar-scrim ${mobileOpen ? "dbb-open" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`dbb-sidebar ${mobileOpen ? "dbb-mobile-open" : ""}`}
        aria-label="Primary navigation"
      >
        <div className="dbb-sidebar-brand">
          <div className="dbb-sidebar-logo">
            <Leaf size={20} />
          </div>
          <div className="dbb-sidebar-titles">
            <div className="dbb-sidebar-title">Delhi Breath Budget</div>
            <div className="dbb-sidebar-sub">Air Intelligence</div>
          </div>
        </div>

        <div className="dbb-sidebar-section">
          <div className="dbb-sidebar-section-label">Navigate</div>
        </div>

        <nav className="dbb-sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section} style={{ display: "contents" }}>
              {section === "System" && (
                <div className="dbb-sidebar-section" style={{ paddingTop: 8 }}>
                  <div className="dbb-sidebar-section-label">System</div>
                </div>
              )}
              {NAV_ITEMS.filter((i) => i.section === section).map((item) => {
                const Icon = item.icon;
                const active =
                  activeHref === item.href ||
                  (item.href !== "/" && activeHref.startsWith(item.href));
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`dbb-nav-link ${active ? "dbb-nav-link-active" : ""}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="dbb-nav-icon">
                      <Icon size={18} />
                    </span>
                    <span className="dbb-nav-label">{item.label}</span>
                  </a>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="dbb-sidebar-foot">
          <button
            type="button"
            className="dbb-mode-switch"
            onClick={demo.toggle}
            aria-pressed={demo.isDemo}
            title={
              demo.isDemo
                ? "Currently using static sample data. Click for live backend."
                : "Currently using live backend data. Click for static demo."
            }
          >
            <span className="dbb-mode-switch-icon">
              {demo.isDemo ? <FlaskConical size={16} /> : <Zap size={16} />}
            </span>
            <span className="dbb-mode-switch-meta">
              <strong>{demo.isDemo ? "Demo mode" : "Live mode"}</strong>
              <span>{demo.isDemo ? "Static sample data" : "Backend API"}</span>
            </span>
          </button>
        </div>

        {/* Collapse toggle (desktop only — hidden on mobile via CSS) */}
        <button
          type="button"
          className="dbb-sidebar-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft size={14} />
        </button>
      </aside>

      {/* Main column */}
      <div className="dbb-main">
        <header className="dbb-header">
          <div className="dbb-header-left">
            <button
              type="button"
              className="dbb-header-burger"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
            <div className="dbb-header-page">
              <div className="dbb-header-page-eyebrow">{pageEyebrow}</div>
              <div className="dbb-header-page-title">{pageTitle}</div>
            </div>
          </div>
          <div className="dbb-header-right">
            {headerStatus ?? (
              <span className="dbb-header-chip">
                <span
                  className={`dbb-status-dot ${demo.isDemo ? "" : "dbb-loading"}`}
                />
                {demo.isDemo ? "DEMO data" : "Live data"}
              </span>
            )}
          </div>
        </header>

        <main className="dbb-content">{children}</main>
      </div>

      <FloatingAssistant />
    </div>
  );
}

// Re-export for use in the mobile-nav drawer if needed
export { NAV_ITEMS };
