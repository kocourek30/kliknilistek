from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.jadro.permissions import MuzeOdbavovat
from .models import Odbaveni
from .serializery import OdbaveniSerializer, ScanVstupenkySerializer
from .sluzby import zpracuj_odbaveni


class OdbaveniViewSet(
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Odbaveni.objects.select_related("vstupenka", "akce").all().order_by("-naskenovano")
    serializer_class = OdbaveniSerializer
    permission_classes = [MuzeOdbavovat]

    def get_queryset(self):
        queryset = Odbaveni.objects.select_related("vstupenka", "akce").all().order_by("-naskenovano")
        if not self.request.user.is_superuser:
            queryset = queryset.filter(
                organizace_id__in=self.request.user.clenstvi_organizaci.filter(je_aktivni=True).values_list(
                    "organizace_id",
                    flat=True,
                )
            )
        return queryset

    @action(detail=False, methods=["post"], url_path="scan")
    def scan(self, request):
        serializer = ScanVstupenkySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        vysledek = zpracuj_odbaveni(
            kod=serializer.validated_data["kod"],
            oznaceni_zarizeni=serializer.validated_data.get("oznaceni_zarizeni", ""),
        )

        return Response(
            {
                "vysledek": vysledek["vysledek"],
                "stav_vstupenky": vysledek["stav_vstupenky"],
                "zprava": vysledek["zprava"],
                "vstupenka": (
                    {
                        "kod": vysledek["vstupenka"].kod,
                        "akce_nazev": vysledek["vstupenka"].akce.nazev,
                        "kategorie_vstupenky_nazev": vysledek["vstupenka"].kategorie_vstupenky.nazev,
                    }
                    if vysledek["vstupenka"] is not None
                    else None
                ),
            },
            status=status.HTTP_200_OK,
        )
