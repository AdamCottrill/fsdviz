"""urls for the api for our common models"""

from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (
    LifeStageViewSet,
    YearlingEquivalentViewSet,
    ConditionViewSet,
    StockingMethodViewSet,
    StockingEventViewSet,
    StockingEventMapListView,
    StockingEventListAPIView,
    StockingEventLookUpsAPIView,
    StockingEvent2xlsxViewSet,
    CWTEventListAPIView,
    CWTEvent2xlsxViewSet,
    CWTEventMapAPIView,
)


app_name = "api"

router = SimpleRouter()

router.register("lifestage", LifeStageViewSet)
router.register("yearling_equivalent", YearlingEquivalentViewSet)
router.register("condition", ConditionViewSet)
router.register("stocking_method", StockingMethodViewSet)

urlpatterns = router.urls

# we will explicilty set the api urls for stocking events so they match the
# urls for the template views.

urlpatterns += [
    path(
        "lookups/",
        StockingEventLookUpsAPIView.as_view(),
        name="api-get-stocking-lookups",
    ),
    path(
        "get_events/",
        StockingEventListAPIView.as_view(),
        name="api-get-stocking-events",
    ),
    path(
        "events/",
        StockingEventViewSet.as_view({"get": "list"}),
        name="api-stocking-event-list",
    ),
    path(
        "stocking_event/<stock_id>/",
        StockingEventViewSet.as_view({"get": "retrieve"}),
        name="api-stocking-event-detail",
    ),
    path(
        "events_xlsx/",
        StockingEvent2xlsxViewSet.as_view({"get": "list"}),
        name="api-stocking-event-list-xlsx",
    ),
    path(
        "get_cwt_events/",
        CWTEventListAPIView.as_view(),
        name="api-get-cwt-stocking-events",
    ),
    path(
        "cwt_events_map/",
        CWTEventMapAPIView.as_view(),
        name="api-cwt-stocking-events-map",
    ),
    path(
        "cwt_events_xlsx/",
        CWTEvent2xlsxViewSet.as_view(),
        name="api-cwt-event-list-xlsx",
    ),
    # ========================================
    # simplified map serializers:
    path(
        "mapdata/events/<int:year>/",
        StockingEventMapListView.as_view(),
        name="api-stocking-event-map-list-year",
    ),
    path(
        "mapdata/events/",
        StockingEventMapListView.as_view(),
        name="api-stocking-event-map-list",
    ),
    path(
        "mapdata/events/upload_event/<upload_event_slug>/",
        StockingEventMapListView.as_view(),
        name="api-stocking-event-upload-map",
    ),
]
