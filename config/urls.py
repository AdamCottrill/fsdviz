"""fsdviz URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from fsdviz.myusers.views import account_redirect

# our homepage:  TEMP!!
from fsdviz.stocking.views import PieChartMapViewLatestYear
from rest_framework.documentation import include_docs_urls
from rest_framework.permissions import AllowAny


from fsdviz.common.api.views import (
    AgencyViewSet,
    SpeciesViewSet,
    JurisdictionViewSet,
    StateProvinceViewSet,
    LakeViewSet,
    ManagementUnitViewSet,
    StrainSpeciesViewSet,
    StrainRawViewSet,
    Grid10ViewSet,
    LatLonFlagViewSet,
    MarkViewSet,
)

from fsdviz.stocking.api.views import (
    LifeStageViewSet,
    YearlingEquivalentViewSet,
    ConditionViewSet,
    StockingMethodViewSet,
    StockingEventViewSet,
    CWTEventListAPIView,
)


API_TITLE = "Great Lakes Fish Stocking API"
API_DESCRIPTION = "A web API for Great Lakes Fish Stocking Database"


public_urls = [
    path("api/v1/common/lake", LakeViewSet.as_view({"get": "list"})),
    path("api/v1/common/agency", AgencyViewSet.as_view({"get": "list"})),
    path("api/v1/common/jurisdiction", JurisdictionViewSet.as_view({"get": "list"})),
    path(
        "api/v1/common/management_unit", ManagementUnitViewSet.as_view({"get": "list"})
    ),
    path("api/v1/common/state_province", StateProvinceViewSet.as_view({"get": "list"})),
    path("api/v1/common/grid10", Grid10ViewSet.as_view({"get": "list"})),
    path("api/v1/common/latlonflag", LatLonFlagViewSet.as_view({"get": "list"})),
    path("api/v1/common/mark", MarkViewSet.as_view({"get": "list"})),
    path("api/v1/common/species", SpeciesViewSet.as_view({"get": "list"})),
    path("api/v1/common/strain", StrainSpeciesViewSet.as_view({"get": "list"})),
    path("api/v1/common/strainraw", StrainRawViewSet.as_view({"get": "list"})),
    path("api/v1/stocking/lifestage", LifeStageViewSet.as_view({"get": "list"})),
    path(
        "api/v1/stocking/yearling_equivalent",
        YearlingEquivalentViewSet.as_view({"get": "list"}),
    ),
    path("api/v1/stocking/condition", ConditionViewSet.as_view({"get": "list"})),
    path(
        "api/v1/stocking/stocking_method",
        StockingMethodViewSet.as_view({"get": "list"}),
    ),
    path("api/v1/stocking/events", StockingEventViewSet.as_view({"get": "list"})),
    path("api/v1/stocking/get_cwt_events", CWTEventListAPIView.as_view()),
]

schema_view = get_schema_view(
    openapi.Info(
        title=API_TITLE,
        default_version="v1",
        description=API_DESCRIPTION,
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="adam.cottrill@ontario.ca"),
        license=openapi.License(name="BSD License"),
    ),
    # generate docs for all endpoint from here down:
    # patterns=urlpatterns + common_api_urls + stocking_api_urls,
    patterns=public_urls,
    public=True,
    permission_classes=(AllowAny,),
)


urlpatterns = [
    path("coregonusclupeaformis/doc/", include("django.contrib.admindocs.urls")),
    path("coregonusclupeaformis/", admin.site.urls),
    path("login/", account_redirect, name="account-redirect"),
    path("users/", include("fsdviz.myusers.urls")),
    path("users/", include("django.contrib.auth.urls")),
    path("shared/", include("fsdviz.common.urls", namespace="common")),
    path("stocking/", include("fsdviz.stocking.urls", namespace="stocking")),
    path("resource_library/", include("resource_library.urls", "resource_library")),
    # path("cwt/", include("cwt.urls")),
    # API's
    path("tickets/", include(("tickets.urls", "tickets"), namespace="tickets")),
    path("api-auth/", include("rest_framework.urls")),
    path("api/v1/rest-auth/", include("rest_auth.urls")),
    path("api/v1/common/", include("fsdviz.common.api.urls", namespace="common_api")),
    path(
        "api/v1/stocking/",
        include("fsdviz.stocking.api.urls", namespace="stocking_api"),
    ),
    path("bookmarks/", include("bookmark_it.urls")),
    # =============================================
    #          API AND DOCUMENTATION
    path(
        "api/v1/public_urls/",
        schema_view.with_ui("redoc", cache_timeout=0),
        name="schema-redoc",
    ),
    # api documentation
    re_path(
        r"^api/v1/swagger(?P<format>\.json|\.yaml)$",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    path(
        "api/v1/swagger/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    path("", PieChartMapViewLatestYear, name="home"),
]


if settings.DEBUG:
    import debug_toolbar

    urlpatterns = (
        [
            path("__debug__/", include(debug_toolbar.urls)),
        ]
        + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
        + urlpatterns
    )
