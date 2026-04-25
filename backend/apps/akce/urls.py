from rest_framework.routers import DefaultRouter

from .views import AkceViewSet, KategorieVstupenkyViewSet, MistoKonaniViewSet

router = DefaultRouter()
router.register("mista-konani", MistoKonaniViewSet, basename="mista-konani")
router.register("kategorie-vstupenek", KategorieVstupenkyViewSet, basename="kategorie-vstupenek")
router.register("", AkceViewSet, basename="akce")

urlpatterns = router.urls
