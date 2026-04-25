from rest_framework import viewsets

from apps.jadro.permissions import MuzeSpravovatObsah, MuzeVidetSpravuObsahu
from apps.organizace.tenant import filtruj_queryset_podle_pristupu
from .models import ClenstviOrganizace, Organizace
from .serializery import ClenstviOrganizaceSerializer, OrganizaceSerializer


class OrganizaceViewSet(viewsets.ModelViewSet):
    queryset = Organizace.objects.all().order_by("nazev")
    serializer_class = OrganizaceSerializer
    permission_classes = [MuzeSpravovatObsah]
    lookup_field = "slug"

    def get_queryset(self):
        queryset = Organizace.objects.all().order_by("nazev")
        tenant_organizace = getattr(self.request, "tenant_organizace", None)
        if tenant_organizace is not None:
            return queryset.filter(pk=tenant_organizace.pk)
        if self.request.user.is_superuser:
            return queryset
        return queryset.filter(
            pk__in=self.request.user.clenstvi_organizaci.filter(je_aktivni=True).values_list(
                "organizace_id",
                flat=True,
            )
        )


class ClenstviOrganizaceViewSet(viewsets.ModelViewSet):
    queryset = ClenstviOrganizace.objects.select_related("organizace", "uzivatel").all()
    serializer_class = ClenstviOrganizaceSerializer
    permission_classes = [MuzeVidetSpravuObsahu]

    def get_queryset(self):
        queryset = ClenstviOrganizace.objects.select_related("organizace", "uzivatel").all().order_by(
            "organizace__nazev",
            "uzivatel__username",
        )
        return filtruj_queryset_podle_pristupu(queryset, self.request)

    def get_permissions(self):
        if self.request.method == "GET":
            return [MuzeVidetSpravuObsahu()]
        return [MuzeSpravovatObsah()]
