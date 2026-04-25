from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def koren_api(request):
    return Response(
        {
            "nazev": "KlikniListek API",
            "verze": "0.1.0",
            "moduly": [
                "organizace",
                "akce",
                "objednavky",
                "platby",
                "vstupenky",
                "odbaveni",
                "prehledy",
            ],
            "dostupne_cesty": {
                "organizace": "/api/organizace/",
                "clenstvi_organizace": "/api/organizace/clenstvi/",
                "akce": "/api/akce/",
                "mista_konani": "/api/akce/mista-konani/",
                "kategorie_vstupenek": "/api/akce/kategorie-vstupenek/",
            },
        }
    )
