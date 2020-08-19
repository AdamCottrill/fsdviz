"""Django-filter classes that will be used to filter stocking objects.
The will be used in both views and api serializers.

"""

import django_filters

from .models import StockingEvent

from ..common.utils import ValueInFilter, NumberInFilter


class StockingEventFilter(django_filters.FilterSet):

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

    months = ValueInFilter(field_name="month", lookup_expr="in")

    species = ValueInFilter(field_name="species__abbrev", lookup_expr="in")

    # strain abbrev (human friendly)
    strain_name = ValueInFilter(
        field_name="strain_raw__strain__strain_code", lookup_expr="in"
    )

    # by strain id (form)
    strain = NumberInFilter(field_name="strain_raw__strain__id", lookup_expr="in")

    lifestage = ValueInFilter(field_name="lifestage__abbrev", lookup_expr="in")

    stocking_method = ValueInFilter(
        field_name="stocking_method__stk_meth", lookup_expr="in"
    )

    mark = ValueInFilter(field_name="mark", lookup_expr="in")
    mark_like = django_filters.CharFilter(field_name="mark", lookup_expr="icontains")

    class Meta:
        model = StockingEvent
        fields = [
            "agency__abbrev",
            "year",
            "month",
            "species__abbrev",
            "strain_raw__strain__strain_label",
            "lifestage__abbrev",
            "jurisdiction__slug",
            "jurisdiction__lake__abbrev",
            "jurisdiction__stateprov__abbrev",
            "stocking_method__stk_meth",
            "mark",
        ]
