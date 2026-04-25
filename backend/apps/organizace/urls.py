from rest_framework.routers import DefaultRouter

from .views import ClenstviOrganizaceViewSet, OrganizaceViewSet

router = DefaultRouter()
router.register("clenstvi", ClenstviOrganizaceViewSet, basename="clenstvi-organizace")
router.register("", OrganizaceViewSet, basename="organizace")

urlpatterns = router.urls
