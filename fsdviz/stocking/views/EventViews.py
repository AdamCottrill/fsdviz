"""
Views associated with our stocking application.
"""

import json

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.gis.db.models.aggregates import Extent
from django.db.models import Count, F, Max, Min, Q
from django.forms import formset_factory
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views.generic.base import TemplateView
from django.views.generic.detail import DetailView
from django.views.generic.list import ListView
from fsdviz.common.forms import BaseCWTSequenceFormSet, CWTSequenceForm
from fsdviz.common.models import (
    Agency,
    FinClip,
    FishTag,
    Jurisdiction,
    Lake,
    PhysChemMark,
    Species,
    StateProvince,
    Strain,
)
from fsdviz.myusers.permissions import user_can_create_edit_delete

from ..filters import StockingEventFilter
from ..forms import FindEventsForm, StockingEventForm
from ..models import LifeStage, StockingEvent, StockingMethod
from ..utils import (
    add_is_checked,
    form2params,
    get_cwt_sequence_dict,
    get_event_model_form_choices,
)

# CWTViews
# EventViews
# EventUploadViews


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

    bbox =  Lake.objects.all().aggregate(extent=Extent("geom"))

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
            "bbox": bbox["extent"]
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

        filters = self.request.GET.copy()
        context["filters"] = filters
        search_q = filters.get("q")
        if search_q:
            filters.pop("q")
            filters["stock_id__contains"] = search_q
            filters["agency_stock_id__contains"] = search_q

        self.request.GET = filters

        context["stock_id__contains"] = search_q
        context["agency_stock_id__contains"] = search_q

        basequery = StockingEventFilter(
            self.request.GET, StockingEvent.objects.all()
        ).qs

        # add the contains filter to make sure our tallies are right
        if search_q:
            basequery = basequery.filter(
                Q(stock_id__icontains=search_q) | Q(agency_stock_id__icontains=search_q)
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

        context["event_count"] = basequery.count()
        context["max_event_count"] = settings.MAX_FILTERED_EVENT_COUNT

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
                user=request.user,
            )
        else:
            form = StockingEventForm(
                request.POST,
                choices=choices,
                has_cwts=has_cwts,
                # cwt_formset=cwt_formset.cleaned_data,
                user=request.user,
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
            event_dict,
            choices=choices,
            has_cwts=has_cwts,
            cwt_formset=cwt_formset,
            user=request.user,
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
