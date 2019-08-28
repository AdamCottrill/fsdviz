"""
=============================================================
~/fsdviz/fsdviz/tests/integration_tests/test_stocking_event_upload.py

 Created: 28 Aug 2019 11:00:01

 DESCRIPTION:

Tests to verify that the file upload views work as expected.

+ authorized users only
+ xls and xlsx files only
+ other file extenstions return with meaningful message.
+ files cannot be too big
+ uploaded file matches schema
+ uploaded file does not match schema

 A. Cottrill
=============================================================
"""

import pytest
from django.urls import reverse

from io import BytesIO

from fsdviz.tests.pytest_fixtures import user


@pytest.mark.django_db
def test_unauthorized_users_redirected(client):
    """If an *UN*authorized user accesses the upload url, they will be
    redircted to the login page.

    Arguments:
    - `self`:

    """

    url = reverse("stocking:upload-stocking-events")

    response = client.get(url)
    assert response.status_code == 302

    response = client.get(url, follow=True)
    assert response.status_code == 200

    templates = [x.name for x in response.templates]

    assert "registration/login.html" in templates

    content = str(response.content)
    assert "Login" in content
    assert "Email address:" in content
    assert "Password:" in content


@pytest.mark.django_db
def test_authorized_users_can_upload(client, user):
    """If an authorized user accesses the upload url, they will be
    presented with a form.

    Arguments:
    - `self`:

    """

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")
    response = client.get(url)
    assert response.status_code == 200

    templates = [x.name for x in response.templates]
    assert "stocking/upload_stocking_events.html" in templates

    content = str(response.content)
    assert "<h1>Upload Stocking Events</h1>" in content
    assert '<label for="name">File: </label>' in content
    assert (
        '<input type="file" name="data_file" id="data_file" required="True">' in content
    )


@pytest.mark.django_db
def test_not_xls_or_xlsx_files(client, user):
    """If the uploaded form is not an xlsx of xls file, the form will be
    re-rendered with a helpful error message.

    Arguments:
    - `self`:

    """

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")

    # simulate a file with a bytes io object
    myfile = BytesIO(b"mybinarydata")
    filenames = ["myfile.jpg", "myfile.txt", "myfile.doc"]

    for fname in filenames:
        myfile.name = fname

        response = client.post(url, {"data_file": myfile}, follow=True)
        assert response.status_code == 200

        templates = [x.name for x in response.templates]
        assert "stocking/upload_stocking_events.html" in templates
        content = str(response.content)
        msg = "Choosen file is not an Excel (*.xls or *.xlsx) file!"
        print(content)
        assert msg in content


@pytest.mark.django_db
def test__xls_or_xlsx_files(client, user):
    """If the uploaded form is an xlsx of xls file, it should be validated.

    This test works today (during developemnt, but will break when we
    are actually able to process the file.)

    Arguments:
    - `self`:

    """

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")

    # simulate a file with a bytes io object
    myfile = BytesIO(b"mybinarydata")
    filenames = ["myfile.xls", "myfile.xlsx"]

    for fname in filenames:
        myfile.name = fname

        response = client.post(url, {"data_file": myfile}, follow=True)
        assert response.status_code == 200

        templates = [x.name for x in response.templates]
        assert "stocking/upload_stocking_events.html" in templates
        content = str(response.content)
        msg = "Looking good!"
        print(content)
        assert msg in content
