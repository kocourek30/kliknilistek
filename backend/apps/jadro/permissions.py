from rest_framework.permissions import SAFE_METHODS, BasePermission


ROLE_SPRAVA_OBSAHU = {"vlastnik", "spravce"}
ROLE_FINANCE = {"vlastnik", "spravce", "pokladna", "ucetni"}
ROLE_ODBAVENI = {"vlastnik", "spravce", "odbaveni"}


def uzivatel_ma_aktivni_clenstvi(uzivatel) -> bool:
    return bool(
        uzivatel
        and uzivatel.is_authenticated
        and uzivatel.clenstvi_organizaci.filter(je_aktivni=True).exists()
    )


def uzivatel_ma_roli(uzivatel, role: set[str]) -> bool:
    return bool(
        uzivatel
        and uzivatel.is_authenticated
        and uzivatel.clenstvi_organizaci.filter(
            je_aktivni=True,
            role__in=role,
        ).exists()
    )


def ziskej_opravneni_uzivatele(uzivatel) -> dict[str, bool]:
    if not uzivatel_ma_aktivni_clenstvi(uzivatel):
        return {
            "sprava": False,
            "sprava_obsahu": False,
            "finance": False,
            "odbaveni": False,
            "prehled": False,
        }

    return {
        "sprava": True,
        "sprava_obsahu": uzivatel_ma_roli(uzivatel, ROLE_SPRAVA_OBSAHU),
        "finance": uzivatel_ma_roli(uzivatel, ROLE_FINANCE),
        "odbaveni": uzivatel_ma_roli(uzivatel, ROLE_ODBAVENI),
        "prehled": True,
    }


class JeAktivniClenOrganizace(BasePermission):
    def has_permission(self, request, view):
        return uzivatel_ma_aktivni_clenstvi(request.user)


class MuzeSpravovatObsah(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return uzivatel_ma_roli(request.user, ROLE_SPRAVA_OBSAHU)


class MuzeVidetSpravuObsahu(BasePermission):
    def has_permission(self, request, view):
        return uzivatel_ma_roli(request.user, ROLE_SPRAVA_OBSAHU)


class MuzeVidetFinance(BasePermission):
    def has_permission(self, request, view):
        return uzivatel_ma_roli(request.user, ROLE_FINANCE)


class MuzeOdbavovat(BasePermission):
    def has_permission(self, request, view):
        return uzivatel_ma_roli(request.user, ROLE_ODBAVENI)
