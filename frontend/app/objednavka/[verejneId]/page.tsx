import { notFound } from "next/navigation";

import { Hlavicka } from "@/components/hlavicka";
import { Paticka } from "@/components/paticka";
import { DoruceniKlient } from "@/components/doruceni-klient";
import { PlatbaKlient } from "@/components/platba-klient";
import { nactiObjednavku } from "@/lib/api";
import {
  formatujCastku,
  formatujDatum,
  formatujStavObjednavky,
  formatujStavVstupenky,
  formatujZpusobUhrady,
} from "@/lib/formatovani";
import { formatujKratkeOznaceniMista } from "@/lib/plan-salu";

type DetailObjednavkyPageProps = {
  params: Promise<{
    verejneId: string;
  }>;
};

export default async function DetailObjednavkyPage({ params }: DetailObjednavkyPageProps) {
  const { verejneId } = await params;
  const objednavka = await nactiObjednavku(verejneId);

  if (!objednavka) {
    notFound();
  }

  const rezervaceAktivni = objednavka.je_rezervace_aktivni ?? false;
  const rezervaceDo = objednavka.rezervace_do
    ? formatujDatum(objednavka.rezervace_do)
    : "Neuvedeno";
  const jeZaplaceno = objednavka.stav === "zaplaceno";
  const proforma = objednavka.proforma_doklad;
  const posledniEmail = objednavka.emailove_zasilky?.[0] ?? null;

  return (
    <main className="verejny-shell">
      <Hlavicka />

      <div className="verejny-page">
        <section className="confirmation-hero">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">Potvrzení objednávky</span>
              <h1>{rezervaceAktivni ? "Objednávka je připravená." : "Rezervace už vypršela."}</h1>
              <p>
                {rezervaceAktivni
                  ? "Shrnutí objednávky, stav platby i doručení máš na jednom místě. Nemusíš nic složitě dohledávat."
                  : "Čas pro dokončení objednávky už uběhl. Pokud chceš vstupenky znovu, vrať se prosím do programu."}
              </p>
            </div>
          </div>

          <div className="checkout-stepper" aria-label="Stav objednávky">
            <div className="checkout-step checkout-step-complete">
              <span>1</span>
              <div>
                <strong>Výběr</strong>
                <small>Hotovo</small>
              </div>
            </div>
            <div className="checkout-step checkout-step-complete">
              <span>2</span>
              <div>
                <strong>Údaje</strong>
                <small>Hotovo</small>
              </div>
            </div>
            <div className="checkout-step checkout-step-active">
              <span>3</span>
              <div>
                <strong>Potvrzení</strong>
                <small>{formatujStavObjednavky(objednavka.stav)}</small>
              </div>
            </div>
          </div>
        </section>

        <section className="verejny-section">
          <div className="confirmation-grid">
            <article className="verejny-surface">
              <span className="section-eyebrow">Shrnutí</span>
              <h2>Detaily objednávky</h2>
              <dl className="event-detail-list">
                <div>
                  <dt>E-mail</dt>
                  <dd>{objednavka.email_zakaznika}</dd>
                </div>
                <div>
                  <dt>Vytvořeno</dt>
                  <dd>{formatujDatum(objednavka.vytvoreno)}</dd>
                </div>
                <div>
                  <dt>Způsob úhrady</dt>
                  <dd>{formatujZpusobUhrady(objednavka.zpusob_uhrady)}</dd>
                </div>
                <div>
                  <dt>Rezervace do</dt>
                  <dd>{rezervaceDo}</dd>
                </div>
              </dl>
            </article>

            <article className="verejny-surface">
              <span className="section-eyebrow">Další krok</span>
              <h2>Platba a doručení</h2>
              <PlatbaKlient
                verejneId={objednavka.verejne_id}
                rezervaceAktivni={rezervaceAktivni}
                jeZaplaceno={jeZaplaceno}
                zpusobUhrady={objednavka.zpusob_uhrady}
              />

              <DoruceniKlient
                verejneId={objednavka.verejne_id}
                jeDoruceno={Boolean(objednavka.vstupenky.some((vstupenka) => vstupenka.dorucena))}
                jeZaplaceno={jeZaplaceno}
              />

              {posledniEmail ? (
                <div className={posledniEmail.stav === "odeslano" ? "public-alert public-alert-success" : "public-alert public-alert-error"}>
                  {posledniEmail.stav === "odeslano"
                    ? `Vstupenky byly odeslány na ${posledniEmail.prijemce_email}.`
                    : "Poslední pokus o doručení vstupenek skončil chybou."}
                </div>
              ) : null}
            </article>
          </div>
        </section>

        <section className="verejny-section">
          <div className="confirmation-grid">
            <article className="verejny-surface">
              <span className="section-eyebrow">Položky</span>
              <h2>Vybrané vstupenky</h2>
              <div className="summary-list">
                {objednavka.polozky.map((polozka) => (
                  <div key={polozka.id} className="summary-row">
                    <div>
                      <strong>{polozka.kategorie_vstupenky_nazev}</strong>
                      <p>
                        {polozka.pocet} × {formatujCastku(polozka.cena_za_kus, objednavka.mena)}
                      </p>
                      {polozka.vybrana_mista?.length ? (
                        <div className="summary-tags">
                          {polozka.vybrana_mista.map((misto) => (
                            <span key={misto}>
                              {formatujKratkeOznaceniMista(misto)}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <strong>{formatujCastku(polozka.cena_celkem, objednavka.mena)}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="verejny-surface">
              <span className="section-eyebrow">Vstupenky</span>
              <h2>Doručení a přístup</h2>
              <div className="ticket-state-list">
                {objednavka.vstupenky.map((vstupenka) => (
                  <div key={vstupenka.id} className="ticket-state-row">
                    <div>
                      <strong>{vstupenka.kategorie_vstupenky_nazev}</strong>
                      <p>{vstupenka.akce_nazev}</p>
                      {vstupenka.oznaceni_mista ? (
                        <span className="summary-tags single">
                          {formatujKratkeOznaceniMista(vstupenka.oznaceni_mista)}
                        </span>
                      ) : null}
                    </div>
                    <div className="ticket-state-meta">
                      <span className="event-status-badge subtle">{formatujStavVstupenky(vstupenka.stav)}</span>
                      <a className="text-link" href={`/vstupenka/${vstupenka.kod}`}>
                        Otevřít vstupenku
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {objednavka.zpusob_uhrady === "bankovni_prevod" && proforma ? (
                <div className="proforma-box">
                  <strong>Proforma k úhradě</strong>
                  <p>
                    Variabilní symbol <strong>{proforma.variabilni_symbol}</strong>, splatnost{" "}
                    <strong>{formatujDatum(proforma.datum_splatnosti)}</strong>.
                  </p>
                  <div className="summary-tags">
                    <span>
                      {formatujCastku(proforma.castka, proforma.mena)}
                    </span>
                    <span>{proforma.cislo_uctu || "Účet bude doplněn"}</span>
                  </div>
                  <a
                    className="text-link"
                    href={`/api_proxy/fakturace/proformy/objednavka/${objednavka.verejne_id}/pdf/`}
                    target="_blank"
                  >
                    Otevřít PDF proformy
                  </a>
                </div>
              ) : null}
            </article>
          </div>
        </section>
      </div>

      <Paticka />
    </main>
  );
}
