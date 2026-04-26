import type { MetadataRoute } from "next";

import { ziskejZakladniUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const host = ziskejZakladniUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/akce"],
        disallow: [
          "/sprava/",
          "/odbaveni",
          "/objednavka/",
          "/vstupenka/",
          "/api_proxy/",
        ],
      },
    ],
    sitemap: `${host}/sitemap.xml`,
    host,
  };
}
