"use client";

import { useEffect, useMemo, useState } from "react";

import {
  nactiProfilSpravy,
  nactiSouhrnAdministrace,
  oznacitProformuJakoZaplacenou,
  vytvorTokenSpravy,
  znovuOdeslatProformu,
  type ProfilSpravy,
  type ProformaDoklad,
} from "@/lib/api";
import { formatujCastku, formatujDatum, formatujStavProformy } from "@/lib/formatovani";
import { GrafRozlozeni, GrafSloupcovy } from "@/components/sprava-grafy";
import { vytvorVychoziPrihlaseni } from "@/lib/demo-rezim";

const klicTokenu = "kliknilistek.sprava.token";

type Stav = "cekam" | "prihlaseni" | "nacitani" | "pripraveno";
type PohledFakturace = "vse" | "nezaplaceno" | "po_splatnosti" | "zaplaceno_dnes";

function jeDnes(datum: string | null | undefined): boolean {
  if (!datum) {
    return false;
  }
  const hodnota = new Date(datum);
  if (Number.isNaN(hodnota.getTime())) {
    return false;
  }
  const dnes = new Date();
  return (
    hodnota.getFullYear() === dnes.getFullYear() &&
    hodnota.getMonth() === dnes.getMonth() &&
    hodnota.getDate() === dnes.getDate()
  );
}

function jePoSplatnosti(datum: string, stav: string): boolean {
  if (stav === "zaplaceno" || stav === "storno") {
    return false;
  }
  const hodnota = new Date(datum);
  if (Number.isNaN(hodnota.getTime())) {
    return false;
  }
  return hodnota.getTime() < Date.now();
}

export function SpravaFakturaceBrana() {
  const [stav, nastavStav] = useState<Stav>("cekam");
  const [token, nastavToken] = useState("");
  const [profil, nastavProfil] = useState<ProfilSpravy | null>(null);
  const [proformy, nastavProformy] = useState<ProformaDoklad[]>([]);
  const [chyba, nastavChybu] = useState("");
  const [zprava, nastavZpravu] = useState("");
  const [formular, nastavFormular] = useState(vytvorVychoziPrihlaseni("spravce"));
  const [pohled, nastavPohled] = useState<PohledFakturace>("vse");
  const [hledani, nastavHledani] = useState("");

  async function nactiData(tokenSpravy: string) {
    nastavStav("nacitani");
    nastavChybu("");
    try {
      const [profilSpravy, data] = await Promise.all([
        nactiProfilSpravy(tokenSpravy),
        nactiSouhrnAdministrace(tokenSpravy),
      ]);
      if (!profilSpravy.opravneni.finance) {
        throw new Error("Tento účet nemá přístup do fakturace.");
      }
      localStorage.setItem(klicTokenu, tokenSpravy);
      nastavToken(tokenSpravy);
      nastavProfil(profilSpravy);
      nastavProformy(data.proformy);
      nastavStav("pripraveno");
    } catch (error) {
      localStorage.removeItem(klicTokenu);
      nastavToken("");
      nastavProfil(null);
      nastavProformy([]);
      nastavStav("prihlaseni");
      nastavChybu(error instanceof Error ? error.message : "Fakturaci se nepodařilo načíst.");
    }
  }

  useEffect(() => {
    const ulozenyToken = localStorage.getItem(klicTokenu);
    if (!ulozenyToken) {
      nastavStav("prihlaseni");
      return;
    }
    void nactiData(ulozenyToken);
  }, []);

  const grafStavu = useMemo(
    () =>
      Object.entries(
        proformy.reduce<Record<string, number>>((vysledek, proforma) => {
          vysledek[proforma.stav] = (vysledek[proforma.stav] ?? 0) + 1;
          return vysledek;
        }, {}),
      ).map(([stitek, hodnota]) => ({ stitek, hodnota })),
    [proformy],
  );

  const grafCastky = useMemo(
    () =>
      proformy.slice(0, 8).map((proforma) => ({
        stitek: proforma.cislo_dokladu,
        hodnota: Number(proforma.castka),
      })),
    [proformy],
  );

  const filtrovaneProformy = useMemo(() => {
    const text = hledani.trim().toLowerCase();

    return proformy.filter((proforma) => {
      const odpovidaPohledu =
        pohled === "vse"
          ? true
          : pohled === "nezaplaceno"
            ? proforma.stav !== "zaplaceno" && proforma.stav !== "storno"
            : pohled === "po_splatnosti"
              ? jePoSplatnosti(proforma.datum_splatnosti, proforma.stav)
              : jeDnes(proforma.uhrazeno_v);

      const odpovidaHledani = !text
        ? true
        : [
            proforma.cislo_dokladu,
            proforma.objednavka_verejne_id,
            proforma.organizace_nazev,
            proforma.variabilni_symbol,
            proforma.cislo_uctu,
            proforma.iban,
          ]
            .join(" ")
            .toLowerCase()
            .includes(text);

      return odpovidaPohledu && odpovidaHledani;
    });
  }, [hledani, pohled, proformy]);

  async function potvrdPlatbu(cisloDokladu: string) {
    nastavChybu("");
    nastavZpravu("");
    try {
      await oznacitProformuJakoZaplacenou(cisloDokladu, token);
      await nactiData(token);
      nastavZpravu(`Proforma ${cisloDokladu} byla označena jako zaplacená a vstupenky byly odeslány.`);
    } catch (error) {
      nastavChybu(error instanceof Error ? error.message : "Úhradu se nepodařilo potvrdit.");
    }
  }

  async function znovuOdesli(cisloDokladu: string) {
    nastavChybu("");
    nastavZpravu("");
    try {
      await znovuOdeslatProformu(cisloDokladu, token);
      await nactiData(token);
      nastavZpravu(`Proforma ${cisloDokladu} byla znovu odeslána e-mailem.`);
    } catch (error) {
      nastavChybu(error instanceof Error ? error.message : "Proformu se nepodařilo znovu odeslat.");
    }
  }

  if (stav === "cekam" || stav === "nacitani") {
    return <section className="sprava-panel"><div className="sprava-panel-body"><div className="tlumeny">Načítám fakturaci…</div></div></section>;
  }

  if (stav === "prihlaseni") {
    return (
      <section className="sprava-panel">
        <div className="sprava-panel-header">
          <div>
            <h3>Přihlášení do fakturace</h3>
            <p>Sekce proforma dokladů je dostupná jen účtům s finančním přístupem.</p>
          </div>
        </div>
        <div className="sprava-panel-body stack">
          <form
            className="form-grid"
            onSubmit={async (event) => {
              event.preventDefault();
              await nactiData(vytvorTokenSpravy(formular.uzivatel, formular.heslo));
            }}
          >
            <label className="pole">
              <span className="pole-label">Uživatelské jméno</span>
              <input
                value={formular.uzivatel}
                onChange={(event) => nastavFormular((aktualni) => ({ ...aktualni, uzivatel: event.target.value }))}
              />
            </label>
            <label className="pole">
              <span className="pole-label">Heslo</span>
              <input
                type="password"
                value={formular.heslo}
                onChange={(event) => nastavFormular((aktualni) => ({ ...aktualni, heslo: event.target.value }))}
              />
            </label>
            <div className="actions-end pole-cela">
              <button className="button primary" type="submit">Otevřít fakturaci</button>
            </div>
          </form>
          {chyba ? <div className="hlaseni chyba">{chyba}</div> : null}
        </div>
      </section>
    );
  }

  return (
    <div className="stack">
      {(chyba || zprava) ? <div className={chyba ? "hlaseni chyba" : "hlaseni uspech"}>{chyba || zprava}</div> : null}

      <section className="detail-spravy-hero">
        <div className="detail-spravy-hero-copy">
          <div className="hero-meta">
            <span className="badge akcent">Fakturace</span>
            <span className="badge">{profil?.uzivatel}</span>
          </div>
          <h1>Proforma doklady a bankovní úhrady</h1>
          <p>Přehled vystavených proforem, QR plateb a ručního potvrzení bankovního převodu.</p>
        </div>
      </section>

      <div className="grafy-grid">
        <GrafRozlozeni nadpis="Stavy dokladů" popis="Kolik proforem čeká na úhradu a kolik je zaplacených." polozky={grafStavu} />
        <GrafSloupcovy nadpis="Nejvyšší částky" popis="Rychlý přehled finančně nejsilnějších proforem." polozky={grafCastky} />
      </div>

      <section className="sprava-panel">
        <div className="sprava-panel-header">
          <div>
            <h3>Seznam proforma dokladů</h3>
            <p>Ruční potvrzení úhrady po kontrole bankovního účtu a rychlý přechod na objednávku.</p>
          </div>
        </div>
        <div className="sprava-panel-body">
          <div className="ulozene-pohledy">
            <button className={`button ghost mini${pohled === "vse" ? " aktivni-pohled" : ""}`} type="button" onClick={() => nastavPohled("vse")}>Všechny</button>
            <button className={`button ghost mini${pohled === "nezaplaceno" ? " aktivni-pohled" : ""}`} type="button" onClick={() => nastavPohled("nezaplaceno")}>Nezaplacené</button>
            <button className={`button ghost mini${pohled === "po_splatnosti" ? " aktivni-pohled" : ""}`} type="button" onClick={() => nastavPohled("po_splatnosti")}>Po splatnosti</button>
            <button className={`button ghost mini${pohled === "zaplaceno_dnes" ? " aktivni-pohled" : ""}`} type="button" onClick={() => nastavPohled("zaplaceno_dnes")}>Zaplaceno dnes</button>
          </div>
          <div className="form-grid admin-filtry admin-filtry-kompaktni">
            <label className="pole pole-cela">
              <span className="pole-label">Hledání</span>
              <input
                value={hledani}
                onChange={(event) => nastavHledani(event.target.value)}
                placeholder="Číslo dokladu, objednávka, organizace, VS nebo účet"
              />
            </label>
          </div>
          <div className="tabulka tabulka-siroka">
            <div className="tabulka-radek-hlavni" style={{ gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr auto auto" }}>
              <span>Doklad</span>
              <span>Objednávka</span>
              <span>Stav</span>
              <span>Částka</span>
              <span>Splatnost</span>
              <span />
              <span />
            </div>
            {filtrovaneProformy.map((proforma) => (
              <div key={proforma.cislo_dokladu} className="tabulka-radek-data" style={{ gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr auto auto" }}>
                <div className="tabulka-bunka-hlavni">
                  <strong>{proforma.cislo_dokladu}</strong>
                  <div className="micro">VS {proforma.variabilni_symbol}</div>
                </div>
                <div>
                  <strong>{proforma.objednavka_verejne_id || "Neuvedeno"}</strong>
                  <div className="micro">{proforma.organizace_nazev || "Organizace"}</div>
                </div>
                <div>
                  <strong>{formatujStavProformy(proforma.stav)}</strong>
                  <div className="micro">{proforma.uhrazeno_v ? `Uhrazeno ${formatujDatum(proforma.uhrazeno_v)}` : "Čeká na úhradu"}</div>
                </div>
                <div>
                  <strong>{formatujCastku(proforma.castka, proforma.mena)}</strong>
                  <div className="micro">{proforma.cislo_uctu || proforma.iban || "Účet neuveden"}</div>
                </div>
                <div>
                  <strong>{formatujDatum(proforma.datum_splatnosti)}</strong>
                </div>
                <div className="actions-wrap actions-wrap-end">
                  <a className="button ghost" href={`/api_proxy/fakturace/proformy/${proforma.cislo_dokladu}/pdf/`} target="_blank">
                    PDF
                  </a>
                  {proforma.objednavka_verejne_id ? (
                    <a className="button ghost" href={`/sprava/objednavky/${proforma.objednavka_verejne_id}`}>Objednávka</a>
                  ) : null}
                  <button className="button ghost" type="button" onClick={() => void znovuOdesli(proforma.cislo_dokladu)}>
                    Znovu odeslat
                  </button>
                </div>
                <div className="actions-wrap actions-wrap-end">
                  {proforma.stav !== "zaplaceno" ? (
                    <button className="button primary" type="button" onClick={() => void potvrdPlatbu(proforma.cislo_dokladu)}>
                      Označit jako zaplacené
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            {!filtrovaneProformy.length ? (
              <div className="tlumeny" style={{ paddingTop: 12 }}>
                Pro zvolený filtr teď nemáme žádné proforma doklady.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
