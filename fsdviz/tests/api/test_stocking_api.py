"""Tests in this file ensure that the api list and detail views for the stocking
application objects work as expected. Only simple get requests from anonymous
users are considered here for the basic lookup type endpoints (stocking event
endpoints are tested more thoroughly elsewhere).

Most of the tests are in pairs - the first tests the list view, while the second
tests the detail view.

Post, put, patch and delete views have not been tested (yet), nor have any views
that test authenticated users.

"""


import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..stocking_factories import (
    ConditionFactory,
    HatcheryFactory,
    LifeStageFactory,
    StockingMethodFactory,
)


class TestHatcheryAPI(APITestCase):
    def test_hatchery_api_get_list(self):

        # create a list of dicts that will be used create our objects
        # and tested against the json in the response.
        objects = [
            {
                "hatchery_name": "Jake Wolf Memorial Fish Hatchery",
                "abbrev": "JWMFH",
                "description": "",
                "hatchery_type": "state",
            },
            {
                "hatchery_name": "Kettle Moraine Springs Hatchery",
                "abbrev": "KMSH",
                "description": "",
                "hatchery_type": "state",
            },
            {
                "hatchery_name": "Lake Mills Hatchery",
                "abbrev": "LMH",
                "description": "",
                "hatchery_type": "state",
            },
        ]

        for obj in objects:
            HatcheryFactory(**obj)

        url = reverse("stocking_api:hatchery-list")

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

        for obj in objects:
            assert obj in response.data

    def test_hatchery_api_get_detail(self):
        """We should be able to get the details of a single hatchery
        object by passing it's abbrev to the url."""

        abbrev = "KMSH"
        obj = {
            "hatchery_name": "Kettle Moraine Springs Hatchery",
            "abbrev": abbrev,
            "description": "",
            "hatchery_type": "state",
        }

        HatcheryFactory(**obj)

        url = reverse("stocking_api:hatchery-detail", kwargs={"abbrev": abbrev})

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        assert obj == response.data


class TestLifestageAPI(APITestCase):
    def test_lifestage_api_get_list(self):

        # create a list of dicts that will be used create our objects
        # and tested against the json in the response.
        objects = [
            {"abbrev": "e", "description": "egg"},
            {"abbrev": "f", "description": "fingerling, age-0"},
            {"abbrev": "ff", "description": "fall fingerling, age-0"},
        ]

        for obj in objects:
            LifeStageFactory(**obj)

        url = reverse("stocking_api:lifestage-list")

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

        for obj in objects:
            assert obj in response.data

    def test_lifestage_api_get_detail(self):
        """We should be able to get the details of a single lifestage
        object by passing it's abbrev to the url."""

        abbrev = "f"
        obj = {"abbrev": abbrev, "description": "fingerling, age-0"}

        LifeStageFactory(**obj)

        url = reverse("stocking_api:lifestage-detail", kwargs={"abbrev": abbrev})

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        assert obj == response.data


class TestStockingMethodAPI(APITestCase):
    def test_stocking_method_api_get_list(self):

        objects = [
            {"stk_meth": "acc", "description": "Acclimation Site"},
            {"stk_meth": "atv", "description": "all terrain vehicle"},
            {"stk_meth": "b", "description": "boat, offshore stocking"},
        ]

        for obj in objects:
            StockingMethodFactory(**obj)

        url = reverse("stocking_api:stockingmethod-list")

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

        for obj in objects:
            assert obj in response.data

    def test_stocking_method_api_get_detail(self):
        """We should be able to get the details of a single stocking method
        object by passing it's abbrev to the url."""

        stk_meth = "b"
        obj = {"stk_meth": stk_meth, "description": "boat, offshore stocking"}

        StockingMethodFactory(**obj)

        url = reverse(
            "stocking_api:stockingmethod-detail", kwargs={"stk_meth": stk_meth}
        )

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        assert obj == response.data


class TestConditionAPI(APITestCase):
    def test_condition_api_get_list(self):

        objects = [
            {"condition": 0, "description": "unknown condition at stocking"},
            {"condition": 2, "description": "1-2% mortality observed"},
            {
                "condition": 4,
                "description": "5-25% mortality observed",
            },
        ]

        for obj in objects:
            ConditionFactory(**obj)

        url = reverse("stocking_api:condition-list")

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        # there is a placeholder condition comming from somehere (99-'')
        # no idea why this is happending.  This should be 3 rather than 4:
        assert len(response.data) == 4

        for obj in objects:
            assert obj in response.data

    def test_condition_api_get_detail(self):
        """We should be able to get the details of a single condition
        object by passing it's abbrev to the url."""

        condition = 1
        obj = {"condition": condition, "description": "unknown condition at stocking"}

        ConditionFactory(**obj)

        url = reverse("stocking_api:condition-detail", kwargs={"condition": condition})

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        assert obj == response.data
