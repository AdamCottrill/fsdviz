"""This file contains a single test that will verify that the
stocking_lookups api returns the expected results.  The stocking lookup
api returns a list of key:value pairs used by the front end
applications.  The key values pairs are used to map labels back to
object ids.

"""


import pytest

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..stocking_factories import (
    LifeStageFactory,
    StockingMethodFactory,
)


class TestCommonLookupAPI(APITestCase):
    """The common lookup api return a response with the following structure:

    "stockingmethods":[("stk_meth", "description", "color"), ....],
    "lifestages": [("abbrev", "description", "color"), ....]


    """

    def setUp(self):
        """In order to test our stocking lookup api - we will need at least one
        object for each key.

        """

        self.stocking_method_dict = {
            "stk_meth": "b",
            "description": "boat, offshore stocking",
            "color": "#46f0f0",
        }
        self.stocking_methods = StockingMethodFactory(**self.stocking_method_dict)

        self.lifestage_dict = {
            "abbrev": "f",
            "description": "fingerling, age-0",
            "color": "#bcf60c",
        }

        self.lifestages = LifeStageFactory(**self.lifestage_dict)

    def test_common_lookups_api(self):
        """the stocking lookups api should return a list of dictionaries/json
        corresponding to objects from stocking application (stocking
        methods and lifestages) The values in this dictionary are used
        by the front-end scripts to provide meaningful labels and
        colours to elements identified by their key.  This test
        verified that the stocking lookup api returns the correct
        elements, and that those elements are structured as spec'd.

        """

        url = reverse("stocking_api:api-get-stocking-lookups")

        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        keys = set(
            [
                "stockingmethods",
                "lifestages",
            ]
        )
        obs = set(response.data.keys())
        assert keys == obs
        assert response.data.get("stockingmethods") == [self.stocking_method_dict]
        assert response.data.get("lifestages") == [self.lifestage_dict]
