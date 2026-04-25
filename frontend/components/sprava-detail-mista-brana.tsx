"use client";

import { useEffect, useMemo, useState } from "react";

import { PlanSalu } from "@/components/plan-salu";
import { GrafRozlozeni, GrafSloupcovy } from "@/components/sprava-grafy";
import {
  nactiProfilSpravy,
  nactiSouhrnAdministrace,
  upravMistoKonaniSprava,
  vytvorTokenSpravy,
  type Akce,
  type MistoKonani,
  type ProfilSpravy,
} from "@/lib/api";
import { vytvorVychoziPrihlaseni } from "@/lib/demo-rezim";

const klicTokenu = "kliknilistek.sprava.token";
const vychoziRadky = 18;
const vychoziSloupce = 24;

type StavNacitani = "cekam" | "prihlaseni" | "nacitani" | "pripraveno";
type RezimPrace = "malovani" | "vyber";
type TypPole =
  | "prazdne"
  | "sedadlo"
  | "stul"
  | "stul_objekt"
  | "jeviste"
  | "parket"
  | "pristavek"
  | "sloup"
  | "zed"
  | "dvere"
  | "okno"
  | "vychod";

type BunkaEditoru = {
  radek: number;
  sloupec: number;
  typ: TypPole;
  kod: string;
  oznaceni: string;
  popis: string;
  vazba_stul: string;
};

type PodlaziEditoru = {
  id: string;
  nazev: string;
  stit: string;
  radky: number;
  sloupce: number;
  odsazeni_x: number;
  odsazeni_y: number;
  mezera_x: number;
  mezera_y: number;
  bunky: BunkaEditoru[];
};

type SchemaSedeni = NonNullable<Akce["schema_sezeni"]>;
type MrizkaSchema = NonNullable<NonNullable<SchemaSedeni["mrizka"]>>;
type OblastVyberu = {
  odRadku: number;
  doRadku: number;
  odSloupce: number;
  doSloupce: number;
};

const popiskyTypu: Record<TypPole, string> = {
  prazdne: "Prazdne",
  sedadlo: "Sedadlo",
  stul: "Misto u stolu",
  stul_objekt: "Stul",
  jeviste: "Jeviste",
  parket: "Parket",
  pristavek: "Pristavek",
  sloup: "Sloup",
  zed: "Zed",
  dvere: "Dvere",
  okno: "Okno",
  vychod: "Vychod",
};

const typyNastroju: TypPole[] = [
  "sedadlo",
  "stul_objekt",
  "stul",
  "jeviste",
  "parket",
  "pristavek",
  "sloup",
  "zed",
  "dvere",
  "okno",
  "vychod",
  "prazdne",
];

const prodejneTypy: TypPole[] = ["sedadlo", "stul"];

function vytvorPrazdnouMrizku(radky: number, sloupce: number): BunkaEditoru[] {
  return Array.from({ length: radky * sloupce }).map((_, index) => ({
    radek: Math.floor(index / sloupce) + 1,
    sloupec: (index % sloupce) + 1,
    typ: "prazdne" as TypPole,
    kod: "",
    oznaceni: "",
    popis: "",
    vazba_stul: "",
  }));
}

function vytvorVychoziPodlazi(poradi = 1): PodlaziEditoru {
  return {
    id: `podlazi-${poradi}`,
    nazev: poradi === 1 ? "Prizemi" : `Podlazi ${poradi}`,
    stit: "",
    radky: vychoziRadky,
    sloupce: vychoziSloupce,
    odsazeni_x: 0,
    odsazeni_y: 0,
    mezera_x: 4,
    mezera_y: 4,
    bunky: vytvorPrazdnouMrizku(vychoziRadky, vychoziSloupce),
  };
}

function vytvorPodlaziZeSchema(mrizka?: Partial<MrizkaSchema>, poradi = 1, id = `podlazi-${poradi}`, nazev = poradi === 1 ? "Prizemi" : `Podlazi ${poradi}`, stit = ""): PodlaziEditoru {
  const radky = mrizka?.radky ?? vychoziRadky;
  const sloupce = mrizka?.sloupce ?? vychoziSloupce;
  const mapaBunek = new Map(
    (mrizka?.bunky ?? []).map((bunka) => [`${bunka.radek}:${bunka.sloupec}`, bunka]),
  );

  return {
    id,
    nazev,
    stit,
    radky,
    sloupce,
    odsazeni_x: mrizka?.odsazeni_x ?? 0,
    odsazeni_y: mrizka?.odsazeni_y ?? 0,
    mezera_x: mrizka?.mezera_x ?? 4,
    mezera_y: mrizka?.mezera_y ?? 4,
    bunky: Array.from({ length: radky * sloupce }).map((_, index) => {
      const radek = Math.floor(index / sloupce) + 1;
      const sloupec = (index % sloupce) + 1;
      const bunka = mapaBunek.get(`${radek}:${sloupec}`);
      return {
        radek,
        sloupec,
        typ: (bunka?.typ as TypPole) ?? "prazdne",
        kod: bunka?.kod ?? "",
        oznaceni: bunka?.oznaceni ?? "",
        popis: bunka?.popis ?? "",
        vazba_stul: bunka?.vazba_stul ?? "",
      };
    }),
  };
}

function schemaNaBuilder(schema?: MistoKonani["schema_sezeni"]) {
  if (!schema) {
    return {
      schemaNazev: "Mrizkovy planek",
      schemaPopis: "Klikaci planek mistenek pro misto konani.",
      podlazi: [vytvorVychoziPodlazi()],
    };
  }

  const podlazi =
    schema.podlazi?.length
      ? schema.podlazi.map((podlaziSchema, index) =>
          vytvorPodlaziZeSchema(
            podlaziSchema.mrizka,
            index + 1,
            podlaziSchema.id || `podlazi-${index + 1}`,
            podlaziSchema.nazev || (index === 0 ? "Prizemi" : `Podlazi ${index + 1}`),
            podlaziSchema.stit || "",
          ),
        )
      : [vytvorPodlaziZeSchema(schema.mrizka, 1, "podlazi-1", "Prizemi", schema.stit || "")];

  return {
    schemaNazev: schema.nazev || "Mrizkovy planek",
    schemaPopis: schema.popis || "Klikaci planek mistenek pro misto konani.",
    podlazi,
  };
}

function vytvorSchemaBuilderu(schemaNazev: string, schemaPopis: string, podlazi: PodlaziEditoru[]): SchemaSedeni {
  const podlaziSchema = podlazi.map((polozka) => ({
    id: polozka.id,
    nazev: polozka.nazev,
    stit: polozka.stit,
    mrizka: {
      radky: polozka.radky,
      sloupce: polozka.sloupce,
      odsazeni_x: polozka.odsazeni_x,
      odsazeni_y: polozka.odsazeni_y,
      mezera_x: polozka.mezera_x,
      mezera_y: polozka.mezera_y,
      bunky: polozka.bunky
        .filter((bunka) => bunka.typ !== "prazdne")
        .map((bunka) => ({
          radek: bunka.radek,
          sloupec: bunka.sloupec,
          typ: bunka.typ,
          kod: prodejneTypy.includes(bunka.typ) ? bunka.kod.trim() : "",
          oznaceni: bunka.oznaceni.trim(),
          popis: bunka.popis.trim(),
          vazba_stul: bunka.vazba_stul.trim(),
        })),
    },
  }));

  return {
    typ: "mrizka_builder",
    nazev: schemaNazev,
    popis: schemaPopis,
    stit: podlaziSchema[0]?.stit ?? "",
    mrizka: podlaziSchema[0]?.mrizka,
    podlazi: podlaziSchema,
    rady: [],
  };
}

function posunOblasti(smer: "vpravo" | "vlevo" | "dolu" | "nahoru", odRadku: number, doRadku: number, odSloupce: number, doSloupce: number) {
  const vyska = doRadku - odRadku + 1;
  const sirka = doSloupce - odSloupce + 1;
  if (smer === "vpravo") {
    return { radekPosun: 0, sloupecPosun: sirka };
  }
  if (smer === "vlevo") {
    return { radekPosun: 0, sloupecPosun: -sirka };
  }
  if (smer === "dolu") {
    return { radekPosun: vyska, sloupecPosun: 0 };
  }
  return { radekPosun: -vyska, sloupecPosun: 0 };
}

function klonujPodlazi(data: PodlaziEditoru[]) {
  return data.map((podlazi) => ({
    ...podlazi,
    bunky: podlazi.bunky.map((bunka) => ({ ...bunka })),
  }));
}

function vyctiCislo(text: string) {
  const shoda = text.match(/(\d+)/);
  return shoda ? Number(shoda[1]) : 0;
}

function vytvorGeneratoryOznaceni(bunky: BunkaEditoru[]) {
  let posledniSedadlo = bunky
    .filter((bunka) => bunka.typ === "sedadlo")
    .reduce((max, bunka) => Math.max(max, vyctiCislo(bunka.kod || bunka.oznaceni)), 0);
  let posledniMistoUStolu = bunky
    .filter((bunka) => bunka.typ === "stul")
    .reduce((max, bunka) => Math.max(max, vyctiCislo(bunka.kod || bunka.oznaceni)), 0);
  let posledniStul = bunky
    .filter((bunka) => bunka.typ === "stul_objekt")
    .reduce((max, bunka) => Math.max(max, vyctiCislo(bunka.oznaceni || bunka.popis)), 0);

  return {
    dalsiSedadlo() {
      posledniSedadlo += 1;
      return {
        kod: `SD${posledniSedadlo}`,
        oznaceni: String(posledniSedadlo),
        popis: `Sedadlo ${posledniSedadlo}`,
      };
    },
    dalsiMistoUStolu() {
      posledniMistoUStolu += 1;
      return {
        kod: `ST${posledniMistoUStolu}`,
        oznaceni: String(posledniMistoUStolu),
        popis: `Misto u stolu ${posledniMistoUStolu}`,
      };
    },
    dalsiStul() {
      posledniStul += 1;
      return {
        kod: "",
        oznaceni: String(posledniStul),
        popis: `Stul ${posledniStul}`,
      };
    },
  };
}

function vytvorVychoziOznaceniProTyp(
  typ: TypPole,
  generatory: ReturnType<typeof vytvorGeneratoryOznaceni>,
) {
  if (typ === "sedadlo") {
    return generatory.dalsiSedadlo();
  }
  if (typ === "stul") {
    return generatory.dalsiMistoUStolu();
  }
  if (typ === "stul_objekt") {
    return generatory.dalsiStul();
  }
  return { kod: "", oznaceni: "", popis: "" };
}

export function SpravaDetailMistaBrana({ idMista }: { idMista: string }) {
  const [stav, nastavStav] = useState<StavNacitani>("cekam");
  const [tokenSpravy, nastavTokenSpravy] = useState("");
  const [profil, nastavProfil] = useState<ProfilSpravy | null>(null);
  const [misto, nastavMisto] = useState<MistoKonani | null>(null);
  const [chyba, nastavChybu] = useState("");
  const [zprava, nastavZpravu] = useState("");
  const [formular, nastavFormular] = useState(vytvorVychoziPrihlaseni("spravce"));
  const [editor, nastavEditor] = useState({
    nazev: "",
    adresa: "",
    mesto: "",
    kapacita: "0",
    hlavni_fotka: null as File | null,
    schema_nazev: "Mrizkovy planek",
    schema_popis: "Klikaci planek mistenek pro misto konani.",
  });
  const [aktivniNastroj, nastavAktivniNastroj] = useState<TypPole>("sedadlo");
  const [rezimPrace, nastavRezimPrace] = useState<RezimPrace>("malovani");
  const [podlazi, nastavPodlazi] = useState<PodlaziEditoru[]>([vytvorVychoziPodlazi()]);
  const [aktivniPodlaziId, nastavAktivniPodlaziId] = useState("podlazi-1");
  const [malujeSe, nastavMalovani] = useState(false);
  const [vybranaBunka, nastavVybranouBunku] = useState<{ radek: number; sloupec: number } | null>(null);
  const [zacatekObdelniku, nastavZacatekObdelniku] = useState<{ radek: number; sloupec: number } | null>(null);
  const [vyberOblasti, nastavVyberOblasti] = useState<OblastVyberu | null>(null);
  const [historieZpet, nastavHistoriiZpet] = useState<PodlaziEditoru[][]>([]);
  const [historieVpred, nastavHistoriiVpred] = useState<PodlaziEditoru[][]>([]);
  const [nahledFotkyMista, nastavNahledFotkyMista] = useState("");

  useEffect(() => {
    function ukonciMalovani() {
      nastavMalovani(false);
    }
    window.addEventListener("mouseup", ukonciMalovani);
    return () => window.removeEventListener("mouseup", ukonciMalovani);
  }, []);

  useEffect(() => {
    function obsluzKlavesy(event: KeyboardEvent) {
      const cil = event.target as HTMLElement | null;
      const jeVPoli =
        cil?.tagName === "INPUT" || cil?.tagName === "TEXTAREA" || cil?.tagName === "SELECT" || cil?.isContentEditable;
      if (jeVPoli) {
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        vratZmenu();
      }
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey))
      ) {
        event.preventDefault();
        zopakujZmenu();
      }
    }
    window.addEventListener("keydown", obsluzKlavesy);
    return () => window.removeEventListener("keydown", obsluzKlavesy);
  }, [historieVpred.length, historieZpet.length, podlazi]);

  async function nacti(token: string) {
    nastavStav("nacitani");
    nastavChybu("");
    try {
      const [profilSpravy, data] = await Promise.all([nactiProfilSpravy(token), nactiSouhrnAdministrace(token)]);
      if (!profilSpravy.ma_pristup_do_spravy || !profilSpravy.opravneni.sprava_obsahu) {
        throw new Error("Tento ucet nema pristup ke sprave mist konani.");
      }
      const detail = data.mistaKonani.find((polozka) => polozka.id === Number(idMista)) ?? null;
      if (!detail) {
        throw new Error("Misto konani nebylo nalezeno.");
      }
      const builder = schemaNaBuilder(detail.schema_sezeni);

      localStorage.setItem(klicTokenu, token);
      nastavTokenSpravy(token);
      nastavProfil(profilSpravy);
      nastavMisto(detail);
      nastavEditor({
        nazev: detail.nazev,
        adresa: detail.adresa,
        mesto: detail.mesto,
        kapacita: String(detail.kapacita),
        hlavni_fotka: null,
        schema_nazev: builder.schemaNazev,
        schema_popis: builder.schemaPopis,
      });
      nastavPodlazi(builder.podlazi);
      nastavAktivniPodlaziId(builder.podlazi[0]?.id ?? "podlazi-1");
      nastavVybranouBunku(null);
      nastavZacatekObdelniku(null);
      nastavVyberOblasti(null);
      nastavHistoriiZpet([]);
      nastavHistoriiVpred([]);
      nastavStav("pripraveno");
    } catch (error) {
      localStorage.removeItem(klicTokenu);
      nastavTokenSpravy("");
      nastavProfil(null);
      nastavMisto(null);
      nastavStav("prihlaseni");
      nastavChybu(error instanceof Error ? error.message : "Misto konani se nepodarilo nacist.");
    }
  }

  useEffect(() => {
    const ulozenyToken = localStorage.getItem(klicTokenu);
    if (!ulozenyToken) {
      nastavStav("prihlaseni");
      return;
    }
    void nacti(ulozenyToken);
  }, [idMista]);

  useEffect(() => {
    if (!editor.hlavni_fotka) {
      nastavNahledFotkyMista("");
      return;
    }

    const url = URL.createObjectURL(editor.hlavni_fotka);
    nastavNahledFotkyMista(url);
    return () => URL.revokeObjectURL(url);
  }, [editor.hlavni_fotka]);

  const aktivniPodlazi = useMemo(
    () => podlazi.find((polozka) => polozka.id === aktivniPodlaziId) ?? podlazi[0] ?? null,
    [aktivniPodlaziId, podlazi],
  );

  const detailVybraneBunky = useMemo(() => {
    if (!aktivniPodlazi || !vybranaBunka) {
      return null;
    }
    return aktivniPodlazi.bunky.find((bunka) => bunka.radek === vybranaBunka.radek && bunka.sloupec === vybranaBunka.sloupec) ?? null;
  }, [aktivniPodlazi, vybranaBunka]);

  const schemaNahledu = useMemo(
    () => vytvorSchemaBuilderu(editor.schema_nazev, editor.schema_popis, podlazi),
    [editor.schema_nazev, editor.schema_popis, podlazi],
  );

  const souhrnTypu = useMemo(
    () =>
      podlazi.flatMap((polozka) => polozka.bunky).reduce(
        (acc, bunka) => {
          acc[bunka.typ] += 1;
          return acc;
        },
        {
          prazdne: 0,
          sedadlo: 0,
          stul: 0,
          stul_objekt: 0,
          jeviste: 0,
          parket: 0,
          pristavek: 0,
          sloup: 0,
          zed: 0,
          dvere: 0,
          okno: 0,
          vychod: 0,
        } satisfies Record<TypPole, number>,
      ),
    [podlazi],
  );

  const nepojmenovanaProdejnaMista = useMemo(
    () =>
      podlazi.flatMap((polozka) => polozka.bunky).filter((bunka) => prodejneTypy.includes(bunka.typ) && (!bunka.kod.trim() || !bunka.oznaceni.trim())).length,
    [podlazi],
  );
  const grafTypu = useMemo(
    () => [
      { stitek: "Sedadla", hodnota: souhrnTypu.sedadlo, barva: "#7db9ff" },
      { stitek: "Místa u stolu", hodnota: souhrnTypu.stul, barva: "#d8ccef" },
      { stitek: "Stoly", hodnota: souhrnTypu.stul_objekt, barva: "#b98d63" },
      { stitek: "Jeviště", hodnota: souhrnTypu.jeviste, barva: "#f28d8d" },
      { stitek: "Parket", hodnota: souhrnTypu.parket, barva: "#f5c36b" },
      { stitek: "Přístavky", hodnota: souhrnTypu.pristavek, barva: "#cfb9f0" },
    ],
    [souhrnTypu],
  );
  const grafPodlazi = useMemo(
    () =>
      podlazi.map((polozka) => ({
        stitek: polozka.nazev,
        hodnota: polozka.bunky.filter((bunka) => bunka.typ !== "prazdne").length,
      })),
    [podlazi],
  );

  function provedZmenuPodlazi(transformace: (aktualni: PodlaziEditoru[]) => PodlaziEditoru[]) {
    nastavPodlazi((aktualni) => {
      const puvodni = klonujPodlazi(aktualni);
      const dalsi = transformace(klonujPodlazi(aktualni));
      nastavHistoriiZpet((historie) => [...historie.slice(-59), puvodni]);
      nastavHistoriiVpred([]);
      return dalsi;
    });
  }

  function aktualizujAktivniPodlazi(uprava: (aktualni: PodlaziEditoru) => PodlaziEditoru) {
    if (!aktivniPodlazi) {
      return;
    }
    provedZmenuPodlazi((aktualni) =>
      aktualni.map((polozka) => (polozka.id === aktivniPodlazi.id ? uprava(polozka) : polozka)),
    );
  }

  function vratZmenu() {
    if (!historieZpet.length) {
      return;
    }
    const predchozi = historieZpet[historieZpet.length - 1];
    nastavHistoriiZpet((historie) => historie.slice(0, -1));
    nastavHistoriiVpred((historie) => [...historie, klonujPodlazi(podlazi)]);
    nastavPodlazi(klonujPodlazi(predchozi));
  }

  function zopakujZmenu() {
    if (!historieVpred.length) {
      return;
    }
    const dalsi = historieVpred[historieVpred.length - 1];
    nastavHistoriiVpred((historie) => historie.slice(0, -1));
    nastavHistoriiZpet((historie) => [...historie, klonujPodlazi(podlazi)]);
    nastavPodlazi(klonujPodlazi(dalsi));
  }

  function aktualizujBunku(radek: number, sloupec: number, zmeny: Partial<BunkaEditoru>) {
    aktualizujAktivniPodlazi((aktualni) => ({
      ...aktualni,
      bunky: aktualni.bunky.map((bunka) =>
        bunka.radek === radek && bunka.sloupec === sloupec ? { ...bunka, ...zmeny } : bunka,
      ),
    }));
  }

  function nastavTypBunky(radek: number, sloupec: number, typ: TypPole) {
    aktualizujAktivniPodlazi((aktualni) => {
      const generatory = vytvorGeneratoryOznaceni(aktualni.bunky);
      return {
        ...aktualni,
        bunky: aktualni.bunky.map((bunka) => {
          if (bunka.radek !== radek || bunka.sloupec !== sloupec) {
            return bunka;
          }
          if (typ === "prazdne") {
            return {
              ...bunka,
              typ,
              kod: "",
              oznaceni: "",
              popis: "",
              vazba_stul: "",
            };
          }
          const vychozi = vytvorVychoziOznaceniProTyp(typ, generatory);
          return {
            ...bunka,
            typ,
            kod: prodejneTypy.includes(typ) ? bunka.kod || vychozi.kod : "",
            oznaceni: bunka.oznaceni || vychozi.oznaceni,
            popis: bunka.popis || vychozi.popis,
            vazba_stul: typ === "stul" ? bunka.vazba_stul : "",
          };
        }),
      };
    });
  }

  function prekresliMrizku(noveRadky: number, noveSloupce: number) {
    aktualizujAktivniPodlazi((aktualni) => {
      const mapa = new Map(aktualni.bunky.map((bunka) => [`${bunka.radek}:${bunka.sloupec}`, bunka]));
      return {
        ...aktualni,
        radky: noveRadky,
        sloupce: noveSloupce,
        bunky: Array.from({ length: noveRadky * noveSloupce }).map((_, index) => {
          const radek = Math.floor(index / noveSloupce) + 1;
          const sloupec = (index % noveSloupce) + 1;
          const puvodni = mapa.get(`${radek}:${sloupec}`);
          return {
            radek,
            sloupec,
            typ: puvodni?.typ ?? "prazdne",
            kod: puvodni?.kod ?? "",
            oznaceni: puvodni?.oznaceni ?? "",
            popis: puvodni?.popis ?? "",
            vazba_stul: puvodni?.vazba_stul ?? "",
          };
        }),
      };
    });
  }

  function aplikujTypNaOblast(odRadku: number, doRadku: number, odSloupce: number, doSloupce: number, typ: TypPole) {
    aktualizujAktivniPodlazi((aktualni) => {
      const generatory = vytvorGeneratoryOznaceni(aktualni.bunky);
      return {
        ...aktualni,
        bunky: aktualni.bunky.map((bunka) => {
          const jeVUzemni =
            bunka.radek >= odRadku &&
            bunka.radek <= doRadku &&
            bunka.sloupec >= odSloupce &&
            bunka.sloupec <= doSloupce;
          if (!jeVUzemni) {
            return bunka;
          }
          if (typ === "prazdne") {
            return {
              ...bunka,
              typ,
              kod: "",
              oznaceni: "",
              popis: "",
              vazba_stul: "",
            };
          }
          const vychozi = vytvorVychoziOznaceniProTyp(typ, generatory);
          return {
            ...bunka,
            typ,
            kod: prodejneTypy.includes(typ) ? bunka.kod || vychozi.kod : "",
            oznaceni: bunka.oznaceni || vychozi.oznaceni,
            popis: bunka.popis || vychozi.popis,
            vazba_stul: typ === "stul" ? bunka.vazba_stul : "",
          };
        }),
      };
    });
  }

  function ziskejOblast() {
    if (vyberOblasti) {
      return vyberOblasti;
    }
    if (!zacatekObdelniku || !detailVybraneBunky) {
      return null;
    }
    return {
      odRadku: Math.min(zacatekObdelniku.radek, detailVybraneBunky.radek),
      doRadku: Math.max(zacatekObdelniku.radek, detailVybraneBunky.radek),
      odSloupce: Math.min(zacatekObdelniku.sloupec, detailVybraneBunky.sloupec),
      doSloupce: Math.max(zacatekObdelniku.sloupec, detailVybraneBunky.sloupec),
    };
  }

  function aktualizujVyberOblasti(cilRadek: number, cilSloupec: number) {
    const kotva = zacatekObdelniku ?? vybranaBunka ?? { radek: cilRadek, sloupec: cilSloupec };
    nastavVyberOblasti({
      odRadku: Math.min(kotva.radek, cilRadek),
      doRadku: Math.max(kotva.radek, cilRadek),
      odSloupce: Math.min(kotva.sloupec, cilSloupec),
      doSloupce: Math.max(kotva.sloupec, cilSloupec),
    });
  }

  function jeBunkaVeVyberu(radek: number, sloupec: number) {
    if (!vyberOblasti) {
      return false;
    }
    return (
      radek >= vyberOblasti.odRadku &&
      radek <= vyberOblasti.doRadku &&
      sloupec >= vyberOblasti.odSloupce &&
      sloupec <= vyberOblasti.doSloupce
    );
  }

  function kopirujOblast(smer: "vpravo" | "vlevo" | "dolu" | "nahoru") {
    if (!aktivniPodlazi) {
      return;
    }
    const oblast = ziskejOblast();
    if (!oblast) {
      nastavChybu("Pro kopii nejdriv oznac start obdelniku a vyber protilehly roh.");
      return;
    }
    const { radekPosun, sloupecPosun } = posunOblasti(smer, oblast.odRadku, oblast.doRadku, oblast.odSloupce, oblast.doSloupce);
    if (
      oblast.odRadku + radekPosun < 1 ||
      oblast.doRadku + radekPosun > aktivniPodlazi.radky ||
      oblast.odSloupce + sloupecPosun < 1 ||
      oblast.doSloupce + sloupecPosun > aktivniPodlazi.sloupce
    ) {
      nastavChybu(`Pro kopii uz neni misto ${smer}.`);
      return;
    }

    aktualizujAktivniPodlazi((aktualni) => {
      const generatory = vytvorGeneratoryOznaceni(aktualni.bunky);
      const zdroj = aktualni.bunky.filter(
        (bunka) =>
          bunka.radek >= oblast.odRadku &&
          bunka.radek <= oblast.doRadku &&
          bunka.sloupec >= oblast.odSloupce &&
          bunka.sloupec <= oblast.doSloupce,
      );
      const mapaStolu = new Map<string, string>();
      zdroj
        .filter((bunka) => bunka.typ === "stul_objekt" && bunka.oznaceni)
        .forEach((bunka) => {
          if (!mapaStolu.has(bunka.oznaceni)) {
            mapaStolu.set(
              bunka.oznaceni,
              vytvorVychoziOznaceniProTyp("stul_objekt", generatory).oznaceni,
            );
          }
        });
      return {
        ...aktualni,
        bunky: aktualni.bunky.map((bunka) => {
          const predloha = zdroj.find(
            (polozka) =>
              polozka.radek + radekPosun === bunka.radek &&
              polozka.sloupec + sloupecPosun === bunka.sloupec,
          );
          if (!predloha) {
            return bunka;
          }
          let vychozi = { kod: "", oznaceni: "", popis: "" };
          if (predloha.typ === "stul_objekt") {
            const noveOznaceni = mapaStolu.get(predloha.oznaceni) ?? vytvorVychoziOznaceniProTyp("stul_objekt", generatory).oznaceni;
            vychozi = { kod: "", oznaceni: noveOznaceni, popis: `Stul ${noveOznaceni}` };
          } else if (predloha.typ === "sedadlo" || predloha.typ === "stul") {
            vychozi = vytvorVychoziOznaceniProTyp(predloha.typ, generatory);
          }
          return {
            ...bunka,
            typ: predloha.typ,
            kod: prodejneTypy.includes(predloha.typ) ? vychozi.kod : "",
            oznaceni: predloha.typ === "stul_objekt" ? vychozi.oznaceni : prodejneTypy.includes(predloha.typ) ? vychozi.oznaceni : predloha.oznaceni,
            popis: predloha.typ === "stul_objekt" ? vychozi.popis : prodejneTypy.includes(predloha.typ) ? vychozi.popis : predloha.popis,
            vazba_stul: predloha.vazba_stul ? mapaStolu.get(predloha.vazba_stul) ?? predloha.vazba_stul : "",
          };
        }),
      };
    });
    nastavChybu("");
    nastavZpravu(`Vybrana oblast byla zkopirovana ${smer}.`);
  }

  function posunVybranouOblast(smer: "vpravo" | "vlevo" | "dolu" | "nahoru") {
    if (!aktivniPodlazi) {
      return;
    }
    const oblast = ziskejOblast();
    if (!oblast) {
      nastavChybu("Pro posun nejdriv oznac vybranou oblast.");
      return;
    }
    const { radekPosun, sloupecPosun } = posunOblasti(
      smer,
      oblast.odRadku,
      oblast.odRadku,
      oblast.odSloupce,
      oblast.odSloupce,
    );
    if (
      oblast.odRadku + radekPosun < 1 ||
      oblast.doRadku + radekPosun > aktivniPodlazi.radky ||
      oblast.odSloupce + sloupecPosun < 1 ||
      oblast.doSloupce + sloupecPosun > aktivniPodlazi.sloupce
    ) {
      nastavChybu(`Vybrany blok uz nejde posunout ${smer}.`);
      return;
    }

    aktualizujAktivniPodlazi((aktualni) => {
      const mapa = new Map(aktualni.bunky.map((bunka) => [`${bunka.radek}:${bunka.sloupec}`, bunka]));
      const zdroj = aktualni.bunky.filter(
        (bunka) =>
          bunka.radek >= oblast.odRadku &&
          bunka.radek <= oblast.doRadku &&
          bunka.sloupec >= oblast.odSloupce &&
          bunka.sloupec <= oblast.doSloupce,
      );

      return {
        ...aktualni,
        bunky: aktualni.bunky.map((bunka) => {
          const jeZdroj =
            bunka.radek >= oblast.odRadku &&
            bunka.radek <= oblast.doRadku &&
            bunka.sloupec >= oblast.odSloupce &&
            bunka.sloupec <= oblast.doSloupce;

          const presunuta = zdroj.find(
            (polozka) =>
              polozka.radek + radekPosun === bunka.radek &&
              polozka.sloupec + sloupecPosun === bunka.sloupec,
          );

          if (presunuta) {
            return { ...presunuta, radek: bunka.radek, sloupec: bunka.sloupec };
          }

          if (jeZdroj) {
            return {
              ...(mapa.get(`${bunka.radek}:${bunka.sloupec}`) ?? bunka),
              typ: "prazdne",
              kod: "",
              oznaceni: "",
              popis: "",
              vazba_stul: "",
            };
          }

          return bunka;
        }),
      };
    });

    nastavVyberOblasti({
      odRadku: oblast.odRadku + radekPosun,
      doRadku: oblast.doRadku + radekPosun,
      odSloupce: oblast.odSloupce + sloupecPosun,
      doSloupce: oblast.doSloupce + sloupecPosun,
    });
    nastavVybranouBunku({
      radek: (vybranaBunka?.radek ?? oblast.odRadku) + radekPosun,
      sloupec: (vybranaBunka?.sloupec ?? oblast.odSloupce) + sloupecPosun,
    });
    nastavChybu("");
    nastavZpravu(`Vybrany blok byl posunut ${smer}.`);
  }

  function vyplnVybranyRadek(typ: TypPole) {
    if (!detailVybraneBunky || !aktivniPodlazi) return;
    aplikujTypNaOblast(detailVybraneBunky.radek, detailVybraneBunky.radek, 1, aktivniPodlazi.sloupce, typ);
  }

  function vyplnVybranySloupec(typ: TypPole) {
    if (!detailVybraneBunky || !aktivniPodlazi) return;
    aplikujTypNaOblast(1, aktivniPodlazi.radky, detailVybraneBunky.sloupec, detailVybraneBunky.sloupec, typ);
  }

  function duplikujVybranyRadekDolu() {
    if (!detailVybraneBunky || !aktivniPodlazi || detailVybraneBunky.radek >= aktivniPodlazi.radky) {
      return;
    }
    aktualizujAktivniPodlazi((aktualni) => {
      const zdroj = aktualni.bunky.filter((bunka) => bunka.radek === detailVybraneBunky.radek);
      return {
        ...aktualni,
        bunky: aktualni.bunky.map((bunka) => {
          if (bunka.radek !== detailVybraneBunky.radek + 1) {
            return bunka;
          }
          const kopie = zdroj.find((polozka) => polozka.sloupec === bunka.sloupec);
          if (!kopie) {
            return bunka;
          }
          return {
            ...bunka,
            typ: kopie.typ,
            kod: "",
            oznaceni: prodejneTypy.includes(kopie.typ) ? "" : kopie.oznaceni,
            popis: prodejneTypy.includes(kopie.typ) ? "" : kopie.popis,
            vazba_stul: kopie.vazba_stul,
          };
        }),
      };
    });
  }

  function vyplnObdelnik() {
    const oblast = ziskejOblast();
    if (!oblast) {
      nastavChybu("Nejdriv oznac oblast, kterou chces vyplnit.");
      return;
    }
    aplikujTypNaOblast(oblast.odRadku, oblast.doRadku, oblast.odSloupce, oblast.doSloupce, aktivniNastroj);
    nastavChybu("");
    nastavZpravu("Vybrana oblast byla vyplnena.");
  }

  function duplikujVybranyObjekt(posunRadku: number, posunSloupce: number) {
    if (!detailVybraneBunky || !["stul", "stul_objekt"].includes(detailVybraneBunky.typ) || !aktivniPodlazi) {
      return;
    }
    const cilovyRadek = detailVybraneBunky.radek + posunRadku;
    const cilovySloupec = detailVybraneBunky.sloupec + posunSloupce;
    if (
      cilovyRadek < 1 ||
      cilovySloupec < 1 ||
      cilovyRadek > aktivniPodlazi.radky ||
      cilovySloupec > aktivniPodlazi.sloupce
    ) {
      return;
    }
    aktualizujAktivniPodlazi((aktualni) => {
      const generatory = vytvorGeneratoryOznaceni(aktualni.bunky);
      const vychozi = vytvorVychoziOznaceniProTyp(detailVybraneBunky.typ, generatory);
      return {
        ...aktualni,
        bunky: aktualni.bunky.map((bunka) =>
          bunka.radek === cilovyRadek && bunka.sloupec === cilovySloupec
            ? {
                ...bunka,
                typ: detailVybraneBunky.typ,
                kod: prodejneTypy.includes(detailVybraneBunky.typ) ? vychozi.kod : "",
                oznaceni: vychozi.oznaceni,
                popis: vychozi.popis,
                vazba_stul: "",
              }
            : bunka,
        ),
      };
    });
    nastavVybranouBunku({ radek: cilovyRadek, sloupec: cilovySloupec });
    nastavChybu("");
    nastavZpravu(
      detailVybraneBunky.typ === "stul_objekt"
        ? "Stul byl zduplikovan s novym cislem."
        : "Misto bylo zduplikovano s novym cislem.",
    );
  }

  function duplikujSestavuStolu(posunRadku: number, posunSloupce: number) {
    if (!detailVybraneBunky || detailVybraneBunky.typ !== "stul_objekt" || !aktivniPodlazi) {
      nastavChybu("Pro duplikaci cele sestavy nejdriv vyber konkretni stul.");
      return;
    }

    const cisloStolu = detailVybraneBunky.oznaceni.trim();
    if (!cisloStolu) {
      nastavChybu("Vybrany stul jeste nema cislo nebo oznaceni.");
      return;
    }

    const bunkaStolu = detailVybraneBunky;
    const navazanaMista = aktivniPodlazi.bunky.filter(
      (bunka) => bunka.typ === "stul" && bunka.vazba_stul === cisloStolu,
    );

    const vsechnyBunkySestavy = [bunkaStolu, ...navazanaMista];
    const cilovePozice = vsechnyBunkySestavy.map((bunka) => ({
      radek: bunka.radek + posunRadku,
      sloupec: bunka.sloupec + posunSloupce,
    }));

    const jeMimoPlan = cilovePozice.some(
      (pozice) =>
        pozice.radek < 1 ||
        pozice.sloupec < 1 ||
        pozice.radek > aktivniPodlazi.radky ||
        pozice.sloupec > aktivniPodlazi.sloupce,
    );

    if (jeMimoPlan) {
      nastavChybu("Pro kopii cele stolove sestavy uz na cilove strane neni misto.");
      return;
    }

    aktualizujAktivniPodlazi((aktualni) => {
      const generatory = vytvorGeneratoryOznaceni(aktualni.bunky);
      const novyStul = vytvorVychoziOznaceniProTyp("stul_objekt", generatory);

      return {
        ...aktualni,
        bunky: aktualni.bunky.map((bunka) => {
          const indexSestavy = vsechnyBunkySestavy.findIndex(
            (zdroj) =>
              zdroj.radek + posunRadku === bunka.radek &&
              zdroj.sloupec + posunSloupce === bunka.sloupec,
          );

          if (indexSestavy === -1) {
            return bunka;
          }

          const zdroj = vsechnyBunkySestavy[indexSestavy];
          if (zdroj.typ === "stul_objekt") {
            return {
              ...bunka,
              typ: "stul_objekt",
              kod: "",
              oznaceni: novyStul.oznaceni,
              popis: novyStul.popis,
              vazba_stul: "",
            };
          }

          const noveMisto = vytvorVychoziOznaceniProTyp("stul", generatory);
          return {
            ...bunka,
            typ: "stul",
            kod: noveMisto.kod,
            oznaceni: noveMisto.oznaceni,
            popis: `Misto u stolu ${novyStul.oznaceni}`,
            vazba_stul: novyStul.oznaceni,
          };
        }),
      };
    });

    nastavVybranouBunku({
      radek: bunkaStolu.radek + posunRadku,
      sloupec: bunkaStolu.sloupec + posunSloupce,
    });
    nastavChybu("");
    nastavZpravu(`Stul ${cisloStolu} byl zduplikovan vcetne navazanych mist.`);
  }

  function priradOblastKeStolu() {
    const oblast = ziskejOblast();
    if (!detailVybraneBunky || detailVybraneBunky.typ !== "stul_objekt" || !oblast) {
      nastavChybu("Vyber stul, nastav mu cislo a oznac oblast mist, ktera k nemu patri.");
      return;
    }
    const cisloStolu = detailVybraneBunky.oznaceni.trim();
    if (!cisloStolu) {
      nastavChybu("Vybrany stul jeste nema cislo nebo oznaceni.");
      return;
    }
    aktualizujAktivniPodlazi((aktualni) => ({
      ...aktualni,
      bunky: aktualni.bunky.map((bunka) => {
        const jeVUzemni =
          bunka.radek >= oblast.odRadku &&
          bunka.radek <= oblast.doRadku &&
          bunka.sloupec >= oblast.odSloupce &&
          bunka.sloupec <= oblast.doSloupce;
        if (!jeVUzemni || bunka.typ !== "stul") {
          return bunka;
        }
        return {
          ...bunka,
          vazba_stul: cisloStolu,
          popis: bunka.popis || `Misto u stolu ${cisloStolu}`,
        };
      }),
    }));
    nastavChybu("");
    nastavZpravu(`Mista v oznacene oblasti byla prirazena ke stolu ${cisloStolu}.`);
  }

  function pridejPodlazi() {
    const nove = vytvorVychoziPodlazi(podlazi.length + 1);
    nastavPodlazi((aktualni) => [...aktualni, nove]);
    nastavAktivniPodlaziId(nove.id);
    nastavVybranouBunku(null);
    nastavZacatekObdelniku(null);
  }

  function odeberAktivniPodlazi() {
    if (podlazi.length <= 1 || !aktivniPodlazi) {
      return;
    }
    const dalsi = podlazi.find((polozka) => polozka.id !== aktivniPodlazi.id);
    nastavPodlazi((aktualni) => aktualni.filter((polozka) => polozka.id !== aktivniPodlazi.id));
    nastavAktivniPodlaziId(dalsi?.id ?? "podlazi-1");
    nastavVybranouBunku(null);
    nastavZacatekObdelniku(null);
  }

  async function ulozMisto() {
    if (!misto) return;
    nastavChybu("");
    nastavZpravu("");
    try {
      const upravene = await upravMistoKonaniSprava(
        misto.id,
        {
          nazev: editor.nazev,
          adresa: editor.adresa,
          mesto: editor.mesto,
          kapacita: Number(editor.kapacita),
          hlavni_fotka: editor.hlavni_fotka,
          schema_sezeni: schemaNahledu,
        },
        tokenSpravy,
      );
      nastavMisto(upravene);
      nastavZpravu("Builder mista konani byl ulozen.");
      await nacti(tokenSpravy);
    } catch (error) {
      nastavChybu(error instanceof Error ? error.message : "Misto konani se nepodarilo ulozit.");
    }
  }

  async function odesliPrihlaseni(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = vytvorTokenSpravy(formular.uzivatel, formular.heslo);
    await nacti(token);
  }

  if (stav === "cekam" || stav === "nacitani") {
    return (
      <section className="sprava-panel">
        <div className="sprava-panel-body">
          <div className="tlumeny">Nacitam builder planku...</div>
        </div>
      </section>
    );
  }

  if (stav === "prihlaseni") {
    return (
      <section className="sprava-panel">
        <div className="sprava-panel-header">
          <div>
            <h3>Prihlaseni do builderu</h3>
            <p>Planek mistenek lze upravovat jen ve sprave obsahu.</p>
          </div>
        </div>
        <div className="sprava-panel-body stack">
          <form className="form-grid" onSubmit={odesliPrihlaseni}>
            <label className="pole">
              <span className="pole-label">Uzivatelske jmeno</span>
              <input value={formular.uzivatel} onChange={(event) => nastavFormular((a) => ({ ...a, uzivatel: event.target.value }))} required />
            </label>
            <label className="pole">
              <span className="pole-label">Heslo</span>
              <input type="password" value={formular.heslo} onChange={(event) => nastavFormular((a) => ({ ...a, heslo: event.target.value }))} required />
            </label>
            <div className="actions-end pole-cela">
              <button className="button primary" type="submit">
                Otevrit builder
              </button>
            </div>
          </form>
          {chyba ? <div className="hlaseni chyba">{chyba}</div> : null}
        </div>
      </section>
    );
  }

  if (!misto || !profil || !aktivniPodlazi) {
    return null;
  }

  const oblastAktualni = ziskejOblast();

  return (
    <div className="stack">
      {(chyba || zprava) && <div className={chyba ? "hlaseni chyba" : "hlaseni uspech"}>{chyba || zprava}</div>}

      <section className="detail-spravy-hero">
        <div className="detail-spravy-hero-copy">
          <div className="hero-meta">
            <span className="badge akcent">{misto.organizace_nazev}</span>
            <span className="badge">{profil.uzivatel}</span>
          </div>
          <h1>Builder planku mista.</h1>
          <p>Velke plochy nakreslis hromadne, stoly muzes vazat na okolni mista a kazde patro ma svoje vlastni nastaveni rozmeru i odsazeni.</p>
        </div>
        <div className="sprava-panel">
          <div className="sprava-panel-header">
            <div>
              <h3>Rychle akce</h3>
              <p>Ulozeni, cista plocha a prace s patry.</p>
            </div>
          </div>
          <div className="sprava-panel-body stack-mini">
            <button className="button primary" type="button" onClick={() => void ulozMisto()}>
              Ulozit builder
            </button>
            <button
              className="button ghost"
              type="button"
              onClick={() => {
                aktualizujAktivniPodlazi((aktualni) => ({
                  ...aktualni,
                  bunky: vytvorPrazdnouMrizku(aktualni.radky, aktualni.sloupce),
                }));
                nastavVybranouBunku(null);
                nastavZacatekObdelniku(null);
                nastavVyberOblasti(null);
              }}
            >
              Vymazat aktivni patro
            </button>
            <button className="button ghost" type="button" onClick={pridejPodlazi}>
              Pridat patro
            </button>
            <a className="button ghost" href="/sprava">
              Zpet do spravy
            </a>
          </div>
        </div>
      </section>

      <section className="detail-spravy-grid">
        <article className="sprava-panel">
          <div className="sprava-panel-header">
            <div>
              <h3>Zaklad mista</h3>
              <p>Udaj o prostoru a metadatech celeho planu.</p>
            </div>
          </div>
          <div className="sprava-panel-body">
            <div className="form-grid">
              <label className="pole"><span className="pole-label">Nazev mista</span><input value={editor.nazev} onChange={(e) => nastavEditor((a) => ({ ...a, nazev: e.target.value }))} /></label>
              <label className="pole"><span className="pole-label">Kapacita</span><input type="number" value={editor.kapacita} onChange={(e) => nastavEditor((a) => ({ ...a, kapacita: e.target.value }))} /></label>
              <label className="pole"><span className="pole-label">Mesto</span><input value={editor.mesto} onChange={(e) => nastavEditor((a) => ({ ...a, mesto: e.target.value }))} /></label>
              <label className="pole"><span className="pole-label">Nazev planku</span><input value={editor.schema_nazev} onChange={(e) => nastavEditor((a) => ({ ...a, schema_nazev: e.target.value }))} /></label>
              <label className="pole pole-cela"><span className="pole-label">Adresa</span><input value={editor.adresa} onChange={(e) => nastavEditor((a) => ({ ...a, adresa: e.target.value }))} /></label>
              <label className="pole pole-cela"><span className="pole-label">Fotka místa</span><input type="file" accept="image/*" onChange={(e) => nastavEditor((a) => ({ ...a, hlavni_fotka: e.target.files?.[0] ?? null }))} /></label>
              {nahledFotkyMista || misto?.hlavni_fotka_url ? (
                <div
                  className="admin-form-photo-preview pole-cela"
                  style={{
                    backgroundImage: `url('${nahledFotkyMista || misto?.hlavni_fotka_url || ""}')`,
                  }}
                />
              ) : null}
              <label className="pole pole-cela"><span className="pole-label">Popis planku</span><input value={editor.schema_popis} onChange={(e) => nastavEditor((a) => ({ ...a, schema_popis: e.target.value }))} /></label>
            </div>
          </div>
        </article>

        <article className="sprava-panel">
          <div className="sprava-panel-header">
            <div>
              <h3>Souhrn prostoru</h3>
              <p>Prehled vsech prvku napric patry.</p>
            </div>
          </div>
          <div className="sprava-panel-body stack">
            <div className="maly-prehled">
              <div className="metrika"><div className="popisek">Sedadla</div><div className="hodnota">{souhrnTypu.sedadlo}</div></div>
              <div className="metrika"><div className="popisek">Mista u stolu</div><div className="hodnota">{souhrnTypu.stul}</div></div>
              <div className="metrika"><div className="popisek">Stoly</div><div className="hodnota">{souhrnTypu.stul_objekt}</div></div>
            </div>
            <div className="micro">Pristavky jsou pomocne neprodejne plochy. Odsazeni a mezery ti pomuzou dostat mapu prostoru bliz k realnemu rozlozeni.</div>
            {nepojmenovanaProdejnaMista > 0 ? <div className="hlaseni chyba">{nepojmenovanaProdejnaMista} prodejnych poli jeste nema vlastni kod a oznaceni.</div> : null}
          </div>
        </article>
      </section>

      <div className="grafy-grid">
        <GrafRozlozeni
          nadpis="Rozložení prvků"
          popis="Kolik prodejných a neprodejných prvků je v plánku."
          polozky={grafTypu}
        />
        <GrafSloupcovy
          nadpis="Aktivní buňky podle podlaží"
          popis="Kolik buněk je skutečně použitých v jednotlivých patrech."
          polozky={grafPodlazi}
        />
      </div>

      <section className="sprava-panel">
        <div className="sprava-panel-header">
          <div>
            <h3>Platno builderu</h3>
            <p>Hlavni pracovni plocha je pres celou sirku a hromadne akce fungují nad vybranou oblasti.</p>
          </div>
        </div>
        <div className="sprava-panel-body stack">
          <div className="builder-pracovni-pruh">
            <div className="builder-podlazi-list">
              {podlazi.map((polozka) => (
                <button
                  key={polozka.id}
                  className={`builder-podlazi-tlacitko ${polozka.id === aktivniPodlaziId ? "aktivni" : ""}`}
                  type="button"
                  onClick={() => {
                    nastavAktivniPodlaziId(polozka.id);
                    nastavVybranouBunku(null);
                    nastavZacatekObdelniku(null);
                    nastavVyberOblasti(null);
                  }}
                >
                  {polozka.nazev}
                </button>
              ))}
              <button className="button ghost" type="button" onClick={pridejPodlazi}>+ Patro</button>
            </div>
            <div className="builder-pomucky">
              <div className="segment">
                <a
                  className={rezimPrace === "malovani" ? "aktivni" : ""}
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    nastavRezimPrace("malovani");
                  }}
                >
                  Malovani
                </a>
                <a
                  className={rezimPrace === "vyber" ? "aktivni" : ""}
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    nastavRezimPrace("vyber");
                  }}
                >
                  Vyber
                </a>
              </div>
              <span className="badge">Aktivni patro: {aktivniPodlazi.nazev}</span>
              <span className="badge">{aktivniPodlazi.radky} × {aktivniPodlazi.sloupce} poli</span>
              <span className="badge">{rezimPrace === "malovani" ? "Tah mysi maluje" : "Tah mysi vybira oblast"}</span>
            </div>
          </div>

          <div className="builder-editor-layout">
            <article className="sprava-panel sprava-panel-builder-hlavni">
              <div className="sprava-panel-header">
                <div>
                  <h3>Nastroje a rozmery</h3>
                  <p>Nejdriv si nastav platno aktualniho patra, pak maluj primo do mrizky a kopiruj opakujici se bloky.</p>
                </div>
              </div>
              <div className="sprava-panel-body stack">
                <div className="form-grid">
                  <label className="pole"><span className="pole-label">Nazev patra</span><input value={aktivniPodlazi.nazev} onChange={(e) => aktualizujAktivniPodlazi((a) => ({ ...a, nazev: e.target.value }))} /></label>
                  <label className="pole"><span className="pole-label">Nadpis nad mapou</span><input value={aktivniPodlazi.stit} onChange={(e) => aktualizujAktivniPodlazi((a) => ({ ...a, stit: e.target.value }))} placeholder="napr. Jeviste" /></label>
                  <label className="pole"><span className="pole-label">Radky mrizky</span><input type="number" min={4} max={80} value={aktivniPodlazi.radky} onChange={(e) => prekresliMrizku(Math.max(4, Number(e.target.value) || vychoziRadky), aktivniPodlazi.sloupce)} /></label>
                  <label className="pole"><span className="pole-label">Sloupce mrizky</span><input type="number" min={4} max={80} value={aktivniPodlazi.sloupce} onChange={(e) => prekresliMrizku(aktivniPodlazi.radky, Math.max(4, Number(e.target.value) || vychoziSloupce))} /></label>
                  <label className="pole"><span className="pole-label">Horiz. odsazeni mrizky</span><input type="number" min={0} max={80} value={aktivniPodlazi.odsazeni_x} onChange={(e) => aktualizujAktivniPodlazi((a) => ({ ...a, odsazeni_x: Math.max(0, Number(e.target.value) || 0) }))} /></label>
                  <label className="pole"><span className="pole-label">Vert. odsazeni mrizky</span><input type="number" min={0} max={80} value={aktivniPodlazi.odsazeni_y} onChange={(e) => aktualizujAktivniPodlazi((a) => ({ ...a, odsazeni_y: Math.max(0, Number(e.target.value) || 0) }))} /></label>
                  <label className="pole"><span className="pole-label">Horiz. mezera mezi poli</span><input type="number" min={0} max={20} value={aktivniPodlazi.mezera_x} onChange={(e) => aktualizujAktivniPodlazi((a) => ({ ...a, mezera_x: Math.max(0, Number(e.target.value) || 0) }))} /></label>
                  <label className="pole"><span className="pole-label">Vert. mezera mezi poli</span><input type="number" min={0} max={20} value={aktivniPodlazi.mezera_y} onChange={(e) => aktualizujAktivniPodlazi((a) => ({ ...a, mezera_y: Math.max(0, Number(e.target.value) || 0) }))} /></label>
                </div>

                <div className="builder-nastroje">
                  {typyNastroju.map((typ) => (
                    <button key={typ} className={`builder-nastroj ${aktivniNastroj === typ ? "aktivni" : ""} typ-${typ}`} onClick={() => nastavAktivniNastroj(typ)} type="button">
                      {popiskyTypu[typ]}
                    </button>
                  ))}
                </div>

                <div className="builder-hromadne-akce">
                  <button className="button ghost" type="button" onClick={() => detailVybraneBunky && (nastavZacatekObdelniku({ radek: detailVybraneBunky.radek, sloupec: detailVybraneBunky.sloupec }), nastavVyberOblasti({ odRadku: detailVybraneBunky.radek, doRadku: detailVybraneBunky.radek, odSloupce: detailVybraneBunky.sloupec, doSloupce: detailVybraneBunky.sloupec }))} disabled={!detailVybraneBunky}>Oznacit start obdelniku</button>
                  <button className="button ghost" type="button" onClick={vyplnObdelnik}>Vyplnit obdelnik</button>
                  <button className="button ghost" type="button" onClick={() => kopirujOblast("vpravo")}>Kopie vpravo</button>
                  <button className="button ghost" type="button" onClick={() => kopirujOblast("vlevo")}>Kopie vlevo</button>
                  <button className="button ghost" type="button" onClick={() => kopirujOblast("dolu")}>Kopie dolu</button>
                  <button className="button ghost" type="button" onClick={() => kopirujOblast("nahoru")}>Kopie nahoru</button>
                  <button className="button ghost" type="button" onClick={() => posunVybranouOblast("vpravo")}>Posun vpravo</button>
                  <button className="button ghost" type="button" onClick={() => posunVybranouOblast("vlevo")}>Posun vlevo</button>
                  <button className="button ghost" type="button" onClick={() => posunVybranouOblast("dolu")}>Posun dolu</button>
                  <button className="button ghost" type="button" onClick={() => posunVybranouOblast("nahoru")}>Posun nahoru</button>
                  <button className="button ghost" type="button" onClick={() => vyplnVybranyRadek(aktivniNastroj)} disabled={!detailVybraneBunky}>Vyplnit radek</button>
                  <button className="button ghost" type="button" onClick={() => vyplnVybranySloupec(aktivniNastroj)} disabled={!detailVybraneBunky}>Vyplnit sloupec</button>
                  <button className="button ghost" type="button" onClick={duplikujVybranyRadekDolu} disabled={!detailVybraneBunky}>Duplikovat radek dolu</button>
                  <button className="button ghost" type="button" onClick={vratZmenu} disabled={!historieZpet.length}>Zpet</button>
                  <button className="button ghost" type="button" onClick={zopakujZmenu} disabled={!historieVpred.length}>Znovu</button>
                  <button className="button ghost" type="button" onClick={() => { nastavVyberOblasti(null); nastavZacatekObdelniku(null); }} disabled={!oblastAktualni}>Zrusit vyber</button>
                </div>

                {oblastAktualni ? <div className="micro">Vyber: R{oblastAktualni.odRadku}-{oblastAktualni.doRadku}, S{oblastAktualni.odSloupce}-{oblastAktualni.doSloupce}.</div> : zacatekObdelniku ? <div className="micro">Start obdelniku: R{zacatekObdelniku.radek} S{zacatekObdelniku.sloupec}. Ted vyber protilehly roh.</div> : null}

                <div
                  className="builder-mrizka"
                  style={{
                    gridTemplateColumns: `repeat(${aktivniPodlazi.sloupce}, minmax(24px, 28px))`,
                    paddingLeft: `${aktivniPodlazi.odsazeni_x}px`,
                    paddingTop: `${aktivniPodlazi.odsazeni_y}px`,
                    columnGap: `${aktivniPodlazi.mezera_x}px`,
                    rowGap: `${aktivniPodlazi.mezera_y}px`,
                  }}
                >
                  {aktivniPodlazi.bunky.map((bunka) => (
                    <button
                      key={`${aktivniPodlazi.id}:${bunka.radek}:${bunka.sloupec}`}
                      className={`builder-bunka typ-${bunka.typ} ${vybranaBunka?.radek === bunka.radek && vybranaBunka?.sloupec === bunka.sloupec ? "vybrana" : ""} ${jeBunkaVeVyberu(bunka.radek, bunka.sloupec) ? "ve-vyberu" : ""}`}
                      onMouseDown={() => {
                        nastavMalovani(true);
                        nastavVybranouBunku({ radek: bunka.radek, sloupec: bunka.sloupec });
                        if (rezimPrace === "vyber") {
                          nastavZacatekObdelniku({ radek: bunka.radek, sloupec: bunka.sloupec });
                          nastavVyberOblasti({
                            odRadku: bunka.radek,
                            doRadku: bunka.radek,
                            odSloupce: bunka.sloupec,
                            doSloupce: bunka.sloupec,
                          });
                        } else {
                          nastavVyberOblasti(null);
                          nastavTypBunky(bunka.radek, bunka.sloupec, aktivniNastroj);
                        }
                      }}
                      onMouseEnter={() => {
                        if (malujeSe && rezimPrace === "malovani") {
                          nastavTypBunky(bunka.radek, bunka.sloupec, aktivniNastroj);
                        }
                        if (malujeSe && rezimPrace === "vyber") {
                          nastavVybranouBunku({ radek: bunka.radek, sloupec: bunka.sloupec });
                          aktualizujVyberOblasti(bunka.radek, bunka.sloupec);
                        }
                      }}
                      onMouseUp={() => nastavMalovani(false)}
                      type="button"
                      title={`${aktivniPodlazi.nazev} · R${bunka.radek} S${bunka.sloupec} · ${popiskyTypu[bunka.typ]}`}
                    >
                      <span>{bunka.oznaceni || ""}</span>
                    </button>
                  ))}
                </div>
              </div>
            </article>

            <article className="sprava-panel sprava-panel-builder-vedlejsi">
              <div className="sprava-panel-header">
                <div>
                  <h3>Vybrana bunka</h3>
                  <p>Tady resis cisla stolu, vazby mist a detailni popis jednotlivych bodu.</p>
                </div>
              </div>
              <div className="sprava-panel-body stack">
                <div className="legenda-salu">
                  {(["sedadlo", "stul_objekt", "stul", "jeviste", "parket", "pristavek", "sloup", "zed", "dvere", "okno", "vychod"] as TypPole[]).map((typ) => (
                    <div key={typ} className="legenda-polozka">
                      <span className={`legenda-bod typ-${typ}`} />
                      <span>{popiskyTypu[typ]}</span>
                    </div>
                  ))}
                </div>

                <div className="detail-mista-karta stack-mini">
                  <strong>{detailVybraneBunky ? `${aktivniPodlazi.nazev} · R${detailVybraneBunky.radek} S${detailVybraneBunky.sloupec}` : "Vyber bunku v mrizce"}</strong>
                  <div className="micro">{detailVybraneBunky ? `Typ: ${popiskyTypu[detailVybraneBunky.typ]}` : "Klikni na policko a dopln jeho znaceni, cislo stolu nebo vazbu."}</div>

                  {detailVybraneBunky && detailVybraneBunky.typ !== "prazdne" ? (
                    <div className="form-grid">
                      {prodejneTypy.includes(detailVybraneBunky.typ) ? (
                        <label className="pole">
                          <span className="pole-label">Kod mista</span>
                          <input value={detailVybraneBunky.kod} onChange={(e) => aktualizujBunku(detailVybraneBunky.radek, detailVybraneBunky.sloupec, { kod: e.target.value })} placeholder={detailVybraneBunky.typ === "stul" ? "napr. T1-03" : "napr. B12"} />
                        </label>
                      ) : null}
                      {detailVybraneBunky.typ === "stul" ? (
                        <label className="pole">
                          <span className="pole-label">Vazba na stul</span>
                          <input value={detailVybraneBunky.vazba_stul} onChange={(e) => aktualizujBunku(detailVybraneBunky.radek, detailVybraneBunky.sloupec, { vazba_stul: e.target.value })} placeholder="napr. 12" />
                        </label>
                      ) : null}
                      <label className="pole">
                        <span className="pole-label">Oznaceni v planu</span>
                        <input value={detailVybraneBunky.oznaceni} onChange={(e) => aktualizujBunku(detailVybraneBunky.radek, detailVybraneBunky.sloupec, { oznaceni: e.target.value })} placeholder={detailVybraneBunky.typ === "stul_objekt" ? "napr. 12" : "napr. 12 nebo EXIT"} />
                      </label>
                      <label className="pole pole-cela">
                        <span className="pole-label">Popis</span>
                        <input value={detailVybraneBunky.popis} onChange={(e) => aktualizujBunku(detailVybraneBunky.radek, detailVybraneBunky.sloupec, { popis: e.target.value })} placeholder="napr. Misto u stolu 12 nebo Hlavni vychod" />
                      </label>
                    </div>
                  ) : null}

                  {detailVybraneBunky && ["stul", "stul_objekt"].includes(detailVybraneBunky.typ) ? (
                    <div className="actions-wrap">
                      <button className="button ghost" type="button" onClick={() => duplikujVybranyObjekt(0, 1)}>Duplikovat vpravo</button>
                      <button className="button ghost" type="button" onClick={() => duplikujVybranyObjekt(1, 0)}>Duplikovat dolu</button>
                      <button className="button ghost" type="button" onClick={() => duplikujVybranyObjekt(0, -1)}>Duplikovat vlevo</button>
                      <button className="button ghost" type="button" onClick={() => duplikujVybranyObjekt(-1, 0)}>Duplikovat nahoru</button>
                    </div>
                  ) : null}

                  {detailVybraneBunky?.typ === "stul_objekt" ? (
                    <div className="actions-wrap">
                      <button className="button ghost" type="button" onClick={priradOblastKeStolu}>Priradit oznacenou oblast ke stolu</button>
                      <button className="button ghost" type="button" onClick={() => duplikujSestavuStolu(0, 1)}>Kopie sestavy vpravo</button>
                      <button className="button ghost" type="button" onClick={() => duplikujSestavuStolu(1, 0)}>Kopie sestavy dolu</button>
                      <button className="button ghost" type="button" onClick={() => duplikujSestavuStolu(0, -1)}>Kopie sestavy vlevo</button>
                      <button className="button ghost" type="button" onClick={() => duplikujSestavuStolu(-1, 0)}>Kopie sestavy nahoru</button>
                    </div>
                  ) : null}

                  {podlazi.length > 1 ? (
                    <div className="actions-wrap">
                      <button className="button ghost" type="button" onClick={odeberAktivniPodlazi}>Odebrat aktivni patro</button>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="sprava-panel">
        <div className="sprava-panel-header">
          <div>
            <h3>Zivy nahled pro produkt</h3>
            <p>Plan se promita do prodeje i spravy presne tak, jak je nastaveny tady, vcetne stolu a vice pater.</p>
          </div>
        </div>
        <div className="sprava-panel-body stack">
          <PlanSalu schema={schemaNahledu} rezim="sprava" />
        </div>
      </section>
    </div>
  );
}
