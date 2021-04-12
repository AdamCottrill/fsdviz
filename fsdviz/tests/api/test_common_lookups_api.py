"""This file contains a single test that will verify that the
common_lookups api returns the expected results.  The common lookup
api returns a list of key:value pairs used by the front end
applications.  The key values pairs are used to map labels back to
object ids.

"""


import pytest

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..common_factories import (
    LakeFactory,
    AgencyFactory,
    SpeciesFactory,
    StrainFactory,
    StrainRawFactory,
    StateProvinceFactory,
    JurisdictionFactory,
    ManagementUnitFactory,
    CompositeFinClipFactory,
)


class TestCommonLookupAPI(APITestCase):
    """The common lookup api return a response with the following structure:

    "lakes":[(abbrev, lake_name), ....],
    "agencies": [(abbrev, agency_name), ....],
    "jurisdictions": [("slug", "name", "lake__abbrev", "stateprov__abbrev", "description"), ...]
    "stateprov": [("abbrev", "name", "country", "description"), ....],
    "manUnits":[(slug", "label", "jurisdiction", "description")],
    "species": [("abbrev", "common_name", "scientific_name", "species_code", "speciescommon"), ...],
    "strains":[("id", "strain_code", "strain_label", "strain_species__abbrev"), ...],
    "raw_strains":[("id", "raw_strain", "description", "species__abbrev"), ...],
    "clipcodes": [(clip_code, description), ....],

    """

    def setUp(self):
        """In order to test our common lookup api - we will need at least one
        object for each key.

        """

        self.lake_dict = dict(abbrev="HU", lake_name="Huron")
        self.lake = LakeFactory(**self.lake_dict)

        self.agency_dict = dict(
            abbrev="MNRF",
            agency_name="Ontario Ministry of Natural Resources and Forestry",
        )
        self.agency = AgencyFactory(**self.agency_dict)

        self.stateProv_dict = dict(
            abbrev="ON",
            name="Ontario",
            country="CAN",
            description="The Province of Ontario",
        )
        self.stateProv = StateProvinceFactory(**self.stateProv_dict)

        self.jurisdiction_dict = dict(
            name="Huron-Ontario",
            description="The Ontario waters of Lake Huron.",
            lake=self.lake,
            stateprov=self.stateProv,
        )
        self.jurisdiction = JurisdictionFactory(**self.jurisdiction_dict)

        self.management_unit_dict = dict(
            label="MH-45",
            description="A management unit in Lake Huron",
            lake=self.lake,
            jurisdiction=self.jurisdiction,
        )
        self.management_unit = ManagementUnitFactory(**self.management_unit_dict)

        self.species_dict = {
            "abbrev": "LAT",
            "common_name": "Lake Trout",
            "scientific_name": "Salvelinus namaycush",
            "species_code": 81,
            "speciescommon": "1230101098",
        }

        self.species = SpeciesFactory(**self.species_dict)

        # a Strain:
        self.strain_dict = {
            "strain_code": "SN",
            "strain_label": "Seneca",
            "strain_species": self.species,
        }

        self.strain = StrainFactory(**self.strain_dict)

        # a Strain:
        self.strain_raw_dict = {
            "raw_strain": "SN-1",
            "description": "Seneca One",
            "species": self.species,
            "strain": self.strain,
        }

        self.raw_strain = StrainRawFactory(**self.strain_raw_dict)
        # the raw strain object has speceies abbrev and the strain slug:
        self.strain_raw_dict["id"] = self.raw_strain.id
        self.strain_raw_dict.pop("species")
        self.strain_raw_dict.pop("strain")
        self.strain_raw_dict["species__abbrev"] = self.species.abbrev
        self.strain_raw_dict["strain__slug"] = self.strain.slug

        self.clipcode_dict = dict(
            clip_code="ADLP",
            description="Adipose, Left Pectoral",
        )
        self.clipcodes = CompositeFinClipFactory(**self.clipcode_dict)

    def test_common_lookups_api(self):
        """the common lookups api should return a list of dictionaries/json
        corresponding to objects from common application (agencies,
        lakes, species, ect.).  The values in this dictionary are used
        by the front-end scripts to provide meaningful labels to
        elements identified by their key.  This test verified that the
        common lookup api returns the correct elements, and that those
        elements are structured as spec'd.

        """

        url = reverse("common_api:api-get-common-lookups")

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        keys = set(
            [
                "lakes",
                "agencies",
                "jurisdictions",
                "stateprov",
                "manUnits",
                "species",
                "strains",
                "raw_strains",
                "clipcodes",
            ]
        )
        obs = set(response.data.keys())

        assert keys == obs

        assert response.data.get("lakes") == [self.lake_dict]
        assert response.data.get("agencies") == [self.agency_dict]
        assert response.data.get("stateprov") == [self.stateProv_dict]

        # assert response.data.get("manUnits") == [self.management_unit_dict]

        assert response.data.get("species") == [self.species_dict]
        assert response.data.get("raw_strains") == [self.strain_raw_dict]

        assert response.data.get("clipcodes") == [self.clipcode_dict]
        # juristiction, mangement_unit, and strains are a little more complicated as
        # they contains a nested objects or keys derived from nested objects
        expected = self.strain_dict.copy()
        expected["id"] = self.strain.id
        expected["slug"] = self.strain.slug
        expected["strain_species"] = self.species_dict.copy()

        assert response.data.get("strains") == [expected]

        expected = self.jurisdiction_dict.copy()
        expected["slug"] = self.jurisdiction.slug
        expected["lake"] = self.lake_dict.copy()
        expected["stateprov"] = self.stateProv_dict.copy()
        obs = response.data.get("jurisdictions")

        assert obs == [expected]

        jurisdiction_dict = expected.copy()

        # mangement Unit has a nested juristiction object in it:
        expected = self.management_unit_dict.copy()
        expected.pop("lake")
        expected["slug"] = self.management_unit.slug
        expected["jurisdiction"] = jurisdiction_dict

        obs = response.data.get("manUnits")
        assert obs[0].keys() == expected.keys()

        assert obs == [expected]
