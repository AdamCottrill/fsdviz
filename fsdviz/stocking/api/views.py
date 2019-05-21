"""Views for the api for our common models

The veiws in this file should all be publicly available as readonly.

"""
from django.db.models import Count, F, Q, Sum
from rest_framework import generics, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from fsdviz.stocking.models import (LifeStage, Condition, StockingMethod,
                                    StockingEvent)

from fsdviz.stocking.filters import StockingEventFilter

from .serializers import (LifeStageSerializer, ConditionSerializer,
                          StockingMethodSerializer, StockingEventSerializer,
                          StockingEventFastSerializer)

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
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):

        lake_name = self.kwargs.get('lake_name')
        year = self.kwargs.get('year')
        jurisdiction = self.kwargs.get('jurisdiction')

        # get the value of q from the request kwargs
        search_q = self.request.GET.get('q')

        queryset = StockingEvent.objects.all()
        queryset = queryset.select_related(
            'agency', 'jurisdiction', 'jurisdiction__stateprov',
            'jurisdiction__lake', 'species', 'lifestage', 'grid_10',
            'grid_10__lake', 'latlong_flag', 'strain_raw__strain',
            'stocking_method')

        if lake_name:
            # Return a filtered queryset
            queryset = queryset.filter(jurisdiction__lake__abbrev=lake_name)

        if year:
            queryset = queryset.filter(year=year)

        if jurisdiction:
            queryset = queryset.filter(jurisdiction__slug=jurisdiction)

        if search_q:
            queryset = queryset.filter(
                Q(stock_id__icontains=search_q) | Q(notes__icontains=search_q))

        queryset = self.get_serializer_class().setup_eager_loading(queryset)
        #finally django-filter
        filtered_list = StockingEventFilter(
            self.request.GET, queryset=queryset)

        return filtered_list.qs


class StockingEventMapListView(generics.ListAPIView):
    """A list view of stocking events. Events are aggregated to minimize
    the number of records returned.  Only fields needed to create maps
    and associated filter widgets are included.

    Filters available in other api views are not used in is view.

    NOTE: we could consider changing the level of aggregation
    depending on the spatial scale of the map this is called from. -
    No need for lat-lon at the basin level.

    """

    serializer_class = StockingEventFastSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        return Response(queryset)

    def get_queryset(self):

        # get any url parameters:
        lake_name = self.kwargs.get('lake_name')
        year = self.kwargs.get('year')
        jurisdiction = self.kwargs.get('jurisdiction')

        # count our events and sum the yreq_stocked, give each field
        # that is from a child table as a simple label
        metrics = {
            'stateprov': F('jurisdiction__stateprov__abbrev'),
            'lake': F('jurisdiction__lake__abbrev'),
            'jurisdiction_slug': F('jurisdiction__slug'),
            'man_unit': F('management_unit__slug'),
            'grid10': F('grid_10__slug'),
            'stk_method': F('stocking_method__description'),
            'life_stage': F('lifestage__description'),
            'agency_abbrev': F('agency__abbrev'),
            'species_name': F('species__common_name'),
            'strain': F('strain_raw__strain__strain_label')
        }

        aggregation_metrics = {
            'events': Count('id'),
            'yreq': Sum('yreq_stocked'),
            'total_stocked': Sum('no_stocked')
        }

        queryset = StockingEvent.objects.\
            select_related('species', 'lifestage',
                           'jurisdiction', 'jurisdiction__lake',
                           'jurisdiction__stateprov',
                           'grid_10',
                           'management_unit', 'agency',
                           'strain_raw__strain',
                           'stocking_method'
            ).prefetch_related('species', 'lifestage',
                               'jurisdiction', 'jurisdiction__lake',
                               'jurisdiction__stateprov',
                               'grid_10',
                               'management_unit', 'agency',
                               'strain_raw__strain',
                               'stocking_method'
            )


        # filter by lake, year and jurisdiction if they were included in the url
        if lake_name:
            # Return a filtered queryset
            queryset = queryset.filter(jurisdiction__lake__abbrev=lake_name)

        if year:
            queryset = queryset.filter(year=year)

        if jurisdiction:
            queryset = queryset.filter(jurisdiction__slug=jurisdiction)

        queryset= queryset.annotate(**metrics).\
            values('dd_lat', 'dd_lon', 'month',
                   'lake',
                   'jurisdiction_slug',
                   'man_unit',
                   'stateprov',
                   'grid10',
                   'life_stage',
                   'stk_method',
                   'agency_abbrev',
                   'species_name',
                   'strain',
                   'year_class',
                   'mark'
            ).order_by().annotate(**aggregation_metrics)

        return queryset
