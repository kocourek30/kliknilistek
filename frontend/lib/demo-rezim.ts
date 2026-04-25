export const demoRezimZapnuty = process.env.NEXT_PUBLIC_DEMO_REZIM === "1";

export function vytvorVychoziPrihlaseni(uzivatel: string) {
  return {
    uzivatel: demoRezimZapnuty ? uzivatel : "",
    heslo: demoRezimZapnuty ? "kliknilistek123" : "",
  };
}

