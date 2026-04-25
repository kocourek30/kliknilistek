"use client";

export default function ChybaDetailuObjednavky({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="page-shell">
      <div className="stranka-sprava">
        <div className="obsah">
          <section className="sprava-panel">
            <div className="sprava-panel-header">
              <div>
                <h3>Detail objednávky se nepodařilo otevřít</h3>
                <p>
                  Narazili jsme na klientskou chybu při vykreslení stránky. Objednávka ani data se
                  tím nemažou, jen se tahle obrazovka potřebuje obnovit.
                </p>
              </div>
            </div>
            <div className="sprava-panel-body stack">
              <div className="hlaseni chyba">{error.message || "Neznámá chyba klienta."}</div>
              <div className="actions-start">
                <button className="button primary" onClick={reset} type="button">
                  Zkusit znovu
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
