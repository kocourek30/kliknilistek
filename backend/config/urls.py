from django.contrib import admin
from django.shortcuts import redirect
from django.http import JsonResponse
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

admin.site.site_header = "KlikniListek Sprava"
admin.site.site_title = "KlikniListek Sprava"
admin.site.index_title = "Provozni administrace"


def health(_: object) -> JsonResponse:
    return JsonResponse({"status": "ok", "service": "backend"})


def frontend_presmerovani(_: object):
    return redirect("http://127.0.0.1:3001/", permanent=False)


urlpatterns = [
    path("", frontend_presmerovani, name="frontend-presmerovani"),
    path("admin/", admin.site.urls),
    path("health/", health, name="health"),
    path("api/", include("apps.jadro.api_urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
