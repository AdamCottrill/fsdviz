"""Django-filter classes that will be used to filter common objects.
The will be used in both views and api serializers.

"""

import django_filters
from django.contrib.gis.geos import GEOSGeometry
from .utils import NumberInFilter, ValueInFilter, NumberInOrNullFilter

from .models import (
    ManagementUnit,
    Jurisdiction,
    StateProvince,
    Strain,
    StrainRaw,
    Mark,
    Grid10,
    CWTsequence,
    FinClip,
    PhysChemMark,
)


class GeomFilter(django_filters.CharFilter):
    pass


class ManagementUnitFilter(django_filters.FilterSet):

    mu_type = django_filters.CharFilter(field_name="mu_type", lookup_expr="iexact")

    lake_id = django_filters.NumberFilter(field_name="lake_id")
    lake = django_filters.CharFilter(field_name="lake__abbrev", lookup_expr="iexact")

    primary = django_filters.BooleanFilter(field_name="primary")

    class Meta:
        model = ManagementUnit
        fields = ["mu_type", "lake", "primary"]


class Grid10Filter(django_filters.FilterSet):

    lake = django_filters.CharFilter(field_name="lake__abbrev", lookup_expr="iexact")

    manUnit_id = django_filters.NumberFilter(field_name="managementunit__id")
    manUnit = django_filters.CharFilter(field_name="managementunit__slug")

    class Meta:
        model = Grid10
        fields = ["lake"]


class StateProvinceFilter(django_filters.FilterSet):

    stateprov = django_filters.CharFilter(field_name="abbrev", lookup_expr="iexact")
    country = django_filters.CharFilter(field_name="country", lookup_expr="iexact")

    class Meta:
        model = StateProvince
        fields = ["stateprov", "country"]


class JurisdictionFilter(django_filters.FilterSet):

    lake_id = django_filters.NumberFilter(field_name="lake_id")

    stateprov = django_filters.CharFilter(
        field_name="stateprov__abbrev", lookup_expr="iexact"
    )

    lake = django_filters.CharFilter(field_name="lake__abbrev", lookup_expr="iexact")
    lake_id = django_filters.CharFilter(field_name="lake__id", lookup_expr="iexact")

    class Meta:
        model = Jurisdiction
        fields = ["stateprov", "lake"]


class StrainFilter(django_filters.FilterSet):

    species = django_filters.CharFilter(
        field_name="strain_species__abbrev", lookup_expr="iexact"
    )

    strain_code = django_filters.CharFilter(
        field_name="strain_code", lookup_expr="iexact"
    )

    class Meta:
        model = Strain
        fields = ["strain_code", "strain_species"]


class StrainRawFilter(django_filters.FilterSet):

    species_id = django_filters.NumberFilter(field_name="species_id")

    species = django_filters.CharFilter(
        field_name="species__abbrev", lookup_expr="iexact"
    )

    strain = django_filters.CharFilter(
        field_name="strain__strain_code", lookup_expr="iexact"
    )

    class Meta:
        model = StrainRaw
        fields = ["strain", "species"]


class MarkFilter(django_filters.FilterSet):
    class Meta:
        model = Mark
        fields = ["mark_type"]


class CWTSequenceFilter(django_filters.FilterSet):
    """A filter for cwt sequence objects that return subsets of cwt series
    based on attributes of the cwt, or the associated stocking events.
    """

    def filter_geom_in_roi(self, queryset, name, value):
        """A custom filter for our region of interest, only return stocking
        events that have there geometetry in the region of interest contained
        in value"""
        if not value:
            return queryset
        try:
            roi = GEOSGeometry(value, srid=4326)
            queryset = queryset.filter(events__geom__intersects=roi)
        except ValueError:
            pass
        return queryset

    # tag attributes
    cwt_number = ValueInFilter(field_name="cwt__cwt_number", lookup_expr="in")

    cwt_number_like = django_filters.CharFilter(
        field_name="cwt__cwt_number", lookup_expr="icontains"
    )

    manufacturer = django_filters.CharFilter(field_name="cwt__manufacturer")
    tag_type = django_filters.CharFilter(field_name="cwt__tag_type")

    # stocking event attributs
    lake = ValueInFilter(
        field_name="events__jurisdiction__lake__abbrev", lookup_expr="in"
    )

    agency = ValueInFilter(field_name="events__agency__abbrev", lookup_expr="in")
    stateprov = ValueInFilter(
        field_name="events__jurisdiction__stateprov__abbrev", lookup_expr="in"
    )
    jurisdiction = ValueInFilter(
        field_name="events__jurisdiction__slug", lookup_expr="in"
    )

    first_year = django_filters.NumberFilter(
        field_name="events__year", lookup_expr="gte"
    )
    last_year = django_filters.NumberFilter(
        field_name="events__year", lookup_expr="lte"
    )
    year = django_filters.CharFilter(field_name="events__year", lookup_expr="exact")

    year_class = NumberInOrNullFilter(field_name="events__year_class", lookup_expr="in")
    stocking_month = NumberInOrNullFilter(field_name="events__month", lookup_expr="in")

    species = ValueInFilter(field_name="events__species__abbrev", lookup_expr="in")

    # strain abbrev (human friendly)
    strain_name = ValueInFilter(
        field_name="events__strain_raw__strain__strain_code", lookup_expr="in"
    )

    # by strain id (form)
    strain = NumberInFilter(
        field_name="events__strain_raw__strain__id", lookup_expr="in"
    )

    stocking_method = ValueInFilter(
        field_name="events__stocking_method__stk_meth", lookup_expr="in"
    )

    lifestage = ValueInFilter(field_name="events__lifestage__abbrev", lookup_expr="in")

    clip_code = ValueInFilter(
        field_name="events__clip_code__clip_code", lookup_expr="in"
    )

    fin_clips = ValueInFilter(field_name="events__fin_clips__abbrev", lookup_expr="in")
    physchem_marks = ValueInFilter(
        field_name="events__physchem_marks__mark_code", lookup_expr="in"
    )

    ### ?fin_clip=AD&fin_clip=RP with return all recods with clip ADRP.
    # fin_clips = django_filters.ModelMultipleChoiceFilter(
    #    field_name="events__fin_clips__abbrev",
    #    queryset=FinClip.objects.all(),
    #    # conjoined=True,
    # )

    # physchem_marks = django_filters.ModelMultipleChoiceFilter(
    #    field_name="events__physchem_marks__mark_code",
    #    conjoined=True,
    #    queryset=PhysChemMark.objects.all(),
    # )

    fishtags = ValueInFilter(field_name="events__fish_tags__tag_code", lookup_expr="in")

    hatchery = ValueInFilter(field_name="events__hatchery__abbrev", lookup_expr="in")

    roi = GeomFilter(field_name="geom", method="filter_geom_in_roi")

    class Meta:
        model = CWTsequence
        fields = [
            "cwt__cwt_number",
            "cwt__tag_type",
            "cwt__manufacturer",
            "events__agency__abbrev",
            "events__year",
            "events__month",
            "events__species__abbrev",
            "events__strain_raw__strain__strain_label",
            "events__lifestage__abbrev",
            "events__jurisdiction__slug",
            "events__jurisdiction__lake__abbrev",
            "events__jurisdiction__stateprov__abbrev",
            "events__stocking_method__stk_meth",
            "events__physchem_marks__mark_code",
            "events__fin_clips__abbrev",
        ]
