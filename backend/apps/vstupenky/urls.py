from rest_framework.routers import DefaultRouter

from .views import VstupenkaViewSet

router = DefaultRouter()
router.register("", VstupenkaViewSet, basename="vstupenky")

urlpatterns = router.urls
