from django.urls import path

from .views import ProfilSpravyView


urlpatterns = [
    path("profil/", ProfilSpravyView.as_view(), name="profil-spravy"),
]
