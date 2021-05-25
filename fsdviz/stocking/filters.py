"""Django-filter classes that will be used to filter stocking objects.
The will be used in both views and api serializers.

"""

import django_filters
from django.contrib.gis.geos import GEOSGeometry
from .models import StockingEvent, YearlingEquivalent

from ..common.utils import ValueInFilter, NumberInFilter, NumberInOrNullFilter


class GeomFilter(django_filters.CharFilter):
    pass


class YearlingEquivalentFilter(django_filters.FilterSet):
    """A filter for yearling equivalents - allows us to filter them by
    either species or lifestage."""

    species = ValueInFilter(field_name="species__abbrev", lookup_expr="in")
    lifestage = ValueInFilter(field_name="lifestage__abbrev", lookup_expr="in")

    class Meta:
        model = YearlingEquivalent
        fields = [
            "species__abbrev",
            "lifestage__abbrev",
        ]


class StockingEventFilter(django_filters.FilterSet):
    def filter_geom_in_roi(self, queryset, name, value):
        """A custom filter for our region of interest, only return stocking
        events that have there geometetry in the region of interest contained
        in value"""
        if not value:
            return queryset
        try:
            roi = GEOSGeometry(value, srid=4326)
            queryset = queryset.filter(geom__intersects=roi)
        except ValueError:
            pass
        return queryset

    # CWT tag attributes
    cwt_number = ValueInFilter(
        label="comma separated list of 6-digit cwt numbers",
        field_name="cwt_series__cwt__cwt_number",
        lookup_expr="in",
    )

    cwt_number_like = django_filters.CharFilter(
        field_name="cwt_series__cwt__cwt_number", lookup_expr="icontains"
    )

    manufacturer = django_filters.CharFilter(field_name="cwt_series__cwt__manufacturer")
    tag_type = django_filters.CharFilter(field_name="cwt_series__cwt__tag_type")

    tag_reused = django_filters.BooleanFilter(field_name="cwt_series__cwt__tag_reused")
    multiple_lakes = django_filters.BooleanFilter(
        field_name="cwt_series__cwt__multiple_lakes"
    )
    multiple_species = django_filters.BooleanFilter(
        field_name="cwt_series__cwt__multiple_species"
    )
    multiple_strains = django_filters.BooleanFilter(
        field_name="cwt_series__cwt__multiple_strains"
    )
    multiple_yearclasses = django_filters.BooleanFilter(
        field_name="cwt_series__cwt__multiple_yearclasses"
    )
    multiple_agencies = django_filters.BooleanFilter(
        field_name="cwt_series__cwt__multiple_agencies"
    )

    lake = ValueInFilter(field_name="jurisdiction__lake__abbrev", lookup_expr="in")

    agency = ValueInFilter(field_name="agency__abbrev", lookup_expr="in")
    stateprov = ValueInFilter(
        field_name="jurisdiction__stateprov__abbrev", lookup_expr="in"
    )
    jurisdiction = ValueInFilter(field_name="jurisdiction__slug", lookup_expr="in")

    first_year = django_filters.NumberFilter(field_name="year", lookup_expr="gte")
    last_year = django_filters.NumberFilter(field_name="year", lookup_expr="lte")
    year = django_filters.CharFilter(field_name="year", lookup_expr="exact")

    year_class = NumberInOrNullFilter(field_name="year_class", lookup_expr="in")

    stocking_month = NumberInOrNullFilter(field_name="month", lookup_expr="in")

    species = ValueInFilter(field_name="species__abbrev", lookup_expr="in")

    # strain abbrev (human friendly)
    strain_name = ValueInFilter(
        field_name="strain_raw__strain__strain_code", lookup_expr="in"
    )

    # by strain id (form)
    strain = NumberInFilter(field_name="strain_raw__strain__id", lookup_expr="in")

    stocking_method = ValueInFilter(
        field_name="stocking_method__stk_meth", lookup_expr="in"
    )

    lifestage = ValueInFilter(field_name="lifestage__abbrev", lookup_expr="in")
    # combination of one more specific fins:
    clip_code = ValueInFilter(field_name="clip_code__clip_code", lookup_expr="in")
    # individual fins:
    finclips = ValueInFilter(field_name="fin_clips__abbrev", lookup_expr="in")

    physchem_marks = ValueInFilter(
        field_name="physchem_marks__mark_code",
        lookup_expr="in",
        label="abbreviation for physical, chemical, or dye.",
    )

    fishtags = ValueInFilter(field_name="fish_tags__tag_code", lookup_expr="in")

    hatchery = ValueInFilter(field_name="hatchery__abbrev", lookup_expr="in")

    roi = GeomFilter(field_name="geom", method="filter_geom_in_roi")

    class Meta:
        model = StockingEvent
        fields = [
            "agency__abbrev",
            "year",
            "month",
            "species__abbrev",
            "strain_raw__strain__strain_label",
            "lifestage__abbrev",
            "hatchery__abbrev",
            # "clip_code__clipcode",
            "jurisdiction__slug",
            "jurisdiction__lake__abbrev",
            "jurisdiction__stateprov__abbrev",
            "stocking_method__stk_meth",
            "mark",
        ]
