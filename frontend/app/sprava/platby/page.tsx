import { Suspense } from "react";
import { SpravaSekceBrana } from "@/components/sprava-sekce-brana";

export default function StrankaPlatebSpravy() {
  return (
    <Suspense fallback={null}>
      <SpravaSekceBrana sekce="platby" />
    </Suspense>
  );
}
