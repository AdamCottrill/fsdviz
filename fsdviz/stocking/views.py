"""
Views associated with our stocking application.
"""

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.gis.db.models import Extent
from django.db import transaction
from django.db.models import Count, Q, Min, Max, Sum, F
from django.http import HttpResponseRedirect
from django.shortcuts import redirect, render, get_object_or_404
from django.urls import reverse
from django.views.generic.base import TemplateView
from django.views.generic.detail import DetailView
from django.views.generic.list import ListView

from django.forms import formset_factory

from datetime import datetime

import json

# from uuid import uuid1

from .utils import (
    form2params,
    xls2dicts,
    get_xls_form_choices,
    get_event_model_form_choices,
    validate_upload,
    get_choices,
    get_cwt_sequence_dict,
)
from ..common.utils import toLookup, make_mu_id_lookup, make_strain_id_lookup
from ..common.forms import CWTSequenceForm, BaseCWTSequenceFormSet
from ..common.filters import CWTSequenceFilter

from ..common.models import (
    Lake,
    Jurisdiction,
    Species,
    Strain,
    StrainRaw,
    StateProvince,
    ManagementUnit,
    Agency,
    Grid10,
    CWT,
    CWTsequence,
    FinClip,
    FishTag,
    PhysChemMark,
)
from .models import StockingEvent, StockingMethod, LifeStage, Condition, DataUploadEvent
from .filters import StockingEventFilter

from .forms import FindEventsForm, FindCWTEventsForm, XlsEventForm, StockingEventForm

from ..myusers.permissions import user_can_create_edit_delete

#


def add_is_checked(values_list, urlfilter, to_str=False, replace_none=False):
    """A helper function that accepts a values list of items, and a url
    filter( query parameters) and applies a boolean to each item in
    the item list indicating whether or not that element is selected
    in the current request.  Used by list views to add checkbox boxes
    to refine selections.

    Arguments:
    - `items`: - queryset values_list of items for checkboxes
    - `url_filter`: - url query parameters associated with this category

    """

    if urlfilter:
        my_filter = urlfilter.split(",")
        if replace_none:
            # these values will be replaced if they appear in our url filter:
            replacements = {"99": "None"}
            my_filter = [replacements.get(x, x) for x in my_filter]
        values_list = [list(x) for x in values_list]
        for item in values_list:
            item.append(str(item[0]) in my_filter)
    return values_list


def find_events(request):
    """this view will render a form that will gather stocking event
    parameters of interest to the user.  Values returned from the form
    will be used to build a URL to query those records from the
    database and plot them in an HTML template. - much like the home
    page, but not limited to a single year.

    """

    # these will give our results shorter fieldnames
    field_aliases = {
        "agency_code": F("agency__abbrev"),
        "spc": F("species__abbrev"),
        "strain": F("strain_raw__strain"),
        "stage": F("lifestage__abbrev"),
        "method": F("stocking_method__stk_meth"),
        "manUnit": F("management_unit__slug"),
        "jurisd": F("jurisdiction__slug"),
        "lake": F("jurisdiction__lake__abbrev"),
        "state": F("jurisdiction__stateprov__abbrev"),
    }

    # use our shorter field names in the list of fields to select:
    fields = [
        "year",
        "month",
        "mark",
        "agency_code",
        "spc",
        "strain",
        "stage",
        "method",
        "manUnit",
        "jurisd",
        "lake",
        "state",
    ]

    related_tables = [
        "jurisdiction",
        "agency",
        "species",
        "strain",
        "lifestage",
        "stocking_method",
        "managementunit",
        "jurisdition__lake",
        "jurisdiction__stateprov",
    ]

    counts = {"events": Count("id")}

    values = list(
        StockingEvent.objects.select_related(*related_tables)
        .annotate(**field_aliases)
        .filter(management_unit__primary=True)
        .distinct()
        .values(*fields)
        .order_by()
        .annotate(**counts)
    )

    # lookups - to provide nice labels for dropdown menues
    lakes = Lake.objects.values_list("abbrev", "lake_name")
    stateProv = StateProvince.objects.values_list("abbrev", "name")
    jurisdictions = Jurisdiction.objects.values_list("slug", "name")
    agencies = Agency.objects.all().values_list("abbrev", "agency_name")

    # manunits
    # managementUnits = list(
    #    ManagementUnit.objects.values('slug', 'label', 'description'))

    species = Species.objects.values_list("abbrev", "common_name")

    # Strain????
    strains = list(
        Strain.objects.prefetch_related("species")
        .annotate(**{"spc_name": F("species__common_name")})
        .values("id", "spc_name", "strain_code", "strain_label")
        .distinct()
        .order_by()
    )

    stocking_methods = StockingMethod.objects.values_list("stk_meth", "description")
    lifestages = LifeStage.objects.values_list("abbrev", "description")

    # now make our lookups in to key-value pairs with pretty or meaningful lables:
    # most are of the form (id, 'lablel (id)')
    # passed to html template and used for form validation
    lakes = [(x[0], "{} ({})".format(x[1], x[0])) for x in lakes]
    jurisdictions = [(x[0], x[1]) for x in jurisdictions]
    stateProv = [(x[0], "{} ({})".format(x[1], x[0])) for x in stateProv]
    agencies = [(x[0], "{} ({})".format(x[1], x[0])) for x in agencies]
    species = [(x[0], "{} ({})".format(x[1], x[0])) for x in species]
    lifestages = [(x[0], "{} ({})".format(x[1], x[0])) for x in lifestages]
    stocking_methods = [(x[0], "{} ({})".format(x[1], x[0])) for x in stocking_methods]

    # strains is more complicated because it uses id, and the label
    # includes species, strain_code and strain_label
    strains = [
        (str(x["id"]), "{spc_name} - {strain_label} ({strain_code})".format(**x))
        for x in strains
    ]

    # if this is a POST request we need to process the form data
    if request.method == "POST":
        # create a form instance and populate it with data from the request:
        form = FindEventsForm(request.POST)

        # roi = form.cleaned_data["roi"][0]
        # if roi.geom_type == "LinearRing":
        #     roi = Polygon(roi)

        # the choice need to be added here so that the form can be
        # validated.
        form.fields["lake"].choices = lakes
        form.fields["stateprov"].choices = stateProv
        form.fields["jurisdiction"].choices = jurisdictions
        form.fields["agency"].choices = agencies
        form.fields["species"].choices = species
        form.fields["strain"].choices = strains
        form.fields["stocking_method"].choices = stocking_methods
        form.fields["life_stage"].choices = lifestages

        # check whether it's valid:
        if form.is_valid():
            # now we need to build our query parameters based on the
            # selcted values:
            params = form2params(form.cleaned_data)
            url = reverse("stocking:filtered-stocking-events") + params
            return redirect(url)

    else:

        form = FindEventsForm()

    return render(
        request,
        "stocking/find_events_form.html",
        {
            "form": form,
            "values": json.dumps(values),
            "lakes": json.dumps(lakes),
            "agencies": json.dumps(agencies),
            "stateProv": json.dumps(stateProv),
            "jurisdictions": json.dumps(jurisdictions),
            #'management_units': json.dumps(managementUnits),
            "species": json.dumps(species),
            "strains": json.dumps(strains),
            "lifestages": json.dumps(lifestages),
            "stocking_methods": json.dumps(stocking_methods),
        },
    )


def filtered_events(request):
    """Get the most recent year of stocking and
    pass the information onto our annual_events view.
    """
    dataUrl = reverse("api:api-get-stocking-events")

    maxEvents = settings.MAX_FILTERED_EVENT_COUNT

    return render(
        request,
        "stocking/found_events.html",
        context={"dataUrl": dataUrl, "maxEvents": maxEvents},
    )


def find_cwt_events(request):
    """this view will render a form that will gather stocking event
    parameters of interest to the user from stocking events associated
    with cwts.  Values returned from the form will be used to build a
    URL to query those records from the database and plot them in an
    HTML template. This view is very similar to stocking events form,
    but is limited to events with cwts and includes filters/widgets
    that are specific to cwt attributes.
    """

    # need to add widgets for cwt attributes:
    # cwt_number(s)
    # tag_type
    # reused?
    # manucturer

    # these will give our results shorter fieldnames
    field_aliases = {
        "agency_code": F("agency__abbrev"),
        "spc": F("species__abbrev"),
        "strain": F("strain_raw__strain"),
        "stage": F("lifestage__abbrev"),
        "method": F("stocking_method__stk_meth"),
        "manUnit": F("management_unit__slug"),
        "jurisd": F("jurisdiction__slug"),
        "lake": F("jurisdiction__lake__abbrev"),
        "state": F("jurisdiction__stateprov__abbrev"),
    }

    # use our shorter field names in the list of fields to select:
    fields = [
        "year",
        "month",
        "mark",
        "agency_code",
        "spc",
        "strain",
        "stage",
        "method",
        "manUnit",
        "jurisd",
        "lake",
        "state",
    ]

    related_tables = [
        "jurisdiction",
        "agency",
        "species",
        "strain",
        "lifestage",
        "stocking_method",
        "managementunit",
        "jurisdition__lake",
        "jurisdiction__stateprov",
    ]

    counts = {"events": Count("id")}

    values = list(
        StockingEvent.objects.filter(cwt_series__cwt__cwt_number__isnull=False)
        .select_related(*related_tables)
        .annotate(**field_aliases)
        .filter(management_unit__primary=True)
        .distinct()
        .values(*fields)
        .order_by()
        .annotate(**counts)
    )

    # lookups - to provide nice labels for dropdown menues
    lakes = Lake.objects.values_list("abbrev", "lake_name")
    stateProv = StateProvince.objects.values_list("abbrev", "name")
    jurisdictions = Jurisdiction.objects.values_list("slug", "name")
    agencies = Agency.objects.all().values_list("abbrev", "agency_name")

    # manunits
    # managementUnits = list(
    #    ManagementUnit.objects.values('slug', 'label', 'description'))

    species = Species.objects.values_list("abbrev", "common_name")

    # Strain????
    strains = list(
        Strain.objects.prefetch_related("species")
        .annotate(**{"spc_name": F("species__common_name")})
        .values("id", "spc_name", "strain_code", "strain_label")
        .distinct()
        .order_by()
    )

    stocking_methods = StockingMethod.objects.values_list("stk_meth", "description")
    lifestages = LifeStage.objects.values_list("abbrev", "description")

    # now make our lookups in to key-value pairs with pretty or meaningful lables:
    # most are of the form (id, 'lablel (id)')
    # passed to html template and used for form validation
    lakes = [(x[0], "{} ({})".format(x[1], x[0])) for x in lakes]
    jurisdictions = [(x[0], x[1]) for x in jurisdictions]
    stateProv = [(x[0], "{} ({})".format(x[1], x[0])) for x in stateProv]
    agencies = [(x[0], "{} ({})".format(x[1], x[0])) for x in agencies]
    species = [(x[0], "{} ({})".format(x[1], x[0])) for x in species]
    lifestages = [(x[0], "{} ({})".format(x[1], x[0])) for x in lifestages]
    stocking_methods = [(x[0], "{} ({})".format(x[1], x[0])) for x in stocking_methods]

    # strains is more complicated because it uses id, and the label
    # includes species, strain_code and strain_label
    strains = [
        (str(x["id"]), "{spc_name} - {strain_label} ({strain_code})".format(**x))
        for x in strains
    ]

    # if this is a POST request we need to process the form data
    if request.method == "POST":
        # create a form instance and populate it with data from the request:
        form = FindCWTEventsForm(request.POST)

        # roi = form.cleaned_data["roi"][0]
        # if roi.geom_type == "LinearRing":
        #     roi = Polygon(roi)

        # the choice need to be added here so that the form can be
        # validated.
        form.fields["lake"].choices = lakes
        form.fields["stateprov"].choices = stateProv
        form.fields["jurisdiction"].choices = jurisdictions
        form.fields["agency"].choices = agencies
        form.fields["species"].choices = species
        form.fields["strain"].choices = strains
        form.fields["stocking_method"].choices = stocking_methods
        form.fields["life_stage"].choices = lifestages

        # check whether it's valid:
        if form.is_valid():
            # now we need to build our query parameters based on the
            # selcted values:
            params = form2params(form.cleaned_data)
            url = reverse("stocking:filtered-cwt-stocking-events") + params
            return redirect(url)

    else:

        form = FindCWTEventsForm()

    return render(
        request,
        "stocking/find_cwt_events_form.html",
        {
            "form": form,
            "values": json.dumps(values),
            "lakes": json.dumps(lakes),
            "agencies": json.dumps(agencies),
            "stateProv": json.dumps(stateProv),
            "jurisdictions": json.dumps(jurisdictions),
            #'management_units': json.dumps(managementUnits),
            "species": json.dumps(species),
            "strains": json.dumps(strains),
            "lifestages": json.dumps(lifestages),
            "stocking_methods": json.dumps(stocking_methods),
        },
    )


def filtered_cwt_events(request):
    """Get the most recent year of stocking and
    pass the information onto our annual_events view.
    """
    # dataUrl = reverse("api:api-get-cwt-stocking-events")

    # maxEvents = settings.MAX_FILTERED_EVENT_COUNT

    field_aliases = {
        "cwt_number": F("cwt_series__cwt__cwt_number"),
        "tag_type": F("cwt_series__cwt__tag_type"),
        "manufacturer": F("cwt_series__cwt__manufacturer"),
        "clipcode": F("clip_code__clip_code"),
        "agency_code": F("agency__abbrev"),
        "spc": F("species__abbrev"),
        "strain": F("strain_raw__strain__strain_label"),
        "stage": F("lifestage__description"),
        "method": F("stocking_method__description"),
        "jurisd": F("jurisdiction__slug"),
        "lake": F("jurisdiction__lake__abbrev"),
        "state": F("jurisdiction__stateprov__abbrev"),
    }

    # use our shorter field names in the list of fields to select:
    fields = [
        "stock_id",
        "cwt_number",
        "tag_type",
        "manufacturer",
        "year",
        "year_class",
        "mark",
        "clipcode",
        "agency_code",
        "spc",
        "strain",
        "stage",
        "method",
        "jurisd",
        "lake",
        "state",
    ]

    related_tables = [
        "cwt",
        "cwt_series",
        "jurisdiction",
        "agency",
        "species",
        "strain",
        "lifestage",
        "stocking_method",
        "jurisdiction__lake",
        "jurisdiction__stateprov",
    ]

    counts = {"events": Count("stock_id")}

    queryset = StockingEvent.objects.filter(
        cwt_series__cwt__cwt_number__isnull=False
    ).select_related(*related_tables)

    filtered_list = StockingEventFilter(request.GET, queryset=queryset).qs

    object_list = list(
        filtered_list.annotate(**field_aliases)
        .values(*fields)
        .order_by()
        .annotate(**counts)
    )

    return render(
        request,
        "stocking/found_cwt_events.html",
        context={
            # "dataUrl": dataUrl,
            # "maxEvents": maxEvents,
            "object_list": object_list,
        },
    )


def StockingEventListLatestYear(request):
    """Get the most recent year of stockin and
    pass the information onto our annual_events view.
    """

    latest_year = StockingEvent.objects.all().aggregate(Max("year"))
    url = reverse(
        "stocking:stocking-event-list-year",
        kwargs={"year": latest_year.get("year__max")},
    )

    return redirect(url)


def PieChartMapViewLatestYear(request):
    """Get the most recent year of stockind and
    pass the information onto our pie chart map view.
    """
    latest_year = StockingEvent.objects.all().aggregate(Max("year"))
    url = reverse(
        "stocking:stocking-events-year", kwargs={"year": latest_year.get("year__max")}
    )

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

    ``label`` - the slug selected lake, jurisdiction, or management unit


    ``year_range``

       the maximum and minimum year of the stocking events with the
       same criteria as the selected queryset

    """

    template_name = "stocking/event_piechart_map.html"

    def get_context_data(self, **kwargs):
        context = super(PieChartMapView, self).get_context_data(**kwargs)

        spatialUnit = "basin"
        obj = None

        year_range = StockingEvent.objects.all()

        year = self.kwargs.get("year")

        if year:
            view_name = "stocking_api:api-stocking-event-map-list-year"
            dataUrl = reverse(view_name, kwargs={"year": year})
            context["year"] = int(year)

        lake_name = self.kwargs.get("lake_name")
        if lake_name:
            dataUrl = reverse(
                "stocking_api:api-stocking-event-map-list-lake-year",
                kwargs={"year": year, "lake_name": lake_name},
            )
            spatialUnit = "lake"
            obj = Lake.objects.get(abbrev=lake_name)
            year_range = year_range.filter(jurisdiction__lake__lake_abbrev=lake_name)

        jurisdiction_slug = self.kwargs.get("jurisdiction")
        if jurisdiction_slug:
            dataUrl = reverse(
                "stocking_api:api-stocking-event-map-list-jurisdiction-year",
                kwargs={"year": year, "jurisdiction": jurisdiction_slug},
            )
            spatialUnit = "jurisdiction"
            obj = Jurisdiction.objects.get(slug=jurisdiction_slug)

            year_range = year_range.filter(jurisdiction__slug=jurisdiction_slug)

        #        slug = self.kwargs.get('management_unit')
        #        if manUnit_slug:
        #            spatialUnit = 'manUnit'
        #            obj = ManagementUnit.objects.get(slug=slug)

        context["dataUrl"] = dataUrl
        context["spatialUnit"] = spatialUnit
        context["year_range"] = year_range.aggregate(
            first_year=Min("year"), last_year=Max("year")
        )

        if obj:
            context["slug"] = obj.slug
            context["label"] = obj.label

        return context


class StockingEventListView(ListView):
    """
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

    """

    model = StockingEvent
    paginate_by = 200
    template_name = "stocking/stocking_event_list.html"
    filter_class = StockingEventFilter

    def get_context_data(self, **kwargs):
        context = super(StockingEventListView, self).get_context_data(**kwargs)

        filters = self.request.GET
        context["filters"] = filters
        search_q = self.request.GET.get("q")
        context["search_criteria"] = search_q

        basequery = StockingEventFilter(
            self.request.GET, StockingEvent.objects.all()
        ).qs

        # add the contains filter to make sure our tallies are right
        if search_q:
            basequery = basequery.filter(
                Q(stock_id__icontains=search_q) | Q(notes__icontains=search_q)
            )

        lake_list = (
            basequery.values_list(
                "jurisdiction__lake__abbrev", "jurisdiction__lake__lake_name"
            )
            .annotate(n=Count("id"))
            .order_by("jurisdiction__lake__lake_name")
        )

        context["lake_list"] = add_is_checked(lake_list, filters.get("lake"))

        stateprov_list = (
            basequery.values_list(
                "jurisdiction__stateprov__abbrev",
                "jurisdiction__stateprov__name",
            )
            .annotate(n=Count("id"))
            .order_by("jurisdiction__stateprov__abbrev")
        )

        context["stateprov_list"] = add_is_checked(
            stateprov_list, filters.get("stateprov")
        )

        jurisdiction_list = (
            basequery.values_list("jurisdiction__slug", "jurisdiction__name")
            .annotate(n=Count("id"))
            .order_by("jurisdiction__slug")
        )

        context["jurisdiction_list"] = add_is_checked(
            jurisdiction_list, filters.get("jurisdiction")
        )

        agency_list = (
            basequery.values_list("agency__abbrev", "agency__agency_name")
            .annotate(n=Count("id"))
            .order_by("agency__abbrev")
        )

        context["agency_list"] = add_is_checked(agency_list, filters.get("agency"))

        species_list = (
            basequery.values_list("species__abbrev", "species__common_name")
            .annotate(n=Count("id"))
            .order_by("species__common_name")
        )

        context["species_list"] = add_is_checked(species_list, filters.get("species"))

        strain_list = (
            basequery.values_list(
                "strain_raw__strain__strain_code", "strain_raw__strain__strain_label"
            )
            .annotate(n=Count("id"))
            .order_by("strain_raw__strain__strain_label")
        )

        context["strain_list"] = add_is_checked(strain_list, filters.get("strain_name"))

        year_class_list = (
            basequery.values_list("year_class")
            .annotate(n=Count("id"))
            .order_by("-year_class")
        )

        context["year_class_list"] = add_is_checked(
            year_class_list, filters.get("year_class"), True, True
        )

        lifestage_list = (
            basequery.values_list("lifestage__abbrev", "lifestage__description")
            .annotate(n=Count("id"))
            .order_by("lifestage__description")
        )

        context["lifestage_list"] = add_is_checked(
            lifestage_list, filters.get("lifestage")
        )

        clip_code_list = (
            basequery.values_list("clip_code__clip_code", "clip_code__description")
            .annotate(n=Count("id"))
            .order_by("clip_code__clip_code")
        )

        context["clip_code_list"] = add_is_checked(
            clip_code_list, filters.get("clip_code")
        )

        stocking_month_list = (
            basequery.values_list("month").annotate(n=Count("id")).order_by("month")
        )

        context["stocking_month_list"] = add_is_checked(
            stocking_month_list, filters.get("stocking_month"), True, True
        )

        stocking_method_list = (
            basequery.values_list(
                "stocking_method__stk_meth", "stocking_method__description"
            )
            .annotate(n=Count("id"))
            .order_by("stocking_method__description")
        )

        context["stocking_method_list"] = add_is_checked(
            stocking_method_list, filters.get("stocking_method")
        )

        hatchery_list = (
            basequery.values_list("hatchery__abbrev", "hatchery__hatchery_name")
            .annotate(n=Count("id"))
            .order_by("hatchery__abbrev")
        )

        context["hatchery_list"] = add_is_checked(
            hatchery_list, filters.get("hatchery")
        )

        # finclips, tags, and phys_chem_marks are slightly different as
        # they are many-to-many relationships we need filter the
        # 'many' side using the stocking events in our current base
        # query and then tally up the results and add a boolean
        # indicating whether or not each clip has already been
        # selected with the current filters:

        finclip_list = (
            FinClip.objects.filter(stocking_events__in=basequery)
            .values_list("abbrev", "description")
            .annotate(n=Count("stocking_events__id"))
            .order_by("abbrev")
        )

        finclip_list = add_is_checked(finclip_list, filters.get("finclips"))
        context["finclip_list"] = finclip_list

        fishtags_list = (
            FishTag.objects.filter(stocking_events__in=basequery)
            .values_list("tag_code", "description")
            .annotate(n=Count("stocking_events__id"))
            .order_by("tag_code")
        )

        context["fishtags_list"] = add_is_checked(
            fishtags_list, filters.get("fishtags")
        )

        physchem_marks_list = (
            PhysChemMark.objects.filter(stocking_events__in=basequery)
            .values_list("mark_code", "description")
            .annotate(n=Count("stocking_events__id"))
            .order_by("mark_code")
        )

        context["physchem_marks_list"] = add_is_checked(
            physchem_marks_list, filters.get("physchem_marks")
        )

        return context

    def get_queryset(self):

        # get the value of q from the request kwargs
        search_q = self.request.GET.get("q")

        queryset = StockingEvent.objects.all()

        queryset = queryset.select_related(
            "agency",
            "jurisdiction",
            "jurisdiction__stateprov",
            "jurisdiction__lake",
            "species",
            "lifestage",
            "strain_raw__strain",
            "stocking_method",
        )

        if search_q:
            queryset = queryset.filter(
                Q(stock_id__icontains=search_q) | Q(notes__icontains=search_q)
            )

        filtered_list = StockingEventFilter(self.request.GET, queryset=queryset)

        qs = filtered_list.qs.values(
            "stock_id",
            "agency__abbrev",
            "jurisdiction__lake__lake_name",
            "site",
            "date",
            "species__common_name",
            "strain_raw__strain__strain_label",
            "year_class",
            "lifestage__description",
            "stocking_method__description",
            "mark",
            "clip_code__clip_code",
            "yreq_stocked",
        )

        return qs


class StockingEventDetailView(DetailView):
    """

    **Context**

    ``object``
        A :model:`stocking.StockingEvent` instance.

    **Template:**

    :template:`stocking/stocking_detail.html`

    """

    model = StockingEvent
    template_name = "stocking/stocking_detail.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["can_edit"] = user_can_create_edit_delete(
            self.request.user, self.get_object()
        )

        return context

    def get_object(self):

        stock_id = self.kwargs.get("stock_id")
        qs = StockingEvent.objects.select_related(
            "species",
            "agency",
            "hatchery",
            "strain_raw",
            "grid_10",
            "grid_10__lake",
            "management_unit",
            "jurisdiction",
            "jurisdiction__stateprov",
            "stocking_method",
            "lifestage",
            "condition",
        )

        event = get_object_or_404(qs, stock_id=stock_id)
        return event


@login_required
def upload_events(request):
    """A view to process data uploads.  It will be only available to logged in users.

    The uploaded file will be check for validity with cerberus - if it
    looks like it has the correct shape, the data will be passed to a
    stocking event formset, that will allow final editing and form
    validation. Once submitted, the stocking event objects will be
    created.

    Only new stocking model objects can be created for now. An
    extension will be to allow users to bulk edit rrecords - as long
    as the stock_id number can be matched back to the original record.

    """

    # data = {}
    maxEvents = settings.MAX_UPLOAD_EVENT_COUNT

    if request.method == "GET":
        return render(
            request, "stocking/upload_stocking_events.html", {"maxEvents": maxEvents}
        )

    try:
        data_file = request.FILES["data_file"]
        if not (data_file.name.endswith(".xlsx") or data_file.name.endswith(".xls")):
            msg = "Choosen file is not an Excel (*.xls or *.xlsx) file!"
            messages.error(request, msg)
            return HttpResponseRedirect(reverse("stocking:upload-stocking-events"))
        # if file is too large, return
        if data_file.multiple_chunks():
            filesize = data_file.size / (1000 * 1000)
            msg = "Uploaded file is too big ({.2f} MB).".format(filesize)
            messages.error(request, msg)
            return HttpResponseRedirect(reverse("stocking:upload-stocking-events"))

        xls_events = xls2dicts(data_file)

        valid, msg = validate_upload(xls_events, request.user)
        if not valid:
            messages.error(request, msg)
            return HttpResponseRedirect(reverse("stocking:upload-stocking-events"))

        # xls_errors = validate_events(xls_events)
        request.session["data"] = xls_events
        # request.session["errors"] = xls_errors

        return HttpResponseRedirect(reverse("stocking:xls-events-form"))

    except Exception as e:
        messages.error(request, "Unable to upload file. " + repr(e))
        return HttpResponseRedirect(reverse("stocking:upload-stocking-events"))


def xls_events(request):
    """This function is the workhorse of the data upload.  On a get
    request it gets the excel data from the session, along with all of the
    associated lookup values.

        Arguments:
        - `request`:

    """

    EventFormSet = formset_factory(XlsEventForm, extra=0)
    formset_errors = {}
    choices = get_choices()

    event_count = 0

    if request.method == "POST":

        formset = EventFormSet(request.POST, form_kwargs={"choices": choices})
        event_count = formset.total_form_count()
        if formset.is_valid():

            # create our lookup dicts that relate abbrev to django objects -
            # we will need them for our front end validation and for
            # processing the submitted form:

            # TODO: lakes and agency not needed - already limited to 1 each.
            lakes = Lake.objects.values_list("id", "abbrev")
            lake_id_lookup = toLookup(lakes)
            agencies = Agency.objects.all().values_list("id", "abbrev")
            agency_id_lookup = toLookup(agencies)

            stateProvinces = StateProvince.objects.values_list("id", "abbrev")
            stateProv_id_lookup = toLookup(stateProvinces)

            mus = ManagementUnit.objects.values_list(
                "id", "slug", "lake__abbrev", "label"
            )
            mu_id_lookup = make_mu_id_lookup(mus)

            lakeStates = [x for x in Jurisdiction.objects.values_list("id", "slug")]
            lakeState_id_lookup = toLookup(lakeStates)

            grids = Grid10.objects.values_list("id", "slug")
            grid_id_lookup = toLookup(grids)

            species = Species.objects.values_list("id", "abbrev")
            species_id_lookup = toLookup(species)

            strains = StrainRaw.objects.values_list(
                "id", "species__abbrev", "strain__strain_code"
            )
            strain_id_lookup = make_strain_id_lookup(strains)

            stocking_methods = StockingMethod.objects.values_list("id", "stk_meth")
            stocking_method_id_lookup = toLookup(stocking_methods)

            conditions = Condition.objects.values_list("id", "condition")
            condition_id_lookup = toLookup(conditions)

            lifestages = LifeStage.objects.values_list("id", "abbrev")
            lifestage_id_lookup = toLookup(lifestages)

            with transaction.atomic():

                # get values for for lake and agency from first row:
                lake_abbrev = formset.data.get("form-0-lake", "HU")
                agency_abbrev = formset.data.get("form-0-agency", "USFWS")

                data_upload_event = DataUploadEvent(
                    uploaded_by=request.user,
                    lake_id=lake_abbrev,
                    agency_id=agency_abbrev,
                )
                data_upload_event.save()

                events = []
                for form in formset:
                    data = form.cleaned_data
                    lake_abbrev = data.pop("lake")
                    agency_abbrev = data.pop("agency")
                    agency = agency_id_lookup[agency_abbrev]
                    spc_abbrev = data.pop("species")
                    species = species_id_lookup[spc_abbrev]
                    lifestage = lifestage_id_lookup[data.pop("stage")]
                    stocking_method = stocking_method_id_lookup[data.pop("stock_meth")]
                    condition = condition_id_lookup[int(data.pop("condition"))]
                    grid_slug = "{}_{}".format(lake_abbrev.lower(), data.pop("grid"))
                    grid = grid_id_lookup[grid_slug]

                    stat_dist = data.pop("stat_dist")
                    mu = mu_id_lookup.get(lake_abbrev).get(stat_dist)

                    lakeState_slug = "{}_{}".format(
                        lake_abbrev.lower(), data.pop("state_prov").lower()
                    )
                    lakeState = lakeState_id_lookup[lakeState_slug]

                    strain_label = data.pop("strain")
                    strain_id = strain_id_lookup.get(spc_abbrev).get(strain_label)

                    if data.get("day") and data.get("month"):
                        event_date = None
                        try:
                            event_date = datetime(
                                data.get("year"),
                                int(data.get("month", "0")),
                                int(data.get("day", "0")),
                            )
                        except ValueError:
                            pass
                        if event_date:
                            data["date"] = event_date

                    # ForeigmKeyFields
                    data["agency_id"] = agency
                    data["lifestage_id"] = lifestage
                    data["stocking_method_id"] = stocking_method
                    data["grid_10_id"] = grid
                    data["management_unit_id"] = mu
                    data["species_id"] = species
                    data["strain_raw_id"] = strain_id
                    data["jurisdiction_id"] = lakeState
                    data["condition_id"] = condition

                    data["upload_event"] = data_upload_event

                    # rename some of our fields (this is not very elegant,
                    # but works for now)
                    data["dd_lat"] = data.pop("latitude")
                    data["dd_lon"] = data.pop("longitude")
                    data["lotcode"] = data.pop("lot_code")

                    # this needs to be calcualted based on species, lifestage, and ...
                    data["yreq_stocked"] = data.get("no_stocked")

                    # this is also not right - just getting it to work ...
                    data["latlong_flag_id"] = 1

                    event = StockingEvent(**data)
                    event.save()

                url = data_upload_event.get_absolute_url()
                return HttpResponseRedirect(url)
        else:
            # not valid
            # formset_errors = get_formset_errors(formset)

            # we need a dictionary of errors keyed by field name
            prefix = "id_form-{}-{}"
            for i, form in enumerate(formset):
                for key, val in form.errors.items():
                    formset_errors[prefix.format(i, key)] = val

    else:
        # get the data from our session
        xls_events = request.session.get("data", {})
        event_count = len(xls_events)

        # TODO - this needs to be limited to a single lake ange agency
        lake = Lake.objects.get(abbrev=xls_events[0].get("lake"))
        agency = Agency.objects.get(abbrev=xls_events[0].get("agency"))

        mu_grids = (
            ManagementUnit.objects.filter(lake=lake, mu_type="stat_dist")
            .select_related("grid10s")
            .order_by("label", "grid10s__grid")
            .values_list("label", "grid10s__grid")
        )
        # get points and valid stocking events in our upload"
        #

        formset = EventFormSet(initial=xls_events, form_kwargs={"choices": choices})

    return render(
        request,
        "stocking/xls_events_form.html",
        {
            "formset": formset,
            "event_count": event_count,
            "formset_errors": formset_errors,
            "mu_grids": list(mu_grids),
            "lake": lake,
            "agency": agency
            # "lakes": lake_id_lookup,
            # "agencies": agency_id_lookup,
            # "stateprovs": stateProv_id_lookup,
            # "species": species_id_lookup,
            # "stocking_method": stocking_method_id_lookup,
            # "condition": condition_id_lookup,
            # "lifestage": lifestage_id_lookup,
            # "grids": grid_id_lookup,
            # "mus": mu_id_lookup,
            # "lakeState": lakeState_id_lookup,
            # "strains": strain_id_lookup,
        },
    )


@login_required
def edit_stocking_event(request, stock_id):
    """A view that will present a form that will allow authorized users to
    edit the attibutes of a stocking event."""

    event = get_object_or_404(StockingEvent, stock_id=stock_id)

    if user_can_create_edit_delete(request.user, event) is False:
        return HttpResponseRedirect(
            reverse(
                "stocking:stocking-event-detail", kwargs={"stock_id": event.stock_id}
            )
        )

    has_cwts = True if event.cwt_series.count() else False
    choices = get_event_model_form_choices(event)

    CWTSequenceFormSet = formset_factory(
        CWTSequenceForm, formset=BaseCWTSequenceFormSet, extra=0, max_num=50
    )

    if request.method == "POST":

        # for k, v in request.POST.items():
        #     print("{}={}".format(k, v))

        cwt_formset = CWTSequenceFormSet(
            request.POST, request.FILES, prefix="cwtseries"
        )

        if cwt_formset.is_valid():
            formset_data = [x for x in cwt_formset.cleaned_data if not x.get("delete")]
            form = StockingEventForm(
                request.POST,
                choices=choices,
                cwt_formset=formset_data,
                has_cwts=has_cwts,
            )
        else:
            form = StockingEventForm(
                request.POST,
                choices=choices,
                has_cwts=has_cwts
                # cwt_formset=cwt_formset.cleaned_data,
            )

        if form.is_valid() and cwt_formset.is_valid():
            event = form.save()

            url = event.get_absolute_url()
            return HttpResponseRedirect(url)

    else:
        # covert our event object to a dictionary and add some
        # additional attributes we will need in the form:
        event_dict = event.__dict__
        event_dict["lake_id"] = event.lake.id
        event_dict["state_prov_id"] = event.stateprov.id
        # add our many-to-many fields too - they aren't included in our dict by default:
        event_dict["fin_clips"] = [x.abbrev for x in event.fin_clips.all()]
        event_dict["fish_tags"] = [x.tag_code for x in event.fish_tags.all()]
        event_dict["physchem_marks"] = [x.id for x in event.physchem_marks.all()]

        # cwt_data = {}
        cwt_dict = get_cwt_sequence_dict(event)
        cwt_formset = CWTSequenceFormSet(initial=cwt_dict, prefix="cwtseries")

        form = StockingEventForm(
            event_dict, choices=choices, has_cwts=has_cwts, cwt_formset=cwt_formset
        )

    return render(
        request,
        "stocking/stocking_event_form.html",
        {
            "form": form,
            "cwt_formset": cwt_formset,
            "stock_id": stock_id,
            "lake": event.lake,
            "has_cwts": has_cwts,
        },
    )


class DataUploadEventDetailView(LoginRequiredMixin, UserPassesTestMixin, DetailView):
    """

    **Context**

    ``object``
        A :model:`stocking.DataUploadEvent` instance.

    **Template:**

    :template:`stocking/upload_event_detail.html`

    """

    model = DataUploadEvent
    template_name = "stocking/upload_event_detail.html"

    def test_func(self):
        """Verify that the user can access this element (they are a great
        lakes coordinator, or the stocking coordinator foe the lake and
        stocking agency).

        Arguments:
        - `self`:

        """
        user = self.request.user
        item = self.get_object()
        return user_can_create_edit_delete(user, item)

    def handle_no_permission(self):
        """If the user is logged in, but cannot access the item, send them to
        the default home page, if they are not logged in, send them to
        the login page.

        """
        if self.request.user.is_authenticated:
            return redirect("home")
        else:
            return redirect("login")

    def get_context_data(self, **kwargs):
        """add our associated stocking events to the context"""

        context = super(DataUploadEventDetailView, self).get_context_data(**kwargs)

        context["events"] = StockingEvent.objects.filter(
            upload_event=self.get_object()
        ).select_related(
            "species", "lifestage", "strain_raw__strain", "stocking_method"
        )

        return context


class DataUploadEventListView(LoginRequiredMixin, ListView):
    """
    A generic list view that is used to display a list of upload events
    events.

    **Context**

    ``object_list``
        An list of :model:`stocking.DataUploadEvent` instances.

    **Template:**

    :template:`stocking/upload_event_list.html`

    """

    model = DataUploadEvent
    paginate_by = 100
    template_name = "stocking/upload_event_list.html"

    def get(self, *args, **kwargs):
        if self.request.user.role not in ["glsc", "asc"]:
            return redirect("home")
        return super(DataUploadEventListView, self).get(*args, **kwargs)

    def get_queryset(self):

        queryset = (
            DataUploadEvent.objects.prefetch_related("stocking_events__species")
            .annotate(
                event_count=Count("stocking_events"),
                total_stocked=Sum("stocking_events__no_stocked"),
            )
            .order_by("-timestamp")
            .all()
        )

        if self.request.user.role != "glsc":
            user = self.request.user
            queryset = queryset.filter(lake__in=user.lakes.all(), agency=user.agency)

        return queryset


class CWTListView(ListView):
    """A generic list view that is used to display a list of cwts.
    CWTFilter is used to filter the seleted records.

    **Context**

    ``object_list``
        An list of :model:`stocking.StockingEvent` instances that
        satifity the lake and year parameters from the url and the
        current filter as speficied in query string (e.g. ?species=LAT).

    **Template:**

    :template:`stocking/cwt_list.html`

    """

    model = StockingEvent
    paginate_by = 200
    template_name = "stocking/cwt_list.html"
    filter_class = StockingEventFilter

    def get_context_data(self, **kwargs):
        context = super(CWTListView, self).get_context_data(**kwargs)

        filters = self.request.GET
        context["filters"] = filters
        contains = self.request.GET.get("contains")
        context["contains_criteria"] = contains

        # only inlude stocking events with a cwt number:
        basequery = StockingEventFilter(
            self.request.GET,
            StockingEvent.objects.filter(cwt_series__cwt__cwt_number__isnull=False),
        ).qs

        if contains:
            basequery = basequery.filter(
                cwt_series__cwt__cwt_number__icontains=contains.replace("-", "")
            )

        cwt_type_list = (
            basequery.values_list("cwt_series__cwt__tag_type")
            .annotate(n=Count("stock_id"))
            .order_by()
        )
        # cwt type and manufacturer require us to get the choices from the model object
        # rather than the queryset:
        tmp = add_is_checked(cwt_type_list, filters.get("tag_type"))
        choices = {x[0]: x[1] for x in CWT.TAG_TYPE_CHOICES}
        context["cwt_type_list"] = [(x[0], choices.get(x[0]), x[1]) for x in tmp]

        cwt_manufacturer_list = (
            basequery.values_list("cwt_series__cwt__manufacturer")
            .annotate(n=Count("stock_id"))
            .order_by()
        )

        tmp = add_is_checked(cwt_manufacturer_list, filters.get("manufacturer"))
        choices = {x[0]: x[1] for x in CWT.TAG_MANUFACTURER_CHOICES}

        context["cwt_manufacturer_list"] = [
            (x[0], choices.get(x[0]), x[1]) for x in tmp
        ]

        lake_list = (
            basequery.values_list(
                "jurisdiction__lake__abbrev",
                "jurisdiction__lake__lake_name",
            )
            .annotate(n=Count("stock_id"))
            .order_by("jurisdiction__lake__lake_name")
        )

        context["lake_list"] = add_is_checked(lake_list, filters.get("lake"))

        stateprov_list = (
            basequery.values_list(
                "jurisdiction__stateprov__abbrev",
                "jurisdiction__stateprov__name",
            )
            .annotate(n=Count("stock_id"))
            .order_by("jurisdiction__stateprov__abbrev")
        )

        context["stateprov_list"] = add_is_checked(
            stateprov_list, filters.get("stateprov")
        )

        jurisdiction_list = (
            basequery.values_list("jurisdiction__slug", "jurisdiction__name")
            .annotate(n=Count("stock_id"))
            .order_by("jurisdiction__slug")
        )

        context["jurisdiction_list"] = add_is_checked(
            jurisdiction_list, filters.get("jurisdiction")
        )

        agency_list = (
            basequery.values_list("agency__abbrev", "agency__agency_name")
            .annotate(n=Count("stock_id"))
            .order_by("agency__abbrev")
        )
        context["agency_list"] = add_is_checked(agency_list, filters.get("agency"))

        species_list = (
            basequery.values_list("species__abbrev", "species__common_name")
            .annotate(n=Count("stock_id"))
            .order_by("species__common_name")
        )

        context["species_list"] = add_is_checked(species_list, filters.get("species"))

        strain_list = (
            basequery.values_list(
                "strain_raw__strain__strain_code",
                "strain_raw__strain__strain_label",
            )
            .annotate(n=Count("stock_id"))
            .order_by("strain_raw__strain__strain_label")
        )

        context["strain_list"] = add_is_checked(strain_list, filters.get("strain_name"))

        year_class_list = (
            basequery.values_list("year_class")
            .annotate(n=Count("stock_id"))
            .order_by("-year_class")
        )

        context["year_class_list"] = add_is_checked(
            year_class_list, filters.get("year_class"), True, True
        )

        lifestage_list = (
            basequery.values_list("lifestage__abbrev", "lifestage__description")
            .annotate(n=Count("stock_id"))
            .order_by("lifestage__description")
        )

        context["lifestage_list"] = add_is_checked(
            lifestage_list, filters.get("lifestage")
        )

        clip_code_list = (
            basequery.values_list("clip_code__clip_code", "clip_code__description")
            .annotate(n=Count("stock_id"))
            .order_by("clip_code__clip_code")
        )

        context["clip_code_list"] = add_is_checked(
            clip_code_list, filters.get("clip_code")
        )

        stocking_month_list = (
            basequery.values_list("month")
            .annotate(n=Count("stock_id"))
            .order_by("month")
        )

        context["stocking_month_list"] = add_is_checked(
            stocking_month_list, filters.get("stocking_month"), True, True
        )

        stocking_method_list = (
            basequery.values_list(
                "stocking_method__stk_meth",
                "stocking_method__description",
            )
            .annotate(n=Count("stock_id"))
            .order_by("stocking_method__description")
        )

        context["stocking_method_list"] = add_is_checked(
            stocking_method_list, filters.get("stocking_method")
        )

        hatchery_list = (
            basequery.values_list("hatchery__abbrev", "hatchery__hatchery_name")
            .annotate(n=Count("stock_id"))
            .order_by("hatchery__abbrev")
        )

        context["hatchery_list"] = add_is_checked(
            hatchery_list, filters.get("hatchery")
        )

        # finclips, tags, and phys_chem_marks are slightly different as
        # they are many-to-many relationships we need filter the
        # 'many' side using the stocking events in our current base
        # query and then tally up the results and add a boolean
        # indicating whether or not each clip has already been
        # selected with the current filters:

        event_ids = basequery.values("id")

        finclip_list = (
            FinClip.objects.filter(id__in=event_ids)
            .values_list("abbrev", "description")
            .annotate(n=Count("stocking_events__id"))
            .order_by("abbrev")
        )

        finclip_list = add_is_checked(finclip_list, filters.get("finclips"))
        context["finclip_list"] = finclip_list

        fishtags_list = (
            FishTag.objects.filter(id__in=event_ids)
            .values_list("tag_code", "description")
            .annotate(n=Count("stocking_events__id"))
            .order_by("tag_code")
        )

        context["fishtags_list"] = add_is_checked(
            fishtags_list, filters.get("fishtags")
        )

        physchem_marks_list = (
            PhysChemMark.objects.filter(id__in=event_ids)
            .values_list("mark_code", "description")
            .annotate(n=Count("stocking_events__id"))
            .order_by("mark_code")
        )

        context["physchem_marks_list"] = add_is_checked(
            physchem_marks_list, filters.get("physchem_marks")
        )

        return context

    def get_queryset(self):

        contains = self.request.GET.get("contains")

        field_aliases = {
            "cwt_number": F("cwt_series__cwt__cwt_number"),
            "tag_type": F("cwt_series__cwt__tag_type"),
            "manufacturer": F("cwt_series__cwt__manufacturer"),
            # "year": F("year"),
            # "year_class": F("year_class"),
            "clipcode": F("clip_code__clip_code"),
            # "mark": F("mark"),
            "agency_code": F("agency__abbrev"),
            "spc": F("species__abbrev"),
            "strain": F("strain_raw__strain__strain_label"),
            "stage": F("lifestage__description"),
            "method": F("stocking_method__description"),
            "jurisd": F("jurisdiction__slug"),
            "lake": F("jurisdiction__lake__abbrev"),
            "state": F("jurisdiction__stateprov__abbrev"),
        }

        # use our shorter field names in the list of fields to select:
        fields = [
            "stock_id",
            "cwt_number",
            "tag_type",
            "manufacturer",
            "year",
            "year_class",
            "mark",
            "clipcode",
            "agency_code",
            "spc",
            "strain",
            "stage",
            "method",
            "jurisd",
            "lake",
            "state",
        ]

        related_tables = [
            "cwt",
            "cwt_series",
            "jurisdiction",
            "agency",
            "species",
            "strain",
            "lifestage",
            "stocking_method",
            "jurisdiction__lake",
            "jurisdiction__stateprov",
        ]

        counts = {"events": Count("stock_id")}

        queryset = StockingEvent.objects.filter(
            cwt_series__cwt__cwt_number__isnull=False
        ).select_related(*related_tables)

        if contains:
            queryset = queryset.filter(
                cwt_series__cwt__cwt_number__icontains=contains.replace("-", "")
            )

        filtered_list = StockingEventFilter(self.request.GET, queryset=queryset).qs

        values = list(
            filtered_list.annotate(**field_aliases)
            .values(*fields)
            .order_by()
            .annotate(**counts)
        )

        return values


class CWTSequenceDetail(ListView):
    """

    **Context**

    ``object_list``

    **Template:**

    :template:`stocking/cwt_sequence_detail.html`

    """

    model = CWTsequence
    template_name = "stocking/cwt_detail.html"

    def get_context_data(self, **kwargs):
        context = super(CWTSequenceDetail, self).get_context_data(**kwargs)
        cwt_number = self.kwargs.get("cwt_number")
        context["cwt_number"] = cwt_number
        context["cwts"] = CWT.objects.filter(cwt_number=cwt_number)

        events = StockingEvent.objects.filter(cwt_series__cwt__cwt_number=cwt_number)

        event_points = [
            (x[0], x[1].x, x[1].y) for x in events.values_list("stock_id", "geom")
        ]
        context["event_points"] = event_points

        extent = events.aggregate(bbox=Extent("jurisdiction__lake__geom"))
        if extent:
            context["bbox"] = extent["bbox"]
        else:
            extent = Lake.objects.aggregate(bbox=Extent(Extent("geom")))
            context["bbox"] = extent["bbox"]
        return context

    def get_queryset(self):

        related_tables = [
            "cwt",
            "events",
            "events__agency",
            "events__species",
            "events__strain_raw",
            "events__strain_raw__strain",
            "events__lifestage",
            "events__stocking_method",
            "events__jurisdiction",
            "events__jurisdiction__lake",
            # "events__jurisdiction__stateprov",
        ]

        cwt_number = self.kwargs.get("cwt_number")

        queryset = CWTsequence.objects.filter(
            cwt__cwt_number=cwt_number
        ).prefetch_related(*related_tables)

        return queryset
