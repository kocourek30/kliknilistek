"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  CssBaseline,
  Divider,
  List,
  ListItemButton,
  Paper,
  Stack,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import {
  IconBuildingCommunity,
  IconCalendarEvent,
  IconChartBar,
  IconCreditCard,
  IconDoorExit,
  IconFileInvoice,
  IconLayoutDashboard,
  IconMap2,
  IconMoonStars,
  IconReceipt2,
  IconSun,
  IconTicket,
  IconTool,
  IconUsers,
} from "@tabler/icons-react";

const klicMotivuSpravy = "kliknilistek.sprava.motiv";

const skupinyMenu = [
  {
    nazev: "Řízení",
    polozky: [
      { href: "/sprava", nazev: "Dashboard", popis: "Přehled provozu", ikona: IconLayoutDashboard },
      {
        href: "/sprava/organizace",
        nazev: "Organizace",
        popis: "Subjekty a kontakty",
        ikona: IconBuildingCommunity,
      },
      { href: "/sprava/uzivatele", nazev: "Uživatelé", popis: "Tým a oprávnění", ikona: IconUsers },
    ],
  },
  {
    nazev: "Prostor a program",
    polozky: [
      { href: "/sprava/mista", nazev: "Místa", popis: "Sály a plánky", ikona: IconMap2 },
      { href: "/sprava/mista/1", nazev: "Builder plánků", popis: "Návrh mapy míst", ikona: IconTool },
      { href: "/sprava/akce", nazev: "Akce", popis: "Program a prodej", ikona: IconCalendarEvent },
    ],
  },
  {
    nazev: "Prodej a finance",
    polozky: [
      { href: "/sprava/vstupenky", nazev: "Vstupenky", popis: "Vydané kusy", ikona: IconTicket },
      { href: "/sprava/objednavky", nazev: "Objednávky", popis: "Košíky a rezervace", ikona: IconReceipt2 },
      { href: "/sprava/fakturace", nazev: "Fakturace", popis: "Proformy a banka", ikona: IconFileInvoice },
      { href: "/sprava/platby", nazev: "Platby", popis: "Finance a hotovost", ikona: IconCreditCard },
    ],
  },
] as const;

function jeAktivni(cesta: string, href: string) {
  if (href === "/sprava") {
    return cesta === "/sprava";
  }

  return cesta === href || cesta.startsWith(`${href}/`);
}

export function SpravaAdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [motiv, nastavMotiv] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const ulozenyMotiv =
      typeof window !== "undefined" ? window.localStorage.getItem(klicMotivuSpravy) : null;
    if (ulozenyMotiv === "light" || ulozenyMotiv === "dark") {
      nastavMotiv(ulozenyMotiv);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(klicMotivuSpravy, motiv);
    }
    document.documentElement.setAttribute("data-admin-theme", motiv);
    return () => {
      document.documentElement.removeAttribute("data-admin-theme");
    };
  }, [motiv]);

  const temaSpravy = useMemo(
    () =>
      createTheme({
        palette: {
          mode: motiv,
          primary: {
            main: "#73e0ba",
          },
          secondary: {
            main: "#7db9ff",
          },
          background:
            motiv === "dark"
              ? {
                  default: "#071019",
                  paper: "#0d1724",
                }
              : {
                  default: "#f4f8fc",
                  paper: "#ffffff",
                },
          divider: motiv === "dark" ? "rgba(164, 184, 209, 0.14)" : "rgba(110, 133, 160, 0.18)",
          text:
            motiv === "dark"
              ? {
                  primary: "#f3f7fb",
                  secondary: "#92a7be",
                }
              : {
                  primary: "#122133",
                  secondary: "#5c7087",
                },
        },
        shape: {
          borderRadius: 8,
        },
        typography: {
          fontFamily: "Inter, Arial, Helvetica, sans-serif",
          h4: {
            fontWeight: 700,
            letterSpacing: 0,
          },
          h6: {
            fontWeight: 700,
            letterSpacing: 0,
          },
          button: {
            textTransform: "none",
            fontWeight: 650,
          },
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                border:
                  motiv === "dark"
                    ? "1px solid rgba(164, 184, 209, 0.14)"
                    : "1px solid rgba(110, 133, 160, 0.16)",
                boxShadow:
                  motiv === "dark"
                    ? "0 12px 32px rgba(0, 0, 0, 0.16)"
                    : "0 10px 24px rgba(20, 36, 52, 0.08)",
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                minHeight: 52,
              },
            },
          },
        },
      }),
    [motiv],
  );

  return (
    <ThemeProvider theme={temaSpravy}>
      <CssBaseline />
      <Box
        sx={{
          width: "100%",
          maxWidth: "100%",
          px: { xs: 1, sm: 1.5 },
          mx: "auto",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "320px minmax(0, 1fr)" },
          gap: 3,
          pt: 2,
          pb: 7,
        }}
      >
        <Stack spacing={2} sx={{ position: { lg: "sticky" }, top: { lg: 96 }, alignSelf: "start" }}>
          <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Stack spacing={1}>
                <Chip
                  label="Správa"
                  color="primary"
                  variant="outlined"
                  sx={{ width: "fit-content", fontWeight: 700 }}
                />
                <Box>
                  <Typography variant="h6">Správa KlikniLístek</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hlavní rozcestník pro provoz, plánky, prodej a finance.
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              <Stack spacing={2}>
                {skupinyMenu.map((skupina) => (
                  <Box key={skupina.nazev}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontWeight: 700,
                        display: "block",
                        mb: 1,
                      }}
                    >
                      {skupina.nazev}
                    </Typography>
                    <List disablePadding sx={{ display: "grid", gap: 1 }}>
                      {skupina.polozky.map((polozka) => {
                        const aktivni = jeAktivni(pathname, polozka.href);
                        const Ikona = polozka.ikona;
                        return (
                          <ListItemButton
                            key={polozka.href}
                            component="a"
                            href={polozka.href}
                            selected={aktivni}
                            sx={{
                              alignItems: "flex-start",
                              gap: 1.5,
                              px: 1.5,
                              py: 1.2,
                              border: "1px solid transparent",
                              backgroundColor: aktivni
                                ? alpha(temaSpravy.palette.primary.main, 0.12)
                                : alpha("#ffffff", 0.02),
                              borderColor: aktivni
                                ? alpha(temaSpravy.palette.primary.main, 0.24)
                                : "transparent",
                              "&:hover": {
                                backgroundColor: aktivni
                                  ? alpha(temaSpravy.palette.primary.main, 0.16)
                                  : alpha("#ffffff", 0.04),
                              },
                            }}
                          >
                            <Box sx={{ mt: 0.2, color: aktivni ? "primary.main" : "text.secondary" }}>
                              <Ikona size={19} stroke={1.8} />
                            </Box>
                            <Box sx={{ display: "grid", gap: 0.25 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: 14, color: "text.primary" }}>
                                {polozka.nazev}
                              </Typography>
                              <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.5 }}>
                                {polozka.popis}
                              </Typography>
                            </Box>
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Zobrazení</Typography>
              <Button
                type="button"
                variant="outlined"
                startIcon={motiv === "dark" ? <IconSun size={18} /> : <IconMoonStars size={18} />}
                onClick={() => nastavMotiv((aktualni) => (aktualni === "dark" ? "light" : "dark"))}
                sx={{ justifyContent: "flex-start" }}
              >
                {motiv === "dark" ? "Přepnout na světlý režim" : "Přepnout na tmavý režim"}
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Rychlé přechody</Typography>
              <Button
                component="a"
                href="/odbaveni"
                variant="outlined"
                startIcon={<IconDoorExit size={18} />}
                sx={{ justifyContent: "flex-start" }}
              >
                Odbavení
              </Button>
              <Button
                component="a"
                href="/"
                target="_blank"
                variant="outlined"
                startIcon={<IconChartBar size={18} />}
                sx={{ justifyContent: "flex-start" }}
              >
                Veřejný portál
              </Button>
            </Stack>
          </Paper>
        </Stack>

        <Box sx={{ minWidth: 0 }}>{children}</Box>
      </Box>
    </ThemeProvider>
  );
}
