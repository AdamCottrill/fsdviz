"""
Views associated with our stocking application.
"""

from django.conf import settings
from django.contrib.gis.db.models import Extent
from django.db.models import Count, F
from django.shortcuts import redirect, render
from django.urls import reverse

from django.views.generic.list import ListView

import json


from fsdviz.common.models import (
    Lake,
    Jurisdiction,
    Species,
    Strain,
    StateProvince,
    Agency,
    CWT,
    CWTsequence,
    FinClip,
    FishTag,
    PhysChemMark,
)
from ..filters import StockingEventFilter
from ..forms import FindCWTEventsForm
from ..models import StockingEvent, StockingMethod, LifeStage
from ..utils import add_is_checked, form2params


# CWTViews
# EventViews
# EventUploadViews


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

        context["event_count"] = basequery.count()
        context["max_event_count"] = settings.MAX_FILTERED_EVENT_COUNT

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
