"""
Views associated with our stocking application.
"""

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Count, Q, Max, Sum, F
from django.http import HttpResponseRedirect
from django.shortcuts import redirect, render, get_object_or_404
from django.urls import reverse
from django.views.generic.base import TemplateView
from django.views.generic.detail import DetailView
from django.views.generic.list import ListView

from django.forms import formset_factory

from datetime import datetime

import json
from uuid import uuid1

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
    CWTsequence,
)
from .models import StockingEvent, StockingMethod, LifeStage, Condition, DataUploadEvent
from .filters import StockingEventFilter


from .forms import FindEventsForm, XlsEventForm, StockingEventForm

#


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
        "jurisdition__lake",
        "jurisdiction__stateprov",
    ]

    counts = {"events": Count("id")}

    values = list(
        StockingEvent.objects.select_related(*related_tables)
        .annotate(**field_aliases)
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

   ``label - the slug selected lake, jurisdiction, or management unit

    """

    template_name = "stocking/event_piechart_map.html"

    def get_context_data(self, **kwargs):
        context = super(PieChartMapView, self).get_context_data(**kwargs)

        spatialUnit = "basin"
        obj = None

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

        jurisdiction_slug = self.kwargs.get("jurisdiction")
        if jurisdiction_slug:
            dataUrl = reverse(
                "stocking_api:api-stocking-event-map-list-jurisdiction-year",
                kwargs={"year": year, "jurisdiction": jurisdiction_slug},
            )
            spatialUnit = "jurisdiction"
            obj = Jurisdiction.objects.get(slug=jurisdiction_slug)

        #        slug = self.kwargs.get('management_unit')
        #        if manUnit_slug:
        #            spatialUnit = 'manUnit'
        #            obj = ManagementUnit.objects.get(slug=slug)

        context["dataUrl"] = dataUrl
        context["spatialUnit"] = spatialUnit

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

        context["search_criteria"] = self.request.GET.get("q")
        jurisdiction_slug = self.kwargs.get("jurisdiction")
        lake_name = self.kwargs.get("lake_name")

        basequery = StockingEventFilter(
            self.request.GET, StockingEvent.objects.all()
        ).qs

        if lake_name:
            basequery = basequery.filter(jurisdiction__lake__abbrev=lake_name)
            lake = Lake.objects.get(abbrev=lake_name)
            context["lake"] = lake

        year = self.kwargs.get("year")
        if year:
            context["year"] = int(year)
            basequery = basequery.filter(year=year)

        if jurisdiction_slug:
            basequery = basequery.filter(jurisdiction__slug=jurisdiction_slug)
            jurisdiction = Jurisdiction.objects.get(slug=jurisdiction_slug)

        context["year_list"] = (
            basequery.values_list("year").annotate(n=Count("id")).order_by("-year")
        )

        context["agency_list"] = (
            basequery.values_list("agency__abbrev").annotate(n=Count("id")).order_by()
        )

        context["jurisdiction_list"] = (
            basequery.values_list("jurisdiction__slug", "jurisdiction__name")
            .annotate(n=Count("id"))
            .order_by()
        )

        context["species_list"] = (
            basequery.values_list("species__abbrev", "species__common_name")
            .annotate(n=Count("id"))
            .order_by()
        )

        context["strain_list"] = (
            basequery.values_list(
                "strain_raw__strain__strain_code", "strain_raw__strain__strain_label"
            )
            .annotate(n=Count("id"))
            .order_by()
        )

        context["lifestage_list"] = (
            basequery.values_list("lifestage__abbrev", "lifestage__description")
            .annotate(n=Count("id"))
            .order_by()
        )

        context["mark_list"] = (
            basequery.values_list("mark").annotate(n=Count("id")).order_by()
        )

        context["stocking_method_list"] = (
            basequery.values_list(
                "stocking_method__stk_meth", "stocking_method__description"
            )
            .annotate(n=Count("id"))
            .order_by()
        )
        return context

    def get_queryset(self):

        lake_name = self.kwargs.get("lake_name")
        year = self.kwargs.get("year")
        jurisdiction = self.kwargs.get("jurisdiction")

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

        if lake_name:
            # Return a filtered queryset
            queryset = queryset.filter(jurisdiction__lake__abbrev=lake_name)

        if year:
            queryset = queryset.filter(year=year)

        if jurisdiction:
            queryset = queryset.filter(jurisdiction__slug=jurisdiction)

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

    data = {}

    if request.method == "GET":
        return render(request, "stocking/upload_stocking_events.html", data)

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

        # validate our data here: if the data passes basic validation,
        # pass it to a view of with a xls stocking event formset for
        # final editing, validation and event creation.

        # verify that the xls data matches our schema, convert it to a
        # list of dictionaries, and add the list of dicts for our session:

        xls_events = xls2dicts(data_file)

        valid, msg = validate_upload(xls_events)
        if not valid:
            messages.error(request, msg)
            return HttpResponseRedirect(reverse("stocking:upload-stocking-events"))

        # check for errors here:
        # xls_errors = validate_events(xls_events)

        request.session["data"] = xls_events
        # request.session["errors"] = xls_errors

        return HttpResponseRedirect(reverse("stocking:xls-events-form"))

    except Exception as e:
        # logging.getLogger("error_logger").error("Unable to upload file. "+repr(e))
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

    choices = get_choices()

    event_count = 0

    if request.method == "POST":
        formset = EventFormSet(request.POST, form_kwargs={"choices": choices})
        event_count = formset.total_form_count()
        if formset.is_valid():
            # for form in formset - create our stocking events:
            # Add them to our 'upload event table
            # return to list of uploaded events.
            # create our lookup dicts that relake abbrev to django objects:

            lakes = Lake.objects.values_list("id", "abbrev")
            stateProvinces = StateProvince.objects.values_list("id", "abbrev")
            agencies = Agency.objects.all().values_list("id", "abbrev")
            species = Species.objects.values_list("id", "abbrev")
            stocking_methods = StockingMethod.objects.values_list("id", "stk_meth")
            conditions = Condition.objects.values_list("id", "condition")
            lifestages = LifeStage.objects.values_list("id", "abbrev")
            grids = Grid10.objects.values_list("id", "slug")

            lake_id_lookup = toLookup(lakes)
            agency_id_lookup = toLookup(agencies)
            stateProv_id_lookup = toLookup(stateProvinces)
            species_id_lookup = toLookup(species)
            stocking_method_id_lookup = toLookup(stocking_methods)
            condition_id_lookup = toLookup(conditions)
            lifestage_id_lookup = toLookup(lifestages)
            grid_id_lookup = toLookup(grids)

            mus = ManagementUnit.objects.values_list(
                "id", "slug", "lake__abbrev", "label"
            )
            mu_id_lookup = make_mu_id_lookup(mus)

            lakeStates = [x for x in Jurisdiction.objects.values_list("id", "slug")]
            lakeState_id_lookup = toLookup(lakeStates)

            strains = StrainRaw.objects.values_list(
                "id", "species__abbrev", "strain__strain_code"
            )
            strain_id_lookup = make_strain_id_lookup(strains)

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

                    # another hack = ensures that stock
                    data["stock_id"] = uuid1()

                    event = StockingEvent(**data)
                    event.save()
                    # events.append(StockingEvent(**data))

                #            StockingEvent.objects.bulk_create(events)

                url = data_upload_event.get_absolute_url()
                return HttpResponseRedirect(url)
    else:
        # get the data from our session
        xls_events = request.session.get("data", {})
        event_count = len(xls_events)

        formset = EventFormSet(initial=xls_events, form_kwargs={"choices": choices})

    return render(
        request,
        "stocking/xls_events_form.html",
        {"formset": formset, "event_count": event_count},
    )


@login_required
def edit_stocking_event(request, stock_id):
    """A view that will present a form that will allow authorized users to
    edit the attibutes of a stocking event."""

    event = get_object_or_404(StockingEvent, stock_id=stock_id)
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


class DataUploadEventDetailView(DetailView):
    """

    **Context**

    ``object``
        A :model:`stocking.DataUploadEvent` instance.

    **Template:**

    :template:`stocking/upload_event_detail.html`

    """

    model = DataUploadEvent
    template_name = "stocking/upload_event_detail.html"

    def get_context_data(self, **kwargs):
        """add our associated stocking events to the context"""

        context = super(DataUploadEventDetailView, self).get_context_data(**kwargs)

        context["events"] = StockingEvent.objects.filter(
            upload_event=self.get_object()
        ).select_related(
            "species", "lifestage", "strain_raw__strain", "stocking_method"
        )

        return context


class DataUploadEventListView(ListView):
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
    queryset = (
        DataUploadEvent.objects.prefetch_related("stocking_events__species")
        .annotate(
            event_count=Count("stocking_events"),
            total_stocked=Sum("stocking_events__no_stocked"),
        )
        .order_by("-timestamp")
        .all()
    )


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

    model = CWTsequence
    paginate_by = 200
    template_name = "stocking/cwt_list.html"
    filter_class = CWTSequenceFilter

    def get_context_data(self, **kwargs):
        context = super(CWTListView, self).get_context_data(**kwargs)

        search_q = self.request.GET.get("q")
        context["search_criteria"] = search_q
        # jurisdiction_slug = self.kwargs.get("jurisdiction")
        # lake_name = self.kwargs.get("lake_name")

        basequery = CWTSequenceFilter(self.request.GET, CWTsequence.objects.all()).qs

        if search_q:
            basequery = basequery.filter(
                Q(cwt__cwt_number__icontains=search_q.replace("-", ""))
            )

        # if lake_name:
        #     basequery = basequery.filter(jurisdiction__lake__abbrev=lake_name)
        #     lake = Lake.objects.get(abbrev=lake_name)
        #     context["lake"] = lake

        # year = self.kwargs.get("year")
        # if year:
        #     context["year"] = int(year)
        #     basequery = basequery.filter(year=year)

        # if jurisdiction_slug:
        #     basequery = basequery.filter(jurisdiction__slug=jurisdiction_slug)
        #    jurisdiction = Jurisdiction.objects.get(slug=jurisdiction_slug)

        context["year_list"] = (
            basequery.values_list("events__year")
            .annotate(n=Count("id"))
            .order_by("-events__year")
        )

        context["agency_list"] = (
            basequery.values_list("events__agency__abbrev")
            .annotate(n=Count("id"))
            .order_by()
        )

        context["jurisdiction_list"] = (
            basequery.values_list(
                "events__jurisdiction__slug", "events__jurisdiction__name"
            )
            .annotate(n=Count("id"))
            .order_by()
        )

        context["species_list"] = (
            basequery.values_list(
                "events__species__abbrev", "events__species__common_name"
            )
            .annotate(n=Count("id"))
            .order_by()
        )

        context["strain_list"] = (
            basequery.values_list(
                "events__strain_raw__strain__strain_code",
                "events__strain_raw__strain__strain_label",
            )
            .annotate(n=Count("id"))
            .order_by()
        )

        context["lifestage_list"] = (
            basequery.values_list(
                "events__lifestage__abbrev", "events__lifestage__description"
            )
            .annotate(n=Count("id"))
            .order_by()
        )

        context["mark_list"] = (
            basequery.values_list("events__mark").annotate(n=Count("id")).order_by()
        )

        context["stocking_method_list"] = (
            basequery.values_list(
                "events__stocking_method__stk_meth",
                "events__stocking_method__description",
            )
            .annotate(n=Count("id"))
            .order_by()
        )
        return context

    def get_queryset(self):

        lake_name = self.kwargs.get("lake_name")
        year = self.kwargs.get("year")
        jurisdiction = self.kwargs.get("jurisdiction")
        # get the value of q from the request kwargs
        search_q = self.request.GET.get("q")

        field_aliases = {
            "cwt_number": F("cwt__cwt_number"),
            "tag_type": F("cwt__tag_type"),
            "manufacturer": F("cwt__manufacturer"),
            "year": F("events__year"),
            "year_class": F("events__year_class"),
            "clip_code": F("events__clip_code__clip_code"),
            "mark": F("events__mark"),
            "agency_code": F("events__agency__abbrev"),
            "spc": F("events__species__abbrev"),
            "strain": F("events__strain_raw__strain"),
            "stage": F("events__lifestage__description"),
            "method": F("events__stocking_method__description"),
            "jurisd": F("events__jurisdiction__slug"),
            "lake": F("events__jurisdiction__lake__abbrev"),
            "state": F("events__jurisdiction__stateprov__abbrev"),
        }

        # use our shorter field names in the list of fields to select:
        fields = [
            "cwt_number",
            "tag_type",
            "manufacturer",
            "year",
            "year_class",
            "mark",
            "clip_code",
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
            "events__jurisdiction",
            "events__agency",
            "events__species",
            "events__strain",
            "events__lifestage",
            "events__stocking_method",
            "events__jurisdition__lake",
            "events__jurisdiction__stateprov",
        ]

        counts = {"events": Count("id")}

        queryset = CWTsequence.objects.select_related(*related_tables)

        if lake_name:
            # Return a filtered queryset
            queryset = queryset.filter(jurisdiction__lake__abbrev=lake_name)

        if year:
            queryset = queryset.filter(year=year)

        if jurisdiction:
            queryset = queryset.filter(jurisdiction__slug=jurisdiction)

        if search_q:
            queryset = queryset.filter(
                Q(cwt__cwt_number__icontains=search_q.replace("-", ""))
            )

        filtered_list = CWTSequenceFilter(self.request.GET, queryset=queryset).qs

        values = list(
            filtered_list.annotate(**field_aliases)
            .values(*fields)
            .order_by()
            .annotate(**counts)
        )

        return values
