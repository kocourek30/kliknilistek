import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KlikniListek",
    short_name: "KlikniListek",
    description:
      "Kulturní služba pro obce, kulturní domy a místní pořadatele.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f3ee",
    theme_color: "#175f66",
    lang: "cs",
  };
}
