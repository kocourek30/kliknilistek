"use client";

import { useEffect, useState } from "react";

import {
  dorucVstupenkyObjednavky,
  nactiObjednavku,
  oznacitProformuJakoZaplacenou,
  nactiProfilSpravy,
  presaditVstupenkuObjednavky,
  prohoditMistaObjednavky,
  potvrditHotovostObjednavky,
  stornovatObjednavku,
  vratitObjednavku,
  vytvorTokenSpravy,
  znovuOdeslatProformu,
  type Objednavka,
  type ProfilSpravy,
} from "@/lib/api";
import {
  formatujCastku,
  formatujDatum,
  formatujPoskytovatelePlatby,
  formatujStavObjednavky,
  formatujStavPlatby,
  formatujStavVstupenky,
} from "@/lib/formatovani";
import { formatujKratkeOznaceniMista } from "@/lib/plan-salu";
import { GrafRozlozeni, GrafSloupcovy } from "@/components/sprava-grafy";
import { vytvorVychoziPrihlaseni } from "@/lib/demo-rezim";

const klicTokenu = "kliknilistek.sprava.token";

type StavNacitani = "cekam" | "prihlaseni" | "nacitani" | "pripraveno";

type Vlastnosti = {
  verejneId: string;
};

export function SpravaDetailObjednavkyBrana({ verejneId }: Vlastnosti) {
  const [stav, nastavStav] = useState<StavNacitani>("cekam");
  const [tokenSpravy, nastavTokenSpravy] = useState("");
  const [profil, nastavProfil] = useState<ProfilSpravy | null>(null);
  const [objednavka, nastavObjednavku] = useState<Objednavka | null>(null);
  const [chyba, nastavChybu] = useState("");
  const [zprava, nastavZpravu] = useState("");
  const [formular, nastavFormular] = useState(vytvorVychoziPrihlaseni("spravce"));
  const [presazeni, nastavPresazeni] = useState({ vstupenka_kod: "", nove_misto: "" });
  const [prohozeni, nastavProhozeni] = useState({ vstupenka_kod_a: "", vstupenka_kod_b: "" });

  function normalizujObjednavku(detailObjednavky: Objednavka): Objednavka {
    return {
      ...detailObjednavky,
      polozky: detailObjednavky.polozky ?? [],
      vstupenky: detailObjednavky.vstupenky ?? [],
      platby: detailObjednavky.platby ?? [],
      emailove_zasilky: detailObjednavky.emailove_zasilky ?? [],
    };
  }

  async function nactiDetail(token: string) {
    nastavStav("nacitani");
    nastavChybu("");
    nastavZpravu("");

    try {
      const [profilSpravy, detailObjednavky] = await Promise.all([
        nactiProfilSpravy(token),
        nactiObjednavku(verejneId),
      ]);

      if (!profilSpravy.ma_pristup_do_spravy || !profilSpravy.opravneni.finance) {
        throw new Error("Tento účet nemá přístup k objednávkám a financím.");
      }

      if (!detailObjednavky) {
        throw new Error("Objednávka nebyla nalezena.");
      }

      const normalizovanaObjednavka = normalizujObjednavku(detailObjednavky);

      localStorage.setItem(klicTokenu, token);
      nastavTokenSpravy(token);
      nastavProfil(profilSpravy);
      nastavObjednavku(normalizovanaObjednavka);
      nastavPresazeni((aktualni) => ({
        vstupenka_kod: aktualni.vstupenka_kod || normalizovanaObjednavka.vstupenky[0]?.kod || "",
        nove_misto: "",
      }));
      nastavProhozeni((aktualni) => ({
        vstupenka_kod_a:
          aktualni.vstupenka_kod_a || normalizovanaObjednavka.vstupenky[0]?.kod || "",
        vstupenka_kod_b:
          aktualni.vstupenka_kod_b ||
          normalizovanaObjednavka.vstupenky[1]?.kod ||
          normalizovanaObjednavka.vstupenky[0]?.kod ||
          "",
      }));
      nastavStav("pripraveno");
    } catch (error) {
      localStorage.removeItem(klicTokenu);
      nastavTokenSpravy("");
      nastavProfil(null);
      nastavObjednavku(null);
      nastavStav("prihlaseni");
      nastavChybu(error instanceof Error ? error.message : "Detail objednávky se nepodařilo načíst.");
    }
  }

  useEffect(() => {
    const ulozenyToken = localStorage.getItem(klicTokenu);
    if (!ulozenyToken) {
      nastavStav("prihlaseni");
      return;
    }
    void nactiDetail(ulozenyToken);
  }, [verejneId]);

  async function obnovObjednavku() {
    const detailObjednavky = await nactiObjednavku(verejneId);
    if (detailObjednavky) {
      nastavObjednavku(normalizujObjednavku(detailObjednavky));
    }
  }

  function odhlasit() {
    localStorage.removeItem(klicTokenu);
    nastavTokenSpravy("");
    nastavProfil(null);
    nastavObjednavku(null);
    nastavStav("prihlaseni");
  }

  async function odesliPrihlaseni(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = vytvorTokenSpravy(formular.uzivatel, formular.heslo);
    await nactiDetail(token);
  }

  async function provedAkci(akce: () => Promise<Objednavka>, uspech: string) {
    nastavChybu("");
    nastavZpravu("");
    try {
      const detail = await akce();
      nastavObjednavku(detail);
      await obnovObjednavku();
      nastavZpravu(uspech);
    } catch (error) {
      nastavChybu(error instanceof Error ? error.message : "Operace se nepodařila.");
    }
  }

  if (stav === "cekam" || stav === "nacitani") {
    return (
      <section className="sprava-panel">
        <div className="sprava-panel-body">
          <div className="tlumeny">Načítám detail objednávky a kontroluji přístup...</div>
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
              <h3>Přihlášení do detailu objednávky</h3>
              <p>Tento detail je dostupný jen pro účty s přístupem k financím.</p>
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
                  Otevřít detail
                </button>
              </div>
            </form>

            {chyba ? <div className="hlaseni chyba">{chyba}</div> : null}
          </div>
        </section>
      </div>
    );
  }

  if (!profil || !objednavka) {
    return null;
  }

  const jeZaplaceno = objednavka.stav === "zaplaceno";
  const lzeStornovat = objednavka.stav === "ceka_na_platbu" || objednavka.stav === "zaplaceno";
  const lzeVratit = objednavka.stav === "zaplaceno";
  const grafPolozek = objednavka.polozky.map((polozka) => ({
    stitek: polozka.kategorie_vstupenky_nazev || "Položka",
    hodnota: polozka.pocet,
  }));
  const grafVstupenek = Object.entries(
    objednavka.vstupenky.reduce<Record<string, number>>((vysledek, vstupenka) => {
      const stitek = formatujStavVstupenky(vstupenka.stav);
      vysledek[stitek] = (vysledek[stitek] ?? 0) + 1;
      return vysledek;
    }, {}),
  ).map(([stitek, hodnota]) => ({ stitek, hodnota }));
  const grafPlateb = Object.entries(
    (objednavka.platby ?? []).reduce<Record<string, number>>((vysledek, platba) => {
      const stitek = formatujStavPlatby(platba.stav);
      vysledek[stitek] = (vysledek[stitek] ?? 0) + 1;
      return vysledek;
    }, {}),
  ).map(([stitek, hodnota]) => ({ stitek, hodnota }));

  return (
    <div className="stack">
      {(chyba || zprava) && (
        <div className={chyba ? "hlaseni chyba" : "hlaseni uspech"}>{chyba || zprava}</div>
      )}

      <section className="detail-spravy-hero">
        <div className="detail-spravy-hero-copy">
          <div className="hero-meta">
            <span className="badge akcent">Objednávka {objednavka.verejne_id}</span>
            <span className="badge">{formatujStavObjednavky(objednavka.stav)}</span>
            <span className="badge">{profil.uzivatel}</span>
          </div>
          <h1>Detail objednávky</h1>
          <p>Zákazník, platby, doručení a vstupenky na jednom místě.</p>
        </div>
        <div className="sprava-panel detail-akce-akce">
          <div className="sprava-panel-header">
            <div>
              <h3>Rychlé akce</h3>
              <p>Nejčastější zásahy bez přepínání.</p>
            </div>
          </div>
          <div className="sprava-panel-body stack-mini">
            {objednavka.stav === "ceka_na_platbu" ? (
              <>
                <button
                  className="button primary"
                  onClick={() =>
                    void provedAkci(
                      () => potvrditHotovostObjednavky(objednavka.verejne_id, tokenSpravy),
                      "Objednávka byla potvrzena jako uhrazená hotově.",
                    )
                  }
                  type="button"
                >
                  Potvrdit hotovost
                </button>
                {objednavka.proforma_doklad ? (
                  <button
                    className="button ghost"
                    onClick={() =>
                      void provedAkci(
                        async () => {
                          await oznacitProformuJakoZaplacenou(
                            objednavka.proforma_doklad?.cislo_dokladu || "",
                            tokenSpravy,
                          );
                          const novaObjednavka = await nactiObjednavku(verejneId);
                          if (!novaObjednavka) {
                            throw new Error("Objednávku se po potvrzení úhrady nepodařilo znovu načíst.");
                          }
                          return novaObjednavka;
                        },
                        "Proforma byla označena jako zaplacená a vstupenky byly odeslány.",
                      )
                    }
                    type="button"
                  >
                    Označit proformu jako zaplacenou
                  </button>
                ) : null}
              </>
            ) : null}
            {jeZaplaceno ? (
              <button
                className="button ghost"
                onClick={() =>
                  void provedAkci(
                    () => dorucVstupenkyObjednavky(objednavka.verejne_id, tokenSpravy),
                    "Vstupenky byly znovu odeslány zákazníkovi.",
                  )
                }
                type="button"
              >
                Odeslat vstupenky
              </button>
            ) : null}
            {lzeStornovat ? (
              <button
                className="button ghost"
                onClick={() =>
                  void provedAkci(
                    () => stornovatObjednavku(objednavka.verejne_id, tokenSpravy),
                    "Objednávka byla stornována.",
                  )
                }
                type="button"
              >
                Storno
              </button>
            ) : null}
            {lzeVratit ? (
              <button
                className="button ghost"
                onClick={() =>
                  void provedAkci(
                    () => vratitObjednavku(objednavka.verejne_id, tokenSpravy),
                    "Objednávka byla označena jako vrácená.",
                  )
                }
                type="button"
              >
                Vrátit
              </button>
            ) : null}
            <a className="button ghost" href={`/objednavka/${objednavka.verejne_id}`} target="_blank">
              Veřejný detail
            </a>
            <button className="button ghost" onClick={odhlasit} type="button">
              Odhlásit
            </button>
          </div>
        </div>
      </section>

      <section className="detail-akce-horni-lista">
        <div className="detail-akce-metriky">
          <article className="souhrn-karta akcentni">
            <div className="stit">Celkem</div>
            <div className="cislo">{formatujCastku(objednavka.celkem, objednavka.mena)}</div>
            <div className="tlumeny">Celková hodnota objednávky.</div>
          </article>
          <article className="souhrn-karta">
            <div className="stit">Vstupenky</div>
            <div className="cislo">{objednavka.vstupenky.length}</div>
            <div className="tlumeny">Vydané kusy.</div>
          </article>
          <article className="souhrn-karta">
            <div className="stit">Platby</div>
            <div className="cislo">{objednavka.platby?.length ?? 0}</div>
            <div className="tlumeny">Záznamy o úhradě.</div>
          </article>
          <article className="souhrn-karta">
            <div className="stit">E-maily</div>
            <div className="cislo">{objednavka.emailove_zasilky?.length ?? 0}</div>
            <div className="tlumeny">Odeslané zprávy a vstupenky.</div>
          </article>
        </div>
        <div className="detail-akce-sekce-nav">
          <a href="#souhrn-objednavky">Souhrn</a>
          <a href="#transakce-objednavky">Platby a e-maily</a>
          <a href="#operace-objednavky">Operace s místy</a>
          <a href="#vstupenky-objednavky">Vstupenky</a>
        </div>
      </section>

      <div className="grafy-grid">
        <GrafSloupcovy
          nadpis="Položky objednávky"
          popis="Kolik kusů připadá na jednotlivé kategorie."
          polozky={grafPolozek}
        />
        <GrafRozlozeni
          nadpis="Stavy vstupenek"
          popis="Jak jsou rozložené kusy v této objednávce."
          polozky={grafVstupenek}
        />
      </div>

      {(objednavka.platby?.length ?? 0) > 0 ? (
        <div className="grafy-grid">
          <GrafRozlozeni
            nadpis="Stavy plateb"
            popis="Platební stopa této objednávky."
            polozky={grafPlateb}
          />
        </div>
      ) : null}

      <section className="detail-spravy-grid detail-akce-sekce" id="souhrn-objednavky">
        <article className="sprava-panel">
          <div className="sprava-panel-header">
            <div>
              <h3>Zákazník a souhrn</h3>
              <p>Zákazník, kontakt a rezervace.</p>
            </div>
          </div>
          <div className="sprava-panel-body">
            <div className="detail-grid">
              <div className="detail-pole">
                <span>Zákazník</span>
                <strong>{objednavka.jmeno_zakaznika || "Bez jména"}</strong>
              </div>
              <div className="detail-pole">
                <span>E-mail</span>
                <strong>{objednavka.email_zakaznika}</strong>
              </div>
              <div className="detail-pole">
                <span>Telefon</span>
                <strong>{objednavka.telefon_zakaznika || "Neuvedeno"}</strong>
              </div>
              <div className="detail-pole">
                <span>Vytvořeno</span>
                <strong>{formatujDatum(objednavka.vytvoreno)}</strong>
              </div>
              <div className="detail-pole">
                <span>Celkem</span>
                <strong>{formatujCastku(objednavka.celkem, objednavka.mena)}</strong>
              </div>
              <div className="detail-pole">
                <span>Rezervace do</span>
                <strong>{formatujDatum(objednavka.rezervace_do)}</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="sprava-panel">
          <div className="sprava-panel-header">
            <div>
              <h3>Chronologie</h3>
              <p>Hlavní události v čase.</p>
            </div>
          </div>
          <div className="sprava-panel-body stack-karty">
            <div className="timeline-radek">
              <strong>Objednávka vytvořena</strong>
              <span>{formatujDatum(objednavka.vytvoreno)}</span>
            </div>
            {(objednavka.platby ?? []).map((platba) => (
              <div key={platba.id} className="timeline-radek">
                <strong>
                  Platba {formatujPoskytovatelePlatby(platba.poskytovatel)} ·{" "}
                  {formatujStavPlatby(platba.stav)}
                </strong>
                <span>{formatujDatum(platba.vytvoreno)}</span>
              </div>
            ))}
            {(objednavka.emailove_zasilky ?? []).map((zasilka) => (
              <div key={zasilka.id} className="timeline-radek">
                <strong>E-mail · {zasilka.stav}</strong>
                <span>{formatujDatum(zasilka.odeslano_v ?? zasilka.vytvoreno)}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="detail-spravy-grid detail-akce-sekce" id="transakce-objednavky">
        <article className="sprava-panel">
          <div className="sprava-panel-header">
            <div>
              <h3>Položky objednávky</h3>
              <p>Prodávané položky a navázaná místa.</p>
            </div>
          </div>
          <div className="sprava-panel-body stack-karty">
            {objednavka.polozky.map((polozka) => (
              <div key={polozka.id} className="souhrn-objednavky-radek">
                <div>
                  <strong>{polozka.kategorie_vstupenky_nazev}</strong>
                  <div className="micro">{polozka.akce_nazev}</div>
                  {polozka.vybrana_mista?.length ? (
                    <div className="stack-mini">
                      {polozka.vybrana_mista.map((misto) => (
                        <div key={misto} className="micro">
                          {formatujKratkeOznaceniMista(misto)}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div>
                  <strong>{polozka.pocet} ks</strong>
                  <div className="micro">{formatujCastku(polozka.cena_celkem, objednavka.mena)}</div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="sprava-panel">
          <div className="sprava-panel-header">
            <div>
              <h3>Platby a e-maily</h3>
              <p>Platby a e-maily v jedné stopě.</p>
            </div>
          </div>
          <div className="sprava-panel-body stack-karty">
            {(objednavka.platby ?? []).map((platba) => (
              <div key={platba.id} className="souhrn-objednavky-radek">
                <div>
                  <strong>{formatujPoskytovatelePlatby(platba.poskytovatel)}</strong>
                  <div className="micro">{formatujStavPlatby(platba.stav)}</div>
                </div>
                <div>
                  <strong>{formatujCastku(platba.castka, platba.mena)}</strong>
                  <div className="micro">{formatujDatum(platba.vytvoreno)}</div>
                </div>
              </div>
            ))}
            {(objednavka.emailove_zasilky ?? []).map((zasilka) => (
              <div key={zasilka.id} className="souhrn-objednavky-radek">
                <div>
                  <strong>{zasilka.prijemce_email}</strong>
                  <div className="micro">{zasilka.predmet}</div>
                </div>
                <div>
                  <strong>{zasilka.stav}</strong>
                  <div className="micro">{formatujDatum(zasilka.odeslano_v ?? zasilka.vytvoreno)}</div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {objednavka.proforma_doklad ? (
        <section className="sprava-panel detail-akce-sekce">
          <div className="sprava-panel-header">
            <div>
              <h3>Proforma doklad</h3>
              <p>Bankovní úhrada, QR platba a ruční potvrzení přijetí.</p>
            </div>
          </div>
          <div className="sprava-panel-body detail-spravy-grid">
            <div className="detail-grid">
              <div className="detail-pole">
                <span>Číslo dokladu</span>
                <strong>{objednavka.proforma_doklad.cislo_dokladu}</strong>
              </div>
              <div className="detail-pole">
                <span>Stav</span>
                <strong>{objednavka.proforma_doklad.stav}</strong>
              </div>
              <div className="detail-pole">
                <span>Částka</span>
                <strong>{formatujCastku(objednavka.proforma_doklad.castka, objednavka.proforma_doklad.mena)}</strong>
              </div>
              <div className="detail-pole">
                <span>Variabilní symbol</span>
                <strong>{objednavka.proforma_doklad.variabilni_symbol}</strong>
              </div>
              <div className="detail-pole">
                <span>Účet</span>
                <strong>{objednavka.proforma_doklad.cislo_uctu || "Neuvedeno"}</strong>
              </div>
              <div className="detail-pole">
                <span>IBAN</span>
                <strong>{objednavka.proforma_doklad.iban || "Neuvedeno"}</strong>
              </div>
            </div>
            <div className="stack">
              {objednavka.proforma_doklad.qr_platba_svg ? (
                <div
                  className="qr-platba-box"
                  dangerouslySetInnerHTML={{ __html: objednavka.proforma_doklad.qr_platba_svg }}
                />
              ) : null}
              <div className="actions-wrap">
                <a
                  className="button ghost"
                  href={`/api_proxy/fakturace/proformy/${objednavka.proforma_doklad.cislo_dokladu}/pdf/`}
                  target="_blank"
                >
                  PDF proformy
                </a>
                <button
                  className="button ghost"
                  type="button"
                  onClick={() =>
                    void provedAkci(
                      async () => {
                        await znovuOdeslatProformu(
                          objednavka.proforma_doklad?.cislo_dokladu || "",
                          tokenSpravy,
                        );
                        const novaObjednavka = await nactiObjednavku(verejneId);
                        if (!novaObjednavka) {
                          throw new Error("Objednávku se po odeslání proformy nepodařilo znovu načíst.");
                        }
                        return novaObjednavka;
                      },
                      "Proforma byla znovu odeslána e-mailem.",
                    )
                  }
                >
                  Znovu odeslat proformu
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="detail-spravy-grid detail-akce-sekce" id="operace-objednavky">
        <article className="sprava-panel">
          <div className="sprava-panel-header">
            <div>
              <h3>Přesazení zákazníka</h3>
              <p>Ruční změna sedadla nebo místa u stolu.</p>
            </div>
          </div>
          <div className="sprava-panel-body">
            <div className="form-grid">
              <label className="pole">
                <span className="pole-label">Vstupenka</span>
                <select
                  value={presazeni.vstupenka_kod}
                  onChange={(event) =>
                    nastavPresazeni((aktualni) => ({
                      ...aktualni,
                      vstupenka_kod: event.target.value,
                    }))
                  }
                >
                  {objednavka.vstupenky.map((vstupenka) => (
                    <option key={vstupenka.kod} value={vstupenka.kod}>
                      {vstupenka.kategorie_vstupenky_nazev} ·{" "}
                      {vstupenka.oznaceni_mista || "bez místa"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="pole">
                <span className="pole-label">Nové místo</span>
                <input
                  value={presazeni.nove_misto}
                  onChange={(event) =>
                    nastavPresazeni((aktualni) => ({
                      ...aktualni,
                      nove_misto: event.target.value,
                    }))
                  }
                  placeholder="např. SD14 nebo M125"
                />
              </label>
              <div className="actions-end pole-cela">
                <button
                  className="button ghost"
                  type="button"
                  onClick={() =>
                    void provedAkci(
                      () =>
                        presaditVstupenkuObjednavky(
                          objednavka.verejne_id,
                          presazeni.vstupenka_kod,
                          presazeni.nove_misto,
                          tokenSpravy,
                        ),
                      "Vstupenka byla přesazena na nové místo.",
                    )
                  }
                >
                  Přesadit vstupenku
                </button>
              </div>
            </div>
          </div>
        </article>

        <article className="sprava-panel">
          <div className="sprava-panel-header">
            <div>
              <h3>Záměna míst</h3>
              <p>Prohození dvou míst v jedné objednávce.</p>
            </div>
          </div>
          <div className="sprava-panel-body">
            <div className="form-grid">
              <label className="pole">
                <span className="pole-label">První vstupenka</span>
                <select
                  value={prohozeni.vstupenka_kod_a}
                  onChange={(event) =>
                    nastavProhozeni((aktualni) => ({
                      ...aktualni,
                      vstupenka_kod_a: event.target.value,
                    }))
                  }
                >
                  {objednavka.vstupenky.map((vstupenka) => (
                    <option key={vstupenka.kod} value={vstupenka.kod}>
                      {vstupenka.kategorie_vstupenky_nazev} ·{" "}
                      {vstupenka.oznaceni_mista || "bez místa"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="pole">
                <span className="pole-label">Druhá vstupenka</span>
                <select
                  value={prohozeni.vstupenka_kod_b}
                  onChange={(event) =>
                    nastavProhozeni((aktualni) => ({
                      ...aktualni,
                      vstupenka_kod_b: event.target.value,
                    }))
                  }
                >
                  {objednavka.vstupenky.map((vstupenka) => (
                    <option key={vstupenka.kod} value={vstupenka.kod}>
                      {vstupenka.kategorie_vstupenky_nazev} ·{" "}
                      {vstupenka.oznaceni_mista || "bez místa"}
                    </option>
                  ))}
                </select>
              </label>
              <div className="actions-end pole-cela">
                <button
                  className="button ghost"
                  type="button"
                  onClick={() =>
                    void provedAkci(
                      () =>
                        prohoditMistaObjednavky(
                          objednavka.verejne_id,
                          prohozeni.vstupenka_kod_a,
                          prohozeni.vstupenka_kod_b,
                          tokenSpravy,
                        ),
                      "Místa byla mezi vstupenkami prohozena.",
                    )
                  }
                >
                  Prohodit místa
                </button>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="sprava-panel detail-akce-sekce" id="vstupenky-objednavky">
        <div className="sprava-panel-header">
          <div>
            <h3>Vstupenky</h3>
            <p>Vydané kusy s PDF a veřejným náhledem.</p>
          </div>
        </div>
        <div className="sprava-panel-body detail-vstupenky-grid">
          {objednavka.vstupenky.map((vstupenka) => (
            <article key={vstupenka.id} className="vstupenka-karta">
              <div>
                <strong>{vstupenka.kategorie_vstupenky_nazev}</strong>
                <div className="micro">{vstupenka.akce_nazev}</div>
                {vstupenka.oznaceni_mista ? (
                  <div className="micro">
                    {formatujKratkeOznaceniMista(vstupenka.oznaceni_mista)}
                  </div>
                ) : null}
              </div>
              <div className="vstupenka-kod">{vstupenka.kod}</div>
              <span className="badge">{formatujStavVstupenky(vstupenka.stav)}</span>
              <div className="micro">
                {vstupenka.dorucena
                  ? `Doručeno ${formatujDatum(vstupenka.dorucena)}`
                  : "Zatím nedoručeno"}
              </div>
              <div className="actions-wrap">
                <a className="button ghost" href={`/vstupenka/${vstupenka.kod}`} target="_blank">
                  Veřejná vstupenka
                </a>
                <a
                  className="button ghost"
                  href={`/api_proxy/vstupenky/${vstupenka.kod}/pdf/`}
                  target="_blank"
                >
                  PDF
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
