from __future__ import annotations

from dataclasses import dataclass

from django.conf import settings

from .models import Organizace


CENTRALNI_HOSTY = {
    "localhost",
    "127.0.0.1",
    "::1",
}


@dataclass(frozen=True)
class TenantKontext:
    host: str
    je_centralni: bool
    organizace: Organizace | None


def ocisti_host(host: str | None) -> str:
    if not host:
        return ""
    return host.split(":", 1)[0].strip().lower()


def ziskej_host_z_requestu(request) -> str:
    return ocisti_host(
        request.headers.get("X-Tenant-Host")
        or request.headers.get("X-Forwarded-Host")
        or request.get_host()
    )


def rozpoznej_tenant_z_hostu(host: str | None) -> TenantKontext:
    cisty_host = ocisti_host(host)
    zakladni_domena = ocisti_host(getattr(settings, "KLIKNILISTEK_BASE_DOMAIN", "kliknilistek.online"))

    if not cisty_host or cisty_host in CENTRALNI_HOSTY or cisty_host == zakladni_domena:
        return TenantKontext(host=cisty_host, je_centralni=True, organizace=None)

    organizace = (
        Organizace.objects.filter(tenant_aktivni=True, vlastni_domena__iexact=cisty_host).first()
    )
    if organizace:
        return TenantKontext(host=cisty_host, je_centralni=False, organizace=organizace)

    if zakladni_domena and cisty_host.endswith(f".{zakladni_domena}"):
        subdomena = cisty_host[: -(len(zakladni_domena) + 1)]
        if subdomena and "." not in subdomena:
            organizace = (
                Organizace.objects.filter(tenant_aktivni=True, slug_subdomeny__iexact=subdomena).first()
            )
            if organizace:
                return TenantKontext(host=cisty_host, je_centralni=False, organizace=organizace)

    return TenantKontext(host=cisty_host, je_centralni=True, organizace=None)


def filtruj_queryset_podle_tenanta(queryset, request):
    tenant_organizace = getattr(request, "tenant_organizace", None)
    if tenant_organizace is None:
        return queryset
    return queryset.filter(organizace=tenant_organizace)


def ziskej_ids_organizaci_uzivatele(request) -> list[int] | None:
    uzivatel = getattr(request, "user", None)
    if not uzivatel or not uzivatel.is_authenticated or uzivatel.is_superuser:
        return None
    return list(
        uzivatel.clenstvi_organizaci.filter(je_aktivni=True).values_list("organizace_id", flat=True)
    )


def filtruj_queryset_podle_pristupu(queryset, request, pole_organizace: str = "organizace"):
    tenant_organizace = getattr(request, "tenant_organizace", None)
    if tenant_organizace is not None:
        return queryset.filter(**{pole_organizace: tenant_organizace})

    organizace_ids = ziskej_ids_organizaci_uzivatele(request)
    if organizace_ids is None:
        return queryset

    return queryset.filter(**{f"{pole_organizace}_id__in": organizace_ids})
