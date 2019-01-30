from django.urls import path


from .views import StockingEventListView#, StockingEventDetailView


app_name = 'stocking'

urlpatterns = [
    path('', StockingEventListView.as_view(),
         name='stocking-event-list'),

    path('<lake_name>/', StockingEventListView.as_view(),
         name='stocking-event-list-lake'),

    path('<lake_name>/<int:year>/', StockingEventListView.as_view(),
         name='stocking-event-list-lake-year'),


#    path('<id:id>/', StockingEventDetailView.as_view(),
#         name='stocking-event-detail'),
]
