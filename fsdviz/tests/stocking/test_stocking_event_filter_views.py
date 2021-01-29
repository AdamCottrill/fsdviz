"""The tests in this file ensure that the stocking filters work as
exepected when the stocking event list is rendered.  The main test is
parameterized to accept a list of tuples containing the filter to
apply, and the expected response content.  This test uses the same
fixture as the unit test of the filter, but verify the content of the response.

"""
import pytest
from pytest_django.asserts import assertContains, assertNotContains

from .fixtures import stocking_events
from django.urls import reverse

from ...common.models import Strain


@pytest.mark.usefixtures("stocking_events")
class TestStockingEventFilterView:
    """"""

    # parameters for our integeration test. Each touple contians the
    # filter that will be applied, a list of stock event id's that
    # should be included in the response and a list of events that
    # should not be.
    parameters = [
        ({"lake": "HU"}, ["1111", "2222"], ["3333", "4444"]),
        ({"lake": "ER,ON"}, ["3333", "4444"], ["1111", "2222"]),
        ({"agency": "MNRF"}, ["1111", "3333"], ["2222", "4444"]),
        ({"agency": "ODNR,MDNR"}, ["2222", "4444"], ["1111", "3333"]),
        ({"stateprov": "ON"}, ["1111", "3333"], ["2222", "4444"]),
        ({"stateprov": "MI,OH"}, ["2222", "4444"], ["1111", "3333"]),
        (
            {"jurisdiction": "hu_on"},
            [
                "1111",
            ],
            ["2222", "3333", "4444"],
        ),
        ({"jurisdiction": "hu_on, er_oh"}, ["1111", "4444"], ["2222", "3333"]),
        ({"first_year": "2010"}, ["1111", "2222", "3333"], ["4444"]),
        ({"last_year": "2010"}, ["1111", "2222", "4444"], ["3333"]),
        (
            {"first_year": "2009", "last_year": "2011"},
            ["1111", "2222"],
            ["3333", "4444"],
        ),
        ({"year_class": "2009"}, ["1111", "2222"], ["3333", "4444"]),
        ({"year_class": "2008,2011"}, ["3333", "4444"], ["1111", "2222"]),
        (
            {"stocking_month": "6"},
            [
                "3333",
            ],
            ["1111", "2222", "4444"],
        ),
        (
            {"stocking_month": "99"},
            [
                "2222",
            ],
            ["1111", "3333", "4444"],
        ),
        ({"stocking_month": "6,99"}, ["2222", "3333"], ["1111", "4444"]),
        (
            {"stocking_month": "4,8"},
            ["1111", "4444"],
            ["2222", "3333"],
        ),
        (
            {"species": "LAT"},
            ["1111", "3333"],
            ["2222", "4444"],
        ),
        (
            {"species": "RBT,COS"},
            ["2222", "4444"],
            ["1111", "3333"],
        ),
        (
            {"strain_name": "BS"},
            ["1111", "3333"],
            ["2222", "4444"],
        ),
        (
            {"strain_name": "GAN,WILD"},
            ["2222", "4444"],
            ["1111", "3333"],
        ),
        (
            {"stocking_method": "b"},
            ["2222", "3333"],
            ["1111", "4444"],
        ),
        (
            {"stocking_method": "t,p"},
            ["1111", "4444"],
            ["2222", "3333"],
        ),
        ({"lifestage": "y"}, ["1111", "3333"], ["2222", "4444"]),
        (
            {"lifestage": "f,fry"},
            ["2222", "4444"],
            ["1111", "3333"],
        ),
        ({"clip_code": "LP"}, ["1111"], ["2222", "3333", "4444"]),
        ({"clip_code": "LP, LPRV"}, ["1111", "3333"], ["2222", "4444"]),
        ({"finclips": "LP"}, ["1111", "3333"], ["2222", "4444"]),
        ({"finclips": "LP,RV"}, ["1111", "3333", "4444"], ["2222"]),
        ({"physchem_marks": "OX"}, ["1111", "4444"], ["2222", "3333"]),
        ({"physchem_marks": "OX,BR"}, ["1111", "2222", "4444"], ["3333"]),
        (
            {"fishtags": "FTR"},
            [
                "2222",
            ],
            ["1111", "3333", "4444"],
        ),
        (
            {"fishtags": "CWT,FTR"},
            ["2222", "3333", "4444"],
            [
                "1111",
            ],
        ),
        (
            {"hatchery": "mnrfA"},
            [
                "1111",
            ],
            ["2222", "3333", "4444"],
        ),
        ({"hatchery": "mdnrA,odnrA"}, ["2222", "4444"], ["1111", "3333"]),
    ]

    @pytest.mark.django_db
    @pytest.mark.parametrize("filter, expected, excluded", parameters)
    def test_event_list_view_filters(self, client, filter, expected, excluded):
        """This parameterized test accepts a three-element tuple that contains
        a dictionary with a filter to apply, a list of stocking id that should
        be returned, and a list of stock id's that should not be included in
        the response.

        This is an integration test that uses a client to generate the
        html response and make assertions about its content.

        """

        url = reverse("stocking:stocking-event-list")

        response = client.get(url, filter)
        assert response.status_code == 200

        html = '<td> <a href="/stocking/event_detail/{0}/">{0}</a></td>'

        for value in expected:
            assertContains(response, html.format(value), html=True)

        for value in excluded:
            assertNotContains(response, html.format(value), html=True)

    @pytest.mark.django_db
    def test_one_strain_id_filter(self, client):
        """If we filter for a single strain using the strain id, we should
        get only those events associated with that strain, none of the
        others."""

        # get the current id of the lake trout strain
        id = (
            Strain.objects.filter(species__abbrev="LAT")
            .values_list("pk", flat=True)
            .first()
        )
        filter = {"strain": str(id)}

        url = reverse("stocking:stocking-event-list")

        response = client.get(url, filter)
        assert response.status_code == 200

        html = '<td> <a href="/stocking/event_detail/{0}/">{0}</a></td>'

        for value in ["1111", "3333"]:
            assertContains(response, html.format(value), html=True)

        for value in ["2222", "4444"]:
            assertNotContains(response, html.format(value), html=True)

    @pytest.mark.django_db
    def test_multiple_strain_id_filter(self, client):
        """If we filter for a multiple strains using the strain ids, we
        should get only those events associated with those strains,
        none of the others."""

        # get the current id of the strain associated with RBT and COS
        ids = Strain.objects.filter(species__abbrev__in=["COS", "RBT"]).values_list(
            "pk", flat=True
        )
        url = reverse("stocking:stocking-event-list")
        filter = {"strain": ",".join([str(x) for x in ids])}
        response = client.get(url, filter)
        assert response.status_code == 200

        html = '<td> <a href="/stocking/event_detail/{0}/">{0}</a></td>'

        # these are the RBT and COS:
        for value in ["2222", "4444"]:
            assertContains(response, html.format(value), html=True)
        # these are lake trout:
        for value in ["1111", "3333"]:
            assertNotContains(response, html.format(value), html=True)
