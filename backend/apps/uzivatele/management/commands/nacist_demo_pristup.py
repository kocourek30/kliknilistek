from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.organizace.models import ClenstviOrganizace, Organizace


class Command(BaseCommand):
    help = "Vytvori demo pristup do spravy a navaze ho na prvni organizaci."

    def handle(self, *args, **options):
        uzivatel_model = get_user_model()
        organizace = Organizace.objects.order_by("id").first()
        if organizace is None:
            organizace = Organizace.objects.create(
                nazev="Dolni Kralovice",
                slug="dolni-kralovice",
                typ_organizace=Organizace.TypOrganizace.OBEC,
                kontaktni_email="kultura@dolni-kralovice.cz",
                kontaktni_telefon="+420 777 123 456",
                hlavni_barva="#57C7A5",
                je_aktivni=True,
            )
        definice_uctu = [
            {
                "username": "spravce",
                "email": "spravce@kliknilistek.local",
                "role": ClenstviOrganizace.Role.SPRAVCE,
                "is_superuser": True,
            },
            {
                "username": "pokladna",
                "email": "pokladna@kliknilistek.local",
                "role": ClenstviOrganizace.Role.POKLADNA,
                "is_superuser": False,
            },
            {
                "username": "ucetni",
                "email": "ucetni@kliknilistek.local",
                "role": ClenstviOrganizace.Role.UCETNI,
                "is_superuser": False,
            },
            {
                "username": "odbaveni",
                "email": "odbaveni@kliknilistek.local",
                "role": ClenstviOrganizace.Role.ODBAVENI,
                "is_superuser": False,
            },
        ]

        for definice in definice_uctu:
            uzivatel, _ = uzivatel_model.objects.get_or_create(
                username=definice["username"],
                defaults={
                    "email": definice["email"],
                    "is_staff": True,
                    "is_superuser": definice["is_superuser"],
                },
            )
            uzivatel.set_password("kliknilistek123")
            uzivatel.email = definice["email"]
            uzivatel.is_staff = True
            uzivatel.is_superuser = definice["is_superuser"]
            uzivatel.save(update_fields=["password", "email", "is_staff", "is_superuser"])

            ClenstviOrganizace.objects.update_or_create(
                organizace=organizace,
                uzivatel=uzivatel,
                role=definice["role"],
                defaults={"je_aktivni": True},
            )

        self.stdout.write(
            self.style.SUCCESS(f"Demo uzivatele spravy byli pripraveny pro organizaci {organizace.nazev}.")
        )
