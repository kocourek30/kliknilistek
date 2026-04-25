from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.jadro.models import ModelOrganizace


class ProformaDoklad(ModelOrganizace):
    class Stav(models.TextChoices):
        VYSTAVENO = "vystaveno", "Vystaveno"
        ZAPLACENO = "zaplaceno", "Zaplaceno"
        STORNO = "storno", "Storno"

    objednavka = models.OneToOneField(
        "objednavky.Objednavka",
        on_delete=models.CASCADE,
        related_name="proforma_doklad",
    )
    cislo_dokladu = models.CharField(max_length=32, unique=True)
    variabilni_symbol = models.CharField(max_length=20)
    specificky_symbol = models.CharField(max_length=20, blank=True)
    datum_vystaveni = models.DateField(default=timezone.localdate)
    datum_splatnosti = models.DateField()
    castka = models.DecimalField(max_digits=10, decimal_places=2)
    mena = models.CharField(max_length=3, default="CZK")
    stav = models.CharField(max_length=24, choices=Stav.choices, default=Stav.VYSTAVENO)
    qr_platba_data = models.TextField(blank=True)
    zprava_pro_prijemce = models.CharField(max_length=255, blank=True)
    poznamka = models.TextField(blank=True)
    uhrazeno_v = models.DateTimeField(null=True, blank=True)
    potvrzeno_uzivatelem = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="potvrzene_proformy",
    )

    class Meta:
        ordering = ["-vytvoreno"]

    def __str__(self) -> str:
        return self.cislo_dokladu

