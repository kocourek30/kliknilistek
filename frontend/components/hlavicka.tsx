type HlavickaProps = {
  varianta?: "verejna" | "sprava";
  tenantNazev?: string | null;
  tenantPodtitulek?: string | null;
};

export function Hlavicka({
  varianta = "verejna",
  tenantNazev,
  tenantPodtitulek,
}: HlavickaProps) {
  if (varianta === "sprava") {
    return (
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <a className="brand" href="/" aria-label="KlikniListek domů">
            <div className="brand-mark">K</div>
            <div className="brand-copy">
              <div className="brand-title">KlikniListek</div>
            </div>
          </a>

          <nav className="admin-topbar-nav" aria-label="Hlavní navigace správy">
            <a className="admin-topbar-link" href="/akce">
              Kulturní portál
            </a>
            <a className="admin-topbar-link" href="/odbaveni">
              Odbavení
            </a>
            <a className="admin-topbar-link admin-topbar-link-primary" href="/sprava">
              Dashboard správy
            </a>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="verejny-topbar">
      <div className="verejny-topbar-inner">
        <a className="verejny-brand" href="/" aria-label="KlikniListek domů">
          <div className="verejny-brand-mark">K</div>
          <div className="verejny-brand-copy">
            <div className="verejny-brand-title">{tenantNazev || "KlikniListek"}</div>
            <div className="verejny-brand-subtitle">
              {tenantPodtitulek || "Kulturní program pro obce a místní pořadatele"}
            </div>
          </div>
        </a>

        <nav className="verejny-nav" aria-label="Hlavní navigace">
          <a className="verejny-nav-link" href="/">
            Program
          </a>
          <a className="verejny-nav-link" href="/akce">
            {tenantNazev ? "Akce organizace" : "Všechny akce"}
          </a>
          <a className="verejny-nav-link" href="/#jak-to-funguje">
            Jak to funguje
          </a>
          <a className="verejny-nav-link verejny-nav-link-utility" href="/odbaveni">
            Odbavení
          </a>
          <a className="kulturni-button kulturni-button-secondary" href="/sprava">
            Přihlášení správce
          </a>
        </nav>
      </div>
    </header>
  );
}
