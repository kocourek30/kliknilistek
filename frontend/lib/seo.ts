import type { Metadata } from "next";

import type { Akce, Organizace } from "@/lib/api";

const vychoziDomena = "https://kliknilistek.online";
const vychoziOgObrazek = "/og-default.svg";

function jeHttpUrl(hodnota: string) {
  return /^https?:\/\//i.test(hodnota);
}

export function normalizujHost(host?: string | null) {
  return (host || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

export function ziskejZakladniUrl(host?: string | null) {
  const cistyHost = normalizujHost(host);
  if (cistyHost) {
    return `https://${cistyHost}`;
  }

  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl && jeHttpUrl(envUrl)) {
    return envUrl.replace(/\/$/, "");
  }

  return vychoziDomena;
}

export function vytvorAbsolutniUrl(cesta = "/", host?: string | null) {
  const zaklad = ziskejZakladniUrl(host);
  const normalizovanaCesta = cesta.startsWith("/") ? cesta : `/${cesta}`;
  return new URL(normalizovanaCesta, `${zaklad}/`).toString();
}

export function vytvorSeoTitulek(hodnota: string) {
  return `${hodnota} | KlikniListek`;
}

export function vytvorVychoziMetadata(host?: string | null): Metadata {
  const metadataBase = new URL(ziskejZakladniUrl(host));
  const vychoziObrazek = new URL(vychoziOgObrazek, `${metadataBase.toString()}/`).toString();
  return {
    metadataBase,
    applicationName: "KlikniListek",
    title: {
      default: "KlikniListek",
      template: "%s | KlikniListek",
    },
    description: "Kulturní služba pro obce, kulturní domy a místní pořadatele. Přehled akcí, vstupenek a jednoduché online objednávky.",
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "cs_CZ",
      siteName: "KlikniListek",
      url: metadataBase.toString(),
      title: "KlikniListek",
      description:
        "Kulturní služba pro obce, kulturní domy a místní pořadatele. Přehled akcí, vstupenek a jednoduché online objednávky.",
      images: [{ url: vychoziObrazek, alt: "KlikniListek" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "KlikniListek",
      description:
        "Kulturní služba pro obce, kulturní domy a místní pořadatele. Přehled akcí, vstupenek a jednoduché online objednávky.",
      images: [vychoziObrazek],
    },
    category: "events",
    keywords: [
      "kulturní akce",
      "vstupenky",
      "rezervace vstupenek",
      "obecní kultura",
      "kulturní dům",
      "program akcí",
      "KlikniListek",
    ],
  };
}

export function vytvorOrganizacniSchema(organizace?: Organizace | null, host?: string | null) {
  const url = vytvorAbsolutniUrl("/", host);
  const nazev = organizace?.nazev_verejny || organizace?.nazev || "KlikniListek";
  const logo = organizace?.logo_soubor_url || organizace?.logo_url || undefined;
  return {
    "@context": "https://schema.org",
    "@type": organizace ? "Organization" : "WebSite",
    name: nazev,
    url,
    description:
      organizace?.verejny_popis ||
      "Kulturní služba pro obce, kulturní domy a místní pořadatele.",
    ...(logo ? { logo } : {}),
  };
}

export function vytvorEventSchema(
  akce: Akce,
  host?: string | null,
  obrazek?: string,
  nejnizsiCena?: { cena: string | number; mena: string } | null,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: akce.nazev,
    description:
      akce.perex ||
      akce.popis ||
      "Kulturní akce s online rezervací a nákupem vstupenek.",
    startDate: akce.zacatek,
    endDate: akce.konec || akce.zacatek,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus:
      akce.stav === "zruseno"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    image: obrazek ? [obrazek] : undefined,
    url: vytvorAbsolutniUrl(`/akce/${akce.slug}`, host),
    location: {
      "@type": "Place",
      name: akce.misto_konani_nazev || "Místo konání bude upřesněno",
    },
    organizer: {
      "@type": "Organization",
      name: akce.organizace_nazev || "KlikniListek",
    },
    offers: nejnizsiCena
      ? {
          "@type": "Offer",
          price: String(nejnizsiCena.cena),
          priceCurrency: nejnizsiCena.mena,
          availability:
            akce.stav === "vyprodano"
              ? "https://schema.org/SoldOut"
              : "https://schema.org/InStock",
          url: vytvorAbsolutniUrl(`/akce/${akce.slug}`, host),
        }
      : undefined,
  };
}
