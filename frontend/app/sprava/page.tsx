import type { Metadata } from "next";

import { SpravaBrana } from "@/components/sprava-brana";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Hlavní pracovní dashboard správy KlikniListek.",
};

export default function StrankaSpravy() {
  return <SpravaBrana />;
}
