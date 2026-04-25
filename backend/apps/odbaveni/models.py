from django.conf import settings
from django.db import models

from apps.jadro.models import ModelOrganizace


class Odbaveni(ModelOrganizace):
    class Vysledek(models.TextChoices):
        POVOLENO = "povoleno", "Povoleno"
        DUPLICITNI = "duplicitni", "Duplicitni"
        NEPLATNE = "neplatne", "Neplatne"
        ODMITNUTO = "odmitnuto", "Odmitnuto"

    vstupenka = models.ForeignKey(
        "vstupenky.Vstupenka",
        on_delete=models.CASCADE,
        related_name="odbaveni",
        null=True,
        blank=True,
    )
    akce = models.ForeignKey(
        "akce.Akce",
        on_delete=models.PROTECT,
        related_name="odbaveni",
        null=True,
        blank=True,
    )
    zpracoval = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="zpracovana_odbaveni",
    )
    vysledek = models.CharField(max_length=24, choices=Vysledek.choices, default=Vysledek.POVOLENO)
    naskenovany_kod = models.CharField(max_length=255)
    naskenovano = models.DateTimeField(auto_now_add=True)
    oznaceni_zarizeni = models.CharField(max_length=120, blank=True)

    class Meta:
        ordering = ["-naskenovano"]

    def __str__(self) -> str:
        return f"{self.vstupenka.kod} / {self.vysledek}"
