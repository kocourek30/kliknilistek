import { notFound } from "next/navigation";

import { Hlavicka } from "@/components/hlavicka";
import { nactiVstupenku } from "@/lib/api";
import { formatujDatum } from "@/lib/formatovani";

type DetailVstupenkyPageProps = {
  params: Promise<{
    kod: string;
  }>;
};

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

export default async function DetailVstupenkyPage({ params }: DetailVstupenkyPageProps) {
  const { kod } = await params;
  const vstupenka = await nactiVstupenku(kod);

  if (!vstupenka) {
    notFound();
  }

  return (
    <main className="page-shell">
      <Hlavicka />

      <div className="stranka-verejna">
        <div className="obsah">
          <section className="sekce">
            <div className="vstupenka-detail">
              <div className="vstupenka-detail-hero">
                <div className="hero-meta">
                  <span className="badge akcent">Digitalni vstupenka</span>
                  <span className="badge">{formatujStavVstupenky(vstupenka.stav)}</span>
                </div>
                <h1>{vstupenka.akce_nazev}</h1>
                <p>{vstupenka.kategorie_vstupenky_nazev}</p>
              </div>

              <div className="vstupenka-qr-karta">
                <div className="vstupenka-qr-box">{vstupenka.kod}</div>
                <div className="micro">QR data: {vstupenka.qr_data}</div>
              </div>
            </div>
          </section>

          <section className="objednavka-grid">
            <div className="sprava-panel">
              <div className="sprava-panel-header">
                <div>
                  <h3>Detaily vstupenky</h3>
                  <p>Prvni digitalni podoba pro otevreni v mobilu nebo vytisteni.</p>
                </div>
              </div>
              <div className="sprava-panel-body stack-karty">
                <div className="souhrn-objednavky-radek">
                  <div>
                    <strong>Kod</strong>
                    <div className="micro">{vstupenka.kod}</div>
                  </div>
                </div>
                <div className="souhrn-objednavky-radek">
                  <div>
                    <strong>E-mail navstevnika</strong>
                    <div className="micro">{vstupenka.email_navstevnika || "Neuvedeno"}</div>
                  </div>
                </div>
                <div className="souhrn-objednavky-radek">
                  <div>
                    <strong>Objednavka</strong>
                    <div className="micro">{vstupenka.objednavka_verejne_id}</div>
                  </div>
                </div>
                <div className="souhrn-objednavky-radek">
                  <div>
                    <strong>Vystavena</strong>
                    <div className="micro">{formatujDatum(vstupenka.vystavena)}</div>
                  </div>
                </div>
                <div className="souhrn-objednavky-radek">
                  <div>
                    <strong>Dorucena</strong>
                    <div className="micro">
                      {vstupenka.dorucena ? formatujDatum(vstupenka.dorucena) : "Zatim ne"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
