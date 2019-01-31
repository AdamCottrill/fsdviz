"""Django-filter classes that will be used to filter stocking objects.
The will be used in both views and api serializers.

"""

import django_filters

from .models import StockingEvent

class StockingEventFilter(django_filters.FilterSet):
    agency = django_filters.CharFilter(field_name='agency__abbrev',
                                       lookup_expr='iexact')

    #year will have more than one filter eventually
    # still need between, greater than and less than
    year = django_filters.CharFilter(field_name='year',
                                     lookup_expr='exact')
    species = django_filters.CharFilter(field_name='species__abbrev',
                                             lookup_expr='iexact')

    strain = django_filters.CharFilter(
        field_name='strain_raw__strain__strain_code',
        lookup_expr='iexact')

    lifestage = django_filters.CharFilter(
        field_name='lifestage__abbrev',
        lookup_expr='iexact')

    stocking_method = django_filters.CharFilter(
        field_name='stocking_method__stk_meth',
        lookup_expr='iexact')

    # contains??
    mark = django_filters.CharFilter(
        field_name='mark',
        lookup_expr='iexact')




    class Meta:
        model = StockingEvent
        fields = ['agency__abbrev', 'year', 'species__abbrev',
                  'strain_raw__strain__strain_label',
                  'lifestage__abbrev',
                  'stocking_method__stk_meth',
                  'mark'
        ]
