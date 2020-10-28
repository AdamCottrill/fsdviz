"""=============================================================
~/fsdviz/tests/integration_tests/test_login_to_homepage.py
 Created: 28 Oct 2020 13:12:42

 DESCRIPTION:

  When a user logs in, they should be redirected to the bookmark they
  have flaged as their homepage - if they have one. If they do not
  have a homepage they should be redirected to the default, basin-wide
  view.

 A. Cottrill
=============================================================

"""


import pytest
from django.urls import reverse

from fsdviz.tests.pytest_fixtures import user
from fsdviz.tests.stocking_factories import StockingEventFactory
from ..bookmark.factories import BookmarkFactory


def test_user_without_homepage(client, user):
    """If a user does not have a bookmark flagged as their homepage, they
    should be redirected to the home url.

    """
    # we need at least one stocking event to access the default
    # homepage (which goes to the current year)
    StockingEventFactory()

    url = reverse("login")

    response = client.post(
        url, data={"username": user.email, "password": "Abcd1234"}, follow=True
    )
    assert response.status_code == 200

    templates = [x.name for x in response.templates]
    template_name = "stocking/event_piechart_map.html"
    assert template_name in templates


def test_user_with_homepage(client, user):
    """If a user does have a bookmark flagged as their homepage, they
    should be redirected to it after they login.
    """

    # create a bookmark for this user to a different view than the default
    homepage_url = reverse("stocking:stocking-event-list")
    BookmarkFactory(url=homepage_url, user=user, homepage=True)

    url = reverse("login")
    response = client.post(
        url, data={"username": user.email, "password": "Abcd1234"}, follow=True
    )
    assert response.status_code == 200

    templates = [x.name for x in response.templates]
    template_name = "stocking/stocking_event_list.html"
    assert template_name in templates
