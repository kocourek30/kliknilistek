"use client";

type GrafPolozka = {
  stitek: string;
  hodnota: number;
  barva?: string;
};

type VlastnostiKarty = {
  nadpis: string;
  popis?: string;
  polozky: GrafPolozka[];
};

const vychoziBarvy = ["#73e0ba", "#7db9ff", "#f5c36b", "#d8ccef", "#f28d8d", "#9fe3b0"];

function normalizujPolozky(polozky: GrafPolozka[]): GrafPolozka[] {
  return polozky
    .map((polozka) => ({
      stitek: String(polozka.stitek || "Bez názvu"),
      hodnota: Number.isFinite(Number(polozka.hodnota)) ? Number(polozka.hodnota) : 0,
      barva: polozka.barva,
    }))
    .filter((polozka) => polozka.stitek.trim().length > 0);
}

function sBarvou(polozka: GrafPolozka, index: number): GrafPolozka {
  return {
    ...polozka,
    barva: polozka.barva ?? vychoziBarvy[index % vychoziBarvy.length],
  };
}

export function GrafSloupcovy({ nadpis, popis, polozky }: VlastnostiKarty) {
  const data = normalizujPolozky(polozky).map(sBarvou);
  const maximum = Math.max(...data.map((polozka) => polozka.hodnota), 1);

  return (
    <section className="graf-karta">
      <div className="graf-karta-hlavicka">
        <div>
          <h4>{nadpis}</h4>
          {popis ? <p>{popis}</p> : null}
        </div>
      </div>
      <div className="graf-sloupce">
        {data.map((polozka) => {
          const vyska = Math.max((polozka.hodnota / maximum) * 100, polozka.hodnota > 0 ? 12 : 2);
          return (
            <div key={polozka.stitek} className="graf-sloupec">
              <div className="graf-sloupec-hodnota">{polozka.hodnota}</div>
              <div className="graf-sloupec-obal">
                <div
                  className="graf-sloupec-vypln"
                  style={{ height: `${vyska}%`, backgroundColor: polozka.barva }}
                />
              </div>
              <div className="graf-sloupec-stit">{polozka.stitek}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function GrafRozlozeni({ nadpis, popis, polozky }: VlastnostiKarty) {
  const data = normalizujPolozky(polozky)
    .map(sBarvou)
    .filter((polozka) => polozka.hodnota > 0);
  const soucet = data.reduce((hodnota, polozka) => hodnota + polozka.hodnota, 0);
  const gradient =
    soucet > 0
      ? `conic-gradient(${data
          .map((polozka, index) => {
            const start = (data.slice(0, index).reduce((hodnota, zaznam) => hodnota + zaznam.hodnota, 0) / soucet) * 100;
            const end =
              ((data
                .slice(0, index + 1)
                .reduce((hodnota, zaznam) => hodnota + zaznam.hodnota, 0) /
                soucet) *
                100);
            return `${polozka.barva} ${start}% ${end}%`;
          })
          .join(", ")})`
      : "conic-gradient(#24313f 0 100%)";

  return (
    <section className="graf-karta">
      <div className="graf-karta-hlavicka">
        <div>
          <h4>{nadpis}</h4>
          {popis ? <p>{popis}</p> : null}
        </div>
      </div>
      <div className="graf-donut">
        <div className="graf-donut-kruh" style={{ background: gradient }}>
          <div className="graf-donut-stred">
            <strong>{soucet}</strong>
            <span>celkem</span>
          </div>
        </div>
        <div className="graf-donut-legenda">
          {data.map((polozka) => (
            <div key={polozka.stitek} className="graf-legenda-radek">
              <span
                className="graf-legenda-barva"
                style={{ backgroundColor: polozka.barva }}
              />
              <span>{polozka.stitek}</span>
              <strong>{polozka.hodnota}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
