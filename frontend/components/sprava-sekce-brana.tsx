"use client";

import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  dorucVstupenkyObjednavky,
  nactiPrehledSpravy,
  nactiProfilSpravy,
  nactiSouhrnAdministrace,
  potvrditHotovostObjednavky,
  stornovatObjednavku,
  upravOrganizaciSprava,
  upravClenstviSprava,
  vratitObjednavku,
  vytvorAkciSprava,
  vytvorClenstviSprava,
  vytvorMistoKonaniSprava,
  vytvorOrganizaciSprava,
  vytvorPokladniProdej,
  vytvorTokenSpravy,
  type Akce,
  type ClenstviOrganizace,
  type Objednavka,
  type Organizace,
  type PrehledSpravy,
  type ProfilSpravy,
} from "@/lib/api";
import {
  formatujCastku,
  formatujDatum,
  formatujPoskytovatelePlatby,
  formatujRoliOrganizace,
  formatujStavAkce,
  formatujStavObjednavky,
  formatujStavPlatby,
  formatujStavProformy,
  formatujStavVstupenky,
  formatujTypOrganizace,
  formatujZpusobUhrady,
} from "@/lib/formatovani";
import { formatujKratkeOznaceniMista } from "@/lib/plan-salu";
import { GrafRozlozeni, GrafSloupcovy } from "@/components/sprava-grafy";
import { vytvorVychoziPrihlaseni } from "@/lib/demo-rezim";

const klicTokenu = "kliknilistek.sprava.token";

type StavNacitani = "cekam" | "prihlaseni" | "nacitani" | "pripraveno";

type SekceSpravy =
  | "organizace"
  | "organizace-detail"
  | "mista"
  | "akce"
  | "vstupenky"
  | "vstupenka-detail"
  | "objednavky"
  | "platby"
  | "uzivatele"
  | "uzivatel-detail";

type Vlastnosti = {
  sekce: SekceSpravy;
  parametr?: string;
};

type RazeniObjednavek = "nejnovejsi" | "nejstarsi" | "castka_desc" | "castka_asc";
type RazeniPlateb = "nejnovejsi" | "nejstarsi" | "castka_desc" | "castka_asc";
type RazeniVstupenek = "nejnovejsi" | "stav" | "akce";
type VelikostStranky = "10" | "25" | "50" | "100";
type PohledObjednavek = "vse" | "ceka_na_platbu" | "zaplacene" | "vracene";
type PohledPlateb = "vse" | "dnes" | "uspesne" | "vracene" | "hotovost";
type PohledVstupenek = "vse" | "neodeslane" | "platne" | "odbavene";

type VstupenkaSeVztahem = Objednavka["vstupenky"][number] & {
  objednavka_verejne_id: string;
  email_zakaznika: string;
  jmeno_zakaznika: string;
  telefon_zakaznika: string;
};

function vytvorSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function PanelSekce({
  nadpis,
  popis,
  akce,
  children,
}: {
  nadpis: string;
  popis: string;
  akce?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="sprava-panel">
      <div className="sprava-panel-header">
        <div>
          <h3>{nadpis}</h3>
          <p className="tlumeny">{popis}</p>
        </div>
        {akce}
      </div>
      <div className="sprava-panel-body">{children}</div>
    </section>
  );
}

function HeroSekce({
  stitek,
  nadpis,
  popis,
  detaily,
}: {
  stitek: string;
  nadpis: string;
  popis: string;
  detaily?: ReactNode;
}) {
  return (
    <section className="detail-spravy-hero">
      <div className="detail-spravy-hero-copy">
        <div className="hero-meta">
          <span className="badge akcent">{stitek}</span>
        </div>
        <h1>{nadpis}</h1>
        <p>{popis}</p>
      </div>
      {detaily ? <div className="sprava-panel detail-akce-akce">{detaily}</div> : null}
    </section>
  );
}

function PrazdnyStav({ text }: { text: string }) {
  return <div className="tlumeny">{text}</div>;
}

function UlozenePohledy({
  polozky,
}: {
  polozky: Array<{ id: string; nazev: string; aktivni: boolean; onClick: () => void }>;
}) {
  return (
    <div className="ulozene-pohledy">
      {polozky.map((polozka) => (
        <button
          key={polozka.id}
          className={`button ghost mini${polozka.aktivni ? " aktivni-pohled" : ""}`}
          type="button"
          onClick={polozka.onClick}
        >
          {polozka.nazev}
        </button>
      ))}
    </div>
  );
}

function RychlyDetailPanel({
  nadpis,
  podnadpis,
  akce,
  children,
}: {
  nadpis: string;
  podnadpis: string;
  akce?: ReactNode;
  children: ReactNode;
}) {
  return (
    <aside className="rychly-detail-panel">
      <div className="rychly-detail-hlavicka">
        <div>
          <p className="rychly-detail-stit">{podnadpis}</p>
          <h3>{nadpis}</h3>
        </div>
        {akce}
      </div>
      <div className="rychly-detail-obsah">{children}</div>
    </aside>
  );
}

function stahniCsv(nazev: string, radky: string[][]) {
  if (typeof window === "undefined") {
    return;
  }
  const obsah = radky
    .map((radek) =>
      radek
        .map((bunka) => `"${String(bunka ?? "").replaceAll('"', '""')}"`)
        .join(";"),
    )
    .join("\n");
  const blob = new Blob(["\uFEFF" + obsah], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const odkaz = document.createElement("a");
  odkaz.href = url;
  odkaz.download = nazev;
  document.body.appendChild(odkaz);
  odkaz.click();
  document.body.removeChild(odkaz);
  URL.revokeObjectURL(url);
}

function vratOknoStran(strana: number, pocetStran: number): number[] {
  if (pocetStran <= 5) {
    return Array.from({ length: pocetStran }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(strana - 2, pocetStran - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

function Strankovani({
  celkem,
  strana,
  pocetStran,
  velikostStranky,
  priZmeneVelikosti,
  priPredchozi,
  priDalsi,
  priSkokuNaStranu,
}: {
  celkem: number;
  strana: number;
  pocetStran: number;
  velikostStranky: VelikostStranky;
  priZmeneVelikosti: (hodnota: VelikostStranky) => void;
  priPredchozi: () => void;
  priDalsi: () => void;
  priSkokuNaStranu: (strana: number) => void;
}) {
  const oknoStran = vratOknoStran(strana, pocetStran);

  return (
    <div className="strankovani">
      <div className="strankovani-info">
        <strong>{celkem}</strong>
        <span> záznamů celkem</span>
      </div>
      <div className="strankovani-ovladani">
        <label className="pole pole-inline">
          <span className="pole-label">Na stránku</span>
          <select
            value={velikostStranky}
            onChange={(event) => priZmeneVelikosti(event.target.value as VelikostStranky)}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>
        <div className="strankovani-stav">
          <button className="button ghost" type="button" disabled={strana <= 1} onClick={priPredchozi}>
            Předchozí
          </button>
          <div className="strankovani-cisla">
            {oknoStran[0] > 1 ? (
              <>
                <button className="button ghost" type="button" onClick={() => priSkokuNaStranu(1)}>
                  1
                </button>
                {oknoStran[0] > 2 ? <span className="strankovani-tecky">…</span> : null}
              </>
            ) : null}
            {oknoStran.map((cisloStrany) => (
              <button
                key={cisloStrany}
                className={`button ghost${cisloStrany === strana ? " aktivni-strana" : ""}`}
                type="button"
                onClick={() => priSkokuNaStranu(cisloStrany)}
              >
                {cisloStrany}
              </button>
            ))}
            {oknoStran[oknoStran.length - 1] < pocetStran ? (
              <>
                {oknoStran[oknoStran.length - 1] < pocetStran - 1 ? (
                  <span className="strankovani-tecky">…</span>
                ) : null}
                <button className="button ghost" type="button" onClick={() => priSkokuNaStranu(pocetStran)}>
                  {pocetStran}
                </button>
              </>
            ) : null}
          </div>
          <button className="button ghost" type="button" disabled={strana >= pocetStran} onClick={priDalsi}>
            Další
          </button>
        </div>
      </div>
    </div>
  );
}

function spocitejPocetStran(pocetPolozek: number, velikostStranky: string): number {
  return Math.max(1, Math.ceil(pocetPolozek / Number(velikostStranky || 10)));
}

function vratStranku<T>(polozky: T[], strana: number, velikostStranky: string): T[] {
  const velikost = Number(velikostStranky || 10);
  const start = (strana - 1) * velikost;
  return polozky.slice(start, start + velikost);
}

function jeDnes(datum: string): boolean {
  const hodnota = new Date(datum);
  if (Number.isNaN(hodnota.getTime())) {
    return false;
  }
  const dnes = new Date();
  return (
    hodnota.getFullYear() === dnes.getFullYear() &&
    hodnota.getMonth() === dnes.getMonth() &&
    hodnota.getDate() === dnes.getDate()
  );
}

function ctiTextovyParametr(hodnota: string | null, vychozi: string): string {
  return hodnota && hodnota.trim().length > 0 ? hodnota : vychozi;
}

function ctiCisloParametru(hodnota: string | null, vychozi: number): number {
  const cislo = Number(hodnota);
  return Number.isInteger(cislo) && cislo > 0 ? cislo : vychozi;
}

function zapisParametr(parametry: URLSearchParams, klic: string, hodnota: string, vychozi: string) {
  if (!hodnota || hodnota === vychozi) {
    parametry.delete(klic);
    return;
  }
  parametry.set(klic, hodnota);
}

function zapisCislo(parametry: URLSearchParams, klic: string, hodnota: number, vychozi: number) {
  if (hodnota === vychozi) {
    parametry.delete(klic);
    return;
  }
  parametry.set(klic, String(hodnota));
}

function parametrizujObjednavky(
  parametry: URLSearchParams,
  pohled: PohledObjednavek,
  hledani: string,
  stav: string,
  razeni: RazeniObjednavek,
  strana: number,
  naStranku: VelikostStranky,
) {
  zapisParametr(parametry, "pohled", pohled, "vse");
  zapisParametr(parametry, "hledani", hledani, "");
  zapisParametr(parametry, "stav", stav, "vse");
  zapisParametr(parametry, "razeni", razeni, "nejnovejsi");
  zapisParametr(parametry, "na_stranku", naStranku, "100");
  zapisCislo(parametry, "strana", strana, 1);
}

function parametrizujPlatby(
  parametry: URLSearchParams,
  pohled: PohledPlateb,
  hledani: string,
  stav: string,
  poskytovatel: string,
  razeni: RazeniPlateb,
  strana: number,
  naStranku: VelikostStranky,
) {
  zapisParametr(parametry, "pohled", pohled, "vse");
  zapisParametr(parametry, "hledani", hledani, "");
  zapisParametr(parametry, "stav", stav, "vse");
  zapisParametr(parametry, "poskytovatel", poskytovatel, "vse");
  zapisParametr(parametry, "razeni", razeni, "nejnovejsi");
  zapisParametr(parametry, "na_stranku", naStranku, "100");
  zapisCislo(parametry, "strana", strana, 1);
}

function parametrizujVstupenky(
  parametry: URLSearchParams,
  pohled: PohledVstupenek,
  hledani: string,
  stav: string,
  razeni: RazeniVstupenek,
  strana: number,
  naStranku: VelikostStranky,
) {
  zapisParametr(parametry, "pohled", pohled, "vse");
  zapisParametr(parametry, "hledani", hledani, "");
  zapisParametr(parametry, "stav", stav, "vse");
  zapisParametr(parametry, "razeni", razeni, "nejnovejsi");
  zapisParametr(parametry, "na_stranku", naStranku, "100");
  zapisCislo(parametry, "strana", strana, 1);
}

export function SpravaSekceBrana({ sekce, parametr }: Vlastnosti) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [stav, nastavStav] = useState<StavNacitani>("cekam");
  const [tokenSpravy, nastavTokenSpravy] = useState("");
  const [profil, nastavProfil] = useState<ProfilSpravy | null>(null);
  const [data, nastavData] = useState<Awaited<ReturnType<typeof nactiSouhrnAdministrace>> | null>(
    null,
  );
  const [prehled, nastavPrehled] = useState<PrehledSpravy | null>(null);
  const [chyba, nastavChybu] = useState("");
  const [zprava, nastavZpravu] = useState("");
  const [beziPrechod, spustPrechod] = useTransition();
  const [nahledFotkyMista, nastavNahledFotkyMista] = useState("");
  const [nahledFotkyAkce, nastavNahledFotkyAkce] = useState("");
  const [nahledLogaOrganizace, nastavNahledLogaOrganizace] = useState("");
  const [nahledBanneruOrganizace, nastavNahledBanneruOrganizace] = useState("");
  const [formularPrihlaseni, nastavFormularPrihlaseni] = useState(vytvorVychoziPrihlaseni("spravce"));

  const [formularOrganizace, nastavFormularOrganizace] = useState({
    nazev: "",
    slug: "",
    slug_subdomeny: "",
    vlastni_domena: "",
    tenant_aktivni: false,
    nazev_verejny: "",
    verejny_popis: "",
    logo_url: "",
    logo_soubor: null as File | null,
    banner_soubor: null as File | null,
    banner_popis: "",
    typ_organizace: "obec",
    kontaktni_email: "",
    kontaktni_telefon: "",
    hlavni_barva: "#73E0BA",
    fakturacni_nazev: "",
    ico: "",
    dic: "",
    fakturacni_ulice: "",
    fakturacni_mesto: "",
    fakturacni_psc: "",
    cislo_uctu: "",
    kod_banky: "",
    iban: "",
    swift: "",
    smtp_aktivni: false,
    smtp_host: "",
    smtp_port: "587",
    smtp_uzivatel: "",
    smtp_heslo: "",
    smtp_use_tls: true,
    smtp_use_ssl: false,
    smtp_od_email: "",
    smtp_od_jmeno: "",
    smtp_timeout: "20",
  });
  const [formularMista, nastavFormularMista] = useState({
    organizace: "",
    nazev: "",
    adresa: "",
    mesto: "",
    kapacita: "0",
    hlavni_fotka: null as File | null,
  });
  const [formularAkce, nastavFormularAkce] = useState({
    organizace: "",
    nazev: "",
    slug: "",
    popis: "",
    misto_konani: "",
    zacatek: "",
    konec: "",
    stav: "navrh",
    kapacita: "0",
    rezervace_platnost_minuty: "15",
    je_doporucena: false,
    hlavni_fotka: null as File | null,
  });
  const [formularClenstvi, nastavFormularClenstvi] = useState({
    organizace: "",
    nove_uzivatelske_jmeno: "",
    nove_uzivatelske_email: "",
    nove_heslo: "",
    role: "pokladna",
  });
  const [formularPokladny, nastavFormularPokladny] = useState({
    email_zakaznika: "",
    jmeno_zakaznika: "",
    telefon_zakaznika: "",
    kategorie_vstupenky: "",
    pocet: "1",
    odeslat_na_email: false,
  });

  useEffect(() => {
    if (!formularMista.hlavni_fotka) {
      nastavNahledFotkyMista("");
      return;
    }

    const url = URL.createObjectURL(formularMista.hlavni_fotka);
    nastavNahledFotkyMista(url);
    return () => URL.revokeObjectURL(url);
  }, [formularMista.hlavni_fotka]);

  useEffect(() => {
    if (!formularAkce.hlavni_fotka) {
      nastavNahledFotkyAkce("");
      return;
    }

    const url = URL.createObjectURL(formularAkce.hlavni_fotka);
    nastavNahledFotkyAkce(url);
    return () => URL.revokeObjectURL(url);
  }, [formularAkce.hlavni_fotka]);

  useEffect(() => {
    if (!formularOrganizace.logo_soubor) {
      nastavNahledLogaOrganizace("");
      return;
    }

    const url = URL.createObjectURL(formularOrganizace.logo_soubor);
    nastavNahledLogaOrganizace(url);
    return () => URL.revokeObjectURL(url);
  }, [formularOrganizace.logo_soubor]);

  useEffect(() => {
    if (!formularOrganizace.banner_soubor) {
      nastavNahledBanneruOrganizace("");
      return;
    }

    const url = URL.createObjectURL(formularOrganizace.banner_soubor);
    nastavNahledBanneruOrganizace(url);
    return () => URL.revokeObjectURL(url);
  }, [formularOrganizace.banner_soubor]);
  const [pohledObjednavek, nastavPohledObjednavek] = useState<PohledObjednavek>("vse");
  const [filtrObjednavek, nastavFiltrObjednavek] = useState({ hledani: "", stav: "vse" });
  const [razeniObjednavek, nastavRazeniObjednavek] = useState<RazeniObjednavek>("nejnovejsi");
  const [pohledPlateb, nastavPohledPlateb] = useState<PohledPlateb>("vse");
  const [filtrPlateb, nastavFiltrPlateb] = useState({
    hledani: "",
    stav: "vse",
    poskytovatel: "vse",
  });
  const [razeniPlateb, nastavRazeniPlateb] = useState<RazeniPlateb>("nejnovejsi");
  const [pohledVstupenek, nastavPohledVstupenek] = useState<PohledVstupenek>("vse");
  const [filtrVstupenek, nastavFiltrVstupenek] = useState({
    hledani: "",
    stav: "vse",
  });
  const [razeniVstupenek, nastavRazeniVstupenek] = useState<RazeniVstupenek>("nejnovejsi");
  const [stranaObjednavek, nastavStranuObjednavek] = useState(1);
  const [velikostStrankyObjednavek, nastavVelikostStrankyObjednavek] =
    useState<VelikostStranky>("100");
  const [stranaPlateb, nastavStranuPlateb] = useState(1);
  const [velikostStrankyPlateb, nastavVelikostStrankyPlateb] = useState<VelikostStranky>("100");
  const [stranaVstupenek, nastavStranuVstupenek] = useState(1);
  const [velikostStrankyVstupenek, nastavVelikostStrankyVstupenek] =
    useState<VelikostStranky>("100");
  const [vybraneObjednavky, nastavVybraneObjednavky] = useState<string[]>([]);
  const [vybranePlatby, nastavVybranePlatby] = useState<number[]>([]);
  const [vybraneVstupenky, nastavVybraneVstupenky] = useState<string[]>([]);
  const [rychlyDetailObjednavky, nastavRychlyDetailObjednavky] = useState<string | null>(null);
  const [rychlyDetailPlatby, nastavRychlyDetailPlatby] = useState<number | null>(null);
  const [rychlyDetailVstupenky, nastavRychlyDetailVstupenky] = useState<string | null>(null);

  async function nactiSpravu(token: string) {
    nastavStav("nacitani");
    nastavChybu("");
    nastavZpravu("");

    try {
      const [profilSpravy, dataSpravy, dataPrehledu] = await Promise.all([
        nactiProfilSpravy(token),
        nactiSouhrnAdministrace(token),
        nactiPrehledSpravy(token),
      ]);

      if (!profilSpravy.ma_pristup_do_spravy) {
        throw new Error("Účet nemá přístup do provozní správy.");
      }

      localStorage.setItem(klicTokenu, token);
      nastavTokenSpravy(token);
      nastavProfil(profilSpravy);
      nastavData(dataSpravy);
      nastavPrehled(dataPrehledu);

      nastavFormularMista((aktualni) => ({
        ...aktualni,
        organizace: aktualni.organizace || String(dataSpravy.organizace[0]?.id ?? ""),
      }));
      nastavFormularAkce((aktualni) => ({
        ...aktualni,
        organizace: aktualni.organizace || String(dataSpravy.organizace[0]?.id ?? ""),
        misto_konani: aktualni.misto_konani || String(dataSpravy.mistaKonani[0]?.id ?? ""),
      }));
      nastavFormularClenstvi((aktualni) => ({
        ...aktualni,
        organizace: aktualni.organizace || String(dataSpravy.organizace[0]?.id ?? ""),
      }));
      nastavFormularPokladny((aktualni) => ({
        ...aktualni,
        kategorie_vstupenky:
          aktualni.kategorie_vstupenky || String(dataSpravy.kategorieVstupenek[0]?.id ?? ""),
      }));
      nastavStav("pripraveno");
    } catch (error) {
      localStorage.removeItem(klicTokenu);
      nastavTokenSpravy("");
      nastavProfil(null);
      nastavData(null);
      nastavPrehled(null);
      nastavStav("prihlaseni");
      nastavChybu(error instanceof Error ? error.message : "Přihlášení se nepodařilo.");
    }
  }

  async function obnovVse() {
    if (!tokenSpravy) {
      return;
    }
    const [novaData, novyPrehled] = await Promise.all([
      nactiSouhrnAdministrace(tokenSpravy),
      nactiPrehledSpravy(tokenSpravy),
    ]);
    nastavData(novaData);
    nastavPrehled(novyPrehled);
  }

  useEffect(() => {
    const ulozenyToken = localStorage.getItem(klicTokenu);
    if (!ulozenyToken) {
      nastavStav("prihlaseni");
      return;
    }
    void nactiSpravu(ulozenyToken);
  }, []);

  useEffect(() => {
    if (!searchParams) {
      return;
    }

    if (sekce === "objednavky") {
      nastavPohledObjednavek(
        ctiTextovyParametr(searchParams.get("pohled"), "vse") as PohledObjednavek,
      );
      nastavFiltrObjednavek({
        hledani: ctiTextovyParametr(searchParams.get("hledani"), ""),
        stav: ctiTextovyParametr(searchParams.get("stav"), "vse"),
      });
      nastavRazeniObjednavek(
        ctiTextovyParametr(searchParams.get("razeni"), "nejnovejsi") as RazeniObjednavek,
      );
      nastavVelikostStrankyObjednavek(
        ctiTextovyParametr(searchParams.get("na_stranku"), "100") as VelikostStranky,
      );
      nastavStranuObjednavek(ctiCisloParametru(searchParams.get("strana"), 1));
    }

    if (sekce === "platby") {
      nastavPohledPlateb(ctiTextovyParametr(searchParams.get("pohled"), "vse") as PohledPlateb);
      nastavFiltrPlateb({
        hledani: ctiTextovyParametr(searchParams.get("hledani"), ""),
        stav: ctiTextovyParametr(searchParams.get("stav"), "vse"),
        poskytovatel: ctiTextovyParametr(searchParams.get("poskytovatel"), "vse"),
      });
      nastavRazeniPlateb(
        ctiTextovyParametr(searchParams.get("razeni"), "nejnovejsi") as RazeniPlateb,
      );
      nastavVelikostStrankyPlateb(
        ctiTextovyParametr(searchParams.get("na_stranku"), "100") as VelikostStranky,
      );
      nastavStranuPlateb(ctiCisloParametru(searchParams.get("strana"), 1));
    }

    if (sekce === "vstupenky") {
      nastavPohledVstupenek(
        ctiTextovyParametr(searchParams.get("pohled"), "vse") as PohledVstupenek,
      );
      nastavFiltrVstupenek({
        hledani: ctiTextovyParametr(searchParams.get("hledani"), ""),
        stav: ctiTextovyParametr(searchParams.get("stav"), "vse"),
      });
      nastavRazeniVstupenek(
        ctiTextovyParametr(searchParams.get("razeni"), "nejnovejsi") as RazeniVstupenek,
      );
      nastavVelikostStrankyVstupenek(
        ctiTextovyParametr(searchParams.get("na_stranku"), "100") as VelikostStranky,
      );
      nastavStranuVstupenek(ctiCisloParametru(searchParams.get("strana"), 1));
    }
  }, [searchParams, sekce]);

  const vstupenky = useMemo<VstupenkaSeVztahem[]>(() => {
    if (!data) {
      return [];
    }
    return data.objednavky.flatMap((objednavka) =>
      objednavka.vstupenky.map((vstupenka) => ({
        ...vstupenka,
        objednavka_verejne_id: objednavka.verejne_id,
        email_zakaznika: objednavka.email_zakaznika,
        jmeno_zakaznika: objednavka.jmeno_zakaznika,
        telefon_zakaznika: objednavka.telefon_zakaznika,
      })),
    );
  }, [data]);

  const filtrovaneObjednavky = useMemo(() => {
    if (!data) {
      return [];
    }
    const hledani = filtrObjednavek.hledani.trim().toLowerCase();
    const vysledek = data.objednavky.filter((objednavka) => {
      const sediPohled =
        pohledObjednavek === "vse"
          ? true
          : pohledObjednavek === "ceka_na_platbu"
            ? objednavka.stav === "ceka_na_platbu"
            : pohledObjednavek === "zaplacene"
              ? objednavka.stav === "zaplaceno"
              : objednavka.stav === "vraceno";
      const sediStav = filtrObjednavek.stav === "vse" ? true : objednavka.stav === filtrObjednavek.stav;
      const sedoHledani = !hledani
        ? true
        : [
            objednavka.verejne_id,
            objednavka.email_zakaznika,
            objednavka.jmeno_zakaznika,
            objednavka.telefon_zakaznika,
            ...objednavka.vstupenky.map((vstupenka) => vstupenka.kod),
          ]
            .join(" ")
            .toLowerCase()
            .includes(hledani);
      return sediPohled && sediStav && sedoHledani;
    });
    return vysledek.sort((leva, prava) => {
      if (razeniObjednavek === "nejstarsi") {
        return new Date(leva.vytvoreno).getTime() - new Date(prava.vytvoreno).getTime();
      }
      if (razeniObjednavek === "castka_desc") {
        return Number(prava.celkem) - Number(leva.celkem);
      }
      if (razeniObjednavek === "castka_asc") {
        return Number(leva.celkem) - Number(prava.celkem);
      }
      return new Date(prava.vytvoreno).getTime() - new Date(leva.vytvoreno).getTime();
    });
  }, [data, filtrObjednavek, pohledObjednavek, razeniObjednavek]);

  const filtrovanePlatby = useMemo(() => {
    if (!data) {
      return [];
    }
    const hledani = filtrPlateb.hledani.trim().toLowerCase();
    const vysledek = data.platby.filter((platba) => {
      const sediPohled =
        pohledPlateb === "vse"
          ? true
          : pohledPlateb === "dnes"
            ? jeDnes(platba.vytvoreno)
            : pohledPlateb === "uspesne"
              ? platba.stav === "uspesna"
              : pohledPlateb === "vracene"
                ? platba.stav === "vracena"
                : platba.poskytovatel === "hotovost";
      const sediStav = filtrPlateb.stav === "vse" ? true : platba.stav === filtrPlateb.stav;
      const sediPoskytovatel =
        filtrPlateb.poskytovatel === "vse" ? true : platba.poskytovatel === filtrPlateb.poskytovatel;
      const sedoHledani = !hledani
        ? true
        : [
            platba.id,
            platba.objednavka_verejne_id,
            platba.reference_poskytovatele,
            platba.poskytovatel,
            platba.stav,
          ]
            .join(" ")
            .toLowerCase()
            .includes(hledani);
      return sediPohled && sediStav && sediPoskytovatel && sedoHledani;
    });
    return vysledek.sort((leva, prava) => {
      if (razeniPlateb === "nejstarsi") {
        return new Date(leva.vytvoreno).getTime() - new Date(prava.vytvoreno).getTime();
      }
      if (razeniPlateb === "castka_desc") {
        return Number(prava.castka) - Number(leva.castka);
      }
      if (razeniPlateb === "castka_asc") {
        return Number(leva.castka) - Number(prava.castka);
      }
      return new Date(prava.vytvoreno).getTime() - new Date(leva.vytvoreno).getTime();
    });
  }, [data, filtrPlateb, pohledPlateb, razeniPlateb]);

  const filtrovaneVstupenky = useMemo(() => {
    const hledani = filtrVstupenek.hledani.trim().toLowerCase();
    const vysledek = vstupenky.filter((vstupenka) => {
      const sediPohled =
        pohledVstupenek === "vse"
          ? true
          : pohledVstupenek === "neodeslane"
            ? !vstupenka.dorucena
            : pohledVstupenek === "platne"
              ? vstupenka.stav === "platna"
              : vstupenka.stav === "odbavena";
      const sediStav = filtrVstupenek.stav === "vse" ? true : vstupenka.stav === filtrVstupenek.stav;
      const sedoHledani = !hledani
        ? true
        : [
            vstupenka.kod,
            vstupenka.objednavka_verejne_id,
            vstupenka.akce_nazev,
            vstupenka.kategorie_vstupenky_nazev,
            vstupenka.email_zakaznika,
            vstupenka.jmeno_zakaznika,
            vstupenka.oznaceni_mista,
          ]
            .join(" ")
            .toLowerCase()
            .includes(hledani);
      return sediPohled && sediStav && sedoHledani;
    });
    return vysledek.sort((leva, prava) => {
      if (razeniVstupenek === "stav") {
        return formatujStavVstupenky(leva.stav).localeCompare(formatujStavVstupenky(prava.stav), "cs");
      }
      if (razeniVstupenek === "akce") {
        return leva.akce_nazev.localeCompare(prava.akce_nazev, "cs");
      }
      return prava.kod.localeCompare(leva.kod, "cs");
    });
  }, [filtrVstupenek, pohledVstupenek, razeniVstupenek, vstupenky]);

  useEffect(() => {
    nastavStranuObjednavek(1);
    nastavVybraneObjednavky([]);
  }, [filtrObjednavek, pohledObjednavek, razeniObjednavek, velikostStrankyObjednavek]);

  useEffect(() => {
    nastavStranuPlateb(1);
    nastavVybranePlatby([]);
  }, [filtrPlateb, pohledPlateb, razeniPlateb, velikostStrankyPlateb]);

  useEffect(() => {
    nastavStranuVstupenek(1);
    nastavVybraneVstupenky([]);
  }, [filtrVstupenek, pohledVstupenek, razeniVstupenek, velikostStrankyVstupenek]);

  const pocetStranObjednavek = useMemo(
    () => spocitejPocetStran(filtrovaneObjednavky.length, velikostStrankyObjednavek),
    [filtrovaneObjednavky.length, velikostStrankyObjednavek],
  );
  const pocetStranPlateb = useMemo(
    () => spocitejPocetStran(filtrovanePlatby.length, velikostStrankyPlateb),
    [filtrovanePlatby.length, velikostStrankyPlateb],
  );
  const pocetStranVstupenek = useMemo(
    () => spocitejPocetStran(filtrovaneVstupenky.length, velikostStrankyVstupenek),
    [filtrovaneVstupenky.length, velikostStrankyVstupenek],
  );

  const zobrazeneObjednavky = useMemo(
    () => vratStranku(filtrovaneObjednavky, Math.min(stranaObjednavek, pocetStranObjednavek), velikostStrankyObjednavek),
    [filtrovaneObjednavky, pocetStranObjednavek, stranaObjednavek, velikostStrankyObjednavek],
  );
  const zobrazenePlatby = useMemo(
    () => vratStranku(filtrovanePlatby, Math.min(stranaPlateb, pocetStranPlateb), velikostStrankyPlateb),
    [filtrovanePlatby, pocetStranPlateb, stranaPlateb, velikostStrankyPlateb],
  );
  const zobrazeneVstupenky = useMemo(
    () => vratStranku(filtrovaneVstupenky, Math.min(stranaVstupenek, pocetStranVstupenek), velikostStrankyVstupenek),
    [filtrovaneVstupenky, pocetStranVstupenek, stranaVstupenek, velikostStrankyVstupenek],
  );

  const vybraneObjednavkyData = useMemo(
    () => filtrovaneObjednavky.filter((objednavka) => vybraneObjednavky.includes(objednavka.verejne_id)),
    [filtrovaneObjednavky, vybraneObjednavky],
  );
  const vybranePlatbyData = useMemo(
    () => filtrovanePlatby.filter((platba) => vybranePlatby.includes(platba.id)),
    [filtrovanePlatby, vybranePlatby],
  );
  const vybraneVstupenkyData = useMemo(
    () => filtrovaneVstupenky.filter((vstupenka) => vybraneVstupenky.includes(vstupenka.kod)),
    [filtrovaneVstupenky, vybraneVstupenky],
  );
  const aktivniObjednavkaQuick = useMemo(
    () =>
      rychlyDetailObjednavky
        ? data?.objednavky.find((objednavka) => objednavka.verejne_id === rychlyDetailObjednavky) ?? null
        : null,
    [data?.objednavky, rychlyDetailObjednavky],
  );
  const aktivniPlatbaQuick = useMemo(
    () => (rychlyDetailPlatby ? data?.platby.find((platba) => platba.id === rychlyDetailPlatby) ?? null : null),
    [data?.platby, rychlyDetailPlatby],
  );
  const aktivniVstupenkaQuick = useMemo(
    () => (rychlyDetailVstupenky ? vstupenky.find((vstupenka) => vstupenka.kod === rychlyDetailVstupenky) ?? null : null),
    [rychlyDetailVstupenky, vstupenky],
  );

  useEffect(() => {
    if (rychlyDetailObjednavky && !filtrovaneObjednavky.some((objednavka) => objednavka.verejne_id === rychlyDetailObjednavky)) {
      nastavRychlyDetailObjednavky(null);
    }
  }, [filtrovaneObjednavky, rychlyDetailObjednavky]);

  useEffect(() => {
    if (rychlyDetailPlatby && !filtrovanePlatby.some((platba) => platba.id === rychlyDetailPlatby)) {
      nastavRychlyDetailPlatby(null);
    }
  }, [filtrovanePlatby, rychlyDetailPlatby]);

  useEffect(() => {
    if (rychlyDetailVstupenky && !filtrovaneVstupenky.some((vstupenka) => vstupenka.kod === rychlyDetailVstupenky)) {
      nastavRychlyDetailVstupenky(null);
    }
  }, [filtrovaneVstupenky, rychlyDetailVstupenky]);

  const aktivniOrganizace = data && parametr
    ? data.organizace.find((organizace) => String(organizace.id) === parametr) ?? null
    : null;
  const aktivniClen = data && parametr
    ? data.clenstvi.find((clen) => String(clen.id) === parametr) ?? null
    : null;
  const aktivniVstupenka = parametr ? vstupenky.find((vstupenka) => vstupenka.kod === parametr) ?? null : null;

  useEffect(() => {
    if (sekce === "organizace-detail" && aktivniOrganizace) {
      predvyplnFormularOrganizace(aktivniOrganizace);
    }
  }, [aktivniOrganizace, sekce]);

  async function provedHromadnouAkci(
    akce: Array<() => Promise<unknown>>,
    zpravaUspechu: string,
    poDokonceni?: () => void,
  ) {
    if (!akce.length) {
      nastavChybu("Nejprve vyber alespoň jeden záznam.");
      return;
    }
    obnovZpravy();
    spustPrechod(async () => {
      try {
        for (const krok of akce) {
          await krok();
        }
        await obnovVse();
        poDokonceni?.();
        nastavZpravu(zpravaUspechu);
      } catch (error) {
        nastavChybu(error instanceof Error ? error.message : "Hromadná akce se nepodařila.");
      }
    });
  }

  useEffect(() => {
    if (!pathname || !searchParams) {
      return;
    }

    const parametry = new URLSearchParams(searchParams.toString());

    if (sekce === "objednavky") {
      parametrizujObjednavky(
        parametry,
        pohledObjednavek,
        filtrObjednavek.hledani,
        filtrObjednavek.stav,
        razeniObjednavek,
        stranaObjednavek,
        velikostStrankyObjednavek,
      );
    }

    if (sekce === "platby") {
      parametrizujPlatby(
        parametry,
        pohledPlateb,
        filtrPlateb.hledani,
        filtrPlateb.stav,
        filtrPlateb.poskytovatel,
        razeniPlateb,
        stranaPlateb,
        velikostStrankyPlateb,
      );
    }

    if (sekce === "vstupenky") {
      parametrizujVstupenky(
        parametry,
        pohledVstupenek,
        filtrVstupenek.hledani,
        filtrVstupenek.stav,
        razeniVstupenek,
        stranaVstupenek,
        velikostStrankyVstupenek,
      );
    }

    const novaAdresa = parametry.toString() ? `${pathname}?${parametry.toString()}` : pathname;
    const aktualniAdresa = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

    if (novaAdresa !== aktualniAdresa) {
      window.history.replaceState(null, "", novaAdresa);
    }
  }, [
    filtrObjednavek.hledani,
    filtrObjednavek.stav,
    pohledObjednavek,
    filtrPlateb.hledani,
    filtrPlateb.poskytovatel,
    filtrPlateb.stav,
    pohledPlateb,
    filtrVstupenek.hledani,
    filtrVstupenek.stav,
    pohledVstupenek,
    pathname,
    razeniObjednavek,
    razeniPlateb,
    razeniVstupenek,
    searchParams,
    sekce,
    stranaObjednavek,
    stranaPlateb,
    stranaVstupenek,
    velikostStrankyObjednavek,
    velikostStrankyPlateb,
    velikostStrankyVstupenek,
  ]);

  const mistaProAkci = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.mistaKonani.filter((misto) => misto.organizace === Number(formularAkce.organizace));
  }, [data, formularAkce.organizace]);

  const grafyOrganizaci = useMemo(() => {
    if (!data) {
      return { typy: [], vykon: [] };
    }

    const typy = Object.entries(
      data.organizace.reduce<Record<string, number>>((vysledek, organizace) => {
        vysledek[formatujTypOrganizace(organizace.typ_organizace)] =
          (vysledek[formatujTypOrganizace(organizace.typ_organizace)] ?? 0) + 1;
        return vysledek;
      }, {}),
    ).map(([stitek, hodnota]) => ({ stitek, hodnota }));

    const vykon = data.organizace.map((organizace) => ({
      stitek: organizace.nazev,
      hodnota: data.akce.filter((akce) => akce.organizace === organizace.id).length,
    }));

    return { typy, vykon };
  }, [data]);

  const grafyMist = useMemo(() => {
    if (!data) {
      return { kapacity: [], mesta: [] };
    }

    const kapacity = data.mistaKonani.map((misto) => ({
      stitek: misto.nazev,
      hodnota: misto.kapacita,
    }));

    const mesta = Object.entries(
      data.mistaKonani.reduce<Record<string, number>>((vysledek, misto) => {
        vysledek[misto.mesto] = (vysledek[misto.mesto] ?? 0) + 1;
        return vysledek;
      }, {}),
    ).map(([stitek, hodnota]) => ({ stitek, hodnota }));

    return { kapacity, mesta };
  }, [data]);

  const grafyAkci = useMemo(() => {
    if (!data || !prehled) {
      return { stavy: [], vykon: [] };
    }

    const stavy = Object.entries(
      data.akce.reduce<Record<string, number>>((vysledek, akce) => {
        const stitek = formatujStavAkce(akce.stav);
        vysledek[stitek] = (vysledek[stitek] ?? 0) + 1;
        return vysledek;
      }, {}),
    ).map(([stitek, hodnota]) => ({ stitek, hodnota }));

    const vykon = prehled.vykonnost_akci.slice(0, 8).map((akce) => ({
      stitek: akce.nazev,
      hodnota: akce.prodane_vstupenky,
    }));

    return { stavy, vykon };
  }, [data, prehled]);

  const grafyVstupenek = useMemo(() => {
    const stavy = Object.entries(
      vstupenky.reduce<Record<string, number>>((vysledek, vstupenka) => {
        const stitek = formatujStavVstupenky(vstupenka.stav);
        vysledek[stitek] = (vysledek[stitek] ?? 0) + 1;
        return vysledek;
      }, {}),
    ).map(([stitek, hodnota]) => ({ stitek, hodnota }));

    const podleAkci = Object.entries(
      vstupenky.reduce<Record<string, number>>((vysledek, vstupenka) => {
        vysledek[vstupenka.akce_nazev] = (vysledek[vstupenka.akce_nazev] ?? 0) + 1;
        return vysledek;
      }, {}),
    )
      .map(([stitek, hodnota]) => ({ stitek, hodnota }))
      .slice(0, 8);

    return { stavy, podleAkci };
  }, [vstupenky]);

  const grafyObjednavek = useMemo(() => {
    if (!data) {
      return { stavy: [], podleAkci: [] };
    }

    const stavy = Object.entries(
      data.objednavky.reduce<Record<string, number>>((vysledek, objednavka) => {
        const stitek = formatujStavObjednavky(objednavka.stav);
        vysledek[stitek] = (vysledek[stitek] ?? 0) + 1;
        return vysledek;
      }, {}),
    ).map(([stitek, hodnota]) => ({ stitek, hodnota }));

    const podleAkciMapy = new Map<string, number>();
    for (const objednavka of data.objednavky) {
      const nazvy = new Set(objednavka.polozky.map((polozka) => polozka.akce_nazev || "Bez akce"));
      for (const nazev of nazvy) {
        podleAkciMapy.set(nazev, (podleAkciMapy.get(nazev) ?? 0) + 1);
      }
    }

    const podleAkci = Array.from(podleAkciMapy.entries()).map(([stitek, hodnota]) => ({
      stitek,
      hodnota,
    }));

    return { stavy, podleAkci };
  }, [data]);

  const grafyPlateb = useMemo(() => {
    if (!data) {
      return { stavy: [], poskytovatele: [] };
    }

    const stavy = Object.entries(
      data.platby.reduce<Record<string, number>>((vysledek, platba) => {
        const stitek = formatujStavPlatby(platba.stav);
        vysledek[stitek] = (vysledek[stitek] ?? 0) + 1;
        return vysledek;
      }, {}),
    ).map(([stitek, hodnota]) => ({ stitek, hodnota }));

    const poskytovatele = Object.entries(
      data.platby.reduce<Record<string, number>>((vysledek, platba) => {
        const stitek = formatujPoskytovatelePlatby(platba.poskytovatel);
        vysledek[stitek] = (vysledek[stitek] ?? 0) + 1;
        return vysledek;
      }, {}),
    ).map(([stitek, hodnota]) => ({ stitek, hodnota }));

    return { stavy, poskytovatele };
  }, [data]);

  const grafyUzivatelu = useMemo(() => {
    if (!data) {
      return { role: [], aktivita: [] };
    }

    const role = Object.entries(
      data.clenstvi.reduce<Record<string, number>>((vysledek, clen) => {
        const stitek = formatujRoliOrganizace(clen.role);
        vysledek[stitek] = (vysledek[stitek] ?? 0) + 1;
        return vysledek;
      }, {}),
    ).map(([stitek, hodnota]) => ({ stitek, hodnota }));

    const aktivita = [
      { stitek: "Aktivní", hodnota: data.clenstvi.filter((clen) => clen.je_aktivni).length },
      { stitek: "Vypnuté", hodnota: data.clenstvi.filter((clen) => !clen.je_aktivni).length },
    ];

    return { role, aktivita };
  }, [data]);

  function obnovZpravy() {
    nastavChybu("");
    nastavZpravu("");
  }

  function odhlasit() {
    localStorage.removeItem(klicTokenu);
    nastavTokenSpravy("");
    nastavProfil(null);
    nastavData(null);
    nastavPrehled(null);
    nastavStav("prihlaseni");
  }

  async function odesliPrihlaseni(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = vytvorTokenSpravy(formularPrihlaseni.uzivatel, formularPrihlaseni.heslo);
    await nactiSpravu(token);
  }

  async function sObnovou<T>(akce: () => Promise<T>, zpravaUspechu: string) {
    obnovZpravy();
    spustPrechod(async () => {
      try {
        await akce();
        await obnovVse();
        nastavZpravu(zpravaUspechu);
      } catch (error) {
        nastavChybu(error instanceof Error ? error.message : "Operace se nepodařila.");
      }
    });
  }

  function predvyplnFormularOrganizace(organizace: Organizace) {
    nastavFormularOrganizace({
      nazev: organizace.nazev || "",
      slug: organizace.slug || "",
      slug_subdomeny: organizace.slug_subdomeny || "",
      vlastni_domena: organizace.vlastni_domena || "",
      tenant_aktivni: Boolean(organizace.tenant_aktivni),
      nazev_verejny: organizace.nazev_verejny || "",
      verejny_popis: organizace.verejny_popis || "",
      logo_url: organizace.logo_url || "",
      logo_soubor: null,
      banner_soubor: null,
      banner_popis: organizace.banner_popis || "",
      typ_organizace: organizace.typ_organizace || "obec",
      kontaktni_email: organizace.kontaktni_email || "",
      kontaktni_telefon: organizace.kontaktni_telefon || "",
      hlavni_barva: organizace.hlavni_barva || "#73E0BA",
      fakturacni_nazev: organizace.fakturacni_nazev || "",
      ico: organizace.ico || "",
      dic: organizace.dic || "",
      fakturacni_ulice: organizace.fakturacni_ulice || "",
      fakturacni_mesto: organizace.fakturacni_mesto || "",
      fakturacni_psc: organizace.fakturacni_psc || "",
      cislo_uctu: organizace.cislo_uctu || "",
      kod_banky: organizace.kod_banky || "",
      iban: organizace.iban || "",
      swift: organizace.swift || "",
      smtp_aktivni: Boolean(organizace.smtp_aktivni),
      smtp_host: organizace.smtp_host || "",
      smtp_port: String(organizace.smtp_port || 587),
      smtp_uzivatel: organizace.smtp_uzivatel || "",
      smtp_heslo: "",
      smtp_use_tls: Boolean(organizace.smtp_use_tls),
      smtp_use_ssl: Boolean(organizace.smtp_use_ssl),
      smtp_od_email: organizace.smtp_od_email || "",
      smtp_od_jmeno: organizace.smtp_od_jmeno || "",
      smtp_timeout: String(organizace.smtp_timeout || 20),
    });
  }

  if (stav === "cekam" || stav === "nacitani") {
    return (
      <PanelSekce
        nadpis="Načítání správy"
        popis="Ověřuji přístup a načítám vybranou sekci."
      >
        <div className="tlumeny">Načítám správu…</div>
      </PanelSekce>
    );
  }

  if (stav === "prihlaseni") {
    return (
      <div className="sprava-prihlaseni">
        <PanelSekce
          nadpis="Přihlášení do správy"
          popis="Správa je oddělená od veřejného portálu a vyžaduje oprávněný účet."
        >
          <div className="stack">
            <form className="form-grid" onSubmit={odesliPrihlaseni}>
              <label className="pole">
                <span className="pole-label">Uživatelské jméno</span>
                <input
                  value={formularPrihlaseni.uzivatel}
                  onChange={(event) =>
                    nastavFormularPrihlaseni((aktualni) => ({
                      ...aktualni,
                      uzivatel: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="pole">
                <span className="pole-label">Heslo</span>
                <input
                  type="password"
                  value={formularPrihlaseni.heslo}
                  onChange={(event) =>
                    nastavFormularPrihlaseni((aktualni) => ({
                      ...aktualni,
                      heslo: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <div className="actions-end pole-cela">
                <button className="button primary" type="submit">
                  Otevřít sekci
                </button>
              </div>
            </form>

            {chyba ? <div className="hlaseni chyba">{chyba}</div> : null}
          </div>
        </PanelSekce>
      </div>
    );
  }

  if (!profil || !data || !prehled) {
    return null;
  }

  const aktualniLogoOrganizace =
    nahledLogaOrganizace ||
    aktivniOrganizace?.logo_soubor_url ||
    aktivniOrganizace?.logo_url ||
    "";
  const aktualniBannerOrganizace =
    nahledBanneruOrganizace || aktivniOrganizace?.banner_soubor_url || "";

  return (
    <div className="stack">
      {(chyba || zprava) && (
        <div className={chyba ? "hlaseni chyba" : "hlaseni uspech"}>{chyba || zprava}</div>
      )}

      {sekce === "organizace" ? (
        <>
          <HeroSekce
            stitek="Organizace"
            nadpis="Správa organizací a kontaktních bodů"
            popis="Organizace, kontakty, místa a tým na jednom místě."
            detaily={
              <div className="sprava-panel-body stack-mini">
                <div className="rozpis">
                  <div className="rozpis-radek">
                    <span>Organizace</span>
                    <strong>{data.organizace.length}</strong>
                  </div>
                  <div className="rozpis-radek">
                    <span>Akce</span>
                    <strong>{data.akce.length}</strong>
                  </div>
                  <div className="rozpis-radek">
                    <span>Uživatelé</span>
                    <strong>{data.clenstvi.length}</strong>
                  </div>
                </div>
              </div>
            }
          />

          <div className="admin-sekce-grid">
            <PanelSekce
              nadpis="Přehled organizací"
              popis="Rozložení podle typu a počet akcí u jednotlivých subjektů."
            >
              <div className="grafy-grid">
                <GrafRozlozeni
                  nadpis="Typy organizací"
                  popis="Kolik subjektů je v jednotlivých skupinách."
                  polozky={grafyOrganizaci.typy}
                />
                <GrafSloupcovy
                  nadpis="Akce podle organizace"
                  popis="Kolik akcí spravuje každá organizace."
                  polozky={grafyOrganizaci.vykon}
                />
              </div>
            </PanelSekce>
            <PanelSekce
              nadpis="Seznam organizací"
              popis="Přehled všech subjektů se vstupem do detailu."
            >
              <div className="tabulka tabulka-siroka">
                <div className="tabulka-radek-hlavni tabulka-radek-organizace">
                  <span>Organizace</span>
                  <span>Typ</span>
                  <span>Kontakt</span>
                  <span>Provoz</span>
                  <span>Akce</span>
                  <span />
                </div>
                {data.organizace.map((organizace) => {
                  const pocetMist = data.mistaKonani.filter((misto) => misto.organizace === organizace.id).length;
                  const pocetAkci = data.akce.filter((akce) => akce.organizace === organizace.id).length;
                  const pocetClenu = data.clenstvi.filter((clen) => clen.organizace === organizace.id).length;
                  return (
                    <article key={organizace.id} className="tabulka-radek-data tabulka-radek-organizace">
                      <div className="tabulka-bunka-hlavni">
                        <div>
                          <strong>{organizace.nazev}</strong>
                          <div className="micro">{organizace.slug}</div>
                        </div>
                      </div>
                      <div>
                        <strong>{formatujTypOrganizace(organizace.typ_organizace)}</strong>
                        <div className="micro">{organizace.je_aktivni ? "Aktivní" : "Pozastavená"}</div>
                      </div>
                      <div>
                        <strong>{organizace.kontaktni_email || "Bez e-mailu"}</strong>
                        <div className="micro">
                          {organizace.kontaktni_telefon || "Bez telefonu"} ·{" "}
                          {organizace.ma_vlastni_smtp ? "Vlastní SMTP" : "Systémové odesílání"}
                        </div>
                      </div>
                      <div>
                        <strong>{pocetMist} míst</strong>
                        <div className="micro">{pocetClenu} členů týmu</div>
                      </div>
                      <div>
                        <strong>{pocetAkci}</strong>
                        <div className="micro">Akcí v systému</div>
                      </div>
                      <div className="actions-wrap actions-wrap-end">
                        <Link className="button ghost" href={`/sprava/organizace/${organizace.id}`}>
                          Detail
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </PanelSekce>

            {profil.opravneni.sprava_obsahu ? (
              <PanelSekce
                nadpis="Nová organizace"
                popis="Založení nové obce, kulturního domu nebo samostatného pořadatele."
              >
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sObnovou(
                      () =>
                        vytvorOrganizaciSprava(
                          {
                            ...formularOrganizace,
                            slug: formularOrganizace.slug || vytvorSlug(formularOrganizace.nazev),
                            slug_subdomeny:
                              formularOrganizace.slug_subdomeny || vytvorSlug(formularOrganizace.nazev),
                            smtp_port: Number(formularOrganizace.smtp_port || 587),
                            smtp_timeout: Number(formularOrganizace.smtp_timeout || 20),
                            je_aktivni: true,
                          },
                          tokenSpravy,
                        ),
                      "Organizace byla vytvořena.",
                    );
                  }}
                >
                  <label className="pole">
                    <span className="pole-label">Název</span>
                    <input
                      value={formularOrganizace.nazev}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          nazev: event.target.value,
                          slug: vytvorSlug(event.target.value),
                        }))
                      }
                      required
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Slug</span>
                    <input
                      value={formularOrganizace.slug}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          slug: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Subdoména</span>
                    <input
                      value={formularOrganizace.slug_subdomeny}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          slug_subdomeny: vytvorSlug(event.target.value),
                        }))
                      }
                      placeholder="dolni-kralovice"
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Vlastní doména</span>
                    <input
                      value={formularOrganizace.vlastni_domena}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          vlastni_domena: event.target.value,
                        }))
                      }
                      placeholder="kultura.obec.cz"
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Typ</span>
                    <select
                      value={formularOrganizace.typ_organizace}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          typ_organizace: event.target.value,
                        }))
                      }
                    >
                      <option value="obec">Obec</option>
                      <option value="kulturni_dum">Kulturní dům</option>
                      <option value="poradatel">Pořadatel</option>
                    </select>
                  </label>
                  <label className="pole pole-cela check-line">
                    <input
                      type="checkbox"
                      checked={formularOrganizace.tenant_aktivni}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          tenant_aktivni: event.target.checked,
                        }))
                      }
                    />
                    <span>Veřejný tenant web je aktivní</span>
                  </label>
                  <label className="pole">
                    <span className="pole-label">Veřejný název</span>
                    <input
                      value={formularOrganizace.nazev_verejny}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          nazev_verejny: event.target.value,
                        }))
                      }
                      placeholder="Kulturní dům Dolní Kralovice"
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Logo URL</span>
                    <input
                      value={formularOrganizace.logo_url}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          logo_url: event.target.value,
                        }))
                      }
                      placeholder="https://..."
                    />
                  </label>
                  <label className="pole pole-cela">
                    <span className="pole-label">Veřejný popis</span>
                    <textarea
                      value={formularOrganizace.verejny_popis}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          verejny_popis: event.target.value,
                        }))
                      }
                      rows={4}
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Logo organizace</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          logo_soubor: event.target.files?.[0] ?? null,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Banner organizace</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          banner_soubor: event.target.files?.[0] ?? null,
                        }))
                      }
                    />
                  </label>
                  <label className="pole pole-cela">
                    <span className="pole-label">Popis banneru</span>
                    <input
                      value={formularOrganizace.banner_popis}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          banner_popis: event.target.value,
                        }))
                      }
                      placeholder="Večer v kulturním domě"
                    />
                  </label>
                  {nahledLogaOrganizace ? (
                    <div
                      className="admin-form-photo-preview admin-form-photo-preview-logo"
                      style={{ backgroundImage: `url('${nahledLogaOrganizace}')` }}
                    />
                  ) : null}
                  {nahledBanneruOrganizace ? (
                    <div
                      className="admin-form-photo-preview pole-cela"
                      style={{ backgroundImage: `url('${nahledBanneruOrganizace}')` }}
                    />
                  ) : null}
                  <label className="pole">
                    <span className="pole-label">Kontaktní e-mail</span>
                    <input
                      type="email"
                      value={formularOrganizace.kontaktni_email}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          kontaktni_email: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Kontaktní telefon</span>
                    <input
                      value={formularOrganizace.kontaktni_telefon}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          kontaktni_telefon: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole pole-cela">
                    <span className="pole-label">Fakturační název</span>
                    <input
                      value={formularOrganizace.fakturacni_nazev}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          fakturacni_nazev: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">IČO</span>
                    <input
                      value={formularOrganizace.ico}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          ico: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">DIČ</span>
                    <input
                      value={formularOrganizace.dic}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          dic: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole pole-cela">
                    <span className="pole-label">Fakturační ulice</span>
                    <input
                      value={formularOrganizace.fakturacni_ulice}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          fakturacni_ulice: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Město</span>
                    <input
                      value={formularOrganizace.fakturacni_mesto}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          fakturacni_mesto: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">PSČ</span>
                    <input
                      value={formularOrganizace.fakturacni_psc}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          fakturacni_psc: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Číslo účtu</span>
                    <input
                      value={formularOrganizace.cislo_uctu}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          cislo_uctu: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Kód banky</span>
                    <input
                      value={formularOrganizace.kod_banky}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          kod_banky: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">IBAN</span>
                    <input
                      value={formularOrganizace.iban}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          iban: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">SWIFT</span>
                    <input
                      value={formularOrganizace.swift}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          swift: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Hlavní barva</span>
                    <input
                      type="color"
                      value={formularOrganizace.hlavni_barva}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          hlavni_barva: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole pole-cela check-line">
                    <input
                      type="checkbox"
                      checked={formularOrganizace.smtp_aktivni}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_aktivni: event.target.checked,
                        }))
                      }
                    />
                    <span>Používat vlastní SMTP této organizace</span>
                  </label>
                  <label className="pole">
                    <span className="pole-label">SMTP host</span>
                    <input
                      value={formularOrganizace.smtp_host}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_host: event.target.value,
                        }))
                      }
                      placeholder="smtp.obec.cz"
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">SMTP port</span>
                    <input
                      type="number"
                      value={formularOrganizace.smtp_port}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_port: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">SMTP uživatel</span>
                    <input
                      value={formularOrganizace.smtp_uzivatel}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_uzivatel: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">SMTP heslo</span>
                    <input
                      type="password"
                      value={formularOrganizace.smtp_heslo}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_heslo: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Odesílací e-mail</span>
                    <input
                      type="email"
                      value={formularOrganizace.smtp_od_email}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_od_email: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Jméno odesílatele</span>
                    <input
                      value={formularOrganizace.smtp_od_jmeno}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_od_jmeno: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">SMTP timeout (s)</span>
                    <input
                      type="number"
                      value={formularOrganizace.smtp_timeout}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_timeout: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole check-line">
                    <input
                      type="checkbox"
                      checked={formularOrganizace.smtp_use_tls}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_use_tls: event.target.checked,
                        }))
                      }
                    />
                    <span>TLS</span>
                  </label>
                  <label className="pole check-line">
                    <input
                      type="checkbox"
                      checked={formularOrganizace.smtp_use_ssl}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_use_ssl: event.target.checked,
                        }))
                      }
                    />
                    <span>SSL</span>
                  </label>
                  <div className="actions-end pole-cela">
                    <button className="button primary" disabled={beziPrechod} type="submit">
                      {beziPrechod ? "Ukládám…" : "Vytvořit organizaci"}
                    </button>
                  </div>
                </form>
              </PanelSekce>
            ) : null}
          </div>
        </>
      ) : null}

      {sekce === "organizace-detail" && aktivniOrganizace ? (
        <>
          <HeroSekce
            stitek="Detail organizace"
            nadpis={aktivniOrganizace.nazev}
            popis="Tenant, branding, kontakty a provoz na jednom místě."
            detaily={
              <div className="sprava-panel-body stack-mini">
                <div className="detail-pole">
                  <span>Typ</span>
                  <strong>{formatujTypOrganizace(aktivniOrganizace.typ_organizace)}</strong>
                </div>
                <div className="detail-pole">
                  <span>Tenant</span>
                  <strong>{aktivniOrganizace.tenant_aktivni ? "Aktivní" : "Jen centrální katalog"}</strong>
                </div>
                <div className="detail-pole">
                  <span>Odesílání</span>
                  <strong>{aktivniOrganizace.ma_vlastni_smtp ? "Vlastní SMTP" : "Systémové SMTP"}</strong>
                </div>
                <div className="actions-wrap">
                  <Link className="button ghost" href="/sprava/organizace">
                    Zpět na organizace
                  </Link>
                </div>
              </div>
            }
          />
          <div className="admin-sekce-grid">
            <PanelSekce nadpis="Tenant a branding" popis="Subdoména, veřejný název, banner a kontaktní údaje.">
              <div className="stack">
                <div className="detail-grid">
                  <div className="detail-pole">
                    <span>Subdoména</span>
                    <strong>
                      {aktivniOrganizace.slug_subdomeny
                        ? `${aktivniOrganizace.slug_subdomeny}.kliknilistek.online`
                        : "Nepřiřazeno"}
                    </strong>
                  </div>
                  <div className="detail-pole">
                    <span>Vlastní doména</span>
                    <strong>{aktivniOrganizace.vlastni_domena || "Nepřiřazeno"}</strong>
                  </div>
                  <div className="detail-pole">
                    <span>Veřejný název</span>
                    <strong>{aktivniOrganizace.nazev_verejny || aktivniOrganizace.nazev}</strong>
                  </div>
                  <div className="detail-pole">
                    <span>Akcent</span>
                    <strong>{aktivniOrganizace.hlavni_barva || "#73E0BA"}</strong>
                  </div>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sObnovou(
                      () =>
                        upravOrganizaciSprava(
                          aktivniOrganizace.slug,
                          {
                            ...formularOrganizace,
                            slug: formularOrganizace.slug || vytvorSlug(formularOrganizace.nazev),
                            slug_subdomeny:
                              formularOrganizace.slug_subdomeny || vytvorSlug(formularOrganizace.nazev),
                            smtp_port: Number(formularOrganizace.smtp_port || 587),
                            smtp_timeout: Number(formularOrganizace.smtp_timeout || 20),
                          },
                          tokenSpravy,
                        ),
                      "Organizace byla upravena.",
                    );
                  }}
                >
                  <label className="pole">
                    <span className="pole-label">Název</span>
                    <input
                      value={formularOrganizace.nazev}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          nazev: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Slug</span>
                    <input
                      value={formularOrganizace.slug}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          slug: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Subdoména</span>
                    <input
                      value={formularOrganizace.slug_subdomeny}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          slug_subdomeny: vytvorSlug(event.target.value),
                        }))
                      }
                      placeholder="dolni-kralovice"
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Vlastní doména</span>
                    <input
                      value={formularOrganizace.vlastni_domena}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          vlastni_domena: event.target.value,
                        }))
                      }
                      placeholder="kultura.obec.cz"
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Typ</span>
                    <select
                      value={formularOrganizace.typ_organizace}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          typ_organizace: event.target.value,
                        }))
                      }
                    >
                      <option value="obec">Obec</option>
                      <option value="kulturni_dum">Kulturní dům</option>
                      <option value="poradatel">Pořadatel</option>
                    </select>
                  </label>
                  <label className="pole">
                    <span className="pole-label">Hlavní barva</span>
                    <input
                      type="color"
                      value={formularOrganizace.hlavni_barva}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          hlavni_barva: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole pole-cela check-line">
                    <input
                      type="checkbox"
                      checked={formularOrganizace.tenant_aktivni}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          tenant_aktivni: event.target.checked,
                        }))
                      }
                    />
                    <span>Organizace má vlastní veřejný tenant web</span>
                  </label>
                  <label className="pole">
                    <span className="pole-label">Veřejný název</span>
                    <input
                      value={formularOrganizace.nazev_verejny}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          nazev_verejny: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Logo URL</span>
                    <input
                      value={formularOrganizace.logo_url}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          logo_url: event.target.value,
                        }))
                      }
                      placeholder="https://..."
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Kontaktní e-mail</span>
                    <input
                      type="email"
                      value={formularOrganizace.kontaktni_email}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          kontaktni_email: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Telefon</span>
                    <input
                      value={formularOrganizace.kontaktni_telefon}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          kontaktni_telefon: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole pole-cela">
                    <span className="pole-label">Veřejný popis</span>
                    <textarea
                      rows={4}
                      value={formularOrganizace.verejny_popis}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          verejny_popis: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Logo soubor</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          logo_soubor: event.target.files?.[0] ?? null,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Banner soubor</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          banner_soubor: event.target.files?.[0] ?? null,
                        }))
                      }
                    />
                  </label>
                  <label className="pole pole-cela">
                    <span className="pole-label">Popis banneru</span>
                    <input
                      value={formularOrganizace.banner_popis}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          banner_popis: event.target.value,
                        }))
                      }
                      placeholder="Kulturní dům při večerní akci"
                    />
                  </label>
                  {aktualniLogoOrganizace ? (
                    <div
                      className="admin-form-photo-preview admin-form-photo-preview-logo"
                      style={{ backgroundImage: `url('${aktualniLogoOrganizace}')` }}
                    />
                  ) : null}
                  {aktualniBannerOrganizace ? (
                    <div
                      className="admin-form-photo-preview pole-cela"
                      style={{ backgroundImage: `url('${aktualniBannerOrganizace}')` }}
                    />
                  ) : null}
                  <label className="pole">
                    <span className="pole-label">Fakturační název</span>
                    <input
                      value={formularOrganizace.fakturacni_nazev}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          fakturacni_nazev: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">IČO</span>
                    <input
                      value={formularOrganizace.ico}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          ico: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">DIČ</span>
                    <input
                      value={formularOrganizace.dic}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          dic: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Číslo účtu</span>
                    <input
                      value={formularOrganizace.cislo_uctu}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          cislo_uctu: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Kód banky</span>
                    <input
                      value={formularOrganizace.kod_banky}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          kod_banky: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">IBAN</span>
                    <input
                      value={formularOrganizace.iban}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          iban: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">SWIFT</span>
                    <input
                      value={formularOrganizace.swift}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          swift: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole pole-cela">
                    <span className="pole-label">Fakturační ulice</span>
                    <input
                      value={formularOrganizace.fakturacni_ulice}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          fakturacni_ulice: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Město</span>
                    <input
                      value={formularOrganizace.fakturacni_mesto}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          fakturacni_mesto: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">PSČ</span>
                    <input
                      value={formularOrganizace.fakturacni_psc}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          fakturacni_psc: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole pole-cela check-line">
                    <input
                      type="checkbox"
                      checked={formularOrganizace.smtp_aktivni}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_aktivni: event.target.checked,
                        }))
                      }
                    />
                    <span>Organizace používá vlastní SMTP</span>
                  </label>
                  <label className="pole">
                    <span className="pole-label">SMTP host</span>
                    <input
                      value={formularOrganizace.smtp_host}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_host: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Port</span>
                    <input
                      type="number"
                      min={1}
                      value={formularOrganizace.smtp_port}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_port: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">SMTP uživatel</span>
                    <input
                      value={formularOrganizace.smtp_uzivatel}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_uzivatel: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Nové SMTP heslo</span>
                    <input
                      type="password"
                      value={formularOrganizace.smtp_heslo}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_heslo: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Odesílací e-mail</span>
                    <input
                      type="email"
                      value={formularOrganizace.smtp_od_email}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_od_email: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Jméno odesílatele</span>
                    <input
                      value={formularOrganizace.smtp_od_jmeno}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_od_jmeno: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Timeout</span>
                    <input
                      type="number"
                      min={1}
                      value={formularOrganizace.smtp_timeout}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_timeout: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole check-line">
                    <input
                      type="checkbox"
                      checked={formularOrganizace.smtp_use_tls}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_use_tls: event.target.checked,
                        }))
                      }
                    />
                    <span>TLS</span>
                  </label>
                  <label className="pole check-line">
                    <input
                      type="checkbox"
                      checked={formularOrganizace.smtp_use_ssl}
                      onChange={(event) =>
                        nastavFormularOrganizace((aktualni) => ({
                          ...aktualni,
                          smtp_use_ssl: event.target.checked,
                        }))
                      }
                    />
                    <span>SSL</span>
                  </label>
                  <div className="actions-end pole-cela">
                    <button className="button primary" disabled={beziPrechod} type="submit">
                      {beziPrechod ? "Ukládám…" : "Uložit organizaci"}
                    </button>
                  </div>
                </form>
              </div>
            </PanelSekce>
            <PanelSekce nadpis="Přehled organizace" popis="Co je teď napojené na tenant a veřejný web.">
              <div className="detail-grid">
                <div className="detail-pole">
                  <span>E-mail</span>
                  <strong>{aktivniOrganizace.kontaktni_email || "Neuvedeno"}</strong>
                </div>
                <div className="detail-pole">
                  <span>Telefon</span>
                  <strong>{aktivniOrganizace.kontaktni_telefon || "Neuvedeno"}</strong>
                </div>
                <div className="detail-pole">
                  <span>Logo</span>
                  <strong>{aktualniLogoOrganizace ? "Nahrané" : aktivniOrganizace.logo_url ? "Externí URL" : "Chybí"}</strong>
                </div>
                <div className="detail-pole">
                  <span>Banner</span>
                  <strong>
                    {aktualniBannerOrganizace ? "Nahraný banner" : "Banner zatím chybí"}
                  </strong>
                </div>
                <div className="detail-pole">
                  <span>Slug</span>
                  <strong>{aktivniOrganizace.slug}</strong>
                </div>
                <div className="detail-pole">
                  <span>Vytvořeno</span>
                  <strong>{formatujDatum(aktivniOrganizace.vytvoreno)}</strong>
                </div>
                <div className="detail-pole detail-pole-cela">
                  <span>Fakturační adresa</span>
                  <strong>
                    {[
                      aktivniOrganizace.fakturacni_nazev || aktivniOrganizace.nazev,
                      aktivniOrganizace.fakturacni_ulice,
                      [aktivniOrganizace.fakturacni_psc, aktivniOrganizace.fakturacni_mesto]
                        .filter(Boolean)
                        .join(" "),
                    ]
                      .filter(Boolean)
                      .join(", ") || "Neuvedeno"}
                  </strong>
                </div>
              </div>
            </PanelSekce>
            <PanelSekce nadpis="Navázaná místa" popis="Místa konání, která patří této organizaci.">
              <div className="admin-mini-list">
                {data.mistaKonani
                  .filter((misto) => misto.organizace === aktivniOrganizace.id)
                  .map((misto) => (
                    <div key={misto.id} className="admin-list-row">
                      <div>
                        <strong>{misto.nazev}</strong>
                        <div className="micro">
                          {misto.mesto} · kapacita {misto.kapacita}
                        </div>
                      </div>
                      <Link className="button ghost" href={`/sprava/mista/${misto.id}`}>
                        Detail místa
                      </Link>
                    </div>
                  ))}
              </div>
            </PanelSekce>
            <PanelSekce nadpis="Akce a tým" popis="Přímé vazby na program a obsluhu.">
              <div className="admin-mini-list">
                {data.akce
                  .filter((akce) => akce.organizace === aktivniOrganizace.id)
                  .map((akce) => (
                    <div key={akce.id} className="admin-list-row">
                      <div>
                        <strong>{akce.nazev}</strong>
                        <div className="micro">{formatujDatum(akce.zacatek)}</div>
                      </div>
                      <Link className="button ghost" href={`/sprava/akce/${akce.slug}`}>
                        Detail akce
                      </Link>
                    </div>
                  ))}
                {data.clenstvi
                  .filter((clen) => clen.organizace === aktivniOrganizace.id)
                  .map((clen) => (
                    <div key={clen.id} className="admin-list-row">
                      <div>
                        <strong>{clen.uzivatel_jmeno}</strong>
                        <div className="micro">{formatujRoliOrganizace(clen.role)}</div>
                      </div>
                      <Link className="button ghost" href={`/sprava/uzivatele/${clen.id}`}>
                        Detail uživatele
                      </Link>
                    </div>
                  ))}
              </div>
            </PanelSekce>
          </div>
        </>
      ) : null}

      {sekce === "mista" ? (
        <>
          <HeroSekce
            stitek="Místa konání"
            nadpis="Sály, kina a jejich plánky"
            popis="Místa konání, jejich kapacity a plánky."
          />
          <div className="admin-sekce-grid">
            <PanelSekce
              nadpis="Přehled míst"
              popis="Kapacity míst a rozložení podle měst."
            >
              <div className="grafy-grid">
                <GrafSloupcovy
                  nadpis="Kapacita míst"
                  popis="Kolik míst nabízí jednotlivé prostory."
                  polozky={grafyMist.kapacity}
                />
                <GrafRozlozeni
                  nadpis="Města"
                  popis="Jak jsou místa rozložená podle lokality."
                  polozky={grafyMist.mesta}
                />
              </div>
            </PanelSekce>
            <PanelSekce nadpis="Seznam míst" popis="Přehled všech míst s přímým vstupem do detailu.">
              <div className="tabulka tabulka-siroka">
                <div className="tabulka-radek-hlavni tabulka-radek-mista">
                  <span>Místo</span>
                  <span>Organizace</span>
                  <span>Město</span>
                  <span>Kapacita</span>
                  <span>Adresa</span>
                  <span />
                </div>
                {data.mistaKonani.map((misto) => (
                  <article key={misto.id} className="tabulka-radek-data tabulka-radek-mista">
                    <div className="tabulka-bunka-hlavni">
                      <div>
                        <strong>{misto.nazev}</strong>
                        <div className="micro">ID {misto.id}</div>
                      </div>
                    </div>
                    <div>
                      <strong>{misto.organizace_nazev}</strong>
                      <div className="micro">Napojená organizace</div>
                    </div>
                    <div>
                      <strong>{misto.mesto}</strong>
                      <div className="micro">Lokalita</div>
                    </div>
                    <div>
                      <strong>{misto.kapacita}</strong>
                      <div className="micro">Míst</div>
                    </div>
                    <div>
                      <strong>{misto.adresa || "Bez adresy"}</strong>
                      <div className="micro">Adresa místa</div>
                    </div>
                    <div className="actions-wrap actions-wrap-end">
                      <Link className="button ghost" href={`/sprava/mista/${misto.id}`}>
                        Detail
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </PanelSekce>
            {profil.opravneni.sprava_obsahu ? (
              <PanelSekce nadpis="Nové místo konání" popis="Založení sálu, kina nebo víceúčelového prostoru.">
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sObnovou(
                      () =>
                        vytvorMistoKonaniSprava(
                          {
                            organizace: Number(formularMista.organizace),
                            nazev: formularMista.nazev,
                            adresa: formularMista.adresa,
                            mesto: formularMista.mesto,
                            kapacita: Number(formularMista.kapacita),
                            hlavni_fotka: formularMista.hlavni_fotka,
                          },
                          tokenSpravy,
                        ),
                      "Místo konání bylo vytvořeno.",
                    );
                  }}
                >
                  <label className="pole">
                    <span className="pole-label">Organizace</span>
                    <select
                      value={formularMista.organizace}
                      onChange={(event) =>
                        nastavFormularMista((aktualni) => ({
                          ...aktualni,
                          organizace: event.target.value,
                        }))
                      }
                    >
                      {data.organizace.map((organizace) => (
                        <option key={organizace.id} value={organizace.id}>
                          {organizace.nazev}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="pole">
                    <span className="pole-label">Název místa</span>
                    <input
                      value={formularMista.nazev}
                      onChange={(event) =>
                        nastavFormularMista((aktualni) => ({ ...aktualni, nazev: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Adresa</span>
                    <input
                      value={formularMista.adresa}
                      onChange={(event) =>
                        nastavFormularMista((aktualni) => ({ ...aktualni, adresa: event.target.value }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Město</span>
                    <input
                      value={formularMista.mesto}
                      onChange={(event) =>
                        nastavFormularMista((aktualni) => ({ ...aktualni, mesto: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Kapacita</span>
                    <input
                      type="number"
                      min="0"
                      value={formularMista.kapacita}
                      onChange={(event) =>
                        nastavFormularMista((aktualni) => ({
                          ...aktualni,
                          kapacita: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole pole-cela">
                    <span className="pole-label">Fotka místa</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        nastavFormularMista((aktualni) => ({
                          ...aktualni,
                          hlavni_fotka: event.target.files?.[0] ?? null,
                        }))
                      }
                    />
                    <span className="pole-help">
                      Nahraj hlavní fotku sálu nebo prostoru. Zobrazí se pak i na veřejném webu.
                    </span>
                  </label>
                  {nahledFotkyMista ? (
                    <div
                      className="admin-form-photo-preview pole-cela"
                      style={{ backgroundImage: `url('${nahledFotkyMista}')` }}
                    />
                  ) : null}
                  <div className="actions-end pole-cela">
                    <button className="button primary" disabled={beziPrechod} type="submit">
                      {beziPrechod ? "Ukládám…" : "Vytvořit místo"}
                    </button>
                  </div>
                </form>
              </PanelSekce>
            ) : null}
          </div>
        </>
      ) : null}

      {sekce === "akce" ? (
        <>
          <HeroSekce
            stitek="Akce"
            nadpis="Program, kapacity a prodejní stav"
            popis="Program, kapacity a vstup do detailu akce."
          />
          <div className="admin-sekce-grid">
            <PanelSekce
              nadpis="Přehled akcí"
              popis="Stavy programu a výkon nejsilnějších akcí."
            >
              <div className="grafy-grid">
                <GrafRozlozeni
                  nadpis="Stavy akcí"
                  popis="Kolik akcí je v návrhu, provozu nebo uzavřeno."
                  polozky={grafyAkci.stavy}
                />
                <GrafSloupcovy
                  nadpis="Prodané vstupenky"
                  popis="Výkon akcí podle prodaných kusů."
                  polozky={grafyAkci.vykon}
                />
              </div>
            </PanelSekce>
            <PanelSekce nadpis="Seznam akcí" popis="Program se vstupem do detailu každé akce.">
              <div className="tabulka tabulka-siroka">
                <div className="tabulka-radek-hlavni tabulka-radek-akce">
                  <span>Akce</span>
                  <span>Organizace</span>
                  <span>Místo a termín</span>
                  <span>Kapacita</span>
                  <span>Kategorie</span>
                  <span />
                </div>
                {data.akce.map((akce) => {
                  const pocetKategorii = data.kategorieVstupenek.filter(
                    (kategorie) => kategorie.akce === akce.id,
                  ).length;
                  return (
                    <article key={akce.id} className="tabulka-radek-data tabulka-radek-akce">
                      <div className="tabulka-bunka-hlavni">
                        <div>
                          <strong>{akce.nazev}</strong>
                          <div className="micro">{formatujStavAkce(akce.stav)}</div>
                        </div>
                      </div>
                      <div>
                        <strong>{akce.organizace_nazev}</strong>
                        <div className="micro">Pořadatel</div>
                      </div>
                      <div>
                        <strong>{akce.misto_konani_nazev}</strong>
                        <div className="micro">{formatujDatum(akce.zacatek)}</div>
                      </div>
                      <div>
                        <strong>{akce.kapacita}</strong>
                        <div className="micro">Míst</div>
                      </div>
                      <div>
                        <strong>{pocetKategorii}</strong>
                        <div className="micro">Kategorie</div>
                      </div>
                      <div className="actions-wrap actions-wrap-end">
                        <Link className="button ghost" href={`/sprava/akce/${akce.slug}`}>
                          Detail
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </PanelSekce>
            {profil.opravneni.sprava_obsahu ? (
              <PanelSekce nadpis="Nová akce" popis="Založení nové kulturní akce s vazbou na místo konání.">
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sObnovou(
                      () =>
                        vytvorAkciSprava(
                          {
                            organizace: Number(formularAkce.organizace),
                            nazev: formularAkce.nazev,
                            slug: formularAkce.slug || vytvorSlug(formularAkce.nazev),
                            perex: "",
                            popis: formularAkce.popis,
                            hlavni_fotka_url: "",
                            hlavni_fotka: formularAkce.hlavni_fotka,
                            video_url: "",
                            misto_konani: Number(formularAkce.misto_konani),
                            zacatek: new Date(formularAkce.zacatek).toISOString(),
                            konec: formularAkce.konec ? new Date(formularAkce.konec).toISOString() : null,
                            stav: formularAkce.stav,
                            kapacita: Number(formularAkce.kapacita),
                            rezervace_platnost_minuty: Number(formularAkce.rezervace_platnost_minuty),
                            je_doporucena: formularAkce.je_doporucena,
                          },
                          tokenSpravy,
                        ),
                      "Akce byla vytvořena.",
                    );
                  }}
                >
                  <label className="pole">
                    <span className="pole-label">Organizace</span>
                    <select
                      value={formularAkce.organizace}
                      onChange={(event) =>
                        nastavFormularAkce((aktualni) => ({
                          ...aktualni,
                          organizace: event.target.value,
                          misto_konani: "",
                        }))
                      }
                    >
                      {data.organizace.map((organizace) => (
                        <option key={organizace.id} value={organizace.id}>
                          {organizace.nazev}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="pole">
                    <span className="pole-label">Název akce</span>
                    <input
                      value={formularAkce.nazev}
                      onChange={(event) =>
                        nastavFormularAkce((aktualni) => ({
                          ...aktualni,
                          nazev: event.target.value,
                          slug: vytvorSlug(event.target.value),
                        }))
                      }
                      required
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Slug</span>
                    <input
                      value={formularAkce.slug}
                      onChange={(event) =>
                        nastavFormularAkce((aktualni) => ({ ...aktualni, slug: event.target.value }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Místo konání</span>
                    <select
                      value={formularAkce.misto_konani}
                      onChange={(event) =>
                        nastavFormularAkce((aktualni) => ({
                          ...aktualni,
                          misto_konani: event.target.value,
                        }))
                      }
                    >
                      <option value="">Vyber místo</option>
                      {mistaProAkci.map((misto) => (
                        <option key={misto.id} value={misto.id}>
                          {misto.nazev}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="pole">
                    <span className="pole-label">Začátek</span>
                    <input
                      type="datetime-local"
                      value={formularAkce.zacatek}
                      onChange={(event) =>
                        nastavFormularAkce((aktualni) => ({ ...aktualni, zacatek: event.target.value }))
                      }
                      required
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Konec</span>
                    <input
                      type="datetime-local"
                      value={formularAkce.konec}
                      onChange={(event) =>
                        nastavFormularAkce((aktualni) => ({ ...aktualni, konec: event.target.value }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Kapacita</span>
                    <input
                      type="number"
                      min="0"
                      value={formularAkce.kapacita}
                      onChange={(event) =>
                        nastavFormularAkce((aktualni) => ({ ...aktualni, kapacita: event.target.value }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Platnost rezervace (min)</span>
                    <input
                      type="number"
                      min="1"
                      value={formularAkce.rezervace_platnost_minuty}
                      onChange={(event) =>
                        nastavFormularAkce((aktualni) => ({
                          ...aktualni,
                          rezervace_platnost_minuty: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole pole-cela">
                    <span className="pole-label">Popis</span>
                    <textarea
                      rows={4}
                      value={formularAkce.popis}
                      onChange={(event) =>
                        nastavFormularAkce((aktualni) => ({ ...aktualni, popis: event.target.value }))
                      }
                    />
                  </label>
                  <label className="pole pole-cela">
                    <span className="pole-label">Hlavní fotka akce</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        nastavFormularAkce((aktualni) => ({
                          ...aktualni,
                          hlavni_fotka: event.target.files?.[0] ?? null,
                        }))
                      }
                    />
                    <span className="pole-help">
                      Nahraj titulní fotku akce. Pokud ji nevybereš, zůstane bez vlastní nahrané fotky.
                    </span>
                  </label>
                  {nahledFotkyAkce ? (
                    <div
                      className="admin-form-photo-preview pole-cela"
                      style={{ backgroundImage: `url('${nahledFotkyAkce}')` }}
                    />
                  ) : null}
                  <div className="actions-end pole-cela">
                    <button className="button primary" disabled={beziPrechod} type="submit">
                      {beziPrechod ? "Ukládám…" : "Vytvořit akci"}
                    </button>
                  </div>
                </form>
              </PanelSekce>
            ) : null}
          </div>
        </>
      ) : null}

      {sekce === "vstupenky" ? (
        <>
          <HeroSekce
            stitek="Vstupenky"
            nadpis="Vydané vstupenky a jejich stav"
            popis="Jednotlivé vstupenky, jejich stav a vazby."
          />
          <PanelSekce nadpis="Přehled vstupenek" popis="Stavy vstupenek a nejsilnější akce podle vydaných kusů.">
            <div className="grafy-grid">
              <GrafRozlozeni
                nadpis="Stavy vstupenek"
                popis="Kolik kusů je rezervováno, platných nebo odbavených."
                polozky={grafyVstupenek.stavy}
              />
              <GrafSloupcovy
                nadpis="Vstupenky podle akce"
                popis="Nejsilnější akce podle počtu vydaných vstupenek."
                polozky={grafyVstupenek.podleAkci}
              />
            </div>
          </PanelSekce>
          <PanelSekce nadpis="Seznam vstupenek" popis="Všechny vstupenky napříč objednávkami.">
            <UlozenePohledy
              polozky={[
                { id: "vse", nazev: "Všechny", aktivni: pohledVstupenek === "vse", onClick: () => { nastavPohledVstupenek("vse"); nastavFiltrVstupenek({ hledani: "", stav: "vse" }); nastavRazeniVstupenek("nejnovejsi"); } },
                { id: "neodeslane", nazev: "Neodeslané", aktivni: pohledVstupenek === "neodeslane", onClick: () => { nastavPohledVstupenek("neodeslane"); nastavFiltrVstupenek({ hledani: "", stav: "vse" }); nastavRazeniVstupenek("nejnovejsi"); } },
                { id: "platne", nazev: "Platné", aktivni: pohledVstupenek === "platne", onClick: () => { nastavPohledVstupenek("platne"); nastavFiltrVstupenek({ hledani: "", stav: "platna" }); nastavRazeniVstupenek("nejnovejsi"); } },
                { id: "odbavene", nazev: "Odbavené", aktivni: pohledVstupenek === "odbavene", onClick: () => { nastavPohledVstupenek("odbavene"); nastavFiltrVstupenek({ hledani: "", stav: "odbavena" }); nastavRazeniVstupenek("nejnovejsi"); } },
              ]}
            />
            <div className="form-grid admin-filtry admin-filtry-kompaktni">
              <label className="pole">
                <span className="pole-label">Hledání</span>
                <input
                  value={filtrVstupenek.hledani}
                  onChange={(event) => {
                    nastavPohledVstupenek("vse");
                    nastavFiltrVstupenek((aktualni) => ({ ...aktualni, hledani: event.target.value }));
                  }}
                  placeholder="Kód, akce, zákazník nebo místo"
                />
              </label>
              <label className="pole">
                <span className="pole-label">Stav</span>
                <select
                  value={filtrVstupenek.stav}
                  onChange={(event) => {
                    nastavPohledVstupenek("vse");
                    nastavFiltrVstupenek((aktualni) => ({ ...aktualni, stav: event.target.value }));
                  }}
                >
                  <option value="vse">Všechny</option>
                  <option value="rezervovana">Rezervovaná</option>
                  <option value="platna">Platná</option>
                  <option value="odbavena">Odbavená</option>
                  <option value="zrusena">Zrušená</option>
                  <option value="vracena">Vrácená</option>
                </select>
              </label>
              <label className="pole">
                <span className="pole-label">Řazení</span>
                <select
                  value={razeniVstupenek}
                  onChange={(event) => {
                    nastavPohledVstupenek("vse");
                    nastavRazeniVstupenek(event.target.value as RazeniVstupenek);
                  }}
                >
                  <option value="nejnovejsi">Nejnovější kódy</option>
                  <option value="stav">Podle stavu</option>
                  <option value="akce">Podle akce</option>
                </select>
              </label>
            </div>
            {vybraneVstupenkyData.length ? (
              <div className="hromadna-akcni-lista">
                <div className="hromadna-akcni-info">
                  Vybráno <strong>{vybraneVstupenkyData.length}</strong> vstupenek
                </div>
                <div className="actions-wrap">
                  <button
                    className="button ghost"
                    type="button"
                    onClick={() =>
                      stahniCsv(
                        "vstupenky-vyber.csv",
                        [
                          ["Kód", "Objednávka", "Akce", "Kategorie", "Místo", "Stav", "E-mail", "Jméno"],
                          ...vybraneVstupenkyData.map((vstupenka) => [
                            vstupenka.kod,
                            vstupenka.objednavka_verejne_id,
                            vstupenka.akce_nazev,
                            vstupenka.kategorie_vstupenky_nazev,
                            vstupenka.oznaceni_mista ?? "",
                            formatujStavVstupenky(vstupenka.stav),
                            vstupenka.email_zakaznika,
                            vstupenka.jmeno_zakaznika,
                          ]),
                        ],
                      )
                    }
                  >
                    Export CSV
                  </button>
                  <button className="button ghost" type="button" onClick={() => nastavVybraneVstupenky([])}>
                    Zrušit výběr
                  </button>
                </div>
              </div>
            ) : null}
            <div className="seznam-s-panelem">
            <div className="tabulka tabulka-siroka">
              <div className="tabulka-radek-hlavni tabulka-radek-vstupenky">
                <label className="checkbox-hromadny">
                  <input
                    type="checkbox"
                    checked={
                      zobrazeneVstupenky.length > 0 &&
                      zobrazeneVstupenky.every((vstupenka) => vybraneVstupenky.includes(vstupenka.kod))
                    }
                    onChange={(event) =>
                      nastavVybraneVstupenky((aktualni) =>
                        event.target.checked
                          ? Array.from(new Set([...aktualni, ...zobrazeneVstupenky.map((vstupenka) => vstupenka.kod)]))
                          : aktualni.filter((kod) => !zobrazeneVstupenky.some((vstupenka) => vstupenka.kod === kod)),
                      )
                    }
                  />
                </label>
                <span>Vstupenka</span>
                <span>Akce</span>
                <span>Kategorie</span>
                <span>Místo</span>
                <span>Stav</span>
                <span />
              </div>
              {zobrazeneVstupenky.map((vstupenka) => (
                <div
                  key={vstupenka.kod}
                  className={`tabulka-radek-data tabulka-radek-vstupenky tabulka-radek-interaktivni${rychlyDetailVstupenky === vstupenka.kod ? " aktivni-radek" : ""}`}
                  onClick={() => nastavRychlyDetailVstupenky(vstupenka.kod)}
                >
                  <label className="checkbox-hromadny">
                    <input
                      type="checkbox"
                      checked={vybraneVstupenky.includes(vstupenka.kod)}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) =>
                        nastavVybraneVstupenky((aktualni) =>
                          event.target.checked
                            ? [...aktualni, vstupenka.kod]
                            : aktualni.filter((kod) => kod !== vstupenka.kod),
                        )
                      }
                    />
                  </label>
                  <div className="tabulka-bunka-hlavni">
                    <strong>{vstupenka.kod}</strong>
                    <div className="micro">{vstupenka.objednavka_verejne_id}</div>
                  </div>
                  <div>
                    <strong>{vstupenka.akce_nazev}</strong>
                    <div className="micro">Akce</div>
                  </div>
                  <div>
                    <strong>{vstupenka.kategorie_vstupenky_nazev}</strong>
                    <div className="micro">Typ vstupenky</div>
                  </div>
                  <div>
                    <strong>
                      {vstupenka.oznaceni_mista
                        ? formatujKratkeOznaceniMista(vstupenka.oznaceni_mista)
                        : "Bez místa"}
                    </strong>
                    <div className="micro">Umístění</div>
                  </div>
                  <div>
                    <strong>{formatujStavVstupenky(vstupenka.stav)}</strong>
                    <div className="micro">{vstupenka.dorucena ? "Doručeno" : "Čeká na doručení"}</div>
                  </div>
                  <div className="actions-wrap actions-wrap-end">
                    <Link className="button ghost" href={`/sprava/vstupenky/${vstupenka.kod}`} onClick={(event) => event.stopPropagation()}>
                      Detail
                    </Link>
                    <Link
                      className="button ghost"
                      href={`/sprava/objednavky/${vstupenka.objednavka_verejne_id}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      Objednávka
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <RychlyDetailPanel
              nadpis={aktivniVstupenkaQuick?.kod ?? "Vyber vstupenku"}
              podnadpis="Rychlý detail vstupenky"
              akce={
                aktivniVstupenkaQuick ? (
                  <Link className="button ghost mini" href={`/sprava/vstupenky/${aktivniVstupenkaQuick.kod}`}>
                    Otevřít detail
                  </Link>
                ) : null
              }
            >
              {aktivniVstupenkaQuick ? (
                <div className="rychly-detail-grid">
                  <div className="detail-pole"><span>Akce</span><strong>{aktivniVstupenkaQuick.akce_nazev}</strong></div>
                  <div className="detail-pole"><span>Stav</span><strong>{formatujStavVstupenky(aktivniVstupenkaQuick.stav)}</strong></div>
                  <div className="detail-pole"><span>Kategorie</span><strong>{aktivniVstupenkaQuick.kategorie_vstupenky_nazev}</strong></div>
                  <div className="detail-pole"><span>Místo</span><strong>{aktivniVstupenkaQuick.oznaceni_mista ? formatujKratkeOznaceniMista(aktivniVstupenkaQuick.oznaceni_mista) : "Bez místa"}</strong></div>
                  <div className="detail-pole"><span>Zákazník</span><strong>{aktivniVstupenkaQuick.jmeno_zakaznika || "Bez jména"}</strong></div>
                  <div className="detail-pole"><span>E-mail</span><strong>{aktivniVstupenkaQuick.email_zakaznika}</strong></div>
                  <div className="detail-pole detail-pole-cela"><span>Objednávka</span><strong>{aktivniVstupenkaQuick.objednavka_verejne_id}</strong></div>
                </div>
              ) : (
                <PrazdnyStav text="Kliknutím na řádek otevřeš rychlý přehled vstupenky a vazeb na objednávku." />
              )}
            </RychlyDetailPanel>
            </div>
            <Strankovani
              celkem={filtrovaneVstupenky.length}
              strana={Math.min(stranaVstupenek, pocetStranVstupenek)}
              pocetStran={pocetStranVstupenek}
              velikostStranky={velikostStrankyVstupenek}
              priZmeneVelikosti={nastavVelikostStrankyVstupenek}
              priPredchozi={() => nastavStranuVstupenek((aktualni) => Math.max(1, aktualni - 1))}
              priDalsi={() =>
                nastavStranuVstupenek((aktualni) => Math.min(pocetStranVstupenek, aktualni + 1))
              }
              priSkokuNaStranu={nastavStranuVstupenek}
            />
          </PanelSekce>
        </>
      ) : null}

      {sekce === "vstupenka-detail" && aktivniVstupenka ? (
        <>
          <HeroSekce
            stitek="Detail vstupenky"
            nadpis={aktivniVstupenka.kod}
            popis="Stav, zákazník, objednávka i přímé odkazy na veřejnou vstupenku a PDF."
            detaily={
              <div className="sprava-panel-body stack-mini">
                <div className="detail-pole">
                  <span>Stav</span>
                  <strong>{formatujStavVstupenky(aktivniVstupenka.stav)}</strong>
                </div>
              </div>
            }
          />
          <div className="admin-sekce-grid">
            <PanelSekce nadpis="Vstupenka" popis="Základní provozní údaje o kusu.">
              <div className="detail-grid">
                <div className="detail-pole">
                  <span>Akce</span>
                  <strong>{aktivniVstupenka.akce_nazev}</strong>
                </div>
                <div className="detail-pole">
                  <span>Kategorie</span>
                  <strong>{aktivniVstupenka.kategorie_vstupenky_nazev}</strong>
                </div>
                <div className="detail-pole">
                  <span>Místo</span>
                  <strong>
                    {aktivniVstupenka.oznaceni_mista
                      ? formatujKratkeOznaceniMista(aktivniVstupenka.oznaceni_mista)
                      : "Bez místa"}
                  </strong>
                </div>
                <div className="detail-pole">
                  <span>Doručeno</span>
                  <strong>
                    {aktivniVstupenka.dorucena ? formatujDatum(aktivniVstupenka.dorucena) : "Ne"}
                  </strong>
                </div>
              </div>
            </PanelSekce>
            <PanelSekce nadpis="Zákazník a vazby" popis="Objednávka a kontaktní údaje.">
              <div className="detail-grid">
                <div className="detail-pole">
                  <span>Zákazník</span>
                  <strong>{aktivniVstupenka.jmeno_zakaznika || "Bez jména"}</strong>
                </div>
                <div className="detail-pole">
                  <span>E-mail</span>
                  <strong>{aktivniVstupenka.email_zakaznika}</strong>
                </div>
                <div className="detail-pole">
                  <span>Telefon</span>
                  <strong>{aktivniVstupenka.telefon_zakaznika || "Neuvedeno"}</strong>
                </div>
              </div>
              <div className="actions-wrap">
                <Link
                  className="button ghost"
                  href={`/sprava/objednavky/${aktivniVstupenka.objednavka_verejne_id}`}
                >
                  Detail objednávky
                </Link>
                <Link className="button ghost" href={`/vstupenka/${aktivniVstupenka.kod}`} target="_blank">
                  Veřejná vstupenka
                </Link>
                <a
                  className="button ghost"
                  href={`/api_proxy/vstupenky/${aktivniVstupenka.kod}/pdf/`}
                  target="_blank"
                >
                  PDF
                </a>
              </div>
            </PanelSekce>
          </div>
        </>
      ) : null}

      {sekce === "objednavky" ? (
        <>
          <HeroSekce
            stitek="Objednávky"
            nadpis="Rezervace, košíky a rychlé provozní zásahy"
            popis="Objednávky, filtrování a rychlý vstup do detailu."
          />
          <div className="admin-sekce-grid">
            <PanelSekce
              nadpis="Přehled objednávek"
              popis="Stavy objednávek a rozložení podle akcí."
            >
              <div className="grafy-grid">
                <GrafRozlozeni
                  nadpis="Stavy objednávek"
                  popis="Kolik objednávek čeká, je zaplaceno nebo vráceno."
                  polozky={grafyObjednavek.stavy}
                />
                <GrafSloupcovy
                  nadpis="Objednávky podle akce"
                  popis="Kde vzniká nejvíc zákaznických případů."
                  polozky={grafyObjednavek.podleAkci}
                />
              </div>
          </PanelSekce>
          <PanelSekce nadpis="Seznam objednávek" popis="Filtrovaný přehled s přímým detailem.">
            <UlozenePohledy
              polozky={[
                { id: "vse", nazev: "Všechny", aktivni: pohledObjednavek === "vse", onClick: () => { nastavPohledObjednavek("vse"); nastavFiltrObjednavek({ hledani: "", stav: "vse" }); nastavRazeniObjednavek("nejnovejsi"); } },
                { id: "ceka_na_platbu", nazev: "Čeká na platbu", aktivni: pohledObjednavek === "ceka_na_platbu", onClick: () => { nastavPohledObjednavek("ceka_na_platbu"); nastavFiltrObjednavek({ hledani: "", stav: "ceka_na_platbu" }); nastavRazeniObjednavek("nejnovejsi"); } },
                { id: "zaplacene", nazev: "Zaplacené", aktivni: pohledObjednavek === "zaplacene", onClick: () => { nastavPohledObjednavek("zaplacene"); nastavFiltrObjednavek({ hledani: "", stav: "zaplaceno" }); nastavRazeniObjednavek("nejnovejsi"); } },
                { id: "vracene", nazev: "Vrácené", aktivni: pohledObjednavek === "vracene", onClick: () => { nastavPohledObjednavek("vracene"); nastavFiltrObjednavek({ hledani: "", stav: "vraceno" }); nastavRazeniObjednavek("nejnovejsi"); } },
              ]}
            />
            <div className="form-grid admin-filtry admin-filtry-kompaktni">
              <label className="pole">
                <span className="pole-label">Hledání</span>
                <input
                  value={filtrObjednavek.hledani}
                  onChange={(event) => {
                    nastavPohledObjednavek("vse");
                    nastavFiltrObjednavek((aktualni) => ({
                      ...aktualni,
                      hledani: event.target.value,
                    }));
                  }}
                    placeholder="ID, e-mail, jméno, telefon nebo kód vstupenky"
                  />
                </label>
                <label className="pole">
                  <span className="pole-label">Stav</span>
                  <select
                    value={filtrObjednavek.stav}
                  onChange={(event) => {
                    nastavPohledObjednavek("vse");
                    nastavFiltrObjednavek((aktualni) => ({ ...aktualni, stav: event.target.value }));
                  }}
                  >
                    <option value="vse">Všechny</option>
                    <option value="ceka_na_platbu">Čeká na platbu</option>
                    <option value="zaplaceno">Zaplaceno</option>
                    <option value="zruseno">Zrušeno</option>
                    <option value="vraceno">Vráceno</option>
                  </select>
                </label>
                <label className="pole">
                  <span className="pole-label">Řazení</span>
                  <select
                    value={razeniObjednavek}
                  onChange={(event) => {
                    nastavPohledObjednavek("vse");
                    nastavRazeniObjednavek(event.target.value as RazeniObjednavek);
                  }}
                  >
                    <option value="nejnovejsi">Nejnovější</option>
                    <option value="nejstarsi">Nejstarší</option>
                    <option value="castka_desc">Částka od nejvyšší</option>
                    <option value="castka_asc">Částka od nejnižší</option>
                  </select>
                </label>
              </div>
              {vybraneObjednavkyData.length ? (
                <div className="hromadna-akcni-lista">
                  <div className="hromadna-akcni-info">
                    Vybráno <strong>{vybraneObjednavkyData.length}</strong> objednávek
                  </div>
                  <div className="actions-wrap">
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() =>
                        void provedHromadnouAkci(
                          vybraneObjednavkyData
                            .filter((objednavka) => objednavka.stav === "ceka_na_platbu")
                            .map((objednavka) => () => potvrditHotovostObjednavky(objednavka.verejne_id, tokenSpravy)),
                          "Vybrané objednávky byly označeny jako zaplacené.",
                          () => nastavVybraneObjednavky([]),
                        )
                      }
                    >
                      Potvrdit hotovost
                    </button>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() =>
                        void provedHromadnouAkci(
                          vybraneObjednavkyData
                            .filter((objednavka) => objednavka.stav === "zaplaceno")
                            .map((objednavka) => () => dorucVstupenkyObjednavky(objednavka.verejne_id, tokenSpravy)),
                          "Vybraným objednávkám byly znovu odeslány vstupenky.",
                          () => nastavVybraneObjednavky([]),
                        )
                      }
                    >
                      Odeslat vstupenky
                    </button>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() =>
                        void provedHromadnouAkci(
                          vybraneObjednavkyData
                            .filter((objednavka) => ["ceka_na_platbu", "zaplaceno"].includes(objednavka.stav))
                            .map((objednavka) => () => stornovatObjednavku(objednavka.verejne_id, tokenSpravy)),
                          "Vybrané objednávky byly stornovány.",
                          () => nastavVybraneObjednavky([]),
                        )
                      }
                    >
                      Storno
                    </button>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() =>
                        void provedHromadnouAkci(
                          vybraneObjednavkyData
                            .filter((objednavka) => objednavka.stav === "zaplaceno")
                            .map((objednavka) => () => vratitObjednavku(objednavka.verejne_id, tokenSpravy)),
                          "Vybrané objednávky byly vráceny.",
                          () => nastavVybraneObjednavky([]),
                        )
                      }
                    >
                      Vrátit
                    </button>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() =>
                        stahniCsv(
                          "objednavky-vyber.csv",
                          [
                            ["ID", "Zákazník", "E-mail", "Stav", "Úhrada", "Proforma", "Celkem", "Vytvořeno"],
                            ...vybraneObjednavkyData.map((objednavka) => [
                              objednavka.verejne_id,
                              objednavka.jmeno_zakaznika,
                              objednavka.email_zakaznika,
                              formatujStavObjednavky(objednavka.stav),
                              formatujZpusobUhrady(objednavka.zpusob_uhrady),
                              objednavka.proforma_doklad
                                ? `${objednavka.proforma_doklad.cislo_dokladu} • ${formatujStavProformy(objednavka.proforma_doklad.stav)}`
                                : "",
                              formatujCastku(objednavka.celkem, objednavka.mena),
                              formatujDatum(objednavka.vytvoreno),
                            ]),
                          ],
                        )
                      }
                    >
                      Export CSV
                    </button>
                    <button className="button ghost" type="button" onClick={() => nastavVybraneObjednavky([])}>
                      Zrušit výběr
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="seznam-s-panelem">
              <div className="tabulka tabulka-siroka">
                <div className="tabulka-radek-hlavni tabulka-radek-objednavky">
                  <label className="checkbox-hromadny">
                    <input
                      type="checkbox"
                      checked={
                        zobrazeneObjednavky.length > 0 &&
                        zobrazeneObjednavky.every((objednavka) => vybraneObjednavky.includes(objednavka.verejne_id))
                      }
                      onChange={(event) =>
                        nastavVybraneObjednavky((aktualni) =>
                          event.target.checked
                            ? Array.from(
                                new Set([...aktualni, ...zobrazeneObjednavky.map((objednavka) => objednavka.verejne_id)]),
                              )
                            : aktualni.filter(
                                (id) => !zobrazeneObjednavky.some((objednavka) => objednavka.verejne_id === id),
                              ),
                        )
                      }
                    />
                  </label>
                  <span>Objednávka</span>
                  <span>Zákazník</span>
                  <span>Stav a rezervace</span>
                  <span>Úhrada</span>
                  <span>Celkem</span>
                  <span>Akce</span>
                  <span />
                </div>
                {zobrazeneObjednavky.map((objednavka) => (
                  <div
                    key={objednavka.verejne_id}
                    className={`tabulka-radek-data tabulka-radek-objednavky tabulka-radek-interaktivni${rychlyDetailObjednavky === objednavka.verejne_id ? " aktivni-radek" : ""}`}
                    onClick={() => nastavRychlyDetailObjednavky(objednavka.verejne_id)}
                  >
                    <label className="checkbox-hromadny">
                      <input
                        type="checkbox"
                        checked={vybraneObjednavky.includes(objednavka.verejne_id)}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) =>
                          nastavVybraneObjednavky((aktualni) =>
                            event.target.checked
                              ? [...aktualni, objednavka.verejne_id]
                              : aktualni.filter((id) => id !== objednavka.verejne_id),
                          )
                        }
                      />
                    </label>
                    <div className="tabulka-bunka-hlavni">
                      <strong>{objednavka.verejne_id}</strong>
                      <div className="micro">{formatujDatum(objednavka.vytvoreno)}</div>
                    </div>
                    <div>
                      <strong>{objednavka.jmeno_zakaznika || "Bez jména"}</strong>
                      <div className="micro">{objednavka.email_zakaznika}</div>
                    </div>
                    <div>
                      <strong>{formatujStavObjednavky(objednavka.stav)}</strong>
                      <div className="micro">
                        {objednavka.rezervace_do ? `Rezervace do ${formatujDatum(objednavka.rezervace_do)}` : "Bez rezervace"}
                      </div>
                    </div>
                    <div>
                      <strong>{formatujZpusobUhrady(objednavka.zpusob_uhrady)}</strong>
                      <div className="micro">
                        {objednavka.proforma_doklad
                          ? `${objednavka.proforma_doklad.cislo_dokladu} • ${formatujStavProformy(objednavka.proforma_doklad.stav)}`
                          : "Bez proformy"}
                      </div>
                    </div>
                    <div>
                      <strong>{formatujCastku(objednavka.celkem, objednavka.mena)}</strong>
                      <div className="micro">{objednavka.vstupenky.length} vstupenek</div>
                    </div>
                    <div>
                      <strong>{objednavka.polozky[0]?.akce_nazev || "Bez akce"}</strong>
                      <div className="micro">{objednavka.polozky.length} položek</div>
                    </div>
                    <div className="actions-wrap actions-wrap-end">
                      <Link
                        className="button ghost"
                        href={`/sprava/objednavky/${objednavka.verejne_id}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        Detail
                      </Link>
                      {objednavka.stav === "ceka_na_platbu" ? (
                        <button
                          className="button ghost"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void sObnovou(
                              () => potvrditHotovostObjednavky(objednavka.verejne_id, tokenSpravy),
                              `Objednávka ${objednavka.verejne_id} byla označena jako zaplacená.`,
                            );
                          }}
                        >
                          Potvrdit hotovost
                        </button>
                      ) : null}
                      {objednavka.stav === "zaplaceno" ? (
                        <button
                          className="button ghost"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void sObnovou(
                              () => dorucVstupenkyObjednavky(objednavka.verejne_id, tokenSpravy),
                              `Vstupenky pro ${objednavka.verejne_id} byly znovu odeslány.`,
                            );
                          }}
                        >
                          Odeslat vstupenky
                        </button>
                      ) : null}
                      {(objednavka.stav === "ceka_na_platbu" || objednavka.stav === "zaplaceno") ? (
                        <button
                          className="button ghost"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void sObnovou(
                              () => stornovatObjednavku(objednavka.verejne_id, tokenSpravy),
                              `Objednávka ${objednavka.verejne_id} byla stornována.`,
                            );
                          }}
                        >
                          Storno
                        </button>
                      ) : null}
                      {objednavka.stav === "zaplaceno" ? (
                        <button
                          className="button ghost"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void sObnovou(
                              () => vratitObjednavku(objednavka.verejne_id, tokenSpravy),
                              `Objednávka ${objednavka.verejne_id} byla vrácena.`,
                            );
                          }}
                        >
                          Vrátit
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <RychlyDetailPanel
                nadpis={aktivniObjednavkaQuick?.verejne_id ?? "Vyber objednávku"}
                podnadpis="Rychlý detail objednávky"
                akce={
                  aktivniObjednavkaQuick ? (
                    <Link className="button ghost mini" href={`/sprava/objednavky/${aktivniObjednavkaQuick.verejne_id}`}>
                      Otevřít detail
                    </Link>
                  ) : null
                }
              >
                {aktivniObjednavkaQuick ? (
                  <div className="rychly-detail-grid">
                    <div className="detail-pole"><span>Zákazník</span><strong>{aktivniObjednavkaQuick.jmeno_zakaznika || "Bez jména"}</strong></div>
                    <div className="detail-pole"><span>E-mail</span><strong>{aktivniObjednavkaQuick.email_zakaznika}</strong></div>
                    <div className="detail-pole"><span>Stav</span><strong>{formatujStavObjednavky(aktivniObjednavkaQuick.stav)}</strong></div>
                    <div className="detail-pole"><span>Úhrada</span><strong>{formatujZpusobUhrady(aktivniObjednavkaQuick.zpusob_uhrady)}</strong></div>
                    <div className="detail-pole"><span>Celkem</span><strong>{formatujCastku(aktivniObjednavkaQuick.celkem, aktivniObjednavkaQuick.mena)}</strong></div>
                    <div className="detail-pole"><span>Akce</span><strong>{aktivniObjednavkaQuick.polozky[0]?.akce_nazev || "Bez akce"}</strong></div>
                    <div className="detail-pole"><span>Vstupenky</span><strong>{aktivniObjednavkaQuick.vstupenky.length}</strong></div>
                    <div className="detail-pole detail-pole-cela"><span>Proforma</span><strong>{aktivniObjednavkaQuick.proforma_doklad ? `${aktivniObjednavkaQuick.proforma_doklad.cislo_dokladu} • ${formatujStavProformy(aktivniObjednavkaQuick.proforma_doklad.stav)}` : "Bez proforma dokladu"}</strong></div>
                    <div className="detail-pole detail-pole-cela"><span>Místa</span><strong>{aktivniObjednavkaQuick.vstupenky.map((vstupenka) => vstupenka.oznaceni_mista ?? "bez místa").join(", ") || "Bez místenek"}</strong></div>
                  </div>
                ) : (
                  <PrazdnyStav text="Kliknutím na řádek otevřeš rychlý přehled objednávky bez odchodu ze seznamu." />
                )}
              </RychlyDetailPanel>
              </div>
              <Strankovani
                celkem={filtrovaneObjednavky.length}
                strana={Math.min(stranaObjednavek, pocetStranObjednavek)}
                pocetStran={pocetStranObjednavek}
                velikostStranky={velikostStrankyObjednavek}
                priZmeneVelikosti={nastavVelikostStrankyObjednavek}
                priPredchozi={() => nastavStranuObjednavek((aktualni) => Math.max(1, aktualni - 1))}
                priDalsi={() =>
                  nastavStranuObjednavek((aktualni) => Math.min(pocetStranObjednavek, aktualni + 1))
                }
                priSkokuNaStranu={nastavStranuObjednavek}
              />
            </PanelSekce>
            {profil.opravneni.finance ? (
              <PanelSekce nadpis="Pokladní prodej" popis="Rychlý prodej na místě s okamžitým potvrzením.">
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sObnovou(
                      () =>
                        vytvorPokladniProdej(
                          {
                            ...formularPokladny,
                            polozky: [
                              {
                                kategorie_vstupenky: Number(formularPokladny.kategorie_vstupenky),
                                pocet: Number(formularPokladny.pocet),
                              },
                            ],
                          },
                          tokenSpravy,
                        ),
                      "Pokladní prodej byl vytvořen.",
                    );
                  }}
                >
                  <label className="pole">
                    <span className="pole-label">Zákazník</span>
                    <input
                      value={formularPokladny.jmeno_zakaznika}
                      onChange={(event) =>
                        nastavFormularPokladny((aktualni) => ({
                          ...aktualni,
                          jmeno_zakaznika: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">E-mail</span>
                    <input
                      type="email"
                      value={formularPokladny.email_zakaznika}
                      onChange={(event) =>
                        nastavFormularPokladny((aktualni) => ({
                          ...aktualni,
                          email_zakaznika: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Telefon</span>
                    <input
                      value={formularPokladny.telefon_zakaznika}
                      onChange={(event) =>
                        nastavFormularPokladny((aktualni) => ({
                          ...aktualni,
                          telefon_zakaznika: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Kategorie vstupenky</span>
                    <select
                      value={formularPokladny.kategorie_vstupenky}
                      onChange={(event) =>
                        nastavFormularPokladny((aktualni) => ({
                          ...aktualni,
                          kategorie_vstupenky: event.target.value,
                        }))
                      }
                    >
                      {data.kategorieVstupenek.map((kategorie) => (
                        <option key={kategorie.id} value={kategorie.id}>
                          {kategorie.akce_nazev} · {kategorie.nazev}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="pole">
                    <span className="pole-label">Počet</span>
                    <input
                      type="number"
                      min="1"
                      value={formularPokladny.pocet}
                      onChange={(event) =>
                        nastavFormularPokladny((aktualni) => ({ ...aktualni, pocet: event.target.value }))
                      }
                    />
                  </label>
                  <label className="pole-checkbox">
                    <input
                      checked={formularPokladny.odeslat_na_email}
                      type="checkbox"
                      onChange={(event) =>
                        nastavFormularPokladny((aktualni) => ({
                          ...aktualni,
                          odeslat_na_email: event.target.checked,
                        }))
                      }
                    />
                    <span>Po vytvoření odeslat vstupenky e-mailem</span>
                  </label>
                  <div className="actions-end pole-cela">
                    <button className="button primary" disabled={beziPrechod} type="submit">
                      {beziPrechod ? "Ukládám…" : "Vytvořit pokladní prodej"}
                    </button>
                  </div>
                </form>
              </PanelSekce>
            ) : null}
          </div>
        </>
      ) : null}

      {sekce === "platby" ? (
        <>
          <HeroSekce
            stitek="Platby"
            nadpis="Transakce a finanční stopa"
            popis="Platby s vazbou na objednávku a zákazníka."
          />
          <PanelSekce nadpis="Přehled plateb" popis="Stavy plateb a rozložení podle poskytovatelů.">
            <div className="grafy-grid">
              <GrafRozlozeni
                nadpis="Stavy plateb"
                popis="Kolik plateb čeká, je úspěšných nebo vrácených."
                polozky={grafyPlateb.stavy}
              />
              <GrafSloupcovy
                nadpis="Poskytovatelé"
                popis="Přehled plateb podle použitého kanálu."
                polozky={grafyPlateb.poskytovatele}
              />
            </div>
          </PanelSekce>
        <PanelSekce nadpis="Seznam plateb" popis="Finanční vrstva s přímým přechodem do objednávky.">
          <UlozenePohledy
            polozky={[
              { id: "vse", nazev: "Všechny", aktivni: pohledPlateb === "vse", onClick: () => { nastavPohledPlateb("vse"); nastavFiltrPlateb({ hledani: "", stav: "vse", poskytovatel: "vse" }); nastavRazeniPlateb("nejnovejsi"); } },
              { id: "dnes", nazev: "Dnešní", aktivni: pohledPlateb === "dnes", onClick: () => { nastavPohledPlateb("dnes"); nastavFiltrPlateb({ hledani: "", stav: "vse", poskytovatel: "vse" }); nastavRazeniPlateb("nejnovejsi"); } },
              { id: "uspesne", nazev: "Úspěšné", aktivni: pohledPlateb === "uspesne", onClick: () => { nastavPohledPlateb("uspesne"); nastavFiltrPlateb({ hledani: "", stav: "uspesna", poskytovatel: "vse" }); nastavRazeniPlateb("nejnovejsi"); } },
              { id: "hotovost", nazev: "Hotovost", aktivni: pohledPlateb === "hotovost", onClick: () => { nastavPohledPlateb("hotovost"); nastavFiltrPlateb({ hledani: "", stav: "vse", poskytovatel: "hotovost" }); nastavRazeniPlateb("nejnovejsi"); } },
            ]}
          />
          <div className="form-grid admin-filtry admin-filtry-kompaktni">
              <label className="pole">
                <span className="pole-label">Hledání</span>
                <input
                  value={filtrPlateb.hledani}
                  onChange={(event) => {
                    nastavPohledPlateb("vse");
                    nastavFiltrPlateb((aktualni) => ({ ...aktualni, hledani: event.target.value }));
                  }}
                  placeholder="Reference, ID objednávky nebo poskytovatel"
                />
              </label>
              <label className="pole">
                <span className="pole-label">Stav</span>
                <select
                  value={filtrPlateb.stav}
                  onChange={(event) => {
                    nastavPohledPlateb("vse");
                    nastavFiltrPlateb((aktualni) => ({ ...aktualni, stav: event.target.value }));
                  }}
                >
                  <option value="vse">Všechny</option>
                  <option value="vytvoreno">Vytvořeno</option>
                  <option value="ceka">Čeká</option>
                  <option value="uspesna">Úspěšná</option>
                  <option value="neuspesna">Neúspěšná</option>
                  <option value="vracena">Vrácená</option>
                </select>
              </label>
              <label className="pole">
                <span className="pole-label">Poskytovatel</span>
                <select
                  value={filtrPlateb.poskytovatel}
                  onChange={(event) => {
                    nastavPohledPlateb("vse");
                    nastavFiltrPlateb((aktualni) => ({ ...aktualni, poskytovatel: event.target.value }));
                  }}
                >
                  <option value="vse">Všichni</option>
                  <option value="stripe">Stripe</option>
                  <option value="gopay">GoPay</option>
                  <option value="comgate">Comgate</option>
                  <option value="hotovost">Hotovost</option>
                </select>
              </label>
              <label className="pole">
                <span className="pole-label">Řazení</span>
                <select
                  value={razeniPlateb}
                  onChange={(event) => {
                    nastavPohledPlateb("vse");
                    nastavRazeniPlateb(event.target.value as RazeniPlateb);
                  }}
                >
                  <option value="nejnovejsi">Nejnovější</option>
                  <option value="nejstarsi">Nejstarší</option>
                  <option value="castka_desc">Částka od nejvyšší</option>
                  <option value="castka_asc">Částka od nejnižší</option>
                </select>
              </label>
            </div>
            {vybranePlatbyData.length ? (
              <div className="hromadna-akcni-lista">
                <div className="hromadna-akcni-info">
                  Vybráno <strong>{vybranePlatbyData.length}</strong> plateb
                </div>
                <div className="actions-wrap">
                  <button
                    className="button ghost"
                    type="button"
                    onClick={() =>
                      stahniCsv(
                        "platby-vyber.csv",
                        [
                          ["ID", "Poskytovatel", "Reference", "Stav", "Částka", "Objednávka", "Vytvořeno"],
                          ...vybranePlatbyData.map((platba) => [
                            String(platba.id),
                            formatujPoskytovatelePlatby(platba.poskytovatel),
                            platba.reference_poskytovatele,
                            formatujStavPlatby(platba.stav),
                            formatujCastku(platba.castka, platba.mena),
                            platba.objednavka_verejne_id ?? "",
                            formatujDatum(platba.vytvoreno),
                          ]),
                        ],
                      )
                    }
                  >
                    Export CSV
                  </button>
                  <button className="button ghost" type="button" onClick={() => nastavVybranePlatby([])}>
                    Zrušit výběr
                  </button>
                </div>
              </div>
            ) : null}
            <div className="seznam-s-panelem">
            <div className="tabulka tabulka-siroka">
              <div className="tabulka-radek-hlavni tabulka-radek-platby">
                <label className="checkbox-hromadny">
                  <input
                    type="checkbox"
                    checked={
                      zobrazenePlatby.length > 0 &&
                      zobrazenePlatby.every((platba) => vybranePlatby.includes(platba.id))
                    }
                    onChange={(event) =>
                      nastavVybranePlatby((aktualni) =>
                        event.target.checked
                          ? Array.from(new Set([...aktualni, ...zobrazenePlatby.map((platba) => platba.id)]))
                          : aktualni.filter((id) => !zobrazenePlatby.some((platba) => platba.id === id)),
                      )
                    }
                  />
                </label>
                <span>Platba</span>
                <span>Poskytovatel</span>
                <span>Stav</span>
                <span>Částka</span>
                <span>Vazba</span>
                <span />
              </div>
              {zobrazenePlatby.map((platba) => (
                <div
                  key={platba.id}
                  className={`tabulka-radek-data tabulka-radek-platby tabulka-radek-interaktivni${rychlyDetailPlatby === platba.id ? " aktivni-radek" : ""}`}
                  onClick={() => nastavRychlyDetailPlatby(platba.id)}
                >
                  <label className="checkbox-hromadny">
                    <input
                      type="checkbox"
                      checked={vybranePlatby.includes(platba.id)}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) =>
                        nastavVybranePlatby((aktualni) =>
                          event.target.checked
                            ? [...aktualni, platba.id]
                            : aktualni.filter((id) => id !== platba.id),
                        )
                      }
                    />
                  </label>
                  <div className="tabulka-bunka-hlavni">
                    <strong>#{platba.id}</strong>
                    <div className="micro">{formatujDatum(platba.vytvoreno)}</div>
                  </div>
                  <div>
                    <strong>{formatujPoskytovatelePlatby(platba.poskytovatel)}</strong>
                    <div className="micro">{platba.reference_poskytovatele || "Bez reference"}</div>
                  </div>
                  <div>
                    <strong>{formatujStavPlatby(platba.stav)}</strong>
                    <div className="micro">Platební stav</div>
                  </div>
                  <div>
                    <strong>{formatujCastku(platba.castka, platba.mena)}</strong>
                    <div className="micro">Finanční objem</div>
                  </div>
                  <div>
                    <strong>{platba.objednavka_verejne_id || "Bez objednávky"}</strong>
                    <div className="micro">Navázaná objednávka</div>
                  </div>
                  <div className="actions-wrap actions-wrap-end">
                    {platba.objednavka_verejne_id ? (
                      <Link className="button ghost" href={`/sprava/objednavky/${platba.objednavka_verejne_id}`} onClick={(event) => event.stopPropagation()}>
                        Detail
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <RychlyDetailPanel
              nadpis={aktivniPlatbaQuick ? `#${aktivniPlatbaQuick.id}` : "Vyber platbu"}
              podnadpis="Rychlý detail platby"
              akce={
                aktivniPlatbaQuick?.objednavka_verejne_id ? (
                  <Link className="button ghost mini" href={`/sprava/objednavky/${aktivniPlatbaQuick.objednavka_verejne_id}`}>
                    Otevřít objednávku
                  </Link>
                ) : null
              }
            >
              {aktivniPlatbaQuick ? (
                <div className="rychly-detail-grid">
                  <div className="detail-pole"><span>Poskytovatel</span><strong>{formatujPoskytovatelePlatby(aktivniPlatbaQuick.poskytovatel)}</strong></div>
                  <div className="detail-pole"><span>Stav</span><strong>{formatujStavPlatby(aktivniPlatbaQuick.stav)}</strong></div>
                  <div className="detail-pole"><span>Částka</span><strong>{formatujCastku(aktivniPlatbaQuick.castka, aktivniPlatbaQuick.mena)}</strong></div>
                  <div className="detail-pole"><span>Vytvořeno</span><strong>{formatujDatum(aktivniPlatbaQuick.vytvoreno)}</strong></div>
                  <div className="detail-pole detail-pole-cela"><span>Reference</span><strong>{aktivniPlatbaQuick.reference_poskytovatele || "Bez reference"}</strong></div>
                  <div className="detail-pole detail-pole-cela"><span>Objednávka</span><strong>{aktivniPlatbaQuick.objednavka_verejne_id || "Bez vazby"}</strong></div>
                </div>
              ) : (
                <PrazdnyStav text="Kliknutím na řádek otevřeš rychlý přehled platby a vazby na objednávku." />
              )}
            </RychlyDetailPanel>
            </div>
            <Strankovani
              celkem={filtrovanePlatby.length}
              strana={Math.min(stranaPlateb, pocetStranPlateb)}
              pocetStran={pocetStranPlateb}
              velikostStranky={velikostStrankyPlateb}
              priZmeneVelikosti={nastavVelikostStrankyPlateb}
              priPredchozi={() => nastavStranuPlateb((aktualni) => Math.max(1, aktualni - 1))}
              priDalsi={() =>
                nastavStranuPlateb((aktualni) => Math.min(pocetStranPlateb, aktualni + 1))
              }
              priSkokuNaStranu={nastavStranuPlateb}
            />
          </PanelSekce>
        </>
      ) : null}

      {sekce === "uzivatele" ? (
        <>
          <HeroSekce
            stitek="Uživatelé"
            nadpis="Tým, role a přístup do správy"
            popis="Tým, role a stav přístupu."
          />
          <div className="admin-sekce-grid">
            <PanelSekce nadpis="Přehled týmu" popis="Role v týmu a stav přístupů.">
              <div className="grafy-grid">
                <GrafRozlozeni
                  nadpis="Role"
                  popis="Jak jsou rozdělené role v týmu."
                  polozky={grafyUzivatelu.role}
                />
                <GrafRozlozeni
                  nadpis="Aktivita účtů"
                  popis="Kolik účtů je aktivních a kolik vypnutých."
                  polozky={grafyUzivatelu.aktivita}
                />
              </div>
            </PanelSekce>
            <PanelSekce nadpis="Seznam uživatelů" popis="Přehled členů týmu se vstupem do detailu.">
              <div className="tabulka tabulka-siroka">
                <div className="tabulka-radek-hlavni tabulka-radek-clenstvi">
                  <span>Uživatel</span>
                  <span>Organizace</span>
                  <span>Role</span>
                  <span>Stav</span>
                  <span />
                </div>
                {data.clenstvi.map((clen) => (
                  <div key={clen.id} className="tabulka-radek-data tabulka-radek-clenstvi">
                    <div className="tabulka-bunka-hlavni">
                      <strong>{clen.uzivatel_jmeno}</strong>
                      <div className="micro">{clen.uzivatel_email || "Bez e-mailu"}</div>
                    </div>
                    <div>
                      <strong>{clen.organizace_nazev}</strong>
                      <div className="micro">Napojená organizace</div>
                    </div>
                    <div>
                      <strong>{formatujRoliOrganizace(clen.role)}</strong>
                      <div className="micro">Role v systému</div>
                    </div>
                    <div>
                      <strong>{clen.je_aktivni ? "Aktivní" : "Vypnutý"}</strong>
                      <div className="micro">Přístup do správy</div>
                    </div>
                    <div className="actions-wrap actions-wrap-end">
                      <Link className="button ghost" href={`/sprava/uzivatele/${clen.id}`}>
                        Detail
                      </Link>
                      <button
                        className="button ghost"
                        type="button"
                        onClick={() =>
                          void sObnovou(
                              () =>
                                upravClenstviSprava(
                                  clen.id,
                                  {
                                    role: clen.role,
                                    je_aktivni: !clen.je_aktivni,
                                  },
                                  tokenSpravy,
                                ),
                            `Přístup pro ${clen.uzivatel_jmeno} byl aktualizován.`,
                          )
                        }
                      >
                        {clen.je_aktivni ? "Vypnout" : "Zapnout"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </PanelSekce>
            {profil.opravneni.sprava_obsahu ? (
              <PanelSekce nadpis="Přidat člena týmu" popis="Nový účet i vazba na organizaci v jednom kroku.">
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sObnovou(
                      () =>
                        vytvorClenstviSprava(
                          {
                            organizace: Number(formularClenstvi.organizace),
                            role: formularClenstvi.role,
                            je_aktivni: true,
                            nove_uzivatelske_jmeno: formularClenstvi.nove_uzivatelske_jmeno,
                            nove_uzivatelske_email: formularClenstvi.nove_uzivatelske_email,
                            nove_heslo: formularClenstvi.nove_heslo,
                          },
                          tokenSpravy,
                        ),
                      "Člen týmu byl přidán.",
                    );
                  }}
                >
                  <label className="pole">
                    <span className="pole-label">Organizace</span>
                    <select
                      value={formularClenstvi.organizace}
                      onChange={(event) =>
                        nastavFormularClenstvi((aktualni) => ({
                          ...aktualni,
                          organizace: event.target.value,
                        }))
                      }
                    >
                      {data.organizace.map((organizace) => (
                        <option key={organizace.id} value={organizace.id}>
                          {organizace.nazev}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="pole">
                    <span className="pole-label">Uživatelské jméno</span>
                    <input
                      value={formularClenstvi.nove_uzivatelske_jmeno}
                      onChange={(event) =>
                        nastavFormularClenstvi((aktualni) => ({
                          ...aktualni,
                          nove_uzivatelske_jmeno: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">E-mail</span>
                    <input
                      type="email"
                      value={formularClenstvi.nove_uzivatelske_email}
                      onChange={(event) =>
                        nastavFormularClenstvi((aktualni) => ({
                          ...aktualni,
                          nove_uzivatelske_email: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Heslo</span>
                    <input
                      type="password"
                      value={formularClenstvi.nove_heslo}
                      onChange={(event) =>
                        nastavFormularClenstvi((aktualni) => ({
                          ...aktualni,
                          nove_heslo: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label className="pole">
                    <span className="pole-label">Role</span>
                    <select
                      value={formularClenstvi.role}
                      onChange={(event) =>
                        nastavFormularClenstvi((aktualni) => ({ ...aktualni, role: event.target.value }))
                      }
                    >
                      <option value="spravce">Správce</option>
                      <option value="pokladna">Pokladna</option>
                      <option value="ucetni">Účetní</option>
                      <option value="odbaveni">Odbavení</option>
                    </select>
                  </label>
                  <div className="actions-end pole-cela">
                    <button className="button primary" disabled={beziPrechod} type="submit">
                      {beziPrechod ? "Ukládám…" : "Vytvořit člena"}
                    </button>
                  </div>
                </form>
              </PanelSekce>
            ) : null}
          </div>
        </>
      ) : null}

      {sekce === "uzivatel-detail" && aktivniClen ? (
        <>
          <HeroSekce
            stitek="Detail uživatele"
            nadpis={aktivniClen.uzivatel_jmeno}
            popis="Role a přístupy konkrétního účtu."
          />
          <div className="admin-sekce-grid">
            <PanelSekce nadpis="Profil člena" popis="Základní přístupová vrstva.">
              <div className="detail-grid">
                <div className="detail-pole">
                  <span>Organizace</span>
                  <strong>{aktivniClen.organizace_nazev}</strong>
                </div>
                <div className="detail-pole">
                  <span>Role</span>
                  <strong>{formatujRoliOrganizace(aktivniClen.role)}</strong>
                </div>
                <div className="detail-pole">
                  <span>E-mail</span>
                  <strong>{aktivniClen.uzivatel_email || "Neuvedeno"}</strong>
                </div>
                <div className="detail-pole">
                  <span>Stav</span>
                  <strong>{aktivniClen.je_aktivni ? "Aktivní" : "Vypnutý"}</strong>
                </div>
              </div>
              <div className="actions-wrap">
                <button
                  className="button ghost"
                  type="button"
                  onClick={() =>
                    void sObnovou(
                      () =>
                        upravClenstviSprava(
                          aktivniClen.id,
                          {
                            role: aktivniClen.role,
                            je_aktivni: !aktivniClen.je_aktivni,
                          },
                          tokenSpravy,
                        ),
                      `Přístup pro ${aktivniClen.uzivatel_jmeno} byl aktualizován.`,
                    )
                  }
                >
                  {aktivniClen.je_aktivni ? "Vypnout přístup" : "Zapnout přístup"}
                </button>
                <Link className="button ghost" href="/sprava/uzivatele">
                  Zpět na uživatele
                </Link>
              </div>
            </PanelSekce>
            <PanelSekce nadpis="Napojené objednávky" popis="Objednávky v organizaci tohoto člena.">
              <div className="admin-mini-list">
                {data.objednavky
                  .filter((objednavka) => objednavka.organizace === aktivniClen.organizace)
                  .slice(0, 6)
                  .map((objednavka) => (
                    <div key={objednavka.verejne_id} className="admin-list-row">
                      <div>
                        <strong>{objednavka.verejne_id}</strong>
                        <div className="micro">
                          {objednavka.jmeno_zakaznika || "Bez jména"} ·{" "}
                          {formatujStavObjednavky(objednavka.stav)}
                        </div>
                      </div>
                      <Link className="button ghost" href={`/sprava/objednavky/${objednavka.verejne_id}`}>
                        Detail objednávky
                      </Link>
                    </div>
                  ))}
              </div>
            </PanelSekce>
          </div>
        </>
      ) : null}

      {(sekce === "organizace-detail" && !aktivniOrganizace) ||
      (sekce === "uzivatel-detail" && !aktivniClen) ||
      (sekce === "vstupenka-detail" && !aktivniVstupenka) ? (
        <PanelSekce nadpis="Záznam nebyl nalezen" popis="Zkontroluj odkaz nebo se vrať do příslušné sekce.">
          <PrazdnyStav text="Požadovaný záznam se v aktuálních datech správy nepodařilo dohledat." />
        </PanelSekce>
      ) : null}

      <section className="sprava-panel">
        <div className="sprava-panel-body admin-paticka">
          <div className="micro">
            Přihlášený uživatel: <strong>{profil.uzivatel}</strong>
          </div>
          <button className="button ghost" onClick={odhlasit} type="button">
            Odhlásit
          </button>
        </div>
      </section>
    </div>
  );
}
