"use client";

import {
  Activity,
  Gauge,
  Home,
  Map as MapIcon,
  Radio,
  Route as RouteIcon,
  Sparkles,
} from "lucide-react";

interface AppSidebarProps {
  activePath?: string;
}

const NAV = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/#map", label: "Pollution map", icon: MapIcon },
  { href: "/#routes", label: "Route planner", icon: RouteIcon },
  { href: "/#forecast", label: "Forecast", icon: Gauge },
  { href: "/plan-my-day", label: "Plan my day", icon: Sparkles },
  { href: "/api-status", label: "API status", icon: Activity },
];

// Standalone sidebar component. The primary layout uses AppShell which wraps this;
// exposing it separately lets pages compose it directly if needed.
export default function AppSidebar({ activePath = "/" }: AppSidebarProps) {
  return (
    <aside className="dbb-sidebar" aria-label="Primary navigation">
      <div className="dbb-sidebar-brand">
        <div className="dbb-sidebar-logo">
          <Radio size={20} />
        </div>
        <div className="dbb-sidebar-titles">
          <div className="dbb-sidebar-title">Delhi Breath Budget</div>
          <div className="dbb-sidebar-sub">Air Intelligence</div>
        </div>
      </div>
      <nav className="dbb-sidebar-nav">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            activePath === item.href ||
            (item.href !== "/" && activePath.startsWith(item.href));
          return (
            <a
              key={item.href}
              href={item.href}
              className={`dbb-nav-link ${active ? "dbb-nav-link-active" : ""}`}
            >
              <span className="dbb-nav-icon">
                <Icon size={18} />
              </span>
              <span className="dbb-nav-label">{item.label}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
