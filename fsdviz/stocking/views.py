'''
Views associated with our stocking application.
'''

from django.shortcuts import redirect
from django.db.models import Count, Q, Max
from django.urls import reverse
import json

from django.views.generic.detail import DetailView
from django.views.generic.list import ListView

from ..common.models import Lake, Jurisdiction
from .models import StockingEvent
from .filters import StockingEventFilter

from django.shortcuts import get_object_or_404


def StockingEventListLatestYear(request):
    """Get the most recent year of stockin and
    pass the information onto our annual_events view.
    """

    latest_year = StockingEvent.objects.all().aggregate(Max('year'))
    url = reverse(
        'stocking:stocking-event-list-year',
        kwargs={'year': latest_year.get('year__max')})

    return redirect(url)


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

    ``year_list``
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
    paginate_by = 50
    template_name = 'stocking/stocking_event_list.html'
    filter_class = StockingEventFilter

    def get_context_data(self, **kwargs):
        context = super(StockingEventListView, self).get_context_data(**kwargs)

        context['search_criteria'] = self.request.GET.get('q')

        lake_name = self.kwargs.get('lake_name')
        if lake_name:
            lake = Lake.objects.get(abbrev=lake_name)
            extent = lake.shoreline.extent
            context['extent'] = json.dumps(extent)
            context['lake'] = lake

        year = self.kwargs.get('year')
        if year:
            context['year'] = int(year)

        jurisdiction_slug = self.kwargs.get('jurisdiction')
        if jurisdiction_slug:
            jurisdiction = Jurisdiction.objects.get(slug=jurisdiction_slug)
            extent = jurisdiction.shoreline.extent
            context['extent'] = json.dumps(extent)

        context['year_list'] = self.object_list.\
                               values_list('year').\
                               annotate(n=Count('id')).order_by('-year')

        context['agency_list'] = self.object_list.\
                                   values_list('agency__abbrev').\
                                   annotate(n=Count('id')).order_by()

        context['jurisdiction_list'] = self.object_list.\
                                       values_list('jurisdiction__slug',
                                                   'jurisdiction__name').\
                                                   annotate(n=Count('id')).\
                                                   order_by()

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
        jurisdiction = self.kwargs.get('jurisdiction')

        #get the value of q from the request kwargs
        search_q = self.request.GET.get('q')

        queryset = StockingEvent.objects.all()

        queryset = queryset.select_related(
            'agency', 'jurisdiction', 'jurisdiction__stateprov',
            'jurisdiction__lake', 'species', 'lifestage', 'grid_10',
            'grid_10__lake', 'latlong_flag', 'strain_raw__strain',
            'stocking_method')

        queryset = queryset.prefetch_related(
            'species', 'agency', 'condition', 'stocking_method', 'grid_10',
            'grid_10__lake', 'jurisdiction', 'jurisdiction__lake',
            'jurisdiction__stateprov', 'latlong_flag', 'lifestage')

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

        #import pdb; pdb.set_trace()
        #finally django-filter
        filtered_list = StockingEventFilter(
            self.request.GET, queryset=queryset)

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
    template_name = 'stocking/stocking_detail.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context

    def get_object(self):

        stock_id = self.kwargs.get('stock_id')
        event = get_object_or_404(StockingEvent, stock_id=stock_id)
        return event
