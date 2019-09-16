# from django import forms
import pytest

from fsdviz.stocking.forms import XlsEventForm


@pytest.fixture
def xls_choices():
    """
    """
    choices = {
        "lakes": [("HU", "HU")],
        "agencies": [("OMNR", "OMNR")],
        "state_prov": [("ON", "ON")],
        "stat_dist": {"HU": [("GB1", "GB1")]},
        "species": [("LAT", "Lake Trout")],
        "lifestage": [("y", "yearling")],
        "condition": [(1, 1)],
        "stocking_method": [("b", "boat")],
        "grids": {"HU": [("1234", "1234")]},
    }

    return choices


@pytest.mark.django_db
def test_xlseventform(xls_choices):
    """
    """

    data = {"lake": "HU"}
    form = XlsEventForm(data=data, choices=xls_choices)
    assert 0 == 1
