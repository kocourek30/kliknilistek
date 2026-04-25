"use client";

import { useEffect, useMemo, useState } from "react";

import { PlanSalu } from "@/components/plan-salu";
import { GrafRozlozeni, GrafSloupcovy } from "@/components/sprava-grafy";
import {
  blokovatMistoAkce,
  doporucFotkuGalerieAkceSprava,
  nahrajFotkyGalerieAkceSprava,
  nactiPrehledSpravy,
  nactiProfilSpravy,
  nactiSouhrnAdministrace,
  odblokovatMistoAkce,
  posunFotkuGalerieAkceSprava,
  prevzitSchemaMistaDoAkce,
  provedOdbaveni,
  smazFotkuGalerieAkceSprava,
  upravAkciSprava,
  upravFotkuGalerieAkceSprava,
  upravKategoriiVstupenkySprava,
  vytvorTokenSpravy,
  zrusDoporuceniFotkyGalerieAkceSprava,
  zrusitSchemaOverrideAkce,
  type Akce,
  type KategorieVstupenky,
  type Objednavka,
  type ProfilSpravy,
} from "@/lib/api";
import {
  formatujCastku,
  formatujDatum,
  formatujStavAkce,
  formatujStavMista,
  formatujStavObjednavky,
  formatujStavVstupenky,
} from "@/lib/formatovani";
import { vytvorVychoziPrihlaseni } from "@/lib/demo-rezim";

const klicTokenu = "kliknilistek.sprava.token";
const pomeryFotky = [
  { hodnota: "kino", popisek: "Kino 16:9" },
  { hodnota: "siroky", popisek: "Široký 3:2" },
  { hodnota: "ctverec", popisek: "Čtverec 1:1" },
];

type StavNacitani = "cekam" | "prihlaseni" | "nacitani" | "pripraveno";

type Vlastnosti = {
  slug: string;
};

export function SpravaDetailAkceBrana({ slug }: Vlastnosti) {
  const [stav, nastavStav] = useState<StavNacitani>("cekam");
  const [tokenSpravy, nastavTokenSpravy] = useState("");
  const [profil, nastavProfil] = useState<ProfilSpravy | null>(null);
  const [akce, nastavAkci] = useState<Akce | null>(null);
  const [kategorie, nastavKategorie] = useState<KategorieVstupenky[]>([]);
  const [objednavky, nastavObjednavky] = useState<Objednavka[]>([]);
  const [vykonnost, nastavVykonnost] = useState<Record<string, unknown> | null>(null);
  const [chyba, nastavChybu] = useState("");
  const [zprava, nastavZpravu] = useState("");
  const [vybraneMisto, nastavVybraneMisto] = useState("");
  const [filtrStavuMista, nastavFiltrStavuMista] = useState("vse");
  const [filtrZonyMista, nastavFiltrZonyMista] = useState("vse");
  const [duvodBlokace, nastavDuvodBlokace] = useState("");
  const [formular, nastavFormular] = useState(vytvorVychoziPrihlaseni("spravce"));
  const [editor, nastavEditor] = useState({
    nazev: "",
    perex: "",
    popis: "",
    hlavni_fotka_url: "",
    hlavni_fotka: null as File | null,
    hlavni_fotka_pomer: "kino",
    galerie_fotka_pomer: "siroky",
    video_url: "",
    stav: "navrh",
    kapacita: "0",
    rezervace_platnost_minuty: "15",
    je_doporucena: false,
  });
  const [zonyKategorii, nastavZonyKategorii] = useState<Record<number, string>>({});
  const [fotkyGalerieKUploadu, nastavFotkyGalerieKUploadu] = useState<File[]>([]);
  const [nahledHlavniFotky, nastavNahledHlavniFotky] = useState("");
  const [nahledyGalerie, nastavNahledyGalerie] = useState<string[]>([]);
  const [popiskyGalerie, nastavPopiskyGalerie] = useState<Record<number, string>>({});

  async function nactiDetail(token: string) {
    nastavStav("nacitani");
    nastavChybu("");

    try {
      const [profilSpravy, dataSpravy, dataPrehledu] = await Promise.all([
        nactiProfilSpravy(token),
        nactiSouhrnAdministrace(token),
        nactiPrehledSpravy(token),
      ]);

      if (!profilSpravy.ma_pristup_do_spravy || !profilSpravy.opravneni.sprava_obsahu) {
        throw new Error("Tento účet nemá přístup do správy akcí.");
      }

      const detailAkce = dataSpravy.akce.find((polozka) => polozka.slug === slug) ?? null;
      if (!detailAkce) {
        throw new Error("Akce nebyla nalezena.");
      }

      const kategorieAkce = dataSpravy.kategorieVstupenek.filter(
        (polozka) => polozka.akce === detailAkce.id,
      );
      const objednavkyAkce = dataSpravy.objednavky.filter((objednavka) =>
        objednavka.polozky.some((polozka) => polozka.akce === detailAkce.id),
      );
      const radekVykonnosti =
        dataPrehledu.vykonnost_akci.find((polozka) => polozka.slug === detailAkce.slug) ?? null;

      localStorage.setItem(klicTokenu, token);
      nastavTokenSpravy(token);
      nastavProfil(profilSpravy);
      nastavAkci(detailAkce);
      nastavKategorie(kategorieAkce);
      nastavObjednavky(objednavkyAkce);
      nastavVykonnost(radekVykonnosti);
      nastavEditor({
        nazev: detailAkce.nazev,
        perex: detailAkce.perex || "",
        popis: detailAkce.popis || "",
        hlavni_fotka_url: detailAkce.hlavni_fotka_url || "",
        hlavni_fotka: null,
        hlavni_fotka_pomer: detailAkce.hlavni_fotka_pomer || "kino",
        galerie_fotka_pomer: detailAkce.galerie_fotka_pomer || "siroky",
        video_url: detailAkce.video_url || "",
        stav: detailAkce.stav,
        kapacita: String(detailAkce.kapacita),
        rezervace_platnost_minuty: String(detailAkce.rezervace_platnost_minuty),
        je_doporucena: detailAkce.je_doporucena,
      });
      nastavZonyKategorii(
        Object.fromEntries(
          kategorieAkce.map((polozka) => [polozka.id, (polozka.povolene_zony ?? []).join(", ")]),
        ),
      );
      nastavFotkyGalerieKUploadu([]);
      nastavPopiskyGalerie(
        Object.fromEntries((detailAkce.fotky_galerie ?? []).map((fotka) => [fotka.id, fotka.popis || ""])),
      );
      nastavStav("pripraveno");
    } catch (error) {
      localStorage.removeItem(klicTokenu);
      nastavTokenSpravy("");
      nastavProfil(null);
      nastavAkci(null);
      nastavKategorie([]);
      nastavObjednavky([]);
      nastavVykonnost(null);
      nastavStav("prihlaseni");
      nastavChybu(error instanceof Error ? error.message : "Detail akce se nepodařilo načíst.");
    }
  }

  useEffect(() => {
    const ulozenyToken = localStorage.getItem(klicTokenu);
    if (!ulozenyToken) {
      nastavStav("prihlaseni");
      return;
    }
    void nactiDetail(ulozenyToken);
  }, [slug]);

  useEffect(() => {
    if (!editor.hlavni_fotka) {
      nastavNahledHlavniFotky("");
      return;
    }

    const url = URL.createObjectURL(editor.hlavni_fotka);
    nastavNahledHlavniFotky(url);
    return () => URL.revokeObjectURL(url);
  }, [editor.hlavni_fotka]);

  useEffect(() => {
    if (!fotkyGalerieKUploadu.length) {
      nastavNahledyGalerie([]);
      return;
    }

    const urls = fotkyGalerieKUploadu.map((soubor) => URL.createObjectURL(soubor));
    nastavNahledyGalerie(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [fotkyGalerieKUploadu]);

  const aktivniKategorie = useMemo(
    () => kategorie.filter((polozka) => polozka.je_aktivni),
    [kategorie],
  );
  const aktivniMista = useMemo(
    () => (akce?.stavy_mist ?? []).filter((misto) => misto.stav !== "volne"),
    [akce],
  );
  const detailVybranehoMista = useMemo(
    () => (akce?.stavy_mist ?? []).find((misto) => misto.kod === vybraneMisto) ?? null,
    [akce, vybraneMisto],
  );
  const filtrovanaMista = useMemo(
    () =>
      (akce?.stavy_mist ?? []).filter((misto) => {
        const stavOk = filtrStavuMista === "vse" ? true : misto.stav === filtrStavuMista;
        const zonaOk = filtrZonyMista === "vse" ? true : misto.zona === filtrZonyMista;
        return stavOk && zonaOk;
      }),
    [akce?.stavy_mist, filtrStavuMista, filtrZonyMista],
  );
  const souhrnMist = {
    volne: akce?.souhrn_mist?.volne ?? 0,
    rezervace: akce?.souhrn_mist?.rezervace ?? 0,
    platne: akce?.souhrn_mist?.platne ?? 0,
    odbavene: akce?.souhrn_mist?.odbavene ?? 0,
    blokovano: (akce?.souhrn_mist as { blokovano?: number } | undefined)?.blokovano ?? 0,
  };
  const souhrnZon = useMemo(() => {
    const mapa: Record<
      string,
      { celkem: number; prodano: number; odbaveno: number; rezervace: number; blokovano: number }
    > = {};
    for (const misto of akce?.stavy_mist ?? []) {
      const zona = misto.zona || "bez-zóny";
      mapa[zona] ??= { celkem: 0, prodano: 0, odbaveno: 0, rezervace: 0, blokovano: 0 };
      mapa[zona].celkem += 1;
      if (misto.stav === "platne") mapa[zona].prodano += 1;
      if (misto.stav === "odbavene") mapa[zona].odbaveno += 1;
      if (misto.stav === "rezervace") mapa[zona].rezervace += 1;
      if (misto.stav === "blokovano") mapa[zona].blokovano += 1;
    }
    return Object.entries(mapa);
  }, [akce?.stavy_mist]);
  const grafStavuMist = useMemo(
    () => [
      { stitek: "Volná", hodnota: souhrnMist.volne, barva: "#7db9ff" },
      { stitek: "Rezervace", hodnota: souhrnMist.rezervace, barva: "#f5c36b" },
      { stitek: "Prodaná", hodnota: souhrnMist.platne, barva: "#5c6774" },
      { stitek: "Odbavená", hodnota: souhrnMist.odbavene, barva: "#73e0ba" },
      { stitek: "Blokovaná", hodnota: souhrnMist.blokovano, barva: "#3e4350" },
    ],
    [souhrnMist],
  );
  const grafZon = useMemo(
    () =>
      souhrnZon.map(([zona, souhrn]) => ({
        stitek: zona,
        hodnota: souhrn.prodano + souhrn.odbaveno + souhrn.rezervace,
      })),
    [souhrnZon],
  );

  async function odesliPrihlaseni(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = vytvorTokenSpravy(formular.uzivatel, formular.heslo);
    await nactiDetail(token);
  }

  async function ulozZmeny() {
    if (!akce) {
      return;
    }

    nastavChybu("");
    nastavZpravu("");

    try {
      const upravenaAkce = await upravAkciSprava(
        akce.slug,
        {
          nazev: editor.nazev,
          perex: editor.perex,
          popis: editor.popis,
          hlavni_fotka_url: editor.hlavni_fotka_url,
          hlavni_fotka: editor.hlavni_fotka,
          hlavni_fotka_pomer: editor.hlavni_fotka_pomer,
          galerie_fotka_pomer: editor.galerie_fotka_pomer,
          video_url: editor.video_url,
          stav: editor.stav,
          kapacita: Number(editor.kapacita),
          rezervace_platnost_minuty: Number(editor.rezervace_platnost_minuty),
          je_doporucena: editor.je_doporucena,
        },
        tokenSpravy,
      );
      nastavAkci(upravenaAkce);
      nastavZpravu("Akce byla uložena.");
      await nactiDetail(tokenSpravy);
    } catch (error) {
      nastavChybu(error instanceof Error ? error.message : "Akci se nepodařilo uložit.");
    }
  }

  async function ulozZonyKategorie(kategorieId: number) {
    try {
      await upravKategoriiVstupenkySprava(
        kategorieId,
        {
          povolene_zony: (zonyKategorii[kategorieId] || "")
            .split(",")
            .map((polozka) => polozka.trim())
            .filter(Boolean),
        },
        tokenSpravy,
      );
      nastavZpravu("Povolené zóny kategorie byly uloženy.");
      await nactiDetail(tokenSpravy);
    } catch (error) {
      nastavChybu(error instanceof Error ? error.message : "Kategorii se nepodařilo upravit.");
    }
  }

  if (stav === "cekam" || stav === "nacitani") {
    return (
      <section className="sprava-panel">
        <div className="sprava-panel-body">
          <div className="tlumeny">Načítám detail akce a provozní data...</div>
        </div>
      </section>
    );
  }

  if (stav === "prihlaseni") {
    return (
      <div className="sprava-prihlaseni">
        <section className="sprava-panel">
          <div className="sprava-panel-header">
            <div>
              <h3>Přihlášení do detailu akce</h3>
              <p>Tento detail je dostupný jen po přihlášení do správy.</p>
            </div>
          </div>
          <div className="sprava-panel-body stack">
            <form className="form-grid" onSubmit={odesliPrihlaseni}>
              <label className="pole">
                <span className="pole-label">Uživatelské jméno</span>
                <input
                  value={formular.uzivatel}
                  onChange={(event) =>
                    nastavFormular((aktualni) => ({ ...aktualni, uzivatel: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="pole">
                <span className="pole-label">Heslo</span>
                <input
                  type="password"
                  value={formular.heslo}
                  onChange={(event) =>
                    nastavFormular((aktualni) => ({ ...aktualni, heslo: event.target.value }))
                  }
                  required
                />
              </label>
              <div className="actions-end pole-cela">
                <button className="button primary" type="submit">
                  Otevřít detail akce
                </button>
              </div>
            </form>
            {chyba ? <div className="hlaseni chyba">{chyba}</div> : null}
          </div>
        </section>
      </div>
    );
  }

  if (!akce || !profil) {
    return null;
  }

  const obrazekPozadi =
    nahledHlavniFotky ||
    akce.hlavni_fotka_soubor_url ||
    editor.hlavni_fotka_url ||
    akce.misto_konani_hlavni_fotka_url ||
    "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80";
  const galerieFotky = akce.fotky_galerie ?? [];
  return (
    <div className="stack">
      {(chyba || zprava) && (
        <div className={chyba ? "hlaseni chyba" : "hlaseni uspech"}>{chyba || zprava}</div>
      )}

      <section className="detail-akce-spravy-hero">
        <div
          className="detail-akce-spravy-hero-copy"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(14, 25, 38, 0.78), rgba(10, 18, 28, 0.96)), url('${obrazekPozadi}')`,
          }}
        >
          <div className="hero-meta">
            <span className="badge akcent">{akce.organizace_nazev}</span>
            <span className="badge">{formatujStavAkce(akce.stav)}</span>
            {akce.je_doporucena ? <span className="badge">Doporučená</span> : null}
          </div>
          <h1>{akce.nazev}</h1>
          <p>
            {akce.perex ||
              "Obsah, prodej a mapa míst na jednom pracovním místě."}
          </p>
        </div>

        <aside className="sprava-panel detail-akce-akce">
          <div className="sprava-panel-header">
            <div>
              <h3>Rychlé akce</h3>
              <p>Nejčastější akce pro pořadatele.</p>
            </div>
          </div>
          <div className="sprava-panel-body stack-mini">
            <a className="button primary" href={`/akce/${akce.slug}`} target="_blank">
              Veřejný detail
            </a>
            <a className="button ghost" href="/odbaveni" target="_blank">
              Odbavení
            </a>
            <a className="button ghost" href="#obsah-akce">
              Obsah a média
            </a>
            <a className="button ghost" href="#prodej-akce">
              Prodej a kapacity
            </a>
            <a className="button ghost" href="#schema-akce">
              Plánek a místa
            </a>
            <a className="button ghost" href="#objednavky-akce">
              Objednávky
            </a>
            <a className="button ghost" href={`/sprava/mista/${akce.misto_konani}`}>
              Editor plánku
            </a>
            <button
              className="button ghost"
              type="button"
              onClick={async () => {
                try {
                  const detail = await prevzitSchemaMistaDoAkce(akce.slug, tokenSpravy);
                  nastavAkci(detail);
                  nastavZpravu("Akce převzala aktuální plánek místa konání do vlastní kopie.");
                  await nactiDetail(tokenSpravy);
                } catch (error) {
                  nastavChybu(error instanceof Error ? error.message : "Schéma se nepodařilo převzít.");
                }
              }}
            >
              Převzít schéma místa
            </button>
            {akce.ma_vlastni_schema_sezeni ? (
              <button
                className="button ghost"
                type="button"
                onClick={async () => {
                  try {
                    const detail = await zrusitSchemaOverrideAkce(akce.slug, tokenSpravy);
                    nastavAkci(detail);
                    nastavZpravu(
                      "Override plánku byl zrušen a akce se vrátila na schéma místa konání.",
                    );
                    await nactiDetail(tokenSpravy);
                  } catch (error) {
                    nastavChybu(error instanceof Error ? error.message : "Override se nepodařilo zrušit.");
                  }
                }}
              >
                Zrušit override
              </button>
            ) : null}
            {editor.video_url ? (
              <a className="button ghost" href={editor.video_url} target="_blank">
                Otevřít video
              </a>
            ) : null}
            <div className="micro">Přihlášen: {profil.uzivatel}</div>
          </div>
        </aside>
      </section>

      <section className="detail-akce-horni-lista">
        <div className="detail-akce-metriky">
          <article className="souhrn-karta akcentni">
            <div className="stit">Prodáno</div>
            <div className="cislo">{souhrnMist.platne}</div>
            <div className="tlumeny">Platná prodaná místa.</div>
          </article>
          <article className="souhrn-karta">
            <div className="stit">Rezervace</div>
            <div className="cislo">{souhrnMist.rezervace}</div>
            <div className="tlumeny">Dočasně držená místa.</div>
          </article>
          <article className="souhrn-karta">
            <div className="stit">Odbaveno</div>
            <div className="cislo">{souhrnMist.odbavene}</div>
            <div className="tlumeny">Zkontrolovaný vstup.</div>
          </article>
          <article className="souhrn-karta">
            <div className="stit">Blokováno</div>
            <div className="cislo">{souhrnMist.blokovano}</div>
            <div className="tlumeny">Ručně uzavřená místa.</div>
          </article>
        </div>
        <div className="detail-akce-sekce-nav">
          <a href="#obsah-akce">Obsah</a>
          <a href="#prodej-akce">Prodej</a>
          <a href="#schema-akce">Plánek</a>
          <a href="#objednavky-akce">Objednávky</a>
        </div>
      </section>

      <div className="grafy-grid">
        <GrafRozlozeni
          nadpis="Stavy míst"
          popis="Aktuální rozložení míst v prodeji a provozu."
          polozky={grafStavuMist}
        />
        <GrafSloupcovy
          nadpis="Vytíženost zón"
          popis="Kolik míst je v jednotlivých zónách aktivně využito."
          polozky={grafZon}
        />
      </div>

      <section className="detail-spravy-grid detail-akce-sekce">
        <article className="sprava-panel" id="obsah-akce">
          <div className="sprava-panel-header">
            <div>
              <h3>Obsah a média</h3>
              <p>Texty a média pro veřejný detail.</p>
            </div>
          </div>
          <div className="sprava-panel-body">
            <div className="form-grid">
              <label className="pole">
                <span className="pole-label">Název akce</span>
                <input
                  value={editor.nazev}
                  onChange={(event) =>
                    nastavEditor((predchozi) => ({ ...predchozi, nazev: event.target.value }))
                  }
                />
              </label>
              <label className="pole">
                <span className="pole-label">Stav</span>
                <select
                  value={editor.stav}
                  onChange={(event) =>
                    nastavEditor((predchozi) => ({ ...predchozi, stav: event.target.value }))
                  }
                >
                  <option value="navrh">Návrh</option>
                  <option value="zverejneno">Zveřejněno</option>
                  <option value="vyprodano">Vyprodáno</option>
                  <option value="ukonceno">Ukončeno</option>
                  <option value="zruseno">Zrušeno</option>
                </select>
              </label>
              <label className="pole pole-cela">
                <span className="pole-label">Perex</span>
                <input
                  value={editor.perex}
                  onChange={(event) =>
                    nastavEditor((predchozi) => ({ ...predchozi, perex: event.target.value }))
                  }
                />
              </label>
              <label className="pole pole-cela">
                <span className="pole-label">Popis</span>
                <textarea
                  rows={6}
                  value={editor.popis}
                  onChange={(event) =>
                    nastavEditor((predchozi) => ({ ...predchozi, popis: event.target.value }))
                  }
                />
              </label>
              <label className="pole pole-cela">
                <span className="pole-label">URL hlavní fotky</span>
                <input
                  value={editor.hlavni_fotka_url}
                  onChange={(event) =>
                    nastavEditor((predchozi) => ({
                      ...predchozi,
                      hlavni_fotka_url: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="pole pole-cela">
                <span className="pole-label">Nahrát novou fotku akce</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    nastavEditor((predchozi) => ({
                      ...predchozi,
                      hlavni_fotka: event.target.files?.[0] ?? null,
                    }))
                  }
                />
                <span className="pole-help">
                  {akce.hlavni_fotka_soubor_url
                    ? "Nahraná fotka má přednost před URL. Když vybereš nový soubor, přepíše aktuální obrázek akce."
                    : "Můžeš použít URL nebo nahrát vlastní fotku přímo ze zařízení."}
                </span>
              </label>
              <label className="pole">
                <span className="pole-label">Poměr hlavní fotky</span>
                <select
                  value={editor.hlavni_fotka_pomer}
                  onChange={(event) =>
                    nastavEditor((predchozi) => ({
                      ...predchozi,
                      hlavni_fotka_pomer: event.target.value,
                    }))
                  }
                >
                  {pomeryFotky.map((pomer) => (
                    <option key={pomer.hodnota} value={pomer.hodnota}>
                      {pomer.popisek}
                    </option>
                  ))}
                </select>
              </label>
              <label className="pole">
                <span className="pole-label">Poměr galerie</span>
                <select
                  value={editor.galerie_fotka_pomer}
                  onChange={(event) =>
                    nastavEditor((predchozi) => ({
                      ...predchozi,
                      galerie_fotka_pomer: event.target.value,
                    }))
                  }
                >
                  {pomeryFotky.map((pomer) => (
                    <option key={pomer.hodnota} value={pomer.hodnota}>
                      {pomer.popisek}
                    </option>
                  ))}
                </select>
              </label>
              <label className="pole pole-cela">
                <span className="pole-label">Galerie akce</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) =>
                    nastavFotkyGalerieKUploadu(Array.from(event.target.files ?? []))
                  }
                />
                <span className="pole-help">
                  Další fotky se ukážou pod hlavní fotkou v detailu akce. Hodí se pro sál, atmosféru
                  a orientační snímky prostoru.
                </span>
              </label>
              <label className="pole pole-cela">
                <span className="pole-label">URL videa</span>
                <input
                  value={editor.video_url}
                  onChange={(event) =>
                    nastavEditor((predchozi) => ({ ...predchozi, video_url: event.target.value }))
                  }
                />
              </label>
              <label className="pole-checkbox pole-cela">
                <input
                  checked={editor.je_doporucena}
                  type="checkbox"
                  onChange={(event) =>
                    nastavEditor((predchozi) => ({
                      ...predchozi,
                      je_doporucena: event.target.checked,
                    }))
                  }
                />
                <span>Doporučit akci na veřejném portálu</span>
              </label>
              <div className="actions-end pole-cela">
                <button className="button primary" onClick={() => void ulozZmeny()} type="button">
                  Uložit obsah akce
                </button>
                <button
                  className="button ghost"
                  disabled={!fotkyGalerieKUploadu.length}
                  onClick={async () => {
                    try {
                      const detail = await nahrajFotkyGalerieAkceSprava(
                        akce.slug,
                        fotkyGalerieKUploadu,
                        tokenSpravy,
                      );
                      nastavAkci(detail);
                      nastavFotkyGalerieKUploadu([]);
                      nastavZpravu("Fotky galerie byly nahrány.");
                      await nactiDetail(tokenSpravy);
                    } catch (error) {
                      nastavChybu(
                        error instanceof Error ? error.message : "Galerii se nepodařilo nahrát.",
                      );
                    }
                  }}
                  type="button"
                >
                  Nahrát galerii
                </button>
              </div>
            </div>
          </div>
        </article>

        <article className="sprava-panel media-preview-panel">
          <div className="sprava-panel-header">
            <div>
              <h3>Náhled výstupu</h3>
              <p>Rychlý náhled veřejné prezentace.</p>
            </div>
          </div>
          <div className="sprava-panel-body stack">
            <div
              className={`media-preview-fotka ratio-${editor.hlavni_fotka_pomer}`}
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(8, 17, 27, 0.16), rgba(8, 17, 27, 0.86)), url('${obrazekPozadi}')`,
              }}
            >
              <div className="badge akcent">Hlavní fotka</div>
            </div>
            {nahledyGalerie.length ? (
              <div className="admin-fotogalerie">
                <strong>Připraveno k nahrání</strong>
                <div className="admin-fotogalerie-nahledy">
                  {nahledyGalerie.map((url, index) => (
                    <div
                      key={url}
                      className="admin-fotogalerie-miniatura pripravena"
                      style={{ backgroundImage: `url('${url}')` }}
                      title={`Nová fotka ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {galerieFotky.length ? (
              <div className="admin-fotogalerie">
                <strong>Aktuální galerie</strong>
                <div className="admin-fotogalerie-nahledy">
                  {galerieFotky.map((fotka) => (
                    <div key={fotka.id} className="admin-fotogalerie-karta">
                      <div
                        className={`admin-fotogalerie-miniatura ratio-${editor.galerie_fotka_pomer}`}
                        style={{ backgroundImage: `url('${fotka.soubor_url}')` }}
                      />
                      <div className="admin-fotogalerie-meta">
                        <span className={`badge${fotka.je_doporucena ? " akcent" : ""}`}>
                          {fotka.je_doporucena ? "Doporučená" : `Pořadí ${fotka.poradi}`}
                        </span>
                      </div>
                      <label className="pole admin-fotogalerie-popis">
                        <span className="pole-label">Popisek fotky</span>
                        <input
                          value={popiskyGalerie[fotka.id] ?? ""}
                          onChange={(event) =>
                            nastavPopiskyGalerie((aktualni) => ({
                              ...aktualni,
                              [fotka.id]: event.target.value,
                            }))
                          }
                          placeholder="Např. foyer, sál před začátkem, pohled z balkonu"
                        />
                      </label>
                      <div className="admin-fotogalerie-akce">
                        <button
                          className="button ghost small"
                          onClick={async () => {
                            try {
                              const detail = await upravFotkuGalerieAkceSprava(
                                akce.slug,
                                fotka.id,
                                { popis: popiskyGalerie[fotka.id] ?? "" },
                                tokenSpravy,
                              );
                              nastavAkci(detail);
                              nastavZpravu("Popisek fotky byl uložen.");
                              await nactiDetail(tokenSpravy);
                            } catch (error) {
                              nastavChybu(
                                error instanceof Error
                                  ? error.message
                                  : "Popisek fotky se nepodařilo uložit.",
                              );
                            }
                          }}
                          type="button"
                        >
                          Uložit popisek
                        </button>
                        <button
                          className="button ghost small"
                          onClick={async () => {
                            try {
                              const detail = await posunFotkuGalerieAkceSprava(
                                akce.slug,
                                fotka.id,
                                "nahoru",
                                tokenSpravy,
                              );
                              nastavAkci(detail);
                              await nactiDetail(tokenSpravy);
                            } catch (error) {
                              nastavChybu(
                                error instanceof Error
                                  ? error.message
                                  : "Fotku se nepodařilo posunout.",
                              );
                            }
                          }}
                          type="button"
                        >
                          Nahoru
                        </button>
                        <button
                          className="button ghost small"
                          onClick={async () => {
                            try {
                              const detail = await posunFotkuGalerieAkceSprava(
                                akce.slug,
                                fotka.id,
                                "dolu",
                                tokenSpravy,
                              );
                              nastavAkci(detail);
                              await nactiDetail(tokenSpravy);
                            } catch (error) {
                              nastavChybu(
                                error instanceof Error
                                  ? error.message
                                  : "Fotku se nepodařilo posunout.",
                              );
                            }
                          }}
                          type="button"
                        >
                          Dolů
                        </button>
                        <button
                          className="button ghost small"
                          onClick={async () => {
                            try {
                              const detail = fotka.je_doporucena
                                ? await zrusDoporuceniFotkyGalerieAkceSprava(
                                    akce.slug,
                                    fotka.id,
                                    tokenSpravy,
                                  )
                                : await doporucFotkuGalerieAkceSprava(
                                    akce.slug,
                                    fotka.id,
                                    tokenSpravy,
                                  );
                              nastavAkci(detail);
                              nastavZpravu(
                                fotka.je_doporucena
                                  ? "Doporučená fotka byla zrušena."
                                  : "Fotka byla označena jako doporučená.",
                              );
                              await nactiDetail(tokenSpravy);
                            } catch (error) {
                              nastavChybu(
                                error instanceof Error
                                  ? error.message
                                  : "Doporučenou fotku se nepodařilo změnit.",
                              );
                            }
                          }}
                          type="button"
                        >
                          {fotka.je_doporucena ? "Zrušit" : "Doporučit"}
                        </button>
                        <button
                          className="button ghost small"
                          onClick={async () => {
                            try {
                              const detail = await smazFotkuGalerieAkceSprava(
                                akce.slug,
                                fotka.id,
                                tokenSpravy,
                              );
                              nastavAkci(detail);
                              nastavZpravu("Fotka byla z galerie odebrána.");
                              await nactiDetail(tokenSpravy);
                            } catch (error) {
                              nastavChybu(
                                error instanceof Error
                                  ? error.message
                                  : "Fotku se nepodařilo odstranit.",
                              );
                            }
                          }}
                          type="button"
                        >
                          Odebrat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="tlumeny">Galerie zatím neobsahuje další fotky.</div>
            )}
            {editor.video_url ? (
              <div className="media-preview-video">
                <strong>Video odkaz</strong>
                <a href={editor.video_url} target="_blank">
                  {editor.video_url}
                </a>
              </div>
            ) : (
              <div className="tlumeny">Video zatím není připojené.</div>
            )}
          </div>
        </article>
      </section>

      <section className="detail-spravy-grid detail-akce-sekce" id="prodej-akce">
        <article className="sprava-panel">
          <div className="sprava-panel-header">
            <div>
              <h3>Prodej a kapacity</h3>
              <p>Kapacita, termín a základní provozní čísla.</p>
            </div>
          </div>
          <div className="sprava-panel-body">
            <div className="detail-grid">
              <div className="detail-pole">
                <span>Začátek</span>
                <strong>{formatujDatum(akce.zacatek)}</strong>
              </div>
              <div className="detail-pole">
                <span>Konec</span>
                <strong>{formatujDatum(akce.konec ?? akce.zacatek)}</strong>
              </div>
              <div className="detail-pole">
                <span>Kapacita akce</span>
                <strong>{akce.kapacita} míst</strong>
              </div>
              <div className="detail-pole">
                <span>Rezervace</span>
                <strong>{akce.rezervace_platnost_minuty} minut</strong>
              </div>
              <div className="detail-pole">
                <span>Objednávky</span>
                <strong>{String((vykonnost?.objednavky_celkem as number) ?? objednavky.length)}</strong>
              </div>
              <div className="detail-pole">
                <span>Prodané vstupenky</span>
                <strong>{String((vykonnost?.prodane_vstupenky as number) ?? 0)}</strong>
              </div>
              <div className="detail-pole">
                <span>Obsazenost</span>
                <strong>{String((vykonnost?.obsazenost_procent as number) ?? 0)} %</strong>
              </div>
              <div className="detail-pole">
                <span>Návštěvnost</span>
                <strong>{String((vykonnost?.navstevnost_procent as number) ?? 0)} %</strong>
              </div>
            </div>

            <div className="form-grid compact">
              <label className="pole">
                <span className="pole-label">Kapacita akce</span>
                <input
                  min="0"
                  type="number"
                  value={editor.kapacita}
                  onChange={(event) =>
                    nastavEditor((predchozi) => ({ ...predchozi, kapacita: event.target.value }))
                  }
                />
              </label>
              <label className="pole">
                <span className="pole-label">Platnost rezervace (minuty)</span>
                <input
                  min="1"
                  type="number"
                  value={editor.rezervace_platnost_minuty}
                  onChange={(event) =>
                    nastavEditor((predchozi) => ({
                      ...predchozi,
                      rezervace_platnost_minuty: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </div>
        </article>

        <article className="sprava-panel">
          <div className="sprava-panel-header">
            <div>
              <h3>Kategorie vstupenek</h3>
              <p>{aktivniKategorie.length} aktivních kategorií pro tuto akci.</p>
            </div>
          </div>
          <div className="sprava-panel-body stack-karty">
            {kategorie.map((kategorieVstupenky) => (
              <div key={kategorieVstupenky.id} className="souhrn-objednavky-radek">
                <div>
                  <strong>{kategorieVstupenky.nazev}</strong>
                  <div className="micro">
                    {kategorieVstupenky.popis || "Bez popisu"}
                  </div>
                  <div className="micro">
                    Zóny:{" "}
                    {(kategorieVstupenky.povolene_zony ?? []).length
                      ? (kategorieVstupenky.povolene_zony ?? []).join(", ")
                      : "všechny"}
                  </div>
                </div>
                <div>
                  <strong>{formatujCastku(kategorieVstupenky.cena, kategorieVstupenky.mena)}</strong>
                  <div className="micro">Kapacita {kategorieVstupenky.kapacita}</div>
                </div>
                <div className="pole">
                  <span className="pole-label">Povolené zóny</span>
                  <input
                    value={zonyKategorii[kategorieVstupenky.id] ?? ""}
                    onChange={(event) =>
                      nastavZonyKategorii((aktualni) => ({
                        ...aktualni,
                        [kategorieVstupenky.id]: event.target.value,
                      }))
                    }
                    placeholder="např. parket, balkon"
                  />
                </div>
                <div className="actions-end">
                  <button
                    className="button ghost"
                    type="button"
                    onClick={() => void ulozZonyKategorie(kategorieVstupenky.id)}
                  >
                    Uložit zóny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {akce.schema_sezeni ? (
        <section className="detail-spravy-grid detail-akce-sekce detail-spravy-grid-schema">
          <article className="sprava-panel" id="schema-akce">
            <div className="sprava-panel-header">
              <div>
                <h3>Plánek sálu a stavy míst</h3>
                <p>Jedna mapa pro prodej, objednávky, vstupenky i odbavení.</p>
              </div>
            </div>
            <div className="sprava-panel-body stack">
              <div className="builder-pomucky">
                <span className="badge">
                  {akce.ma_vlastni_schema_sezeni ? "Vlastní schéma akce" : "Schéma z místa konání"}
                </span>
                <span className="badge">Zóny: {(akce.dostupne_zony ?? []).length}</span>
              </div>
              <div className="legenda-salu">
                <div className="legenda-polozka">
                  <span className="legenda-bod zona-parket" />
                  <span>Parket</span>
                </div>
                <div className="legenda-polozka">
                  <span className="legenda-bod zona-prizemi" />
                  <span>Přízemí</span>
                </div>
                <div className="legenda-polozka">
                  <span className="legenda-bod zona-balkon" />
                  <span>Balkón</span>
                </div>
                <div className="legenda-polozka">
                  <span className="legenda-bod zona-balkon_bok" />
                  <span>Balkón bok</span>
                </div>
                <div className="legenda-polozka">
                  <span className="legenda-bod stav-blokovano" />
                  <span>Blokováno</span>
                </div>
                <div className="legenda-polozka">
                  <span className="legenda-bod stav-rezervace" />
                  <span>V rezervaci</span>
                </div>
                <div className="legenda-polozka">
                  <span className="legenda-bod stav-platne" />
                  <span>Prodáno</span>
                </div>
                <div className="legenda-polozka">
                  <span className="legenda-bod stav-odbavene" />
                  <span>Odbaveno</span>
                </div>
              </div>
              <div className="plan-salu-pracovni">
                <PlanSalu
                  schema={akce.schema_sezeni}
                  stavyMist={akce.stavy_mist}
                  rezim="sprava"
                  vybranaMista={vybraneMisto ? [vybraneMisto] : []}
                  priPrepnutiMista={(kod) =>
                    nastavVybraneMisto((aktualni) => (aktualni === kod ? "" : kod))
                  }
                />
              </div>
            </div>
          </article>

          <article className="sprava-panel detail-akce-bohate-info">
            <div className="sprava-panel-header">
              <div>
                <h3>Obsazenost a odbavení</h3>
                <p>Výběr místa a zásah přímo z mapy.</p>
              </div>
            </div>
            <div className="sprava-panel-body stack">
              <div className="maly-prehled">
                <div className="metrika">
                  <div className="popisek">Volná místa</div>
                  <div className="hodnota">{souhrnMist.volne}</div>
                </div>
                <div className="metrika">
                  <div className="popisek">V rezervaci</div>
                  <div className="hodnota">{souhrnMist.rezervace}</div>
                </div>
                <div className="metrika">
                  <div className="popisek">Prodáno</div>
                  <div className="hodnota">{souhrnMist.platne}</div>
                </div>
              </div>
              <div className="maly-prehled">
                <div className="metrika">
                  <div className="popisek">Odbaveno</div>
                  <div className="hodnota">{souhrnMist.odbavene}</div>
                </div>
                <div className="metrika">
                  <div className="popisek">Aktivní místa</div>
                  <div className="hodnota">{aktivniMista.length}</div>
                </div>
                <div className="metrika">
                  <div className="popisek">Schéma</div>
                  <div className="hodnota">{akce.schema_sezeni.nazev}</div>
                </div>
              </div>
              <div className="form-grid compact">
                <label className="pole">
                  <span className="pole-label">Filtr stavu</span>
                  <select
                    value={filtrStavuMista}
                    onChange={(event) => nastavFiltrStavuMista(event.target.value)}
                  >
                    <option value="vse">Všechny stavy</option>
                    <option value="volne">Volné</option>
                    <option value="blokovano">Blokováno</option>
                    <option value="rezervace">Rezervace</option>
                    <option value="platne">Prodáno</option>
                    <option value="odbavene">Odbaveno</option>
                  </select>
                </label>
                <label className="pole">
                  <span className="pole-label">Filtr zóny</span>
                  <select
                    value={filtrZonyMista}
                    onChange={(event) => nastavFiltrZonyMista(event.target.value)}
                  >
                    <option value="vse">Všechny zóny</option>
                    {(akce.dostupne_zony ?? []).map((zona) => (
                      <option key={zona} value={zona}>
                        {zona}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="stack-karty">
                {souhrnZon.map(([zona, souhrn]) => (
                  <div key={zona} className="souhrn-objednavky-radek">
                    <div>
                      <strong>{zona}</strong>
                      <div className="micro">Celkem {souhrn.celkem} míst</div>
                    </div>
                    <div className="micro">Prodáno {souhrn.prodano}</div>
                    <div className="micro">Rezervace {souhrn.rezervace}</div>
                    <div className="micro">Odbaveno {souhrn.odbaveno}</div>
                    <div className="micro">Blokace {souhrn.blokovano}</div>
                  </div>
                ))}
              </div>
              {detailVybranehoMista ? (
                <div className="detail-mista-karta">
                  <div>
                    <strong>{detailVybranehoMista.popis}</strong>
                    <div className="micro">
                      Stav: {formatujStavMista(detailVybranehoMista.stav)}
                      {detailVybranehoMista.kategorie_vstupenky_nazev
                        ? ` · ${detailVybranehoMista.kategorie_vstupenky_nazev}`
                        : ""}
                    </div>
                    <div className="micro">
                      {detailVybranehoMista.objednavka_verejne_id
                        ? `Objednávka ${detailVybranehoMista.objednavka_verejne_id}`
                        : "Místo je zatím volné."}
                    </div>
                    {detailVybranehoMista.duvod_blokace ? (
                      <div className="micro">Důvod blokace: {detailVybranehoMista.duvod_blokace}</div>
                    ) : null}
                  </div>
                  <div className="actions-end">
                    {detailVybranehoMista.objednavka_verejne_id ? (
                      <a
                        className="button ghost"
                        href={`/sprava/objednavky/${detailVybranehoMista.objednavka_verejne_id}`}
                      >
                        Detail objednávky
                      </a>
                    ) : null}
                    {detailVybranehoMista.stav === "platne" && detailVybranehoMista.vstupenka_kod ? (
                      <button
                        className="button primary"
                        type="button"
                        onClick={async () => {
                          try {
                            await provedOdbaveni(
                              detailVybranehoMista.vstupenka_kod ?? "",
                              "mapa-akce",
                              tokenSpravy,
                            );
                            nastavZpravu("Vybrané místo bylo úspěšně odbaveno.");
                            await nactiDetail(tokenSpravy);
                          } catch (error) {
                            nastavChybu(
                              error instanceof Error
                                ? error.message
                                : "Odbavení místa se nepodařilo.",
                            );
                          }
                        }}
                      >
                        Odbavit místo
                      </button>
                    ) : null}
                    {detailVybranehoMista.stav === "volne" ? (
                      <div className="stack-mini">
                        <input
                          value={duvodBlokace}
                          onChange={(event) => nastavDuvodBlokace(event.target.value)}
                          placeholder="Důvod blokace"
                        />
                        <button
                          className="button ghost"
                          type="button"
                          onClick={async () => {
                            try {
                              const detail = await blokovatMistoAkce(
                                akce.slug,
                                detailVybranehoMista.kod,
                                duvodBlokace,
                                tokenSpravy,
                              );
                              nastavAkci(detail);
                              nastavZpravu("Místo bylo ručně zablokováno.");
                              await nactiDetail(tokenSpravy);
                            } catch (error) {
                              nastavChybu(
                                error instanceof Error
                                  ? error.message
                                  : "Blokaci se nepodařilo uložit.",
                              );
                            }
                          }}
                        >
                          Blokovat místo
                        </button>
                      </div>
                    ) : null}
                    {detailVybranehoMista.stav === "blokovano" ? (
                      <button
                        className="button ghost"
                        type="button"
                        onClick={async () => {
                          try {
                            const detail = await odblokovatMistoAkce(
                              akce.slug,
                              detailVybranehoMista.kod,
                              tokenSpravy,
                            );
                            nastavAkci(detail);
                            nastavZpravu("Místo bylo odblokováno.");
                            await nactiDetail(tokenSpravy);
                          } catch (error) {
                            nastavChybu(
                              error instanceof Error
                                ? error.message
                                : "Odblokování se nepodařilo.",
                            );
                          }
                        }}
                      >
                        Odblokovat místo
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="tlumeny">
                  Klikni v mapě na konkrétní sedadlo a uvidíš jeho stav i navázané akce.
                </div>
              )}
              <div className="stack-karty">
                {filtrovanaMista.length > 0 ? (
                  filtrovanaMista.slice(0, 36).map((misto) => (
                    <div key={misto.kod} className="souhrn-objednavky-radek">
                      <div>
                        <strong>{misto.popis}</strong>
                        <div className="micro">
                          {misto.kategorie_vstupenky_nazev || "Bez kategorie"} ·{" "}
                          {misto.objednavka_verejne_id || "Bez objednávky"}
                        </div>
                      </div>
                      <span className="badge">{formatujStavMista(misto.stav)}</span>
                    </div>
                  ))
                ) : (
                  <div className="tlumeny">Zatím nejsou aktivní žádné rezervace ani prodaná místa.</div>
                )}
              </div>
            </div>
          </article>
        </section>
      ) : null}

      <section className="sprava-panel detail-akce-sekce" id="objednavky-akce">
        <div className="sprava-panel-header">
          <div>
            <h3>Poslední objednávky pro tuto akci</h3>
            <p>Rychlý vstup z akce do konkrétního zákaznického případu.</p>
          </div>
        </div>
        <div className="sprava-panel-body">
          <div className="tabulka tabulka-siroka">
            <div className="tabulka-radek-hlavni tabulka-radek-objednavky">
              <span>Objednávka</span>
              <span>Zákazník</span>
              <span>Stav</span>
              <span>Vstupenky</span>
              <span>Částka</span>
            </div>
            {objednavky.map((objednavka) => (
              <div key={objednavka.id} className="tabulka-radek-data tabulka-radek-objednavky">
                <div>
                  <strong>{objednavka.verejne_id}</strong>
                  <div className="micro">{formatujDatum(objednavka.vytvoreno)}</div>
                  <div className="micro">
                    <a href={`/sprava/objednavky/${objednavka.verejne_id}`}>Detail objednávky</a>
                  </div>
                </div>
                <div>
                  <div>{objednavka.jmeno_zakaznika || "Bez jména"}</div>
                  <div className="micro">{objednavka.email_zakaznika}</div>
                </div>
                <div>{formatujStavObjednavky(objednavka.stav)}</div>
                <div className="stack-mini">
                  {objednavka.vstupenky.map((vstupenka) => (
                    <div key={vstupenka.id} className="micro">
                      {vstupenka.kategorie_vstupenky_nazev} ·{" "}
                      {formatujStavVstupenky(vstupenka.stav)}
                    </div>
                  ))}
                </div>
                <div>{formatujCastku(objednavka.celkem, objednavka.mena)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
