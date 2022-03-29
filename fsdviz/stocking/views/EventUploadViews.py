from datetime import datetime


from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.db import transaction, connection
from django.db.models import Count, Sum
from django.forms import formset_factory, ValidationError
from django.http import HttpResponseRedirect
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.generic.detail import DetailView
from django.views.generic.list import ListView

from fsdviz.common.models import (
    Agency,
    FinClip,
    CompositeFinClip,
    FishTag,
    Grid10,
    Jurisdiction,
    Lake,
    ManagementUnit,
    PhysChemMark,
    Species,
    StateProvince,
    StrainRaw,
)
from fsdviz.common.utils import (
    PointPolygonsCollection,
    list2dict,
    make_mu_id_lookup,
    make_strain_id_lookup,
    toLookup,
    parseFinClip,
    int_or_none,
)
from fsdviz.myusers.permissions import user_can_create_edit_delete

from ..forms import XlsEventForm, DataUploadForm
from ..models import (
    Condition,
    DataUploadEvent,
    Hatchery,
    LifeStage,
    StockingEvent,
    StockingMethod,
)
from ..utils import get_choices, validate_upload, xls2dicts, get_or_create_cwt_sequence


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
    if request.method == "POST":

        form = DataUploadForm(request.POST, request.FILES)

        if form.is_valid():
            try:
                data_file = form.cleaned_data["data_file"]

                # data_file = request.FILES["data_file"]
                if not (
                    data_file.name.endswith(".xlsx") or data_file.name.endswith(".xls")
                ):
                    msg = "Choosen file is not an Excel (*.xls or *.xlsx) file!"
                    messages.error(request, msg)
                    return HttpResponseRedirect(
                        reverse("stocking:upload-stocking-events")
                    )
                # if file is too large, return
                if data_file.multiple_chunks():
                    filesize = data_file.size / (1000 * 1000)
                    msg = "Uploaded file is too big ({.2f} MB).".format(filesize)
                    messages.error(request, msg)
                    return HttpResponseRedirect(
                        reverse("stocking:upload-stocking-events")
                    )

                xls_events = xls2dicts(data_file)

                valid, msg = validate_upload(xls_events, request.user)
                if not valid:
                    messages.error(request, msg)
                    return HttpResponseRedirect(
                        reverse("stocking:upload-stocking-events")
                    )

                for i, event in enumerate(xls_events):
                    val = event.get("site")
                    if val:
                        event["site"] = val.title()
                    val = event.get("st_site")
                    if val:
                        event["st_site"] = val.title()
                    xls_events[i] = event

                # xls_errors = validate_events(xls_events)
                request.session["data"] = xls_events
                request.session["upload_comment"] = form.cleaned_data.get(
                    "upload_comment"
                )
                # request.session["errors"] = xls_errors

                return HttpResponseRedirect(reverse("stocking:xls-events-form"))

            except Exception as e:
                messages.error(request, "Unable to upload file. " + repr(e))
                return HttpResponseRedirect(reverse("stocking:upload-stocking-events"))

    else:
        form = DataUploadForm()
    return render(
        request,
        "stocking/upload_stocking_events.html",
        {"maxEvents": maxEvents, "form": form},
    )


def xls_events(request):
    """This function is the workhorse of the data upload.  On a get
    request it gets the excel data from the session, along with all of the
    associated lookup values.

        Arguments:
        - `request`:

    """

    EventFormSet = formset_factory(XlsEventForm, extra=0)
    formset_errors = {}
    choices = get_choices(active_only=True)

    # get the data from our session
    xls_events = request.session.get("data", {})
    upload_comment = request.session.get("upload_comment", "")
    event_count = len(xls_events)

    agency = Agency.objects.get(abbrev=xls_events[0].get("agency"))
    lake = Lake.objects.get(abbrev=xls_events[0].get("lake"))
    bbox = lake.geom.envelope.buffer(0.5).extent

    # TODO : choices = formset_choices(choices, lake)
    # TODO : cache = formset_cache(lake, points)
    stateprov = StateProvince.objects.filter(jurisdiction__lake=lake).values_list(
        "abbrev", "name"
    )
    choices["stateprov"] = list(stateprov)
    # filter the choices for the spatial attributes to those assoicated with this lake:
    choices["stat_dist"] = choices.get("stat_dist", {}).get(lake.abbrev, "")
    choices["grids"] = choices.get("grids", {}).get(lake.abbrev, "")

    choices["strain"] = [
        [x.raw_strain, x.raw_strain]
        for x in StrainRaw.objects.filter(
            active=True, raw_strain__isnull=False
        ).exclude(raw_strain="")
    ]

    clips = [x for x in CompositeFinClip.objects.values_list("clip_code", "clip_code")]
    choices["finclips"] = clips

    physchem_marks = [
        x for x in PhysChemMark.objects.values_list("mark_code", "mark_code")
    ]
    choices["physchem_marks"] = physchem_marks

    tag_types = [x for x in FishTag.objects.values_list("tag_code", "tag_code")]
    choices["tag_types"] = tag_types

    hatcheries = [
        (x[0], f"{x[1]} [{x[0]}]")
        for x in Hatchery.objects.filter(active=True).values_list(
            "abbrev", "hatchery_name"
        )
    ]

    choices["hatcheries"] = sorted(hatcheries, key=lambda x: x[1])

    # the choices dictionary is used for simple lookups and the display
    # of more complicated fields, the cache dictionary is used for
    # validation of nested objects to limit the number of database
    # queries.

    cache = {"bbox": bbox}
    strain_list = StrainRaw.objects.filter(active=True).values_list(
        # "id", "species__abbrev", "strain__strain_code"
        "id",
        "species__abbrev",
        "raw_strain",
    )
    strain_id_lookup = make_strain_id_lookup(strain_list)
    cache["strains"] = strain_id_lookup

    mus = (
        ManagementUnit.objects.filter(lake=lake, mu_type="stat_dist")
        .select_related("jurisdiciton", "jurisdiction__stateprov")
        .values_list("jurisdiction__stateprov__abbrev", "label")
    )

    mu_grids = (
        ManagementUnit.objects.filter(lake=lake, mu_type="stat_dist")
        .select_related("grid10s")
        .order_by("label", "grid10s__grid")
        .values_list("label", "grid10s__grid")
    )

    point_polygons = PointPolygonsCollection()
    pts = {(x["longitude"], x["latitude"]) for x in xls_events}
    point_polygons.add_points(pts)

    cache["lake"] = lake.abbrev
    cache["mus"] = list2dict(mus)
    cache["mu_grids"] = list2dict(mu_grids)
    cache["point_polygons"] = point_polygons

    if request.method == "POST":

        formset = EventFormSet(
            request.POST, form_kwargs={"choices": choices, "cache": cache}
        )
        event_count = formset.total_form_count()
        if formset.is_valid():

            # create our lookup dicts that relate abbrev to django objects -
            # we will need them for our front end validation and for
            # processing the submitted form:

            stateProvinces = StateProvince.objects.values_list("id", "abbrev")
            stateProv_id_lookup = toLookup(stateProvinces)

            mus = ManagementUnit.objects.filter(
                lake=lake, mu_type="stat_dist"
            ).values_list("id", "slug", "lake__abbrev", "label")
            mu_id_lookup = make_mu_id_lookup(mus)

            lakeStates = [
                x
                for x in Jurisdiction.objects.filter(lake=lake).values_list(
                    "id", "slug"
                )
            ]
            lakeState_id_lookup = toLookup(lakeStates)

            grids = Grid10.objects.filter(lake=lake).values_list("id", "slug")
            grid_id_lookup = toLookup(grids)

            species = Species.objects.filter(active=True).values_list("id", "abbrev")
            species_id_lookup = toLookup(species)

            # strains = StrainRaw.objects.filter(active=True).values_list(
            #     "id", "species__abbrev", "strain__strain_code"
            # )
            # strain_id_lookup = make_strain_id_lookup(strains)

            stocking_methods = StockingMethod.objects.values_list("id", "stk_meth")
            stocking_method_id_lookup = toLookup(stocking_methods)

            conditions = Condition.objects.values_list("id", "condition")
            condition_id_lookup = toLookup(conditions)

            lifestages = LifeStage.objects.values_list("id", "abbrev")
            lifestage_id_lookup = toLookup(lifestages)

            hatcheries = Hatchery.objects.filter(active=True).values_list(
                "id", "abbrev"
            )
            hatchery_id_lookup = toLookup(hatcheries)

            finclip_lookup = {x.abbrev: x for x in FinClip.objects.all()}

            fishtag_lookup = {x.tag_code: x for x in FishTag.objects.all()}
            mark_lookup = {x.mark_code: x for x in PhysChemMark.objects.all()}

            disable_trigger = """ALTER TABLE stocking_stockingevent
            DISABLE TRIGGER update_reused_cwt_flags_trigger"""

            START_TIME = datetime.now()

            with connection.cursor() as cursor:
                with transaction.atomic():

                    def restore_trigger():
                        """A function to be called after the transaction is complete.  Cannot
                        take arguments and must use the same cursor as our transaction"""

                        enable_trigger = """ALTER TABLE stocking_stockingevent
                        ENABLE TRIGGER update_reused_cwt_flags_trigger"""
                        cursor.execute(enable_trigger)

                    transaction.on_commit(restore_trigger)

                    cursor.execute(disable_trigger)
                    data_upload_event = DataUploadEvent(
                        uploaded_by=request.user,
                        lake_id=lake.abbrev,
                        agency_id=agency.abbrev,
                        comment=upload_comment,
                    )
                    data_upload_event.save()

                    for form in formset:
                        data = form.cleaned_data
                        # agency_abbrev = data.pop("agency")
                        spc_abbrev = data.pop("species")
                        species = species_id_lookup[spc_abbrev]
                        lifestage = lifestage_id_lookup[data.pop("stage")]
                        stocking_method = stocking_method_id_lookup[
                            data.pop("stock_meth")
                        ]

                        condition = condition_id_lookup.get(
                            int_or_none(data.pop("condition"))
                        )
                        if condition is None:
                            condition = condition_id_lookup[99]

                        hatchery = hatchery_id_lookup.get(data.pop("hatchery"))
                        grid_slug = "{}_{}".format(
                            lake.abbrev.lower(), data.pop("grid")
                        )
                        grid = grid_id_lookup[grid_slug]
                        stat_dist = data.pop("stat_dist")
                        mu = mu_id_lookup.get(lake.abbrev).get(stat_dist)

                        lakeState_slug = "{}_{}".format(
                            lake.abbrev.lower(), data.pop("state_prov").lower()
                        )
                        lakeState = lakeState_id_lookup[lakeState_slug]

                        strain_id = data.pop("strain")
                        # strain_label = data.pop("strain")
                        # strain_id = strain_id_lookup.get(spc_abbrev).get(strain_label)

                        finclip_list = parseFinClip(data.pop("finclip", ""))
                        finclips = [
                            finclip_lookup.get(x)
                            for x in finclip_list
                            if finclip_lookup.get(x) is not None
                        ]

                        cwts = data.pop("tag_no", "")
                        if cwts != "":
                            cwts = cwts.replace(" ", "").replace(";", ",").split(",")
                        tag_list = data.pop("tag_type")
                        if tag_list:
                            tag_list = (
                                tag_list.replace(" ", "").replace(";", ",").split(",")
                            )
                        tags = [fishtag_lookup.get(x) for x in tag_list]

                        mark_list = data.pop("physchem_mark")
                        if mark_list:
                            mark_list = (
                                mark_list.replace(" ", "").replace(";", ",").split(",")
                            )
                        marks = [mark_lookup.get(x) for x in mark_list]

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
                        # data["agency_id"] = agency
                        data["lifestage_id"] = lifestage
                        data["stocking_method_id"] = stocking_method
                        data["grid_10_id"] = grid
                        data["management_unit_id"] = mu
                        data["species_id"] = species
                        data["strain_raw_id"] = strain_id
                        data["jurisdiction_id"] = lakeState
                        data["condition_id"] = condition
                        data["hatchery_id"] = hatchery
                        data["upload_event"] = data_upload_event

                        # rename some of our fields (this is not very elegant,
                        # but works for now)
                        data["dd_lat"] = data.pop("latitude")
                        data["dd_lon"] = data.pop("longitude")
                        data["lotcode"] = data.pop("lot_code")

                        data["agency"] = agency

                        event = StockingEvent(**data)
                        event.save()

                        # add any finclips, marks, and tags here:
                        if finclips:
                            event.fin_clips.add(*finclips)
                        if marks:
                            event.physchem_marks.add(*marks)
                        if tags:
                            event.fish_tags.add(*tags)

                        if cwts:
                            cwt_list = []
                            for cwt in cwts:
                                try:
                                    cwt_series = get_or_create_cwt_sequence(
                                        cwt_number=cwt,
                                        tag_type="cwt",
                                        manufacturer="nmt",
                                        sequence=(0, 1),
                                    )
                                except ValidationError as err:
                                    cwt_series = None
                                    raise err
                                if cwt_series is not None:
                                    cwt_list.append(cwt_series)

                            event.cwt_series.set(cwt_list)

                        event.save()

                # enable trigger
                # cursor.execute(enable_trigger)
                # re-save last event to run trigger -
                event.save()
                delta_time = str(datetime.now() - START_TIME)
                print("event upload elapsed time:", delta_time)
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
            print(formset_errors)

    else:

        formset = EventFormSet(
            initial=xls_events, form_kwargs={"choices": choices, "cache": cache}
        )

    return render(
        request,
        "stocking/xls_events_form.html",
        {
            "formset": formset,
            "event_count": event_count,
            "formset_errors": formset_errors,
            "mu_grids": list(mu_grids),
            "lake": lake,
            "agency": agency,
            "bbox": bbox,
            "point_polygons": point_polygons.get_polygons(),
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
            "species", "lifestage", "strain_raw__strain", "stocking_method", "clip_code"
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
            DataUploadEvent.objects.select_related("agency", "lake", "uploaded_by")
            .prefetch_related(
                "stocking_events__species",
            )
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
