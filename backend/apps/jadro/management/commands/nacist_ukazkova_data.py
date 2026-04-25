from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.akce.models import Akce, KategorieVstupenky, MistoKonani
from apps.organizace.models import Organizace


class Command(BaseCommand):
    help = "Vytvori nebo aktualizuje ukazkova data pro pilotni instanci KlikniListek."

    def handle(self, *args, **options):
        organizace, _ = Organizace.objects.update_or_create(
            slug="dolni-kralovice",
            defaults={
                "nazev": "Dolni Kralovice",
                "typ_organizace": Organizace.TypOrganizace.OBEC,
                "kontaktni_email": "kultura@dolni-kralovice.cz",
                "kontaktni_telefon": "+420 777 123 456",
                "hlavni_barva": "#57C7A5",
                "je_aktivni": True,
            },
        )

        misto_konani, _ = MistoKonani.objects.update_or_create(
            organizace=organizace,
            nazev="Kulturni dum Dolni Kralovice",
            defaults={
                "adresa": "Namesti 12",
                "mesto": "Dolni Kralovice",
                "kapacita": 320,
            },
        )

        zacatek_prvni_akce = timezone.now() + timedelta(days=14, hours=2)
        akce, _ = Akce.objects.update_or_create(
            organizace=organizace,
            slug="jarni-koncert-2026",
            defaults={
                "nazev": "Jarni koncert v kulturnim dome",
                "popis": "Večerni koncert mistnich souboru a hostu.",
                "misto_konani": misto_konani,
                "zacatek": zacatek_prvni_akce,
                "konec": zacatek_prvni_akce + timedelta(hours=3),
                "stav": Akce.Stav.ZVEREJNENO,
                "kapacita": 320,
                "je_doporucena": True,
            },
        )

        KategorieVstupenky.objects.update_or_create(
            organizace=organizace,
            akce=akce,
            nazev="Zakladni vstupenka",
            defaults={
                "popis": "Standardni vstup na celou akci.",
                "cena": "180.00",
                "mena": "CZK",
                "kapacita": 260,
                "prodej_od": timezone.now(),
                "prodej_do": zacatek_prvni_akce - timedelta(hours=2),
                "je_aktivni": True,
            },
        )

        KategorieVstupenky.objects.update_or_create(
            organizace=organizace,
            akce=akce,
            nazev="Zvyhodnena vstupenka",
            defaults={
                "popis": "Studenti a seniori.",
                "cena": "120.00",
                "mena": "CZK",
                "kapacita": 60,
                "prodej_od": timezone.now(),
                "prodej_do": zacatek_prvni_akce - timedelta(hours=2),
                "je_aktivni": True,
            },
        )

        self.stdout.write(
            self.style.SUCCESS(
                "Ukazkova data jsou pripravena: organizace Dolni Kralovice, misto konani, akce a kategorie vstupenek."
            )
        )
