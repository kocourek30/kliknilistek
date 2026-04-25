import { Hlavicka } from "@/components/hlavicka";
import { OdbaveniBrana } from "@/components/odbaveni-brana";

export default function OdbaveniPage() {
  return (
    <main className="page-shell">
      <Hlavicka />

      <div className="stranka-verejna">
        <div className="obsah">
          <section className="detail-hero">
            <div className="detail-hero-obal">
              <div className="detail-hero-copy">
                <div className="hero-meta">
                  <span className="badge akcent">Vstupni rezim</span>
                  <span className="badge">Check-in</span>
                </div>
                <h1>Rychle odbaveni u vstupu.</h1>
                <p>
                  Tahle vrstva je urcena pro obsluhu na dverich. Overi kod vstupenky, rozhodne o
                  vstupu a hned zapise vysledek do systemu.
                </p>
              </div>
            </div>
          </section>

          <section className="sekce">
            <div className="sekce-header">
              <div>
                <h2>Kontrola vstupu</h2>
                <p>Prvni verze umi manualni vlozeni kodu. Kamera a nativni scanner muzou prijit pozdeji.</p>
              </div>
            </div>
            <OdbaveniBrana />
          </section>
        </div>
      </div>
    </main>
  );
}
