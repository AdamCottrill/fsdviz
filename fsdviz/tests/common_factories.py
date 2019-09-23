"""
Factories for the models in the common application - agency, lake,
species, ect.

"""

import factory
from django.contrib.gis.geos import GEOSGeometry

# import common.models as common
from ..common.models import (
    Lake,
    Agency,
    StateProvince,
    Jurisdiction,
    ManagementUnit,
    Grid10,
    Species,
    Strain,
    StrainRaw,
    Mark,
    LatLonFlag,
    CWT,
    CWTsequence,
)


class LakeFactory(factory.DjangoModelFactory):
    """
    A factory for Lake objects.
    """

    class Meta:
        model = Lake
        django_get_or_create = ("abbrev",)

    abbrev = "HU"
    lake_name = "Huron"


class AgencyFactory(factory.DjangoModelFactory):
    """
    A factory for Agency objects.
    """

    class Meta:
        model = Agency
        django_get_or_create = ("abbrev",)

    abbrev = factory.Sequence(lambda n: "MA-%03d" % n)
    agency_name = factory.Sequence(lambda n: "MyAgency-%03d" % n)


class StateProvinceFactory(factory.DjangoModelFactory):
    """
    A factory for State-Province objects.
    """

    class Meta:
        model = StateProvince
        django_get_or_create = ("abbrev",)

    abbrev = "ON"
    name = "Ontario"
    description = "The Province of Ontario"
    country = "CAN"


class JurisdictionFactory(factory.DjangoModelFactory):
    """
    A factory for Jurisdiction objects.  This is effectively a
    many-to-many table between states and lakes.

    """

    class Meta:
        model = Jurisdiction
        django_get_or_create = ("slug",)

    lake = factory.SubFactory(LakeFactory)
    stateprov = factory.SubFactory(StateProvinceFactory)
    name = factory.Sequence(lambda n: "Ontario-%03d" % n)
    slug = "slug"
    description = "The waters of some entity"


class ManagementUnitFactory(factory.DjangoModelFactory):
    """
    A factory for ManagementUnit objects.
    """

    class Meta:
        model = ManagementUnit
        django_get_or_create = ("label",)

    label = factory.Sequence(lambda n: "MH-%03d" % n)
    description = "A management unit in Lake Huron"
    lake = factory.SubFactory(LakeFactory)
    mu_type = "mu"
    primary = "True"


class Grid10Factory(factory.DjangoModelFactory):
    """
    A factory for 10-minute grid objects.
    """

    class Meta:
        model = Grid10
        django_get_or_create = ("grid",)

    grid = factory.Sequence(lambda n: "%04d" % n)
    centroid = GEOSGeometry("POINT(-81.0 45.0)", srid=4326)
    lake = factory.SubFactory(LakeFactory)


class SpeciesFactory(factory.DjangoModelFactory):
    """
    A factory for Species objects.
    """

    class Meta:
        model = Species
        django_get_or_create = ("abbrev",)

    abbrev = "LAT"
    common_name = "Lake Trout"
    scientific_name = "Salvelinus namaycush"
    species_code = factory.Sequence(lambda n: "%03d" % n)


class StrainFactory(factory.DjangoModelFactory):
    """
    A factory for Strain objects.
    """

    class Meta:
        model = Strain

    strain_code = "SEN"
    strain_label = "Seneca"
    description = "Lake trout orignally from Seneca Lake"
    strain_species = factory.SubFactory(SpeciesFactory)


class StrainRawFactory(factory.DjangoModelFactory):
    """
    A factory for Raw Strain objects.
    """

    class Meta:
        model = StrainRaw

    raw_strain = "Special Seneca"
    description = "extra special Lake trout orignally from Seneca Lake"
    species = factory.SubFactory(SpeciesFactory)
    strain = factory.SubFactory(StrainFactory)


class MarkFactory(factory.DjangoModelFactory):
    """
    A factory for Mark objects (fin clips, cwts and chemical tags)
    """

    class Meta:
        model = Mark

    mark_code = "AD"
    mark_type = "finclip"
    clip_code = "5"
    description = "Adipose Fin"


class LatLonFlagFactory(factory.DjangoModelFactory):
    """
    A factory for LatLonFlag objects.
    """

    class Meta:
        model = LatLonFlag
        django_get_or_create = ("value",)

    value = 1
    description = "Reported"


class CWTFactory(factory.DjangoModelFactory):
    """
    A factory for CWT objects.
    """

    class Meta:
        model = CWT
        django_get_or_create = ("slug",)

    cwt_number = factory.Sequence(lambda n: "%06d" % n)
    tag_count = 10000
    tag_type = "cwt"
    manufacturer = "nmt"
    slug = factory.LazyAttribute(lambda x: "{}_{}".format(x.cwt_number, x.manufacturer))
    # agency = factory.SubFactory(AgencyFactory)


class CWTsequenceFactory(factory.DjangoModelFactory):
    """
    A factory for CWTsequence objects.
    """

    class Meta:
        model = CWTsequence

    seq_start = 1
    seq_start = 100

    cwt = factory.SubFactory(CWTFactory)
