from django.urls import path

from .views import (StockingEventListView,
                    StockingEventDetailView)

app_name = 'stocking'

urlpatterns = [
    path('', StockingEventListView.as_view(),
         name='stocking-event-list'),

    path('events/<int:year>/', StockingEventListView.as_view(),
         name='stocking-event-list-year'),

    path('events/<lake_name>/', StockingEventListView.as_view(),
         name='stocking-event-list-lake'),

    path('events/<lake_name>/<int:year>/', StockingEventListView.as_view(),
         name='stocking-event-list-lake-year'),

    path('events/jurisdiction/<jurisdiction>/', StockingEventListView.as_view(),
         name='stocking-event-list-jurisdiction'),

    path('events/jurisdiction/<jurisdiction>/<int:year>',
         StockingEventListView.as_view(),
         name='stocking-event-list-jurisdiction-year'),

    path('events/<lake_name>/<int:year>/', StockingEventListView.as_view(),
         name='stocking-event-list-lake-year'),



    path('event_detail/<stock_id>/', StockingEventDetailView.as_view(),
         name='stocking-event-detail'),
]
