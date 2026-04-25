from rest_framework.routers import DefaultRouter

from .views import OdbaveniViewSet

router = DefaultRouter()
router.register("", OdbaveniViewSet, basename="odbaveni")

urlpatterns = router.urls
