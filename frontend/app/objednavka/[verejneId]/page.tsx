import { notFound } from "next/navigation";

import { Hlavicka } from "@/components/hlavicka";
import { PlatbaKlient } from "@/components/platba-klient";
import { nactiObjednavku } from "@/lib/api";
import { formatujCastku, formatujDatum } from "@/lib/formatovani";
import { formatujKratkeOznaceniMista } from "@/lib/plan-salu";

type DetailObjednavkyPageProps = {
  params: Promise<{
    verejneId: string;
  }>;
};

function formatujStavObjednavky(stav: string) {
  const mapovani: Record<string, string> = {
    navrh: "Navrh",
    ceka_na_platbu: "Ceka na platbu",
    zaplaceno: "Zaplaceno",
    zruseno: "Zruseno",
    vraceno: "Vraceno",
  };

  return mapovani[stav] ?? stav;
}

function formatujStavVstupenky(stav: string) {
  const mapovani: Record<string, string> = {
    rezervovana: "Rezervovana",
    platna: "Platna",
    odbavena: "Odbavena",
    zrusena: "Zrusena",
    vracena: "Vracena",
  };

  return mapovani[stav] ?? stav;
}

export default async function DetailObjednavkyPage({ params }: DetailObjednavkyPageProps) {
  const { verejneId } = await params;
  const objednavka = await nactiObjednavku(verejneId);

  if (!objednavka) {
    notFound();
  }

  const rezervaceAktivni = objednavka.je_rezervace_aktivni ?? false;
  const rezervaceDo = objednavka.rezervace_do ? formatujDatum(objednavka.rezervace_do) : "Neuvedeno";
  const jeZaplaceno = objednavka.stav === "zaplaceno";
  const posledniEmail = objednavka.emailove_zasilky?.[0] ?? null;
  const proforma = objednavka.proforma_doklad;

  return (
    <main className="page-shell">
      <Hlavicka />

      <div className="stranka-verejna">
        <div className="obsah">
          <section className="sekce">
            <div className="objednavka-stav">
              <div className="objednavka-stav-copy">
                <div className="hero-meta">
                  <span className="badge akcent">Objednavka {objednavka.verejne_id}</span>
                  <span className="badge">{formatujStavObjednavky(objednavka.stav)}</span>
                </div>
                <h1>{rezervaceAktivni ? "Objednavka byla ulozena." : "Rezervace uz vyprsela."}</h1>
                <p>
                  {rezervaceAktivni
                    ? "Mas rezervovana mista a system uz k nim pripravil konkretni vstupenky. Dalsi krok bude navazani platebni brany, po kterem se z rezervace stane platna vstupenka k doruceni."
                    : "Casovy limit pro uhradu uz skoncil. Tohle misto se muze znovu vratit do prodeje a vstupenky byly automaticky zneplatneny."}
                </p>
              </div>

              <div className="panel">
                <h3>Zakladni souhrn</h3>
                <div className="rozpis">
                  <div className="rozpis-radek">
                    <span>E-mail</span>
                    <strong>{objednavka.email_zakaznika}</strong>
                  </div>
                  <div className="rozpis-radek">
                    <span>Vytvoreno</span>
                    <strong>{formatujDatum(objednavka.vytvoreno)}</strong>
                  </div>
                  <div className="rozpis-radek">
                    <span>Celkem</span>
                    <strong>{formatujCastku(objednavka.celkem, objednavka.mena)}</strong>
                  </div>
                  <div className="rozpis-radek">
                    <span>Rezervace do</span>
                    <strong>{rezervaceDo}</strong>
                  </div>
                <div className="rozpis-radek">
                  <span>Úhrada</span>
                  <strong>{objednavka.zpusob_uhrady === "bankovni_prevod" ? "Bankovní převod" : "Online platba"}</strong>
                </div>
                <div className="rozpis-radek">
                  <span>Vstupenky</span>
                  <strong>{objednavka.vstupenky.length}</strong>
                </div>
                </div>
              </div>
            </div>
          </section>

          <section className="objednavka-grid">
            <div className="sprava-panel">
              <div className="sprava-panel-header">
                <div>
                  <h3>Polozky objednavky</h3>
                  <p>Prehled vybranych kategorii a poctu kusu.</p>
                </div>
              </div>
              <div className="sprava-panel-body stack-karty">
                {objednavka.polozky.map((polozka) => (
                  <div key={polozka.id} className="souhrn-objednavky-radek">
                    <div>
                      <strong>{polozka.kategorie_vstupenky_nazev}</strong>
                      <div className="micro">
                        {polozka.pocet} x {formatujCastku(polozka.cena_za_kus, objednavka.mena)}
                      </div>
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
                    <strong>{formatujCastku(polozka.cena_celkem, objednavka.mena)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="sprava-panel">
              <div className="sprava-panel-header">
                <div>
                  <h3>Platba a vstupenky</h3>
                  <p>
                    Dokud neni zaplaceno, vstupenky zustavaji rezervovane. Po potvrzeni platby se
                    zmeni na platne.
                  </p>
                </div>
              </div>
              <div className="sprava-panel-body stack">
                <PlatbaKlient
                  verejneId={objednavka.verejne_id}
                  rezervaceAktivni={rezervaceAktivni}
                  jeZaplaceno={jeZaplaceno}
                  zpusobUhrady={objednavka.zpusob_uhrady}
                />

                {objednavka.zpusob_uhrady === "bankovni_prevod" && proforma ? (
                  <div className="sprava-panel">
                    <div className="sprava-panel-header">
                      <div>
                        <h3>Proforma k úhradě</h3>
                        <p>Naskenuj QR, nebo zadej údaje ručně v bankovnictví.</p>
                      </div>
                    </div>
                    <div className="sprava-panel-body stack">
                      {proforma.qr_platba_svg ? (
                        <div
                          className="qr-platba-box"
                          dangerouslySetInnerHTML={{ __html: proforma.qr_platba_svg }}
                        />
                      ) : null}
                      <div className="rozpis">
                        <div className="rozpis-radek">
                          <span>Číslo dokladu</span>
                          <strong>{proforma.cislo_dokladu}</strong>
                        </div>
                        <div className="rozpis-radek">
                          <span>Částka</span>
                          <strong>{formatujCastku(proforma.castka, proforma.mena)}</strong>
                        </div>
                        <div className="rozpis-radek">
                          <span>Účet</span>
                          <strong>{proforma.cislo_uctu || "Neuvedeno"}</strong>
                        </div>
                        <div className="rozpis-radek">
                          <span>IBAN</span>
                          <strong>{proforma.iban || "Neuvedeno"}</strong>
                        </div>
                        <div className="rozpis-radek">
                          <span>Variabilní symbol</span>
                          <strong>{proforma.variabilni_symbol}</strong>
                        </div>
                        <div className="rozpis-radek">
                          <span>Splatnost</span>
                          <strong>{formatujDatum(proforma.datum_splatnosti)}</strong>
                        </div>
                      </div>
                      <div className="actions-wrap">
                        <a
                          className="button ghost"
                          href={`/api_proxy/fakturace/proformy/objednavka/${objednavka.verejne_id}/pdf/`}
                          target="_blank"
                        >
                          Otevřít PDF proformy
                        </a>
                      </div>
                    </div>
                  </div>
                ) : null}

                {jeZaplaceno ? (
                  posledniEmail ? (
                    <div className={posledniEmail.stav === "odeslano" ? "hlaseni uspech" : "hlaseni chyba"}>
                      {posledniEmail.stav === "odeslano"
                        ? `Vstupenky byly odeslany na ${posledniEmail.prijemce_email}${posledniEmail.odeslano_v ? ` (${formatujDatum(posledniEmail.odeslano_v)})` : ""}.`
                        : "Posledni pokus o doruceni vstupenek skoncil chybou."}
                    </div>
                  ) : (
                    <div className="tlumeny">
                      Vstupenky zatim nejsou e-mailem dorucene. Obsluha je muze odeslat ze spravy.
                    </div>
                  )
                ) : null}

                {(objednavka.platby?.length ?? 0) > 0 ? (
                  <div className="stack-karty">
                    {objednavka.platby?.map((platba) => (
                      <div key={platba.id} className="souhrn-objednavky-radek">
                        <div>
                          <strong>{platba.poskytovatel.toUpperCase()}</strong>
                          <div className="micro">{formatujDatum(platba.vytvoreno)}</div>
                        </div>
                        <strong>{formatujCastku(platba.castka, platba.mena)}</strong>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="stack-karty">
                {objednavka.vstupenky.map((vstupenka) => (
                  <article key={vstupenka.id} className="vstupenka-karta">
                    <div>
                      <strong>{vstupenka.kategorie_vstupenky_nazev}</strong>
                      <div className="micro">{vstupenka.akce_nazev}</div>
                      {vstupenka.oznaceni_mista ? (
                        <div className="micro">{formatujKratkeOznaceniMista(vstupenka.oznaceni_mista)}</div>
                      ) : null}
                    </div>
                    <div className="vstupenka-kod">{vstupenka.kod}</div>
                    <span className="badge">{formatujStavVstupenky(vstupenka.stav)}</span>
                    <div className="vstupenka-akce">
                      <a className="button ghost" href={`/vstupenka/${vstupenka.kod}`}>
                        Otevrit vstupenku
                      </a>
                      <a className="button ghost" href={`/api_proxy/vstupenky/${vstupenka.kod}/pdf/`} target="_blank">
                        PDF
                      </a>
                      <div className="micro">
                        {vstupenka.dorucena ? `Doruceno ${formatujDatum(vstupenka.dorucena)}` : "Zatim nedoruceno"}
                      </div>
                    </div>
                  </article>
                ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
