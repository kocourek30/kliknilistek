export function formatujDatum(datum: string | null | undefined): string {
  if (!datum) {
    return "Neuvedeno";
  }

  return new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(datum));
}

export function formatujCastku(castka: string, mena: string): string {
  const cislo = Number(castka);
  const bezpecnaCastka = Number.isFinite(cislo) ? cislo : 0;
  const bezpecnaMena = typeof mena === "string" && mena.trim().length === 3 ? mena.trim().toUpperCase() : "CZK";

  try {
    return new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: bezpecnaMena,
      maximumFractionDigits: 0,
    }).format(bezpecnaCastka);
  } catch {
    return `${new Intl.NumberFormat("cs-CZ", {
      maximumFractionDigits: 0,
    }).format(bezpecnaCastka)} ${bezpecnaMena}`;
  }
}

export function formatujTypOrganizace(typ: string): string {
  const mapovani: Record<string, string> = {
    obec: "Obec",
    kulturni_dum: "Kulturní dům",
    poradatel: "Poradatel",
  };

  return mapovani[typ] ?? typ;
}

export function formatujStavAkce(stav: string): string {
  const mapovani: Record<string, string> = {
    navrh: "Návrh",
    zverejneno: "Zveřejněno",
    vyprodano: "Vyprodáno",
    ukonceno: "Ukončeno",
    zruseno: "Zrušeno",
  };

  return mapovani[stav] ?? stav;
}

export function formatujStavObjednavky(stav: string): string {
  const mapovani: Record<string, string> = {
    navrh: "Návrh",
    ceka_na_platbu: "Čeká na platbu",
    zaplaceno: "Zaplaceno",
    zruseno: "Zrušeno",
    vraceno: "Vráceno",
  };

  return mapovani[stav] ?? stav;
}

export function formatujStavVstupenky(stav: string): string {
  const mapovani: Record<string, string> = {
    rezervovana: "Rezervována",
    platna: "Platná",
    odbavena: "Odbavena",
    zrusena: "Zrušena",
    vracena: "Vrácena",
  };

  return mapovani[stav] ?? stav;
}

export function formatujStavMista(stav: string): string {
  const mapovani: Record<string, string> = {
    volne: "Volné",
    blokovano: "Blokováno",
    rezervace: "V rezervaci",
    platne: "Prodáno",
    odbavene: "Odbaveno",
  };

  return mapovani[stav] ?? stav;
}

export function formatujStavPlatby(stav: string): string {
  const mapovani: Record<string, string> = {
    vytvoreno: "Vytvořeno",
    ceka: "Čeká",
    uspesna: "Úspěšná",
    neuspesna: "Neúspěšná",
    vracena: "Vrácena",
  };

  return mapovani[stav] ?? stav;
}

export function formatujStavProformy(stav: string): string {
  const mapovani: Record<string, string> = {
    vystaveno: "Vystavená",
    zaplaceno: "Zaplacená",
    storno: "Storno",
  };

  return mapovani[stav] ?? stav;
}

export function formatujPoskytovatelePlatby(poskytovatel: string): string {
  const mapovani: Record<string, string> = {
    stripe: "Stripe",
    gopay: "GoPay",
    comgate: "Comgate",
    bankovni_prevod: "Bankovní převod",
    hotovost: "Hotovost",
  };

  return mapovani[poskytovatel] ?? poskytovatel;
}

export function formatujZpusobUhrady(zpusob: string | null | undefined): string {
  const mapovani: Record<string, string> = {
    online: "Online platba",
    bankovni_prevod: "Bankovní převod",
  };

  if (!zpusob) {
    return "Neuvedeno";
  }

  return mapovani[zpusob] ?? zpusob;
}

export function formatujRoliOrganizace(role: string): string {
  const mapovani: Record<string, string> = {
    vlastnik: "Vlastník",
    spravce: "Správce",
    pokladna: "Pokladna",
    odbaveni: "Odbavení",
    ucetni: "Účetní",
  };

  return mapovani[role] ?? role;
}
