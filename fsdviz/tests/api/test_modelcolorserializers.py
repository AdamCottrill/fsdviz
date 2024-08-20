"""=============================================================
 c:/1work/fsdviz/fsdviz/tests/api/test_modelcolorserializers.py
 Created: 14 Sep 2021 09:33:29

 DESCRIPTION:

  Many of the models with a colour field, have a dynamic model
  serializer that optionally reports the fill colour used for that
  entity in all of the visualizations.  The colour is really only
  needed for the front end clients, and should be returned for most
  other use cases.  Having an additional color field is likely to
  cause confution, especially for entities that have a colour
  attribute (such as tags).  The tests in file, ensure that the custom
  serializer used for objects wiht colour attribute return the
  expected result depending on the value of the 'color' argument.

 A. Cottrill
=============================================================

"""


import pytest

from fsdviz.stocking.api.serializers import (
    LifeStageSerializer,
    StockingMethodSerializer,
)

from fsdviz.common.api.serializers import (
    LakeSerializer,
    AgencySerializer,
    ManagementUnitSerializer,
    StateProvinceSerializer,
    CompositeFinClipSerializer,
    FishTagSerializer,
    PhysChemMarkSerializer,
    SpeciesSerializer,
    StrainSerializer,
    StrainAliasSerializer,
)
from ..factories.common_factories import (
    AgencyFactory,
    CompositeFinClipFactory,
    FishTagFactory,
    # JurisdictionFactory,
    LakeFactory,
    ManagementUnitFactory,
    PhysChemMarkFactory,
    SpeciesFactory,
    StateProvinceFactory,
    StrainFactory,
    StrainAliasFactory,
)

from ..factories.stocking_factories import LifeStageFactory, StockingMethodFactory


def test_lake_model_color_serializer():
    """ """

    abbrev = "HU"
    data_in = {"abbrev": abbrev, "lake_name": "Lake Huron", "color": "#808080"}

    item = LakeFactory.build(**data_in)
    assert LakeSerializer(item, color=True).data == data_in

    data_in.pop("color")
    assert LakeSerializer(item).data == data_in
    assert LakeSerializer(item, color=False).data == data_in


def test_agency_model_color_serializer():
    """ """

    data_in = {
        "abbrev": "OMNR",
        "agency_name": "Ontario Ministry of Natural Resources",
        "color": "#808080",
    }

    item = AgencyFactory.build(**data_in)
    assert AgencySerializer(item, color=True).data == data_in

    data_in.pop("color")
    assert AgencySerializer(item).data == data_in
    assert AgencySerializer(item, color=False).data == data_in


def test_management_unit_model_color_serializer():
    """ """

    lake_dict = dict(abbrev="ER", lake_name="Erie")
    lake = LakeFactory.build(**lake_dict)

    mu = ManagementUnitFactory.build(label="OE-1", lake=lake, color="#808080")

    expected = {
        "id": mu.id,
        "label": mu.label,
        "description": mu.description,
        "lake": lake_dict,
        "mu_type": mu.mu_type,
        "slug": mu.slug,
        "primary": bool(mu.primary),
        "color": "#808080",
    }

    assert ManagementUnitSerializer(mu, color=True).data == expected

    expected.pop("color")
    assert ManagementUnitSerializer(mu).data == expected
    assert ManagementUnitSerializer(mu, color=False).data == expected


def test_stateprovince_model_color_serializer():
    """ """

    data_in = {
        "abbrev": "ON",
        "name": "Ontario",
        "country": "CAN",
        "description": "The Province of Ontario",
        "color": "#808080",
    }

    item = StateProvinceFactory.build(**data_in)
    data_in["id"] = None
    assert StateProvinceSerializer(item, color=True).data == data_in

    data_in.pop("color")
    assert StateProvinceSerializer(item).data == data_in
    assert StateProvinceSerializer(item, color=False).data == data_in


def test_compositefinclip_model_color_serializer():
    """ """

    data_in = {
        "clip_code": "sc",
        "description": "Scute",
        "color": "#808080",
    }

    item = CompositeFinClipFactory.build(**data_in)
    assert CompositeFinClipSerializer(item, color=True).data == data_in

    data_in.pop("color")
    assert CompositeFinClipSerializer(item).data == data_in
    assert CompositeFinClipSerializer(item, color=False).data == data_in


def test_fishtag_model_color_serializer():
    """ """

    data_in = {
        "tag_code": "FTB",
        "tag_type": "floy",
        "tag_colour": "blue",
        "description": "floy tag, blue",
        "color": "#808080",
    }

    item = FishTagFactory.build(**data_in)
    assert FishTagSerializer(item, color=True).data == data_in

    data_in.pop("color")
    assert FishTagSerializer(item).data == data_in
    assert FishTagSerializer(item, color=False).data == data_in


def test_physchemmark_model_color_serializer():
    """ """

    data_in = {
        "mark_code": "DY",
        "mark_type": "dye",
        "description": "dye, general",
        "color": "#808080",
    }

    item = PhysChemMarkFactory.build(**data_in)
    assert PhysChemMarkSerializer(item, color=True).data == data_in

    data_in.pop("color")
    assert PhysChemMarkSerializer(item).data == data_in
    assert PhysChemMarkSerializer(item, color=False).data == data_in


def test_species_model_color_serializer():
    """ """

    data_in = {
        "abbrev": "LAT",
        "common_name": "Lake Trout",
        "scientific_name": "Salvelinus namaycush",
        "species_code": 81,
        "speciescommon": "1230101098",
        "color": "#808080",
    }

    item = SpeciesFactory.build(**data_in)
    assert SpeciesSerializer(item, color=True).data == data_in

    data_in.pop("color")
    assert SpeciesSerializer(item).data == data_in
    assert SpeciesSerializer(item, color=False).data == data_in


def test_strain_model_color_serializer():
    """ """

    species_dict = {
        "abbrev": "LAT",
        "common_name": "Lake Trout",
    }

    species = SpeciesFactory.build(**species_dict)

    # a Strain:
    data_in = {
        "strain_code": "SN",
        "strain_label": "Seneca",
        "strain_species": species,
        "color": "#808080",
    }
    item = StrainFactory.build(**data_in)
    data_out = StrainSerializer(item, color=True).data

    # now that we have created out strain, we need to modify the input
    # dictionary to match some of the attributes added by the
    # serializer:
    data_in["id"] = None
    data_in["slug"] = None
    data_in.pop("strain_species")

    assert data_out == data_in
    data_in.pop("color")
    assert StrainSerializer(item).data == data_in
    assert StrainSerializer(item, color=False).data == data_in


def test_strain_alias_model_color_serializer():
    """ """

    species_dict = {
        "abbrev": "LAT",
        "common_name": "Lake Trout",
        "species_code": 81,
        "scientific_name": "Salvelinus namaycush",
        "speciescommon": "1230101098",
    }

    species = SpeciesFactory.build(**species_dict)

    # a Strain:
    strain_dict = {
        "strain_code": "SN",
        "strain_label": "Seneca",
        "strain_species": species,
    }
    strain = StrainFactory.build(**strain_dict)

    # a strain alias:
    strain_alias_dict = {
        "strain_alias": "SEN",
        "description": "Seneca",
        "species": species,
        "strain": strain,
        "color": "#808080",
    }

    strain_alias = StrainAliasFactory.build(**strain_alias_dict)

    strain_dict["id"] = None
    strain_dict["slug"] = None
    strain_dict.pop("strain_species")

    expected = strain_alias_dict.copy()
    expected["id"] = None
    expected["strain"] = strain_dict
    expected["species"] = species_dict

    data_out = StrainAliasSerializer(strain_alias, color=True).data

    assert data_out == expected


def test_lifestage_model_color_serializer():
    """ """

    data_in = {"abbrev": "f", "description": "fingerling, age-0", "color": "#bcf60c"}
    item = LifeStageFactory.build(**data_in)
    assert LifeStageSerializer(item, color=True).data == data_in

    data_in.pop("color")
    assert LifeStageSerializer(item).data == data_in
    assert LifeStageSerializer(item, color=False).data == data_in


def test_stocking_method_model_color_serializer():
    """ """
    data_in = {
        "stk_meth": "b",
        "description": "boat, offshore stocking",
        "color": "#46f0f0",
    }

    item = StockingMethodFactory.build(**data_in)
    assert StockingMethodSerializer(item, color=True).data == data_in

    data_in.pop("color")
    assert StockingMethodSerializer(item).data == data_in
    assert StockingMethodSerializer(item, color=False).data == data_in
