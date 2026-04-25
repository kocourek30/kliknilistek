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

const klicMotivuSpravy = "kliknilistek.sprava.motiv.v2";

const skupinyMenu = [
  {
    nazev: "Řízení",
    polozky: [
      { href: "/sprava", nazev: "Dashboard", ikona: IconLayoutDashboard },
      {
        href: "/sprava/organizace",
        nazev: "Organizace",
        ikona: IconBuildingCommunity,
      },
      { href: "/sprava/uzivatele", nazev: "Uživatelé", ikona: IconUsers },
    ],
  },
  {
    nazev: "Prostor a program",
    polozky: [
      { href: "/sprava/mista", nazev: "Místa", ikona: IconMap2 },
      { href: "/sprava/mista/1", nazev: "Builder plánků", ikona: IconTool },
      { href: "/sprava/akce", nazev: "Akce", ikona: IconCalendarEvent },
    ],
  },
  {
    nazev: "Prodej a finance",
    polozky: [
      { href: "/sprava/vstupenky", nazev: "Vstupenky", ikona: IconTicket },
      { href: "/sprava/objednavky", nazev: "Objednávky", ikona: IconReceipt2 },
      { href: "/sprava/fakturace", nazev: "Fakturace", ikona: IconFileInvoice },
      { href: "/sprava/platby", nazev: "Platby", ikona: IconCreditCard },
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
  const [motiv, nastavMotiv] = useState<"dark" | "light">("light");

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
            main: "#175f66",
          },
          secondary: {
            main: "#7a4c59",
          },
          background:
            motiv === "dark"
              ? {
                  default: "#0f1720",
                  paper: "#16202b",
                }
              : {
                  default: "#f6f3ee",
                  paper: "#fffdfa",
                },
          divider: motiv === "dark" ? "rgba(164, 184, 209, 0.14)" : "rgba(110, 133, 160, 0.18)",
          text:
            motiv === "dark"
              ? {
                  primary: "#eef5fb",
                  secondary: "#a2b2c2",
                }
              : {
                  primary: "#122133",
                  secondary: "#5b6d7d",
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
                    : "1px solid rgba(32, 50, 62, 0.10)",
                boxShadow:
                  motiv === "dark"
                    ? "0 16px 34px rgba(4, 10, 18, 0.22)"
                    : "0 10px 24px rgba(28, 44, 60, 0.07)",
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                backgroundColor:
                  motiv === "dark" ? alpha("#ffffff", 0.03) : alpha("#fffdfa", 0.92),
                "& fieldset": {
                  borderColor:
                    motiv === "dark" ? "rgba(164, 184, 209, 0.16)" : "rgba(92, 109, 125, 0.20)",
                },
                "&:hover fieldset": {
                  borderColor:
                    motiv === "dark" ? "rgba(164, 184, 209, 0.3)" : "rgba(23, 95, 102, 0.24)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#175f66",
                  borderWidth: 1,
                },
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
                minHeight: 42,
              },
              contained: {
                background: "linear-gradient(135deg, #175f66 0%, #2d7a81 100%)",
                color: "#fefcf8",
                boxShadow: "none",
                "&:hover": {
                  background: "linear-gradient(135deg, #15565c 0%, #286a71 100%)",
                  boxShadow: "none",
                },
              },
              outlined: {
                borderColor: motiv === "dark" ? "rgba(164, 184, 209, 0.18)" : "rgba(92, 109, 125, 0.22)",
                backgroundColor: motiv === "dark" ? "transparent" : alpha("#fffdfa", 0.72),
                "&:hover": {
                  borderColor: motiv === "dark" ? "rgba(164, 184, 209, 0.3)" : "rgba(23, 95, 102, 0.24)",
                  backgroundColor: motiv === "dark" ? alpha("#ffffff", 0.04) : alpha("#175f66", 0.04),
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 700,
              },
              outlined: {
                backgroundColor: motiv === "dark" ? alpha("#ffffff", 0.03) : alpha("#175f66", 0.05),
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
          px: { xs: 1, sm: 1.5, xl: 2 },
          mx: "auto",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "300px minmax(0, 1fr)" },
          gap: { xs: 2, lg: 3 },
          pt: { xs: 1.5, md: 2 },
          pb: 7,
        }}
      >
        <Stack spacing={1.75} sx={{ position: { lg: "sticky" }, top: { lg: 92 }, alignSelf: "start" }}>
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
                                  : motiv === "dark"
                                    ? alpha("#ffffff", 0.03)
                                    : alpha("#122133", 0.03),
                              borderColor: aktivni
                                ? alpha(temaSpravy.palette.primary.main, 0.24)
                                : "transparent",
                              "&:hover": {
                                backgroundColor: aktivni
                                  ? alpha(temaSpravy.palette.primary.main, 0.16)
                                  : motiv === "dark"
                                    ? alpha("#ffffff", 0.05)
                                    : alpha("#122133", 0.05),
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
                sx={{ justifyContent: "flex-start", minHeight: 44 }}
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
                sx={{ justifyContent: "flex-start", minHeight: 44 }}
              >
                Odbavení
              </Button>
              <Button
                component="a"
                href="/"
                target="_blank"
                variant="outlined"
                startIcon={<IconChartBar size={18} />}
                sx={{ justifyContent: "flex-start", minHeight: 44 }}
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
