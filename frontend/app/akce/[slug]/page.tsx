import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  IconCalendarEvent,
  IconClockHour4,
  IconMapPin,
  IconTicket,
  IconUsers,
} from "@tabler/icons-react";

import { Hlavicka } from "@/components/hlavicka";
import { ObjednavkaKlient } from "@/components/objednavka-klient";
import { Paticka } from "@/components/paticka";
import { nactiAkci, nactiKategorieVstupenekProAkci, nactiTenantKontext } from "@/lib/api";
import { ziskejHlavniObrazekAkce, ziskejSerazenouGaleriiAkce } from "@/lib/obrazky";
import {
  formatujCastku,
  formatujDatum,
  formatujTypAkce,
  formatujTypOrganizace,
} from "@/lib/formatovani";
import { nactiAktualniHost } from "@/lib/tenant-server";
import {
  vytvorAbsolutniUrl,
  vytvorEventSchema,
  vytvorSeoTitulek,
} from "@/lib/seo";

type DetailAkcePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function DetailAkcePage({ params }: DetailAkcePageProps) {
  const { slug } = await params;
  const host = await nactiAktualniHost();
  const tenantKontext = await nactiTenantKontext(host);
  const akce = await nactiAkci(slug, host);

  if (!akce) {
    notFound();
  }

  const kategorieVstupenek = await nactiKategorieVstupenekProAkci(akce.id, host);
  const nejnizsiCena =
    [...kategorieVstupenek].sort((a, b) => Number(a.cena) - Number(b.cena))[0] ?? null;
  const jeVyprodano = akce.stav === "vyprodano";
  const tenantNazev =
    tenantKontext.organizace?.nazev_verejny || tenantKontext.organizace?.nazev || null;
  const tenantPodtitulek = tenantKontext.organizace
    ? `Kulturní program a vstupenky · ${formatujTypOrganizace(tenantKontext.organizace.typ_organizace)}`
    : null;
  const hlavniObrazek = ziskejHlavniObrazekAkce(
    akce,
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
  );
  const galerie = ziskejSerazenouGaleriiAkce(akce);
  const hlavniPomer = akce.hlavni_fotka_pomer || "kino";
  const galeriePomer = akce.galerie_fotka_pomer || "siroky";

  return (
    <main className="verejny-shell">
      <Hlavicka tenantNazev={tenantNazev} tenantPodtitulek={tenantPodtitulek} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            vytvorEventSchema(akce, host, hlavniObrazek, nejnizsiCena),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Program",
                item: vytvorAbsolutniUrl("/akce", host),
              },
              {
                "@type": "ListItem",
                position: 2,
                name: akce.nazev,
                item: vytvorAbsolutniUrl(`/akce/${akce.slug}`, host),
              },
            ],
          }),
        }}
      />

      <div className="verejny-page">
        <section className="event-detail-hero">
          <div className={`event-detail-media ratio-${hlavniPomer}`}>
            <img
              alt={akce.nazev}
              src={hlavniObrazek}
            />
          </div>
          <div className="event-detail-copy">
            <div className="section-heading">
              <div className="event-detail-heading">
                <div className="event-detail-badges">
                  <span className="event-type-chip">{formatujTypAkce(akce.typ_akce)}</span>
                  <span className={`event-status-badge${jeVyprodano ? " sold-out" : ""}`}>
                    {jeVyprodano ? "Vyprodáno" : "V prodeji"}
                  </span>
                </div>
                <h1>{akce.nazev}</h1>
                <p>
                  {akce.perex ||
                    akce.popis ||
                    "Přehledná kulturní akce s jednoduchým online nákupem bez registrace."}
                </p>
              </div>
            </div>

            <dl className="event-detail-meta-grid">
              <div>
                <dt><IconCalendarEvent aria-hidden="true" size={15} stroke={1.8} /> Datum a čas</dt>
                <dd>{formatujDatum(akce.zacatek)}</dd>
              </div>
              <div>
                <dt><IconMapPin aria-hidden="true" size={15} stroke={1.8} /> Místo konání</dt>
                <dd>{akce.misto_konani_nazev}</dd>
              </div>
              <div>
                <dt><IconTicket aria-hidden="true" size={15} stroke={1.8} /> Cena</dt>
                <dd>{nejnizsiCena ? `Od ${formatujCastku(nejnizsiCena.cena, nejnizsiCena.mena)}` : "Bude upřesněna"}</dd>
              </div>
              <div>
                <dt><IconUsers aria-hidden="true" size={15} stroke={1.8} /> Dostupnost</dt>
                <dd>{jeVyprodano ? "Aktuálně bez volných míst" : `${akce.kapacita} míst v kapacitě`}</dd>
              </div>
            </dl>

            <div className="verejny-hero-actions">
              <a className="kulturni-button kulturni-button-primary" href="#nakup">
                {jeVyprodano ? "Zobrazit podrobnosti" : "Koupit nebo rezervovat"}
              </a>
              <a className="kulturni-button kulturni-button-secondary" href="/akce">
                Zpět na program
              </a>
            </div>
          </div>
        </section>

        <section className="verejny-section">
          <div className="event-detail-info-grid">
            <article className="verejny-surface">
              <span className="section-eyebrow">O akci</span>
              <h2>Co tě čeká</h2>
              <p>
                {akce.popis ||
                  "Program, který je připravený pro online rezervaci i nákup. V detailu okamžitě vidíš to nejdůležitější a nemusíš složitě dohledávat základní informace."}
              </p>
            </article>

            <article className="verejny-surface">
              <span className="section-eyebrow">Praktické informace</span>
              <h2>Vše důležité hned po ruce</h2>
              <dl className="event-detail-list">
                <div>
                  <dt><IconUsers aria-hidden="true" size={15} stroke={1.8} /> Pořadatel</dt>
                  <dd>{akce.organizace_nazev}</dd>
                </div>
                <div>
                  <dt><IconClockHour4 aria-hidden="true" size={15} stroke={1.8} /> Rezervace držíme</dt>
                  <dd>{akce.rezervace_platnost_minuty} minut</dd>
                </div>
                <div>
                  <dt><IconCalendarEvent aria-hidden="true" size={15} stroke={1.8} /> Ukončení akce</dt>
                  <dd>{formatujDatum(akce.konec ?? akce.zacatek)}</dd>
                </div>
              </dl>
            </article>
          </div>
        </section>

        <section className="verejny-section" id="nakup">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">Vstupenky</span>
              <h2>Vyber vstupenky hned teď</h2>
              <p>
                Nejdřív si projdi stručné informace o akci, potom máš celý výběr míst a vstupenek
                na jedné obrazovce bez skrytých kroků.
              </p>
            </div>
          </div>

          {kategorieVstupenek.length > 0 ? (
            <ObjednavkaKlient akce={akce} kategorieVstupenek={kategorieVstupenek} />
          ) : (
            <div className="public-empty-state">
              <strong>Pro tuto akci zatím nejsou zveřejněné aktivní vstupenky.</strong>
              <span>Jakmile pořadatel doplní prodej, objeví se zde výběr vstupenek.</span>
            </div>
          )}
        </section>

        {galerie.length ? (
          <section className="verejny-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">Galerie</span>
                <h2>Atmosféra a prostor akce</h2>
              </div>
            </div>
            <div className="event-gallery-grid">
              {galerie.map((fotka, index) => (
                <figure
                  key={fotka.id}
                  className={`event-gallery-card ratio-${galeriePomer}${fotka.je_doporucena ? " featured" : ""}`}
                >
                  <img alt={`${akce.nazev} – galerie ${index + 1}`} src={fotka.soubor_url} />
                  {fotka.popis ? <figcaption>{fotka.popis}</figcaption> : null}
                </figure>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <Paticka tenantNazev={tenantNazev} />
    </main>
  );
}

export async function generateMetadata({
  params,
}: DetailAkcePageProps): Promise<Metadata> {
  const { slug } = await params;
  const host = await nactiAktualniHost();
  const tenantKontext = await nactiTenantKontext(host);
  const akce = await nactiAkci(slug, host);

  if (!akce) {
    return {
      title: vytvorSeoTitulek("Akce nenalezena"),
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const kategorieVstupenek = await nactiKategorieVstupenekProAkci(akce.id, host);
  const nejnizsiCena =
    [...kategorieVstupenek].sort((a, b) => Number(a.cena) - Number(b.cena))[0] ?? null;
  const tenant = tenantKontext.organizace;
  const titulek = tenant
    ? `${akce.nazev} | ${tenant.nazev_verejny || tenant.nazev}`
    : akce.nazev;
  const popis =
    akce.perex ||
    akce.popis ||
    `Detail akce ${akce.nazev}, termín ${formatujDatum(akce.zacatek)} a online vstupenky.`;
  const hlavniObrazek = ziskejHlavniObrazekAkce(
    akce,
    vytvorAbsolutniUrl("/og-default.svg", host),
  );

  return {
    title: vytvorSeoTitulek(titulek),
    description: popis,
    alternates: {
      canonical: vytvorAbsolutniUrl(`/akce/${akce.slug}`, host),
    },
    openGraph: {
      title: titulek,
      description: popis,
      type: "article",
      url: vytvorAbsolutniUrl(`/akce/${akce.slug}`, host),
      images: hlavniObrazek ? [{ url: hlavniObrazek, alt: akce.nazev }] : undefined,
    },
    twitter: {
      card: hlavniObrazek ? "summary_large_image" : "summary",
      title: titulek,
      description: popis,
      images: hlavniObrazek ? [hlavniObrazek] : undefined,
    },
    other: nejnizsiCena
      ? {
          "product:price:amount": String(nejnizsiCena.cena),
          "product:price:currency": nejnizsiCena.mena,
        }
      : undefined,
  };
}
