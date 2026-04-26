import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { Viewport } from "next";

import { vytvorVychoziMetadata } from "@/lib/seo";

export const metadata: Metadata = vytvorVychoziMetadata();
export const viewport: Viewport = {
  themeColor: "#175f66",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
