"""=============================================================
~/fsdviz/tests/integration_tests/test_permission_elements.py
 Created: 18 Nov 2020 14:30:57

 DESCRIPTION:

  This test file verifies that element that are presented
  conditionally depending on permission/roles associate with the user
  are shown or hidden approprately.

  There are currently 4 types of authenticated user (plus
    anonymous users):

     + GREAT_LAKES_COORDINATOR = "glsc"
     + AGENCY_MANAGER = "am"
     + AGENCY_COORDINATOR = "asc"
     + AGENCY_USER = "au"

    agency Manager and agency user currently have the same permissions

     + The Great Lakes Stocking Coordinators are essentially admins and
     should be able to:
        + access the admin page
        + CRUD any stocking event
        + CRUD their bookmarks
        + upload events
        + download stocking data

     + am and asc should be able to:
        + NOT access the admin page
        + create, update or delete only the stocking event
          associated with their agency and lake(s)
        + upload events
        + CRUD their bookmarks
        + download stocking data

     + agency user should:
        + NOT access the admin page
        + NOT be able to create, update, or delete any stocking events
        + NOT upload events
        + CRUD their bookmarks
        + download stocking data

     + anonymous user should:
        + NOT access the admin page
        + NOT be able to create, update, or delete any stocking events
        + NOT upload events
        + NOT be able to create bookmarks
        + download stocking data(?)

  There are two types of object that need to be protected - stocking
  events and stocking event uploads.


  - effected view:
  # group and object level:
  stocking.event_detail
  stocking.edit_stocking_event
  stocking.DataUploadEventListView
  stocking.DataUploadEventDetailView

  # permissions (group):
  stocking.data_uploads
  stocking.xls_events






    TODO

    - create a tempalte tag and verify that buttons and links are
      conditionally rendered in templates

    - create integration tests and verify that users premissions are
      implemented correctly with GET and POST requests




 A. Cottrill
=============================================================

"""

import pytest
from django.urls import reverse
from pytest_django.asserts import assertTemplateUsed, assertTemplateNotUsed

from fsdviz.tests.pytest_fixtures import (
    user,
    glsc,
    huron_mdnr_sc,
    huron_mdnr_user,
    mdnr,
    huron,
    superior,
    usfws,
    data_uploads,
    stocking_events,
)

# =============================
# ADMIN LINK and URLS
# the django admin should only be vsible if the user "is_staff"


@pytest.mark.django_db
def test_admin_links_for_admin_user(client, admin_user):
    """an user who has been identifeid as an django admin_user should have
    the link to the admin page available to them in the navbar.
    """

    login = client.login(email=admin_user.email, password="password")
    assert login is True
    url = reverse("stocking:stocking-events-year", kwargs={"year": 2010})
    response = client.get(url)
    content = str(response.content)
    url = reverse("admin:index")
    assert url in content

    response = client.get(url)
    content = str(response.content)
    assert "Site administration" in content


@pytest.mark.django_db
def test_admin_links_for_user(client, user):
    """an user who has NOT been identifeid as a django admin user should
    Not have the link to the admin page available to them in the
    navbar, or be able to access the admin page.

    """

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True
    url = reverse("stocking:stocking-events-year", kwargs={"year": 2010})
    response = client.get(url)
    content = str(response.content)
    url = reverse("admin:index")
    assert url not in content

    response = client.get(url, follow=True)
    assertTemplateUsed(response, "admin/login.html")


@pytest.mark.django_db
def test_admin_links_for_anon_user(client):
    """an anonymous user who should
    Not have the link to the admin page available to them in the
    navbar, or be able to access the admin page.

    """

    url = reverse("stocking:stocking-events-year", kwargs={"year": 2010})
    response = client.get(url)
    content = str(response.content)
    url = reverse("admin:index")
    assert url not in content

    response = client.get(url, follow=True)
    assertTemplateUsed(response, "admin/login.html")


# =============================
# DATA UPLOAD LINKS
# the links to data upload list and upload data should only be
# presented if the user is a stocking coordinator, they should not be
# visble to agency users or annonomous users


@pytest.mark.django_db
def test_upload_links_for_gl_coordinators(client, glsc):
    """a user who is identified as a great lakes stocking coordinator
    should have links to both data upload list and a link to upload new
    data."""

    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True
    url = reverse("stocking:stocking-events-year", kwargs={"year": 2010})
    response = client.get(url)
    content = str(response.content)
    urls = [
        reverse("stocking:data-upload-event-list"),
        reverse("stocking:upload-stocking-events"),
    ]
    for url in urls:
        assert url in content


@pytest.mark.django_db
def test_upload_links_for_agency_coordinators(client, huron_mdnr_sc):
    """a user who is identified as an agency stocking coordinator
    should have links to both data upload list and a link to upload new
    data."""

    login = client.login(email=huron_mdnr_sc.email, password="Abcd1234")
    assert login is True
    url = reverse("stocking:stocking-events-year", kwargs={"year": 2010})
    response = client.get(url)
    content = str(response.content)
    urls = [
        reverse("stocking:data-upload-event-list"),
        reverse("stocking:upload-stocking-events"),
    ]
    for url in urls:
        assert url in content


@pytest.mark.django_db
def test_upload_links_for_agency_user(client, huron_mdnr_user):
    """a user who is identified as an agency user should NOT have links to
    either the data upload list or a link to upload new data.

    """

    login = client.login(email=huron_mdnr_user.email, password="Abcd1234")
    assert login is True
    url = reverse("stocking:stocking-events-year", kwargs={"year": 2010})
    response = client.get(url)
    content = str(response.content)
    urls = [
        reverse("stocking:data-upload-event-list"),
        reverse("stocking:upload-stocking-events"),
    ]
    for url in urls:
        assert url not in content


@pytest.mark.django_db
def test_upload_links_not_included_for_anon_user(client):
    """an anonymous user should NOT have links to either the data upload list
    or a link to upload new data.

    """

    url = reverse("stocking:stocking-events-year", kwargs={"year": 2010})
    response = client.get(url)
    content = str(response.content)
    urls = [
        reverse("stocking:data-upload-event-list"),
        reverse("stocking:upload-stocking-events"),
    ]
    for url in urls:
        assert url not in content


# =================================
#    UPLOAD EVENT LIST ACCESS


@pytest.mark.django_db
def test_upload_list_accessible_to_gl_coordinators(client, glsc, data_uploads):
    """A user with the role of great lakes stocking coordinator should be
    able to access the list of upload events, and it should include all
    agencies and all lakes.
    """

    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True
    url = reverse("stocking:data-upload-event-list")
    response = client.get(url)
    content = str(response.content)

    for upload in data_uploads:
        assert upload.slug in content


@pytest.mark.django_db
def test_upload_list_accessible_for_agency_coordinators(
    client, huron_mdnr_sc, data_uploads
):
    """A user with the role of agency stocking coordinator should be able
    to access the list of upload events, but it should only include
    upload events that are associated with their lake(s) and agency.
    """

    login = client.login(email=huron_mdnr_sc.email, password="Abcd1234")
    assert login is True
    url = reverse("stocking:data-upload-event-list")
    response = client.get(url)
    content = str(response.content)

    assert data_uploads[0].slug in content
    assert data_uploads[1].slug not in content
    assert data_uploads[2].slug not in content
    assert data_uploads[3].slug not in content


@pytest.mark.django_db
def test_upload_list_not_accessible_to_agency_user(
    client, huron_mdnr_user, data_uploads, stocking_events
):
    """A user with the role of agency stocking user should NOT be able to
    access the list of upload events and should be redirected to the default
    homepage if they try.
    """

    login = client.login(email=huron_mdnr_user.email, password="Abcd1234")
    assert login is True
    url = reverse("stocking:data-upload-event-list")
    response = client.get(url, follow=True)
    assertTemplateUsed(response, "stocking/event_piechart_map.html")

    content = str(response.content)
    # none of the upload event slugs should be in our response
    for upload in data_uploads:
        assert upload.slug not in content


@pytest.mark.django_db
def test_upload_list_not_accessible_to_anon_user(client, data_uploads):
    """An anonymous user should NOT be able to
    access the list of upload events and should be redirected to the
    login page if they try.
    """

    url = reverse("stocking:data-upload-event-list")
    response = client.get(url, follow=True)
    assertTemplateUsed(response, "registration/login.html")

    content = str(response.content)
    # none of the upload event slugs should be in our response
    for upload in data_uploads:
        assert upload.slug not in content


# =================================
#    UPLOAD EVENT DETAIL ACCESS


@pytest.mark.django_db
def test_upload_detail_accessible_to_gl_coordinators(client, glsc, data_uploads):
    """A user with the role of great lakes stocking coordinator should be
    able to access the detail of upload events, and it should include all
    agencies and all lakes.
    """

    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True
    url = reverse(
        "stocking:data-upload-event-detail", kwargs={"slug": data_uploads[0].slug}
    )
    response = client.get(url)
    assertTemplateUsed(response, "stocking/upload_event_detail.html")

    content = str(response.content)
    assert "Data Upload Event Detail" in content
    assert data_uploads[0].slug in content


@pytest.mark.django_db
def test_upload_detail_accessible_for_agency_coordinators(
    client, huron_mdnr_sc, data_uploads
):
    """A user with the role of agency stocking coordinator should be able
    to access the detail of upload events, but it should only include
    upload events that are associated with their lake(s) and agency.
    """

    login = client.login(email=huron_mdnr_sc.email, password="Abcd1234")
    assert login is True
    url = reverse(
        "stocking:data-upload-event-detail", kwargs={"slug": data_uploads[0].slug}
    )
    response = client.get(url)
    assertTemplateUsed(response, "stocking/upload_event_detail.html")

    content = str(response.content)
    assert "Data Upload Event Detail" in content
    assert data_uploads[0].slug in content


@pytest.mark.django_db
def test_upload_detail_other_agency_not_accessible_for_agency_coordinators(
    client, huron_mdnr_sc, data_uploads, stocking_events
):
    """A user with the role of agency stocking coordinator not should be able
    to access the detail of upload events assoiciated with a different lake or agency.
    """

    login = client.login(email=huron_mdnr_sc.email, password="Abcd1234")
    assert login is True

    # event[0] is theirs, events 1-3 belong to someone else.
    for upload in data_uploads[1:]:
        url = reverse("stocking:data-upload-event-detail", kwargs={"slug": upload.slug})
        response = client.get(url, follow=True)
        assertTemplateUsed(response, "stocking/event_piechart_map.html")

        content = str(response.content)
        assert "Data Upload Event Detail" not in content
        assert upload.slug not in content


@pytest.mark.django_db
def test_upload_detail_not_accessible_to_agency_user(
    client, huron_mdnr_user, data_uploads, stocking_events
):
    """A user with the role of agency stocking user should NOT be able to
    access the detail of upload events and should be redirected to their
    homepage if they try.
    """

    login = client.login(email=huron_mdnr_user.email, password="Abcd1234")
    assert login is True
    url = reverse(
        "stocking:data-upload-event-detail", kwargs={"slug": data_uploads[0].slug}
    )
    response = client.get(url, follow=True)
    assertTemplateUsed(response, "stocking/event_piechart_map.html")

    content = str(response.content)
    assert "Data Upload Event Detail" not in content
    assert data_uploads[0].slug not in content


@pytest.mark.django_db
def test_upload_detail_not_accessible_for_anon_user(client, data_uploads):
    """An anonymous user should NOT be able to
    access the detail of upload events and should be redirected to the
    default homepage if they try.
    """

    url = reverse(
        "stocking:data-upload-event-detail", kwargs={"slug": data_uploads[0].slug}
    )
    response = client.get(url, follow=True)
    assertTemplateUsed(response, "registration/login.html")

    content = str(response.content)
    assert "Data Upload Event Detail" not in content
    assert data_uploads[0].slug not in content


# EVENT DETAIL - EDIT BUTTON
# the edit button should render renders on detail page only if the
# user is logged in and has permission to edit that event.


@pytest.mark.django_db
def test_event_edit_button_rended_for_gl_coordinators(client, glsc, stocking_events):
    """A user with the role of great lakes stocking coordinator should see
    the edit event button on every stocking event detail page.

    """

    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True
    for event in stocking_events:
        url = reverse(
            "stocking:stocking-event-detail", kwargs={"stock_id": event.stock_id}
        )
        response = client.get(url)
        assertTemplateUsed(response, "stocking/stocking_detail.html")

        content = str(response.content)
        edit_url = reverse(
            "stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id}
        )
        assert edit_url in content


@pytest.mark.django_db
def test_event_edit_button_rended_for_agency_coordinators(
    client, huron_mdnr_sc, stocking_events
):
    """A button or link to edit a stocking event should be included in the
    response for a user who is role of agency stocking coordinator for
    the lake and agency associated with the event.

    """

    login = client.login(email=huron_mdnr_sc.email, password="Abcd1234")
    assert login is True

    event = stocking_events[0]
    url = reverse("stocking:stocking-event-detail", kwargs={"stock_id": event.stock_id})
    response = client.get(url)
    assertTemplateUsed(response, "stocking/stocking_detail.html")

    content = str(response.content)
    edit_url = reverse(
        "stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id}
    )
    assert edit_url in content


@pytest.mark.django_db
def test_event_edit_button_not_rended_for_agency_coordinators(
    client, huron_mdnr_sc, stocking_events
):
    """A button or link to edit a stocking event should NOT be included in the
    response for a user who is role of agency stocking coordinator for DIFFERENT
    lake or agency associated with the event.

    """

    login = client.login(email=huron_mdnr_sc.email, password="Abcd1234")
    assert login is True
    # event[0] is ours, events[1-3] belong to someone else.
    for event in stocking_events[1:]:

        url = reverse(
            "stocking:stocking-event-detail", kwargs={"stock_id": event.stock_id}
        )
        response = client.get(url)
        assertTemplateUsed(response, "stocking/stocking_detail.html")

        content = str(response.content)
        edit_url = reverse(
            "stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id}
        )
        assert edit_url not in content


@pytest.mark.django_db
def test_event_edit_button_not_rended_for_agency_user(
    client, huron_mdnr_user, stocking_events
):
    """A button or link to edit a stocking event should NOT be included
    in the response for a user who is role of agency user regardless
    of the lake or agency associated with the event.
    """

    login = client.login(email=huron_mdnr_user.email, password="Abcd1234")
    assert login is True

    for event in stocking_events:
        url = reverse(
            "stocking:stocking-event-detail", kwargs={"stock_id": event.stock_id}
        )
        response = client.get(url)
        assertTemplateUsed(response, "stocking/stocking_detail.html")

        content = str(response.content)
        edit_url = reverse(
            "stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id}
        )
        assert edit_url not in content


@pytest.mark.django_db
def test_event_edit_button_not_rended_for_anon_user(client, stocking_events):
    """
    A button or link to edit a stocking event should NOT be included
    in the response for an anonymus user

    """

    for event in stocking_events:

        url = reverse(
            "stocking:stocking-event-detail", kwargs={"stock_id": event.stock_id}
        )
        response = client.get(url)
        assertTemplateUsed(response, "stocking/stocking_detail.html")

        content = str(response.content)
        edit_url = reverse(
            "stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id}
        )
        assert edit_url not in content


# EDIT STOCKING EVENT FORM
# urls accessible/not accessible
# the edit event detail url should only accessible if the
# user is logged in and has permission to edit that event.


@pytest.mark.django_db
def test_edit_stocking_event_accessible_for_gl_coordinators(
    client, glsc, stocking_events
):
    """A user with the role of great lakes stocking coordinator should be able to access
    the edit form for any stocking event.

    """

    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True

    for event in stocking_events:
        url = reverse(
            "stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id}
        )
        response = client.get(url)
        assertTemplateUsed(response, "stocking/stocking_event_form.html")
        content = str(response.content)
        assert "Edit Stocking Event {}".format(event.stock_id) in content


@pytest.mark.django_db
def test_edit_stocking_event_accessible_for_agency_coordinators(
    client, huron_mdnr_sc, stocking_events
):
    """An agency stocking coordinator should be able to access the edit
    form for a stocking event by their agency in the lake they are
    responsible for.

    """

    login = client.login(email=huron_mdnr_sc.email, password="Abcd1234")
    assert login is True

    event = stocking_events[0]
    url = reverse("stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id})

    response = client.get(url)
    assertTemplateUsed(response, "stocking/stocking_event_form.html")

    content = str(response.content)
    assert "Edit Stocking Event {}".format(event.stock_id) in content


@pytest.mark.django_db
def test_edit_stocking_event_form_not_accessible_for_agency_coordinators(
    client, huron_mdnr_sc, stocking_events
):
    """An agency stocking coordinator NOT should be able to access the
    edit form for a stocking events conducted by other their agencies
    or in lakes they are not responsible for.

    """

    login = client.login(email=huron_mdnr_sc.email, password="Abcd1234")
    assert login is True
    # event[0] is ours, events[1-3] belong to someone else.
    for event in stocking_events[1:]:
        url = reverse(
            "stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id}
        )
        response = client.get(url, follow=True)
        assertTemplateNotUsed(response, "stocking/stocking_event_form.html")
        assertTemplateUsed(response, "stocking/stocking_detail.html")
        content = str(response.content)
        assert "Edit Stocking Event {}".format(event.stock_id) not in content


@pytest.mark.django_db
def test_event_edit_button_not_rended_for_agency_user(
    client, huron_mdnr_user, stocking_events
):
    """The edit stocking event form should not be accessible to regular
    agency users, if the do try to access the url, the will be
    redirected to the detail page for that stocking event.

    """

    login = client.login(email=huron_mdnr_user.email, password="Abcd1234")
    assert login is True

    for event in stocking_events:
        url = reverse(
            "stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id}
        )
        response = client.get(url, follow=True)
        assertTemplateNotUsed(response, "stocking/stocking_event_form.html")
        assertTemplateUsed(response, "stocking/stocking_detail.html")
        content = str(response.content)
        assert "Edit Stocking Event {}".format(event.stock_id) not in content


@pytest.mark.django_db
def test_event_edit_button_not_rended_for_anon_user(client, stocking_events):
    """
    The edit stocking event form should not be accessible to regular
        agency users, if the do try to access the url, the will be
        redirected to the login page.

    """

    for event in stocking_events:
        url = reverse(
            "stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id}
        )
        response = client.get(url, follow=True)
        assertTemplateNotUsed(response, "stocking/stocking_event_form.html")
        assertTemplateUsed(response, "registration/login.html")
        content = str(response.content)
        assert "Edit Stocking Event {}".format(event.stock_id) not in content
