"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconClockHour4, IconReceipt2, IconTicket } from "@tabler/icons-react";

import { PlanSalu } from "@/components/plan-salu";
import type { Akce, KategorieVstupenky } from "@/lib/api";
import { vytvorObjednavku } from "@/lib/api";
import { formatujCastku } from "@/lib/formatovani";
import { formatujKratkeOznaceniMista } from "@/lib/plan-salu";

type Vlastnosti = {
  akce: Akce;
  kategorieVstupenek: KategorieVstupenky[];
};

type FormularObjednavky = {
  email_zakaznika: string;
  jmeno_zakaznika: string;
  telefon_zakaznika: string;
  zpusob_uhrady: "online" | "bankovni_prevod";
};

const vychoziFormular: FormularObjednavky = {
  email_zakaznika: "",
  jmeno_zakaznika: "",
  telefon_zakaznika: "",
  zpusob_uhrady: "online",
};

function ziskejZonuMista(schema: Akce["schema_sezeni"], kod: string) {
  if (!schema) {
    return "";
  }

  if (schema.podlazi?.length) {
    for (const podlazi of schema.podlazi) {
      const bunka = podlazi.mrizka.bunky.find((polozka) => polozka.kod === kod);
      if (bunka?.zona) {
        return bunka.zona;
      }
    }
  }

  if (schema.mrizka?.bunky?.length) {
    return schema.mrizka.bunky.find((polozka) => polozka.kod === kod)?.zona ?? "";
  }

  for (const rada of schema.rady ?? []) {
    if (rada.useky?.length) {
      for (const usek of rada.useky) {
        const kodPrefix = usek.kod_prefix ?? "M";
        if (usek.mista.some((cislo) => `${kodPrefix}${cislo}` === kod)) {
          return usek.zona ?? "";
        }
      }
      continue;
    }

    for (const cislo of rada.levy_pristavek ?? []) {
      if (`R${rada.rada}-L${cislo}` === kod) {
        return rada.zona_levy ?? "";
      }
    }
    for (const cislo of rada.stred ?? []) {
      if (`R${rada.rada}-S${cislo}` === kod) {
        return "stred";
      }
    }
    for (const cislo of rada.pravy_pristavek ?? []) {
      if (`R${rada.rada}-P${cislo}` === kod) {
        return rada.zona_pravy ?? "";
      }
    }
  }

  return "";
}

function normalizujZpravuChyby(chyba: unknown) {
  if (!(chyba instanceof Error)) {
    return "Objednávku se nepodařilo vytvořit.";
  }

  const zprava = chyba.message.trim();

  try {
    const data = JSON.parse(zprava) as Record<string, unknown>;
    const chyby = Object.values(data)
      .flatMap((hodnota) =>
        Array.isArray(hodnota)
          ? hodnota.map(String)
          : typeof hodnota === "string"
            ? [hodnota]
            : [],
      )
      .filter(Boolean);

    if (chyby.length) {
      return chyby.join(" ");
    }
  } catch {
    return zprava || "Objednávku se nepodařilo vytvořit.";
  }

  return zprava || "Objednávku se nepodařilo vytvořit.";
}

export function ObjednavkaKlient({ akce, kategorieVstupenek }: Vlastnosti) {
  const router = useRouter();
  const aktivniKategorie = useMemo(
    () => kategorieVstupenek.filter((kategorie) => kategorie.je_aktivni),
    [kategorieVstupenek],
  );
  const [mnozstvi, nastavMnozstvi] = useState<Record<number, number>>({});
  const [formular, nastavFormular] = useState<FormularObjednavky>(vychoziFormular);
  const [vybranaKategorieId, nastavVybranouKategoriiId] = useState(
    aktivniKategorie[0] ? String(aktivniKategorie[0].id) : "",
  );
  const [vybranaMista, nastavVybranaMista] = useState<string[]>([]);
  const [odesilaSe, nastavOdesilani] = useState(false);
  const [chyba, nastavChybu] = useState("");

  const maSchemaMist = Boolean(
    akce.schema_sezeni?.rady?.length ||
      akce.schema_sezeni?.mrizka ||
      akce.schema_sezeni?.podlazi?.length,
  );

  const aktivniKategorieMista = useMemo(
    () => aktivniKategorie.find((kategorie) => String(kategorie.id) === vybranaKategorieId) ?? aktivniKategorie[0],
    [aktivniKategorie, vybranaKategorieId],
  );

  const polozkyObjednavky = useMemo(() => {
    if (maSchemaMist && aktivniKategorieMista) {
      return vybranaMista.length
        ? [
            {
              ...aktivniKategorieMista,
              pocet: vybranaMista.length,
              vybrana_mista: vybranaMista,
            },
          ]
        : [];
    }

    return aktivniKategorie
      .map((kategorie) => ({
        ...kategorie,
        pocet: mnozstvi[kategorie.id] ?? 0,
      }))
      .filter((kategorie) => kategorie.pocet > 0);
  }, [aktivniKategorie, aktivniKategorieMista, maSchemaMist, mnozstvi, vybranaMista]);

  const celkemKusu = polozkyObjednavky.reduce((soucet, polozka) => soucet + polozka.pocet, 0);
  const celkemCena = polozkyObjednavky.reduce(
    (soucet, polozka) => soucet + Number(polozka.cena) * polozka.pocet,
    0,
  );
  const mena = polozkyObjednavky[0]?.mena ?? aktivniKategorie[0]?.mena ?? "CZK";
  const maFluidniRozlozeni = maSchemaMist;

  function zmenMnozstvi(kategorieId: number, delta: number) {
    nastavMnozstvi((aktualni) => {
      const dalsi = Math.max(0, (aktualni[kategorieId] ?? 0) + delta);
      return {
        ...aktualni,
        [kategorieId]: dalsi,
      };
    });
  }

  function prepniMisto(kod: string) {
    if (!aktivniKategorieMista) {
      return;
    }

    const povoleneZony = aktivniKategorieMista.povolene_zony ?? [];
    if (povoleneZony.length) {
      const zonaMista = ziskejZonuMista(akce.schema_sezeni, kod);
      if (zonaMista && !povoleneZony.includes(zonaMista)) {
        nastavChybu("Vybrané místo nespadá do povolené zóny pro tuto kategorii.");
        return;
      }
    }

    nastavChybu("");
    nastavVybranaMista((aktualni) =>
      aktualni.includes(kod)
        ? aktualni.filter((misto) => misto !== kod)
        : [...aktualni, kod],
    );
  }

  async function odesliObjednavku(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    nastavChybu("");

    if (!polozkyObjednavky.length) {
      nastavChybu(
        maSchemaMist
          ? "Vyber alespoň jedno konkrétní místo."
          : "Vyber alespoň jednu vstupenku.",
      );
      return;
    }

    nastavOdesilani(true);

    try {
      const objednavka = await vytvorObjednavku({
        ...formular,
        polozky: polozkyObjednavky.map((polozka) => ({
          kategorie_vstupenky: polozka.id,
          pocet: polozka.pocet,
          vybrana_mista: "vybrana_mista" in polozka ? polozka.vybrana_mista : undefined,
        })),
      });

      nastavFormular(vychoziFormular);
      nastavMnozstvi({});
      nastavVybranaMista([]);
      router.push(`/objednavka/${objednavka.verejne_id}`);
    } catch (error) {
      nastavChybu(normalizujZpravuChyby(error));
    } finally {
      nastavOdesilani(false);
    }
  }

  return (
    <div className="checkout-shell">
      <div className="checkout-stepper" aria-label="Průběh objednávky">
        <div className="checkout-step checkout-step-active">
          <span>1</span>
          <div>
            <strong>Výběr</strong>
            <small>Vstupenky nebo místa</small>
          </div>
        </div>
        <div className="checkout-step checkout-step-active">
          <span>2</span>
          <div>
            <strong>Údaje</strong>
            <small>Kontakt a úhrada</small>
          </div>
        </div>
        <div className="checkout-step">
          <span>3</span>
          <div>
            <strong>Potvrzení</strong>
            <small>Shrnutí objednávky</small>
          </div>
        </div>
      </div>

      {maFluidniRozlozeni ? (
        <div className="checkout-selection-bar" aria-label="Průběžný stav výběru">
          <div className="checkout-selection-pill">
            <div className="checkout-selection-pill-heading">
              <IconTicket aria-hidden="true" size={16} stroke={1.8} />
              <strong>{celkemKusu}</strong>
            </div>
            <span>{celkemKusu === 1 ? "vybrané místo" : "vybraných míst / vstupenek"}</span>
          </div>
          <div className="checkout-selection-pill">
            <div className="checkout-selection-pill-heading">
              <IconReceipt2 aria-hidden="true" size={16} stroke={1.8} />
              <strong>{formatujCastku(String(celkemCena), mena)}</strong>
            </div>
            <span>průběžný součet</span>
          </div>
          <div className="checkout-selection-pill">
            <div className="checkout-selection-pill-heading">
              <IconClockHour4 aria-hidden="true" size={16} stroke={1.8} />
              <strong>{akce.rezervace_platnost_minuty} min</strong>
            </div>
            <span>čas na dokončení</span>
          </div>
        </div>
      ) : null}

      <form
        className={`checkout-layout${maFluidniRozlozeni ? " checkout-layout-fluid" : ""}`}
        onSubmit={odesliObjednavku}
      >
        <div className="checkout-main">
          <section className="verejny-surface verejny-surface-spacious">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">Krok 1</span>
                <h3>Vyber vstupenky</h3>
                <p>
                  {maSchemaMist
                    ? "Vyber kategorii a označ konkrétní místa v sále. Obsazená místa jsou nepřístupná."
                    : "Zvol počet vstupenek. Cena i mezisoučet se průběžně přepočítají."}
                </p>
              </div>
            </div>

            {maSchemaMist && aktivniKategorieMista ? (
              <div className="checkout-seat-flow">
                <div className="checkout-category-strip">
                  <label className="field field-inline">
                    <span>Kategorie</span>
                    <select
                      value={vybranaKategorieId}
                      onChange={(event) => {
                        nastavVybranouKategoriiId(event.target.value);
                        nastavVybranaMista([]);
                        nastavChybu("");
                      }}
                    >
                      {aktivniKategorie.map((kategorie) => (
                        <option key={kategorie.id} value={String(kategorie.id)}>
                          {kategorie.nazev} · {formatujCastku(kategorie.cena, kategorie.mena)}
                        </option>
                      ))}
                    </select>
                  </label>

                  {(aktivniKategorieMista.povolene_zony ?? []).length ? (
                    <div className="inline-note">
                      Dostupné zóny: {aktivniKategorieMista.povolene_zony?.join(", ")}
                    </div>
                  ) : (
                    <div className="inline-note">Vybrat můžeš libovolné volné místo.</div>
                  )}
                </div>

                <div className="seat-legend">
                  <span><i className="seat-dot seat-dot-free" /> Volné</span>
                  <span><i className="seat-dot seat-dot-selected" /> Vybrané</span>
                  <span><i className="seat-dot seat-dot-reserved" /> V rezervaci</span>
                  <span><i className="seat-dot seat-dot-sold" /> Prodáno</span>
                </div>

                <div className="seat-plan-frame">
                  <PlanSalu
                    schema={akce.schema_sezeni}
                    stavyMist={akce.stavy_mist}
                    vybranaMista={vybranaMista}
                    priPrepnutiMista={prepniMisto}
                  />
                </div>
              </div>
            ) : (
              <div className="ticket-list">
                {aktivniKategorie.map((kategorie) => (
                  <article key={kategorie.id} className="ticket-card">
                    <div className="ticket-card-copy">
                      <div className="ticket-card-header">
                        <strong>{kategorie.nazev}</strong>
                        <span>{formatujCastku(kategorie.cena, kategorie.mena)}</span>
                      </div>
                      <p>{kategorie.popis || "Vstupenka na kulturní akci s jednoduchým online nákupem."}</p>
                      <small>Kapacita {kategorie.kapacita} ks</small>
                    </div>
                    <div className="ticket-counter" aria-label={`Počet pro ${kategorie.nazev}`}>
                      <button type="button" onClick={() => zmenMnozstvi(kategorie.id, -1)}>
                        -
                      </button>
                      <span>{mnozstvi[kategorie.id] ?? 0}</span>
                      <button type="button" onClick={() => zmenMnozstvi(kategorie.id, 1)}>
                        +
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="verejny-surface verejny-surface-spacious">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">Krok 2</span>
                <h3>Vyplň kontaktní údaje</h3>
                <p>
                  Bez registrace. Potvrzení objednávky a další instrukce pošleme na uvedený e-mail.
                </p>
              </div>
            </div>

            <div className="checkout-form-grid">
              <label className="field">
                <span>E-mail</span>
                <input
                  required
                  type="email"
                  value={formular.email_zakaznika}
                  onChange={(event) =>
                    nastavFormular((aktualni) => ({
                      ...aktualni,
                      email_zakaznika: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Jméno a příjmení</span>
                <input
                  required
                  type="text"
                  value={formular.jmeno_zakaznika}
                  onChange={(event) =>
                    nastavFormular((aktualni) => ({
                      ...aktualni,
                      jmeno_zakaznika: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="field field-wide">
                <span>Telefon</span>
                <input
                  type="tel"
                  value={formular.telefon_zakaznika}
                  onChange={(event) =>
                    nastavFormular((aktualni) => ({
                      ...aktualni,
                      telefon_zakaznika: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="payment-choice">
              <button
                type="button"
                className={`choice-card${formular.zpusob_uhrady === "online" ? " active" : ""}`}
                onClick={() =>
                  nastavFormular((aktualni) => ({ ...aktualni, zpusob_uhrady: "online" }))
                }
              >
                <strong>Online platba</strong>
                <span>Rychlé potvrzení a okamžité doručení vstupenek.</span>
              </button>
              <button
                type="button"
                className={`choice-card${formular.zpusob_uhrady === "bankovni_prevod" ? " active" : ""}`}
                onClick={() =>
                  nastavFormular((aktualni) => ({
                    ...aktualni,
                    zpusob_uhrady: "bankovni_prevod",
                  }))
                }
              >
                <strong>Bankovní převod</strong>
                <span>Obdržíš proformu s QR platbou a pokyny k úhradě.</span>
              </button>
            </div>

            {chyba ? <div className="public-alert public-alert-error">{chyba}</div> : null}
          </section>

          {maFluidniRozlozeni ? (
            <section className="verejny-surface verejny-surface-spacious checkout-summary checkout-summary-inline">
              <div className="section-heading">
                <div>
                  <span className="section-eyebrow">Shrnutí</span>
                  <h3>Tvoje objednávka</h3>
                  <p>Nejdřív vyber místa a údaje, potvrzení objednávky je až pod celým výběrem.</p>
                </div>
              </div>

              <div className="summary-event-card">
                <strong>{akce.nazev}</strong>
                <span>{akce.misto_konani_nazev}</span>
              </div>

              <div className="summary-list">
                {polozkyObjednavky.length ? (
                  polozkyObjednavky.map((polozka) => (
                    <div key={polozka.id} className="summary-row">
                      <div>
                        <strong>{polozka.nazev}</strong>
                        <small>
                          {polozka.pocet} × {formatujCastku(polozka.cena, polozka.mena)}
                        </small>
                        {"vybrana_mista" in polozka && polozka.vybrana_mista?.length ? (
                          <div className="summary-tags">
                            {polozka.vybrana_mista.map((misto) => (
                              <span key={misto}>{formatujKratkeOznaceniMista(misto)}</span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <strong>{formatujCastku(String(Number(polozka.cena) * polozka.pocet), polozka.mena)}</strong>
                    </div>
                  ))
                ) : (
                  <div className="empty-inline-state">
                    Zatím nemáš vybranou žádnou vstupenku.
                  </div>
                )}
              </div>

              <div className="summary-total">
                <span>Celkem</span>
                <strong>{formatujCastku(String(celkemCena), mena)}</strong>
              </div>

              <div className="summary-note-list">
                <div>
                  <strong>{celkemKusu}</strong>
                  <span>{celkemKusu === 1 ? "položka" : "položek"} v objednávce</span>
                </div>
                <div>
                  <strong>{akce.rezervace_platnost_minuty} min</strong>
                  <span>čas na dokončení objednávky</span>
                </div>
              </div>

              <button
                className="kulturni-button kulturni-button-primary checkout-submit"
                disabled={odesilaSe}
                type="submit"
              >
                {odesilaSe ? "Zakládám objednávku..." : "Pokračovat k potvrzení"}
              </button>
            </section>
          ) : null}
        </div>

        {!maFluidniRozlozeni ? (
        <aside className="checkout-summary">
          <div className="verejny-surface verejny-surface-sticky">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">Shrnutí</span>
                <h3>Tvoje objednávka</h3>
                <p>Cena i vybrané položky zůstávají stále na očích.</p>
              </div>
            </div>

            <div className="summary-event-card">
              <strong>{akce.nazev}</strong>
              <span>{akce.misto_konani_nazev}</span>
            </div>

            <div className="summary-list">
              {polozkyObjednavky.length ? (
                polozkyObjednavky.map((polozka) => (
                  <div key={polozka.id} className="summary-row">
                    <div>
                      <strong>{polozka.nazev}</strong>
                      <small>
                        {polozka.pocet} × {formatujCastku(polozka.cena, polozka.mena)}
                      </small>
                      {"vybrana_mista" in polozka && polozka.vybrana_mista?.length ? (
                        <div className="summary-tags">
                          {polozka.vybrana_mista.map((misto) => (
                            <span key={misto}>{formatujKratkeOznaceniMista(misto)}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <strong>{formatujCastku(String(Number(polozka.cena) * polozka.pocet), polozka.mena)}</strong>
                  </div>
                ))
              ) : (
                <div className="empty-inline-state">
                  Zatím nemáš vybranou žádnou vstupenku.
                </div>
              )}
            </div>

            <div className="summary-total">
              <span>Celkem</span>
              <strong>{formatujCastku(String(celkemCena), mena)}</strong>
            </div>

            <div className="summary-note-list">
              <div>
                <strong>{celkemKusu}</strong>
                <span>{celkemKusu === 1 ? "položka" : "položek"} v objednávce</span>
              </div>
              <div>
                <strong>{akce.rezervace_platnost_minuty} min</strong>
                <span>čas na dokončení objednávky</span>
              </div>
            </div>

            <button className="kulturni-button kulturni-button-primary checkout-submit" disabled={odesilaSe} type="submit">
              {odesilaSe ? "Zakládám objednávku..." : "Pokračovat k potvrzení"}
            </button>
          </div>
        </aside>
        ) : null}
      </form>
    </div>
  );
}
