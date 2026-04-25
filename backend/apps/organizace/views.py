from rest_framework import viewsets

from apps.jadro.permissions import MuzeSpravovatObsah, MuzeVidetSpravuObsahu
from .models import ClenstviOrganizace, Organizace
from .serializery import ClenstviOrganizaceSerializer, OrganizaceSerializer


class OrganizaceViewSet(viewsets.ModelViewSet):
    queryset = Organizace.objects.all().order_by("nazev")
    serializer_class = OrganizaceSerializer
    permission_classes = [MuzeSpravovatObsah]
    lookup_field = "slug"


class ClenstviOrganizaceViewSet(viewsets.ModelViewSet):
    queryset = ClenstviOrganizace.objects.select_related("organizace", "uzivatel").all()
    serializer_class = ClenstviOrganizaceSerializer
    permission_classes = [MuzeVidetSpravuObsahu]

    def get_queryset(self):
        queryset = ClenstviOrganizace.objects.select_related("organizace", "uzivatel").all().order_by(
            "organizace__nazev",
            "uzivatel__username",
        )
        if not self.request.user.is_superuser:
            queryset = queryset.filter(
                organizace_id__in=self.request.user.clenstvi_organizaci.filter(je_aktivni=True).values_list(
                    "organizace_id",
                    flat=True,
                )
            )
        return queryset

    def get_permissions(self):
        if self.request.method == "GET":
            return [MuzeVidetSpravuObsahu()]
        return [MuzeSpravovatObsah()]
