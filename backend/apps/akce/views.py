from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models

from apps.jadro.permissions import MuzeSpravovatObsah
from apps.organizace.tenant import filtruj_queryset_podle_tenanta
from .models import Akce, FotkaAkce, KategorieVstupenky, MistoKonani
from .sluzby import (
    blokovat_misto_na_akci,
    odblokovat_misto_na_akci,
    prevzit_schema_mista_do_akce,
    zrusit_schema_override_akce,
)
from .serializery import AkceSerializer, KategorieVstupenkySerializer, MistoKonaniSerializer


class MistoKonaniViewSet(viewsets.ModelViewSet):
    queryset = MistoKonani.objects.select_related("organizace").all().order_by("nazev")
    serializer_class = MistoKonaniSerializer
    permission_classes = [MuzeSpravovatObsah]

    def get_queryset(self):
        queryset = MistoKonani.objects.select_related("organizace").all().order_by("nazev")
        return filtruj_queryset_podle_tenanta(queryset, self.request)


class AkceViewSet(viewsets.ModelViewSet):
    queryset = (
        Akce.objects.select_related("organizace", "misto_konani")
        .prefetch_related("fotky_galerie")
        .all()
        .order_by("zacatek")
    )
    serializer_class = AkceSerializer
    permission_classes = [MuzeSpravovatObsah]
    lookup_field = "slug"

    def get_queryset(self):
        queryset = (
            Akce.objects.select_related("organizace", "misto_konani")
            .prefetch_related("fotky_galerie")
            .all()
            .order_by("zacatek")
        )
        return filtruj_queryset_podle_tenanta(queryset, self.request)

    def _vrat_detail_akce(self, akce, request):
        akce.refresh_from_db()
        return Response(AkceSerializer(akce, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="fotky")
    def nahrat_fotky(self, request, slug=None):
        akce = self.get_object()
        soubory = request.FILES.getlist("fotky")
        if not soubory:
            return Response({"detail": "Vyber alespoň jednu fotku."}, status=status.HTTP_400_BAD_REQUEST)

        posledni_poradi = akce.fotky_galerie.aggregate(max_poradi=models.Max("poradi")).get("max_poradi") or 0
        for index, soubor in enumerate(soubory, start=1):
            FotkaAkce.objects.create(
                organizace=akce.organizace,
                akce=akce,
                soubor=soubor,
                poradi=posledni_poradi + index,
            )

        return self._vrat_detail_akce(akce, request)

    @action(detail=True, methods=["delete"], url_path=r"fotky/(?P<fotka_id>[^/.]+)")
    def smazat_fotku(self, request, slug=None, fotka_id=None):
        akce = self.get_object()
        fotka = akce.fotky_galerie.filter(id=fotka_id).first()
        if not fotka:
            return Response({"detail": "Fotka galerie nebyla nalezena."}, status=status.HTTP_404_NOT_FOUND)

        soubor = fotka.soubor
        fotka.delete()
        if soubor:
            soubor.delete(save=False)

        self._normalizuj_poradi_fotek(akce)
        return self._vrat_detail_akce(akce, request)

    @action(detail=True, methods=["patch"], url_path=r"fotky/(?P<fotka_id>[^/.]+)")
    def upravit_fotku(self, request, slug=None, fotka_id=None):
        akce = self.get_object()
        fotka = akce.fotky_galerie.filter(id=fotka_id).first()
        if not fotka:
            return Response({"detail": "Fotka galerie nebyla nalezena."}, status=status.HTTP_404_NOT_FOUND)

        popis = (request.data or {}).get("popis")
        if popis is not None:
            fotka.popis = str(popis).strip()
            fotka.save(update_fields=["popis", "upraveno"])

        return self._vrat_detail_akce(akce, request)

    @action(detail=True, methods=["post"], url_path=r"fotky/(?P<fotka_id>[^/.]+)/posunout")
    def posunout_fotku(self, request, slug=None, fotka_id=None):
        akce = self.get_object()
        fotka = akce.fotky_galerie.filter(id=fotka_id).first()
        if not fotka:
            return Response({"detail": "Fotka galerie nebyla nalezena."}, status=status.HTTP_404_NOT_FOUND)

        smer = (request.data or {}).get("smer", "")
        fotky = list(akce.fotky_galerie.all().order_by("poradi", "id"))
        index = next((idx for idx, polozka in enumerate(fotky) if polozka.id == fotka.id), None)
        if index is None:
            return Response({"detail": "Fotka galerie nebyla nalezena."}, status=status.HTTP_404_NOT_FOUND)

        if smer == "nahoru" and index > 0:
            fotky[index - 1], fotky[index] = fotky[index], fotky[index - 1]
        elif smer == "dolu" and index < len(fotky) - 1:
            fotky[index + 1], fotky[index] = fotky[index], fotky[index + 1]
        else:
            return self._vrat_detail_akce(akce, request)

        for poradi, polozka in enumerate(fotky, start=1):
            if polozka.poradi != poradi:
                polozka.poradi = poradi
                polozka.save(update_fields=["poradi", "upraveno"])

        return self._vrat_detail_akce(akce, request)

    @action(detail=True, methods=["post"], url_path=r"fotky/(?P<fotka_id>[^/.]+)/doporucit")
    def doporucit_fotku(self, request, slug=None, fotka_id=None):
        akce = self.get_object()
        fotka = akce.fotky_galerie.filter(id=fotka_id).first()
        if not fotka:
            return Response({"detail": "Fotka galerie nebyla nalezena."}, status=status.HTTP_404_NOT_FOUND)

        akce.fotky_galerie.exclude(id=fotka.id).update(je_doporucena=False)
        if not fotka.je_doporucena:
            fotka.je_doporucena = True
            fotka.save(update_fields=["je_doporucena", "upraveno"])

        return self._vrat_detail_akce(akce, request)

    @action(detail=True, methods=["post"], url_path=r"fotky/(?P<fotka_id>[^/.]+)/zrusit-doporuceni")
    def zrusit_doporuceni_fotky(self, request, slug=None, fotka_id=None):
        akce = self.get_object()
        fotka = akce.fotky_galerie.filter(id=fotka_id).first()
        if not fotka:
            return Response({"detail": "Fotka galerie nebyla nalezena."}, status=status.HTTP_404_NOT_FOUND)

        if fotka.je_doporucena:
            fotka.je_doporucena = False
            fotka.save(update_fields=["je_doporucena", "upraveno"])

        return self._vrat_detail_akce(akce, request)

    def _normalizuj_poradi_fotek(self, akce):
        for poradi, fotka in enumerate(akce.fotky_galerie.all().order_by("poradi", "id"), start=1):
            if fotka.poradi != poradi:
                fotka.poradi = poradi
                fotka.save(update_fields=["poradi", "upraveno"])

    @action(detail=True, methods=["post"], url_path="prevzit-schema-mista")
    def prevzit_schema_mista(self, request, slug=None):
        akce = self.get_object()
        prevzit_schema_mista_do_akce(akce)
        akce.refresh_from_db()
        return Response(AkceSerializer(akce, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="zrusit-schema-override")
    def zrusit_schema_override(self, request, slug=None):
        akce = self.get_object()
        zrusit_schema_override_akce(akce)
        akce.refresh_from_db()
        return Response(AkceSerializer(akce, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="blokovat-misto")
    def blokovat_misto(self, request, slug=None):
        akce = self.get_object()
        kod = (request.data or {}).get("kod", "")
        duvod = (request.data or {}).get("duvod", "")
        if not kod:
            return Response({"detail": "Kod mista je povinny."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            blokovat_misto_na_akci(akce, kod, duvod)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        akce.refresh_from_db()
        return Response(AkceSerializer(akce, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="odblokovat-misto")
    def odblokovat_misto(self, request, slug=None):
        akce = self.get_object()
        kod = (request.data or {}).get("kod", "")
        if not kod:
            return Response({"detail": "Kod mista je povinny."}, status=status.HTTP_400_BAD_REQUEST)
        odblokovat_misto_na_akci(akce, kod)
        akce.refresh_from_db()
        return Response(AkceSerializer(akce, context={"request": request}).data)


class KategorieVstupenkyViewSet(viewsets.ModelViewSet):
    queryset = (
        KategorieVstupenky.objects.select_related("organizace", "akce")
        .all()
        .order_by("akce__zacatek", "nazev")
    )
    serializer_class = KategorieVstupenkySerializer
    permission_classes = [MuzeSpravovatObsah]

    def get_queryset(self):
        queryset = (
            KategorieVstupenky.objects.select_related("organizace", "akce")
            .all()
            .order_by("akce__zacatek", "nazev")
        )
        return filtruj_queryset_podle_tenanta(queryset, self.request)
