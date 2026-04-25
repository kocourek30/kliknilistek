from django.db import models

from apps.jadro.models import ModelOrganizace


class Platba(ModelOrganizace):
    class Poskytovatel(models.TextChoices):
        GOPAY = "gopay", "GoPay"
        COMGATE = "comgate", "Comgate"
        STRIPE = "stripe", "Stripe"
        BANKOVNI_PREVOD = "bankovni_prevod", "Bankovni prevod"
        HOTOVOST = "hotovost", "Hotovost"

    class Stav(models.TextChoices):
        VYTVORENO = "vytvoreno", "Vytvoreno"
        CEKA = "ceka", "Ceka"
        USPESNA = "uspesna", "Uspesna"
        NEUSPESNA = "neuspesna", "Neuspesna"
        VRACENA = "vracena", "Vracena"

    objednavka = models.ForeignKey("objednavky.Objednavka", on_delete=models.CASCADE, related_name="platby")
    poskytovatel = models.CharField(max_length=24, choices=Poskytovatel.choices)
    reference_poskytovatele = models.CharField(max_length=255, blank=True)
    stav = models.CharField(max_length=24, choices=Stav.choices, default=Stav.VYTVORENO)
    castka = models.DecimalField(max_digits=10, decimal_places=2)
    mena = models.CharField(max_length=3, default="CZK")
    data_poskytovatele = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-vytvoreno"]

    def __str__(self) -> str:
        return f"{self.objednavka.verejne_id} / {self.poskytovatel}"
