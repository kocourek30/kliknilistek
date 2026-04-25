"use client";

import type { Akce } from "@/lib/api";
import {
  popisMistaZeSchema,
  vytvorKodMistaZRady,
  vytvorKodMistaZUseku,
  vytvorMapuStavuMist,
} from "@/lib/plan-salu";

type StavMista = NonNullable<Akce["stavy_mist"]>[number];

type Vlastnosti = {
  schema: Akce["schema_sezeni"];
  stavyMist?: Akce["stavy_mist"];
  vybranaMista?: string[];
  priPrepnutiMista?: (kod: string) => void;
  rezim?: "prodej" | "sprava";
};

function formatujStav(stav: string) {
  const mapovani: Record<string, string> = {
    volne: "Volne",
    blokovano: "Blokovano",
    rezervace: "V rezervaci",
    platne: "Prodano",
    odbavene: "Odbaveno",
  };
  return mapovani[stav] ?? stav;
}

function vytvorTitulekMista(kod: string, schema: Akce["schema_sezeni"], detail?: StavMista) {
  const casti = [popisMistaZeSchema(schema, kod, detail ? [detail] : undefined)];
  if (detail) {
    casti.push(formatujStav(detail.stav));
    if (detail.kategorie_vstupenky_nazev) {
      casti.push(detail.kategorie_vstupenky_nazev);
    }
    if (detail.objednavka_verejne_id) {
      casti.push(`Objednavka ${detail.objednavka_verejne_id}`);
    }
  }
  return casti.join(" · ");
}

function ziskejTridySedadla(zona: string, stav: string, jeVybrane: boolean) {
  return [
    "sedadlo-tlacitko",
    zona ? `zona-${zona}` : "",
    stav !== "volne" ? `stav-${stav}` : "",
    jeVybrane ? "vybrane" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function jeProdejnePole(typ: string) {
  return typ === "sedadlo" || typ === "stul";
}

function vykresliJednoSchema({
  schema,
  detailMist,
  vybranaMista,
  priPrepnutiMista,
  rezim,
}: {
  schema: NonNullable<Akce["schema_sezeni"]>;
  detailMist: Map<string, StavMista>;
  vybranaMista: string[];
  priPrepnutiMista?: (kod: string) => void;
  rezim: "prodej" | "sprava";
}) {
  if (schema.mrizka) {
    return vykresliMrizku({ schema, detailMist, vybranaMista, priPrepnutiMista, rezim });
  }
  if (schema.rady?.length) {
    return vykresliKlasickyPlan({ schema, detailMist, vybranaMista, priPrepnutiMista, rezim });
  }
  return null;
}

function vykresliKlasickyPlan({
  schema,
  detailMist,
  vybranaMista,
  priPrepnutiMista,
  rezim,
}: {
  schema: NonNullable<Akce["schema_sezeni"]>;
  detailMist: Map<string, StavMista>;
  vybranaMista: string[];
  priPrepnutiMista?: (kod: string) => void;
  rezim: "prodej" | "sprava";
}) {
  const lzeKlikat = typeof priPrepnutiMista === "function";

  function vykresliTlacitko(kod: string, popisek: number, zona: string) {
    const detail = detailMist.get(kod);
    const jeVybrane = vybranaMista.includes(kod);
    const jeBlokovane = rezim === "prodej" ? Boolean(!jeVybrane && detail?.stav && detail.stav !== "volne") : false;

    return (
      <button
        key={kod}
        className={ziskejTridySedadla(zona, detail?.stav ?? "volne", jeVybrane)}
        disabled={!lzeKlikat || jeBlokovane}
        onClick={() => priPrepnutiMista?.(kod)}
        title={vytvorTitulekMista(kod, schema, detail)}
        type="button"
      >
        {popisek}
      </button>
    );
  }

  return (
    <div className="sal-wrapper">
      {schema.stit ? <div className="jeviste">{schema.stit}</div> : null}
      <div className="sal-grid">
        {schema.rady.map((rada) => {
          const popisekRady = String(rada.popisek ?? rada.rada);

          if (rada.useky?.length) {
            return (
              <div key={`rada-${popisekRady}`} className="rada-grid-obecna">
                <div className="rada-popisek">{popisekRady}</div>
                <div className="rada-useky">
                  {rada.useky.map((usek) => (
                    <div key={`${popisekRady}-${usek.id}`} className={`blok-usek zona-${usek.zona || "stred"}`}>
                      {usek.mista.map((cislo) =>
                        vykresliTlacitko(vytvorKodMistaZUseku(usek, cislo), cislo, usek.zona || "stred"),
                      )}
                    </div>
                  ))}
                </div>
                <div className="rada-popisek">{popisekRady}</div>
              </div>
            );
          }

          return (
            <div key={`rada-${popisekRady}`} className="rada-grid">
              <div className="rada-popisek">{popisekRady}</div>
              <div className="blok-pristavek levy">
                {(rada.levy_pristavek ?? []).map((cislo) =>
                  vykresliTlacitko(vytvorKodMistaZRady(rada, "L", cislo), cislo, rada.zona_levy || "stred"),
                )}
              </div>
              <div
                className="blok-stred"
                style={{
                  gridTemplateColumns: `repeat(${schema.sloupce_stred ?? 17}, minmax(42px, 1fr))`,
                }}
              >
                {Array.from({ length: rada.odsazeni_stred ?? 0 }).map((_, index) => (
                  <div key={`mezera-${popisekRady}-${index}`} className="sedadlo-mezera" />
                ))}
                {(rada.stred ?? []).map((cislo) =>
                  vykresliTlacitko(vytvorKodMistaZRady(rada, "S", cislo), cislo, "stred"),
                )}
              </div>
              <div className="blok-pristavek pravy">
                {(rada.pravy_pristavek ?? []).map((cislo) =>
                  vykresliTlacitko(vytvorKodMistaZRady(rada, "P", cislo), cislo, rada.zona_pravy || "stred"),
                )}
              </div>
              <div className="rada-popisek">{popisekRady}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function vykresliMrizku({
  schema,
  detailMist,
  vybranaMista,
  priPrepnutiMista,
  rezim,
}: {
  schema: NonNullable<Akce["schema_sezeni"]>;
  detailMist: Map<string, StavMista>;
  vybranaMista: string[];
  priPrepnutiMista?: (kod: string) => void;
  rezim: "prodej" | "sprava";
}) {
  const mrizka = schema.mrizka;
  if (!mrizka) {
    return null;
  }

  const bunky = new Map(
    mrizka.bunky.map((bunka) => [`${bunka.radek}:${bunka.sloupec}`, bunka]),
  );

  return (
    <div className="sal-wrapper">
      {schema.stit ? <div className="jeviste">{schema.stit}</div> : null}
      <div
        className="plan-mrizka"
        style={{
          gridTemplateColumns: `repeat(${mrizka.sloupce}, minmax(30px, 34px))`,
          paddingLeft: mrizka.odsazeni_x ?? 0,
          paddingTop: mrizka.odsazeni_y ?? 0,
          columnGap: mrizka.mezera_x ?? 4,
          rowGap: mrizka.mezera_y ?? 4,
        }}
      >
        {Array.from({ length: mrizka.radky * mrizka.sloupce }).map((_, index) => {
          const radek = Math.floor(index / mrizka.sloupce) + 1;
          const sloupec = (index % mrizka.sloupce) + 1;
          const bunka = bunky.get(`${radek}:${sloupec}`);
          const typ = bunka?.typ ?? "prazdne";
          const kod = bunka?.kod ?? "";
          const jeProdejne = jeProdejnePole(typ);
          const detail = kod ? detailMist.get(kod) : undefined;
          const jeVybrane = kod ? vybranaMista.includes(kod) : false;
          const jeBlokovane =
            rezim === "prodej" && jeProdejne
              ? Boolean(!jeVybrane && detail?.stav && detail.stav !== "volne")
              : false;
          const tridy = [
            "mrizka-bunka",
            `typ-${typ}`,
            detail?.stav && jeProdejne ? `stav-${detail.stav}` : "",
            jeVybrane ? "vybrane" : "",
            jeProdejne ? "prodejna" : "neprodejna",
          ]
            .filter(Boolean)
            .join(" ");
          const titulek =
            kod && jeProdejne
              ? vytvorTitulekMista(kod, schema, detail)
              : bunka?.popis || bunka?.oznaceni || "";

          const obsah = bunka?.oznaceni ?? "";

          if (jeProdejne && kod) {
            return (
              <button
                key={`${radek}:${sloupec}`}
                className={tridy}
                disabled={!priPrepnutiMista || jeBlokovane}
                onClick={() => priPrepnutiMista?.(kod)}
                title={titulek}
                type="button"
              >
                {obsah}
              </button>
            );
          }

          return (
            <div key={`${radek}:${sloupec}`} className={tridy} title={titulek}>
              {obsah}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PlanSalu({
  schema,
  stavyMist,
  vybranaMista = [],
  priPrepnutiMista,
  rezim = "prodej",
}: Vlastnosti) {
  if (!schema) {
    return null;
  }

  const detailMist = vytvorMapuStavuMist(stavyMist);

  if (schema.podlazi?.length) {
    return (
      <div className="plan-podlazi">
        {schema.podlazi.map((podlazi) => (
          <section key={podlazi.id} className="podlazi-panel">
            <div className="podlazi-panel-hlavicka">
              <strong>{podlazi.nazev}</strong>
            </div>
            {vykresliJednoSchema({
              schema: {
                ...schema,
                stit: podlazi.stit || "",
                mrizka: podlazi.mrizka,
                rady: [],
              },
              detailMist,
              vybranaMista,
              priPrepnutiMista,
              rezim,
            })}
          </section>
        ))}
      </div>
    );
  }

  return vykresliJednoSchema({ schema, detailMist, vybranaMista, priPrepnutiMista, rezim });
}
