"use client";

import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";

import type {
  Akce,
  ClenstviOrganizace,
  KategorieVstupenky,
  MistoKonani,
  Objednavka,
  Organizace,
  PlatbaSpravy,
} from "@/lib/api";
import {
  dorucVstupenkyObjednavky,
  potvrditHotovostObjednavky,
  stornovatObjednavku,
  vratitObjednavku,
  vytvorAkciSprava,
  vytvorClenstviSprava,
  vytvorKategoriiVstupenkySprava,
  vytvorMistoKonaniSprava,
  vytvorPokladniProdej,
  vytvorOrganizaciSprava,
  upravClenstviSprava,
} from "@/lib/api";
import {
  formatujCastku,
  formatujDatum,
  formatujRoliOrganizace,
  formatujStavAkce,
  formatujStavObjednavky,
  formatujStavPlatby,
  formatujTypOrganizace,
  formatujPoskytovatelePlatby,
  formatujStavVstupenky,
} from "@/lib/formatovani";

type Vlastnosti = {
  organizace: Organizace[];
  clenstvi: ClenstviOrganizace[];
  mistaKonani: MistoKonani[];
  akce: Akce[];
  kategorieVstupenek: KategorieVstupenky[];
  objednavky: Objednavka[];
  platby: PlatbaSpravy[];
  opravneni: {
    sprava: boolean;
    sprava_obsahu: boolean;
    finance: boolean;
    odbaveni: boolean;
    prehled: boolean;
  };
  tokenSpravy: string;
  priObnoveni: () => Promise<void>;
};

function vytvorSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function SekcePanelu({
  id,
  nadpis,
  popis,
  akce,
  children,
}: {
  id?: string;
  nadpis: string;
  popis: string;
  akce?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="sprava-panel" id={id}>
      <div className="sprava-panel-header">
        <div>
          <h3>{nadpis}</h3>
          <p className="tlumeny">{popis}</p>
        </div>
        {akce}
      </div>
      <div className="sprava-panel-body">{children}</div>
    </section>
  );
}

function BlokSpravy({
  id,
  stitek,
  nadpis,
  popis,
  children,
}: {
  id: string;
  stitek: string;
  nadpis: string;
  popis: string;
  children: React.ReactNode;
}) {
  return (
    <section className="blok-spravy" id={id}>
      <div className="blok-spravy-header">
        <div className="blok-spravy-stit">{stitek}</div>
        <div>
          <h2>{nadpis}</h2>
          <p className="tlumeny">{popis}</p>
        </div>
      </div>
      <div className="blok-spravy-obsah">{children}</div>
    </section>
  );
}

export function SpravaKlient({
  organizace,
  clenstvi,
  mistaKonani,
  akce,
  kategorieVstupenek,
  objednavky,
  platby,
  opravneni,
  tokenSpravy,
  priObnoveni,
}: Vlastnosti) {
  const [beziPrechod, spustPrechod] = useTransition();
  const [chyba, nastavChybu] = useState("");
  const [zprava, nastavZpravu] = useState("");

  const vychoziOrganizaceId = organizace[0]?.id ?? 0;
  const vychoziAkceId = akce[0]?.id ?? 0;
  const mistaVychoziOrganizace = useMemo(
    () => mistaKonani.filter((misto) => misto.organizace === vychoziOrganizaceId),
    [mistaKonani, vychoziOrganizaceId],
  );

  const [formularOrganizace, nastavFormularOrganizace] = useState({
    nazev: "",
    slug: "",
    typ_organizace: "obec",
    kontaktni_email: "",
    kontaktni_telefon: "",
    hlavni_barva: "#73E0BA",
    fakturacni_nazev: "",
    ico: "",
    dic: "",
    fakturacni_ulice: "",
    fakturacni_mesto: "",
    fakturacni_psc: "",
    cislo_uctu: "",
    kod_banky: "",
    iban: "",
    swift: "",
    smtp_aktivni: false,
    smtp_host: "",
    smtp_port: 587,
    smtp_uzivatel: "",
    smtp_heslo: "",
    smtp_use_tls: true,
    smtp_use_ssl: false,
    smtp_od_email: "",
    smtp_od_jmeno: "",
    smtp_timeout: 20,
  });

  const [formularMista, nastavFormularMista] = useState({
    organizace: vychoziOrganizaceId ? String(vychoziOrganizaceId) : "",
    nazev: "",
    adresa: "",
    mesto: "",
    kapacita: "0",
  });

  const [formularAkce, nastavFormularAkce] = useState({
    organizace: vychoziOrganizaceId ? String(vychoziOrganizaceId) : "",
    nazev: "",
    slug: "",
    popis: "",
    misto_konani: mistaVychoziOrganizace[0] ? String(mistaVychoziOrganizace[0].id) : "",
    zacatek: "",
    konec: "",
    stav: "navrh",
    kapacita: "0",
    rezervace_platnost_minuty: "15",
    je_doporucena: false,
  });

  const [formularKategorie, nastavFormularKategorie] = useState({
    organizace: vychoziOrganizaceId ? String(vychoziOrganizaceId) : "",
    akce: vychoziAkceId ? String(vychoziAkceId) : "",
    nazev: "",
    popis: "",
    cena: "0",
    mena: "CZK",
    kapacita: "0",
    prodej_od: "",
    prodej_do: "",
    je_aktivni: true,
  });

  const [formularClenstvi, nastavFormularClenstvi] = useState({
    organizace: vychoziOrganizaceId ? String(vychoziOrganizaceId) : "",
    nove_uzivatelske_jmeno: "",
    nove_uzivatelske_email: "",
    nove_heslo: "",
    role: "pokladna",
  });
  const [filtrObjednavek, nastavFiltrObjednavek] = useState({
    hledani: "",
    stav: "vse",
  });
  const [formularPokladny, nastavFormularPokladny] = useState({
    email_zakaznika: "",
    jmeno_zakaznika: "",
    telefon_zakaznika: "",
    kategorie_vstupenky: kategorieVstupenek[0] ? String(kategorieVstupenek[0].id) : "",
    pocet: "1",
    odeslat_na_email: false,
  });

  const mistaProAkci = useMemo(
    () => mistaKonani.filter((misto) => misto.organizace === Number(formularAkce.organizace || 0)),
    [mistaKonani, formularAkce.organizace],
  );

  const akceProKategorii = useMemo(
    () => akce.filter((polozka) => polozka.organizace === Number(formularKategorie.organizace || 0)),
    [akce, formularKategorie.organizace],
  );

  const filtrovaneObjednavky = useMemo(() => {
    const hledani = filtrObjednavek.hledani.trim().toLowerCase();
    return objednavky.filter((objednavka) => {
      const sediStav =
        filtrObjednavek.stav === "vse" ? true : objednavka.stav === filtrObjednavek.stav;
      const sediHledani = !hledani
        ? true
        : [
            objednavka.verejne_id,
            objednavka.email_zakaznika,
            objednavka.jmeno_zakaznika,
            objednavka.telefon_zakaznika,
            ...objednavka.vstupenky.map((vstupenka) => vstupenka.kod),
          ]
            .join(" ")
            .toLowerCase()
            .includes(hledani);
      return sediStav && sediHledani;
    });
  }, [filtrObjednavek, objednavky]);

  function obnovZpravy() {
    nastavChybu("");
    nastavZpravu("");
  }

  async function dokoncit(text: string) {
    nastavZpravu(text);
    await priObnoveni();
  }

  async function odesliOrganizaci(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    obnovZpravy();

    spustPrechod(async () => {
      try {
        await vytvorOrganizaciSprava({
          ...formularOrganizace,
          slug: formularOrganizace.slug || vytvorSlug(formularOrganizace.nazev),
          je_aktivni: true,
        }, tokenSpravy);
        nastavFormularOrganizace({
          nazev: "",
          slug: "",
          typ_organizace: "obec",
          kontaktni_email: "",
          kontaktni_telefon: "",
          hlavni_barva: "#73E0BA",
          fakturacni_nazev: "",
          ico: "",
          dic: "",
          fakturacni_ulice: "",
          fakturacni_mesto: "",
          fakturacni_psc: "",
          cislo_uctu: "",
          kod_banky: "",
          iban: "",
          swift: "",
          smtp_aktivni: false,
          smtp_host: "",
          smtp_port: 587,
          smtp_uzivatel: "",
          smtp_heslo: "",
          smtp_use_tls: true,
          smtp_use_ssl: false,
          smtp_od_email: "",
          smtp_od_jmeno: "",
          smtp_timeout: 20,
        });
        await dokoncit("Organizace byla vytvořena.");
      } catch (error) {
        nastavChybu(error instanceof Error ? error.message : "Organizaci se nepodařilo vytvořit.");
      }
    });
  }

  async function odesliMisto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    obnovZpravy();

    spustPrechod(async () => {
      try {
        await vytvorMistoKonaniSprava({
          organizace: Number(formularMista.organizace),
          nazev: formularMista.nazev,
          adresa: formularMista.adresa,
          mesto: formularMista.mesto,
          kapacita: Number(formularMista.kapacita),
        }, tokenSpravy);
        nastavFormularMista((predchozi) => ({
          ...predchozi,
          nazev: "",
          adresa: "",
          mesto: "",
          kapacita: "0",
        }));
        await dokoncit("Místo konání bylo vytvořeno.");
      } catch (error) {
        nastavChybu(error instanceof Error ? error.message : "Místo konání se nepodařilo vytvořit.");
      }
    });
  }

  async function odesliAkci(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    obnovZpravy();

    spustPrechod(async () => {
      try {
        await vytvorAkciSprava({
          organizace: Number(formularAkce.organizace),
          nazev: formularAkce.nazev,
          slug: formularAkce.slug || vytvorSlug(formularAkce.nazev),
          perex: "",
          popis: formularAkce.popis,
          hlavni_fotka_url: "",
          video_url: "",
          misto_konani: Number(formularAkce.misto_konani),
          zacatek: new Date(formularAkce.zacatek).toISOString(),
          konec: formularAkce.konec ? new Date(formularAkce.konec).toISOString() : null,
          stav: formularAkce.stav,
          kapacita: Number(formularAkce.kapacita),
          rezervace_platnost_minuty: Number(formularAkce.rezervace_platnost_minuty),
          je_doporucena: formularAkce.je_doporucena,
        }, tokenSpravy);
        nastavFormularAkce((predchozi) => ({
          ...predchozi,
          nazev: "",
          slug: "",
          popis: "",
          zacatek: "",
          konec: "",
          kapacita: "0",
          rezervace_platnost_minuty: "15",
          je_doporucena: false,
        }));
        await dokoncit("Akce byla vytvořena.");
      } catch (error) {
        nastavChybu(error instanceof Error ? error.message : "Akci se nepodařilo vytvořit.");
      }
    });
  }

  async function odesliKategorii(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    obnovZpravy();

    spustPrechod(async () => {
      try {
        await vytvorKategoriiVstupenkySprava({
          organizace: Number(formularKategorie.organizace),
          akce: Number(formularKategorie.akce),
          nazev: formularKategorie.nazev,
          popis: formularKategorie.popis,
          cena: formularKategorie.cena,
          mena: formularKategorie.mena,
          kapacita: Number(formularKategorie.kapacita),
          prodej_od: formularKategorie.prodej_od
            ? new Date(formularKategorie.prodej_od).toISOString()
            : null,
          prodej_do: formularKategorie.prodej_do
            ? new Date(formularKategorie.prodej_do).toISOString()
            : null,
          je_aktivni: formularKategorie.je_aktivni,
        }, tokenSpravy);
        nastavFormularKategorie((predchozi) => ({
          ...predchozi,
          nazev: "",
          popis: "",
          cena: "0",
          kapacita: "0",
          prodej_od: "",
          prodej_do: "",
          je_aktivni: true,
        }));
        await dokoncit("Kategorie vstupenky byla vytvořena.");
      } catch (error) {
        nastavChybu(
          error instanceof Error
            ? error.message
            : "Kategorii vstupenky se nepodařilo vytvořit.",
        );
      }
    });
  }

  async function odesliClenstvi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    obnovZpravy();

    spustPrechod(async () => {
      try {
        await vytvorClenstviSprava(
          {
            organizace: Number(formularClenstvi.organizace),
            role: formularClenstvi.role,
            je_aktivni: true,
            nove_uzivatelske_jmeno: formularClenstvi.nove_uzivatelske_jmeno,
            nove_uzivatelske_email: formularClenstvi.nove_uzivatelske_email,
            nove_heslo: formularClenstvi.nove_heslo,
          },
          tokenSpravy,
        );
        nastavFormularClenstvi((predchozi) => ({
          ...predchozi,
          nove_uzivatelske_jmeno: "",
          nove_uzivatelske_email: "",
          nove_heslo: "",
          role: "pokladna",
        }));
        await dokoncit("Člen týmu byl přidán.");
      } catch (error) {
        nastavChybu(error instanceof Error ? error.message : "Členství se nepodařilo vytvořit.");
      }
    });
  }

  async function prepniAktivituClenstvi(polozka: ClenstviOrganizace) {
    obnovZpravy();
    spustPrechod(async () => {
      try {
        await upravClenstviSprava(
          polozka.id,
          { je_aktivni: !polozka.je_aktivni },
          tokenSpravy,
        );
        await dokoncit(
          !polozka.je_aktivni ? "Přístup byl znovu aktivován." : "Přístup byl vypnut.",
        );
      } catch (error) {
        nastavChybu(error instanceof Error ? error.message : "Nepodařilo se upravit členství.");
      }
    });
  }

  async function potvrditHotovost(verejneId: string, odeslatNaEmail = false) {
    obnovZpravy();
    spustPrechod(async () => {
      try {
        await potvrditHotovostObjednavky(verejneId, tokenSpravy, odeslatNaEmail);
        await dokoncit(
          odeslatNaEmail
            ? "Objednávka byla potvrzena a vstupenky odeslány e-mailem."
            : "Objednávka byla potvrzena jako uhrazená hotově.",
        );
      } catch (error) {
        nastavChybu(error instanceof Error ? error.message : "Potvrzení hotovosti se nepodařilo.");
      }
    });
  }

  async function dorucitObjednavku(verejneId: string) {
    obnovZpravy();
    spustPrechod(async () => {
      try {
        await dorucVstupenkyObjednavky(verejneId, tokenSpravy);
        await dokoncit("Vstupenky byly odeslány zákazníkovi.");
      } catch (error) {
        nastavChybu(error instanceof Error ? error.message : "Doručení vstupenek se nepodařilo.");
      }
    });
  }

  async function stornovat(verejneId: string) {
    obnovZpravy();
    spustPrechod(async () => {
      try {
        await stornovatObjednavku(verejneId, tokenSpravy);
        await dokoncit("Objednávka byla stornována.");
      } catch (error) {
        nastavChybu(error instanceof Error ? error.message : "Storno objednávky se nepodařilo.");
      }
    });
  }

  async function vratit(verejneId: string) {
    obnovZpravy();
    spustPrechod(async () => {
      try {
        await vratitObjednavku(verejneId, tokenSpravy);
        await dokoncit("Objednávka byla označena jako vrácená.");
      } catch (error) {
        nastavChybu(error instanceof Error ? error.message : "Vrácení objednávky se nepodařilo.");
      }
    });
  }

  async function odesliPokladniProdej(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    obnovZpravy();

    spustPrechod(async () => {
      try {
        await vytvorPokladniProdej(
          {
            email_zakaznika: formularPokladny.email_zakaznika,
            jmeno_zakaznika: formularPokladny.jmeno_zakaznika,
            telefon_zakaznika: formularPokladny.telefon_zakaznika,
            odeslat_na_email: formularPokladny.odeslat_na_email,
            polozky: [
              {
                kategorie_vstupenky: Number(formularPokladny.kategorie_vstupenky),
                pocet: Number(formularPokladny.pocet),
              },
            ],
          },
          tokenSpravy,
        );
        nastavFormularPokladny((predchozi) => ({
          ...predchozi,
          email_zakaznika: "",
          jmeno_zakaznika: "",
          telefon_zakaznika: "",
          pocet: "1",
          odeslat_na_email: false,
        }));
        await dokoncit("Pokladní prodej byl uložen a označen jako uhrazený hotově.");
      } catch (error) {
        nastavChybu(error instanceof Error ? error.message : "Pokladní prodej se nepodařilo uložit.");
      }
    });
  }

  return (
    <div className="stack">
      {(zprava || chyba) && (
        <div className={chyba ? "hlaseni chyba" : "hlaseni uspech"}>{chyba || zprava}</div>
      )}

      {opravneni.finance ? (
      <BlokSpravy
        id="prodej-a-finance"
        stitek="Prodej a finance"
        nadpis="Objednávky, pokladna a platební tok"
        popis="Každodenní provoz objednávek, opětovné doručení, pokladní prodej na místě a kontrola plateb v jednom bloku."
      >
      {opravneni.finance ? (
      <SekcePanelu
        id="objednavky"
        nadpis="Objednávky"
        popis="Filtrování, obsluha plateb, opakované doručení a rychlé provozní zásahy."
      >
        <div className="form-grid compact">
          <label className="pole">
            <span className="pole-label">Hledání</span>
            <input
              placeholder="ID, e-mail, jméno, telefon, kód vstupenky"
              value={filtrObjednavek.hledani}
              onChange={(event) =>
                nastavFiltrObjednavek((predchozi) => ({ ...predchozi, hledani: event.target.value }))
              }
            />
          </label>
          <label className="pole">
            <span className="pole-label">Stav objednávky</span>
            <select
              value={filtrObjednavek.stav}
              onChange={(event) =>
                nastavFiltrObjednavek((predchozi) => ({ ...predchozi, stav: event.target.value }))
              }
            >
              <option value="vse">Všechny</option>
              <option value="ceka_na_platbu">Čeká na platbu</option>
              <option value="zaplaceno">Zaplaceno</option>
              <option value="zruseno">Zrušeno</option>
              <option value="vraceno">Vráceno</option>
            </select>
          </label>
        </div>
        <div className="tabulka tabulka-siroka">
          <div className="tabulka-radek-hlavni tabulka-radek-objednavky">
            <span>Objednávka</span>
            <span>Zákazník</span>
            <span>Stav</span>
            <span>Částka</span>
            <span>Vstupenky a doručení</span>
          </div>
          {filtrovaneObjednavky.map((objednavka) => (
            <div key={objednavka.id} className="tabulka-radek-data tabulka-radek-objednavky">
              <div>
                <strong>{objednavka.verejne_id}</strong>
                <div className="micro">{formatujDatum(objednavka.vytvoreno)}</div>
                <div className="micro">
                  <a href={`/sprava/objednavky/${objednavka.verejne_id}`}>
                    Otevřít detail správy
                  </a>
                </div>
              </div>
              <div>
                <div>{objednavka.jmeno_zakaznika || "Bez jména"}</div>
                <div className="micro">{objednavka.email_zakaznika}</div>
                {objednavka.telefon_zakaznika ? (
                  <div className="micro">{objednavka.telefon_zakaznika}</div>
                ) : null}
              </div>
              <div>
                <strong>{formatujStavObjednavky(objednavka.stav)}</strong>
                <div className="micro">
                  {objednavka.rezervace_do ? `Rezervace do ${formatujDatum(objednavka.rezervace_do)}` : "Bez rezervace"}
                </div>
                <div className="stack-mini">
                  {objednavka.stav === "ceka_na_platbu" ? (
                    <button className="button ghost" disabled={beziPrechod} onClick={() => potvrditHotovost(objednavka.verejne_id)} type="button">
                      Potvrdit hotovost
                    </button>
                  ) : null}
                  {objednavka.stav === "ceka_na_platbu" || objednavka.stav === "zaplaceno" ? (
                    <button className="button ghost" disabled={beziPrechod} onClick={() => stornovat(objednavka.verejne_id)} type="button">
                      Storno
                    </button>
                  ) : null}
                  {objednavka.stav === "zaplaceno" ? (
                    <button className="button ghost" disabled={beziPrechod} onClick={() => vratit(objednavka.verejne_id)} type="button">
                      Vrátit
                    </button>
                  ) : null}
                </div>
              </div>
              <div>{formatujCastku(objednavka.celkem, objednavka.mena)}</div>
              <div className="stack-mini">
                {objednavka.vstupenky.length ? (
                  objednavka.vstupenky.map((vstupenka) => (
                    <div key={vstupenka.id} className="micro">
                      {vstupenka.kategorie_vstupenky_nazev} · {formatujStavVstupenky(vstupenka.stav)} ·{" "}
                      <a href={`/api_proxy/vstupenky/${vstupenka.kod}/pdf/`} target="_blank">
                        PDF
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="micro">Bez vytvořených vstupenek</div>
                )}
                <div className="micro">
                  {(objednavka.emailove_zasilky?.length ?? 0) > 0
                    ? `Poslední e-mail: ${formatujDatum(objednavka.emailove_zasilky?.[0].odeslano_v ?? objednavka.emailove_zasilky?.[0].vytvoreno)}`
                    : "Zatím bez e-mailového doručení"}
                </div>
                {objednavka.stav === "zaplaceno" ? (
                  <button className="button ghost" disabled={beziPrechod} onClick={() => dorucitObjednavku(objednavka.verejne_id)} type="button">
                    Odeslat znovu
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </SekcePanelu>
      ) : null}

      {opravneni.finance ? (
      <SekcePanelu
        id="pokladna"
        nadpis="Pokladní prodej"
        popis="Rychlý prodej na místě s okamžitým potvrzením hotovosti a volitelným odesláním e-mailem."
      >
        <form className="form-grid" onSubmit={odesliPokladniProdej}>
          <label className="pole">
            <span className="pole-label">Kategorie vstupenky</span>
            <select
              value={formularPokladny.kategorie_vstupenky}
              onChange={(event) =>
                nastavFormularPokladny((predchozi) => ({ ...predchozi, kategorie_vstupenky: event.target.value }))
              }
              required
            >
              {kategorieVstupenek.filter((polozka) => polozka.je_aktivni).map((kategorie) => (
                <option key={kategorie.id} value={kategorie.id}>
                  {kategorie.akce_nazev} · {kategorie.nazev} · {formatujCastku(kategorie.cena, kategorie.mena)}
                </option>
              ))}
            </select>
          </label>
          <label className="pole">
            <span className="pole-label">Počet</span>
            <input
              min="1"
              type="number"
              value={formularPokladny.pocet}
              onChange={(event) =>
                nastavFormularPokladny((predchozi) => ({ ...predchozi, pocet: event.target.value }))
              }
              required
            />
          </label>
          <label className="pole">
            <span className="pole-label">E-mail zákazníka</span>
            <input
              type="email"
              value={formularPokladny.email_zakaznika}
              onChange={(event) =>
                nastavFormularPokladny((predchozi) => ({ ...predchozi, email_zakaznika: event.target.value }))
              }
              required={formularPokladny.odeslat_na_email}
            />
          </label>
          <label className="pole">
            <span className="pole-label">Jméno zákazníka</span>
            <input
              value={formularPokladny.jmeno_zakaznika}
              onChange={(event) =>
                nastavFormularPokladny((predchozi) => ({ ...predchozi, jmeno_zakaznika: event.target.value }))
              }
            />
          </label>
          <label className="pole pole-cela">
            <span className="pole-label">Telefon</span>
            <input
              value={formularPokladny.telefon_zakaznika}
              onChange={(event) =>
                nastavFormularPokladny((predchozi) => ({ ...predchozi, telefon_zakaznika: event.target.value }))
              }
            />
          </label>
          <label className="pole-checkbox pole-cela">
            <input
              checked={formularPokladny.odeslat_na_email}
              type="checkbox"
              onChange={(event) =>
                nastavFormularPokladny((predchozi) => ({ ...predchozi, odeslat_na_email: event.target.checked }))
              }
            />
            <span>Po potvrzení hotovosti rovnou odeslat vstupenky na e-mail</span>
          </label>
          <div className="actions-end pole-cela">
            <button className="button primary" disabled={beziPrechod} type="submit">
              {beziPrechod ? "Ukládám..." : "Vytvořit pokladní prodej"}
            </button>
          </div>
        </form>
      </SekcePanelu>
      ) : null}

      {opravneni.finance ? (
      <SekcePanelu
        id="platby"
        nadpis="Platby"
        popis="Platební toky a jejich aktuální stav nad objednávkami."
      >
        <div className="tabulka tabulka-siroka">
          <div className="tabulka-radek-hlavni tabulka-radek-platby">
            <span>Platba</span>
            <span>Poskytovatel</span>
            <span>Stav</span>
            <span>Částka</span>
            <span>Čas</span>
          </div>
          {platby.map((platba) => (
            <div key={platba.id} className="tabulka-radek-data tabulka-radek-platby">
              <div>
                <strong>{platba.objednavka_verejne_id || `Objednavka #${platba.objednavka}`}</strong>
                <div className="micro">{platba.reference_poskytovatele || "Bez reference"}</div>
              </div>
              <div>{formatujPoskytovatelePlatby(platba.poskytovatel)}</div>
              <div>{formatujStavPlatby(platba.stav)}</div>
              <div>{formatujCastku(platba.castka, platba.mena)}</div>
              <div className="micro">{formatujDatum(platba.vytvoreno)}</div>
            </div>
          ))}
        </div>
      </SekcePanelu>
      ) : null}
      </BlokSpravy>
      ) : null}

      {opravneni.sprava_obsahu ? (
      <BlokSpravy
        id="provoz-a-tym"
        stitek="Provoz a tým"
        nadpis="Účty, organizace a provozní nastavení"
        popis="Správa lidí, rolí a organizační struktury na jednom místě, aby bylo jasné, kdo spravuje obsah, finance i vstup."
      >
      {opravneni.sprava_obsahu ? (
      <SekcePanelu
        id="tym"
        nadpis="Tým a role"
        popis="Účty pro správu obsahu, finance i obsluhu u vstupu."
        akce={<a className="button" href="#formular-clenstvi">Přidat člena</a>}
      >
        <div className="tabulka tabulka-siroka">
          <div className="tabulka-radek-hlavni tabulka-radek-clenstvi">
            <span>Uživatel</span>
            <span>Organizace</span>
            <span>Role</span>
            <span>Stav</span>
            <span>Akce</span>
          </div>
          {clenstvi.map((polozka) => (
            <div key={polozka.id} className="tabulka-radek-data tabulka-radek-clenstvi">
              <div>
                <strong>{polozka.uzivatel_jmeno}</strong>
                <div className="micro">{polozka.uzivatel_email || "Bez e-mailu"}</div>
              </div>
              <div>{polozka.organizace_nazev}</div>
              <div>{formatujRoliOrganizace(polozka.role)}</div>
              <div>{polozka.je_aktivni ? "Aktivní" : "Vypnuto"}</div>
              <div className="actions-start">
                <button
                  className="button"
                  disabled={beziPrechod}
                  onClick={() => void prepniAktivituClenstvi(polozka)}
                  type="button"
                >
                  {polozka.je_aktivni ? "Vypnout" : "Zapnout"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </SekcePanelu>
      ) : null}

      {opravneni.sprava_obsahu ? (
      <SekcePanelu
        id="formular-clenstvi"
        nadpis="Přidat člena týmu"
        popis="Vytvoří nový uživatelský účet a rovnou ho naváže na vybranou organizaci."
      >
        <form className="form-grid" onSubmit={odesliClenstvi}>
          <label className="pole">
            <span className="pole-label">Organizace</span>
            <select
              value={formularClenstvi.organizace}
              onChange={(event) =>
                nastavFormularClenstvi((predchozi) => ({ ...predchozi, organizace: event.target.value }))
              }
              required
            >
              {organizace.map((polozka) => (
                <option key={polozka.id} value={polozka.id}>
                  {polozka.nazev}
                </option>
              ))}
            </select>
          </label>
          <label className="pole">
            <span className="pole-label">Role</span>
            <select
              value={formularClenstvi.role}
              onChange={(event) =>
                nastavFormularClenstvi((predchozi) => ({ ...predchozi, role: event.target.value }))
              }
              required
            >
              <option value="spravce">Spravce</option>
              <option value="pokladna">Pokladna</option>
              <option value="ucetni">Ucetni</option>
              <option value="odbaveni">Odbaveni</option>
            </select>
          </label>
          <label className="pole">
            <span className="pole-label">Uživatelské jméno</span>
            <input
              value={formularClenstvi.nove_uzivatelske_jmeno}
              onChange={(event) =>
                nastavFormularClenstvi((predchozi) => ({
                  ...predchozi,
                  nove_uzivatelske_jmeno: event.target.value,
                }))
              }
              required
            />
          </label>
          <label className="pole">
            <span className="pole-label">E-mail</span>
            <input
              type="email"
              value={formularClenstvi.nove_uzivatelske_email}
              onChange={(event) =>
                nastavFormularClenstvi((predchozi) => ({
                  ...predchozi,
                  nove_uzivatelske_email: event.target.value,
                }))
              }
              required
            />
          </label>
          <label className="pole">
            <span className="pole-label">Dočasné heslo</span>
            <input
              type="password"
              value={formularClenstvi.nove_heslo}
              onChange={(event) =>
                nastavFormularClenstvi((predchozi) => ({
                  ...predchozi,
                  nove_heslo: event.target.value,
                }))
              }
              required
            />
          </label>
          <div className="actions-end pole-cela">
            <button className="button primary" disabled={beziPrechod} type="submit">
              {beziPrechod ? "Ukládám..." : "Přidat člena týmu"}
            </button>
          </div>
        </form>
      </SekcePanelu>
      ) : null}

      {opravneni.sprava_obsahu ? (
      <SekcePanelu
        id="organizace"
        nadpis="Organizace"
        popis="Každá organizace má vlastní identitu, kontaktní údaje a provozní nastavení."
        akce={<a className="button" href="#formular-organizace">Nová organizace</a>}
      >
        <div className="tabulka">
          <div className="tabulka-radek-hlavni">
            <span>Organizace</span>
            <span>Typ</span>
            <span>Kontakt</span>
            <span>Vzhled</span>
          </div>
          {organizace.map((polozka) => (
            <div key={polozka.id} className="tabulka-radek-data">
              <div>
                <strong>{polozka.nazev}</strong>
                <div className="micro">{polozka.slug}</div>
              </div>
              <div>{formatujTypOrganizace(polozka.typ_organizace)}</div>
              <div>
                <div>{polozka.kontaktni_email || "Bez e-mailu"}</div>
                <div className="micro">{polozka.kontaktni_telefon || "Bez telefonu"}</div>
              </div>
              <div className="barva-radek">
                <span className="barva-vzorek" style={{ backgroundColor: polozka.hlavni_barva }} />
                <span>{polozka.hlavni_barva}</span>
              </div>
            </div>
          ))}
        </div>
      </SekcePanelu>
      ) : null}

      {opravneni.sprava_obsahu ? (
      <SekcePanelu
        id="formular-organizace"
        nadpis="Nová organizace"
        popis="Vytvoření další obce, kulturního domu nebo samostatného pořadatelského prostoru."
      >
        <form className="form-grid" onSubmit={odesliOrganizaci}>
          <label className="pole">
            <span className="pole-label">Název</span>
            <input
              value={formularOrganizace.nazev}
              onChange={(event) =>
                nastavFormularOrganizace((predchozi) => ({
                  ...predchozi,
                  nazev: event.target.value,
                  slug: vytvorSlug(event.target.value),
                }))
              }
              required
            />
          </label>
          <label className="pole">
            <span className="pole-label">Slug</span>
            <input
              value={formularOrganizace.slug}
              onChange={(event) =>
                nastavFormularOrganizace((predchozi) => ({ ...predchozi, slug: event.target.value }))
              }
              required
            />
          </label>
          <label className="pole">
            <span className="pole-label">Typ organizace</span>
            <select
              value={formularOrganizace.typ_organizace}
              onChange={(event) =>
                nastavFormularOrganizace((predchozi) => ({
                  ...predchozi,
                  typ_organizace: event.target.value,
                }))
              }
            >
              <option value="obec">Obec</option>
              <option value="kulturni_dum">Kulturní dům</option>
              <option value="poradatel">Poradatel</option>
            </select>
          </label>
          <label className="pole">
            <span className="pole-label">Hlavní barva</span>
            <input
              type="color"
              value={formularOrganizace.hlavni_barva}
              onChange={(event) =>
                nastavFormularOrganizace((predchozi) => ({
                  ...predchozi,
                  hlavni_barva: event.target.value,
                }))
              }
            />
          </label>
          <label className="pole">
            <span className="pole-label">Kontaktní e-mail</span>
            <input
              type="email"
              value={formularOrganizace.kontaktni_email}
              onChange={(event) =>
                nastavFormularOrganizace((predchozi) => ({
                  ...predchozi,
                  kontaktni_email: event.target.value,
                }))
              }
            />
          </label>
          <label className="pole">
            <span className="pole-label">Kontaktní telefon</span>
            <input
              value={formularOrganizace.kontaktni_telefon}
              onChange={(event) =>
                nastavFormularOrganizace((predchozi) => ({
                  ...predchozi,
                  kontaktni_telefon: event.target.value,
                }))
              }
            />
          </label>
          <div className="actions-end pole-cela">
            <button className="button primary" disabled={beziPrechod} type="submit">
              {beziPrechod ? "Ukládám..." : "Vytvořit organizaci"}
            </button>
          </div>
        </form>
      </SekcePanelu>
      ) : null}
      </BlokSpravy>
      ) : null}

      {opravneni.sprava_obsahu ? (
      <BlokSpravy
        id="mista-a-plan"
        stitek="Místa a plánky"
        nadpis="Prostory, kapacita a prodejní mapy"
        popis="Místa konání tvoří základ pro akce i místenkový prodej, proto mají vlastní jasně oddělenou část správy."
      >
      {opravneni.sprava_obsahu ? (
      <SekcePanelu
        id="mista"
        nadpis="Místa konání"
        popis="Kapacita a umístění se propisují do akcí, budoucího prodeje i odbavení."
        akce={<a className="button" href="#formular-misto">Nové místo</a>}
      >
        <div className="tabulka">
          <div className="tabulka-radek-hlavni">
            <span>Místo</span>
            <span>Organizace</span>
            <span>Adresa</span>
            <span>Kapacita</span>
          </div>
          {mistaKonani.map((misto) => (
            <div key={misto.id} className="tabulka-radek-data">
              <div>
                <strong>{misto.nazev}</strong>
                <div className="micro">{misto.mesto}</div>
              </div>
              <div>{misto.organizace_nazev}</div>
              <div>{misto.adresa || "Bez adresy"}</div>
              <div>{misto.kapacita} míst</div>
            </div>
          ))}
        </div>
      </SekcePanelu>
      ) : null}

      {opravneni.sprava_obsahu ? (
      <SekcePanelu
        id="formular-misto"
        nadpis="Nové místo konání"
        popis="Připrav prostor, do kterého budou navázané další akce a plánky sálu."
      >
        <form className="form-grid" onSubmit={odesliMisto}>
          <label className="pole">
            <span className="pole-label">Organizace</span>
            <select
              value={formularMista.organizace}
              onChange={(event) =>
                nastavFormularMista((predchozi) => ({ ...predchozi, organizace: event.target.value }))
              }
              required
            >
              {organizace.map((polozka) => (
                <option key={polozka.id} value={polozka.id}>
                  {polozka.nazev}
                </option>
              ))}
            </select>
          </label>
          <label className="pole">
            <span className="pole-label">Název místa</span>
            <input
              value={formularMista.nazev}
              onChange={(event) =>
                nastavFormularMista((predchozi) => ({ ...predchozi, nazev: event.target.value }))
              }
              required
            />
          </label>
          <label className="pole">
            <span className="pole-label">Adresa</span>
            <input
              value={formularMista.adresa}
              onChange={(event) =>
                nastavFormularMista((predchozi) => ({ ...predchozi, adresa: event.target.value }))
              }
            />
          </label>
          <label className="pole">
            <span className="pole-label">Město</span>
            <input
              value={formularMista.mesto}
              onChange={(event) =>
                nastavFormularMista((predchozi) => ({ ...predchozi, mesto: event.target.value }))
              }
            />
          </label>
          <label className="pole">
            <span className="pole-label">Kapacita</span>
            <input
              min="0"
              type="number"
              value={formularMista.kapacita}
              onChange={(event) =>
                nastavFormularMista((predchozi) => ({ ...predchozi, kapacita: event.target.value }))
              }
              required
            />
          </label>
          <div className="actions-end pole-cela">
            <button className="button primary" disabled={beziPrechod} type="submit">
              {beziPrechod ? "Ukládám..." : "Vytvořit místo konání"}
            </button>
          </div>
        </form>
      </SekcePanelu>
      ) : null}
      </BlokSpravy>
      ) : null}

      {opravneni.sprava_obsahu ? (
      <BlokSpravy
        id="program-a-prodej"
        stitek="Program a prodej"
        nadpis="Akce, cenové hladiny a veřejná nabídka"
        popis="Obsah, termíny a prodejní nastavení akcí včetně návaznosti na detail akce a další provozní kroky."
      >
      {opravneni.sprava_obsahu ? (
      <SekcePanelu
        id="akce"
        nadpis="Akce"
        popis="Každá akce má jasné místo, termín, stav, kapacitu i cenové hladiny."
        akce={<a className="button" href="#formular-akce">Nová akce</a>}
      >
        <div className="stack-karty">
          {akce.map((polozka) => {
            const kategorieAkce = kategorieVstupenek.filter((kategorie) => kategorie.akce === polozka.id);

            return (
              <article key={polozka.id} className="udalost-karta">
                <div className="udalost-top">
                  <div>
                    <div className="micro">{polozka.organizace_nazev}</div>
                    <h3>{polozka.nazev}</h3>
                  </div>
                  <span className="badge akcent">{formatujStavAkce(polozka.stav)}</span>
                </div>

                <div className="detail-grid">
                  <div className="detail-pole">
                    <span>Místo konání</span>
                    <strong>{polozka.misto_konani_nazev}</strong>
                  </div>
                <div className="detail-pole">
                  <span>Termín</span>
                  <strong>{formatujDatum(polozka.zacatek)}</strong>
                </div>
                <div className="detail-pole">
                  <span>Obsah</span>
                  <strong>
                    <a href={`/sprava/akce/${polozka.slug}`}>Otevřít detail akce</a>
                  </strong>
                </div>
                <div className="detail-pole">
                  <span>Kapacita</span>
                  <strong>{polozka.kapacita} míst</strong>
                </div>
                  <div className="detail-pole">
                    <span>Rezervace</span>
                    <strong>{polozka.rezervace_platnost_minuty} minut</strong>
                  </div>
                  <div className="detail-pole">
                    <span>Doporučená</span>
                    <strong>{polozka.je_doporucena ? "Ano" : "Ne"}</strong>
                  </div>
                </div>

                <div className="vstupenky-blok">
                  <div className="sekce-header">
                    <div>
                      <h3>Kategorie vstupenek</h3>
                      <p>{kategorieAkce.length} aktivních cenových hladin pro tuto akci.</p>
                    </div>
                  </div>
                  {kategorieAkce.map((kategorie) => (
                    <div key={kategorie.id} className="vstupenka-radek">
                      <div>
                        <strong>{kategorie.nazev}</strong>
                        <div className="micro">{kategorie.popis || "Bez doplňujícího popisu"}</div>
                      </div>
                      <div>{formatujCastku(kategorie.cena, kategorie.mena)}</div>
                      <div className="micro">Kapacita {kategorie.kapacita}</div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </SekcePanelu>
      ) : null}

      {opravneni.sprava_obsahu ? (
      <SekcePanelu
        id="formular-akce"
        nadpis="Nová akce"
        popis="Založení kulturní akce v návazném pracovním toku."
      >
        <form className="form-grid" onSubmit={odesliAkci}>
          <label className="pole">
            <span className="pole-label">Organizace</span>
            <select
              value={formularAkce.organizace}
              onChange={(event) =>
                nastavFormularAkce((predchozi) => ({
                  ...predchozi,
                  organizace: event.target.value,
                  misto_konani: "",
                }))
              }
              required
            >
              {organizace.map((polozka) => (
                <option key={polozka.id} value={polozka.id}>
                  {polozka.nazev}
                </option>
              ))}
            </select>
          </label>
          <label className="pole">
            <span className="pole-label">Název akce</span>
            <input
              value={formularAkce.nazev}
              onChange={(event) =>
                nastavFormularAkce((predchozi) => ({
                  ...predchozi,
                  nazev: event.target.value,
                  slug: vytvorSlug(event.target.value),
                }))
              }
              required
            />
          </label>
          <label className="pole">
            <span className="pole-label">Slug</span>
            <input
              value={formularAkce.slug}
              onChange={(event) =>
                nastavFormularAkce((predchozi) => ({ ...predchozi, slug: event.target.value }))
              }
              required
            />
          </label>
          <label className="pole">
            <span className="pole-label">Místo konání</span>
            <select
              value={formularAkce.misto_konani}
              onChange={(event) =>
                nastavFormularAkce((predchozi) => ({ ...predchozi, misto_konani: event.target.value }))
              }
              required
            >
              <option value="">Vyber místo</option>
              {mistaProAkci.map((misto) => (
                <option key={misto.id} value={misto.id}>
                  {misto.nazev}
                </option>
              ))}
            </select>
          </label>
          <label className="pole pole-cela">
            <span className="pole-label">Popis</span>
            <textarea
              rows={4}
              value={formularAkce.popis}
              onChange={(event) =>
                nastavFormularAkce((predchozi) => ({ ...predchozi, popis: event.target.value }))
              }
            />
          </label>
          <label className="pole">
            <span className="pole-label">Stav</span>
            <select
              value={formularAkce.stav}
              onChange={(event) =>
                nastavFormularAkce((predchozi) => ({ ...predchozi, stav: event.target.value }))
              }
            >
              <option value="navrh">Návrh</option>
              <option value="zverejneno">Zveřejněno</option>
              <option value="vyprodano">Vyprodáno</option>
              <option value="ukonceno">Ukončeno</option>
              <option value="zruseno">Zrušeno</option>
            </select>
          </label>
          <label className="pole">
            <span className="pole-label">Kapacita</span>
            <input
              min="0"
              type="number"
              value={formularAkce.kapacita}
              onChange={(event) =>
                nastavFormularAkce((predchozi) => ({ ...predchozi, kapacita: event.target.value }))
              }
              required
            />
          </label>
          <label className="pole">
            <span className="pole-label">Platnost rezervace (minuty)</span>
            <input
              min="1"
              type="number"
              value={formularAkce.rezervace_platnost_minuty}
              onChange={(event) =>
                nastavFormularAkce((predchozi) => ({
                  ...predchozi,
                  rezervace_platnost_minuty: event.target.value,
                }))
              }
              required
            />
          </label>
          <label className="pole">
            <span className="pole-label">Začátek</span>
            <input
              type="datetime-local"
              value={formularAkce.zacatek}
              onChange={(event) =>
                nastavFormularAkce((predchozi) => ({ ...predchozi, zacatek: event.target.value }))
              }
              required
            />
          </label>
          <label className="pole">
            <span className="pole-label">Konec</span>
            <input
              type="datetime-local"
              value={formularAkce.konec}
              onChange={(event) =>
                nastavFormularAkce((predchozi) => ({ ...predchozi, konec: event.target.value }))
              }
            />
          </label>
          <label className="pole-checkbox">
            <input
              checked={formularAkce.je_doporucena}
              type="checkbox"
              onChange={(event) =>
                nastavFormularAkce((predchozi) => ({
                  ...predchozi,
                  je_doporucena: event.target.checked,
                }))
              }
            />
            <span>Doporučit akci na veřejném portálu</span>
          </label>
          <div className="actions-end pole-cela">
            <button className="button primary" disabled={beziPrechod} type="submit">
              {beziPrechod ? "Ukládám..." : "Vytvořit akci"}
            </button>
          </div>
        </form>
      </SekcePanelu>
      ) : null}

      {opravneni.sprava_obsahu ? (
      <SekcePanelu
        id="vstupenky"
        nadpis="Nová kategorie vstupenky"
        popis="Cenová hladina, aktivace prodeje a navázání na konkrétní akci."
      >
        <form className="form-grid" onSubmit={odesliKategorii}>
          <label className="pole">
            <span className="pole-label">Organizace</span>
            <select
              value={formularKategorie.organizace}
              onChange={(event) =>
                nastavFormularKategorie((predchozi) => ({
                  ...predchozi,
                  organizace: event.target.value,
                  akce: "",
                }))
              }
              required
            >
              {organizace.map((polozka) => (
                <option key={polozka.id} value={polozka.id}>
                  {polozka.nazev}
                </option>
              ))}
            </select>
          </label>
          <label className="pole">
            <span className="pole-label">Akce</span>
            <select
              value={formularKategorie.akce}
              onChange={(event) =>
                nastavFormularKategorie((predchozi) => ({ ...predchozi, akce: event.target.value }))
              }
              required
            >
              <option value="">Vyber akci</option>
              {akceProKategorii.map((polozka) => (
                <option key={polozka.id} value={polozka.id}>
                  {polozka.nazev}
                </option>
              ))}
            </select>
          </label>
          <label className="pole">
            <span className="pole-label">Název kategorie</span>
            <input
              value={formularKategorie.nazev}
              onChange={(event) =>
                nastavFormularKategorie((predchozi) => ({ ...predchozi, nazev: event.target.value }))
              }
              required
            />
          </label>
          <label className="pole">
            <span className="pole-label">Cena</span>
            <input
              min="0"
              step="0.01"
              type="number"
              value={formularKategorie.cena}
              onChange={(event) =>
                nastavFormularKategorie((predchozi) => ({ ...predchozi, cena: event.target.value }))
              }
              required
            />
          </label>
          <label className="pole">
            <span className="pole-label">Měna</span>
            <select
              value={formularKategorie.mena}
              onChange={(event) =>
                nastavFormularKategorie((predchozi) => ({ ...predchozi, mena: event.target.value }))
              }
            >
              <option value="CZK">CZK</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label className="pole">
            <span className="pole-label">Kapacita</span>
            <input
              min="0"
              type="number"
              value={formularKategorie.kapacita}
              onChange={(event) =>
                nastavFormularKategorie((predchozi) => ({
                  ...predchozi,
                  kapacita: event.target.value,
                }))
              }
              required
            />
          </label>
          <label className="pole pole-cela">
            <span className="pole-label">Popis</span>
            <textarea
              rows={3}
              value={formularKategorie.popis}
              onChange={(event) =>
                nastavFormularKategorie((predchozi) => ({ ...predchozi, popis: event.target.value }))
              }
            />
          </label>
          <label className="pole">
            <span className="pole-label">Prodej od</span>
            <input
              type="datetime-local"
              value={formularKategorie.prodej_od}
              onChange={(event) =>
                nastavFormularKategorie((predchozi) => ({
                  ...predchozi,
                  prodej_od: event.target.value,
                }))
              }
            />
          </label>
          <label className="pole">
            <span className="pole-label">Prodej do</span>
            <input
              type="datetime-local"
              value={formularKategorie.prodej_do}
              onChange={(event) =>
                nastavFormularKategorie((predchozi) => ({
                  ...predchozi,
                  prodej_do: event.target.value,
                }))
              }
            />
          </label>
          <label className="pole-checkbox">
            <input
              checked={formularKategorie.je_aktivni}
              type="checkbox"
              onChange={(event) =>
                nastavFormularKategorie((predchozi) => ({
                  ...predchozi,
                  je_aktivni: event.target.checked,
                }))
              }
            />
            <span>Kategorie je aktivní pro prodej</span>
          </label>
          <div className="actions-end pole-cela">
            <button className="button primary" disabled={beziPrechod} type="submit">
              {beziPrechod ? "Ukládám..." : "Vytvořit kategorii vstupenky"}
            </button>
          </div>
        </form>
      </SekcePanelu>
      ) : null}
      </BlokSpravy>
      ) : null}
    </div>
  );
}
