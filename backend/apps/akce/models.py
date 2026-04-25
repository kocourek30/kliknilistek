from django.db import models

from apps.jadro.models import ModelOrganizace


class MistoKonani(ModelOrganizace):
    nazev = models.CharField(max_length=255)
    adresa = models.CharField(max_length=255, blank=True)
    mesto = models.CharField(max_length=120, blank=True)
    kapacita = models.PositiveIntegerField(default=0)
    schema_sezeni = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["nazev"]

    def __str__(self) -> str:
        return self.nazev


class Akce(ModelOrganizace):
    class Stav(models.TextChoices):
        NAVRH = "navrh", "Navrh"
        ZVEREJNENO = "zverejneno", "Zverejneno"
        VYPRODANO = "vyprodano", "Vyprodano"
        UKONCENO = "ukonceno", "Ukonceno"
        ZRUSENO = "zruseno", "Zruseno"

    nazev = models.CharField(max_length=255)
    slug = models.SlugField()
    perex = models.CharField(max_length=255, blank=True)
    popis = models.TextField(blank=True)
    hlavni_fotka_url = models.URLField(blank=True)
    video_url = models.URLField(blank=True)
    misto_konani = models.ForeignKey(MistoKonani, on_delete=models.PROTECT, related_name="akce")
    schema_sezeni_override = models.JSONField(default=dict, blank=True)
    manualni_stavy_mist = models.JSONField(default=dict, blank=True)
    zacatek = models.DateTimeField()
    konec = models.DateTimeField(null=True, blank=True)
    stav = models.CharField(max_length=24, choices=Stav.choices, default=Stav.NAVRH)
    kapacita = models.PositiveIntegerField(default=0)
    rezervace_platnost_minuty = models.PositiveIntegerField(default=15)
    je_doporucena = models.BooleanField(default=False)

    class Meta:
        ordering = ["zacatek"]
        unique_together = ("organizace", "slug")

    def __str__(self) -> str:
        return self.nazev


class KategorieVstupenky(ModelOrganizace):
    akce = models.ForeignKey(Akce, on_delete=models.CASCADE, related_name="kategorie_vstupenek")
    nazev = models.CharField(max_length=120)
    popis = models.CharField(max_length=255, blank=True)
    cena = models.DecimalField(max_digits=10, decimal_places=2)
    mena = models.CharField(max_length=3, default="CZK")
    kapacita = models.PositiveIntegerField(default=0)
    povolene_zony = models.JSONField(default=list, blank=True)
    prodej_od = models.DateTimeField(null=True, blank=True)
    prodej_do = models.DateTimeField(null=True, blank=True)
    je_aktivni = models.BooleanField(default=True)

    class Meta:
        ordering = ["akce__zacatek", "nazev"]

    def __str__(self) -> str:
        return f"{self.akce}: {self.nazev}"
