"""urls for the api for our common models"""

from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (
    AgencyViewSet,
    CommonLookUpsAPIView,
    CompositeFinClipViewSet,
    CwtViewSet,
    FishTagViewSet,
    Grid10ViewSet,
    JurisdictionViewSet,
    LakeViewSet,
    LatLonFlagViewSet,
    ManagementUnitViewSet,
    MarkViewSet,
    PhysChemMarkViewSet,
    SpeciesViewSet,
    StateProvinceViewSet,
    StrainAliasViewSet,
    StrainSpeciesViewSet,
    get_grid10_from_pt,
    get_jurisdiction_from_pt,
    get_lake_from_pt,
    get_management_unit_from_pt,
    pt_spatial_attrs,
    roi_spatial_attrs,
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
router.register("composite_finclip", CompositeFinClipViewSet)
router.register("physchemmark", PhysChemMarkViewSet)
router.register("mark", MarkViewSet)
router.register("fishtag", FishTagViewSet)
router.register("species", SpeciesViewSet)
router.register("strain", StrainSpeciesViewSet)
router.register("strain_alias", StrainAliasViewSet)
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
    path("spatial_lookup/", pt_spatial_attrs, name="api-lookup-spatial-attrs"),
    path("spatial_lookup_roi/", roi_spatial_attrs, name="api-lookup-roi-attrs"),
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
