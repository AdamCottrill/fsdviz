"""Tests in this file ensure that the api list and detail views for
the common application objects work as expected. Only simple get
requests from anonymous users are considered.

Most of the tests are in pairs - the first tests the list view, while
the second tests the detail view.

Post, put, patch and delete views have not been tested (yet), nor have
any views that test authenticated users.

"""


import pytest

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

# from fsdviz.common.models import Lake

from ..common_factories import (
    LakeFactory,
    Grid10Factory,
    AgencyFactory,
    SpeciesFactory,
    StateProvinceFactory,
    JurisdictionFactory,
    ManagementUnitFactory,
)


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
                "slug": huron_jurisdiction.slug,
                "stateprov": ontario,
                "lake": huron,
                "name": huron_jurisdiction.name,
                "description": huron_jurisdiction.description,
            },
            {
                "slug": erie_jurisdiction.slug,
                "stateprov": ontario,
                "lake": erie,
                "name": erie_jurisdiction.name,
                "description": erie_jurisdiction.description,
            },
            {
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
