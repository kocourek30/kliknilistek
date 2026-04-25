"use client";

import { useEffect, useMemo, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  IconArrowRight,
  IconCalendarEvent,
  IconChartBar,
  IconMap2,
  IconReceipt2,
} from "@tabler/icons-react";

import {
  jeAutorizacniApiChyba,
  jeDocasneNedostupnaApiChyba,
  nactiPrehledSpravy,
  nactiProfilSpravy,
  nactiSouhrnAdministrace,
  vytvorTokenSpravy,
  type PrehledSpravy,
  type ProfilSpravy,
} from "@/lib/api";
import {
  formatujCastku,
  formatujDatum,
  formatujRoliOrganizace,
  formatujStavAkce,
  formatujStavObjednavky,
  formatujStavVstupenky,
} from "@/lib/formatovani";
import { GrafRozlozeni, GrafSloupcovy } from "@/components/sprava-grafy";

const klicTokenu = "kliknilistek.sprava.token";

type StavNacitani = "cekam" | "prihlaseni" | "nacitani" | "obnova" | "pripraveno";

const mapaBarevStavu: Record<string, "uspech" | "varovani" | "neutralni"> = {
  zaplaceno: "uspech",
  platna: "uspech",
  odbavena: "uspech",
  ceka_na_platbu: "varovani",
  rezervovana: "varovani",
  zruseno: "neutralni",
  zrusena: "neutralni",
  vraceno: "neutralni",
  vracena: "neutralni",
};

export function SpravaBrana() {
  const [stav, nastavStav] = useState<StavNacitani>("cekam");
  const [tokenSpravy, nastavTokenSpravy] = useState("");
  const [profil, nastavProfil] = useState<ProfilSpravy | null>(null);
  const [data, nastavData] = useState<Awaited<ReturnType<typeof nactiSouhrnAdministrace>> | null>(
    null,
  );
  const [prehled, nastavPrehled] = useState<PrehledSpravy | null>(null);
  const [chyba, nastavChybu] = useState("");
  const [formular, nastavFormular] = useState({
    uzivatel: "spravce",
    heslo: "kliknilistek123",
  });

  async function nactiSpravu(token: string) {
    nastavStav("nacitani");
    nastavChybu("");

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
      nastavStav("pripraveno");
    } catch (error) {
      if (jeDocasneNedostupnaApiChyba(error)) {
        localStorage.setItem(klicTokenu, token);
        nastavTokenSpravy(token);
        nastavStav("obnova");
        nastavChybu("Backend správy je dočasně nedostupný. Zkouším připojení znovu automaticky.");
        return;
      }

      localStorage.removeItem(klicTokenu);
      nastavTokenSpravy("");
      nastavProfil(null);
      nastavData(null);
      nastavPrehled(null);
      nastavStav("prihlaseni");
      nastavChybu(
        jeAutorizacniApiChyba(error)
          ? "Přihlášení už není platné. Přihlas se prosím znovu."
          : error instanceof Error
            ? error.message
            : "Přihlášení se nepodařilo.",
      );
    }
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
    if (stav !== "obnova" || !tokenSpravy) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void nactiSpravu(tokenSpravy);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [stav, tokenSpravy]);

  const titulniSekce = useMemo(
    () => [
      {
        nazev: "Základ provozu",
        popis: "Organizace, kontakty, místa a přístupy.",
      },
      {
        nazev: "Program a prodej",
        popis: "Akce, ceny, rezervace a dostupnost.",
      },
      {
        nazev: "Finance a návštěvnost",
        popis: "Objednávky, tržby, doručení a odbavení.",
      },
    ],
    [],
  );

  const rychlePrechody = useMemo(
    () => [
      {
        nazev: "Správa akcí",
        popis: "Program, detail akce a mapa míst.",
        href: "/sprava/akce",
        ikona: IconCalendarEvent,
      },
      {
        nazev: "Builder plánků",
        popis: "Sedadla, stoly a zóny pro místo konání.",
        href: "/sprava/mista/1",
        ikona: IconMap2,
      },
      {
        nazev: "Objednávky",
        popis: "Rezervace, hotovost, storna a vrácení.",
        href: "/sprava/objednavky",
        ikona: IconReceipt2,
      },
      {
        nazev: "Přehled výkonu",
        popis: "Tržby, obsazenost a návštěvnost.",
        href: "/sprava/platby",
        ikona: IconChartBar,
      },
    ],
    [],
  );

  function odhlasit() {
    localStorage.removeItem(klicTokenu);
    nastavTokenSpravy("");
    nastavProfil(null);
    nastavData(null);
    nastavPrehled(null);
    nastavStav("prihlaseni");
  }

  async function odesliPrihlaseni(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = vytvorTokenSpravy(formular.uzivatel, formular.heslo);
    await nactiSpravu(token);
  }

  if (stav === "cekam" || stav === "nacitani") {
    return (
      <div className="sprava-panel">
        <div className="sprava-panel-body">
          <div className="tlumeny">Připravuji přístup do správy a načítám provozní data...</div>
        </div>
      </div>
    );
  }

  if (stav === "obnova" && (!profil || !data || !prehled)) {
    return (
      <div className="sprava-panel">
        <div className="sprava-panel-header">
          <div>
            <h3>Obnovuji spojení se správou</h3>
            <p>{chyba || "Backend správy je dočasně nedostupný. Zkouším připojení znovu."}</p>
          </div>
        </div>
        <div className="sprava-panel-body stack">
          <div className="tlumeny">Automatický pokus proběhne znovu za několik sekund.</div>
          <div className="actions-end">
            <button className="button primary" type="button" onClick={() => void nactiSpravu(tokenSpravy)}>
              Zkusit znovu hned
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stav === "prihlaseni") {
    return (
      <div className="sprava-prihlaseni">
        <section className="sprava-panel">
          <div className="sprava-panel-header">
            <div>
              <h3>Přihlášení do správy</h3>
              <p>Správa je oddělená od veřejného portálu a zapisovací akce vyžadují oprávněný účet.</p>
            </div>
          </div>
          <div className="sprava-panel-body stack">
            <form className="form-grid" onSubmit={odesliPrihlaseni}>
              <label className="pole">
                <span className="pole-label">Uživatelské jméno</span>
                <input
                  value={formular.uzivatel}
                  onChange={(event) =>
                    nastavFormular((aktualni) => ({ ...aktualni, uzivatel: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="pole">
                <span className="pole-label">Heslo</span>
                <input
                  type="password"
                  value={formular.heslo}
                  onChange={(event) =>
                    nastavFormular((aktualni) => ({ ...aktualni, heslo: event.target.value }))
                  }
                  required
                />
              </label>
              <div className="actions-end pole-cela">
                <button className="button primary" type="submit">
                  Otevřít správu
                </button>
              </div>
            </form>

            {chyba ? <div className="hlaseni chyba">{chyba}</div> : null}

            <div className="panel">
              <h3>Demo přístup</h3>
              <div className="rozpis">
                <div className="rozpis-radek">
                  <span>Uživatel</span>
                  <strong>spravce</strong>
                </div>
                <div className="rozpis-radek">
                  <span>Heslo</span>
                  <strong>kliknilistek123</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!profil || !data || !prehled) {
    return null;
  }

  const metriky = [
    ...(profil.opravneni.finance
      ? [
          {
            stit: "Tržby celkem",
            hodnota: formatujCastku(prehled.souhrn.trzby_celkem, "CZK"),
            popis: `${prehled.souhrn.objednavky_zaplacene} zaplacených objednávek`,
          },
        ]
      : []),
    {
      stit: "Prodané vstupenky",
      hodnota: `${prehled.souhrn.prodane_vstupenky}`,
      popis: `${prehled.souhrn.platne_vstupenky} platných, ${prehled.souhrn.odbavene_vstupenky} odbavených`,
    },
    {
      stit: "Doručení a vstup",
      hodnota: `${prehled.souhrn.navstevnost_procent} %`,
      popis: `${prehled.souhrn.dorucene_vstupenky} doručených vstupenek`,
    },
    {
      stit: "Akce v provozu",
      hodnota: `${prehled.souhrn.akce_zverejnene}/${prehled.souhrn.akce_celkem}`,
      popis: `${prehled.souhrn.organizace_celkem} organizací ve správě`,
    },
    {
      stit: "Moje oprávnění",
      hodnota: [
        profil.opravneni.sprava_obsahu ? "Obsah" : null,
        profil.opravneni.finance ? "Finance" : null,
        profil.opravneni.odbaveni ? "Odbavení" : null,
      ]
        .filter(Boolean)
        .join(", ") || "Základní přístup",
      popis: "Rozsah, ve kterém je tento účet aktivní.",
    },
  ];

  const grafObjednavek = prehled.stavy_objednavek.map((polozka) => ({
    stitek: formatujStavObjednavky(polozka.stav),
    hodnota: polozka.pocet,
  }));

  const grafVstupenek = prehled.stavy_vstupenek.map((polozka) => ({
    stitek: formatujStavVstupenky(polozka.stav),
    hodnota: polozka.pocet,
  }));

  const grafAkci = prehled.vykonnost_akci.slice(0, 6).map((polozka) => ({
    stitek: polozka.nazev,
    hodnota: polozka.prodane_vstupenky,
  }));

  return (
    <Stack spacing={3}>
      {stav === "obnova" ? (
        <Paper sx={{ p: 2, borderRadius: 2, borderColor: alpha("#f4c36f", 0.35) }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}
          >
            <Box>
              <Typography sx={{ fontWeight: 700 }}>Správa čeká na obnovení backendu</Typography>
              <Typography variant="body2" color="text.secondary">
                {chyba || "Zkouším navázat spojení znovu. Jakmile backend naskočí, data se obnoví sama."}
              </Typography>
            </Box>
            <Button variant="outlined" onClick={() => void nactiSpravu(tokenSpravy)}>
              Zkusit znovu hned
            </Button>
          </Stack>
        </Paper>
      ) : null}

      <Paper
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 2,
          background: `
            linear-gradient(180deg, rgba(9,17,28,0.28), rgba(9,17,28,0.92)),
            radial-gradient(circle at top left, rgba(115,224,186,0.22), transparent 24%),
            radial-gradient(circle at top right, rgba(125,185,255,0.18), transparent 28%),
            linear-gradient(135deg, rgba(14,25,38,0.98), rgba(10,18,28,0.98))
          `,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.45fr) 360px" },
            gap: 3,
            alignItems: "stretch",
          }}
        >
          <Stack spacing={2.5} sx={{ justifyContent: "flex-end" }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Chip label="Dashboard správy" color="primary" variant="outlined" />
              <Chip label="Veřejný prodej bez registrace" variant="outlined" />
            </Stack>
            <Box>
              <Typography variant="h4" sx={{ maxWidth: "12ch", mb: 1.5 }}>
                Jedno pracovní místo pro provoz, prodej a správu sálu.
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 760, lineHeight: 1.7 }}>
                Hlavní dashboard spojuje builder plánků, akce, objednávky, vstupenky i finance do
                jednoho rychlého pracovního rozcestníku.
              </Typography>
            </Box>
          </Stack>

          <Paper
            sx={{
              p: 2.5,
              borderRadius: 2,
              backgroundColor: alpha("#0b1724", 0.86),
            }}
          >
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Aktivní účet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Role a organizace, ve kterých je účet aktivní.
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography sx={{ fontWeight: 700 }}>{profil.uzivatel}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {profil.clenstvi.map((polozka) => polozka.organizace_nazev).join(", ")}
                </Typography>
              </Box>
              <Stack spacing={1}>
                {profil.clenstvi.map((polozka) => (
                  <Typography
                    key={`${polozka.organizace_id}-${polozka.role}`}
                    variant="body2"
                    color="text.secondary"
                  >
                    {polozka.organizace_nazev} · {formatujRoliOrganizace(polozka.role)}
                  </Typography>
                ))}
              </Stack>
              <Box sx={{ pt: 1 }}>
                <Button variant="outlined" onClick={odhlasit}>
                  Odhlásit
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
        }}
      >
        {titulniSekce.map((sekce) => (
          <Paper key={sekce.nazev} sx={{ p: 2.25, borderRadius: 2 }}>
            <Typography variant="overline" color="text.secondary">
              {sekce.nazev}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
              {sekce.popis}
            </Typography>
          </Paper>
        ))}
        <Paper sx={{ p: 2.25, borderRadius: 2 }}>
          <Typography variant="overline" color="text.secondary">
            Přístupy
          </Typography>
          <Typography variant="h5" sx={{ mt: 1, mb: 0.5 }}>
            {profil.clenstvi.length}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            Aktivní organizační vazby účtu.
          </Typography>
        </Paper>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
        }}
      >
        {rychlePrechody.map((prechod) => {
          const Ikona = prechod.ikona;
          return (
            <Paper
              key={prechod.href}
              component="a"
              href={prechod.href}
              sx={{
                p: 2.25,
                borderRadius: 2,
                display: "grid",
                gap: 2,
                minHeight: 154,
                textDecoration: "none",
                transition: "transform 160ms ease, border-color 160ms ease, background-color 160ms ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  borderColor: alpha("#73e0ba", 0.28),
                  backgroundColor: alpha("#ffffff", 0.025),
                },
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: alpha("#73e0ba", 0.14),
                  color: "primary.main",
                }}
              >
                <Ikona size={20} stroke={1.8} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700 }}>{prechod.nazev}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
                  {prechod.popis}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "primary.main", fontWeight: 700 }}>
                <Typography variant="body2" color="inherit">
                  Otevřít
                </Typography>
                <IconArrowRight size={16} />
              </Stack>
            </Paper>
          );
        })}
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: `repeat(${metriky.length}, minmax(0, 1fr))` },
        }}
      >
        {metriky.map((metrika) => (
          <Paper
            key={metrika.stit}
            sx={{
              p: 2.25,
              borderRadius: 2,
              background: `linear-gradient(180deg, ${alpha("#132130", 0.98)}, ${alpha("#0b1724", 0.98)})`,
            }}
          >
            <Typography variant="overline" color="text.secondary">
              {metrika.stit}
            </Typography>
            <Typography variant="h5" sx={{ mt: 1, mb: 0.75 }}>
              {metrika.hodnota}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {metrika.popis}
            </Typography>
          </Paper>
        ))}
      </Box>

      <div className="grafy-grid">
        <GrafRozlozeni
          nadpis="Stavy objednávek"
          popis="Jak jsou rozložené objednávky v provozu."
          polozky={grafObjednavek}
        />
        <GrafRozlozeni
          nadpis="Stavy vstupenek"
          popis="Přehled vydaných kusů podle stavu."
          polozky={grafVstupenek}
        />
      </div>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "1.05fr 0.95fr" } }}>
        <Paper sx={{ p: 2.5, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6">Provozní stav</Typography>
              <Typography variant="body2" color="text.secondary">
                Rychlý přehled objednávek a vstupenek podle stavu.
              </Typography>
            </Box>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              }}
            >
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, backgroundColor: alpha("#ffffff", 0.02) }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                  Objednávky
                </Typography>
                <Stack spacing={1.25}>
                  {prehled.stavy_objednavek.map((polozka) => (
                    <Stack key={polozka.stav} direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "999px",
                            backgroundColor:
                              mapaBarevStavu[polozka.stav] === "uspech"
                                ? "#73e0ba"
                                : mapaBarevStavu[polozka.stav] === "varovani"
                                  ? "#f4c36f"
                                  : "#7b8da1",
                          }}
                        />
                        <Typography variant="body2">{formatujStavObjednavky(polozka.stav)}</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {polozka.pocet}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, backgroundColor: alpha("#ffffff", 0.02) }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                  Vstupenky
                </Typography>
                <Stack spacing={1.25}>
                  {prehled.stavy_vstupenek.map((polozka) => (
                    <Stack key={polozka.stav} direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "999px",
                            backgroundColor:
                              mapaBarevStavu[polozka.stav] === "uspech"
                                ? "#73e0ba"
                                : mapaBarevStavu[polozka.stav] === "varovani"
                                  ? "#f4c36f"
                                  : "#7b8da1",
                          }}
                        />
                        <Typography variant="body2">{formatujStavVstupenky(polozka.stav)}</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {polozka.pocet}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, backgroundColor: alpha("#ffffff", 0.02) }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                  Co hlídat dnes
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">
                      Čeká na platbu
                    </Typography>
                    <Typography variant="body2">{prehled.souhrn.objednavky_cekaji_na_platbu}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">
                      Doručené vstupenky
                    </Typography>
                    <Typography variant="body2">{prehled.souhrn.dorucene_vstupenky}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">
                      Odbaveno
                    </Typography>
                    <Typography variant="body2">{prehled.souhrn.odbavene_vstupenky}</Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2.5, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6">Pracovní sekce správy</Typography>
              <Typography variant="body2" color="text.secondary">
                Samostatné obrazovky pro hlavní části správy.
              </Typography>
            </Box>
            <Stack spacing={1.25}>
              {[
                ["Organizace a kontakty", "Subjekty, kontakty a vazby na provoz.", "/sprava/organizace"],
                ["Tým a přístupy", "Role, aktivace účtů a obsluha.", "/sprava/uzivatele"],
                ["Místa a plánky", "Sály, kina a builder sedadel a stolů.", "/sprava/mista"],
                ["Akce a prodej", "Program, kapacity a prodejní stav.", "/sprava/akce"],
                ["Objednávky, vstupenky a platby", "Nákupy, vydané kusy a finance.", "/sprava/objednavky"],
              ].map(([nazev, popis, href]) => (
                <Paper
                  key={href}
                  component="a"
                  href={href}
                  variant="outlined"
                  sx={{
                    p: 1.75,
                    borderRadius: 2,
                    textDecoration: "none",
                    backgroundColor: alpha("#ffffff", 0.02),
                    "&:hover": { backgroundColor: alpha("#ffffff", 0.035) },
                  }}
                >
                  <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{nazev}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
                        {popis}
                      </Typography>
                    </Box>
                    <IconArrowRight size={18} />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>
        </Paper>
      </Box>

      <GrafSloupcovy
        nadpis="Nejsilnější akce"
        popis="Prodáné vstupenky u nejvýkonnějších akcí."
        polozky={grafAkci}
      />

      <Paper sx={{ p: 2.5, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">Výkonnost akcí</Typography>
            <Typography variant="body2" color="text.secondary">
              Prodej, obsazenost, doručení vstupenek a návštěvnost po jednotlivých akcích.
            </Typography>
          </Box>
          <Stack spacing={1.5}>
            {prehled.vykonnost_akci.map((akce) => (
              <Paper
                key={akce.id}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: alpha("#ffffff", 0.02),
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.3fr) 180px 140px minmax(220px, 1fr) minmax(220px, 1fr) auto" },
                    gap: 2,
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{akce.nazev}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {akce.misto_konani_nazev} · {formatujStavAkce(akce.stav)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {formatujDatum(akce.zacatek)}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>
                    {formatujCastku(akce.trzby_celkem, "CZK")}
                  </Typography>
                  <Box>
                    <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.75 }}>
                      <Typography variant="caption" color="text.secondary">
                        Obsazenost
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {akce.obsazenost_procent} %
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(akce.obsazenost_procent, 100)}
                      sx={{ height: 8, borderRadius: 999 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
                      {akce.prodane_vstupenky} / {akce.kapacita}
                    </Typography>
                  </Box>
                  <Box>
                    <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.75 }}>
                      <Typography variant="caption" color="text.secondary">
                        Návštěvnost
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {akce.navstevnost_procent} %
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(akce.navstevnost_procent, 100)}
                      color="secondary"
                      sx={{ height: 8, borderRadius: 999 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
                      {akce.odbavene_vstupenky} / {akce.prodane_vstupenky || 0}
                    </Typography>
                  </Box>
                  <Button
                    component="a"
                    href={`/sprava/akce/${akce.slug}`}
                    variant="outlined"
                    endIcon={<IconArrowRight size={16} />}
                  >
                    Detail
                  </Button>
                </Box>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
