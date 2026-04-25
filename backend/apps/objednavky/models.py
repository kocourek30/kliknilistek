from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.jadro.models import ModelOrganizace


class Objednavka(ModelOrganizace):
    class ZpusobUhrady(models.TextChoices):
        ONLINE = "online", "Online platba"
        BANKOVNI_PREVOD = "bankovni_prevod", "Bankovni prevod s QR"

    class Stav(models.TextChoices):
        NAVRH = "navrh", "Navrh"
        CEKA_NA_PLATBU = "ceka_na_platbu", "Ceka na platbu"
        ZAPLACENO = "zaplaceno", "Zaplaceno"
        ZRUSENO = "zruseno", "Zruseno"
        VRACENO = "vraceno", "Vraceno"

    verejne_id = models.CharField(max_length=32, unique=True)
    email_zakaznika = models.EmailField()
    jmeno_zakaznika = models.CharField(max_length=255, blank=True)
    telefon_zakaznika = models.CharField(max_length=32, blank=True)
    vytvoril = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="vytvorene_objednavky",
    )
    zpusob_uhrady = models.CharField(
        max_length=32,
        choices=ZpusobUhrady.choices,
        default=ZpusobUhrady.ONLINE,
    )
    stav = models.CharField(max_length=24, choices=Stav.choices, default=Stav.NAVRH)
    mezisoucet = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    poplatek = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    celkem = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    mena = models.CharField(max_length=3, default="CZK")
    rezervace_do = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-vytvoreno"]

    def __str__(self) -> str:
        return self.verejne_id

    @property
    def je_rezervace_aktivni(self) -> bool:
        if self.stav == self.Stav.ZAPLACENO:
            return True
        if self.stav != self.Stav.CEKA_NA_PLATBU:
            return False
        if self.rezervace_do is None:
            return True
        return self.rezervace_do > timezone.now()


class PolozkaObjednavky(ModelOrganizace):
    objednavka = models.ForeignKey(Objednavka, on_delete=models.CASCADE, related_name="polozky")
    kategorie_vstupenky = models.ForeignKey(
        "akce.KategorieVstupenky",
        on_delete=models.PROTECT,
        related_name="polozky_objednavky",
    )
    akce = models.ForeignKey("akce.Akce", on_delete=models.PROTECT, related_name="polozky_objednavky")
    pocet = models.PositiveIntegerField(default=1)
    vybrana_mista = models.JSONField(default=list, blank=True)
    cena_za_kus = models.DecimalField(max_digits=10, decimal_places=2)
    cena_celkem = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self) -> str:
        return f"{self.objednavka.verejne_id} / {self.kategorie_vstupenky.nazev}"
