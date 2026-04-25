from django.conf import settings
from django.db import models

from apps.jadro.models import CasovyModel


class Organizace(CasovyModel):
    class TypOrganizace(models.TextChoices):
        OBEC = "obec", "Obec"
        KULTURNI_DUM = "kulturni_dum", "Kulturni dum"
        PORADATEL = "poradatel", "Poradatel"

    nazev = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    typ_organizace = models.CharField(
        max_length=32,
        choices=TypOrganizace.choices,
        default=TypOrganizace.OBEC,
    )
    kontaktni_email = models.EmailField(blank=True)
    kontaktni_telefon = models.CharField(max_length=32, blank=True)
    hlavni_barva = models.CharField(max_length=7, default="#57C7A5")
    fakturacni_nazev = models.CharField(max_length=255, blank=True)
    ico = models.CharField(max_length=16, blank=True)
    dic = models.CharField(max_length=16, blank=True)
    fakturacni_ulice = models.CharField(max_length=255, blank=True)
    fakturacni_mesto = models.CharField(max_length=128, blank=True)
    fakturacni_psc = models.CharField(max_length=16, blank=True)
    cislo_uctu = models.CharField(max_length=34, blank=True)
    kod_banky = models.CharField(max_length=8, blank=True)
    iban = models.CharField(max_length=34, blank=True)
    swift = models.CharField(max_length=16, blank=True)
    je_aktivni = models.BooleanField(default=True)

    class Meta:
        ordering = ["nazev"]

    def __str__(self) -> str:
        return self.nazev


class ClenstviOrganizace(CasovyModel):
    class Role(models.TextChoices):
        VLASTNIK = "vlastnik", "Vlastnik"
        SPRAVCE = "spravce", "Spravce"
        POKLADNA = "pokladna", "Pokladna"
        ODBAVENI = "odbaveni", "Odbaveni"
        UCETNI = "ucetni", "Ucetni"

    organizace = models.ForeignKey(Organizace, on_delete=models.CASCADE, related_name="clenstvi")
    uzivatel = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="clenstvi_organizaci",
    )
    role = models.CharField(max_length=32, choices=Role.choices)
    je_aktivni = models.BooleanField(default=True)

    class Meta:
        unique_together = ("organizace", "uzivatel", "role")

    def __str__(self) -> str:
        return f"{self.uzivatel} @ {self.organizace} ({self.role})"
