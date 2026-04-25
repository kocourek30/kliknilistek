from rest_framework.routers import DefaultRouter

from .views import ObjednavkaViewSet

router = DefaultRouter()
router.register("", ObjednavkaViewSet, basename="objednavky")

urlpatterns = router.urls
