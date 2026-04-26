import type { CSSProperties } from "react";
import type { Metadata } from "next";
import {
  IconArrowRight,
  IconBuildingCommunity,
  IconCalendarEvent,
  IconMap2,
  IconTicket,
} from "@tabler/icons-react";

import { Hlavicka } from "@/components/hlavicka";
import { Paticka } from "@/components/paticka";
import { VerejnyKatalog } from "@/components/verejny-katalog";
import { nactiSouhrnAdministrace, nactiTenantKontext } from "@/lib/api";
import { nactiAktualniHost } from "@/lib/tenant-server";
import {
  formatujCastku,
  formatujDatum,
  formatujTypAkce,
  formatujTypOrganizace,
} from "@/lib/formatovani";
import {
  vytvorAbsolutniUrl,
  vytvorOrganizacniSchema,
  vytvorSeoTitulek,
} from "@/lib/seo";

const krokyNakupu = [
  {
    nadpis: "Vyber si akci",
    text: "Během pár sekund uvidíš termín, místo, cenu a dostupnost.",
  },
  {
    nadpis: "Zvol vstupenky",
    text: "Bez registrace vybereš počet kusů nebo konkrétní místa v sále.",
  },
  {
    nadpis: "Dokonči objednávku",
    text: "Shrnutí máš stále na očích a potvrzení přijde hned na e-mail.",
  },
];

export default async function HomePage() {
  const host = await nactiAktualniHost();
  const tenantKontext = await nactiTenantKontext(host);
  const data = await nactiSouhrnAdministrace(undefined, host);
  const akce = [...data.akce].sort(
    (a, b) => new Date(a.zacatek).getTime() - new Date(b.zacatek).getTime(),
  );
  const doporucene = akce.filter((polozka) => polozka.je_doporucena).slice(0, 3);
  const nejblizsi = akce[0] ?? null;
  const prvniOrganizace = data.organizace[0] ?? null;
  const pocetMist = data.akce.reduce((soucet, polozka) => soucet + polozka.kapacita, 0);
  const odCeny =
    [...data.kategorieVstupenek].sort((a, b) => Number(a.cena) - Number(b.cena))[0] ?? null;
  const aktivniOrganizace = tenantKontext.organizace ?? prvniOrganizace;
  const titulek = tenantKontext.organizace
    ? `${tenantKontext.organizace.nazev_verejny || tenantKontext.organizace.nazev} na jednom místě`
    : "Najdi kulturní akci a vyřiď vstupenky rychle a přehledně.";
  const perex = tenantKontext.organizace
    ? tenantKontext.organizace.verejny_popis ||
      `Program, vstupenky a objednávky pro ${tenantKontext.organizace.nazev}. Přehledně, srozumitelně a bez zbytečných kroků.`
    : "Přehled akcí, jasná cena, dostupnost i jednoduchá objednávka bez zbytečných kroků. KlikniListek je navržený pro běžné návštěvníky i starší uživatele, kteří chtějí mít vše srozumitelně na jednom místě.";
  const tenantNazev =
    tenantKontext.organizace?.nazev_verejny || tenantKontext.organizace?.nazev || null;
  const tenantLogoUrl =
    tenantKontext.organizace?.logo_soubor_url || tenantKontext.organizace?.logo_url || null;
  const tenantBannerUrl = tenantKontext.organizace?.banner_soubor_url || null;
  const tenantPodtitulek = tenantKontext.organizace
    ? `Kulturní program a vstupenky · ${formatujTypOrganizace(tenantKontext.organizace.typ_organizace)}`
    : null;
  const tenantStyl = tenantKontext.organizace
    ? ({
        ...(tenantKontext.organizace.hlavni_barva
          ? { "--public-accent": tenantKontext.organizace.hlavni_barva }
          : {}),
        ...(tenantBannerUrl ? { "--tenant-banner-image": `url('${tenantBannerUrl}')` } : {}),
      } as CSSProperties)
    : undefined;

  return (
    <main className="verejny-shell" style={tenantStyl}>
      <Hlavicka
        tenantNazev={tenantNazev}
        tenantPodtitulek={tenantPodtitulek}
        tenantLogoUrl={tenantLogoUrl}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            vytvorOrganizacniSchema(tenantKontext.organizace, host),
          ),
        }}
      />

      <div className="verejny-page">
        <section
          className={`verejny-hero${tenantBannerUrl ? " verejny-hero-s-bannerem" : ""}`}
        >
          <div className="verejny-hero-copy">
            <span className="section-eyebrow">
              {tenantKontext.organizace
                ? `Kulturní program · ${formatujTypOrganizace(tenantKontext.organizace.typ_organizace)}`
                : "Kulturní program obcí a místních pořadatelů"}
            </span>
            <h1>{titulek}</h1>
            <p>{perex}</p>
            <div className="verejny-hero-actions">
              <a className="kulturni-button kulturni-button-primary" href="#program">
                {tenantKontext.organizace ? "Zobrazit program organizace" : "Projít program"}
              </a>
              {tenantKontext.organizace ? null : (
                <a className="kulturni-button kulturni-button-secondary" href="/akce">
                  Všechny akce
                </a>
              )}
            </div>
          </div>

          <div className="verejny-hero-side">
            <article className="verejny-surface">
              <span className="section-eyebrow">Nejbližší akce</span>
              <h2>{nejblizsi?.nazev ?? "Program se právě připravuje"}</h2>
              <p>
                {nejblizsi
                  ? `${formatujDatum(nejblizsi.zacatek)} · ${nejblizsi.misto_konani_nazev}`
                  : "Jakmile bude zveřejněná první akce, objeví se tady."}
              </p>
              <div className="hero-event-meta">
                <span>{nejblizsi ? formatujTypAkce(nejblizsi.typ_akce) : "Kulturní akce"}</span>
                <span>{odCeny ? `Od ${formatujCastku(odCeny.cena, odCeny.mena)}` : "Cena bude doplněna"}</span>
              </div>
              {nejblizsi ? (
                <a className="text-link" href={`/akce/${nejblizsi.slug}`}>
                  <span>Otevřít detail akce</span>
                  <IconArrowRight aria-hidden="true" size={16} stroke={2} />
                </a>
              ) : null}
            </article>

            <article className="verejny-surface surface-accent">
              <span className="section-eyebrow">Proč je to snadné</span>
              <ul className="hero-bullet-list">
                <li>Rychlý přehled termínu, místa, ceny a dostupnosti.</li>
                <li>Nákup bez registrace a s jasným shrnutím objednávky.</li>
                <li>
                  {tenantKontext.organizace
                    ? `Rezervace i nákup přímo pro ${tenantKontext.organizace.nazev}.`
                    : "Rezervace i nákup vhodné pro menší obce a kulturní domy."}
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section className="verejny-metrics">
          <div className="metric-card">
            <div className="metric-icon">
              <IconBuildingCommunity aria-hidden="true" size={18} stroke={1.8} />
            </div>
            <span>Aktivní pořadatelé</span>
            <strong>{data.organizace.length}</strong>
          </div>
          <div className="metric-card">
            <div className="metric-icon">
              <IconCalendarEvent aria-hidden="true" size={18} stroke={1.8} />
            </div>
            <span>Naplánované akce</span>
            <strong>{data.akce.length}</strong>
          </div>
          <div className="metric-card">
            <div className="metric-icon">
              <IconMap2 aria-hidden="true" size={18} stroke={1.8} />
            </div>
            <span>Kapacita v nabídce</span>
            <strong>{pocetMist}</strong>
          </div>
          <div className="metric-card">
            <div className="metric-icon">
              <IconTicket aria-hidden="true" size={18} stroke={1.8} />
            </div>
            <span>Pořadatel</span>
            <strong>{aktivniOrganizace?.nazev_verejny || aktivniOrganizace?.nazev || "Místní pořadatel"}</strong>
          </div>
        </section>

        <section className="verejny-section" id="program">
          <div className="section-heading section-heading-row">
            <div>
              <span className="section-eyebrow">Program</span>
              <h2>{tenantKontext.organizace ? "Nejbližší akce organizace" : "Nejbližší a doporučené akce"}</h2>
              <p>
                {tenantKontext.organizace
                  ? "Přehled akcí této organizace s rychlým filtrováním podle data, místa a typu programu."
                  : "Filtruj podle obce, data, místa a typu akce. To nejdůležitější uvidíš rovnou v kartě."}
              </p>
            </div>
            <a className="text-link" href="/akce">
              <span>{tenantKontext.organizace ? "Všechny akce organizace" : "Otevřít celý program"}</span>
              <IconArrowRight aria-hidden="true" size={16} stroke={2} />
            </a>
          </div>

          <VerejnyKatalog
            akce={akce}
            kategorieVstupenek={data.kategorieVstupenek}
            organizace={data.organizace}
            vychoziLimit={6}
          />
        </section>

        {tenantKontext.organizace ? null : (
          <section className="verejny-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">Doporučené</span>
                <h2>Akce, které stojí za pozornost</h2>
                <p>Vybrané termíny, které jsou právě v programu nejvíc vidět.</p>
              </div>
            </div>
            <div className="highlight-grid">
              {doporucene.map((akcePolozka) => (
                <article key={akcePolozka.id} className="highlight-card">
                  <div className="highlight-card-body">
                    <span className="event-type-chip">{formatujTypAkce(akcePolozka.typ_akce)}</span>
                    <h3>{akcePolozka.nazev}</h3>
                    <p>{akcePolozka.perex || akcePolozka.popis}</p>
                  </div>
                  <div className="highlight-card-meta">
                    <span>{formatujDatum(akcePolozka.zacatek)}</span>
                    <span>{akcePolozka.misto_konani_nazev}</span>
                    <a className="text-link" href={`/akce/${akcePolozka.slug}`}>
                      <span>Detail akce</span>
                      <IconArrowRight aria-hidden="true" size={16} stroke={2} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="verejny-section" id="jak-to-funguje">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">Jak to funguje</span>
              <h2>Krátká cesta od programu k objednávce</h2>
              <p>
                Celý nákupní tok je postavený tak, aby byl srozumitelný i pro občasné nebo starší
                návštěvníky.
              </p>
            </div>
          </div>
          <div className="steps-grid">
            {krokyNakupu.map((krok, index) => (
              <article key={krok.nadpis} className="step-card">
                <span className="step-index">0{index + 1}</span>
                <h3>{krok.nadpis}</h3>
                <p>{krok.text}</p>
              </article>
            ))}
          </div>
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
  const nazev = tenant?.nazev_verejny || tenant?.nazev || "KlikniListek";
  const popis =
    tenant?.verejny_popis ||
    "Kulturní služba pro obce, kulturní domy a místní pořadatele. Přehled akcí, vstupenek a jednoduché online objednávky.";
  const obrazek =
    tenant?.banner_soubor_url ||
    tenant?.logo_soubor_url ||
    tenant?.logo_url ||
    vytvorAbsolutniUrl("/og-default.svg", host);

  return {
    title: tenant ? vytvorSeoTitulek(nazev) : "KlikniListek | Kulturní akce a vstupenky",
    description: popis,
    alternates: {
      canonical: vytvorAbsolutniUrl("/", host),
    },
    openGraph: {
      title: tenant ? nazev : "KlikniListek | Kulturní akce a vstupenky",
      description: popis,
      url: vytvorAbsolutniUrl("/", host),
      type: "website",
      images: obrazek ? [{ url: obrazek, alt: nazev }] : undefined,
    },
    twitter: {
      card: obrazek ? "summary_large_image" : "summary",
      title: tenant ? nazev : "KlikniListek | Kulturní akce a vstupenky",
      description: popis,
      images: obrazek ? [obrazek] : undefined,
    },
  };
}
