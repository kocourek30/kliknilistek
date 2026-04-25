from django.urls import include, path

from .views import NastaveniSystemuView, TestSmtpView, koren_api, tenant_kontext_api


urlpatterns = [
    path("", koren_api, name="koren-api"),
    path("tenant-kontekst/", tenant_kontext_api, name="tenant-kontekst"),
    path("nastaveni-systemu/", NastaveniSystemuView.as_view(), name="nastaveni-systemu"),
    path("nastaveni-systemu/test-smtp/", TestSmtpView.as_view(), name="test-smtp"),
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
