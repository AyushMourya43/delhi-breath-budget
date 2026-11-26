"use client";

import { Radio } from "lucide-react";

interface AppHeaderProps {
  pageTitle?: string;
  pageEyebrow?: string;
  rightSlot?: React.ReactNode;
}

// Compact header bar used inside the AppShell main column.
// The sticky styling and backdrop blur are handled by .dbb-header in globals.css.
export default function AppHeader({
  pageTitle = "Dashboard",
  pageEyebrow = "DELHI · NCR",
  rightSlot,
}: AppHeaderProps) {
  return (
    <header className="dbb-header">
      <div className="dbb-header-left">
        <div className="dbb-sidebar-logo" style={{ width: 34, height: 34 }}>
          <Radio size={16} />
        </div>
        <div className="dbb-header-page">
          <div className="dbb-header-page-eyebrow">{pageEyebrow}</div>
          <div className="dbb-header-page-title">{pageTitle}</div>
        </div>
      </div>
      <div className="dbb-header-right">{rightSlot}</div>
    </header>
  );
}
