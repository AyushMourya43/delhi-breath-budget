import type { Metadata, Viewport } from "next";
import "./globals.css";

import { DemoModeProvider } from "../lib/demo-mode";

export const metadata: Metadata = {
  title: "Delhi Breath Budget",
  description:
    "Premium air-quality intelligence for Delhi NCR. Understand your exposure, choose your route, plan your day.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5EFE3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <DemoModeProvider>{children}</DemoModeProvider>
      </body>
    </html>
  );
}
