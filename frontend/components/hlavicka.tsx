import {
  IconCalendarEvent,
  IconInfoCircle,
  IconLogin2,
  IconScan,
  IconTicket,
} from "@tabler/icons-react";

type HlavickaProps = {
  varianta?: "verejna" | "sprava";
  tenantNazev?: string | null;
  tenantPodtitulek?: string | null;
  tenantLogoUrl?: string | null;
};

export function Hlavicka({
  varianta = "verejna",
  tenantNazev,
  tenantPodtitulek,
  tenantLogoUrl,
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
          {tenantLogoUrl ? (
            <img alt={tenantNazev || "Logo organizace"} className="verejny-brand-logo" src={tenantLogoUrl} />
          ) : (
            <div className="verejny-brand-mark">K</div>
          )}
          <div className="verejny-brand-copy">
            <div className="verejny-brand-title">{tenantNazev || "KlikniListek"}</div>
            <div className="verejny-brand-subtitle">
              {tenantPodtitulek || "Kulturní program pro obce a místní pořadatele"}
            </div>
          </div>
        </a>

          <nav className="verejny-nav" aria-label="Hlavní navigace">
          <a className="verejny-nav-link" href="/">
            <span className="nav-link-content">
              <IconCalendarEvent aria-hidden="true" size={16} stroke={1.8} />
              <span>Program</span>
            </span>
          </a>
          <a className="verejny-nav-link" href="/akce">
            <span className="nav-link-content">
              <IconTicket aria-hidden="true" size={16} stroke={1.8} />
              <span>{tenantNazev ? "Akce organizace" : "Všechny akce"}</span>
            </span>
          </a>
          <a className="verejny-nav-link" href="/#jak-to-funguje">
            <span className="nav-link-content">
              <IconInfoCircle aria-hidden="true" size={16} stroke={1.8} />
              <span>Jak to funguje</span>
            </span>
          </a>
          <a className="verejny-nav-link verejny-nav-link-utility" href="/odbaveni">
            <span className="nav-link-content">
              <IconScan aria-hidden="true" size={16} stroke={1.8} />
              <span>Odbavení</span>
            </span>
          </a>
          <a className="kulturni-button kulturni-button-secondary" href="/sprava">
            <IconLogin2 aria-hidden="true" size={18} stroke={1.8} />
            <span>Přihlášení správce</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
