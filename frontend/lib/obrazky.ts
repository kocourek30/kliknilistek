import type { Akce, FotkaAkce } from "@/lib/api";

function seradGalerii(fotky: FotkaAkce[]) {
  return [...fotky].sort((leva, prava) => {
    if (leva.je_doporucena && !prava.je_doporucena) {
      return -1;
    }
    if (!leva.je_doporucena && prava.je_doporucena) {
      return 1;
    }
    return leva.poradi - prava.poradi;
  });
}

export function ziskejSerazenouGaleriiAkce(akce: Akce) {
  return seradGalerii(akce.fotky_galerie ?? []);
}

export function ziskejHlavniObrazekAkce(akce: Akce, vychoziObrazek?: string) {
  const galerie = ziskejSerazenouGaleriiAkce(akce);
  return (
    akce.hlavni_fotka_soubor_url ||
    akce.hlavni_fotka_url ||
    galerie[0]?.soubor_url ||
    akce.misto_konani_hlavni_fotka_url ||
    vychoziObrazek ||
    ""
  );
}
