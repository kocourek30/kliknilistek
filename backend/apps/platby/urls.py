from rest_framework.routers import DefaultRouter

from .views import PlatbaViewSet

router = DefaultRouter()
router.register("", PlatbaViewSet, basename="platby")

urlpatterns = router.urls
