from django.urls import include, path

from .views import koren_api


urlpatterns = [
    path("", koren_api, name="koren-api"),
    path("uzivatele/", include("apps.uzivatele.urls")),
    path("organizace/", include("apps.organizace.urls")),
    path("akce/", include("apps.akce.urls")),
    path("objednavky/", include("apps.objednavky.urls")),
    path("platby/", include("apps.platby.urls")),
    path("fakturace/", include("apps.fakturace.urls")),
    path("vstupenky/", include("apps.vstupenky.urls")),
    path("odbaveni/", include("apps.odbaveni.urls")),
    path("prehledy/", include("apps.prehledy.urls")),
]
