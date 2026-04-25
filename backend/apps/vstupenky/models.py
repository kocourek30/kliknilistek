from django.conf import settings
from django.db import models

from apps.jadro.models import ModelOrganizace


class Vstupenka(ModelOrganizace):
    class Stav(models.TextChoices):
        REZERVOVANA = "rezervovana", "Rezervovana"
        PLATNA = "platna", "Platna"
        ODBAVENA = "odbavena", "Odbavena"
        ZRUSENA = "zrusena", "Zrusena"
        VRACENA = "vracena", "Vracena"

    objednavka = models.ForeignKey("objednavky.Objednavka", on_delete=models.CASCADE, related_name="vstupenky")
    polozka_objednavky = models.ForeignKey(
        "objednavky.PolozkaObjednavky",
        on_delete=models.CASCADE,
        related_name="vstupenky",
    )
    akce = models.ForeignKey("akce.Akce", on_delete=models.PROTECT, related_name="vstupenky")
    kategorie_vstupenky = models.ForeignKey(
        "akce.KategorieVstupenky",
        on_delete=models.PROTECT,
        related_name="vstupenky",
    )
    oznaceni_mista = models.CharField(max_length=64, blank=True)
    kod = models.CharField(max_length=64, unique=True)
    qr_data = models.CharField(max_length=255)
    jmeno_navstevnika = models.CharField(max_length=255, blank=True)
    email_navstevnika = models.EmailField(blank=True)
    stav = models.CharField(max_length=24, choices=Stav.choices, default=Stav.REZERVOVANA)
    vystavena = models.DateTimeField(auto_now_add=True)
    dorucena = models.DateTimeField(null=True, blank=True)
    posledni_zmenu_stavu_provedl = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="zmeny_stavu_vstupenek",
    )

    class Meta:
        ordering = ["-vystavena"]

    def __str__(self) -> str:
        return self.kod


class EmailovaZasilka(ModelOrganizace):
    class Stav(models.TextChoices):
        VYTVORENO = "vytvoreno", "Vytvoreno"
        ODESLANO = "odeslano", "Odeslano"
        CHYBA = "chyba", "Chyba"

    objednavka = models.ForeignKey(
        "objednavky.Objednavka",
        on_delete=models.CASCADE,
        related_name="emailove_zasilky",
    )
    prijemce_email = models.EmailField()
    predmet = models.CharField(max_length=255)
    stav = models.CharField(max_length=24, choices=Stav.choices, default=Stav.VYTVORENO)
    text_zpravy = models.TextField(blank=True)
    chyba_text = models.TextField(blank=True)
    pocet_priloh = models.PositiveIntegerField(default=0)
    odeslano_v = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-vytvoreno"]

    def __str__(self) -> str:
        return f"{self.objednavka.verejne_id} / {self.prijemce_email}"
