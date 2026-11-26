"use client";

import { Menu, X } from "lucide-react";

interface MobileNavigationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mobile hamburger button + scrim drawer trigger.
// The actual sidebar slide-in is controlled by .dbb-mobile-open on .dbb-sidebar
// from the AppShell. This component exists as a separate primitive for pages
// that need a lightweight mobile menu without the full shell.
export default function MobileNavigation({
  open,
  onOpenChange,
}: MobileNavigationProps) {
  return (
    <button
      type="button"
      className="dbb-header-burger"
      aria-label={open ? "Close navigation" : "Open navigation"}
      aria-expanded={open}
      onClick={() => onOpenChange(!open)}
    >
      {open ? <X size={18} /> : <Menu size={18} />}
    </button>
  );
}
