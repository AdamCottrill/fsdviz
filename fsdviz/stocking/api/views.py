"""Views for the api for our common models

The veiws in this file should all be publicly available as readonly.

"""
from django.db.models import Count, Q
from rest_framework import viewsets

from fsdviz.stocking.models import (LifeStage, Condition, StockingMethod,
                                    StockingEvent)

from fsdviz.stocking.filters import StockingEventFilter

from .serializers import (LifeStageSerializer, ConditionSerializer,
                          StockingMethodSerializer, StockingEventSerializer)



class LifeStageViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = LifeStage.objects.all()
    serializer_class = LifeStageSerializer


class ConditionViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = Condition.objects.all()
    serializer_class = ConditionSerializer


class StockingMethodViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = StockingMethod.objects.all()
    serializer_class = StockingMethodSerializer


class StockingEventViewSet(viewsets.ReadOnlyModelViewSet):


    serializer_class = StockingEventSerializer
    filterset_class = StockingEventFilter
    lookup_field = "stock_id"

    def get_queryset(self):

        lake_name = self.kwargs.get('lake_name')
        year = self.kwargs.get('year')
        jurisdiction = self.kwargs.get('jurisdiction')

        #get the value of q from the request kwargs
        search_q = self.request.GET.get('q')

        queryset = StockingEvent.objects.all()
        queryset = queryset.select_related('agency',
                                           'jurisdiction',
                                           'jurisdiction__stateprov',
                                           'jurisdiction__lake',
                                           'species', 'lifestage',
                                           'grid_10', 'grid_10__lake',
                                           'latlong_flag',
                                           'strain_raw__strain',
                                           'stocking_method')


        if lake_name:
            # Return a filtered queryset
            queryset = queryset.filter(jurisdiction__lake__abbrev=lake_name)

        if year:
            queryset = queryset.filter(year=year)

        if jurisdiction:
            queryset = queryset.filter(jurisdiction__slug=jurisdiction)

        if search_q:
            queryset = queryset.filter(Q(stock_id__icontains=search_q) |
                                       Q(notes__icontains=search_q))

        queryset = self.get_serializer_class().setup_eager_loading(queryset)
        #finally django-filter
        filtered_list = StockingEventFilter(self.request.GET,
                                            queryset=queryset)

        return filtered_list.qs
