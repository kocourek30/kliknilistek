import type { Akce } from "@/lib/api";

type SchemaSedadel = NonNullable<Akce["schema_sezeni"]>;
type RadaSchema = SchemaSedadel["rady"][number];
type StavMista = NonNullable<Akce["stavy_mist"]>[number];

export function formatujKratkeOznaceniMista(kod: string) {
  const rada = kod.match(/^R(\d+)-([LSP])(\d+)$/);
  if (rada) {
    const [, cisloRady, blok, cislo] = rada;
    const blokText = blok === "S" ? "sedadlo" : blok === "L" ? "pristavek vlevo" : "pristavek vpravo";
    return `Rada ${cisloRady}, ${blokText} ${cislo}`;
  }

  const sale = kod.match(/^M(\d+)$/);
  if (sale) {
    return `Misto ${sale[1]}`;
  }

  return kod;
}

export function vytvorKodMistaZUseku(usek: NonNullable<RadaSchema["useky"]>[number], cislo: number) {
  return `${usek.kod_prefix ?? "M"}${cislo}`;
}

export function vytvorKodMistaZRady(rada: RadaSchema, blok: "L" | "S" | "P", cislo: number) {
  return `R${rada.rada}-${blok}${cislo}`;
}

export function vytvorMapuStavuMist(stavyMist?: StavMista[]) {
  return new Map((stavyMist ?? []).map((misto) => [misto.kod, misto]));
}

export function popisMistaZeSchema(schema: Akce["schema_sezeni"], kod: string, stavyMist?: StavMista[]) {
  const detail = (stavyMist ?? []).find((misto) => misto.kod === kod);
  if (detail?.popis) {
    return detail.popis;
  }

  if (!schema) {
    return formatujKratkeOznaceniMista(kod);
  }

  if (schema.podlazi?.length) {
    for (const podlazi of schema.podlazi) {
      const bunka = podlazi.mrizka.bunky.find((polozka) => polozka.kod === kod);
      if (bunka) {
        const zaklad = bunka.popis || (bunka.vazba_stul ? `${bunka.oznaceni || kod} · Stul ${bunka.vazba_stul}` : bunka.oznaceni || kod);
        return podlazi.nazev ? `${zaklad} · ${podlazi.nazev}` : zaklad;
      }
    }
  }

  if (schema.mrizka?.bunky?.length) {
    const bunka = schema.mrizka.bunky.find((polozka) => polozka.kod === kod);
    if (bunka) {
      if (bunka.popis) {
        return bunka.popis;
      }
      if (bunka.vazba_stul) {
        return `${bunka.oznaceni || kod} · Stul ${bunka.vazba_stul}`;
      }
      return bunka.oznaceni || kod;
    }
  }

  for (const rada of schema.rady) {
    if (rada.useky?.length) {
      for (const usek of rada.useky) {
        for (const cislo of usek.mista) {
          if (vytvorKodMistaZUseku(usek, cislo) === kod) {
            return `Misto ${cislo}${usek.nazev ? ` · ${usek.nazev}` : ""}`;
          }
        }
      }
      continue;
    }

    for (const cislo of rada.levy_pristavek ?? []) {
      if (vytvorKodMistaZRady(rada, "L", cislo) === kod) {
        return `Rada ${rada.rada}, pristavek vlevo ${cislo}`;
      }
    }
    for (const cislo of rada.stred ?? []) {
      if (vytvorKodMistaZRady(rada, "S", cislo) === kod) {
        return `Rada ${rada.rada}, sedadlo ${cislo}`;
      }
    }
    for (const cislo of rada.pravy_pristavek ?? []) {
      if (vytvorKodMistaZRady(rada, "P", cislo) === kod) {
        return `Rada ${rada.rada}, pristavek vpravo ${cislo}`;
      }
    }
  }

  return formatujKratkeOznaceniMista(kod);
}
