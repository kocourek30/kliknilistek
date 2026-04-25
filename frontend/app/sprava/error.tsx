"use client";

type Vlastnosti = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ChybaSpravy({ error, reset }: Vlastnosti) {
  return (
    <section
      style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(12, 22, 33, 0.9)",
        padding: 24,
        display: "grid",
        gap: 16,
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <strong style={{ fontSize: "1.1rem" }}>Správa narazila na chybu</strong>
        <span style={{ color: "rgba(226,235,244,0.72)", lineHeight: 1.55 }}>
          Obrazovka se nepodařila vykreslit korektně. Můžeš ji zkusit načíst znovu bez návratu do
          menu.
        </span>
        {error?.message ? (
          <span style={{ color: "rgba(255,216,216,0.84)", fontSize: "0.92rem" }}>
            {error.message}
          </span>
        ) : null}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button className="button primary" onClick={() => reset()} type="button">
          Zkusit znovu
        </button>
        <a className="button ghost" href="/sprava">
          Zpět na dashboard
        </a>
      </div>
    </section>
  );
}
