"""Views for the api for our common models

The veiws in this file should all be publicly available as readonly.

"""

from datetime import datetime

from django.conf import settings
from django.contrib.postgres.aggregates import StringAgg
from django.db.models import Count, F, Sum

from django.db.models import CharField, Value as V
from django.db.models.functions import Concat, Coalesce

from drf_excel.mixins import XLSXFileMixin
from drf_excel.renderers import XLSXRenderer
from rest_framework import generics, viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from ..filters import StockingEventFilter, YearlingEquivalentFilter
from ..models import (
    StockingMortality,
    Hatchery,
    LifeStage,
    StockingEvent,
    StockingMethod,
    YearlingEquivalent,
)
from .serializers import (
    StockingMortalitySerializer,
    CWTEventXlsxSerializer,
    HatcherySerializer,
    LifeStageSerializer,
    StockingEventFastSerializer,
    StockingEventSerializer,
    StockingEventXlsxSerializer,
    StockingMethodSerializer,
    YearlingEquivalentSerializer,
)
from .xls_render import MetaXLSXRenderer


class SmallResultsSetPagination(PageNumberPagination):
    """return a 100 ojects per page for cwt events"""

    page_size = 100
    page_size_query_param = "page_size"
    max_page_size = 1000


class LargeResultsSetPagination(PageNumberPagination):
    """return a 5000 ojects per page for  stocking events"""

    page_size = 500
    page_size_query_param = "page_size"
    max_page_size = 5000


class LifeStageViewSet(viewsets.ReadOnlyModelViewSet):
    """List of Lifestages and abbreviations."""

    queryset = LifeStage.objects.all()
    serializer_class = LifeStageSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "abbrev"


class YearlingEquivalentViewSet(viewsets.ReadOnlyModelViewSet):
    """List of yearing equivalent factors by species and lifestage.
    Yearling equivalent factors are used to
    adjust the number of fish stocked based on species and lifestage
    to account for younger life stages that are often stocked in high
    numbers but also suffer higher mortality.  The yearling
    equivalent factor is intended to standardize the number of fished
    stocked to the yearling lifestage.
    """

    queryset = YearlingEquivalent.objects.all()
    serializer_class = YearlingEquivalentSerializer
    filterset_class = YearlingEquivalentFilter
    permission_classes = [IsAuthenticatedOrReadOnly]


class HatcheryViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only api endpoint for hatcheries."""

    queryset = Hatchery.objects.all().order_by("hatchery_name")
    serializer_class = HatcherySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "abbrev"

    def get_queryset(self):
        queryset = Hatchery.objects.all().order_by("hatchery_name")
        active = self.request.query_params.get("active")
        if active:
            queryset = queryset.filter(active=True)
        return queryset


class StockingMortalityViewSet(viewsets.ReadOnlyModelViewSet):
    """List of stocking_mortality values and their descriptions reported by
    contributing agencies for each stocking event to indicicate how
    healthy the fish were at time of stocking.

    """

    queryset = StockingMortality.objects.all()
    serializer_class = StockingMortalitySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "value"


class StockingMethodViewSet(viewsets.ReadOnlyModelViewSet):
    """List of available stocking methods and abbreviations."""

    queryset = StockingMethod.objects.all()
    serializer_class = StockingMethodSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "stk_meth"


class StockingEvent2xlsxViewSet(XLSXFileMixin, ReadOnlyModelViewSet):
    """This view set will export the stockign data to excel in the same
    format as the data submission template."""

    queryset = StockingEvent.objects.all()
    serializer_class = StockingEventXlsxSerializer
    filterset_class = StockingEventFilter
    renderer_classes = (MetaXLSXRenderer, JSONRenderer)
    permission_classes = [IsAuthenticatedOrReadOnly]
    filename = f"glfsd_stocking_export_f{datetime.today().strftime('%Y-%m-%d')}.xlsx"

    header = {
        "tab_title": "Stocking Data",
        "header_title": "Stocking Data",
    }

    column_header = {
        "height": 15,
        "style": {
            "fill": {
                "fill_type": "solid",
                "start_color": "00C0C0C0",
            },
            "alignment": {
                "horizontal": "center",
                "vertical": "center",
                "wrapText": True,
                "shrink_to_fit": True,
            },
            "font": {
                "name": "Calibri",
                "size": 12,
                "bold": True,
            },
        },
    }
    body = {
        "style": {
            "font": {
                "name": "Calibri",
                "size": 11,
                "bold": False,
            }
        },
        "height": 15,
    }

    def get_serializer_context(self):
        """Add the request to the serializre context so we can include the url
        and queryparameters in the spreadsheet."""
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def get_queryset(self):
        field_aliases = {
            "glfsd_stock_id": F("stock_id"),
            "agency_code": F("agency__abbrev"),
            "_lake": F("jurisdiction__lake__abbrev"),
            "state_prov": F("jurisdiction__stateprov__abbrev"),
            "manUnit": F("management_unit__label"),
            "grid_10min": F("grid_10__grid"),
            "location_primary": F("site"),
            "location_secondary": F("st_site"),
            "latitude": F("dd_lat"),
            "longitude": F("dd_lon"),
            #"stock_method": F("stocking_method__stk_meth"),
            "_stock_method": Concat(
                "stocking_method__stk_meth",
                V(" - "),
                "stocking_method__description",
                output_field=CharField(),
            ),
            "species_code": F("species__abbrev"),
            "_strain": Concat(
                "strain_raw__strain__strain_label",
                V(" ("),
                "strain_raw__strain__strain_code",
                V(")"),
                output_field=CharField(),
            ),
            "_strain_raw": Concat(
                "strain_raw__description",
                V(" ("),
                "strain_raw__raw_strain",
                V(")"),
                output_field=CharField(),
            ),
            "yearclass": F("year_class"),
            # "life_stage": F("lifestage__abbrev"),
            "_life_stage": Concat(
                "lifestage__abbrev",
                V(" - "),
                "lifestage__description",
                output_field=CharField(),
            ),
            "age_months": F("agemonth"),
            "_clip": Coalesce(F("clip_code__clip_code"), V("UN")),
            "phys_chem_mark": StringAgg(
                "physchem_marks__mark_code",
                delimiter=";",
                ordering="physchem_marks__mark_code",
                default="",
            ),
            "cwt_number": F("tag_no"),
            "tag_retention": F("tag_ret"),
            "mean_length_mm": F("length"),
            "total_weight_kg": F("weight"),
            "_stocking_mortality": Concat(
                "stocking_mortality__value",
                V(" - "),
                "stocking_mortality__description",
                output_field=CharField(),
            ),
            "lot_code": F("lotcode"),
            "_hatchery": Concat(
                "hatchery__hatchery_name",
                V(" ["),
                "hatchery__abbrev",
                V("]"),
                output_field=CharField(),
            ),
            "number_stocked": F("no_stocked"),
            "tag_type": StringAgg("fish_tags__tag_code", delimiter="", default=""),
        }

        fields = [
            "glfsd_stock_id",
            "agency_stock_id",
            "agency_code",
            "_lake",
            "state_prov",
            "manUnit",
            "grid_10min",
            "location_primary",
            "location_secondary",
            "latitude",
            "longitude",
            "year",
            "month",
            "day",
            "_stock_method",
            "species_code",
            "_strain",
            "_strain_raw",
            "yearclass",
            "_life_stage",
            "age_months",
            "_clip",
            "clip_efficiency",
            "phys_chem_mark",
            "tag_type",
            "cwt_number",
            "tag_retention",
            "mean_length_mm",
            "total_weight_kg",
            "_stocking_mortality",
            "lot_code",
            "_hatchery",
            "number_stocked",
            "notes",
        ]

        queryset = (
            StockingEvent.objects.select_related(
                "jurisdiction",
                "agency",
                "species",
                "strain_raw",
                "strain_raw__strain",
                "lifestage",
                "stocking_mortality",
                "grid_10",
                "stocking_method",
                "hatchery",
                "fish_tags",
                "jurisdiction__lake",
                "jurisdiction__stateprov",
            )
            .defer(
                "jurisdiction__geom",
                "jurisdiction__lake__geom",
                "grid_10__geom",
                "grid_10__lake__geom",
            )
            .order_by("-year", "stock_id")
            .annotate(**field_aliases)
            .values(*fields)
        )

        filtered = StockingEventFilter(self.request.GET, queryset=queryset).qs.values(
            *fields
        )

        return filtered


class StockingEventViewSet(viewsets.ReadOnlyModelViewSet):
    """Returns a list of stocking events.  The view can be filtered by a
    large number of attributes including lake, species, strain,
    agency, first and last year, stocking method, lifestage, and
    clipcode.  This view is used to access records from the database
    using external clients (e.g. R and the GLFishStockR packages.)

    """

    serializer_class = StockingEventSerializer
    filterset_class = StockingEventFilter
    lookup_field = "stock_id"
    pagination_class = LargeResultsSetPagination
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = StockingEvent.objects.all()
        queryset = queryset.select_related(
            "agency",
            "jurisdiction",
            "jurisdiction__stateprov",
            "jurisdiction__lake",
            "species",
            "lifestage",
            "grid_10",
            "grid_10__lake",
            "latlong_flag",
            "strain_raw__strain",
            "stocking_method",
        ).defer(
            "jurisdiction__geom",
            "jurisdiction__lake__geom",
            "grid_10__geom",
            "grid_10__lake__geom",
        )

        queryset = self.get_serializer_class().setup_eager_loading(queryset)
        # finally django-filter
        filtered_list = StockingEventFilter(self.request.GET, queryset=queryset)

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
    filterset_class = StockingEventFilter
    permission_classes = [IsAuthenticatedOrReadOnly]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        return Response(queryset)

    def get_queryset(self):
        # get any url parameters:
        upload_event = self.kwargs.get("upload_event_slug")

        year = self.kwargs.get("year")

        # count our events and sum the yreq_stocked, give each field
        # that is from a child table as a simple label
        metrics = {
            "stateprov": F("jurisdiction__stateprov__abbrev"),
            "lake": F("jurisdiction__lake__abbrev"),
            "jurisdiction_slug": F("jurisdiction__slug"),
            "man_unit": F("management_unit__slug"),
            "grid10": F("grid_10__slug"),
            "stk_method": F("stocking_method__stk_meth"),
            "life_stage": F("lifestage__abbrev"),
            "clip": F("clip_code__clip_code"),
            "_mark": F("physchem_marks__mark_code"),
            "agency_abbrev": F("agency__abbrev"),
            "species_name": F("species__abbrev"),
            "strain": F("strain_raw__strain__strain_label"),
            "latitude": F("geom_lat"),
            "longitude": F("geom_lon"),
        }

        aggregation_metrics = {
            "events": Count("id"),
            "yreq": Sum("yreq_stocked"),
            "total_stocked": Sum("no_stocked"),
        }

        queryset = (
            StockingEvent.objects.defer(
                "jurisdiction__geom",
                "jurisdiction__lake__geom",
                "management_unit__geom",
                "grid_10__geom",
                "grid_10__lake__geom",
            )
            .select_related(
                "species",
                "lifestage",
                "jurisdiction",
                "jurisdiction__lake",
                "jurisdiction__stateprov",
                "grid_10",
                "management_unit",
                "agency",
                "strain_raw__strain",
                "stocking_method",
            )
            .prefetch_related(
                "species",
                "lifestage",
                "jurisdiction",
                "jurisdiction__lake",
                "jurisdiction__stateprov",
                "grid_10",
                "management_unit",
                "agency",
                "clip_code",
                "physchem_mark",
                "strain_raw__strain",
                "stocking_method",
            )
        )

        if year:
            queryset = queryset.filter(year=year)

        if upload_event:
            queryset = queryset.filter(upload_event__slug=upload_event)

        # finally django-filter
        filtered_list = StockingEventFilter(self.request.GET, queryset=queryset)

        qs = (
            filtered_list.qs.annotate(**metrics)
            .values(
                "latitude",
                "longitude",
                "month",
                "lake",
                "jurisdiction_slug",
                "man_unit",
                "stateprov",
                "grid10",
                "life_stage",
                "stk_method",
                "agency_abbrev",
                "species_name",
                "strain",
                "year_class",
                "clip",
                "_mark",
            )
            .order_by()
            .annotate(**aggregation_metrics)
        )

        return qs


class StockingEventListAPIView(APIView):
    """A list view of individual stocking events. This view is meant to be
    called from find_events view and should always return a reasonable
    subset of the database (say less than 5000 records?).

    query parmeters are parsed from the url and used to filter the
    returned queryest.

    To maximize performance, this view does not use a serializer and
    instead returns just the values from the queryset was recommended here:

    https://www.dabapps.com/blog/api-performance-profiling-django-rest-framework/

    Note: this is something we might want to consider for our other views too.

    TODO: when slug is available for strain, use it. for now we will
    build it on the front end.

    """

    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        field_aliases = {
            "agency_code": F("agency__abbrev"),
            "species_code": F("species__abbrev"),
            "strain": F("strain_raw__strain__strain_code"),
            "grid10": F("grid_10__slug"),
            "lifestage_code": F("lifestage__abbrev"),
            "stockingMethod": F("stocking_method__stk_meth"),
            "jurisdiction_code": F("jurisdiction__slug"),
            "man_unit": F("management_unit__slug"),
            "lake": F("jurisdiction__lake__abbrev"),
            "stateProv": F("jurisdiction__stateprov__abbrev"),
            "latitude": F("geom_lat"),
            "longitude": F("geom_lon"),
            "clip": F("clip_code__clip_code"),
            "_tags": StringAgg(
                "fish_tags__tag_code",
                delimiter=";",
                ordering="fish_tags__tag_code",
                default="",
            ),
            "_marks": StringAgg(
                "physchem_marks__mark_code",
                delimiter=";",
                ordering="physchem_marks__mark_code",
                default="",
            ),
        }

        fields = [
            "stock_id",
            "lake",
            "jurisdiction_code",
            "man_unit",
            "stateProv",
            "grid10",
            "latitude",
            "longitude",
            "st_site",
            "year",
            "date",
            "month",
            "clip",
            "_tags",
            "_marks",
            "year_class",
            "agency_code",
            "species_code",
            "strain",
            "lifestage_code",
            "stockingMethod",
            "no_stocked",
            "yreq_stocked",
        ]

        queryset = (
            StockingEvent.objects.defer(
                "jurisdiction__geom",
                "jurisdiction__lake__geom",
                "mangement_unit__geom",
                "mangement_unit__lake__geom",
                "mangement_unit__jurisdiction__lake__geom",
                "grid_10__geom",
                "grid_10__lake__geom",
            )
            .select_related(
                "agency",
                "species",
                "strain",
                "lifestage",
                "grid_10",
                "stocking_method",
                "management_unit",
                "jurisdiction",
                "jurisdiction__lake",
                "jurisdiction__stateprov",
            )
            .annotate(**field_aliases)
        )

        filtered = StockingEventFilter(request.GET, queryset=queryset).qs.values(
            *fields
        )

        maxEvents = settings.MAX_FILTERED_EVENT_COUNT

        return Response(filtered[:maxEvents])


class StockingEventLookUpsAPIView(APIView):
    """This api endpoint will return a json object that contains lookups
    for the stocking model objects needed to label stocking events.
    The api endpoint that returns the stocking events contains only
    id's or slugs form most fields to that the payload is compact and
    the javscript processing on the front end is as efficient as
    possible.  This endpoint provides the lookup values so that the
    stocking method 'b' can be displayed as "boat, offshore
    stocking".  Originally, this information was collected through
    separate api calls for each attribute.

    """

    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        lifestages = LifeStage.objects.values("abbrev", "description", "color")
        stockingmethods = StockingMethod.objects.values(
            "stk_meth", "description", "color"
        )

        lookups = {
            "stockingmethods": list(stockingmethods),
            "lifestages": list(lifestages),
        }

        return Response(lookups)


class CWTEventListAPIView(generics.ListAPIView):
    """A list view of individual cwt stocking events, inlcuding
    attributes of the associated cwt.

    Query parmeters are parsed from the url and used to filter the
    returned queryset.  See the swagger documentation enpoint for the
    complete list of available filters.

    """

    serializer_class = CWTEventXlsxSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = SmallResultsSetPagination
    filterset_class = StockingEventFilter

    # def get(self, request):
    def get_queryset(self):
        field_aliases = {
            "cwt_number": F("cwt_series__cwt__cwt_number"),
            "seq_lower": F("cwt_series__seq_lower"),
            "seq_upper": F("cwt_series__seq_upper"),
            "tag_type": F("cwt_series__cwt__tag_type"),
            "manufacturer": F("cwt_series__cwt__manufacturer"),
            "tag_reused": F("cwt_series__cwt__tag_reused"),
            "multiple_lakes": F("cwt_series__cwt__multiple_lakes"),
            "multiple_species": F("cwt_series__cwt__multiple_species"),
            "multiple_strains": F("cwt_series__cwt__multiple_strains"),
            "multiple_yearclasses": F("cwt_series__cwt__multiple_yearclasses"),
            "multiple_agencies": F("cwt_series__cwt__multiple_agencies"),
            "agency_code": F("agency__abbrev"),
            "lake": F("jurisdiction__lake__abbrev"),
            "state": F("jurisdiction__stateprov__abbrev"),
            "jurisd": F("jurisdiction__slug"),
            "man_unit": F("management_unit__label"),
            "grid10": F("grid_10__grid"),
            "latitude": F("geom_lat"),
            "longitude": F("geom_lon"),
            "primary_location": F("site"),
            "secondary_location": F("st_site"),
            "spc": F("species__abbrev"),
            "strain": F("strain_raw__strain__strain_label"),
            "clipcode": F("clip_code__clip_code"),
            "stage": F("lifestage__description"),
            "method": F("stocking_method__description"),
            "event_tag_numbers": F("tag_no"),
        }

        # use our shorter field names in the list of fields to select:
        fields = [
            "cwt_number",
            "tag_type",
            "seq_lower",
            "seq_upper",
            "manufacturer",
            "tag_reused",
            "multiple_lakes",
            "multiple_species",
            "multiple_strains",
            "multiple_yearclasses",
            "multiple_agencies",
            "stock_id",
            "agency_stock_id",
            "agency_code",
            "lake",
            "state",
            "jurisd",
            "man_unit",
            "grid10",
            "primary_location",
            "secondary_location",
            "latitude",
            "longitude",
            "year",
            "month",
            "day",
            "spc",
            "strain",
            "year_class",
            "mark",
            "clipcode",
            "stage",
            "method",
            "no_stocked",
            "event_tag_numbers",
        ]

        defered_fields = [
            "jurisdiction__geom",
            "jurisdiction__lake__geom",
            "management_unit__geom",
            "grid_10__geom",
            "grid_10__lake__geom",
        ]

        related_tables = [
            "cwt",
            "cwt_series",
            "agency",
            "species",
            "strain_raw",
            "strain_raw__strain",
            "lifestage",
            "stocking_method",
            "jurisdiction__lake",
            "jurisdiction__stateprov",
            "jurisdiction",
            "grid_10",
        ]

        queryset = (
            StockingEvent.objects.filter(cwt_series__cwt__cwt_number__isnull=False)
            .defer(*defered_fields)
            .select_related(*related_tables)
        )

        filtered_qs = StockingEventFilter(self.request.GET, queryset=queryset).qs

        values = filtered_qs.annotate(**field_aliases).values(*fields)
        return values


class CWTEventMapAPIView(APIView):
    """An api endpoint that returns just the data required to populate the
    found CWT event view - populate the cross filter, widgets and
    map. In most cases, the serialzed date includes the slugs rather
    than human readable labels.

    Only fields that are used in the filters or required for display
    on the map or filtering the events table are inlcuded in this
    endpoint.  More complete enpoints are provided for the cwt_list,
    and/or the xlsx download.

    Query parmeters are parsed from the url and used to filter the
    returned queryset.  See the swagger documentation enpoint for the
    complete list of available filters.

    To maximize performance, this view does not use a serializer and
    instead returns just the values from the queryset as recommended here:

    https://www.dabapps.com/blog/api-performance-profiling-django-rest-framework/

    """

    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        field_aliases = {
            "cwt_number": F("cwt_series__cwt__cwt_number"),
            "tag_type": F("cwt_series__cwt__tag_type"),
            "manufacturer": F("cwt_series__cwt__manufacturer"),
            "tag_reused": F("cwt_series__cwt__tag_reused"),
            "agency_code": F("agency__abbrev"),
            "lake": F("jurisdiction__lake__abbrev"),
            "state": F("jurisdiction__stateprov__abbrev"),
            "jurisd": F("jurisdiction__slug"),
            "man_unit": F("management_unit__slug"),
            "latitude": F("geom_lat"),
            "longitude": F("geom_lon"),
            "spc": F("species__abbrev"),
            "strain": F("strain_raw__strain__slug"),
            "clipcode": F("clip_code__clip_code"),
            "stage": F("lifestage__abbrev"),
            "method": F("stocking_method__stk_meth"),
        }

        # use our shorter field names in the list of fields to select:
        fields = [
            "cwt_number",
            "tag_type",
            "manufacturer",
            "tag_reused",
            "stock_id",
            "agency_code",
            "lake",
            "state",
            "jurisd",
            "man_unit",
            "latitude",
            "longitude",
            "year",
            "month",
            "spc",
            "strain",
            "year_class",
            "mark",
            "clipcode",
            "stage",
            "method",
        ]

        related_tables = [
            "cwt",
            "cwt_series",
            "agency",
            "species",
            "strain_raw",
            "strain_raw__strain",
            "lifestage",
            "stocking_method",
            "jurisdiction__lake",
            "jurisdiction__stateprov",
            "jurisdiction",
            # "grid_10",
        ]

        queryset = StockingEvent.objects.filter(
            cwt_series__cwt__cwt_number__isnull=False
        ).select_related(*related_tables)

        filtered_qs = StockingEventFilter(self.request.GET, queryset=queryset).qs

        values = filtered_qs.annotate(**field_aliases).values(*fields)
        maxEvents = settings.MAX_FILTERED_EVENT_COUNT
        return Response(values[:maxEvents])


class CWTEvent2xlsxViewSet(XLSXFileMixin, APIView):
    """This view set will export the stockign data to excel in the same
    format as the data submission template."""

    serializer_class = CWTEventXlsxSerializer
    renderer_classes = (XLSXRenderer, JSONRenderer)
    permission_classes = [IsAuthenticatedOrReadOnly]

    filename = f"glfsd_cwt_export_f{datetime.today().strftime('%Y-%m-%d')}.xlsx"

    header = {
        "tab_title": "CWT Data",
        "header_title": "CWT Data",
    }

    column_header = {
        "height": 15,
        "style": {
            "fill": {
                "fill_type": "solid",
                "start_color": "00C0C0C0",
            },
            "alignment": {
                "horizontal": "center",
                "vertical": "center",
                "wrapText": True,
                "shrink_to_fit": True,
            },
            "font": {
                "name": "Calibri",
                "size": 12,
                "bold": True,
            },
        },
    }
    body = {
        "style": {
            "font": {
                "name": "Calibri",
                "size": 11,
                "bold": False,
            }
        },
        "height": 15,
    }

    def get_serializer(self, *args, **kwargs):
        """
        Return the serializer instance that should be used for validating and
        deserializing input, and for serializing output.
        """
        serializer_class = self.serializer_class

        return serializer_class(*args, **kwargs)

    def get_serializer_context(self):
        """Add the request to the serializre context so we can include the url
        and queryparameters in the spreadsheet."""
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def get(self, request):
        """"""

        field_aliases = {
            "cwt_number": F("cwt_series__cwt__cwt_number"),
            "seq_lower": F("cwt_series__seq_lower"),
            "seq_upper": F("cwt_series__seq_upper"),
            "tag_type": F("cwt_series__cwt__tag_type"),
            "manufacturer": F("cwt_series__cwt__manufacturer"),
            "tag_reused": F("cwt_series__cwt__tag_reused"),
            "multiple_lakes": F("cwt_series__cwt__multiple_lakes"),
            "multiple_species": F("cwt_series__cwt__multiple_species"),
            "multiple_strains": F("cwt_series__cwt__multiple_strains"),
            "multiple_yearclasses": F("cwt_series__cwt__multiple_yearclasses"),
            "multiple_agencies": F("cwt_series__cwt__multiple_agencies"),
            "agency_code": F("agency__abbrev"),
            "lake": F("jurisdiction__lake__abbrev"),
            "state": F("jurisdiction__stateprov__abbrev"),
            "jurisd": F("jurisdiction__slug"),
            "man_unit": F("management_unit__label"),
            "grid10": F("grid_10__grid"),
            "latitude": F("geom_lat"),
            "longitude": F("geom_lon"),
            "primary_location": F("site"),
            "secondary_location": F("st_site"),
            "spc": F("species__abbrev"),
            "strain": F("strain_raw__strain__strain_label"),
            "clipcode": Coalesce(F("clip_code__clip_code"), V("UN")),
            "stage": F("lifestage__description"),
            "method": F("stocking_method__description"),
            "event_tag_numbers": F("tag_no"),
        }

        # use our shorter field names in the list of fields to select:
        fields = [
            "cwt_number",
            "tag_type",
            "seq_lower",
            "seq_upper",
            "manufacturer",
            "tag_reused",
            "multiple_lakes",
            "multiple_species",
            "multiple_strains",
            "multiple_yearclasses",
            "multiple_agencies",
            "stock_id",
            "agency_stock_id",
            "agency_code",
            "lake",
            "state",
            "jurisd",
            "man_unit",
            "grid10",
            "primary_location",
            "secondary_location",
            "latitude",
            "longitude",
            "year",
            "month",
            "day",
            "spc",
            "strain",
            "year_class",
            "mark",
            "clipcode",
            "stage",
            "method",
            "no_stocked",
            "event_tag_numbers",
        ]

        related_tables = [
            "cwt",
            "cwt_series",
            "agency",
            "species",
            "strain_raw",
            "strain_raw__strain",
            "lifestage",
            "stocking_method",
            "jurisdiction__lake",
            "jurisdiction__stateprov",
            "jurisdiction",
            "grid_10",
        ]

        queryset = StockingEvent.objects.filter(
            cwt_series__cwt__cwt_number__isnull=False
        ).select_related(*related_tables)

        filtered_qs = StockingEventFilter(self.request.GET, queryset=queryset).qs

        values = filtered_qs.annotate(**field_aliases).values(*fields)

        return Response(list(values))
