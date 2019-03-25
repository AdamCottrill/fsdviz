"""urls for the api for our common models"""

from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (AgencyViewSet, SpeciesViewSet, JurisdictionViewSet,
                    CwtViewSet, StateProvinceViewSet, LakeViewSet,
                    ManagementUnitViewSet)

router = SimpleRouter()

router.register('species', SpeciesViewSet, basename='species')
router.register('agency', AgencyViewSet, basename='agencies')
router.register('jurisdiction', JurisdictionViewSet, basename='jurisdictions')
router.register('lake', LakeViewSet, basename='lakes')
router.register(
    'state_province', StateProvinceViewSet, basename='state_provinces')
router.register('cwt', CwtViewSet, basename='cwts')
router.register(
    'management_unit', ManagementUnitViewSet, basename='management_units')


urlpatterns = router.urls

# urlpatterns = [

#     path('species/', SpeciesAPI.as_view()),
#     path('agency/', AgencyAPI.as_view()),
#     path('jurisdiction/', JurisdictionAPI.as_view()),
#     path('lake/', LakeAPI.as_view()),
#     path('state_province/', StateProvinceAPI.as_view()),
#     path('cwt/', CwtAPI.as_view()),
#     path('management_unit/', ManagementUnitAPI.as_view()),

# ]
