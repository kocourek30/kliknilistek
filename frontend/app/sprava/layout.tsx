import type { ReactNode } from "react";

import { Hlavicka } from "@/components/hlavicka";
import { SpravaAdminLayout } from "@/components/sprava-admin-layout";

export default function LayoutSpravy({ children }: { children: ReactNode }) {
  return (
    <main className="page-shell">
      <Hlavicka varianta="sprava" />
      <SpravaAdminLayout>{children}</SpravaAdminLayout>
    </main>
  );
}
