"""=============================================================
 c:/1work/fsdviz/fsdviz/tests/integration_tests/test_cwt_sequence_detail_page.py
 Created: 25 Feb 2021 08:11:13

 DESCRIPTION:

  The cwt sequence detail page should include information about the
  cwt and its associated stocking events.

  Basic elements:

  - cwt number, manufacturer, tag type,

  - associatd stocking events

  - javascript arrays for map bounds and stocking event data to plot
    the poitns

  Warnings:

  - if the cwt has been stocked in more than one lake, species,
    strain, or by more than one agency, those attributes should be
    identified with a different class to highlight the reuse

  - it the tag is squential the sequence range should appear in
    stocking event header

  - if there is more than one cwt objects (two manufacturers), there
    should be two cwt cards with details of each and the headers of
    the stocking event lists should include the manufacture details


 A. Cottrill
=============================================================

"""


import pytest
from pytest_django.asserts import assertContains, assertTemplateUsed

from django.urls import reverse
from ..common_factories import CWTFactory, CWTsequenceFactory

from fsdviz.common.models import CWT
from ..pytest_fixtures import cwt_stocking_events


@pytest.mark.django_db
def test_cwt_sequence_detail_basic_elements(client, cwt_stocking_events):
    """For a standard cwt that does not have any complicating factors -
    single lake, strain, year class, and agency, the cwt squence
    details page should include:

    + one cwt detail card
    + the cwt number,  tag type, manufacturer,

    + the stocking events as a table

    + the stocking events and lake bounds as javascript arrays.

    + cwt-warning should not appear in the response

    """

    cwt_number = "111111"
    url = reverse("stocking:cwt-detail", kwargs={"cwt_number": cwt_number})

    response = client.get(url)
    assert response.status_code == 200

    assertTemplateUsed("stocking/cwt_detail.html")

    elements = [
        '<div class="header">CWT Number: 11-11-11</div>',
        "<p ><strong>Manufacturer:</strong> Northwest Marine Technology</p>",
        "<p ><strong>Tag Type:</strong> Coded Wire Tag</p>",
        "<p ><strong>Tag Reused :</strong> False</p>",
        "<p ><strong>Multiple Lakes:</strong> False</p>",
        "<p ><strong>Multiple Species:</strong> False</p>",
        "<p ><strong>Multiple Strains :</strong> False</p>",
        "<p ><strong>Multiple Year Classes:</strong> False</p>",
        "<p ><strong>Multiple Agencies:</strong> False</p>",
        "<h4>Stocking Events</h4>",
    ]

    for element in elements:
        assertContains(response, element, html=True)


@pytest.mark.django_db
def test_cwt_sequence_micromark(client, cwt_stocking_events):
    """Tags manufactured by micromark are odd - the response should
    include a warning if the tag was not manufactured by micromark.

    """

    cwt_number = "551111"
    url = reverse("stocking:cwt-detail", kwargs={"cwt_number": cwt_number})

    response = client.get(url)
    assert response.status_code == 200

    assertTemplateUsed("stocking/cwt_detail.html")

    element = '<p class="cwt-warning" > <strong>Manufacturer:</strong> Micro Mark</p>'
    assertContains(response, element, html=True)


@pytest.mark.django_db
def test_cwt_sequence_sequential(client, cwt_stocking_events):
    """Sequential tags are problematic - if the cwt object is a sequential
    tag the reponse should include a warning, the sequence range(s), and
    the stocking event should indictate which tag sequences they are
    associated with.
    """

    cwt_number = "111166"
    url = reverse("stocking:cwt-detail", kwargs={"cwt_number": cwt_number})

    response = client.get(url)
    assert response.status_code == 200

    assertTemplateUsed("stocking/cwt_detail.html")

    element = '<p class="cwt-warning" > <strong>Tag Type:</strong> Sequential Coded Wire Tag</p>'
    assertContains(response, element, html=True)

    # the stocking events header should include the bounds of the sequence range
    element = "<h4>Stocking Events  (1-500)  </h4>"
    assertContains(response, element, html=True)


args = [
    # "attribute", 'html'
    ("tag_reused", '<p class="cwt-warning"><strong>Tag Reused :</strong> True</p>'),
    (
        "multiple_species",
        '<p class="cwt-warning"><strong>Multiple Species:</strong> True</p>',
    ),
    (
        "multiple_strains",
        '<p class="cwt-warning"><strong>Multiple Strains :</strong> True</p>',
    ),
    (
        "multiple_yearclasses",
        '<p class="cwt-warning"> <strong>Multiple Year Classes:</strong> True</p>',
    ),
    (
        "multiple_agencies",
        '<p class="cwt-warning"><strong>Multiple Agencies:</strong> True</p>',
    ),
    (
        "multiple_lakes",
        '<p class="cwt-warning"><strong>Multiple Lakes:</strong> True</p>',
    ),
]


@pytest.mark.django_db
@pytest.mark.parametrize("attribute, expected_html,", args)
def test_cwt_sequence_reused(client, cwt_stocking_events, attribute, expected_html):
    """If any of the attributes indicating that the tag has been reused in
    multiple species, strains, lakes or agecy, a warnig should be included
    in the response."""

    # get our cwt and update the attribute before we view the detail page:
    cwt_number = "111111"
    cwt = CWT.objects.get(cwt_number=cwt_number)
    setattr(cwt, attribute, "True")
    cwt.save()

    url = reverse("stocking:cwt-detail", kwargs={"cwt_number": cwt_number})

    response = client.get(url)
    assert response.status_code == 200
    assertTemplateUsed("stocking/cwt_detail.html")

    assertContains(response, expected_html, html=True)


@pytest.mark.django_db
def test_cwt_sequence_duplicate_cwt_numbers(client, cwt_stocking_events):
    """If the cwt has been used more than once - ie. there is more than a
    single cwt object with the same cwt number, two summary cards
    should be presented on the page - one for each tag.

    The micromark card will include a warnng.

    """

    # create a cwt with the same number as an existing cwt:
    cwt_number = "111111"
    cwtMicroMark = CWTFactory(cwt_number=cwt_number, manufacturer="mm")
    CWTsequenceFactory(cwt=cwtMicroMark)

    url = reverse("stocking:cwt-detail", kwargs={"cwt_number": cwt_number})

    response = client.get(url)
    assert response.status_code == 200
    assertTemplateUsed("stocking/cwt_detail.html")

    # the header should appear twice:
    header = '<div class="header">CWT Number: 11-11-11</div>'
    assertContains(response, header, count=2, html=True)

    nmt = "<p ><strong>Manufacturer:</strong> Northwest Marine Technology</p>"
    assertContains(response, header, html=True)

    # micromark includes a warning:
    mm = '<p class="cwt-warning"><strong>Manufacturer:</strong> Micro Mark</p>'
    assertContains(response, header, html=True)
