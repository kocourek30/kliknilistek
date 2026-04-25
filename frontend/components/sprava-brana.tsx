"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  LinearProgress,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  IconArrowRight,
  IconCalendarEvent,
  IconChartBar,
  IconMailCog,
  IconMap2,
  IconReceipt2,
} from "@tabler/icons-react";

import {
  jeAutorizacniApiChyba,
  jeDocasneNedostupnaApiChyba,
  nactiNastaveniSystemu,
  nactiPrehledSpravy,
  nactiProfilSpravy,
  nactiSouhrnAdministrace,
  odesliTestovaciEmailSmtp,
  upravNastaveniSystemu,
  vytvorTokenSpravy,
  type NastaveniSystemu,
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
import { demoRezimZapnuty, vytvorVychoziPrihlaseni } from "@/lib/demo-rezim";

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
  const [nastaveniSystemu, nastavNastaveniSystemu] = useState<NastaveniSystemu | null>(null);
  const [formularSmtp, nastavFormularSmtp] = useState({
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
  const [chyba, nastavChybu] = useState("");
  const [smtpZprava, nastavSmtpZprava] = useState("");
  const [smtpChyba, nastavSmtpChyba] = useState("");
  const [ukladaSeSmtp, nastavUkladaSeSmtp] = useState(false);
  const [testovaciEmail, nastavTestovaciEmail] = useState("kocourek30@gmail.com");
  const [odesilaSeTest, nastavOdesilaSeTest] = useState(false);
  const [formular, nastavFormular] = useState(vytvorVychoziPrihlaseni("spravce"));

  function synchronizujFormularSmtp(nastaveni: NastaveniSystemu) {
    nastavFormularSmtp({
      smtp_aktivni: nastaveni.smtp_aktivni,
      smtp_host: nastaveni.smtp_host || "",
      smtp_port: String(nastaveni.smtp_port || 587),
      smtp_uzivatel: nastaveni.smtp_uzivatel || "",
      smtp_heslo: "",
      smtp_use_tls: nastaveni.smtp_use_tls,
      smtp_use_ssl: nastaveni.smtp_use_ssl,
      smtp_od_email: nastaveni.smtp_od_email || "",
      smtp_od_jmeno: nastaveni.smtp_od_jmeno || "",
      smtp_timeout: String(nastaveni.smtp_timeout || 20),
    });
  }

  async function nactiSpravu(token: string) {
    nastavStav("nacitani");
    nastavChybu("");

    try {
      const [profilSpravy, dataSpravy, dataPrehledu, dataNastaveni] = await Promise.all([
        nactiProfilSpravy(token),
        nactiSouhrnAdministrace(token),
        nactiPrehledSpravy(token),
        nactiNastaveniSystemu(token),
      ]);

      if (!profilSpravy.ma_pristup_do_spravy) {
        throw new Error("Účet nemá přístup do provozní správy.");
      }

      localStorage.setItem(klicTokenu, token);
      nastavTokenSpravy(token);
      nastavProfil(profilSpravy);
      nastavData(dataSpravy);
      nastavPrehled(dataPrehledu);
      nastavNastaveniSystemu(dataNastaveni);
      synchronizujFormularSmtp(dataNastaveni);
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
      },
      {
        nazev: "Program a prodej",
      },
      {
        nazev: "Finance a návštěvnost",
      },
    ],
    [],
  );

  const rychlePrechody = useMemo(
    () => [
      {
        nazev: "Správa akcí",
        href: "/sprava/akce",
        ikona: IconCalendarEvent,
      },
      {
        nazev: "Builder plánků",
        href: "/sprava/mista/1",
        ikona: IconMap2,
      },
      {
        nazev: "Objednávky",
        href: "/sprava/objednavky",
        ikona: IconReceipt2,
      },
      {
        nazev: "Přehled výkonu",
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

  async function ulozVychoziSmtp() {
    if (!tokenSpravy) {
      return;
    }

    nastavUkladaSeSmtp(true);
    nastavSmtpChyba("");
    nastavSmtpZprava("");

    try {
      const ulozene = await upravNastaveniSystemu(
        {
          smtp_aktivni: formularSmtp.smtp_aktivni,
          smtp_host: formularSmtp.smtp_host.trim(),
          smtp_port: Number(formularSmtp.smtp_port || 587),
          smtp_uzivatel: formularSmtp.smtp_uzivatel.trim(),
          smtp_heslo: formularSmtp.smtp_heslo || undefined,
          smtp_use_tls: formularSmtp.smtp_use_tls,
          smtp_use_ssl: formularSmtp.smtp_use_ssl,
          smtp_od_email: formularSmtp.smtp_od_email.trim(),
          smtp_od_jmeno: formularSmtp.smtp_od_jmeno.trim(),
          smtp_timeout: Number(formularSmtp.smtp_timeout || 20),
        },
        tokenSpravy,
      );
      nastavNastaveniSystemu(ulozene);
      synchronizujFormularSmtp(ulozene);
      nastavSmtpZprava("Výchozí SMTP platformy je uložené. Organizace bez vlastního SMTP ho teď budou používat automaticky.");
    } catch (error) {
      nastavSmtpChyba(error instanceof Error ? error.message : "Výchozí SMTP se nepodařilo uložit.");
    } finally {
      nastavUkladaSeSmtp(false);
    }
  }

  async function odesliTestSmtp() {
    if (!tokenSpravy || !testovaciEmail.trim()) {
      nastavSmtpChyba("Zadej cílový e-mail pro testovací zprávu.");
      return;
    }

    nastavOdesilaSeTest(true);
    nastavSmtpChyba("");
    nastavSmtpZprava("");
    try {
      const odpoved = await odesliTestovaciEmailSmtp(testovaciEmail.trim(), tokenSpravy);
      nastavSmtpZprava(odpoved.detail);
    } catch (error) {
      nastavSmtpChyba(error instanceof Error ? error.message : "Testovací e-mail se nepodařilo odeslat.");
    } finally {
      nastavOdesilaSeTest(false);
    }
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
            <p>{chyba || "Zkouším připojení znovu."}</p>
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

            {demoRezimZapnuty ? (
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
            ) : null}
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
  ];

  const provozniKarty = [
    {
      stit: "Moje oprávnění",
      nadpis:
        [
          profil.opravneni.sprava_obsahu ? "Obsah" : null,
          profil.opravneni.finance ? "Finance" : null,
          profil.opravneni.odbaveni ? "Odbavení" : null,
        ]
          .filter(Boolean)
          .join(", ") || "Základní přístup",
      popis: "Rozsah, ve kterém je tenhle účet aktivní.",
    },
    {
      stit: "Přístupy",
      nadpis: `${profil.clenstvi.length}`,
      popis: "Aktivní organizační vazby účtu a role v provozu.",
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
          p: { xs: 2.25, md: 3 },
          borderRadius: 2,
          background: (theme) =>
            theme.palette.mode === "dark"
              ? `
                linear-gradient(180deg, rgba(9,17,28,0.28), rgba(9,17,28,0.92)),
                radial-gradient(circle at top left, rgba(115,224,186,0.22), transparent 24%),
                radial-gradient(circle at top right, rgba(125,185,255,0.18), transparent 28%),
                linear-gradient(135deg, rgba(14,25,38,0.98), rgba(10,18,28,0.98))
              `
              : `
                linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,253,249,0.96)),
                radial-gradient(circle at top left, rgba(23,95,102,0.12), transparent 24%),
                radial-gradient(circle at top right, rgba(110,65,85,0.10), transparent 28%),
                linear-gradient(135deg, rgba(252,250,246,0.98), rgba(246,241,234,0.98))
              `,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.55fr) 340px" },
            gap: 2.5,
            alignItems: "stretch",
          }}
        >
          <Stack spacing={2} sx={{ justifyContent: "space-between" }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Chip label="Dashboard správy" color="primary" variant="outlined" />
            </Stack>
            <Box sx={{ display: "grid", gap: 1.25 }}>
              <Typography variant="h4" sx={{ maxWidth: "13ch" }}>
                Přehled správy pro každodenní provoz.
              </Typography>
            </Box>
            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              }}
            >
              {titulniSekce.map((sekce) => (
                <Paper
                  key={sekce.nazev}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark" ? alpha("#ffffff", 0.02) : alpha("#122133", 0.03),
                  }}
                >
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ display: "block", mb: 0.75 }}
                  >
                    {sekce.nazev}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Stack>

          <Paper
            sx={{
              p: 2.5,
              borderRadius: 2,
              backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                  ? alpha("#0b1724", 0.86)
                  : alpha("#fffdf9", 0.92),
            }}
          >
            <Stack spacing={2.25}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Aktivní účet
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
              <Box
                sx={{
                  display: "grid",
                  gap: 1.25,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "1fr" },
                }}
              >
                {provozniKarty.map((karta) => (
                  <Paper
                    key={karta.stit}
                    variant="outlined"
                    sx={{
                      p: 1.75,
                      borderRadius: 2,
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? alpha("#ffffff", 0.025)
                          : alpha("#122133", 0.025),
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {karta.stit}
                    </Typography>
                    <Typography sx={{ mt: 0.75, mb: 0.5, fontWeight: 700 }}>{karta.nadpis}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {karta.popis}
                    </Typography>
                  </Paper>
                ))}
              </Box>
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
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark" ? alpha("#ffffff", 0.025) : alpha("#122133", 0.03),
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
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
        }}
      >
        {metriky.map((metrika) => (
          <Paper
            key={metrika.stit}
            sx={{
              p: 2.25,
              borderRadius: 2,
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? `linear-gradient(180deg, ${alpha("#132130", 0.98)}, ${alpha("#0b1724", 0.98)})`
                  : `linear-gradient(180deg, ${alpha("#ffffff", 0.98)}, ${alpha("#f4eee6", 0.98)})`,
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

      <Paper sx={{ p: 2.5, borderRadius: 2 }}>
        <Stack spacing={2.25}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}
          >
            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.75 }}>
                <IconMailCog size={18} />
                <Typography variant="h6">Výchozí SMTP platformy</Typography>
              </Stack>
            </Box>
            <Chip
              color={nastaveniSystemu?.smtp_aktivni ? "success" : "default"}
              label={nastaveniSystemu?.smtp_aktivni ? "Globální SMTP je aktivní" : "Použije se env fallback"}
              variant="outlined"
            />
          </Stack>

          {smtpZprava ? <Alert severity="success">{smtpZprava}</Alert> : null}
          {smtpChyba ? <Alert severity="error">{smtpChyba}</Alert> : null}

          <Box
            sx={{
              display: "grid",
              gap: 2.25,
              gridTemplateColumns: { xs: "1fr", xl: "300px minmax(0, 1fr)" },
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? alpha("#ffffff", 0.02) : alpha("#122133", 0.02),
              }}
            >
              <Stack spacing={1.5}>
                <Typography variant="subtitle2">Nastavení</Typography>
                <Divider />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formularSmtp.smtp_aktivni}
                      onChange={(event) =>
                        nastavFormularSmtp((aktualni) => ({ ...aktualni, smtp_aktivni: event.target.checked }))
                      }
                    />
                  }
                  label="Používat globální SMTP"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formularSmtp.smtp_use_tls}
                      onChange={(event) =>
                        nastavFormularSmtp((aktualni) => ({ ...aktualni, smtp_use_tls: event.target.checked }))
                      }
                    />
                  }
                  label="TLS"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formularSmtp.smtp_use_ssl}
                      onChange={(event) =>
                        nastavFormularSmtp((aktualni) => ({ ...aktualni, smtp_use_ssl: event.target.checked }))
                      }
                    />
                  }
                  label="SSL"
                />
              </Stack>
            </Paper>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" },
              }}
            >
              <TextField
                label="SMTP host"
                value={formularSmtp.smtp_host}
                onChange={(event) => nastavFormularSmtp((aktualni) => ({ ...aktualni, smtp_host: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Port"
                value={formularSmtp.smtp_port}
                onChange={(event) => nastavFormularSmtp((aktualni) => ({ ...aktualni, smtp_port: event.target.value }))}
                fullWidth
              />
              <TextField
                label="SMTP uživatel"
                value={formularSmtp.smtp_uzivatel}
                onChange={(event) => nastavFormularSmtp((aktualni) => ({ ...aktualni, smtp_uzivatel: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Nové heslo SMTP"
                type="password"
                value={formularSmtp.smtp_heslo}
                onChange={(event) => nastavFormularSmtp((aktualni) => ({ ...aktualni, smtp_heslo: event.target.value }))}
                helperText="Nech prázdné, pokud se heslo nemění."
                fullWidth
              />
              <TextField
                label="Odesílací e-mail"
                value={formularSmtp.smtp_od_email}
                onChange={(event) => nastavFormularSmtp((aktualni) => ({ ...aktualni, smtp_od_email: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Jméno odesílatele"
                value={formularSmtp.smtp_od_jmeno}
                onChange={(event) => nastavFormularSmtp((aktualni) => ({ ...aktualni, smtp_od_jmeno: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Timeout (s)"
                value={formularSmtp.smtp_timeout}
                onChange={(event) => nastavFormularSmtp((aktualni) => ({ ...aktualni, smtp_timeout: event.target.value }))}
                fullWidth
              />
            </Box>
          </Box>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}>
            <Button variant="contained" onClick={() => void ulozVychoziSmtp()} disabled={ukladaSeSmtp}>
              {ukladaSeSmtp ? "Ukládám SMTP..." : "Uložit výchozí SMTP"}
            </Button>
          </Stack>

          <Divider />

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto" },
              alignItems: "end",
            }}
          >
            <TextField
              label="Testovací e-mail"
              value={testovaciEmail}
              onChange={(event) => nastavTestovaciEmail(event.target.value)}
              fullWidth
            />
            <Button variant="outlined" onClick={() => void odesliTestSmtp()} disabled={odesilaSeTest}>
              {odesilaSeTest ? "Odesílám test..." : "Odeslat testovací e-mail"}
            </Button>
          </Box>
        </Stack>
      </Paper>

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
            </Box>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              }}
            >
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, backgroundColor: (theme) => theme.palette.mode === "dark" ? alpha("#ffffff", 0.02) : alpha("#122133", 0.02) }}>
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

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, backgroundColor: (theme) => theme.palette.mode === "dark" ? alpha("#ffffff", 0.02) : alpha("#122133", 0.02) }}>
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

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, backgroundColor: (theme) => theme.palette.mode === "dark" ? alpha("#ffffff", 0.02) : alpha("#122133", 0.02) }}>
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
            </Box>
            <Stack spacing={1.25}>
              {[
                ["Organizace a kontakty", "/sprava/organizace"],
                ["Tým a přístupy", "/sprava/uzivatele"],
                ["Místa a plánky", "/sprava/mista"],
                ["Akce a prodej", "/sprava/akce"],
                ["Objednávky, vstupenky a platby", "/sprava/objednavky"],
              ].map(([nazev, href]) => (
                <Paper
                  key={href}
                  component="a"
                  href={href}
                  variant="outlined"
                  sx={{
                    p: 1.75,
                    borderRadius: 2,
                    textDecoration: "none",
                    backgroundColor: (theme) => theme.palette.mode === "dark" ? alpha("#ffffff", 0.02) : alpha("#122133", 0.02),
                    "&:hover": { backgroundColor: (theme) => theme.palette.mode === "dark" ? alpha("#ffffff", 0.035) : alpha("#122133", 0.04) },
                  }}
                >
                  <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{nazev}</Typography>
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
        polozky={grafAkci}
      />

      <Paper sx={{ p: 2.5, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">Výkonnost akcí</Typography>
          </Box>
          <Stack spacing={1.5}>
            {prehled.vykonnost_akci.map((akce) => (
              <Paper
                key={akce.id}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: (theme) => theme.palette.mode === "dark" ? alpha("#ffffff", 0.02) : alpha("#122133", 0.02),
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
