"""Django-filter classes that will be used to filter stocking objects.
The will be used in both views and api serializers.

"""

import django_filters
from django.contrib.gis.geos import GEOSGeometry
from .models import StockingEvent

from ..common.utils import ValueInFilter, NumberInFilter


class GeomFilter(django_filters.CharFilter):
    pass


class MyMonthFilter(ValueInFilter):
    empty_value = "None"

    def filter(self, qs, value):

        if value != self.empty_value:
            return super().filter(qs, value)

        # qs = self.get_method(qs)(**{"%s__%s" % (self.field_name, self.lookup_expr): ""})
        qs = self.get_method(qs)(**{"%s__isnull" % (self.field_name): ""})
        return qs.distinct() if self.distinct else qs


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

    # lake = django_filters.CharFilter(
    #     field_name='jurisdiction__lake__abbrev', lookup_expr='iexact')

    lake = ValueInFilter(field_name="jurisdiction__lake__abbrev", lookup_expr="in")

    agency = ValueInFilter(field_name="agency__abbrev", lookup_expr="in")
    stateprov = ValueInFilter(
        field_name="jurisdiction__stateprov__abbrev", lookup_expr="in"
    )
    jurisdiction = ValueInFilter(field_name="jurisdiction__slug", lookup_expr="in")

    # year will have more than one filter eventually
    # still need between, greater than and less than

    first_year = django_filters.NumberFilter(field_name="year", lookup_expr="gte")
    last_year = django_filters.NumberFilter(field_name="year", lookup_expr="lte")
    year = django_filters.CharFilter(field_name="year", lookup_expr="exact")

    stocking_month = MyMonthFilter(field_name="month", lookup_expr="in")

    species = ValueInFilter(field_name="species__abbrev", lookup_expr="in")

    # strain abbrev (human friendly)
    strain_name = ValueInFilter(
        field_name="strain_raw__strain__strain_code", lookup_expr="in"
    )

    # by strain id (form)
    strain = NumberInFilter(field_name="strain_raw__strain__id", lookup_expr="in")

    # mark is going away...
    mark = ValueInFilter(field_name="mark", lookup_expr="in")
    mark_like = django_filters.CharFilter(field_name="mark", lookup_expr="icontains")

    stocking_method = ValueInFilter(
        field_name="stocking_method__stk_meth", lookup_expr="in"
    )

    lifestage = ValueInFilter(field_name="lifestage__abbrev", lookup_expr="in")
    # combination of one more specific fins:
    clip_code = ValueInFilter(field_name="clip_code__clip_code", lookup_expr="in")
    # individual fins:
    finclips = ValueInFilter(field_name="fin_clips__abbrev", lookup_expr="in")

    physchem_marks = ValueInFilter(
        field_name="physchem_marks__mark_code", lookup_expr="in"
    )

    fishtags = ValueInFilter(field_name="fish_tags__tag_code", lookup_expr="in")

    hatchery = ValueInFilter(field_name="hatchery__abbrev", lookup_expr="in")

    # roi = self.roi_filter('geom', roi)
    roi = GeomFilter(field_name="geom", method="filter_geom_in_roi")

    # add clips_in, fish_tags, phys_chem_marks

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
