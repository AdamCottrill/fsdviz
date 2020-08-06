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
    CompositeFinClip,
    FinClip,
    FishTag,
    PhysChemMark,
)

# centroid_WKT = POINT(-82.25, 44.25)
polygon_wkt = (
    "MULTIPOLYGON(((-82.0 44.0,"
    + "-82.5 44.0,"
    + "-82.5 44.5,"
    + "-82.0 44.5,"
    + "-82.0 44.0)))"
).replace("\n", "")


class LakeFactory(factory.DjangoModelFactory):
    """
    A factory for Lake objects.
    """

    class Meta:
        model = Lake
        django_get_or_create = ("abbrev",)

    abbrev = "HU"
    lake_name = "Huron"
    geom = GEOSGeometry(polygon_wkt)


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
    # slug = "slug"
    slug = factory.LazyAttribute(
        lambda o: "{}_{}".format(o.lake.abbrev, o.stateprov.abbrev).lower()
    )
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
    geom = GEOSGeometry(polygon_wkt)
    mu_type = "mu"
    primary = "True"


class Grid10Factory(factory.DjangoModelFactory):
    """
    A factory for 10-minute grid objects.
    """

    class Meta:
        model = Grid10
        django_get_or_create = ("grid", "lake")

    grid = factory.Sequence(lambda n: "%04d" % n)

    geom = GEOSGeometry(polygon_wkt)
    centroid = GEOSGeometry("POINT(-82.5 44.25)", srid=4326)
    lake = factory.SubFactory(LakeFactory)
    geom = GEOSGeometry(polygon_wkt)


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
        django_get_or_create = ("strain_code",)

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
        django_get_or_create = ("raw_strain",)

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


class PhysChemMarkFactory(factory.DjangoModelFactory):
    """
    A factory for PhysChemMark objects (chemical tags or physical marks)
    """

    class Meta:
        model = PhysChemMark
        django_get_or_create = ("mark_code",)

    mark_code = "OX"
    mark_type = "chemcial"
    description = "oxytetracycline"


class CompositeFinClipFactory(factory.DjangoModelFactory):
    """A factory for CompositeFinClip objects - the string reported by
    agency representing a concatenation of one or more fin clips.

    """

    class Meta:
        model = CompositeFinClip
        django_get_or_create = ("clip_code",)

    clip_code = "ADDO"
    description = "adipose, dorsal fin clip"


class FinClipFactory(factory.DjangoModelFactory):
    """
    A factory for FinClip objects
    """

    class Meta:
        model = FinClip
        django_get_or_create = ("abbrev",)

    abbrev = "AD"
    description = "adipose clip"


class FishTagFactory(factory.DjangoModelFactory):
    """
    A factory for CompositeFinClip objects (chemical tags or physical marks)
    """

    class Meta:
        model = FishTag
        django_get_or_create = ("tag_code",)

    tag_code = "CWT"
    tag_type = "CWT"
    description = "coded wire tag"


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
    slug = factory.LazyAttribute(
        lambda x: "{}_{}_{}".format(x.cwt_number, x.tag_type, x.manufacturer)
    )
    # agency = factory.SubFactory(AgencyFactory)


class CWTsequenceFactory(factory.DjangoModelFactory):
    """
    A factory for CWTsequence objects.
    """

    class Meta:
        model = CWTsequence

    sequence = [0, 0]

    cwt = factory.SubFactory(CWTFactory)
