from decimal import Decimal

from django.db.models import Count, Q, Sum
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.akce.models import Akce
from apps.jadro.permissions import JeAktivniClenOrganizace, ziskej_opravneni_uzivatele
from apps.objednavky.models import Objednavka
from apps.vstupenky.models import Vstupenka


def procento(citatel: int, jmenovatel: int) -> int:
    if not jmenovatel:
        return 0
    return round((citatel / jmenovatel) * 100)


class PrehledSpravyView(APIView):
    permission_classes = [JeAktivniClenOrganizace]

    def get_queryset_organizaci(self, request):
        if request.user.is_superuser:
            return None

        return list(
            request.user.clenstvi_organizaci.filter(je_aktivni=True).values_list("organizace_id", flat=True)
        )

    def get(self, request):
        organizace_ids = self.get_queryset_organizaci(request)

        filtr = Q()
        if organizace_ids is not None:
            filtr &= Q(organizace_id__in=organizace_ids)

        akce = Akce.objects.filter(filtr).select_related("organizace", "misto_konani")
        objednavky = Objednavka.objects.filter(filtr)
        vstupenky = Vstupenka.objects.filter(filtr)

        prodane_vstupenky_q = Q(stav__in=[Vstupenka.Stav.PLATNA, Vstupenka.Stav.ODBAVENA])
        objednavky_zaplacene_q = Q(stav=Objednavka.Stav.ZAPLACENO)

        souhrn = {
            "organizace_celkem": akce.values("organizace_id").distinct().count(),
            "akce_celkem": akce.count(),
            "akce_zverejnene": akce.filter(stav=Akce.Stav.ZVEREJNENO).count(),
            "objednavky_celkem": objednavky.count(),
            "objednavky_cekaji_na_platbu": objednavky.filter(stav=Objednavka.Stav.CEKA_NA_PLATBU).count(),
            "objednavky_zaplacene": objednavky.filter(stav=Objednavka.Stav.ZAPLACENO).count(),
            "trzby_celkem": objednavky.filter(objednavky_zaplacene_q).aggregate(
                hodnota=Sum("celkem")
            )["hodnota"]
            or Decimal("0.00"),
            "prodane_vstupenky": vstupenky.filter(prodane_vstupenky_q).count(),
            "platne_vstupenky": vstupenky.filter(stav=Vstupenka.Stav.PLATNA).count(),
            "odbavene_vstupenky": vstupenky.filter(stav=Vstupenka.Stav.ODBAVENA).count(),
            "dorucene_vstupenky": vstupenky.exclude(dorucena__isnull=True).count(),
        }

        souhrn["navstevnost_procent"] = procento(
            souhrn["odbavene_vstupenky"],
            souhrn["prodane_vstupenky"],
        )

        if not ziskej_opravneni_uzivatele(request.user)["finance"]:
            souhrn["trzby_celkem"] = Decimal("0.00")

        stavy_objednavek = [
            {"stav": zaznam["stav"], "pocet": zaznam["pocet"]}
            for zaznam in objednavky.values("stav").annotate(pocet=Count("id")).order_by("stav")
        ]

        stavy_vstupenek = [
            {"stav": zaznam["stav"], "pocet": zaznam["pocet"]}
            for zaznam in vstupenky.values("stav").annotate(pocet=Count("id")).order_by("stav")
        ]

        vykonnost_akci = []
        for polozka in akce.order_by("zacatek"):
            objednavky_akce = Objednavka.objects.filter(
                filtr,
                polozky__akce=polozka,
            ).distinct()
            vstupenky_akce = Vstupenka.objects.filter(filtr, akce=polozka)
            prodane = vstupenky_akce.filter(
                stav__in=[Vstupenka.Stav.PLATNA, Vstupenka.Stav.ODBAVENA]
            ).count()
            odbavene = vstupenky_akce.filter(stav=Vstupenka.Stav.ODBAVENA).count()
            kapacita = polozka.kapacita or 0
            vykonnost_akci.append(
                {
                    "id": polozka.id,
                    "nazev": polozka.nazev,
                    "slug": polozka.slug,
                    "stav": polozka.stav,
                    "zacatek": polozka.zacatek,
                    "misto_konani_nazev": polozka.misto_konani.nazev,
                    "kapacita": kapacita,
                    "objednavky_celkem": objednavky_akce.count(),
                    "prodane_vstupenky": prodane,
                    "platne_vstupenky": vstupenky_akce.filter(stav=Vstupenka.Stav.PLATNA).count(),
                    "odbavene_vstupenky": odbavene,
                    "dorucene_vstupenky": vstupenky_akce.exclude(dorucena__isnull=True).count(),
                    "trzby_celkem": objednavky_akce.filter(stav=Objednavka.Stav.ZAPLACENO).aggregate(
                        hodnota=Sum("polozky__cena_celkem", filter=Q(polozky__akce=polozka))
                    )["hodnota"]
                    or Decimal("0.00"),
                    "obsazenost_procent": procento(prodane, kapacita),
                    "navstevnost_procent": procento(odbavene, prodane),
                }
            )

        if not ziskej_opravneni_uzivatele(request.user)["finance"]:
            for polozka in vykonnost_akci:
                polozka["trzby_celkem"] = Decimal("0.00")

        return Response(
            {
                "souhrn": souhrn,
                "stavy_objednavek": stavy_objednavek,
                "stavy_vstupenek": stavy_vstupenek,
                "vykonnost_akci": vykonnost_akci,
            }
        )
