"""
Factories for the models in the common application - agency, lake,
species, ect.

"""

import factory
from django.contrib.gis.geos import GEOSGeometry

#import common.models as common
from ..common.models import (Lake, Agency, StateProvince, ManagementUnit,
                             Grid10, Species, Strain, StrainRaw)


class LakeFactory(factory.DjangoModelFactory):
    """
    A factory for Lake objects.
    """
    class Meta:
        model = Lake

    abbrev = "HU"
    lake_name = "Huron"
    centroid = GEOSGeometry('POINT(-81.0 45.0)', srid=4326)


class AgencyFactory(factory.DjangoModelFactory):
    """
    A factory for Agency objects.
    """

    class Meta:
        model = Agency

    abbrev = "OMNRF"
    agency_name = "Ontario Ministry of Natural Resources and Forestry"


class StateProvinceFactory(factory.DjangoModelFactory):
    """
    A factory for State-Province objects.
    """

    class Meta:
        model = StateProvince

    abbrev = "ON"
    name = "Ontario"
    description = "The Province of Ontario"
    country = "CAN"


class ManagementUnitFactory(factory.DjangoModelFactory):
    """
    A factory for ManagementUnit objects.
    """

    class Meta:
        model = ManagementUnit

    label = 'MH-1'
    description = 'A management unit in Lake Huron'
    centroid = GEOSGeometry('POINT(-81.0 45.0)', srid=4326)
    lake = factory.SubFactory(LakeFactory)
    mu_type = 'mu'



class Grid10Factory(factory.DjangoModelFactory):
    """
    A factory for 10-minute grid objects.
    """

    class Meta:
        model = Grid10

    grid = '1234'
    centroid = GEOSGeometry('POINT(-81.0 45.0)', srid=4326)
    lake = factory.SubFactory(LakeFactory)



class SpeciesFactory(factory.DjangoModelFactory):
    """
    A factory for Species objects.
    """

    class Meta:
        model = Species

    abbrev = 'LAT'
    common_name = 'Lake Trout'
    scientific_name = 'Salvelinus namaycush'
    species_code = 81



class StrainFactory(factory.DjangoModelFactory):
    """
    A factory for Strain objects.
    """

    class Meta:
        model = Strain

    strain_code = 'SEN'
    strain_label = 'Seneca'
    description = 'Lake trout orignally from Seneca Lake'
    strain_species = factory.SubFactory(SpeciesFactory)



class StrainRawFactory(factory.DjangoModelFactory):
    """
    A factory for Raw Strain objects.
    """

    class Meta:
        model = StrainRaw

    raw_strain = 'Special Seneca'
    description = 'extra special Lake trout orignally from Seneca Lake'
    species = factory.SubFactory(SpeciesFactory)
    strain = factory.SubFactory(StrainFactory)
