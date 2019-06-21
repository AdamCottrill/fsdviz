'''
Views associated with our stocking application.
'''

from django.conf import settings
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
from .utils import form2params

def find_events(request):
    """this view will render a form that will gather stocking event
    parameters of interest to the user.  Values returned from the form
    will be used to build a URL to query those records from the
    database and plot them in an HTML template. - much like the home
    page, but not limited to a single year.

    """

    # these will give our results shorter fieldnames
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

    #lookups - to provide nice labels for dropdown menues
    lakes = Lake.objects.values_list('abbrev', 'lake_name')
    stateProv = StateProvince.objects.values_list('abbrev', 'name')
    jurisdictions = Jurisdiction.objects.values_list('slug', 'name')
    agencies = Agency.objects.all().values_list('abbrev', 'agency_name')

    # manunits
    #managementUnits = list(
    #    ManagementUnit.objects.values('slug', 'label', 'description'))

    species = Species.objects.values_list('abbrev', 'common_name')

    # Strain????
    strains = list(Strain.objects.prefetch_related('species')\
                    .annotate(**{'spc_name': F('species__common_name')})\
                    .values('id', 'spc_name', 'strain_code', 'strain_label')
                   .distinct().order_by())

    stocking_methods = StockingMethod.objects.values_list(
        'stk_meth', 'description')
    lifestages = LifeStage.objects.values_list('abbrev', 'description')

    # now make our lookups in to key-value pairs with pretty or meaningful lables:
    # most are of the form (id, 'lablel (id)')
    # passed to html template and used for form validation
    lakes = [(x[0], '{} ({})'.format(x[1], x[0])) for x in lakes]
    jurisdictions = [(x[0], x[1]) for x in jurisdictions]
    stateProv = [(x[0], '{} ({})'.format(x[1], x[0])) for x in stateProv]
    agencies = [(x[0], '{} ({})'.format(x[1], x[0])) for x in agencies]
    species = [(x[0], '{} ({})'.format(x[1], x[0])) for x in species]
    lifestages = [(x[0], '{} ({})'.format(x[1], x[0])) for x in lifestages]
    stocking_methods = [(x[0], '{} ({})'.format(x[1], x[0]))
                        for x in stocking_methods]

    # strains is more complicated because it uses id, and the label
    # includes species, strain_code and strain_label
    strains = [(str(x['id']),
                '{spc_name} - {strain_label} ({strain_code})'.format(**x))
               for x in strains]

    # if this is a POST request we need to process the form data
    if request.method == 'POST':
        # create a form instance and populate it with data from the request:
        form = FindEventsForm(request.POST)

        # the choice need to be added here so that the form can be
        # validated.
        form.fields['lake'].choices = lakes
        form.fields['stateprov'].choices = stateProv
        form.fields['jurisdiction'].choices = jurisdictions
        form.fields['agency'].choices = agencies
        form.fields['species'].choices = species
        form.fields['strain'].choices = strains
        form.fields['stocking_method'].choices = stocking_methods
        form.fields['life_stage'].choices = lifestages

        # check whether it's valid:
        if form.is_valid():
            #now we need to build our query parameters based on the
            #selcted values:
            params = form2params(form.cleaned_data)
            url = reverse('stocking:filtered-stocking-events') + params
            print('params={}'.format(params))
            print('url={}'.format(url))
            return redirect(url)

    else:

        form = FindEventsForm()

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


def filtered_events(request):
    """Get the most recent year of stockin and
    pass the information onto our annual_events view.
    """
    dataUrl = reverse('api:api-get-stocking-events')

    maxEvents = settings.MAX_FILTERED_EVENT_COUNT

    return render(request, 'stocking/found_events.html',
                          context={'dataUrl': dataUrl,
                                   'maxEvents': maxEvents})


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
