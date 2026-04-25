type PatickaProps = {
  tenantNazev?: string | null;
};

export function Paticka({ tenantNazev }: PatickaProps) {
  return (
    <footer className="verejna-paticka">
      <div className="verejna-paticka-inner">
        <div className="verejna-paticka-blok">
          <strong>{tenantNazev || "KlikniListek"}</strong>
          <p>
            {tenantNazev
              ? `Veřejný kulturní program a online vstupenky pro ${tenantNazev}.`
              : "Moderní kulturní služba pro obce, kulturní domy a místní pořadatele."}
          </p>
        </div>
        <div className="verejna-paticka-blok">
          <strong>Pro návštěvníky</strong>
          <a href="/akce">Přehled akcí</a>
          <a href="/#jak-to-funguje">Jak funguje nákup</a>
        </div>
        <div className="verejna-paticka-blok">
          <strong>Pro pořadatele</strong>
          <a href="/sprava">Přihlášení do správy</a>
          <a href="/odbaveni">Odbavení</a>
        </div>
      </div>
    </footer>
  );
}
