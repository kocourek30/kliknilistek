"use client";

import { useMemo, useState } from "react";

import type { Akce, KategorieVstupenky, Organizace } from "@/lib/api";
import { formatujTypAkce } from "@/lib/formatovani";
import { KartaAkce } from "@/components/karta-akce";

type Vlastnosti = {
  akce: Akce[];
  kategorieVstupenek: KategorieVstupenky[];
  organizace: Organizace[];
  vychoziLimit?: number;
  compact?: boolean;
};

export function VerejnyKatalog({
  akce,
  kategorieVstupenek,
  organizace,
  vychoziLimit,
  compact = false,
}: Vlastnosti) {
  const [vyhledavani, nastavVyhledavani] = useState("");
  const [filtrObec, nastavFiltrObec] = useState("vse");
  const [filtrMisto, nastavFiltrMisto] = useState("vse");
  const [filtrTyp, nastavFiltrTyp] = useState("vse");
  const [filtrDatum, nastavFiltrDatum] = useState("vse");

  const moznostiMist = useMemo(
    () =>
      Array.from(new Set(akce.map((polozka) => polozka.misto_konani_nazev).filter(Boolean))).sort(),
    [akce],
  );

  const moznostiTypu = useMemo(
    () =>
      Array.from(new Set(akce.map((polozka) => polozka.typ_akce || "koncert"))).map((typ) => ({
        hodnota: typ,
        popisek: formatujTypAkce(typ),
      })),
    [akce],
  );

  const filtrovaneAkce = useMemo(() => {
    const dnes = new Date();
    dnes.setHours(0, 0, 0, 0);
    const zaTyden = new Date(dnes);
    zaTyden.setDate(dnes.getDate() + 7);
    const zaMesic = new Date(dnes);
    zaMesic.setMonth(dnes.getMonth() + 1);

    const vysledek = akce.filter((polozka) => {
      const datumAkce = new Date(polozka.zacatek);
      const hledani = vyhledavani.trim().toLowerCase();
      const obecSouhlasi =
        filtrObec === "vse" || String(polozka.organizace) === filtrObec;
      const mistoSouhlasi =
        filtrMisto === "vse" || polozka.misto_konani_nazev === filtrMisto;
      const typSouhlasi =
        filtrTyp === "vse" || (polozka.typ_akce || "koncert") === filtrTyp;
      const hledaniSouhlasi =
        !hledani ||
        [
          polozka.nazev,
          polozka.perex,
          polozka.popis,
          polozka.misto_konani_nazev,
          polozka.organizace_nazev,
        ]
          .filter(Boolean)
          .some((hodnota) => hodnota?.toLowerCase().includes(hledani));
      const datumSouhlasi =
        filtrDatum === "vse"
          ? true
          : filtrDatum === "dnes"
            ? datumAkce >= dnes && datumAkce < new Date(dnes.getTime() + 24 * 60 * 60 * 1000)
            : filtrDatum === "tyden"
              ? datumAkce >= dnes && datumAkce <= zaTyden
              : datumAkce >= dnes && datumAkce <= zaMesic;

      return hledaniSouhlasi && obecSouhlasi && mistoSouhlasi && typSouhlasi && datumSouhlasi;
    });

    if (typeof vychoziLimit === "number") {
      return vysledek.slice(0, vychoziLimit);
    }

    return vysledek;
  }, [akce, filtrDatum, filtrMisto, filtrObec, filtrTyp, vychoziLimit, vyhledavani]);

  return (
    <section className="catalog-shell">
      <div className="catalog-filterbar">
        <label className="field field-search">
          <span>Hledat</span>
          <input
            placeholder="Název akce, místo nebo obec"
            type="search"
            value={vyhledavani}
            onChange={(event) => nastavVyhledavani(event.target.value)}
          />
        </label>
        <label className="field field-compact">
          <span>Obec</span>
          <select value={filtrObec} onChange={(event) => nastavFiltrObec(event.target.value)}>
            <option value="vse">Všechny obce</option>
            {organizace.map((polozka) => (
              <option key={polozka.id} value={String(polozka.id)}>
                {polozka.nazev}
              </option>
            ))}
          </select>
        </label>
        <label className="field field-compact">
          <span>Datum</span>
          <select value={filtrDatum} onChange={(event) => nastavFiltrDatum(event.target.value)}>
            <option value="vse">Všechna data</option>
            <option value="dnes">Dnes</option>
            <option value="tyden">Nejbližší týden</option>
            <option value="mesic">Nejbližší měsíc</option>
          </select>
        </label>
        <label className="field field-compact">
          <span>Místo</span>
          <select value={filtrMisto} onChange={(event) => nastavFiltrMisto(event.target.value)}>
            <option value="vse">Všechna místa</option>
            {moznostiMist.map((misto) => (
              <option key={misto} value={misto}>
                {misto}
              </option>
            ))}
          </select>
        </label>
        <label className="field field-compact">
          <span>Typ akce</span>
          <select value={filtrTyp} onChange={(event) => nastavFiltrTyp(event.target.value)}>
            <option value="vse">Všechny typy</option>
            {moznostiTypu.map((typ) => (
              <option key={typ.hodnota} value={typ.hodnota}>
                {typ.popisek}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="catalog-toolbar-meta">
        <strong>{filtrovaneAkce.length}</strong>
        <span>{filtrovaneAkce.length === 1 ? "nalezená akce" : "nalezených akcí"}</span>
      </div>

      {filtrovaneAkce.length ? (
        <div className={`event-grid${compact ? " event-grid-compact" : ""}`}>
          {filtrovaneAkce.map((polozka) => (
            <KartaAkce
              key={polozka.id}
              akce={polozka}
              kategorieVstupenek={kategorieVstupenek}
            />
          ))}
        </div>
      ) : (
        <div className="public-empty-state">
          <strong>Pro zvolené filtry jsme teď nenašli žádnou akci.</strong>
          <span>Zkus upravit datum, obec nebo typ programu.</span>
        </div>
      )}
    </section>
  );
}
