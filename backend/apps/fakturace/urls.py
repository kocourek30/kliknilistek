from rest_framework.routers import DefaultRouter

from .views import ProformaDokladViewSet

router = DefaultRouter()
router.register("proformy", ProformaDokladViewSet, basename="proformy")

urlpatterns = router.urls

