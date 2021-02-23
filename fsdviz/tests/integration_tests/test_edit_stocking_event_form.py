"""=============================================================
~/fsdviz/fsdviz/tests/integration_tests/test_edit_stocking_event_form.py
 Created: 03 Oct 2019 11:02:02

 DESCRIPTION:

this file contains a number of integration tests that verify that the
edit stocking event form functions as expected.

It should only be accessible to users with appropriate priveleged.  if
an unauthorized use tries to access the url, they should be
re-directed to the login page.

When a logged in use access the url with a stock_id that does not exists,
a helpful 404 page should appear.

When a logged in user accesses the url with a valid stock_id, the form
should render with correct components.

TODO - Add more tests to verify errors and behaviour when good data is
submitted.






 A. Cottrill
=============================================================

"""

import pytest
from django.urls import reverse

from fsdviz.tests.pytest_fixtures import user, glsc

from fsdviz.tests.stocking_factories import StockingEventFactory


@pytest.mark.django_db
def test_unauthorized_user_receives_302(client):
    """If an unauthorized use tries to access the url, the returned status
    code should be 302.

    """
    url = reverse("stocking:edit-stocking-event", kwargs={"stock_id": "foobarbaz"})
    response = client.get(url)
    assert response.status_code == 302


@pytest.mark.django_db
def test_unauthorized_user_redirected_to_login(client):
    """If an unauthorized use tries to access the url, they should be
    re-directed to the login page.

    Currently this test just verifies that unauthenticated users
    cannot see the stocking event form - when roles are established, we
    should ensure that only those with permission to edit this event can
    access the form.

    """

    url = reverse("stocking:edit-stocking-event", kwargs={"stock_id": "foobarbaz"})

    response = client.get(url, follow=True)

    # because of follow=True
    assert response.status_code == 200

    templates = [x.name for x in response.templates]
    assert "registration/login.html" in templates
    content = str(response.content)
    assert "Login" in content


@pytest.mark.django_db
def test_404_for_nonexistant_event(client, user):
    """When a logged in use access the url with a stock_id that does not exists,
    a helpful 404 page should appear."""

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:edit-stocking-event", kwargs={"stock_id": "foobarbaz"})

    response = client.get(url)

    assert response.status_code == 404

    templates = [x.name for x in response.templates]
    assert "404.html" in templates

    content = str(response.content)
    msg = "That is a 404 error! We couldn\\'t find any items matching your query."
    assert msg in content


@pytest.mark.django_db
def test_event_form_renders_for_coordinator(client, glsc):
    """When a logged in user who is a glfc or agency coordinator accesses
    the url with a valid stock_id, the form should render with correct
    components:

    Specific elements include:
    "Edit Stocking Event {stock_id}"
    "Latitude (Decimal Degrees):"
    "Longitude (Decimal Degrees):"
    "Marks Applied:"
    "Marking Efficiency:"
    "Tag Numbers:"
    "Tag Retention:"
    Submit, Cancel, and Reset Form buttons or links

    """

    elements = [
        "Latitude (Decimal Degrees):",
        "Longitude (Decimal Degrees):",
        "Fin Clips:",
        "Physical/Chemical Marks:",
        "Marking Efficiency:",
        "Tags:",
        "Tag Retention:",
        "Submit",
        "Cancel",
        "Reset Form",
    ]

    event = StockingEventFactory(stock_id="202199999")

    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id})

    response = client.get(url, follow=True)

    assert response.status_code == 200

    templates = [x.name for x in response.templates]
    assert "stocking/stocking_event_form.html" in templates

    content = str(response.content)

    msg = "Edit Stocking Event {}".format(event.stock_id)
    assert msg in content

    for element in elements:
        assert element in content


def test_latlon_flag():
    """The latlon_flag is stored in a hidden field on the event detail
    form and is updated based on the elements that are used to
    calculate the coordinates.  The lat-lon flag needs to be submitted
    in the form and be reflected in the updated stocking event object.

    """
    assert 0 == 1
