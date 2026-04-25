import { Suspense } from "react";
import { SpravaSekceBrana } from "@/components/sprava-sekce-brana";

export default function StrankaUzivateluSpravy() {
  return (
    <Suspense fallback={null}>
      <SpravaSekceBrana sekce="uzivatele" />
    </Suspense>
  );
}
