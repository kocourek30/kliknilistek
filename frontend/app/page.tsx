import { Hlavicka } from "@/components/hlavicka";
import { nactiSouhrnAdministrace } from "@/lib/api";
import { formatujCastku, formatujDatum, formatujTypOrganizace } from "@/lib/formatovani";

const modulyPlatformy = [
  {
    nadpis: "Rychlé zveřejnění",
    text: "Nová akce, místo konání, kapacita a kategorie vstupenek v jednom návazném toku bez zbytečné administrativy.",
  },
  {
    nadpis: "Pokladna pod kontrolou",
    text: "Přehled prodaných míst, cenových hladin a připravenost na navázání plateb, odbavení a vyúčtování.",
  },
  {
    nadpis: "Důvěryhodný katalog",
    text: "Veřejný katalog akcí, který působí jako kulturní portál obce, ne jako náhodné formuláře slepené dohromady.",
  },
  {
    nadpis: "Připraveno na QR vstup",
    text: "Datový model počítá s odbavením, kategoriemi vstupenek i budoucím online objednávkovým tokem.",
  },
];

export default async function HomePage() {
  const data = await nactiSouhrnAdministrace();
  const akce = data.akce.slice(0, 6);
  const prvniOrganizace = data.organizace[0];
  const kapacitaCelkem = data.akce.reduce((soucet, polozka) => soucet + polozka.kapacita, 0);
  const aktivniVstupenky = data.kategorieVstupenek.reduce(
    (soucet, polozka) => soucet + polozka.kapacita,
    0,
  );
  const doporuceneAkce = data.akce.filter((polozka) => polozka.je_doporucena).length;
  const metriky = [
    { popisek: "Aktivní organizace", hodnota: `${data.organizace.length}` },
    { popisek: "Publikované akce", hodnota: `${data.akce.length}` },
    { popisek: "Připravené vstupenky", hodnota: `${aktivniVstupenky}` },
  ];
  const vytizenost = kapacitaCelkem > 0 ? Math.min(92, Math.round((aktivniVstupenky / kapacitaCelkem) * 100)) : 0;

  return (
    <main className="page-shell">
      <Hlavicka />

      <div className="stranka-verejna">
        <div className="obsah">
          <section className="hero-verejny">
            <div className="hero-obal">
              <div className="hero-vrstva">
                <div className="hero-copy">
                  <div className="hero-meta">
                    <span className="badge akcent">Pilotní kulturní portál</span>
                    <span className="badge">{prvniOrganizace?.nazev ?? "Nová organizace"}</span>
                  </div>
                  <h1>Kulturní akce obce na jednom důvěryhodném místě.</h1>
                  <p>
                    KlikniListek spojuje veřejný katalog akcí s provozním zázemím pro obecní
                    kulturák, kino, plesy i sezónní program. Návštěvník se rychle zorientuje,
                    objedná bez registrace a pořadatel má pod rukou kapacitu, ceny i připravenost
                    na prodej.
                  </p>
                  <div className="nav-actions">
                    <a className="button primary" href="#katalog">
                      Vybrat vstupenky
                    </a>
                    <a className="button" href="/sprava">
                      Přihlášení do správy
                    </a>
                  </div>
                </div>

                <div className="hero-panel">
                  <div className="panel">
                    <h3>Aktivní instance</h3>
                    <div className="rozpis">
                      <div className="rozpis-radek">
                        <span>Organizace</span>
                        <strong>{prvniOrganizace?.nazev ?? "Neuvedeno"}</strong>
                      </div>
                      <div className="rozpis-radek">
                        <span>Typ provozu</span>
                        <strong>
                          {prvniOrganizace
                            ? formatujTypOrganizace(prvniOrganizace.typ_organizace)
                            : "Neuvedeno"}
                        </strong>
                      </div>
                      <div className="rozpis-radek">
                        <span>Publikované akce</span>
                        <strong>{data.akce.length}</strong>
                      </div>
                      <div className="rozpis-radek">
                        <span>Doporučené akce</span>
                        <strong>{doporuceneAkce}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="panel">
                    <h3>Připravenost na prodej</h3>
                    <div className="pruh">
                      <div className="pruh-bar" style={{ width: `${vytizenost}%` }} />
                      <div className="pruh-popis">
                        <span>Obsaditelná kapacita</span>
                        <strong>{vytizenost} % připraveno</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="sekce">
            <div className="sekce-header">
              <div>
                <h2>Provozní obraz</h2>
                <p>První verze už drží pohromadě katalog, kapacitu, místenky i cenové hladiny.</p>
              </div>
            </div>
            <div className="maly-prehled">
              {metriky.map((metrika) => (
                <article key={metrika.popisek} className="metrika">
                  <div className="popisek">{metrika.popisek}</div>
                  <div className="hodnota">{metrika.hodnota}</div>
                </article>
              ))}
            </div>
          </section>

          <section className="sekce pasmo">
            <div className="pasmo-sloupec" id="katalog">
              <div className="sekce-header">
                <div>
                  <h2>Katalog akcí</h2>
                  <p>Navržený jako skutečný kulturní portál obce s rychlou orientací a jasnou cenou.</p>
                </div>
              </div>
              <div className="katalog-grid">
                {akce.map((polozkaAkce) => {
                  const hlavniCena =
                    data.kategorieVstupenek
                      .filter((kategorie) => kategorie.akce === polozkaAkce.id)
                      .sort((a, b) => Number(a.cena) - Number(b.cena))[0] ?? null;

                  return (
                    <article key={polozkaAkce.id} className="karta">
                      <div className="karta-top">
                        <div>
                          <div className="micro">{polozkaAkce.organizace_nazev}</div>
                          <h3>{polozkaAkce.nazev}</h3>
                        </div>
                        <span className="badge akcent">
                          {polozkaAkce.je_doporucena ? "Doporučeno" : "V programu"}
                        </span>
                      </div>
                      <p>{polozkaAkce.popis || "Kulturní akce připravená k online prodeji a odbavení."}</p>
                      <div className="info-radek">
                        <span>Termín</span>
                        <strong>{formatujDatum(polozkaAkce.zacatek)}</strong>
                      </div>
                      <div className="info-radek">
                        <span>Místo</span>
                        <strong>{polozkaAkce.misto_konani_nazev}</strong>
                      </div>
                      <div className="info-radek">
                        <span>Kapacita</span>
                        <strong>{polozkaAkce.kapacita} míst</strong>
                      </div>
                      <div className="akce-footer">
                        <span className="badge">
                          {hlavniCena
                            ? `Od ${formatujCastku(hlavniCena.cena, hlavniCena.mena)}`
                            : "Cena bude doplněna"}
                        </span>
                        <a className="button" href={`/akce/${polozkaAkce.slug}`}>
                          Detail a vstupenky
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="pasmo-sloupec">
              <div className="panel">
                <div className="sekce-header">
                  <div>
                    <h3>Jak je to poskládané</h3>
                    <p>Produkt už drží nejdůležitější vrstvy, které obec opravdu potřebuje.</p>
                  </div>
                </div>
                <div className="moduly-list">
                  {modulyPlatformy.map((modul) => (
                    <div key={modul.nadpis} className="modul-radek">
                      <strong>{modul.nadpis}</strong>
                      <span>{modul.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <h3>Kam směřujeme dál</h3>
                <div className="moduly-list">
                  <div className="modul-radek">
                    <strong>Objednávka</strong>
                    <span>Výběr vstupenek bez registrace, potvrzení a další navázání plateb.</span>
                  </div>
                  <div className="modul-radek">
                    <strong>QR distribuce</strong>
                    <span>E-mail, PDF a později i rychlý check-in pro obsluhu.</span>
                  </div>
                  <div className="modul-radek">
                    <strong>Vyúčtování</strong>
                    <span>Přehled tržeb, exporty a podklady pro účetní i obec.</span>
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
