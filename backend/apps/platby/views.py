from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.jadro.permissions import MuzeVidetFinance
from apps.objednavky.models import Objednavka
from apps.objednavky.serializery import ObjednavkaSerializer

from .models import Platba
from .serializery import PlatbaSerializer, SimulacePlatbySerializer
from .sluzby import simulovat_uspesnou_platbu


class PlatbaViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Platba.objects.select_related("objednavka", "organizace").all().order_by("-vytvoreno")
    serializer_class = PlatbaSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.action == "simulace":
            return [AllowAny()]
        return [MuzeVidetFinance()]

    def get_queryset(self):
        queryset = Platba.objects.select_related("objednavka", "organizace").all().order_by("-vytvoreno")
        if not self.request.user.is_superuser:
            queryset = queryset.filter(
                organizace_id__in=self.request.user.clenstvi_organizaci.filter(je_aktivni=True).values_list(
                    "organizace_id",
                    flat=True,
                )
            )
        return queryset

    @action(detail=False, methods=["post"], url_path="simulace/(?P<verejne_id>[^/.]+)")
    def simulace(self, request, verejne_id=None):
        serializer = SimulacePlatbySerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)

        objednavka = Objednavka.objects.prefetch_related("vstupenky__akce", "vstupenky__kategorie_vstupenky").get(
            verejne_id=verejne_id
        )

        try:
            simulovat_uspesnou_platbu(
                objednavka=objednavka,
                poskytovatel=serializer.validated_data["poskytovatel"],
            )
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        objednavka.refresh_from_db()
        vystup = ObjednavkaSerializer(objednavka, context={"request": request})
        return Response(vystup.data, status=status.HTTP_200_OK)
