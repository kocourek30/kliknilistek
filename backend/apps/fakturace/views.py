from django.http import HttpResponse
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.jadro.permissions import MuzeVidetFinance

from .models import ProformaDoklad
from .serializery import ProformaDokladSerializer
from .sluzby import oznac_proformu_jako_zaplacenou, vytvor_pdf_proformy


class ProformaDokladViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = ProformaDoklad.objects.select_related("objednavka", "organizace").all().order_by("-vytvoreno")
    serializer_class = ProformaDokladSerializer
    permission_classes = [MuzeVidetFinance]
    lookup_field = "cislo_dokladu"

    def get_permissions(self):
        if self.action == "verejne_pdf":
            return [AllowAny()]
        return [MuzeVidetFinance()]

    def get_queryset(self):
        queryset = ProformaDoklad.objects.select_related("objednavka", "organizace").all().order_by("-vytvoreno")
        if not self.request.user.is_authenticated or self.request.user.is_superuser:
            return queryset
        return queryset.filter(
            organizace_id__in=self.request.user.clenstvi_organizaci.filter(je_aktivni=True).values_list(
                "organizace_id",
                flat=True,
            )
        )

    @action(detail=True, methods=["post"], url_path="oznacit-jako-zaplacene")
    def oznacit_jako_zaplacene(self, request, cislo_dokladu=None):
        proforma = self.get_object()
        try:
            oznac_proformu_jako_zaplacenou(proforma, uzivatel=request.user)
        except ValueError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        proforma.refresh_from_db()
        return Response(ProformaDokladSerializer(proforma, context={"request": request}).data)

    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, cislo_dokladu=None):
        proforma = self.get_object()
        return self._vrat_pdf(proforma)

    @action(detail=False, methods=["get"], url_path="objednavka/(?P<verejne_id>[^/.]+)/pdf")
    def verejne_pdf(self, request, verejne_id=None):
        proforma = (
            ProformaDoklad.objects.select_related("objednavka", "organizace")
            .filter(objednavka__verejne_id=verejne_id)
            .first()
        )
        if not proforma:
            return Response({"detail": "Proforma nebyla nalezena."}, status=status.HTTP_404_NOT_FOUND)
        return self._vrat_pdf(proforma)

    def _vrat_pdf(self, proforma: ProformaDoklad):
        obsah = vytvor_pdf_proformy(proforma)
        odpoved = HttpResponse(obsah, content_type="application/pdf")
        odpoved["Content-Disposition"] = f'inline; filename="proforma-{proforma.cislo_dokladu}.pdf"'
        return odpoved

