import type { Akce, KategorieVstupenky } from "@/lib/api";
import { formatujCastku, formatujDatum, formatujTypAkce } from "@/lib/formatovani";

type Vlastnosti = {
  akce: Akce;
  kategorieVstupenek: KategorieVstupenky[];
};

export function KartaAkce({ akce, kategorieVstupenek }: Vlastnosti) {
  const hlavniCena =
    kategorieVstupenek
      .filter((kategorie) => kategorie.akce === akce.id)
      .sort((a, b) => Number(a.cena) - Number(b.cena))[0] ?? null;

  const jeVyprodano = akce.stav === "vyprodano";
  const datum = formatujDatum(akce.zacatek);

  return (
    <article className="event-card">
      <a className="event-card-cover" href={`/akce/${akce.slug}`}>
        <img
          alt={akce.nazev}
          className="event-card-image"
          src={
            akce.hlavni_fotka_soubor_url ||
            akce.hlavni_fotka_url ||
            akce.misto_konani_hlavni_fotka_url ||
            "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80"
          }
        />
        <div className="event-card-overlay">
          <span className="event-date-badge">{datum}</span>
          <span className={`event-status-badge${jeVyprodano ? " sold-out" : ""}`}>
            {jeVyprodano ? "Vyprodáno" : "V prodeji"}
          </span>
        </div>
      </a>
      <div className="event-card-body">
        <div className="event-card-topline">
          <span className="event-type-chip">{formatujTypAkce(akce.typ_akce)}</span>
          <span className="event-price-inline">
            {hlavniCena ? `Od ${formatujCastku(hlavniCena.cena, hlavniCena.mena)}` : "Cena bude doplněna"}
          </span>
        </div>
        <div className="event-card-copy">
          <h3>
            <a href={`/akce/${akce.slug}`}>{akce.nazev}</a>
          </h3>
          <p>{akce.perex || akce.popis || "Kulturní program připravený pro jednoduchý online nákup vstupenek."}</p>
        </div>
        <dl className="event-card-meta">
          <div>
            <dt>Termín</dt>
            <dd>{datum}</dd>
          </div>
          <div>
            <dt>Místo</dt>
            <dd>{akce.misto_konani_nazev}</dd>
          </div>
          <div>
            <dt>Obec</dt>
            <dd>{akce.organizace_nazev}</dd>
          </div>
          <div>
            <dt>Dostupnost</dt>
            <dd>{jeVyprodano ? "Bez volných míst" : `${akce.kapacita} míst v kapacitě`}</dd>
          </div>
        </dl>
      </div>
      <div className="event-card-footer">
        <div className="event-card-note">
          <strong>{jeVyprodano ? "Aktuálně bez volných míst" : "Výběr bez registrace"}</strong>
          <span>
            {jeVyprodano
              ? "Sleduj další termíny nebo podobné akce."
              : "Objednávku dokončíš v krátkém a přehledném kroku."}
          </span>
        </div>
        <a className="kulturni-button kulturni-button-primary" href={`/akce/${akce.slug}`}>
          {jeVyprodano ? "Zobrazit detail" : "Vybrat vstupenky"}
        </a>
      </div>
    </article>
  );
}
