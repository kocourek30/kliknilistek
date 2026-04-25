import { Hlavicka } from "@/components/hlavicka";
import { Paticka } from "@/components/paticka";
import { VerejnyKatalog } from "@/components/verejny-katalog";
import { nactiSouhrnAdministrace, nactiTenantKontext } from "@/lib/api";
import { nactiAktualniHost } from "@/lib/tenant-server";
import { formatujTypOrganizace } from "@/lib/formatovani";

export default async function VypisAkciPage() {
  const host = await nactiAktualniHost();
  const tenantKontext = await nactiTenantKontext(host);
  const data = await nactiSouhrnAdministrace(undefined, host);
  const tenantNazev =
    tenantKontext.organizace?.nazev_verejny || tenantKontext.organizace?.nazev || null;
  const tenantPodtitulek = tenantKontext.organizace
    ? `Kulturní program a vstupenky · ${formatujTypOrganizace(tenantKontext.organizace.typ_organizace)}`
    : null;
  const akce = [...data.akce].sort(
    (a, b) => new Date(a.zacatek).getTime() - new Date(b.zacatek).getTime(),
  );

  return (
    <main className="verejny-shell">
      <Hlavicka tenantNazev={tenantNazev} tenantPodtitulek={tenantPodtitulek} />

      <div className="verejny-page">
        <section className="page-intro">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">
                {tenantKontext.organizace
                  ? `Program · ${formatujTypOrganizace(tenantKontext.organizace.typ_organizace)}`
                  : "Program"}
              </span>
              <h1>
                {tenantKontext.organizace
                  ? `Program organizace ${tenantKontext.organizace.nazev_verejny || tenantKontext.organizace.nazev}`
                  : "Všechny akce na jednom místě"}
              </h1>
              <p>
                {tenantKontext.organizace
                  ? "Projdi si akce této organizace. Filtry ti pomůžou rychle najít správný termín, místo i typ programu."
                  : "Projdi si kulturní program obcí a místních pořadatelů. Filtry ti pomůžou rychle najít správný termín, obec i typ akce."}
              </p>
            </div>
          </div>
          <div className="page-intro-note">
            <strong>{tenantKontext.organizace ? "Přehled jednoho pořadatele" : "Jednoduché hledání"}</strong>
            <span>
              {tenantKontext.organizace
                ? "Datum, místo a typ akce máš stále po ruce bez přepínání mezi organizacemi."
                : "Datum, místo, obec i typ akce máš stále po ruce."}
            </span>
          </div>
        </section>

        <section className="verejny-section">
          <VerejnyKatalog
            akce={akce}
            kategorieVstupenek={data.kategorieVstupenek}
            organizace={data.organizace}
          />
        </section>
      </div>

      <Paticka tenantNazev={tenantNazev} />
    </main>
  );
}
