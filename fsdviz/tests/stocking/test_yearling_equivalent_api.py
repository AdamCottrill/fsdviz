"""=============================================================
 ~/fsdviz/tests/stocking/test_yearling_equivalent_api.py

 Created: 10 May 2021 14:18:23

 DESCRIPTION:

  The tests in this file ensure that the api endpoint for yearling
  equivalents return the expected results and respect their filters.

 A. Cottrill
=============================================================

"""


import pytest

from django.urls import reverse
from rest_framework import status

from fsdviz.tests.common_factories import SpeciesFactory
from fsdviz.tests.stocking_factories import LifeStageFactory, YearlingEquivalentFactory


@pytest.fixture()
def db_setup():
    """"""

    lake_trout = SpeciesFactory(abbrev="LAT", common_name="Lake Trout")
    brown_trout = SpeciesFactory(abbrev="BRT", common_name="Brown Trout")
    walleye = SpeciesFactory(abbrev="WAL", common_name="Walleye")

    fry = LifeStageFactory(abbrev="f", description="fry")
    ff = LifeStageFactory(abbrev="ff", description="fall fingerlings")
    yearlings = LifeStageFactory(abbrev="y", description="yearlings")

    YearlingEquivalentFactory(species=lake_trout, lifestage=fry, yreq_factor=0.001)
    YearlingEquivalentFactory(species=lake_trout, lifestage=yearlings, yreq_factor=1.0)
    YearlingEquivalentFactory(species=walleye, lifestage=fry, yreq_factor=0.005)
    YearlingEquivalentFactory(species=brown_trout, lifestage=ff, yreq_factor=0.1)


yreq_args = [
    ({"species": "LAT"}, [0.001, 1.0]),
    ({"species": "BRT,WAL"}, [0.005, 0.1]),
    ({"lifestage": "f"}, [0.001, 0.005]),
    ({"lifestage": "ff,y"}, [0.1, 1]),
    ({}, [0.001, 0.005, 0.1, 1]),
]


@pytest.mark.django_db
@pytest.mark.parametrize("filter, expected", yreq_args)
def test_yearing_equivalent_filter(client, db_setup, filter, expected):
    """the yearing_equivalent endpoint has filters for species and
    lifestage. This test verifies that the filter works as expected.

    """

    url = reverse("stocking_api:yearlingequivalent-list")
    response = client.get(url, filter)
    assert response.status_code == status.HTTP_200_OK

    observed = [x["yreq_factor"] for x in response.data]
    observed.sort()
    expected.sort()
    assert expected == observed


@pytest.mark.django_db
def test_yearing_equivalent_detail(client):
    """The api endpoint for yearling equivalents should contain the
    species, the lifestage, and the yearing equivalent factor.

    + it should have the keys: 'species', "lifestage", "yreq_factor"

    + the species element  sould have sub keys: "common_name" and "abbrev"

    + lifestage element sould have sub keys: "common_name" and "abbrev"

    + the yreq_Factor should be the same as the one used to build the
    yearling-equivalent factor.

    """

    species_dict = {
        "abbrev": "LAT",
        "common_name": "Lake Trout",
    }
    species = SpeciesFactory(**species_dict)

    lifestage_dict = {
        "abbrev": "f",
        "description": "fry",
    }
    lifestage = LifeStageFactory(**lifestage_dict)

    yreq_factor = 0.1
    yreq = YearlingEquivalentFactory(
        species=species, lifestage=lifestage, yreq_factor=yreq_factor
    )

    url = reverse("stocking_api:yearlingequivalent-detail", kwargs={"pk": yreq.id})

    response = client.get(url)
    assert response.status_code == status.HTTP_200_OK

    response_dict = response.data
    assert set(response_dict.keys()) == {"species", "lifestage", "yreq_factor"}

    assert response_dict["species"] == species_dict
    assert response_dict["lifestage"] == lifestage_dict
    assert response_dict["yreq_factor"] == yreq_factor
