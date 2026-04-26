import { Hlavicka } from "@/components/hlavicka";
import { Paticka } from "@/components/paticka";
import { VerejnyKatalog } from "@/components/verejny-katalog";
import { nactiSouhrnAdministrace, nactiTenantKontext } from "@/lib/api";
import { nactiAktualniHost } from "@/lib/tenant-server";
import { formatujTypOrganizace } from "@/lib/formatovani";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { vytvorAbsolutniUrl, vytvorSeoTitulek } from "@/lib/seo";

export default async function VypisAkciPage() {
  const host = await nactiAktualniHost();
  const tenantKontext = await nactiTenantKontext(host);
  const data = await nactiSouhrnAdministrace(undefined, host);
  const tenantNazev =
    tenantKontext.organizace?.nazev_verejny || tenantKontext.organizace?.nazev || null;
  const tenantLogoUrl =
    tenantKontext.organizace?.logo_soubor_url || tenantKontext.organizace?.logo_url || null;
  const tenantPodtitulek = tenantKontext.organizace
    ? `Kulturní program a vstupenky · ${formatujTypOrganizace(tenantKontext.organizace.typ_organizace)}`
    : null;
  const tenantStyl = tenantKontext.organizace?.hlavni_barva
    ? ({ "--public-accent": tenantKontext.organizace.hlavni_barva } as CSSProperties)
    : undefined;
  const akce = [...data.akce].sort(
    (a, b) => new Date(a.zacatek).getTime() - new Date(b.zacatek).getTime(),
  );

  return (
    <main className="verejny-shell" style={tenantStyl}>
      <Hlavicka
        tenantNazev={tenantNazev}
        tenantPodtitulek={tenantPodtitulek}
        tenantLogoUrl={tenantLogoUrl}
      />

      <div className="verejny-page">
        <section className="page-intro">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">
                {tenantKontext.organizace
                  ? `Program · ${formatujTypOrganizace(tenantKontext.organizace.typ_organizace)}`
                  : "Program"}
              </span>
              <h1>
                {tenantKontext.organizace
                  ? `Program organizace ${tenantKontext.organizace.nazev_verejny || tenantKontext.organizace.nazev}`
                  : "Všechny akce na jednom místě"}
              </h1>
              <p>
                {tenantKontext.organizace
                  ? "Projdi si akce této organizace. Filtry ti pomůžou rychle najít správný termín, místo i typ programu."
                  : "Projdi si kulturní program obcí a místních pořadatelů. Filtry ti pomůžou rychle najít správný termín, obec i typ akce."}
              </p>
            </div>
          </div>
          <div className="page-intro-note">
            <strong>{tenantKontext.organizace ? "Přehled jednoho pořadatele" : "Jednoduché hledání"}</strong>
            <span>
              {tenantKontext.organizace
                ? "Datum, místo a typ akce máš stále po ruce bez přepínání mezi organizacemi."
                : "Datum, místo, obec i typ akce máš stále po ruce."}
            </span>
          </div>
        </section>

        <section className="verejny-section">
          <VerejnyKatalog
            akce={akce}
            kategorieVstupenek={data.kategorieVstupenek}
            organizace={data.organizace}
          />
        </section>
      </div>

      <Paticka tenantNazev={tenantNazev} tenantLogoUrl={tenantLogoUrl} />
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const host = await nactiAktualniHost();
  const tenantKontext = await nactiTenantKontext(host);
  const tenant = tenantKontext.organizace;
  const nazev = tenant
    ? `Program organizace ${tenant.nazev_verejny || tenant.nazev}`
    : "Přehled kulturních akcí";
  const popis = tenant
    ? `Program, termíny a vstupenky pro ${tenant.nazev_verejny || tenant.nazev}.`
    : "Přehled kulturních akcí, koncertů, divadel a místních programů s online rezervací a nákupem vstupenek.";

  return {
    title: vytvorSeoTitulek(nazev),
    description: popis,
    alternates: {
      canonical: vytvorAbsolutniUrl("/akce", host),
    },
    openGraph: {
      title: nazev,
      description: popis,
      url: vytvorAbsolutniUrl("/akce", host),
      type: "website",
    },
    twitter: {
      card: "summary",
      title: nazev,
      description: popis,
    },
  };
}
