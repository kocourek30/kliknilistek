import type { MetadataRoute } from "next";

import { nactiSouhrnAdministrace } from "@/lib/api";
import { vytvorAbsolutniUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await nactiSouhrnAdministrace();
  const zakladniPolozky: MetadataRoute.Sitemap = [
    {
      url: vytvorAbsolutniUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: vytvorAbsolutniUrl("/akce"),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const organizaceMap = new Map(
    data.organizace.map((organizace) => [organizace.id, organizace]),
  );

  const akcePolozky: MetadataRoute.Sitemap = data.akce.map((akce) => {
    const organizace = organizaceMap.get(akce.organizace);
    const host =
      organizace?.tenant_aktivni && organizace.slug_subdomeny
        ? `${organizace.slug_subdomeny}.kliknilistek.online`
        : undefined;

    return {
      url: vytvorAbsolutniUrl(`/akce/${akce.slug}`, host),
      lastModified: akce.upraveno || akce.zacatek,
      changeFrequency: "weekly",
      priority: akce.je_doporucena ? 0.9 : 0.8,
    };
  });

  return [...zakladniPolozky, ...akcePolozky];
}
