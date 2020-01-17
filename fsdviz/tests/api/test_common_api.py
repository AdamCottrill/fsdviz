"""Tests in this file ensure that the api list and detail views for
the common application objects work as expected. Only simple get
requests from anonymous users are considered.

Most of the tests are in pairs - the first tests the list view, while
the second tests the detail view.

Post, put, patch and delete views have not been tested (yet), nor have
any views that test authenticated users.

"""


import pytest

from collections import OrderedDict
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

# from fsdviz.common.models import Lake

from ..common_factories import (
    LakeFactory,
    Grid10Factory,
    AgencyFactory,
    CWTFactory,
    SpeciesFactory,
    StrainFactory,
    StrainRawFactory,
    StateProvinceFactory,
    JurisdictionFactory,
    MarkFactory,
    ManagementUnitFactory,
)


# @pytest.fixture
# def polygon_fixture(scope="class", autouse=True):
#     """create a default polygone with simple coordinates
#     (centroid = POINT(-82.25 44.25))
#     """
#     grid = (
#         "MULTIPOLYGON(((-82.0 44.0,"
#         + "-82.5 44.0,"
#         + "-82.5 44.5,"
#         + "-82.0 44.5,"
#         + "-82.0 44.0)))"
#     )
#     polygon = GEOSGeometry(grid.replace("\n", ""), srid=4326)

#     return polygon


class TestLakeAPI(APITestCase):
    def test_lake_api_get_list(self):

        # create a list of dicts that will be used create our objects
        # and tested against the json in the response.
        objects = [
            dict(abbrev="HU", lake_name="Huron"),
            dict(abbrev="SU", lake_name="Superior"),
            dict(abbrev="ER", lake_name="Erie"),
        ]

        for obj in objects:
            LakeFactory(**obj)

        url = reverse("common_api:lake-list")

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

        for obj in objects:
            assert obj in response.data

    def test_lake_api_get_detail(self):
        """We should be able to get the details of a single Lake
        object by passing it's abbrev to the url."""

        abbrev = "HU"
        obj = {"abbrev": abbrev, "lake_name": "Lake Huron"}

        LakeFactory(**obj)

        url = reverse("common_api:lake-detail", kwargs={"abbrev": abbrev})

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        assert obj == response.data


class TestAgencyAPI(APITestCase):
    def test_agency_api_get_list(self):

        # create a list of dicts that will be used create our objects
        # and tested against the json in the response.
        objects = [
            dict(
                abbrev="MNRF",
                agency_name="Ontario Ministry of Natural Resources and Forestry",
            ),
            dict(abbrev="USFWS", agency_name="U.S. Fish and Wildlife Service"),
            dict(abbrev="ODNR", agency_name="Ohio Department of Natural Resources"),
        ]

        for obj in objects:
            AgencyFactory(**obj)

        url = reverse("common_api:agency-list")

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

        for obj in objects:
            assert obj in response.data

    def test_agency_api_get_detail(self):
        """We should be able to get the details of a single Agency
        object by passing it's abbrev to the url."""

        abbrev = "MNRF"
        obj = {"abbrev": abbrev, "agency_name": "Ontario Ministry of Natural Resources"}

        AgencyFactory(**obj)

        url = reverse("common_api:agency-detail", kwargs={"abbrev": abbrev})

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        assert obj == response.data


class TestStateProvAPI(APITestCase):
    def test_state_prov_api_get_list(self):

        # create a list of dicts that will be used create our objects
        # and tested against the json in the response.
        objects = [
            {
                "abbrev": "ON",
                "name": "Ontario",
                "country": "CAN",
                "description": "The Province of Ontario",
            },
            {
                "abbrev": "IN",
                "name": "Indiana",
                "country": "USA",
                "description": "The State of Indiana",
            },
            {
                "abbrev": "MI",
                "name": "Michigan",
                "country": "USA",
                "description": "The State of Michigan",
            },
        ]

        for obj in objects:
            StateProvinceFactory(**obj)

        url = reverse("common_api:stateprovince-list")

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

        for obj in objects:
            assert obj in response.data

    def test_state_prov_api_get_detail(self):
        """We should be able to get the details of a single StateProvince
        object by passing it's abbrev to the url."""

        abbrev = "ON"
        obj = {
            "abbrev": abbrev,
            "name": "Ontario",
            "country": "CAN",
            "description": "The Province of Ontario",
        }

        StateProvinceFactory(**obj)

        url = reverse("common_api:stateprovince-detail", kwargs={"abbrev": abbrev})

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        assert obj == response.data


class TestJurisdictionAPI(APITestCase):
    def test_jurisdiction_api_get_list(self):

        # create a list of dicts that will be used create our objects
        # and tested against the json in the response.

        huron = dict(abbrev="HU", lake_name="Lake Huron")
        huron_obj = LakeFactory(**huron)

        superior = dict(abbrev="ON", lake_name="Lake Superior")
        superior_obj = LakeFactory(**superior)

        erie = dict(abbrev="ER", lake_name="Lake Erie")
        erie_obj = LakeFactory(**erie)

        # province of ontario
        ontario = dict(
            abbrev="ON",
            name="Ontario",
            country="CAN",
            description="The Province of Ontario",
        )
        ontario_obj = StateProvinceFactory(**ontario)

        huron_jurisdiction = JurisdictionFactory(lake=huron_obj, stateprov=ontario_obj)
        erie_jurisdiction = JurisdictionFactory(lake=erie_obj, stateprov=ontario_obj)
        superior_jurisdiction = JurisdictionFactory(
            lake=superior_obj, stateprov=ontario_obj
        )

        url = reverse("common_api:jurisdiction-list")

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

        # the data in the response should be a list of dictionaries -
        # one for each jurisdiciton, each with nested dictionaries for
        # lake and stateProvince.

        expected = [
            {
                "id": huron_jurisdiction.id,
                "slug": huron_jurisdiction.slug,
                "stateprov": ontario,
                "lake": huron,
                "name": huron_jurisdiction.name,
                "description": huron_jurisdiction.description,
            },
            {
                "id": erie_jurisdiction.id,
                "slug": erie_jurisdiction.slug,
                "stateprov": ontario,
                "lake": erie,
                "name": erie_jurisdiction.name,
                "description": erie_jurisdiction.description,
            },
            {
                "id": superior_jurisdiction.id,
                "slug": superior_jurisdiction.slug,
                "stateprov": ontario,
                "lake": superior,
                "name": superior_jurisdiction.name,
                "description": superior_jurisdiction.description,
            },
        ]

        for obj in expected:
            assert obj in response.data

    def test_jurisdiction_api_get_detail(self):
        """We should be able to get the details of a single Jurisdiction
        object by passing it's abbrev to the url. The returned object
        is a little more complicated than some of the others as it
        returns nested lake and state-province objects too.

        """

        huron = dict(abbrev="HU", lake_name="Lake Huron")
        huron_obj = LakeFactory(**huron)
        ontario = dict(
            abbrev="ON",
            name="Ontario",
            country="CAN",
            description="The Province of Ontario",
        )
        ontario_obj = StateProvinceFactory(**ontario)

        jurisdiction = JurisdictionFactory(lake=huron_obj, stateprov=ontario_obj)

        url = reverse(
            "common_api:jurisdiction-detail", kwargs={"slug": jurisdiction.slug}
        )

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        expected = {
            "id": jurisdiction.id,
            "slug": jurisdiction.slug,
            "stateprov": ontario,
            "lake": huron,
            "name": jurisdiction.name,
            "description": jurisdiction.description,
        }

        assert expected == response.data


class TestGridAPI(APITestCase):
    def test_grid_api_get_list(self):

        erie_dict = dict(abbrev="ER", lake_name="Erie")
        erie = LakeFactory(**erie_dict)

        # create a list of dicts that will be used create our objects
        # and tested against the json in the response.

        grid1 = Grid10Factory(grid="1234", lake=erie)
        grid2 = Grid10Factory(grid="5678", lake=erie)
        grid3 = Grid10Factory(grid="3333", lake=erie)

        url = reverse("common_api:grid10-list")

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

        for grid in [grid1, grid2, grid3]:
            obj = {
                "id": grid.id,
                "grid": grid.grid,
                "lake": erie_dict,
                "centroid": grid.centroid,
                "slug": grid.slug,
            }
            assert obj in response.data

    def test_grid_api_get_detail(self):
        """We should be able to get the details of a single grid object by
        passing it's slug to the url. Like Jurisdiction, the returned
        object is a little more complicated than some of the others as
        it returns nested lake object too.
        """

        erie_dict = dict(abbrev="ER", lake_name="Erie")
        erie = LakeFactory(**erie_dict)

        grid = Grid10Factory(grid="1234", lake=erie)

        url = reverse("common_api:grid10-detail", kwargs={"slug": grid.slug})

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        expected = {
            "id": grid.id,
            "grid": grid.grid,
            "lake": erie_dict,
            "centroid": grid.centroid,
            "slug": grid.slug,
        }

        assert expected == response.data


class TestManagementUnitAPI(APITestCase):
    def test_management_unit_api_get_list(self):

        erie_dict = dict(abbrev="ER", lake_name="Erie")
        erie = LakeFactory(**erie_dict)

        # create a list of dicts that will be used create our objects
        # and tested against the json in the response.

        mu1 = ManagementUnitFactory(label="OE-1", lake=erie)
        mu2 = ManagementUnitFactory(label="OE-2", lake=erie)
        mu3 = ManagementUnitFactory(label="OE-3", lake=erie)

        url = reverse("common_api:managementunit-list")

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

        for mu in [mu1, mu2, mu3]:
            obj = {
                "id": mu.id,
                "label": mu.label,
                "lake": erie_dict,
                "mu_type": mu.mu_type,
                "slug": mu.slug,
                "primary": bool(mu.primary),
            }
            assert obj in response.data

    def test_management_unit_api_get_detail(self):
        """We should be able to get the details of a single management unit
        object by passing it's slug to the url. Like Jurisdiction, the
        returned object is a little more complicated than some of the
        others as it returns nested lake object too.

        """

        erie_dict = dict(abbrev="ER", lake_name="Erie")
        erie = LakeFactory(**erie_dict)

        mu = ManagementUnitFactory(label="OE-1", lake=erie)

        url = reverse("common_api:managementunit-detail", kwargs={"slug": mu.slug})

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        expected = {
            "id": mu.id,
            "label": mu.label,
            "lake": erie_dict,
            "mu_type": mu.mu_type,
            "slug": mu.slug,
            "primary": bool(mu.primary),
        }

        assert expected == response.data


class TestSpeciesAPI(APITestCase):
    def test_species_api_get_list(self):

        spc1 = SpeciesFactory(
            abbrev="ATS",
            common_name="Atlantic Salmon",
            scientific_name="Salmo salar",
            species_code=77,
            speciescommon="1230100401",
        )
        spc2 = SpeciesFactory(
            abbrev="BKT",
            common_name="Brook Trout",
            scientific_name="Salvelinus fontinalis",
            species_code=80,
            speciescommon="1230101002",
        )

        spc3 = SpeciesFactory(
            abbrev="LWF",
            common_name="Lake Whitefish",
            scientific_name="Coregonus clupeaformis",
            species_code=91,
            speciescommon="1231200112",
        )

        url = reverse("common_api:species-list")

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

        for spc in [spc1, spc2, spc3]:
            expected = {
                "abbrev": spc.abbrev,
                "common_name": spc.common_name,
                "scientific_name": spc.scientific_name,
                "species_code": spc.species_code,
                "speciescommon": spc.speciescommon,
            }

            assert expected in response.data

    def test_species_api_get_detail(self):
        """We should be able to get the details of a single species
        object by passing it's abbreviation to the url.

        """

        species_dict = {
            "abbrev": "LAT",
            "common_name": "Lake Trout",
            "scientific_name": "Salvelinus namaycush",
            "species_code": 81,
            "speciescommon": "1230101098",
        }

        species = SpeciesFactory(**species_dict)

        url = reverse("common_api:species-detail", kwargs={"abbrev": species.abbrev})

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        assert species_dict == response.data


class TestStrainAPI(APITestCase):
    """the strain api should return a dictionary (or list of dictionaries)
    that correspond to the strains used.  The response for a single strain
    should consist of a dictionary with keys for the strain_code,
    strain_label, and species attributes (which will be a single
    dictionary above)

    """

    def setUp(self):
        """
        """
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
        self.strain_dict2 = {
            "strain_code": "BS",
            "strain_label": "Big Sound",
            "strain_species": self.species,
        }
        self.strain2 = StrainFactory(**self.strain_dict2)

        self.strain_dict3 = {
            "strain_code": "JL",
            "strain_label": "Jenny Lake",
            "strain_species": self.species,
        }
        self.strain3 = StrainFactory(**self.strain_dict3)

        # create 3 raw strain objects - all are associated with the
        # same strain and species.  The first one will be used in the
        # list view and detail view, the remaining two will be uses in
        # just the test of the list view.

        # a raw strain:
        self.strainraw_dict = {
            "raw_strain": "SEN",
            "description": "Seneca",
            "species": self.species,
            "strain": self.strain,
        }

        self.strainraw = StrainRawFactory(**self.strainraw_dict)

        # a raw strain:
        self.strainraw_dict2 = {
            "raw_strain": "SEN-2",
            "description": "Seneca-2",
            "species": self.species,
            "strain": self.strain,
        }

        self.strainraw2 = StrainRawFactory(**self.strainraw_dict2)

        # a raw strain:
        self.strainraw_dict3 = {
            "raw_strain": "SEN-3",
            "description": "Seneca-3",
            "species": self.species,
            "strain": self.strain,
        }

        self.strainraw3 = StrainRawFactory(**self.strainraw_dict3)

    def test_strain_api_get_list(self):
        """The strain api list view should return a list of nested objects,
        each corresponding to a strain object.  All of the strain
        labels and strain codes should be returned in the response.

        """

        url = reverse("common_api:strain-list")

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        assert len(response.data) == 3

        values = [x.get("strain_code") for x in response.data]
        for val in ["SN", "BS", "JL"]:
            assert val in values

        values = [x.get("strain_label") for x in response.data]
        for val in ["Seneca", "Big Sound", "Jenny Lake"]:
            assert val in values

    def test_strain_api_get_detail(self):
        """The strain api for a single strain object should return a nested
        json object. the top level keys include the strain code,
        strain label, as well as nested dictionaries for the related
        species.

        """

        url = reverse("common_api:strain-detail", kwargs={"pk": self.strain.pk})

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        keys = set(["id", "slug", "strain_code", "strain_label", "strain_species"])
        assert keys == set(response.data.keys())

        # build our response object - add the id where they are needed
        expected = self.strain_dict.copy()
        expected["id"] = self.strain.id
        expected["slug"] = self.strain.slug
        # add the nested dictionaries
        expected["strain_species"] = self.species_dict

        assert expected == response.data

    def test_strainraw_api_get_list(self):
        """The rawstrain api list view should return a list of nested objects,
        each corresponding to a rawstrain object."""

        url = reverse("common_api:strainraw-list")

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        assert len(response.data) == 3

        raw_strains = [x.get("raw_strain") for x in response.data]
        for strain in ["SEN", "SEN-2", "SEN-3"]:
            assert strain in raw_strains

        descriptions = [x.get("description") for x in response.data]
        for desc in ["Seneca", "Seneca-2", "Seneca-3"]:
            assert desc in descriptions

    def test_strain_raw_api_get_detail(self):
        """The strainraw api for a single strain raw object should return a
        nested json object. the top level keys include the key raw_strain and
        description, as well as nested dictionaries for the related species
        and strain.

        """

        url = reverse("common_api:strainraw-detail", kwargs={"pk": self.strainraw.pk})

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        # verify that we have the keys we think we have:
        keys = set(["id", "raw_strain", "description", "species", "strain"])
        assert keys == set(response.data.keys())

        obs = dict(response.data)

        # build our expected objects - add the id and slug attrs where
        # they are needed:
        strain_dict = self.strain_dict.copy()
        strain_dict["id"] = self.strain.id
        strain_dict["slug"] = self.strain.slug
        strain_dict.pop("strain_species")

        species_dict = self.species_dict.copy()

        # add the nested dictionaries (after remvoving the nested
        # species dict from the strain).
        expected = self.strainraw_dict.copy()
        expected["id"] = self.strainraw.id
        expected["species"] = species_dict
        expected["strain"] = strain_dict

        assert obs["species"] == species_dict
        assert obs["strain"] == strain_dict

        assert expected == obs


class TestMarkAPI(APITestCase):
    def setUp(self):
        """Create three marks that will be used in our api calls. THe first
        will be used in both the list and detail views."""
        self.mark1_dict = {
            "clip_code": "5",
            "mark_code": "AD",
            "mark_type": "finclip",
            "description": "Adipose Fin Clip",
        }
        self.mark1 = MarkFactory(**self.mark1_dict)

        self.mark2_dict = {
            "clip_code": "7",
            "mark_code": "DO",
            "mark_type": "finclip",
            "description": "Anterior Dorsal Fin Clip",
        }
        self.mark2 = MarkFactory(**self.mark2_dict)

        self.mark3_dict = {
            "clip_code": "F",
            "mark_code": "LM",
            "mark_type": "finclip",
            "description": "Left Maxilla Fin Clip",
        }
        self.mark3 = MarkFactory(**self.mark3_dict)

    def test_mark_api_get_list(self):
        """Our mark list api should return a list dictionaries, each
        corresponding a mark object."""

        url = reverse("common_api:mark-list")
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        assert len(response.data) == 3

        for mark in [self.mark1_dict, self.mark2_dict, self.mark3_dict]:
            assert mark in response.data

    def test_mark_api_get_detail(self):
        """Our mark detail api should return a dictionary corresponding to a
        single mark object and should contian the keys clip_code,
        mark_code, mark_type, description.  The mark detail uses the
        mark code as the lookup field (unique identifier.)

        """
        url = reverse(
            "common_api:mark-detail", kwargs={"mark_code": self.mark1.mark_code}
        )
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        keys = set(["clip_code", "mark_code", "mark_type", "description"])
        assert keys == set(response.data.keys())

        assert self.mark1_dict == response.data


class TestCWTAPI(APITestCase):
    def setUp(self):
        """Create three cwts that will be used in our api calls. The first
        will be used in both the list and detail views."""

        self.cwt1_dict = {
            "cwt_number": 111111,
            "manufacturer": "nmt",
            "tag_type": "cwt",
            "slug": "111111_nmt",
        }
        self.cwt1 = CWTFactory(**self.cwt1_dict)

        self.cwt2_dict = {
            "cwt_number": 222222,
            "manufacturer": "nmt",
            "tag_type": "cwt",
            "slug": "222222_nmt",
        }
        self.cwt2 = CWTFactory(**self.cwt2_dict)

        self.cwt3_dict = {
            "cwt_number": 333333,
            "manufacturer": "mm",
            "tag_type": "cwt",
            "slug": "333333_mm",
        }
        self.cwt3 = CWTFactory(**self.cwt3_dict)

    def test_cwt_api_get_list(self):
        """Our cwt list api should return a list dictionaries, each
        corresponding a cwt object."""

        url = reverse("common_api:cwt-list")
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        assert len(response.data) == 3

        for cwt in [self.cwt1_dict, self.cwt2_dict, self.cwt3_dict]:
            expected = OrderedDict(
                cwt_number=str(cwt.get("cwt_number")),
                tag_type="cwt",
                manufacturer=cwt.get("manufacturer"),
                slug=cwt.get("slug"),
            )
            assert expected in response.data

    def test_cwt_api_get_detail(self):

        url = reverse("common_api:cwt-detail", kwargs={"slug": self.cwt1.slug})
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        keys = set(["cwt_number", "tag_type", "manufacturer", "slug"])
        assert keys == set(response.data.keys())

        expected = self.cwt1_dict.copy()
        expected["cwt_number"] = str(expected["cwt_number"])

        assert expected == response.data
