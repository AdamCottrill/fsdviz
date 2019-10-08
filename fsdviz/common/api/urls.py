"""urls for the api for our common models"""

from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (
    AgencyViewSet,
    SpeciesViewSet,
    JurisdictionViewSet,
    CwtViewSet,
    StateProvinceViewSet,
    LakeViewSet,
    ManagementUnitViewSet,
    StrainSpeciesViewSet,
    StrainRawViewSet,
    Grid10ViewSet,
    LatLonFlagViewSet,
    MarkViewSet,
    CommonLookUpsAPIView,
    get_lake_from_pt,
    get_jurisdiction_from_pt,
    get_management_unit_from_pt,
    get_grid10_from_pt,
)

app_name = "common"

router = SimpleRouter()

router.register("lake", LakeViewSet)
router.register("agency", AgencyViewSet)
router.register("jurisdiction", JurisdictionViewSet)
router.register("management_unit", ManagementUnitViewSet)
router.register("state_province", StateProvinceViewSet)
router.register("grid10", Grid10ViewSet)
router.register("latlonflag", LatLonFlagViewSet)
router.register("mark", MarkViewSet)
router.register("species", SpeciesViewSet)
router.register("strain", StrainSpeciesViewSet)
router.register("strainraw", StrainRawViewSet)
router.register("cwt", CwtViewSet)

urlpatterns = router.urls

urlpatterns += [
    path("lookups/", CommonLookUpsAPIView.as_view(), name="api-get-common-lookups"),
    path("spatial_lookup/lake/", get_lake_from_pt, name="api-lookup-lake-from-pt"),
    path(
        "spatial_lookup/jurisdiction/",
        get_jurisdiction_from_pt,
        name="api-lookup-jurisdiction-from-pt",
    ),
    path(
        "spatial_lookup/management_unit/",
        get_management_unit_from_pt,
        name="api-lookup-management-unit-from-pt",
    ),
    path(
        "spatial_lookup/grid10/", get_grid10_from_pt, name="api-lookup-grid10-from-pt"
    ),
]

# urlpatterns = [

#     path('species/', SpeciesAPI.as_view()),
#     path('agency/', AgencyAPI.as_view()),
#     path('jurisdiction/', JurisdictionAPI.as_view()),
#     path('lake/', LakeAPI.as_view()),
#     path('state_province/', StateProvinceAPI.as_view()),
#     path('cwt/', CwtAPI.as_view()),
#     path('management_unit/', ManagementUnitAPI.as_view()),

# ]
