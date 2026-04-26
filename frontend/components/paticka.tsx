import {
  IconArrowUpRight,
  IconBuildingCommunity,
  IconCalendarEvent,
  IconLogin2,
  IconScan,
} from "@tabler/icons-react";

type PatickaProps = {
  tenantNazev?: string | null;
  tenantLogoUrl?: string | null;
};

export function Paticka({ tenantNazev, tenantLogoUrl }: PatickaProps) {
  return (
    <footer className="verejna-paticka">
      <div className="verejna-paticka-inner">
        <div className="verejna-paticka-blok">
          <div className="verejna-paticka-brand">
            {tenantLogoUrl ? (
              <img alt={tenantNazev || "Logo organizace"} className="verejna-paticka-logo" src={tenantLogoUrl} />
            ) : null}
            <strong>{tenantNazev || "KlikniListek"}</strong>
          </div>
          <p>
            {tenantNazev
              ? `Veřejný kulturní program a online vstupenky pro ${tenantNazev}.`
              : "Moderní kulturní služba pro obce, kulturní domy a místní pořadatele."}
          </p>
        </div>
        <div className="verejna-paticka-blok">
          <strong>Pro návštěvníky</strong>
          <a className="footer-link" href="/akce">
            <IconCalendarEvent aria-hidden="true" size={16} stroke={1.8} />
            <span>Přehled akcí</span>
            <IconArrowUpRight aria-hidden="true" size={14} stroke={1.8} />
          </a>
          <a className="footer-link" href="/#jak-to-funguje">
            <IconBuildingCommunity aria-hidden="true" size={16} stroke={1.8} />
            <span>Jak funguje nákup</span>
            <IconArrowUpRight aria-hidden="true" size={14} stroke={1.8} />
          </a>
        </div>
        <div className="verejna-paticka-blok">
          <strong>Pro pořadatele</strong>
          <a className="footer-link" href="/sprava">
            <IconLogin2 aria-hidden="true" size={16} stroke={1.8} />
            <span>Přihlášení do správy</span>
            <IconArrowUpRight aria-hidden="true" size={14} stroke={1.8} />
          </a>
          <a className="footer-link" href="/odbaveni">
            <IconScan aria-hidden="true" size={16} stroke={1.8} />
            <span>Odbavení</span>
            <IconArrowUpRight aria-hidden="true" size={14} stroke={1.8} />
          </a>
        </div>
      </div>
    </footer>
  );
}
