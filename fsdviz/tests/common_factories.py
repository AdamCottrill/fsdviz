"""
Factories for the models in the common application - agency, lake,
species, ect.

"""

import factory
from django.contrib.gis.geos import GEOSGeometry

#import common.models as common
from ..common.models import (Lake, Agency, StateProvince, ManagementUnit,
                             Grid10, Species, Strain, StrainRaw, Mark,
                             LatLonFlag, CWT, CWTsequence)

class LakeFactory(factory.DjangoModelFactory):
    """
    A factory for Lake objects.
    """
    class Meta:
        model = Lake
        django_get_or_create = ('abbrev',)

    abbrev = "HU"
    lake_name = "Huron"
    centroid = GEOSGeometry('POINT(-81.0 45.0)', srid=4326)


class AgencyFactory(factory.DjangoModelFactory):
    """
    A factory for Agency objects.
    """

    class Meta:
        model = Agency
        django_get_or_create = ('abbrev',)

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
        django_get_or_create = ('abbrev',)

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


class MarkFactory(factory.DjangoModelFactory):
    """
    A factory for Mark objects (fin clips, cwts and chemical tags)
    """

    class Meta:
        model = Mark

    mark_code = 'AD'
    mark_type = 'finclip'
    clip_code = '5'
    description = 'Adipose Fin'


class LatLonFlagFactory(factory.DjangoModelFactory):
    """
    A factory for LatLonFlag objects.
    """

    class Meta:
        model = LatLonFlag

    value = 1
    description = 'Reported'


class CWTFactory(factory.DjangoModelFactory):
    """
    A factory for CWT objects.
    """

    class Meta:
        model = CWT

    cwt_number = '123456'
    tag_count = 10000
    agency = factory.SubFactory(AgencyFactory)


class CWTsequenceFactory(factory.DjangoModelFactory):
    """
    A factory for CWTsequence objects.
    """

    class Meta:
        model = CWTsequence

    seq_start = 1
    seq_start = 100

    cwt = factory.SubFactory(CWTFactory)
