"use client";

import { useState, type FormEvent } from "react";

import { provedOdbaveni, type VysledekOdbaveni } from "@/lib/api";

export function OdbaveniKlient({ tokenSpravy }: { tokenSpravy?: string }) {
  const [kod, nastavKod] = useState("");
  const [zarizeni, nastavZarizeni] = useState("vstup-1");
  const [odesilaSe, nastavOdesilani] = useState(false);
  const [vysledek, nastavVysledek] = useState<VysledekOdbaveni | null>(null);
  const [chyba, nastavChybu] = useState("");

  async function odesli(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    nastavOdesilani(true);
    nastavChybu("");

    try {
      const data = await provedOdbaveni(kod.trim(), zarizeni.trim(), tokenSpravy);
      nastavVysledek(data);
    } catch (error) {
      nastavChybu(error instanceof Error ? error.message : "Odbaveni se nepodarilo zpracovat.");
      nastavVysledek(null);
    } finally {
      nastavOdesilani(false);
    }
  }

  const tridaVysledku =
    vysledek?.vysledek === "povoleno"
      ? "uspech"
      : vysledek
        ? "chyba"
        : "";

  return (
    <div className="objednavka-grid">
      <form className="sprava-panel" onSubmit={odesli}>
        <div className="sprava-panel-header">
          <div>
            <h3>Odbaveni vstupenky</h3>
            <p>Pro prvni verzi staci vlozit kod vstupenky nebo QR data rucne.</p>
          </div>
        </div>
        <div className="sprava-panel-body stack">
          <div className="form-grid">
            <label className="pole pole-cela">
              <span className="pole-label">Kod nebo QR data</span>
              <input
                required
                value={kod}
                onChange={(event) => nastavKod(event.target.value)}
                placeholder="napr. DDBA01EC182341DEBB8690102435B497"
              />
            </label>
            <label className="pole">
              <span className="pole-label">Oznaceni zarizeni</span>
              <input value={zarizeni} onChange={(event) => nastavZarizeni(event.target.value)} />
            </label>
          </div>

          {chyba ? <div className="hlaseni chyba">{chyba}</div> : null}

          <div className="actions-end">
            <button className="button primary" disabled={odesilaSe} type="submit">
              {odesilaSe ? "Kontroluji vstup..." : "Zkontrolovat vstupenku"}
            </button>
          </div>
        </div>
      </form>

      <aside className="sprava-panel">
        <div className="sprava-panel-header">
          <div>
            <h3>Vysledek kontroly</h3>
            <p>Povoleni vstupu, duplicita nebo odmitnuti se zobrazi okamzite.</p>
          </div>
        </div>
        <div className="sprava-panel-body stack">
          {vysledek ? (
            <>
              <div className={`hlaseni ${tridaVysledku}`}>
                <strong>{vysledek.zprava}</strong>
              </div>
              {vysledek.vstupenka ? (
                <div className="stack-karty">
                  <div className="souhrn-objednavky-radek">
                    <div>
                      <strong>{vysledek.vstupenka.akce_nazev}</strong>
                      <div className="micro">{vysledek.vstupenka.kategorie_vstupenky_nazev}</div>
                    </div>
                  </div>
                  <div className="vstupenka-karta">
                    <div className="micro">Kod vstupenky</div>
                    <div className="vstupenka-kod">{vysledek.vstupenka.kod}</div>
                    <span className="badge">{vysledek.stav_vstupenky}</span>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="tlumeny">Po prvnim skenu se tady ukaze stav vstupenky a vysledek vstupu.</div>
          )}
        </div>
      </aside>
    </div>
  );
}
