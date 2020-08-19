from django.urls import path

from .views import (
    PieChartMapView,
    PieChartMapViewLatestYear,
    StockingEventListView,
    StockingEventDetailView,
    StockingEventListLatestYear,
    find_events,
    filtered_events,
    upload_events,
    xls_events,
    edit_stocking_event,
    DataUploadEventListView,
    DataUploadEventDetailView,
    CWTListView,
)

app_name = "stocking"

urlpatterns = [
    path("", PieChartMapViewLatestYear, name="stocking-events"),
    path("find_events/", find_events, name="find-stocking-events"),
    path("filtered_events/", filtered_events, name="filtered-stocking-events"),
    path("events/<int:year>/", PieChartMapView.as_view(), name="stocking-events-year"),
    path("events/<lake_name>/", PieChartMapView.as_view(), name="stocking-events-lake"),
    path(
        "events/<lake_name>/<int:year>/",
        PieChartMapView.as_view(),
        name="stocking-events-lake-year",
    ),
    path(
        "events/jurisdiction/<jurisdiction>/",
        PieChartMapView.as_view(),
        name="stocking-events-jurisdiction",
    ),
    path(
        "events/jurisdiction/<jurisdiction>/<int:year>",
        PieChartMapView.as_view(),
        name="stocking-events-jurisdiction-year",
    ),
    path(
        "events/<lake_name>/<int:year>/",
        PieChartMapView.as_view(),
        name="stocking-events-lake-year",
    ),
    # the default events view will be to return the most recent year
    # for all lakes:
    path("events/", PieChartMapViewLatestYear, name="stocking-events-latest-year"),
    # stocking event lists
    path(
        "events_list/<int:year>/",
        StockingEventListView.as_view(),
        name="stocking-event-list-year",
    ),
    path(
        "events_list/<lake_name>/",
        StockingEventListView.as_view(),
        name="stocking-event-list-lake",
    ),
    path(
        "events_list/<lake_name>/<int:year>/",
        StockingEventListView.as_view(),
        name="stocking-event-list-lake-year",
    ),
    path(
        "events_list/jurisdiction/<jurisdiction>/",
        StockingEventListView.as_view(),
        name="stocking-event-list-jurisdiction",
    ),
    path(
        "events_list/jurisdiction/<jurisdiction>/<int:year>",
        StockingEventListView.as_view(),
        name="stocking-event-list-jurisdiction-year",
    ),
    path(
        "events_list/",
        # StockingEventListLatestYear,
        StockingEventListView.as_view(),
        name="stocking-event-list",
    ),
    path(
        "event_detail/<stock_id>/",
        StockingEventDetailView.as_view(),
        name="stocking-event-detail",
    ),
    path("edit_event/<stock_id>/", edit_stocking_event, name="edit-stocking-event"),
    path("upload_events/", upload_events, name="upload-stocking-events"),
    path("uploaded_events/", xls_events, name="xls-events-form"),
    path(
        "data_upload_events/",
        DataUploadEventListView.as_view(),
        name="data-upload-event-list",
    ),
    path(
        "data_upload_event_detail/<slug>/",
        DataUploadEventDetailView.as_view(),
        name="data-upload-event-detail",
    ),
    path("cwts/", CWTListView.as_view(), name="cwt-list"),
]
