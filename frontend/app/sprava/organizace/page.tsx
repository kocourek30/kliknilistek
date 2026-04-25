import { Suspense } from "react";
import { SpravaSekceBrana } from "@/components/sprava-sekce-brana";

export default function StrankaOrganizaciSpravy() {
  return (
    <Suspense fallback={null}>
      <SpravaSekceBrana sekce="organizace" />
    </Suspense>
  );
}
