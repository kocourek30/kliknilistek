"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { PlanSalu } from "@/components/plan-salu";
import type { Akce, KategorieVstupenky } from "@/lib/api";
import { vytvorObjednavku } from "@/lib/api";
import { formatujCastku } from "@/lib/formatovani";
import { popisMistaZeSchema } from "@/lib/plan-salu";

type ObjednavkaKlientProps = {
  akce: Akce;
  kategorieVstupenek: KategorieVstupenky[];
};

type PoctyKategorii = Record<number, number>;

const prazdneKontakty = {
  email_zakaznika: "",
  jmeno_zakaznika: "",
  telefon_zakaznika: "",
  zpusob_uhrady: "online",
};

export function ObjednavkaKlient({ akce, kategorieVstupenek }: ObjednavkaKlientProps) {
  const router = useRouter();
  const [pocty, setPocty] = useState<PoctyKategorii>({});
  const [kontakty, setKontakty] = useState(prazdneKontakty);
  const [odesilaSe, setOdesilaSe] = useState(false);
  const [chyba, setChyba] = useState("");
  const [vybranaKategorieId, nastavVybranouKategorii] = useState(
    kategorieVstupenek[0] ? String(kategorieVstupenek[0].id) : "",
  );
  const [vybranaMista, nastavVybranaMista] = useState<string[]>([]);

  const jeMistenkovyVyber = Boolean(akce.schema_sezeni?.rady?.length || akce.schema_sezeni?.mrizka || akce.schema_sezeni?.podlazi?.length);
  const vybranaKategorie = kategorieVstupenek.find((kategorie) => String(kategorie.id) === vybranaKategorieId) ?? kategorieVstupenek[0];
  const mapaMist = useMemo(
    () => new Map((akce.stavy_mist ?? []).map((misto) => [misto.kod, misto])),
    [akce.stavy_mist],
  );

  const vybranePolozky = useMemo(() => {
    if (jeMistenkovyVyber && vybranaKategorie) {
      return vybranaMista.length
        ? [
            {
              ...vybranaKategorie,
              pocet: vybranaMista.length,
              vybrana_mista: vybranaMista,
            },
          ]
        : [];
    }

    return kategorieVstupenek
      .map((kategorie) => ({
        ...kategorie,
        pocet: pocty[kategorie.id] ?? 0,
      }))
      .filter((kategorie) => kategorie.pocet > 0);
  }, [jeMistenkovyVyber, kategorieVstupenek, pocty, vybranaKategorie, vybranaMista]);

  const celkemKs = vybranePolozky.reduce((soucet, polozka) => soucet + polozka.pocet, 0);
  const celkemCastka = vybranePolozky.reduce(
    (soucet, polozka) => soucet + Number(polozka.cena) * polozka.pocet,
    0,
  );
  const mena = vybranePolozky[0]?.mena ?? kategorieVstupenek[0]?.mena ?? "CZK";

  function nastavPocet(kategorieId: number, hodnota: string) {
    const cislo = Number(hodnota);
    setPocty((aktualni) => ({
      ...aktualni,
      [kategorieId]: Number.isNaN(cislo) ? 0 : Math.max(0, cislo),
    }));
  }

  function prepnoutMisto(kod: string) {
    const detail = mapaMist.get(kod);
    if (vybranaKategorie?.povolene_zony?.length && detail && !vybranaKategorie.povolene_zony.includes(detail.zona)) {
      setChyba("Vybrane misto nespadá do povolene zony pro tuto kategorii.");
      return;
    }
    nastavVybranaMista((aktualni) =>
      aktualni.includes(kod) ? aktualni.filter((misto) => misto !== kod) : [...aktualni, kod],
    );
    setChyba("");
  }

  function ziskejTextChyby(error: unknown) {
    if (!(error instanceof Error)) {
      return "Objednavku se nepodarilo vytvorit.";
    }

    const text = error.message.trim();
    try {
      const data = JSON.parse(text) as Record<string, unknown>;
      const zpravy = Object.values(data)
        .flatMap((hodnota) => {
          if (Array.isArray(hodnota)) {
            return hodnota.map(String);
          }
          if (typeof hodnota === "string") {
            return [hodnota];
          }
          return [];
        })
        .filter(Boolean);

      if (zpravy.length > 0) {
        return zpravy.join(" ");
      }
    } catch {
      return text;
    }

    return text || "Objednavku se nepodarilo vytvorit.";
  }

  async function odesliObjednavku(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChyba("");

    if (vybranePolozky.length === 0) {
      setChyba(jeMistenkovyVyber ? "Vyber alespon jedno konkretni misto." : "Vyber alespon jednu kategorii vstupenek.");
      return;
    }

    setOdesilaSe(true);

    try {
      const objednavka = await vytvorObjednavku({
        ...kontakty,
        polozky: vybranePolozky.map((polozka) => ({
          kategorie_vstupenky: polozka.id,
          pocet: polozka.pocet,
          vybrana_mista: "vybrana_mista" in polozka ? polozka.vybrana_mista : undefined,
        })),
      });

      setPocty({});
      nastavVybranaMista([]);
      setKontakty(prazdneKontakty);
      router.push(`/objednavka/${objednavka.verejne_id}`);
    } catch (error) {
      setChyba(ziskejTextChyby(error));
    } finally {
      setOdesilaSe(false);
    }
  }

  return (
    <div className="objednavka-grid">
      <form className="sprava-panel" onSubmit={odesliObjednavku}>
        <div className="sprava-panel-header">
          <div>
            <h3>{jeMistenkovyVyber ? "Vyber konkretni mista" : "Vyber vstupenky"}</h3>
            <p>
              {jeMistenkovyVyber
                ? "Klikni na sedadla v salu. Obsazena mista jsou zamcena, vybrana mista se okamzite promitaji do objednavky."
                : "Zvol pocet vstupenek a nech si pripravit objednavku pro dalsi krok."}
            </p>
          </div>
        </div>
        <div className="sprava-panel-body stack">
          {jeMistenkovyVyber && vybranaKategorie ? (
            <>
              <div className="form-grid compact">
                <label className="pole">
                  <span className="pole-label">Kategorie vstupenky</span>
                  <select
                    value={vybranaKategorieId}
                    onChange={(event) => {
                      nastavVybranouKategorii(event.target.value);
                      nastavVybranaMista([]);
                    }}
                  >
                    {kategorieVstupenek.filter((kategorie) => kategorie.je_aktivni).map((kategorie) => (
                      <option key={kategorie.id} value={kategorie.id}>
                        {kategorie.nazev} · {formatujCastku(kategorie.cena, kategorie.mena)}
                      </option>
                    ))}
                  </select>
                </label>
                {vybranaKategorie?.povolene_zony?.length ? (
                  <div className="micro">Povolene zony: {vybranaKategorie.povolene_zony.join(", ")}</div>
                ) : null}
              </div>

              <div className="legenda-salu">
                <div className="legenda-polozka">
                  <span className="legenda-bod zona-stred" />
                  <span>Hlavni sedadla</span>
                </div>
                <div className="legenda-polozka">
                  <span className="legenda-bod zona-predni" />
                  <span>Predni pristavky</span>
                </div>
                <div className="legenda-polozka">
                  <span className="legenda-bod zona-zadni" />
                  <span>Zadni pristavky</span>
                </div>
                <div className="legenda-polozka">
                  <span className="legenda-bod zona-parket" />
                  <span>Parket</span>
                </div>
                <div className="legenda-polozka">
                  <span className="legenda-bod zona-prizemi" />
                  <span>Prizemi</span>
                </div>
                <div className="legenda-polozka">
                  <span className="legenda-bod zona-balkon" />
                  <span>Balkon</span>
                </div>
                <div className="legenda-polozka">
                  <span className="legenda-bod zona-balkon_bok" />
                  <span>Balkon bok</span>
                </div>
                <div className="legenda-polozka">
                  <span className="legenda-bod vybrane" />
                  <span>Vybrano</span>
                </div>
                <div className="legenda-polozka">
                  <span className="legenda-bod stav-rezervace" />
                  <span>V rezervaci</span>
                </div>
                <div className="legenda-polozka">
                  <span className="legenda-bod stav-platne" />
                  <span>Prodano</span>
                </div>
                <div className="legenda-polozka">
                  <span className="legenda-bod stav-odbavene" />
                  <span>Odbaveno</span>
                </div>
              </div>

              <PlanSalu
                schema={akce.schema_sezeni}
                stavyMist={akce.stavy_mist}
                vybranaMista={vybranaMista}
                priPrepnutiMista={prepnoutMisto}
              />
            </>
          ) : (
            <div className="stack-karty">
              {kategorieVstupenek.map((kategorie) => (
                <article key={kategorie.id} className="nabidka-vstupenky">
                  <div className="nabidka-vstupenky-copy">
                    <div>
                      <strong>{kategorie.nazev}</strong>
                      <p>{kategorie.popis || "Vstupenka pripravenna k online rezervaci."}</p>
                    </div>
                    <div className="micro">Kapacita {kategorie.kapacita} ks</div>
                  </div>
                  <div className="nabidka-vstupenky-akce">
                    <strong>{formatujCastku(kategorie.cena, kategorie.mena)}</strong>
                    <input
                      min={0}
                      max={kategorie.kapacita}
                      type="number"
                      value={pocty[kategorie.id] ?? 0}
                      onChange={(event) => nastavPocet(kategorie.id, event.target.value)}
                      aria-label={`Pocet pro ${kategorie.nazev}`}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="form-grid">
            <label className="pole">
              <span className="pole-label">E-mail pro potvrzeni</span>
              <input
                required
                type="email"
                value={kontakty.email_zakaznika}
                onChange={(event) =>
                  setKontakty((aktualni) => ({
                    ...aktualni,
                    email_zakaznika: event.target.value,
                  }))
                }
              />
            </label>
            <label className="pole">
              <span className="pole-label">Jmeno navstevnika</span>
              <input
                type="text"
                value={kontakty.jmeno_zakaznika}
                onChange={(event) =>
                  setKontakty((aktualni) => ({
                    ...aktualni,
                    jmeno_zakaznika: event.target.value,
                  }))
                }
              />
            </label>
            <label className="pole pole-cela">
              <span className="pole-label">Telefon</span>
              <input
                type="tel"
                value={kontakty.telefon_zakaznika}
                onChange={(event) =>
                  setKontakty((aktualni) => ({
                    ...aktualni,
                    telefon_zakaznika: event.target.value,
                  }))
                }
              />
            </label>
            <label className="pole pole-cela">
              <span className="pole-label">Způsob úhrady</span>
              <select
                value={kontakty.zpusob_uhrady}
                onChange={(event) =>
                  setKontakty((aktualni) => ({
                    ...aktualni,
                    zpusob_uhrady: event.target.value,
                  }))
                }
              >
                <option value="online">Online platba</option>
                <option value="bankovni_prevod">Bankovní převod přes QR z proformy</option>
              </select>
            </label>
          </div>

          {chyba ? <div className="hlaseni chyba">{chyba}</div> : null}

          <div className="actions-end">
            <button className="button primary" disabled={odesilaSe} type="submit">
              {odesilaSe ? "Zakladam objednavku..." : "Pokracovat k objednavce"}
            </button>
          </div>
        </div>
      </form>

      <aside className="sprava-panel">
        <div className="sprava-panel-header">
          <div>
            <h3>Shrnuti objednavky</h3>
            <p>{jeMistenkovyVyber ? "Vybrana sedadla a jejich cena." : "Zakladni souhrn pred napojenim platebni brany."}</p>
          </div>
        </div>
        <div className="sprava-panel-body stack">
          {vybranePolozky.length > 0 ? (
            <div className="stack-karty">
              {vybranePolozky.map((polozka) => (
                <div key={polozka.id} className="souhrn-objednavky-radek">
                  <div>
                    <strong>{polozka.nazev}</strong>
                    <div className="micro">
                      {polozka.pocet} x {formatujCastku(polozka.cena, polozka.mena)}
                    </div>
                    {"vybrana_mista" in polozka && polozka.vybrana_mista?.length ? (
                      <div className="stack-mini">
                        {polozka.vybrana_mista.map((misto) => (
                          <div key={misto} className="micro">
                            {popisMistaZeSchema(akce.schema_sezeni, misto, akce.stavy_mist)}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <strong>{formatujCastku(String(Number(polozka.cena) * polozka.pocet), polozka.mena)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="tlumeny">
              {jeMistenkovyVyber ? "Zatim nemas vybrane zadne konkretni misto." : "Zatim nemas vybranou zadnou vstupenku."}
            </div>
          )}

          <div className="souhrn-objednavky-celkem">
            <div className="info-radek">
              <span>Pocet vstupenek</span>
              <strong>{celkemKs}</strong>
            </div>
            <div className="info-radek">
              <span>Celkem</span>
              <strong>{formatujCastku(String(celkemCastka), mena)}</strong>
            </div>
            <div className="info-radek">
              <span>Úhrada</span>
              <strong>
                {kontakty.zpusob_uhrady === "bankovni_prevod"
                  ? "Proforma s QR"
                  : "Online platba"}
              </strong>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
