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

from fsdviz.tests.pytest_fixtures import user, invalid_xlsfiles
from fsdviz.tests.common_factories import (
    LakeFactory,
    StateProvinceFactory,
    AgencyFactory,
    ManagementUnitFactory,
    Grid10Factory,
    SpeciesFactory,
    StrainFactory,
)


from fsdviz.tests.stocking_factories import (
    LifeStageFactory,
    ConditionFactory,
    StockingMethodFactory,
)

# testing here for now - should be somewhere else:
from fsdviz.stocking.utils import get_xls_form_choices


@pytest.mark.parametrize("xlsfile, message", invalid_xlsfiles)
def test_file_upload_invalid_spreadsheet(client, user, xlsfile, message):
    """Before the data in the spreadsheet can be validated on a
    row-by-row basis, the basic assimptions and shape of the data must
    be confirmed.  If any of the basic tests fail, we need to return
    to upload form and provide a meaningful messagek This test is
    paramaeterized and takes a list of two element tuples covering the
    cases verifying that the uploaded data has between 1 and the max
    number of rows, that all of the required fields are included, but
    no more, and that the upload is limited to a single, year, agency
    and lake.  If any of these criteria fail, the events are
    considered invalid (valid=False), and a meaningful message should
    be returned in the response.

    NOTE - this test verifies that the response contains the expected
    message. If it is failing, check
    test_utils.py::test_validate_upload() first. It is a lower level
    function that verifies that the upload validation is working as
    expected.

    """

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")

    with open(xlsfile, "rb") as fp:
        response = client.post(url, {"data_file": fp}, follow=True)

        assert response.status_code == 200

        templates = [x.name for x in response.templates]
        assert "stocking/upload_stocking_events.html" in templates

        content = str(response.content)
        msg = message
        assert msg in content


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
        assert msg in content


def test_xls_or_xlsx_files(client, user):
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
        '<input type="file" name="data_file" id="data_file" required="True"' in content
    )


class TestFileUpload:
    """tests in this class use the database values created in the setup."""

    @pytest.mark.django_db
    def setup(self):

        lake = LakeFactory(abbrev="HU", lake_name="Huron")
        mu = ManagementUnitFactory(label="NC2", lake=lake, primary=True)
        stateProv = StateProvinceFactory(abbrev="ON")
        agency = AgencyFactory.create(abbrev="MNRF")

        grid10 = Grid10Factory.create(lake=lake, grid="214")
        species = SpeciesFactory(abbrev="LAT", common_name="Lake Trout")
        strian = StrainFactory.create()
        lifestage = LifeStageFactory(abbrev="y", description="yearling")
        condition = ConditionFactory(condition="4")
        stockingMethod = StockingMethodFactory(stk_meth="b", description="boat")

    @pytest.mark.django_db
    def test_get_xls_choices(self):
        """verify that the get_xls_form_choices returns a dictionary the
        expected keyes and values.

        """
        xls_choices = get_xls_form_choices()
        expected = [
            "lakes",
            "agencies",
            "state_prov",
            "stat_dist",
            "species",
            "lifestage",
            "condition",
            "stocking_method",
            "grids",
        ]
        assert list(xls_choices.keys()) == expected

        expected = [("HU", "HU")]
        assert xls_choices["lakes"] == expected

        expected = [("MNRF", "MNRF")]
        assert xls_choices["agencies"] == expected

        expected = [("ON", "ON")]
        assert xls_choices["state_prov"] == expected

        expected = [("LAT", "Lake Trout")]
        assert xls_choices["species"] == expected

        expected = [("y", "yearling")]
        assert xls_choices["lifestage"] == expected

        expected = [("b", "boat")]
        assert xls_choices["stocking_method"] == expected

        expected = [(4, 4)]
        assert xls_choices["condition"] == expected

        # statdist and grids are dictionaries keyed by lake:
        expected = {"HU": [("NC2", "NC2")]}
        assert xls_choices["stat_dist"] == expected

        expected = {"HU": [("214", "214")]}
        assert xls_choices["grids"] == expected

    @pytest.mark.django_db
    def test_file_upload_good_data(self, client, user):
        """If the uploaded form is a valid stocking event template with all of
        the correct fields, a suitable number of rows, a single year
        and lake, then we it should be passed to the data xls_events_form

        """

        login = client.login(email=user.email, password="Abcd1234")
        assert login is True

        url = reverse("stocking:upload-stocking-events")

        with open("fsdviz/tests/xls_files/good_one_record.xlsx", "rb") as fp:
            response = client.post(url, {"data_file": fp}, follow=True)

            assert response.status_code == 200
            templates = [x.name for x in response.templates]
            assert "stocking/xls_events_form.html" in templates

    @pytest.mark.django_db
    def test_file_upload_unknown_lake(self, client, user):
        """If the uploaded file has an unknown_lake, (or any other field with
        a select widget) it should render in the xls_events_form, but the
        unknown value should be disabled in the dropdown list.

        """

        login = client.login(email=user.email, password="Abcd1234")
        assert login is True

        url = reverse("stocking:upload-stocking-events")

        with open("fsdviz/tests/xls_files/unknown_lake.xlsx", "rb") as fp:
            response = client.post(url, {"data_file": fp}, follow=True)

            assert response.status_code == 200
            templates = [x.name for x in response.templates]
            assert "stocking/xls_events_form.html" in templates

            # the unknown value of Lake should be presented, but it
            # will be disabled.
            content = str(response.content)
            msg = '<option value="" selected="selected" disabled="disabled">ZU</option>'
            assert msg in content
