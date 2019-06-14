'''
Views associated with our stocking application.
'''

from django.db.models import Count, Q, Max, F
from django.http import HttpResponseRedirect
from django.shortcuts import redirect, render, get_object_or_404
from django.urls import reverse

from django.views.generic.base import TemplateView
from django.views.generic.detail import DetailView
from django.views.generic.list import ListView

import json

from ..common.models import (Lake, Jurisdiction, Species, Strain,
                             StateProvince, ManagementUnit, Agency)
from .models import StockingEvent, StockingMethod, LifeStage
from .filters import StockingEventFilter

from .forms import FindEventsForm


def find_events(request):

    field_aliases = {
        "agency_code": F('agency__abbrev'),
        "spc": F('species__abbrev'),
        "strain": F('strain_raw__strain'),
        "stage": F('lifestage__abbrev'),
        "method": F('stocking_method__stk_meth'),
        "jurisd": F('jurisdiction__slug'),
        "lake": F('jurisdiction__lake__abbrev'),
        "state": F('jurisdiction__stateprov__abbrev')
    }

    # use our shorter field names in the list of fields to select:
    fields = [
        'year', 'month', 'mark', "agency_code", "spc", "strain", "stage",
        "method", "jurisd", "lake", "state"
    ]

    related_tables = [
        'jurisdiction', 'agency', 'species', 'strain', 'lifestage',
        'stocking_method', 'jurisdition__lake', 'jurisdiction__stateprov'
    ]

    counts = {"events": Count('id')}

    values = list(StockingEvent.objects\
                          .select_related(*related_tables)\
                          .annotate(**field_aliases)\
                          .values(*fields).order_by().annotate(**counts))

    # these will give our results shorter fieldnames

    # lakes, agencies, juristictions, states/provinces, species,
    # strains, lifestages, stockingmethods

    #lookups - to provide nice labels for dropdown menues
    lakes = list(Lake.objects.values('abbrev', 'lake_name'))
    stateProv = list(StateProvince.objects.values('abbrev', 'name'))
    jurisdictions = list(Jurisdiction.objects.values('slug', 'name'))
    agencies = list(Agency.objects.all().values('abbrev', 'agency_name'))

    # manunits
    #managementUnits = list(
    #    ManagementUnit.objects.values('slug', 'label', 'description'))

    species = list(Species.objects.values('abbrev', 'common_name'))

    # Strain????
    strains = list(Strain.objects.prefetch_related('species')\
                    .annotate(**{'spc_name': F('species__common_name')})\
                    .values('id', 'spc_name', 'strain_code', 'strain_label')
                   .distinct().order_by())

    stocking_methods = list(
        StockingMethod.objects.values('stk_meth', 'description'))
    lifestages = list(LifeStage.objects.values('abbrev', 'description'))

    # if this is a POST request we need to process the form data
    if request.method == 'POST':
        # create a form instance and populate it with data from the request:
        form = FindEventsForm(request.POST)

        # initialize the choices - these will be dynamically updated
        # by js in the html, but need to be here when we validate the
        # form.  They are tuples of the form (value, label) that
        # correspond to elements in dropdown list.  note that strain
        #  has multiple values that need to be stitched together.

        form.fields['lake'].choices = [list(x.values()) for x in lakes]
        form.fields['stateprov'].choices = [
            list(x.values()) for x in stateProv
        ]
        form.fields['jurisdiction'].choices = [
            list(x.values()) for x in jurisdictions
        ]
        form.fields['agency'].choices = [list(x.values()) for x in agencies]
        form.fields['species'].choices = [list(x.values()) for x in species]
        form.fields['strain'].choices = [
            (str(x['id']),
             '{spc_name} - {strain_label} ({strain_code})'.format(**x))
            for x in strains
        ]

        form.fields['stocking_method'].choices = [
            list(x.values()) for x in stocking_methods
        ]
        form.fields['life_stage'].choices = [
            (x['abbrev'], '{description} ({abbrev})'.format(**x))
            for x in lifestages
        ]

        # check whether it's valid:
        if form.is_valid():

            #base url:
            #query paremters for:
            # agency
            # lake
            # stateProv
            # jurisdiction
            # stocking month
            # first year, last year
            # species
            # strain
            # lifestage
            # stocking method

            # process the data in form.cleaned_data as required
            # ...
            # redirect to a new URL:
            return HttpResponseRedirect('/thanks/')

    # if a GET (or any other method) we'll create a blank form
    else:

        form = FindEventsForm()

    #import pdb; pdb.set_trace()

    return render(
        request,
        'stocking/find_events_form.html',
        {
            'form': form,
            'values': json.dumps(values),
            'lakes': json.dumps(lakes),
            "agencies": json.dumps(agencies),
            'stateProv': json.dumps(stateProv),
            'jurisdictions': json.dumps(jurisdictions),
            #'management_units': json.dumps(managementUnits),
            'species': json.dumps(species),
            'strains': json.dumps(strains),
            'lifestages': json.dumps(lifestages),
            'stocking_methods': json.dumps(stocking_methods)
        })


def StockingEventListLatestYear(request):
    """Get the most recent year of stockin and
    pass the information onto our annual_events view.
    """

    latest_year = StockingEvent.objects.all().aggregate(Max('year'))
    url = reverse(
        'stocking:stocking-event-list-year',
        kwargs={'year': latest_year.get('year__max')})

    return redirect(url)


def PieChartMapViewLatestYear(request):
    """Get the most recent year of stockind and
    pass the information onto our pie chart map view.
    """
    latest_year = StockingEvent.objects.all().aggregate(Max('year'))
    url = reverse(
        'stocking:stocking-events-year',
        kwargs={'year': latest_year.get('year__max')})

    return redirect(url)


class PieChartMapView(TemplateView):
    """This is going to be the ront page of out application.  Most of the
    work will done by the javascript libraries, but we will need to pass
    in serveral variables to set things up:

   ``dataurl``

      the api url corresponding the spatial and temporal filters
      speficied in the url.  Passed to the javascript libraries.

   ``year``

      the year of the stocking event

   ``spatialunit``

    defaults to 'basin' if not provided in the url,
    otherwize it must be one of 'lake', 'jurisdition', 'manUnit'

   ``slug`` - the slug selected lake, jurisdiction, or management unit

   ``label - the slug selected lake, jurisdiction, or management unit

    """

    template_name = 'stocking/event_piechart_map.html'

    def get_context_data(self, **kwargs):
        context = super(PieChartMapView, self).get_context_data(**kwargs)

        spatialUnit = 'basin'
        obj = None

        year = self.kwargs.get('year')
        if year:
            view_name = 'stocking_api:api-stocking-event-map-list-year'
            dataUrl = reverse(view_name, kwargs={'year': year})
            context['year'] = int(year)

        lake_name = self.kwargs.get('lake_name')
        if lake_name:
            dataUrl = reverse(
                'stocking_api:api-stocking-event-map-list-lake-year',
                kwargs={
                    'year': year,
                    'lake_name': lake_name
                })
            spatialUnit = 'lake'
            obj = Lake.objects.get(abbrev=lake_name)

        jurisdiction_slug = self.kwargs.get('jurisdiction')
        if jurisdiction_slug:
            dataUrl = reverse(
                'stocking_api:api-stocking-event-map-list-jurisdiction-year',
                kwargs={
                    'year': year,
                    'jurisdiction': jurisdiction_slug
                })
            spatialUnit = 'jurisdiction'
            obj = Jurisdiction.objects.get(slug=jurisdiction_slug)


#        slug = self.kwargs.get('management_unit')
#        if manUnit_slug:
#            spatialUnit = 'manUnit'
#            obj = ManagementUnit.objects.get(slug=slug)

        context['dataUrl'] = dataUrl
        context['spatialUnit'] = spatialUnit

        if obj:
            context['slug'] = obj.slug
            context['label'] = obj.label

        return context


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

    :template:`stocking/event_piechart_map.html`

    '''

    model = StockingEvent
    paginate_by = 200
    template_name = 'stocking/stocking_event_list.html'
    filter_class = StockingEventFilter

    def get_context_data(self, **kwargs):
        context = super(StockingEventListView, self).get_context_data(**kwargs)

        context['search_criteria'] = self.request.GET.get('q')
        jurisdiction_slug = self.kwargs.get('jurisdiction')
        lake_name = self.kwargs.get('lake_name')

        basequery = StockingEventFilter(self.request.GET,
                                        StockingEvent.objects.all()).qs

        if lake_name:
            basequery = basequery.filter(jurisdiction__lake__abbrev=lake_name)
            lake = Lake.objects.get(abbrev=lake_name)
            context['lake'] = lake

        year = self.kwargs.get('year')
        if year:
            context['year'] = int(year)
            basequery = basequery.filter(year=year)

        if jurisdiction_slug:
            basequery = basequery.filter(jurisdiction__slug=jurisdiction_slug)
            jurisdiction = Jurisdiction.objects.get(slug=jurisdiction_slug)

        context['year_list'] = basequery.\
                               values_list('year').\
                               annotate(n=Count('id')).order_by('-year')

        context['agency_list'] = basequery.\
                                   values_list('agency__abbrev').\
                                   annotate(n=Count('id')).order_by()

        context['jurisdiction_list'] = basequery.\
                                       values_list('jurisdiction__slug',
                                                   'jurisdiction__name').\
                                                   annotate(n=Count('id')).\
                                                   order_by()

        context['species_list'] = basequery.\
                                   values_list('species__abbrev',
                                               'species__common_name').\
                                   annotate(n=Count('id')).order_by()

        context['strain_list'] = basequery.\
                                 values_list(
                                     'strain_raw__strain__strain_code',
                                     'strain_raw__strain__strain_label').\
                                     annotate(n=Count('id')).order_by()

        context['lifestage_list'] = basequery.\
                                    values_list('lifestage__abbrev',
                                                'lifestage__description').\
                                                annotate(n=Count('id')).\
                                                order_by()

        context['mark_list'] = basequery.values_list('mark').\
                               annotate(n=Count('id')).\
                               order_by()

        context['stocking_method_list'] = basequery.\
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
            'jurisdiction__lake', 'species', 'lifestage', 'strain_raw__strain',
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

        filtered_list = StockingEventFilter(
            self.request.GET, queryset=queryset)

        qs = filtered_list.qs.values(
            'stock_id', 'agency__abbrev', 'jurisdiction__lake__lake_name',
            'site', 'date', 'species__common_name',
            'strain_raw__strain__strain_label', 'year_class',
            'lifestage__description', 'stocking_method__description', 'mark',
            'yreq_stocked')

        return qs


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
