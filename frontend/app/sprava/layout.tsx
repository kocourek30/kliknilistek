import type { ReactNode } from "react";
import type { Metadata } from "next";

import { Hlavicka } from "@/components/hlavicka";
import { SpravaAdminLayout } from "@/components/sprava-admin-layout";

export const metadata: Metadata = {
  title: {
    default: "Správa",
    template: "%s | Správa KlikniListek",
  },
  description: "Interní správa KlikniListek pro organizace, akce, objednávky, platby a provozní přehledy.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function LayoutSpravy({ children }: { children: ReactNode }) {
  return (
    <main className="page-shell">
      <Hlavicka varianta="sprava" />
      <SpravaAdminLayout>{children}</SpravaAdminLayout>
    </main>
  );
}
