"""urls for the api for our common models"""

from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (
    LifeStageViewSet,
    ConditionViewSet,
    StockingMethodViewSet,
    StockingEventViewSet,
    StockingEventMapListView,
    StockingEventListAPIView,
    StockingEventLookUpsAPIView,
    StockingEvent2xlsxViewSet,
)


app_name = "api"

router = SimpleRouter()

router.register("lifestage", LifeStageViewSet)
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
        "events_xlsx/",
        StockingEvent2xlsxViewSet.as_view({"get": "list"}),
        name="api-stocking-event-list-xlsx",
    ),
    path(
        "events/<int:year>/",
        StockingEventViewSet.as_view({"get": "list"}),
        name="api-stocking-event-list-year",
    ),
    path(
        "events/<lake_name>/",
        StockingEventViewSet.as_view({"get": "list"}),
        name="api-stocking-event-list-lake",
    ),
    path(
        "events/<lake_name>/<int:year>/",
        StockingEventViewSet.as_view({"get": "list"}),
        name="api-stocking-event-list-lake-year",
    ),
    path(
        "events/jurisdiction/<jurisdiction>/",
        StockingEventViewSet.as_view({"get": "list"}),
        name="api-stocking-event-list-jurisdiction",
    ),
    path(
        "events/jurisdiction/<jurisdiction>/<int:year>",
        StockingEventViewSet.as_view({"get": "list"}),
        name="api-stocking-event-list-jurisdiction-year",
    ),
    path(
        "events/<lake_name>/<int:year>/",
        StockingEventViewSet.as_view({"get": "list"}),
        name="api-stocking-event-list-lake-year",
    ),
    path(
        "stocking_event/<stock_id>/",
        StockingEventViewSet.as_view({"get": "retrieve"}),
        name="api-stocking-event-detail",
    ),
    # ========================================
    # simplified map serializers:
    path(
        "mapdata/events/",
        StockingEventMapListView.as_view(),
        name="api-stocking-event-map-list",
    ),
    path(
        "mapdata/events/<int:year>/",
        StockingEventMapListView.as_view(),
        name="api-stocking-event-map-list-year",
    ),
    path(
        "mapdata/events/<lake_name>/",
        StockingEventMapListView.as_view(),
        name="api-stocking-event-map-list-lake",
    ),
    path(
        "mapdata/events/upload_event/<upload_event_slug>/",
        StockingEventMapListView.as_view(),
        name="api-stocking-event-upload-map",
    ),
    path(
        "mapdata/events/<lake_name>/<int:year>/",
        StockingEventMapListView.as_view(),
        name="api-stocking-event-map-list-lake-year",
    ),
    path(
        "mapdata/events/jurisdiction/<jurisdiction>/",
        StockingEventMapListView.as_view(),
        name="api-stocking-event-map-list-jurisdiction",
    ),
    path(
        "mapdata/events/jurisdiction/<jurisdiction>/<int:year>",
        StockingEventMapListView.as_view(),
        name="api-stocking-event-map-list-jurisdiction-year",
    ),
]
