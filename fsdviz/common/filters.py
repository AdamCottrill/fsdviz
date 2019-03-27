"""Django-filter classes that will be used to filter common objects.
The will be used in both views and api serializers.

"""

import django_filters

from .models import (ManagementUnit, Jurisdiction, StateProvince, Strain,
                     StrainRaw, Mark)


class ManagementUnitFilter(django_filters.FilterSet):

    mu_type = django_filters.CharFilter(
        field_name='mu_type', lookup_expr='iexact')

    lake = django_filters.CharFilter(
        field_name='lake__abbrev', lookup_expr='iexact')

    class Meta:
        model = ManagementUnit
        fields = ['mu_type', 'lake']


class StateProvinceFilter(django_filters.FilterSet):

    stateprov = django_filters.CharFilter(
        field_name='abbrev', lookup_expr='iexact')

    country = django_filters.CharFilter(
        field_name='country', lookup_expr='iexact')

    class Meta:
        model = StateProvince
        fields = ['stateprov', 'country']


class JurisdictionFilter(django_filters.FilterSet):

    stateprov = django_filters.CharFilter(
        field_name='stateprov__abbrev', lookup_expr='iexact')

    lake = django_filters.CharFilter(
        field_name='lake__abbrev', lookup_expr='iexact')

    class Meta:
        model = Jurisdiction
        fields = ['stateprov', 'lake']


class StrainFilter(django_filters.FilterSet):

    strain_species = django_filters.CharFilter(
        field_name='strain_species__abbrev', lookup_expr='iexact')

    strain_code = django_filters.CharFilter(
        field_name='strain_code', lookup_expr='iexact')

    class Meta:
        model = Strain
        fields = ['strain_code', 'strain_species']


class StrainRawFilter(django_filters.FilterSet):

    species = django_filters.CharFilter(
        field_name='species__abbrev', lookup_expr='iexact')

    strain = django_filters.CharFilter(
        field_name='strain__strain_code', lookup_expr='iexact')

    class Meta:
        model = StrainRaw
        fields = ['strain', 'species']



class MarkFilter(django_filters.FilterSet):

    class Meta:
        model = Mark
        fields = ['mark_type']
