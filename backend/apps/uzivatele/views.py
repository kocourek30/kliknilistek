from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.jadro.permissions import uzivatel_je_superuser, ziskej_opravneni_uzivatele


class ProfilSpravyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        clenstvi = list(
            request.user.clenstvi_organizaci.select_related("organizace")
            .filter(je_aktivni=True)
            .values(
                "organizace_id",
                "organizace__nazev",
                "role",
            )
        )
        return Response(
            {
                "uzivatel": request.user.get_username(),
                "je_spravce": uzivatel_je_superuser(request.user)
                or any(polozka["role"] in {"vlastnik", "spravce"} for polozka in clenstvi),
                "ma_pristup_do_spravy": uzivatel_je_superuser(request.user)
                or any(True for _ in clenstvi),
                "opravneni": ziskej_opravneni_uzivatele(request.user),
                "clenstvi": [
                    {
                        "organizace_id": polozka["organizace_id"],
                        "organizace_nazev": polozka["organizace__nazev"],
                        "role": polozka["role"],
                    }
                    for polozka in clenstvi
                ],
            }
        )
