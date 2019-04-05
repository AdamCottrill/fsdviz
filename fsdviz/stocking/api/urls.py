"""urls for the api for our common models"""

from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (LifeStageViewSet, ConditionViewSet, StockingMethodViewSet,
                    StockingEventViewSet, StockingEventMapListView)

app_name = "stocking"

router = SimpleRouter()

router.register('lifestage', LifeStageViewSet)
router.register('condition', ConditionViewSet)
router.register('stocking_method', StockingMethodViewSet)

urlpatterns = router.urls

#we will explicilty set the api urls for stocking events so they match the
# urls for the template views.

urlpatterns += [
    path(
        'events/',
        StockingEventViewSet.as_view({'get': 'list'}),
        name='api-stocking-event-list'),
    path(
        'events/<int:year>/',
        StockingEventViewSet.as_view({'get': 'list'}),
        name='api-stocking-event-list-year'),
    path(
        'events/<lake_name>/',
        StockingEventViewSet.as_view({'get': 'list'}),
        name='api-stocking-event-list-lake'),
    path(
        'events/<lake_name>/<int:year>/',
        StockingEventViewSet.as_view({'get': 'list'}),
        name='api-stocking-event-list-lake-year'),
    path(
        'events/jurisdiction/<jurisdiction>/',
        StockingEventViewSet.as_view({'get': 'list'}),
        name='api-stocking-event-list-jurisdiction'),
    path(
        'events/jurisdiction/<jurisdiction>/<int:year>',
        StockingEventViewSet.as_view({'get': 'list'}),
        name='api-stocking-event-list-jurisdiction-year'),
    path(
        'events/<lake_name>/<int:year>/',
        StockingEventViewSet.as_view({'get': 'list'}),
        name='api-stocking-event-list-lake-year'),
    path(
        'stocking_event/<stock_id>/',
        StockingEventViewSet.as_view({'get': 'retrieve'}),
        name='api-stocking-event-detail'),

    #========================================
    # simplified map serializers:
    path(
        'mapdata/events/',
        StockingEventMapListView.as_view(),
        name='api-stocking-event-map-list'),
    path(
        'mapdata/events/<int:year>/',
        StockingEventMapListView.as_view(),
        name='api-stocking-event-map-list-year'),
    path(
        'mapdata/events/<lake_name>/',
        StockingEventMapListView.as_view(),
        name='api-stocking-event-map-list-lake'),
    path(
        'mapdata/events/<lake_name>/<int:year>/',
        StockingEventMapListView.as_view(),
        name='api-stocking-event-map-list-lake-year'),
    path(
        'mapdata/events/jurisdiction/<jurisdiction>/',
        StockingEventMapListView.as_view(),
        name='api-stocking-event-map-list-jurisdiction'),
    path(
        'mapdata/events/jurisdiction/<jurisdiction>/<int:year>',
        StockingEventMapListView.as_view(),
        name='api-stocking-event-map-list-jurisdiction-year'),
    path(
        'mapdata/events/<lake_name>/<int:year>/',
        StockingEventMapListView.as_view(),
        name='api-stocking-event-map-list-lake-year'),


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
