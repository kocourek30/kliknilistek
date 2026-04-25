from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.jadro.permissions import MuzeSpravovatObsah
from .models import Akce, KategorieVstupenky, MistoKonani
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


class AkceViewSet(viewsets.ModelViewSet):
    queryset = Akce.objects.select_related("organizace", "misto_konani").all().order_by("zacatek")
    serializer_class = AkceSerializer
    permission_classes = [MuzeSpravovatObsah]
    lookup_field = "slug"

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
