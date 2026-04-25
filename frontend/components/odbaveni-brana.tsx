"use client";

import { useEffect, useState } from "react";

import { OdbaveniKlient } from "@/components/odbaveni-klient";
import {
  jeAutorizacniApiChyba,
  jeDocasneNedostupnaApiChyba,
  nactiProfilSpravy,
  vytvorTokenSpravy,
  type ProfilSpravy,
} from "@/lib/api";
import { demoRezimZapnuty, vytvorVychoziPrihlaseni } from "@/lib/demo-rezim";

const klicTokenu = "kliknilistek.sprava.token";

export function OdbaveniBrana() {
  const [stav, nastavStav] = useState<"cekam" | "prihlaseni" | "obnova" | "pripraveno">("cekam");
  const [token, nastavToken] = useState("");
  const [profil, nastavProfil] = useState<ProfilSpravy | null>(null);
  const [chyba, nastavChybu] = useState("");
  const [formular, nastavFormular] = useState(vytvorVychoziPrihlaseni("odbaveni"));

  async function overToken(tokenSpravy: string) {
    try {
      const profilSpravy = await nactiProfilSpravy(tokenSpravy);
      if (!profilSpravy.opravneni.odbaveni) {
        throw new Error("Tento účet nemá oprávnění pro odbavení.");
      }
      localStorage.setItem(klicTokenu, tokenSpravy);
      nastavToken(tokenSpravy);
      nastavProfil(profilSpravy);
      nastavStav("pripraveno");
      nastavChybu("");
    } catch (error) {
      if (jeDocasneNedostupnaApiChyba(error)) {
        localStorage.setItem(klicTokenu, tokenSpravy);
        nastavToken(tokenSpravy);
        nastavStav("obnova");
        nastavChybu("Backend správy je dočasně nedostupný. Odbavení čeká na automatické obnovení.");
        return;
      }

      localStorage.removeItem(klicTokenu);
      nastavToken("");
      nastavProfil(null);
      nastavStav("prihlaseni");
      nastavChybu(
        jeAutorizacniApiChyba(error)
          ? "Přihlášení už není platné. Přihlas se prosím znovu."
          : error instanceof Error
            ? error.message
            : "Přihlášení do odbavení se nepodařilo.",
      );
    }
  }

  useEffect(() => {
    const ulozenyToken = localStorage.getItem(klicTokenu);
    if (!ulozenyToken) {
      nastavStav("prihlaseni");
      return;
    }
    void overToken(ulozenyToken);
  }, []);

  useEffect(() => {
    if (stav !== "obnova" || !token) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void overToken(token);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [stav, token]);

  if (stav === "cekam") {
    return <div className="tlumeny">Připravuji vstupní režim...</div>;
  }

  if (stav === "obnova") {
    return (
      <section className="sprava-panel">
        <div className="sprava-panel-header">
          <div>
            <h3>Obnovuji přístup k odbavení</h3>
            <p>{chyba || "Backend správy je dočasně nedostupný. Zkouším připojení znovu."}</p>
          </div>
        </div>
        <div className="sprava-panel-body stack">
          <div className="tlumeny">Automatický pokus proběhne za několik sekund.</div>
          <div className="actions-end">
            <button className="button primary" type="button" onClick={() => void overToken(token)}>
              Zkusit znovu hned
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (stav === "prihlaseni") {
    return (
      <section className="sprava-panel">
        <div className="sprava-panel-header">
          <div>
            <h3>Přihlášení do odbavení</h3>
            <p>Kontrola vstupu je vyhrazena obsluze se speciálním oprávněním.</p>
          </div>
        </div>
        <div className="sprava-panel-body stack">
          <form
            className="form-grid"
            onSubmit={async (event) => {
              event.preventDefault();
              await overToken(vytvorTokenSpravy(formular.uzivatel, formular.heslo));
            }}
          >
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
                Otevřít odbavení
              </button>
            </div>
          </form>
          {chyba ? <div className="hlaseni chyba">{chyba}</div> : null}
          {demoRezimZapnuty ? (
            <div className="panel">
              <h3>Demo přístup pro dveře</h3>
              <div className="rozpis">
                <div className="rozpis-radek">
                  <span>Uživatel</span>
                  <strong>odbaveni</strong>
                </div>
                <div className="rozpis-radek">
                  <span>Heslo</span>
                  <strong>kliknilistek123</strong>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <div className="stack">
      <div className="panel">
        <h3>Přihlášená obsluha</h3>
        <div className="micro">
          {profil?.uzivatel} · {profil?.clenstvi.map((polozka) => polozka.organizace_nazev).join(", ")}
        </div>
      </div>
      <OdbaveniKlient tokenSpravy={token} />
    </div>
  );
}
