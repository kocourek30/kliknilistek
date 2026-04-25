export type Organizace = {
  id: number;
  nazev: string;
  slug: string;
  slug_subdomeny?: string | null;
  vlastni_domena?: string;
  tenant_aktivni?: boolean;
  nazev_verejny?: string;
  verejny_popis?: string;
  logo_url?: string;
  logo_soubor?: string;
  logo_soubor_url?: string;
  banner_soubor?: string;
  banner_soubor_url?: string;
  banner_popis?: string;
  typ_organizace: string;
  kontaktni_email: string;
  kontaktni_telefon: string;
  hlavni_barva: string;
  fakturacni_nazev: string;
  ico: string;
  dic: string;
  fakturacni_ulice: string;
  fakturacni_mesto: string;
  fakturacni_psc: string;
  cislo_uctu: string;
  kod_banky: string;
  iban: string;
  swift: string;
  smtp_aktivni: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_uzivatel: string;
  smtp_use_tls: boolean;
  smtp_use_ssl: boolean;
  smtp_od_email: string;
  smtp_od_jmeno: string;
  smtp_timeout: number;
  ma_vlastni_smtp?: boolean;
  je_aktivni: boolean;
  vytvoreno: string;
  upraveno: string;
};

export type NastaveniSystemu = {
  id?: number;
  smtp_aktivni: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_uzivatel: string;
  smtp_use_tls: boolean;
  smtp_use_ssl: boolean;
  smtp_od_email: string;
  smtp_od_jmeno: string;
  smtp_timeout: number;
  ma_globalni_smtp?: boolean;
};

export type TenantKontext = {
  host: string;
  je_centralni: boolean;
  organizace: Organizace | null;
};

export type ProformaDoklad = {
  id?: number;
  objednavka?: number;
  objednavka_verejne_id?: string;
  organizace?: number;
  organizace_nazev?: string;
  cislo_dokladu: string;
  variabilni_symbol: string;
  specificky_symbol?: string;
  datum_vystaveni: string;
  datum_splatnosti: string;
  castka: string;
  mena: string;
  stav: string;
  qr_platba_data: string;
  qr_platba_svg?: string;
  zprava_pro_prijemce?: string;
  poznamka?: string;
  uhrazeno_v?: string | null;
  cislo_uctu?: string;
  iban?: string;
  vytvoreno?: string;
};

export type ProfilSpravy = {
  uzivatel: string;
  je_spravce: boolean;
  ma_pristup_do_spravy: boolean;
  opravneni: {
    sprava: boolean;
    sprava_obsahu: boolean;
    finance: boolean;
    odbaveni: boolean;
    prehled: boolean;
  };
  clenstvi: Array<{
    organizace_id: number;
    organizace_nazev: string;
    role: string;
  }>;
};

export type PrehledSpravy = {
  souhrn: {
    organizace_celkem: number;
    akce_celkem: number;
    akce_zverejnene: number;
    objednavky_celkem: number;
    objednavky_cekaji_na_platbu: number;
    objednavky_zaplacene: number;
    trzby_celkem: string;
    prodane_vstupenky: number;
    platne_vstupenky: number;
    odbavene_vstupenky: number;
    dorucene_vstupenky: number;
    navstevnost_procent: number;
  };
  stavy_objednavek: Array<{
    stav: string;
    pocet: number;
  }>;
  stavy_vstupenek: Array<{
    stav: string;
    pocet: number;
  }>;
  vykonnost_akci: Array<{
    id: number;
    nazev: string;
    slug: string;
    stav: string;
    zacatek: string;
    misto_konani_nazev: string;
    kapacita: number;
    objednavky_celkem: number;
    prodane_vstupenky: number;
    platne_vstupenky: number;
    odbavene_vstupenky: number;
    dorucene_vstupenky: number;
    trzby_celkem: string;
    obsazenost_procent: number;
    navstevnost_procent: number;
  }>;
};

export type VysledekOdbaveni = {
  vysledek: string;
  stav_vstupenky: string;
  zprava: string;
  vstupenka: {
    kod: string;
    akce_nazev: string;
    kategorie_vstupenky_nazev: string;
  } | null;
};

export type VstupenkaDetail = {
  id: number;
  objednavka: number;
  objednavka_verejne_id: string;
  akce: number;
  akce_nazev: string;
  kategorie_vstupenky: number;
  kategorie_vstupenky_nazev: string;
  kod: string;
  qr_data: string;
  jmeno_navstevnika: string;
  email_navstevnika: string;
  oznaceni_mista?: string;
  stav: string;
  vystavena: string;
  dorucena?: string | null;
};

export type MistoKonani = {
  id: number;
  organizace: number;
  organizace_nazev?: string;
  nazev: string;
  adresa: string;
  mesto: string;
  kapacita: number;
  hlavni_fotka?: string;
  hlavni_fotka_url?: string;
  schema_sezeni?: Akce["schema_sezeni"];
  vytvoreno: string;
  upraveno: string;
};

export type FotkaAkce = {
  id: number;
  soubor?: string;
  soubor_url: string;
  popis: string;
  poradi: number;
  je_doporucena: boolean;
  vytvoreno?: string;
  upraveno?: string;
};

export type Akce = {
  id: number;
  organizace: number;
  organizace_nazev?: string;
  nazev: string;
  slug: string;
  typ_akce?: string;
  perex: string;
  popis: string;
  hlavni_fotka_url: string;
  hlavni_fotka?: string;
  hlavni_fotka_soubor_url?: string;
  hlavni_fotka_pomer?: string;
  galerie_fotka_pomer?: string;
  fotky_galerie?: FotkaAkce[];
  video_url: string;
  misto_konani: number;
  misto_konani_nazev?: string;
  misto_konani_hlavni_fotka_url?: string;
  schema_sezeni?: {
    typ: string;
    nazev: string;
    popis: string;
    sloupce_stred?: number;
    sloupce_levy_pristavek?: number;
    sloupce_pravy_pristavek?: number;
    stit: string;
    mrizka?: {
      radky: number;
      sloupce: number;
      odsazeni_x?: number;
      odsazeni_y?: number;
      mezera_x?: number;
      mezera_y?: number;
      bunky: Array<{
        radek: number;
        sloupec: number;
        typ: string;
        kod?: string;
        oznaceni?: string;
        popis?: string;
        vazba_stul?: string;
        zona?: string;
      }>;
    };
    podlazi?: Array<{
      id: string;
      nazev: string;
      stit?: string;
      mrizka: {
        radky: number;
        sloupce: number;
        odsazeni_x?: number;
        odsazeni_y?: number;
        mezera_x?: number;
        mezera_y?: number;
        bunky: Array<{
          radek: number;
          sloupec: number;
          typ: string;
          kod?: string;
          oznaceni?: string;
          popis?: string;
          vazba_stul?: string;
          zona?: string;
        }>;
      };
    }>;
    rady: Array<{
      rada: number | string;
      popisek?: string | number;
      levy_pristavek?: number[];
      stred?: number[];
      pravy_pristavek?: number[];
      zona_levy?: string;
      zona_pravy?: string;
      odsazeni_stred?: number;
      useky?: Array<{
        id: string;
        nazev?: string;
        zona: string;
        kod_prefix?: string;
        mista: number[];
      }>;
    }>;
  };
  schema_sezeni_override?: Akce["schema_sezeni"];
  ma_vlastni_schema_sezeni?: boolean;
  manualni_stavy_mist?: Record<string, { stav: string; duvod?: string }>;
  dostupne_zony?: string[];
  obsazena_mista?: string[];
  stavy_mist?: Array<{
    kod: string;
    popis: string;
    rada: number | string;
    blok: string;
    zona: string;
    cislo: number;
    stav: string;
    duvod_blokace?: string;
    objednavka_verejne_id?: string;
    vstupenka_kod?: string;
    vstupenka_stav?: string;
    kategorie_vstupenky_nazev?: string;
    rezervace_do?: string | null;
  }>;
  souhrn_mist?: {
    volne: number;
    rezervace: number;
    platne: number;
    odbavene: number;
  };
  zacatek: string;
  konec?: string | null;
  stav: string;
  kapacita: number;
  rezervace_platnost_minuty: number;
  je_doporucena: boolean;
  vytvoreno: string;
  upraveno: string;
};

export type KategorieVstupenky = {
  id: number;
  organizace: number;
  organizace_nazev?: string;
  akce: number;
  akce_nazev?: string;
  nazev: string;
  popis: string;
  cena: string;
  mena: string;
  kapacita: number;
  povolene_zony?: string[];
  prodej_od?: string | null;
  prodej_do?: string | null;
  je_aktivni: boolean;
  vytvoreno: string;
  upraveno: string;
};

export type PolozkaObjednavky = {
  id: number;
  akce: number;
  akce_nazev?: string;
  kategorie_vstupenky: number;
  kategorie_vstupenky_nazev?: string;
  pocet: number;
  vybrana_mista?: string[];
  cena_za_kus: string;
  cena_celkem: string;
};

export type Objednavka = {
  id: number;
  verejne_id: string;
  organizace: number;
  email_zakaznika: string;
  jmeno_zakaznika: string;
  telefon_zakaznika: string;
  stav: string;
  zpusob_uhrady?: string;
  mezisoucet: string;
  poplatek: string;
  celkem: string;
  mena: string;
  rezervace_do?: string | null;
  je_rezervace_aktivni?: boolean;
  vytvoreno: string;
  polozky: PolozkaObjednavky[];
  vstupenky: Array<{
    id: number;
    kod: string;
    stav: string;
    akce_nazev: string;
    kategorie_vstupenky_nazev: string;
    oznaceni_mista?: string;
    dorucena?: string | null;
  }>;
  platby?: Array<{
    id: number;
    poskytovatel: string;
    stav: string;
    castka: string;
    mena: string;
    vytvoreno: string;
  }>;
  emailove_zasilky?: Array<{
    id: number;
    prijemce_email: string;
    predmet: string;
    stav: string;
    pocet_priloh: number;
    odeslano_v?: string | null;
    vytvoreno: string;
  }>;
  proforma_doklad?: ProformaDoklad | null;
};

export type PlatbaSpravy = {
  id: number;
  objednavka: number;
  objednavka_verejne_id?: string;
  poskytovatel: string;
  reference_poskytovatele: string;
  stav: string;
  castka: string;
  mena: string;
  data_poskytovatele: Record<string, unknown>;
  vytvoreno: string;
};

export type ClenstviOrganizace = {
  id: number;
  organizace: number;
  organizace_nazev: string;
  uzivatel: number;
  uzivatel_jmeno: string;
  uzivatel_email?: string;
  role: string;
  je_aktivni: boolean;
  vytvoreno: string;
  upraveno: string;
};

type SouhrnAdministrace = {
  organizace: Organizace[];
  clenstvi: ClenstviOrganizace[];
  mistaKonani: MistoKonani[];
  akce: Akce[];
  kategorieVstupenek: KategorieVstupenky[];
  objednavky: Objednavka[];
  platby: PlatbaSpravy[];
  proformy: ProformaDoklad[];
};

type UpravaNastaveniSystemu = Partial<NastaveniSystemu> & {
  smtp_heslo?: string;
};

type NovaOrganizace = {
  nazev: string;
  slug: string;
  slug_subdomeny?: string | null;
  vlastni_domena?: string;
  tenant_aktivni?: boolean;
  nazev_verejny?: string;
  verejny_popis?: string;
  logo_url?: string;
  logo_soubor?: File | null;
  banner_soubor?: File | null;
  banner_popis?: string;
  typ_organizace: string;
  kontaktni_email: string;
  kontaktni_telefon: string;
  hlavni_barva: string;
  fakturacni_nazev: string;
  ico: string;
  dic: string;
  fakturacni_ulice: string;
  fakturacni_mesto: string;
  fakturacni_psc: string;
  cislo_uctu: string;
  kod_banky: string;
  iban: string;
  swift: string;
  smtp_aktivni: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_uzivatel: string;
  smtp_heslo?: string;
  smtp_use_tls: boolean;
  smtp_use_ssl: boolean;
  smtp_od_email: string;
  smtp_od_jmeno: string;
  smtp_timeout: number;
  je_aktivni: boolean;
};

type NoveMistoKonani = {
  organizace: number;
  nazev: string;
  adresa: string;
  mesto: string;
  kapacita: number;
  hlavni_fotka?: File | null;
  schema_sezeni?: Akce["schema_sezeni"];
};

type NovaAkce = {
  organizace: number;
  nazev: string;
  slug: string;
  typ_akce?: string;
  perex: string;
  popis: string;
  hlavni_fotka_url: string;
  hlavni_fotka?: File | null;
  hlavni_fotka_pomer?: string;
  galerie_fotka_pomer?: string;
  video_url: string;
  misto_konani: number;
  zacatek: string;
  konec: string | null;
  stav: string;
  kapacita: number;
  rezervace_platnost_minuty: number;
  je_doporucena: boolean;
};

type NovaObjednavka = {
  email_zakaznika: string;
  jmeno_zakaznika: string;
  telefon_zakaznika: string;
  zpusob_uhrady?: string;
  polozky: Array<{
    kategorie_vstupenky: number;
    pocet: number;
    vybrana_mista?: string[];
  }>;
};

type PokladniProdej = NovaObjednavka & {
  odeslat_na_email: boolean;
};

type NoveClenstviOrganizace = {
  organizace: number;
  uzivatel?: number;
  role: string;
  je_aktivni: boolean;
  nove_uzivatelske_jmeno?: string;
  nove_uzivatelske_email?: string;
  nove_heslo?: string;
};

const zakladApi =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001/api"
    : "/api_proxy";

export class ApiChyba extends Error {
  status: number;

  constructor(zprava: string, status: number) {
    super(zprava);
    this.name = "ApiChyba";
    this.status = status;
  }
}

type OdpovedApiChyby = {
  detail?: string;
  [klic: string]: unknown;
};

function vytvorHlavicky(token?: string, extraHlavicky?: HeadersInit): HeadersInit | undefined {
  const hlavicky = new Headers(extraHlavicky);

  if (token) {
    if (typeof window !== "undefined") {
      hlavicky.set("X-Sprava-Token", token);
    } else {
      hlavicky.set("Authorization", token);
    }
  }

  return Array.from(hlavicky.keys()).length > 0 ? hlavicky : undefined;
}

async function vytvorApiChybu(odpoved: Response, cesta: string, akce: "nacist" | "odeslat") {
  let zprava = `Nepodařilo se ${akce} ${cesta}: ${odpoved.status}`;

  try {
    const data = (await odpoved.json()) as OdpovedApiChyby;
    if (typeof data.detail === "string" && data.detail.trim()) {
      zprava = data.detail;
    }
  } catch {
    try {
      const text = await odpoved.text();
      if (text.trim()) {
        zprava = text;
      }
    } catch {
      // Zůstane výchozí zpráva.
    }
  }

  return new ApiChyba(zprava, odpoved.status);
}

export function jeAutorizacniApiChyba(chyba: unknown) {
  return chyba instanceof ApiChyba && (chyba.status === 401 || chyba.status === 403);
}

export function jeDocasneNedostupnaApiChyba(chyba: unknown) {
  return chyba instanceof ApiChyba && chyba.status === 503;
}

async function nactiJson<T>(cesta: string, token?: string, extraHlavicky?: HeadersInit): Promise<T> {
  const odpoved = await fetch(`${zakladApi}${cesta}`, {
    cache: "no-store",
    headers: vytvorHlavicky(token, extraHlavicky),
  });

  if (!odpoved.ok) {
    throw await vytvorApiChybu(odpoved, cesta, "nacist");
  }

  return (await odpoved.json()) as T;
}

async function nactiJsonVolitelne<T>(
  cesta: string,
  vychozi: T,
  token?: string,
  extraHlavicky?: HeadersInit,
): Promise<T> {
  try {
    return await nactiJson<T>(cesta, token, extraHlavicky);
  } catch {
    return vychozi;
  }
}

async function odesliJson<T>(cesta: string, data: unknown, token?: string): Promise<T> {
  const odpoved = await fetch(`${zakladApi}${cesta}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(vytvorHlavicky(token) ?? {}),
    },
    body: JSON.stringify(data),
  });

  if (!odpoved.ok) {
    throw await vytvorApiChybu(odpoved, cesta, "odeslat");
  }

  return (await odpoved.json()) as T;
}

async function odesliFormData<T>(
  cesta: string,
  data: Record<string, string | Blob | null | undefined>,
  token?: string,
  method: "POST" | "PATCH" = "POST",
): Promise<T> {
  const formData = new FormData();
  for (const [klic, hodnota] of Object.entries(data)) {
    if (hodnota === undefined || hodnota === null || hodnota === "") {
      continue;
    }
    formData.append(klic, hodnota);
  }

  const odpoved = await fetch(`${zakladApi}${cesta}`, {
    method,
    headers: {
      ...(vytvorHlavicky(token) ?? {}),
    },
    body: formData,
  });

  if (!odpoved.ok) {
    throw await vytvorApiChybu(odpoved, cesta, "odeslat");
  }

  return (await odpoved.json()) as T;
}

function vytvorTenantHlavicky(host?: string): HeadersInit | undefined {
  return host ? { "X-Tenant-Host": host } : undefined;
}

export async function nactiTenantKontext(host?: string): Promise<TenantKontext> {
  return nactiJson<TenantKontext>("/tenant-kontekst/", undefined, vytvorTenantHlavicky(host));
}

export async function nactiSouhrnAdministrace(token?: string, host?: string): Promise<SouhrnAdministrace> {
  const tenantHlavicky = vytvorTenantHlavicky(host);
  const [organizace, clenstvi, mistaKonani, akce, kategorieVstupenek, objednavky, platby, proformy] = await Promise.all([
    nactiJsonVolitelne<Organizace[]>("/organizace/", ukazkovaData.organizace, token, tenantHlavicky),
    token
      ? nactiJsonVolitelne<ClenstviOrganizace[]>("/organizace/clenstvi/", ukazkovaData.clenstvi, token, tenantHlavicky)
      : Promise.resolve([]),
    nactiJsonVolitelne<MistoKonani[]>("/akce/mista-konani/", ukazkovaData.mistaKonani, token, tenantHlavicky),
    nactiJsonVolitelne<Akce[]>("/akce/", ukazkovaData.akce, token, tenantHlavicky),
    nactiJsonVolitelne<KategorieVstupenky[]>("/akce/kategorie-vstupenek/", ukazkovaData.kategorieVstupenek, token, tenantHlavicky),
    token ? nactiJsonVolitelne<Objednavka[]>("/objednavky/", [], token, tenantHlavicky) : Promise.resolve([]),
    token ? nactiJsonVolitelne<PlatbaSpravy[]>("/platby/", [], token, tenantHlavicky) : Promise.resolve([]),
    token ? nactiJsonVolitelne<ProformaDoklad[]>("/fakturace/proformy/", [], token, tenantHlavicky) : Promise.resolve([]),
  ]);

  return { organizace, clenstvi, mistaKonani, akce, kategorieVstupenek, objednavky, platby, proformy };
}

export async function nactiAkci(slug: string, host?: string): Promise<Akce | null> {
  try {
    return await nactiJson<Akce>(`/akce/${slug}/`, undefined, vytvorTenantHlavicky(host));
  } catch {
    return ukazkovaData.akce.find((polozka) => polozka.slug === slug) ?? null;
  }
}

export async function nactiKategorieVstupenekProAkci(
  akceId: number,
  host?: string,
): Promise<KategorieVstupenky[]> {
  try {
    const vsechny = await nactiJson<KategorieVstupenky[]>(
      "/akce/kategorie-vstupenek/",
      undefined,
      vytvorTenantHlavicky(host),
    );
    return vsechny.filter((polozka) => polozka.akce === akceId && polozka.je_aktivni);
  } catch {
    return ukazkovaData.kategorieVstupenek.filter(
      (polozka) => polozka.akce === akceId && polozka.je_aktivni,
    );
  }
}

export async function vytvorOrganizaci(data: NovaOrganizace): Promise<Organizace> {
  return odesliJson<Organizace>("/organizace/", data);
}

export async function vytvorOrganizaciSprava(
  data: NovaOrganizace,
  token: string,
): Promise<Organizace> {
  return odesliFormData<Organizace>(
    "/organizace/",
    {
      nazev: data.nazev,
      slug: data.slug,
      slug_subdomeny: data.slug_subdomeny ?? undefined,
      vlastni_domena: data.vlastni_domena,
      tenant_aktivni: data.tenant_aktivni !== undefined ? (data.tenant_aktivni ? "true" : "false") : undefined,
      nazev_verejny: data.nazev_verejny,
      verejny_popis: data.verejny_popis,
      logo_url: data.logo_url,
      logo_soubor: data.logo_soubor ?? undefined,
      banner_soubor: data.banner_soubor ?? undefined,
      banner_popis: data.banner_popis,
      typ_organizace: data.typ_organizace,
      kontaktni_email: data.kontaktni_email,
      kontaktni_telefon: data.kontaktni_telefon,
      hlavni_barva: data.hlavni_barva,
      fakturacni_nazev: data.fakturacni_nazev,
      ico: data.ico,
      dic: data.dic,
      fakturacni_ulice: data.fakturacni_ulice,
      fakturacni_mesto: data.fakturacni_mesto,
      fakturacni_psc: data.fakturacni_psc,
      cislo_uctu: data.cislo_uctu,
      kod_banky: data.kod_banky,
      iban: data.iban,
      swift: data.swift,
      smtp_aktivni: data.smtp_aktivni ? "true" : "false",
      smtp_host: data.smtp_host,
      smtp_port: String(data.smtp_port),
      smtp_uzivatel: data.smtp_uzivatel,
      smtp_heslo: data.smtp_heslo,
      smtp_use_tls: data.smtp_use_tls ? "true" : "false",
      smtp_use_ssl: data.smtp_use_ssl ? "true" : "false",
      smtp_od_email: data.smtp_od_email,
      smtp_od_jmeno: data.smtp_od_jmeno,
      smtp_timeout: String(data.smtp_timeout),
      je_aktivni: data.je_aktivni ? "true" : "false",
    },
    token,
  );
}

export async function upravOrganizaciSprava(
  slug: string,
  data: Partial<NovaOrganizace>,
  token: string,
): Promise<Organizace> {
  const obsahujeSoubor =
    (typeof File !== "undefined" && data.logo_soubor instanceof File) ||
    (typeof File !== "undefined" && data.banner_soubor instanceof File);

  if (obsahujeSoubor) {
    return odesliFormData<Organizace>(
      `/organizace/${slug}/`,
      {
        nazev: data.nazev,
        slug: data.slug,
        slug_subdomeny: data.slug_subdomeny ?? undefined,
        vlastni_domena: data.vlastni_domena,
        tenant_aktivni: data.tenant_aktivni !== undefined ? (data.tenant_aktivni ? "true" : "false") : undefined,
        nazev_verejny: data.nazev_verejny,
        verejny_popis: data.verejny_popis,
        logo_url: data.logo_url,
        logo_soubor: data.logo_soubor ?? undefined,
        banner_soubor: data.banner_soubor ?? undefined,
        banner_popis: data.banner_popis,
        typ_organizace: data.typ_organizace,
        kontaktni_email: data.kontaktni_email,
        kontaktni_telefon: data.kontaktni_telefon,
        hlavni_barva: data.hlavni_barva,
        fakturacni_nazev: data.fakturacni_nazev,
        ico: data.ico,
        dic: data.dic,
        fakturacni_ulice: data.fakturacni_ulice,
        fakturacni_mesto: data.fakturacni_mesto,
        fakturacni_psc: data.fakturacni_psc,
        cislo_uctu: data.cislo_uctu,
        kod_banky: data.kod_banky,
        iban: data.iban,
        swift: data.swift,
        smtp_aktivni: data.smtp_aktivni !== undefined ? (data.smtp_aktivni ? "true" : "false") : undefined,
        smtp_host: data.smtp_host,
        smtp_port: data.smtp_port !== undefined ? String(data.smtp_port) : undefined,
        smtp_uzivatel: data.smtp_uzivatel,
        smtp_heslo: data.smtp_heslo,
        smtp_use_tls: data.smtp_use_tls !== undefined ? (data.smtp_use_tls ? "true" : "false") : undefined,
        smtp_use_ssl: data.smtp_use_ssl !== undefined ? (data.smtp_use_ssl ? "true" : "false") : undefined,
        smtp_od_email: data.smtp_od_email,
        smtp_od_jmeno: data.smtp_od_jmeno,
        smtp_timeout: data.smtp_timeout !== undefined ? String(data.smtp_timeout) : undefined,
        je_aktivni: data.je_aktivni !== undefined ? (data.je_aktivni ? "true" : "false") : undefined,
      },
      token,
      "PATCH",
    );
  }

  const odpoved = await fetch(`${zakladApi}/organizace/${slug}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(vytvorHlavicky(token) ?? {}),
    },
    body: JSON.stringify(data),
  });

  if (!odpoved.ok) {
    const text = await odpoved.text();
    throw new Error(text || `Nepodarilo se upravit organizaci ${slug}: ${odpoved.status}`);
  }

  return (await odpoved.json()) as Organizace;
}

export async function vytvorMistoKonani(data: NoveMistoKonani): Promise<MistoKonani> {
  return odesliJson<MistoKonani>("/akce/mista-konani/", data);
}

export async function vytvorMistoKonaniSprava(
  data: NoveMistoKonani,
  token: string,
): Promise<MistoKonani> {
  return odesliFormData<MistoKonani>(
    "/akce/mista-konani/",
    {
      organizace: String(data.organizace),
      nazev: data.nazev,
      adresa: data.adresa,
      mesto: data.mesto,
      kapacita: String(data.kapacita),
      schema_sezeni: data.schema_sezeni ? JSON.stringify(data.schema_sezeni) : undefined,
      hlavni_fotka: data.hlavni_fotka ?? undefined,
    },
    token,
  );
}

export async function upravMistoKonaniSprava(
  id: number,
  data: Partial<NoveMistoKonani>,
  token: string,
): Promise<MistoKonani> {
  const obsahujeSoubor = typeof File !== "undefined" && data.hlavni_fotka instanceof File;
  if (obsahujeSoubor) {
    return odesliFormData<MistoKonani>(
      `/akce/mista-konani/${id}/`,
      {
        organizace: data.organizace ? String(data.organizace) : undefined,
        nazev: data.nazev,
        adresa: data.adresa,
        mesto: data.mesto,
        kapacita: data.kapacita !== undefined ? String(data.kapacita) : undefined,
        schema_sezeni: data.schema_sezeni ? JSON.stringify(data.schema_sezeni) : undefined,
        hlavni_fotka: data.hlavni_fotka ?? undefined,
      },
      token,
      "PATCH",
    );
  }
  const odpoved = await fetch(`${zakladApi}/akce/mista-konani/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(vytvorHlavicky(token) ?? {}),
    },
    body: JSON.stringify(data),
  });

  if (!odpoved.ok) {
    const text = await odpoved.text();
    throw new Error(text || `Nepodarilo se upravit misto konani ${id}: ${odpoved.status}`);
  }

  return (await odpoved.json()) as MistoKonani;
}

export async function vytvorAkci(data: NovaAkce): Promise<Akce> {
  return odesliJson<Akce>("/akce/", data);
}

export async function vytvorAkciSprava(data: NovaAkce, token: string): Promise<Akce> {
  return odesliFormData<Akce>(
    "/akce/",
    {
      organizace: String(data.organizace),
      nazev: data.nazev,
      slug: data.slug,
      typ_akce: data.typ_akce ?? "koncert",
      perex: data.perex,
      popis: data.popis,
      hlavni_fotka_url: data.hlavni_fotka_url,
      hlavni_fotka: data.hlavni_fotka ?? undefined,
      hlavni_fotka_pomer: data.hlavni_fotka_pomer,
      galerie_fotka_pomer: data.galerie_fotka_pomer,
      video_url: data.video_url,
      misto_konani: String(data.misto_konani),
      zacatek: data.zacatek,
      konec: data.konec ?? undefined,
      stav: data.stav,
      kapacita: String(data.kapacita),
      rezervace_platnost_minuty: String(data.rezervace_platnost_minuty),
      je_doporucena: data.je_doporucena ? "true" : "false",
    },
    token,
  );
}

export async function upravAkciSprava(
  slug: string,
  data: Partial<NovaAkce>,
  token: string,
): Promise<Akce> {
  const obsahujeSoubor = typeof File !== "undefined" && data.hlavni_fotka instanceof File;
  if (obsahujeSoubor) {
    return odesliFormData<Akce>(
      `/akce/${slug}/`,
      {
        organizace: data.organizace ? String(data.organizace) : undefined,
        nazev: data.nazev,
        slug: data.slug,
        typ_akce: data.typ_akce,
        perex: data.perex,
        popis: data.popis,
        hlavni_fotka_url: data.hlavni_fotka_url,
        hlavni_fotka: data.hlavni_fotka ?? undefined,
        hlavni_fotka_pomer: data.hlavni_fotka_pomer,
        galerie_fotka_pomer: data.galerie_fotka_pomer,
        video_url: data.video_url,
        misto_konani: data.misto_konani ? String(data.misto_konani) : undefined,
        zacatek: data.zacatek,
        konec: data.konec ?? undefined,
        stav: data.stav,
        kapacita: data.kapacita !== undefined ? String(data.kapacita) : undefined,
        rezervace_platnost_minuty:
          data.rezervace_platnost_minuty !== undefined
            ? String(data.rezervace_platnost_minuty)
            : undefined,
        je_doporucena:
          data.je_doporucena !== undefined ? (data.je_doporucena ? "true" : "false") : undefined,
      },
      token,
      "PATCH",
    );
  }
  const odpoved = await fetch(`${zakladApi}/akce/${slug}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(vytvorHlavicky(token) ?? {}),
    },
    body: JSON.stringify(data),
  });

  if (!odpoved.ok) {
    const text = await odpoved.text();
    throw new Error(text || `Nepodarilo se upravit akci ${slug}: ${odpoved.status}`);
  }

  return (await odpoved.json()) as Akce;
}

export async function nahrajFotkyGalerieAkceSprava(
  slug: string,
  fotky: File[],
  token: string,
): Promise<Akce> {
  const formData = new FormData();
  for (const fotka of fotky) {
    formData.append("fotky", fotka);
  }

  const odpoved = await fetch(`${zakladApi}/akce/${slug}/fotky/`, {
    method: "POST",
    headers: {
      ...(vytvorHlavicky(token) ?? {}),
    },
    body: formData,
  });

  if (!odpoved.ok) {
    throw await vytvorApiChybu(odpoved, `/akce/${slug}/fotky/`, "odeslat");
  }

  return (await odpoved.json()) as Akce;
}

export async function smazFotkuGalerieAkceSprava(
  slug: string,
  fotkaId: number,
  token: string,
): Promise<Akce> {
  const odpoved = await fetch(`${zakladApi}/akce/${slug}/fotky/${fotkaId}/`, {
    method: "DELETE",
    headers: {
      ...(vytvorHlavicky(token) ?? {}),
    },
  });

  if (!odpoved.ok) {
    throw await vytvorApiChybu(odpoved, `/akce/${slug}/fotky/${fotkaId}/`, "odeslat");
  }

  return (await odpoved.json()) as Akce;
}

export async function posunFotkuGalerieAkceSprava(
  slug: string,
  fotkaId: number,
  smer: "nahoru" | "dolu",
  token: string,
): Promise<Akce> {
  return odesliJson<Akce>(`/akce/${slug}/fotky/${fotkaId}/posunout/`, { smer }, token);
}

export async function doporucFotkuGalerieAkceSprava(
  slug: string,
  fotkaId: number,
  token: string,
): Promise<Akce> {
  return odesliJson<Akce>(`/akce/${slug}/fotky/${fotkaId}/doporucit/`, {}, token);
}

export async function zrusDoporuceniFotkyGalerieAkceSprava(
  slug: string,
  fotkaId: number,
  token: string,
): Promise<Akce> {
  return odesliJson<Akce>(`/akce/${slug}/fotky/${fotkaId}/zrusit-doporuceni/`, {}, token);
}

export async function upravFotkuGalerieAkceSprava(
  slug: string,
  fotkaId: number,
  data: { popis: string },
  token: string,
): Promise<Akce> {
  const odpoved = await fetch(`${zakladApi}/akce/${slug}/fotky/${fotkaId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(vytvorHlavicky(token) ?? {}),
    },
    body: JSON.stringify(data),
  });

  if (!odpoved.ok) {
    throw await vytvorApiChybu(odpoved, `/akce/${slug}/fotky/${fotkaId}/`, "odeslat");
  }

  return (await odpoved.json()) as Akce;
}

export async function prevzitSchemaMistaDoAkce(slug: string, token: string): Promise<Akce> {
  return odesliJson<Akce>(`/akce/${slug}/prevzit-schema-mista/`, {}, token);
}

export async function zrusitSchemaOverrideAkce(slug: string, token: string): Promise<Akce> {
  return odesliJson<Akce>(`/akce/${slug}/zrusit-schema-override/`, {}, token);
}

export async function blokovatMistoAkce(slug: string, kod: string, duvod: string, token: string): Promise<Akce> {
  return odesliJson<Akce>(`/akce/${slug}/blokovat-misto/`, { kod, duvod }, token);
}

export async function odblokovatMistoAkce(slug: string, kod: string, token: string): Promise<Akce> {
  return odesliJson<Akce>(`/akce/${slug}/odblokovat-misto/`, { kod }, token);
}

export async function vytvorClenstviSprava(
  data: NoveClenstviOrganizace,
  token: string,
): Promise<ClenstviOrganizace> {
  return odesliJson<ClenstviOrganizace>("/organizace/clenstvi/", data, token);
}

export async function upravClenstviSprava(
  id: number,
  data: Partial<Pick<ClenstviOrganizace, "role" | "je_aktivni">>,
  token: string,
): Promise<ClenstviOrganizace> {
  const odpoved = await fetch(`${zakladApi}/organizace/clenstvi/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(vytvorHlavicky(token) ?? {}),
    },
    body: JSON.stringify(data),
  });

  if (!odpoved.ok) {
    const text = await odpoved.text();
    throw new Error(text || `Nepodarilo se upravit clenstvi ${id}: ${odpoved.status}`);
  }

  return (await odpoved.json()) as ClenstviOrganizace;
}

type NovaKategorieVstupenky = {
  organizace: number;
  akce: number;
  nazev: string;
  popis: string;
  cena: string;
  mena: string;
  kapacita: number;
  prodej_od: string | null;
  prodej_do: string | null;
  je_aktivni: boolean;
};

export async function vytvorKategoriiVstupenky(
  data: NovaKategorieVstupenky,
): Promise<KategorieVstupenky> {
  return odesliJson<KategorieVstupenky>("/akce/kategorie-vstupenek/", data);
}

export async function vytvorKategoriiVstupenkySprava(
  data: NovaKategorieVstupenky,
  token: string,
): Promise<KategorieVstupenky> {
  return odesliJson<KategorieVstupenky>("/akce/kategorie-vstupenek/", data, token);
}

export async function upravKategoriiVstupenkySprava(
  id: number,
  data: Partial<NovaKategorieVstupenky & { povolene_zony: string[] }>,
  token: string,
): Promise<KategorieVstupenky> {
  const odpoved = await fetch(`${zakladApi}/akce/kategorie-vstupenek/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(vytvorHlavicky(token) ?? {}),
    },
    body: JSON.stringify(data),
  });

  if (!odpoved.ok) {
    const text = await odpoved.text();
    throw new Error(text || `Nepodarilo se upravit kategorii vstupenky ${id}: ${odpoved.status}`);
  }

  return (await odpoved.json()) as KategorieVstupenky;
}

export async function vytvorObjednavku(data: NovaObjednavka): Promise<Objednavka> {
  return odesliJson<Objednavka>("/objednavky/", data);
}

export async function vytvorPokladniProdej(data: PokladniProdej, token: string): Promise<Objednavka> {
  return odesliJson<Objednavka>("/objednavky/pokladna-prodej/", data, token);
}

export async function nactiObjednavku(verejneId: string): Promise<Objednavka | null> {
  try {
    return await nactiJson<Objednavka>(`/objednavky/${verejneId}/`);
  } catch {
    return null;
  }
}

export async function simulujPlatbu(
  verejneId: string,
  poskytovatel: "stripe" | "gopay" | "comgate" = "stripe",
): Promise<Objednavka> {
  return odesliJson<Objednavka>(`/platby/simulace/${verejneId}/`, {
    poskytovatel,
  });
}

export async function potvrditHotovostObjednavky(
  verejneId: string,
  token: string,
  odeslatNaEmail = false,
): Promise<Objednavka> {
  return odesliJson<Objednavka>(`/objednavky/${verejneId}/potvrdit-hotovost/`, { odeslat_na_email: odeslatNaEmail }, token);
}

export async function stornovatObjednavku(
  verejneId: string,
  token: string,
  duvod = "",
): Promise<Objednavka> {
  return odesliJson<Objednavka>(`/objednavky/${verejneId}/storno/`, { duvod }, token);
}

export async function vratitObjednavku(
  verejneId: string,
  token: string,
  duvod = "",
): Promise<Objednavka> {
  return odesliJson<Objednavka>(`/objednavky/${verejneId}/vratit/`, { duvod }, token);
}

export async function oznacitProformuJakoZaplacenou(
  cisloDokladu: string,
  token: string,
): Promise<ProformaDoklad> {
  return odesliJson<ProformaDoklad>(
    `/fakturace/proformy/${cisloDokladu}/oznacit-jako-zaplacene/`,
    {},
    token,
  );
}

export async function znovuOdeslatProformu(
  cisloDokladu: string,
  token: string,
): Promise<ProformaDoklad> {
  return odesliJson<ProformaDoklad>(
    `/fakturace/proformy/${cisloDokladu}/znovu-odeslat/`,
    {},
    token,
  );
}

export async function presaditVstupenkuObjednavky(
  verejneId: string,
  vstupenkaKod: string,
  noveMisto: string,
  token: string,
): Promise<Objednavka> {
  return odesliJson<Objednavka>(`/objednavky/${verejneId}/presadit/`, { vstupenka_kod: vstupenkaKod, nove_misto: noveMisto }, token);
}

export async function prohoditMistaObjednavky(
  verejneId: string,
  vstupenkaKodA: string,
  vstupenkaKodB: string,
  token: string,
): Promise<Objednavka> {
  return odesliJson<Objednavka>(`/objednavky/${verejneId}/prohodit-mista/`, { vstupenka_kod_a: vstupenkaKodA, vstupenka_kod_b: vstupenkaKodB }, token);
}

export async function provedOdbaveni(
  kod: string,
  oznaceni_zarizeni: string,
  token?: string,
): Promise<VysledekOdbaveni> {
  return odesliJson<VysledekOdbaveni>("/odbaveni/scan/", {
    kod,
    oznaceni_zarizeni,
  }, token);
}

export async function dorucVstupenkyObjednavky(verejneId: string, token?: string): Promise<Objednavka> {
  return odesliJson<Objednavka>(`/vstupenky/dorucit-objednavku/${verejneId}/`, {}, token);
}

export async function nactiVstupenku(kod: string): Promise<VstupenkaDetail | null> {
  try {
    return await nactiJson<VstupenkaDetail>(`/vstupenky/${kod}/`);
  } catch {
    return null;
  }
}

export async function nactiProfilSpravy(token: string): Promise<ProfilSpravy> {
  return nactiJson<ProfilSpravy>("/uzivatele/profil/", token);
}

export async function nactiPrehledSpravy(token: string): Promise<PrehledSpravy> {
  try {
    return await nactiJson<PrehledSpravy>("/prehledy/", token);
  } catch {
    return ukazkovyPrehledSpravy;
  }
}

export async function nactiNastaveniSystemu(token: string): Promise<NastaveniSystemu> {
  try {
    return await nactiJson<NastaveniSystemu>("/nastaveni-systemu/", token);
  } catch {
    return ukazkoveNastaveniSystemu;
  }
}

export async function upravNastaveniSystemu(
  data: UpravaNastaveniSystemu,
  token: string,
): Promise<NastaveniSystemu> {
  const odpoved = await fetch(`${zakladApi}/nastaveni-systemu/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(vytvorHlavicky(token) ?? {}),
    },
    body: JSON.stringify(data),
  });

  if (!odpoved.ok) {
    throw await vytvorApiChybu(odpoved, "/nastaveni-systemu/", "odeslat");
  }

  return (await odpoved.json()) as NastaveniSystemu;
}

export async function odesliTestovaciEmailSmtp(
  email: string,
  token: string,
): Promise<{ detail: string }> {
  return odesliJson<{ detail: string }>("/nastaveni-systemu/test-smtp/", { email }, token);
}

export function vytvorTokenSpravy(uzivatel: string, heslo: string): string {
  if (typeof window !== "undefined") {
    return `Basic ${window.btoa(`${uzivatel}:${heslo}`)}`;
  }

  return `Basic ${Buffer.from(`${uzivatel}:${heslo}`).toString("base64")}`;
}

const ukazkovaData: SouhrnAdministrace = {
  organizace: [
    {
      id: 1,
      nazev: "Dolni Kralovice",
      slug: "dolni-kralovice",
      typ_organizace: "obec",
      kontaktni_email: "kultura@dolni-kralovice.cz",
      kontaktni_telefon: "+420 777 123 456",
      hlavni_barva: "#57C7A5",
      fakturacni_nazev: "Obec Dolní Kralovice",
      ico: "00231868",
      dic: "",
      fakturacni_ulice: "Dolní Kralovice 1",
      fakturacni_mesto: "Dolní Kralovice",
      fakturacni_psc: "25768",
      cislo_uctu: "1265098001",
      kod_banky: "5500",
      iban: "CZ5855000000001265098001",
      swift: "",
      smtp_aktivni: false,
      smtp_host: "",
      smtp_port: 587,
      smtp_uzivatel: "",
      smtp_use_tls: true,
      smtp_use_ssl: false,
      smtp_od_email: "",
      smtp_od_jmeno: "",
      smtp_timeout: 20,
      ma_vlastni_smtp: false,
      je_aktivni: true,
      vytvoreno: "2026-04-23T19:57:08.316338+02:00",
      upraveno: "2026-04-23T19:57:08.316368+02:00",
    },
  ],
  clenstvi: [
    {
      id: 1,
      organizace: 1,
      organizace_nazev: "Dolni Kralovice",
      uzivatel: 1,
      uzivatel_jmeno: "spravce",
      uzivatel_email: "spravce@kliknilistek.local",
      role: "spravce",
      je_aktivni: true,
      vytvoreno: "2026-04-23T19:57:08.316338+02:00",
      upraveno: "2026-04-23T19:57:08.316368+02:00",
    },
    {
      id: 2,
      organizace: 1,
      organizace_nazev: "Dolni Kralovice",
      uzivatel: 2,
      uzivatel_jmeno: "pokladna",
      uzivatel_email: "pokladna@kliknilistek.local",
      role: "pokladna",
      je_aktivni: true,
      vytvoreno: "2026-04-23T19:57:08.316338+02:00",
      upraveno: "2026-04-23T19:57:08.316368+02:00",
    },
  ],
  mistaKonani: [
    {
      id: 1,
      organizace: 1,
      organizace_nazev: "Dolni Kralovice",
      nazev: "Kulturni dum Dolni Kralovice",
      adresa: "Namesti 12",
      mesto: "Dolni Kralovice",
      kapacita: 320,
      vytvoreno: "2026-04-23T19:57:08.316338+02:00",
      upraveno: "2026-04-23T19:57:08.316368+02:00",
    },
  ],
  akce: [
    {
      id: 1,
      organizace: 1,
      organizace_nazev: "Dolni Kralovice",
      nazev: "Jarni koncert v kulturnim dome",
      slug: "jarni-koncert-2026",
      typ_akce: "koncert",
      perex: "Vecerni koncert mistnich souboru a hostu s jednoduchym online prodejem vstupenek.",
      popis: "Vecerni koncert mistnich souboru a hostu.",
      hlavni_fotka_url:
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
      video_url: "",
      misto_konani: 1,
      misto_konani_nazev: "Kulturni dum Dolni Kralovice",
      schema_sezeni: {
        typ: "kinosal_dolni_kralovice",
        nazev: "Kinosal Dolni Kralovice",
        popis: "Mistenkovy vyber sedadel pro kino v Dolnich Kralovicich.",
        sloupce_stred: 17,
        sloupce_levy_pristavek: 2,
        sloupce_pravy_pristavek: 3,
        stit: "Jeviste",
        rady: [
          { rada: 1, levy_pristavek: [1, 2], stred: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17], pravy_pristavek: [11,12], zona_levy: "pristavek_predni", zona_pravy: "pristavek_predni", odsazeni_stred: 0 },
          { rada: 2, levy_pristavek: [3, 4], stred: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17], pravy_pristavek: [13,14], zona_levy: "pristavek_predni", zona_pravy: "pristavek_predni", odsazeni_stred: 0 },
          { rada: 3, levy_pristavek: [5, 6], stred: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17], pravy_pristavek: [15,16], zona_levy: "pristavek_predni", zona_pravy: "pristavek_predni", odsazeni_stred: 0 },
          { rada: 4, levy_pristavek: [7, 8], stred: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17], pravy_pristavek: [17,18], zona_levy: "pristavek_predni", zona_pravy: "pristavek_predni", odsazeni_stred: 0 },
          { rada: 5, levy_pristavek: [9, 10], stred: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17], pravy_pristavek: [19,20,21], zona_levy: "pristavek_predni", zona_pravy: "pristavek_predni", odsazeni_stred: 0 },
          { rada: 6, levy_pristavek: [22, 23], stred: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17], pravy_pristavek: [31,32], zona_levy: "pristavek_zadni", zona_pravy: "pristavek_zadni", odsazeni_stred: 0 },
          { rada: 7, levy_pristavek: [24, 25], stred: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], pravy_pristavek: [33,34], zona_levy: "pristavek_zadni", zona_pravy: "pristavek_zadni", odsazeni_stred: 0 },
          { rada: 8, levy_pristavek: [26, 27], stred: [1,2,3,4,5,6,7,8,9,10,11,12,13], pravy_pristavek: [35], zona_levy: "pristavek_zadni", zona_pravy: "pristavek_zadni", odsazeni_stred: 2 },
          { rada: 9, levy_pristavek: [28, 29], stred: [1,2,3,4,5,6,7,8,9,10,11,12], pravy_pristavek: [36,37], zona_levy: "pristavek_zadni", zona_pravy: "pristavek_zadni", odsazeni_stred: 3 },
          { rada: 10, levy_pristavek: [30], stred: [1,2,3,4,5,6,7,8,9,10,11,12,13], pravy_pristavek: [38,39], zona_levy: "pristavek_zadni", zona_pravy: "pristavek_zadni", odsazeni_stred: 2 },
          { rada: 11, levy_pristavek: [], stred: [1,2,3,4,5,6,7,8,9,10,11,12,13,14], pravy_pristavek: [40], zona_levy: "pristavek_zadni", zona_pravy: "pristavek_zadni", odsazeni_stred: 2 },
        ],
      },
      obsazena_mista: ["R1-S9", "R2-S10"],
      zacatek: "2026-05-07T19:00:00+02:00",
      konec: "2026-05-07T22:00:00+02:00",
      stav: "zverejneno",
      kapacita: 320,
      rezervace_platnost_minuty: 15,
      je_doporucena: true,
      vytvoreno: "2026-04-23T19:57:08.316338+02:00",
      upraveno: "2026-04-23T19:57:08.316368+02:00",
    },
  ],
  kategorieVstupenek: [
    {
      id: 1,
      organizace: 1,
      organizace_nazev: "Dolni Kralovice",
      akce: 1,
      akce_nazev: "Jarni koncert v kulturnim dome",
      nazev: "Zakladni vstupenka",
      popis: "Standardni vstup na celou akci.",
      cena: "180.00",
      mena: "CZK",
      kapacita: 260,
      prodej_od: "2026-04-23T19:57:08.316338+02:00",
      prodej_do: "2026-05-07T17:00:00+02:00",
      je_aktivni: true,
      vytvoreno: "2026-04-23T19:57:08.316338+02:00",
      upraveno: "2026-04-23T19:57:08.316368+02:00",
    },
    {
      id: 2,
      organizace: 1,
      organizace_nazev: "Dolni Kralovice",
      akce: 1,
      akce_nazev: "Jarni koncert v kulturnim dome",
      nazev: "Zvyhodnena vstupenka",
      popis: "Studenti a seniori.",
      cena: "120.00",
      mena: "CZK",
      kapacita: 60,
      prodej_od: "2026-04-23T19:57:08.316338+02:00",
      prodej_do: "2026-05-07T17:00:00+02:00",
      je_aktivni: true,
      vytvoreno: "2026-04-23T19:57:08.316338+02:00",
      upraveno: "2026-04-23T19:57:08.316368+02:00",
    },
  ],
  objednavky: [
    {
      id: 1,
      verejne_id: "06FC3B09F29A",
      organizace: 1,
      email_zakaznika: "jana.novakova@example.cz",
      jmeno_zakaznika: "Jana Novakova",
      telefon_zakaznika: "+420777100200",
      stav: "zaplaceno",
      zpusob_uhrady: "online",
      mezisoucet: "180.00",
      poplatek: "0.00",
      celkem: "180.00",
      mena: "CZK",
      rezervace_do: "2026-04-24T17:15:00+02:00",
      je_rezervace_aktivni: true,
      vytvoreno: "2026-04-24T17:00:00+02:00",
      polozky: [
        {
          id: 1,
          akce: 1,
          akce_nazev: "Jarni koncert v kulturnim dome",
          kategorie_vstupenky: 1,
          kategorie_vstupenky_nazev: "Zakladni vstupenka",
          pocet: 1,
          vybrana_mista: ["R1-S9"],
          cena_za_kus: "180.00",
          cena_celkem: "180.00",
        },
      ],
      vstupenky: [
        {
          id: 1,
          kod: "DDBA01EC182341DEBB8690102435B497",
          stav: "platna",
          akce_nazev: "Jarni koncert v kulturnim dome",
          kategorie_vstupenky_nazev: "Zakladni vstupenka",
          oznaceni_mista: "R1-S9",
          dorucena: "2026-04-24T17:05:00+02:00",
        },
      ],
      platby: [
        {
          id: 1,
          poskytovatel: "stripe",
          stav: "uspesna",
          castka: "180.00",
          mena: "CZK",
          vytvoreno: "2026-04-24T17:03:00+02:00",
        },
      ],
      proforma_doklad: null,
    },
  ],
  platby: [
    {
      id: 1,
      objednavka: 1,
      objednavka_verejne_id: "06FC3B09F29A",
      poskytovatel: "stripe",
      reference_poskytovatele: "SIM-06FC3B09F29A",
      stav: "uspesna",
      castka: "180.00",
      mena: "CZK",
      data_poskytovatele: {},
      vytvoreno: "2026-04-24T17:03:00+02:00",
    },
  ],
  proformy: [],
};

const ukazkovyPrehledSpravy: PrehledSpravy = {
  souhrn: {
    organizace_celkem: 1,
    akce_celkem: 1,
    akce_zverejnene: 1,
    objednavky_celkem: 3,
    objednavky_cekaji_na_platbu: 1,
    objednavky_zaplacene: 2,
    trzby_celkem: "480.00",
    prodane_vstupenky: 3,
    platne_vstupenky: 2,
    odbavene_vstupenky: 1,
    dorucene_vstupenky: 2,
    navstevnost_procent: 33,
  },
  stavy_objednavek: [
    { stav: "ceka_na_platbu", pocet: 1 },
    { stav: "zaplaceno", pocet: 2 },
  ],
  stavy_vstupenek: [
    { stav: "platna", pocet: 2 },
    { stav: "odbavena", pocet: 1 },
  ],
  vykonnost_akci: [
    {
      id: 1,
      nazev: "Jarni koncert v kulturnim dome",
      slug: "jarni-koncert-2026",
      stav: "zverejneno",
      zacatek: "2026-05-07T19:00:00+02:00",
      misto_konani_nazev: "Kulturni dum Dolni Kralovice",
      kapacita: 320,
      objednavky_celkem: 3,
      prodane_vstupenky: 3,
      platne_vstupenky: 2,
      odbavene_vstupenky: 1,
      dorucene_vstupenky: 2,
      trzby_celkem: "480.00",
      obsazenost_procent: 1,
      navstevnost_procent: 33,
    },
  ],
};

const ukazkoveNastaveniSystemu: NastaveniSystemu = {
  smtp_aktivni: false,
  smtp_host: "",
  smtp_port: 587,
  smtp_uzivatel: "",
  smtp_use_tls: true,
  smtp_use_ssl: false,
  smtp_od_email: "",
  smtp_od_jmeno: "",
  smtp_timeout: 20,
  ma_globalni_smtp: false,
};
