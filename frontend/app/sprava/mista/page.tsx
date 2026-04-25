import { Suspense } from "react";
import { SpravaSekceBrana } from "@/components/sprava-sekce-brana";

export default function StrankaMistSpravy() {
  return (
    <Suspense fallback={null}>
      <SpravaSekceBrana sekce="mista" />
    </Suspense>
  );
}
