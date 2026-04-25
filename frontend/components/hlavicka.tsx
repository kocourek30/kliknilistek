export function Hlavicka() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <div className="brand-mark">K</div>
          <div>
            <div className="brand-title">KlikniListek</div>
            <div className="brand-subtitle">Vstupenkový systém pro obce a kulturní akce</div>
          </div>
        </div>
        <nav className="nav-actions">
          <a className="button ghost" href="/">
            Kulturní portál
          </a>
          <a className="button ghost" href="/odbaveni">
            Odbavení
          </a>
          <a className="button primary" href="/sprava">
            Přihlásit správu
          </a>
        </nav>
      </div>
    </header>
  );
}
