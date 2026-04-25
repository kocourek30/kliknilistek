import { Suspense } from "react";
import { SpravaSekceBrana } from "@/components/sprava-sekce-brana";

export default function StrankaObjednavekSpravy() {
  return (
    <Suspense fallback={null}>
      <SpravaSekceBrana sekce="objednavky" />
    </Suspense>
  );
}
