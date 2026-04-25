from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.jadro.permissions import MuzeVidetFinance
from apps.organizace.tenant import filtruj_queryset_podle_pristupu
from .models import Objednavka
from .serializery import (
    ObjednavkaSerializer,
    PokladniProdejSerializer,
    PotvrzeniHotovostiSerializer,
    StornoObjednavkySerializer,
    VraceniObjednavkySerializer,
    VytvoreniObjednavkySerializer,
)
from .sluzby import (
    presadit_vstupenku,
    prohodit_mista_objednavky,
    potvrdit_hotovost_objednavky,
    stornovat_objednavku,
    vratit_objednavku,
    zneplatni_propadlou_objednavku,
)


class ObjednavkaViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = (
        Objednavka.objects.prefetch_related(
            "polozky",
            "platby",
            "emailove_zasilky",
            "vstupenky__akce",
            "vstupenky__kategorie_vstupenky",
        )
        .select_related("organizace", "proforma_doklad")
        .all()
        .order_by("-vytvoreno")
    )
    serializer_class = ObjednavkaSerializer
    permission_classes = [AllowAny]
    lookup_field = "verejne_id"

    def get_permissions(self):
        if self.action in {"create", "retrieve"}:
            return [AllowAny()]
        return [MuzeVidetFinance()]

    def get_queryset(self):
        queryset = (
            Objednavka.objects.prefetch_related(
                "polozky",
                "platby",
                "emailove_zasilky",
                "vstupenky__akce",
                "vstupenky__kategorie_vstupenky",
            )
            .select_related("organizace", "proforma_doklad")
            .all()
            .order_by("-vytvoreno")
        )
        queryset = filtruj_queryset_podle_pristupu(queryset, self.request)
        if self.action not in {"create", "retrieve"} and not self.request.user.is_superuser:
            return queryset
        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return VytvoreniObjednavkySerializer
        return ObjednavkaSerializer

    def get_object(self):
        objednavka = super().get_object()
        return zneplatni_propadlou_objednavku(objednavka)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        objednavka = serializer.save()
        vystup = ObjednavkaSerializer(objednavka, context=self.get_serializer_context())
        headers = self.get_success_headers(vystup.data)
        return Response(vystup.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=["post"], url_path="potvrdit-hotovost")
    def potvrdit_hotovost(self, request, verejne_id=None):
        objednavka = self.get_object()
        serializer = PotvrzeniHotovostiSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        try:
            potvrdit_hotovost_objednavky(
                objednavka,
                uzivatel=request.user,
                odeslat_na_email=serializer.validated_data["odeslat_na_email"],
            )
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        objednavka.refresh_from_db()
        return Response(ObjednavkaSerializer(objednavka, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="storno")
    def storno(self, request, verejne_id=None):
        objednavka = self.get_object()
        serializer = StornoObjednavkySerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        try:
            stornovat_objednavku(
                objednavka,
                uzivatel=request.user,
                duvod=serializer.validated_data.get("duvod", ""),
            )
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        objednavka.refresh_from_db()
        return Response(ObjednavkaSerializer(objednavka, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="vratit")
    def vratit(self, request, verejne_id=None):
        objednavka = self.get_object()
        serializer = VraceniObjednavkySerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        try:
            vratit_objednavku(
                objednavka,
                uzivatel=request.user,
                duvod=serializer.validated_data.get("duvod", ""),
            )
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        objednavka.refresh_from_db()
        return Response(ObjednavkaSerializer(objednavka, context={"request": request}).data)

    @action(detail=False, methods=["post"], url_path="pokladna-prodej")
    def pokladna_prodej(self, request):
        serializer = PokladniProdejSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        objednavka = serializer.save()
        potvrdit_hotovost_objednavky(
            objednavka,
            uzivatel=request.user,
            odeslat_na_email=serializer.validated_data.get("odeslat_na_email", False),
        )
        objednavka.refresh_from_db()
        return Response(
            ObjednavkaSerializer(objednavka, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="presadit")
    def presadit(self, request, verejne_id=None):
        objednavka = self.get_object()
        try:
            presadit_vstupenku(
                objednavka,
                vstupenka_kod=(request.data or {}).get("vstupenka_kod", ""),
                nove_misto=(request.data or {}).get("nove_misto", ""),
                uzivatel=request.user,
            )
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        objednavka.refresh_from_db()
        return Response(ObjednavkaSerializer(objednavka, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="prohodit-mista")
    def prohodit_mista(self, request, verejne_id=None):
        objednavka = self.get_object()
        try:
            prohodit_mista_objednavky(
                objednavka,
                vstupenka_kod_a=(request.data or {}).get("vstupenka_kod_a", ""),
                vstupenka_kod_b=(request.data or {}).get("vstupenka_kod_b", ""),
                uzivatel=request.user,
            )
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        objednavka.refresh_from_db()
        return Response(ObjednavkaSerializer(objednavka, context={"request": request}).data)
