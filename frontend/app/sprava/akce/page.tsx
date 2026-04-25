import { Suspense } from "react";
import { SpravaSekceBrana } from "@/components/sprava-sekce-brana";

export default function StrankaAkciSpravy() {
  return (
    <Suspense fallback={null}>
      <SpravaSekceBrana sekce="akce" />
    </Suspense>
  );
}
