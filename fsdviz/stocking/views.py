from django.shortcuts import render
from django.db.models import Count

from django.views.generic.detail import DetailView
from django.views.generic.list import ListView

from ..common.models import Lake
from .models import StockingEvent
from .filters import StockingEventFilter

from django.shortcuts import get_object_or_404

class StockingEventListView(ListView):
    '''
    A generic list view that is used to display a list of stocking
    events.  StockingEventFilter is used to filter the seleted
    records.

    **Context**

    ``object_list``
        An list of :model:`stocking.StockingEvent` instances that
        satifity the lake and year parameters from the url and the
        current filter as speficied in query string (e.g. ?species=LAT).

    ``years``
        A list of unique years available in the database - used to
        populate hyperlinks to pages presenting data for the specified
        year.

    ``agency_list``
        A list of the unique agencies in the currently selected
        queryest. Used to further refined the seleted result. The
        list consists of 2-element tuples that include the agency
        abbreviation and number of records for each.

    ``species_list``
        A list of the unique species in the currently selected
        queryest. Used to further refined the seleted result.

    ``strain_list``
        A list of the unique strains in the currently selected
        queryest. Used to further refined the seleted result.

    ``lifestage_list``
        A list of the unique life stages in the currently selected
        queryest. Used to further refined the seleted result.

    ``stocking_method_list``
        A list of the unique stocking methods in the currently
        selected queryest. Used to further refined the seleted
        result.

    ``mark_list``
        A list of the unique mark in the currently selected
        queryest. Used to further refined the seleted result.

    **Template:**

    :template:`stocking/stocking_event_list.html`

    '''

    model = StockingEvent
    paginate_by = 200
    template_name = 'stocking\stocking_event_list.html'
    filter_class = StockingEventFilter

    def get_context_data(self, **kwargs):
        context = super(StockingEventListView,
                        self).get_context_data(**kwargs)

        lake_name = self.kwargs.get('lake_name')
        if lake_name:
            lake = Lake.objects.get(abbrev=lake_name)
            context['lake'] = lake

            years = StockingEvent.objects.\
                    filter(lake=lake).values_list('year').\
                    distinct().order_by('-year')
            context['years'] = [x[0] for x in years]

        year = self.kwargs.get('year')
        if year:
            context['year'] = int(year)

        context['agency_list'] = self.object_list.\
                                   values_list('agency__abbrev').\
                                   annotate(n=Count('id')).order_by()

        context['species_list'] = self.object_list.\
                                   values_list('species__abbrev',
                                               'species__common_name').\
                                   annotate(n=Count('id')).order_by()

        context['strain_list'] = self.object_list.\
                                 values_list(
                                     'strain_raw__strain__strain_code',
                                     'strain_raw__strain__strain_label').\
                                     annotate(n=Count('id')).order_by()

        context['lifestage_list'] = self.object_list.\
                                    values_list('lifestage__abbrev',
                                                'lifestage__description').\
                                                annotate(n=Count('id')).\
                                                order_by()

        context['mark_list'] = self.object_list.values_list('mark').\
                               annotate(n=Count('id')).\
                               order_by()

        context['stocking_method_list'] = self.object_list.\
                                          values_list('stocking_method__stk_meth',
                                                      'stocking_method__description').\
                                                      annotate(n=Count('id')).\
                                                      order_by()

        return context


    def get_queryset(self):

        lake_name = self.kwargs.get('lake_name')
        year = self.kwargs.get('year')

        queryset = StockingEvent.objects.all()
        queryset = queryset.select_related('agency', 'lake',
                                           'species', 'lifestage',
                                           'strain_raw__strain',
                                           'stocking_method')

        if lake_name:
            # Return a filtered queryset
            queryset = queryset.filter(lake__abbrev=lake_name)

        if year:
            queryset = queryset.filter(year=year)

        #finally django-filter
        filtered_list = StockingEventFilter(self.request.GET,
                                            queryset=queryset)

        return filtered_list.qs



class StockingEventDetailView(DetailView):
    '''

    **Context**

    ``object``
        A :model:`stocking.StockingEvent` instance.

    **Template:**

    :template:`stocking/stocking_detail.html`

    '''


    model = StockingEvent
    template_name = 'stocking\stocking_detail.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context

    def get_object(self):

        stock_id = self.kwargs.get('stock_id')
        event = get_object_or_404(StockingEvent, stock_id=stock_id)
        return event
