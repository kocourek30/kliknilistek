from django.urls import path

from .views import PrehledSpravyView


urlpatterns = [
    path("", PrehledSpravyView.as_view(), name="prehled-spravy"),
]
