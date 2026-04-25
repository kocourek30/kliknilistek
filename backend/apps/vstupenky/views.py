from django.http import HttpResponse
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.jadro.permissions import MuzeVidetFinance
from apps.organizace.tenant import filtruj_queryset_podle_pristupu
from apps.objednavky.models import Objednavka
from apps.objednavky.serializery import ObjednavkaSerializer

from .models import Vstupenka
from .serializery import VstupenkaSerializer
from .sluzby import odeslat_vstupenky_objednavky, vytvor_pdf_vstupenky


class VstupenkaViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = VstupenkaSerializer
    permission_classes = [AllowAny]
    lookup_field = "kod"

    def get_permissions(self):
        if self.action in {"retrieve", "pdf"}:
            return [AllowAny()]
        return [MuzeVidetFinance()]

    def get_queryset(self):
        queryset = (
            Vstupenka.objects.select_related("akce", "kategorie_vstupenky", "objednavka")
            .all()
            .order_by("id")
        )
        if self.action == "list":
            queryset = filtruj_queryset_podle_pristupu(queryset, self.request)
        objednavka_id = self.request.query_params.get("objednavka")
        if objednavka_id:
            queryset = queryset.filter(objednavka__verejne_id=objednavka_id)
        return queryset

    @action(detail=False, methods=["post"], url_path="dorucit-objednavku/(?P<verejne_id>[^/.]+)")
    def dorucit_objednavku(self, request, verejne_id=None):
        objednavka = Objednavka.objects.prefetch_related(
            "platby",
            "emailove_zasilky",
            "vstupenky__akce",
            "vstupenky__kategorie_vstupenky",
        ).get(verejne_id=verejne_id)
        if not request.user.is_superuser and not request.user.clenstvi_organizaci.filter(
            organizace_id=objednavka.organizace_id,
            je_aktivni=True,
        ).exists():
            return Response({"detail": "K objednavce nemas pristup."}, status=status.HTTP_403_FORBIDDEN)

        try:
            odeslat_vstupenky_objednavky(objednavka)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        objednavka.refresh_from_db()
        serializer = ObjednavkaSerializer(objednavka, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, kod=None):
        vstupenka = self.get_object()
        pdf = vytvor_pdf_vstupenky(vstupenka)
        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="vstupenka-{vstupenka.kod}.pdf"'
        return response
