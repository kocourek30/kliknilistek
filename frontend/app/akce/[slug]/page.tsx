import { notFound } from "next/navigation";

import { Hlavicka } from "@/components/hlavicka";
import { ObjednavkaKlient } from "@/components/objednavka-klient";
import { nactiAkci, nactiKategorieVstupenekProAkci } from "@/lib/api";
import { formatujDatum, formatujStavAkce } from "@/lib/formatovani";

type DetailAkcePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function DetailAkcePage({ params }: DetailAkcePageProps) {
  const { slug } = await params;
  const akce = await nactiAkci(slug);

  if (!akce) {
    notFound();
  }

  const kategorieVstupenek = await nactiKategorieVstupenekProAkci(akce.id);

  return (
    <main className="page-shell">
      <Hlavicka />

      <div className="stranka-verejna">
        <div className="obsah">
          <section className="detail-hero">
            <div className="detail-hero-obal">
              <div className="detail-hero-copy">
                <div className="hero-meta">
                  <span className="badge akcent">{akce.organizace_nazev}</span>
                  <span className="badge">{formatujStavAkce(akce.stav)}</span>
                </div>
                <h1>{akce.nazev}</h1>
                <p>
                  {akce.popis ||
                    "Kulturní akce připravená pro online objednávku. Další vrstvou budou platby a distribuce QR vstupenek."}
                </p>
              </div>

              <div className="detail-hero-panel">
                <div className="panel">
                  <h3>Základní informace</h3>
                  <div className="rozpis">
                    <div className="rozpis-radek">
                      <span>Začátek</span>
                      <strong>{formatujDatum(akce.zacatek)}</strong>
                    </div>
                    <div className="rozpis-radek">
                      <span>Konec</span>
                      <strong>{formatujDatum(akce.konec ?? akce.zacatek)}</strong>
                    </div>
                    <div className="rozpis-radek">
                      <span>Místo</span>
                      <strong>{akce.misto_konani_nazev}</strong>
                    </div>
                    <div className="rozpis-radek">
                      <span>Kapacita</span>
                      <strong>{akce.kapacita} míst</strong>
                    </div>
                    <div className="rozpis-radek">
                      <span>Rezervace</span>
                      <strong>{akce.rezervace_platnost_minuty} minut na zaplacení</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="sekce">
            <div className="sekce-header">
              <div>
                <h2>Objednávka vstupenek</h2>
                <p>
                  Vyberete vstupenky, vyplníte kontakt a uložíte objednávku do systému bez nutnosti
                  registrace. Rezervace drží vybraná místa nebo kusy pouze omezený čas, takže je
                  celý tok rychlý a srozumitelný i pro občasného návštěvníka.
                </p>
              </div>
            </div>

            {kategorieVstupenek.length > 0 ? (
              <ObjednavkaKlient akce={akce} kategorieVstupenek={kategorieVstupenek} />
            ) : (
              <div className="sprava-panel">
                <div className="sprava-panel-body">
                  <div className="tlumeny">
                    Pro tuto akci zatím nejsou zveřejněné žádné aktivní kategorie vstupenek.
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
