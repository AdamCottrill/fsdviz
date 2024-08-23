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

from io import BytesIO

import pytest
from django.urls import reverse

# testing here for now - should be somewhere else:
from fsdviz.stocking.utils import get_xls_form_choices
from fsdviz.tests.factories.common_factories import (
    AgencyFactory,
    CompositeFinClipFactory,
    FinClipFactory,
    Grid10Factory,
    LakeFactory,
    ManagementUnitFactory,
    SpeciesFactory,
    StateProvinceFactory,
    StrainFactory,
)
from fsdviz.tests.factories.stocking_factories import (
    StockingMortalityFactory,
    LifeStageFactory,
    StockingMethodFactory,
)
from fsdviz.tests.pytest_fixtures import (
    glsc,
    huron,
    huron_mdnr_sc,
    invalid_xlsfiles,
    mdnr,
    mnrf,
    superior,
    user,
)
from pytest_django.asserts import assertContains, assertTemplateUsed


@pytest.mark.parametrize("xlsfile, message", invalid_xlsfiles)
def test_file_upload_invalid_spreadsheet(client, glsc, huron, mnrf, xlsfile, message):
    """Before the data in the spreadsheet can be validated on a
    row-by-row basis, the basic assimptions and shape of the data must
    be confirmed.  If any of the basic tests fail, we need to return
    to upload form and provide a meaningful message. This test is
    paramaeterized and takes a list of two element tuples covering the
    cases verifying that the uploaded data has between 1 and the max
    number of rows, that all of the required fields are included, but
    no more, and that the upload is limited to a single, agency
    and lake.  If any of these criteria fail, the events are
    considered invalid (valid=False), and a meaningful message should
    be returned in the response.

    NOTE - this test verifies that the response contains the expected
    message. If it is failing, check
    test_utils.py::test_validate_upload() first. It is a lower level
    function that verifies that the upload validation is working as
    expected.

    """

    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True

    #if a comment in included in the form, it should still be there
    # when the invalid form is returned:
    comment  = "Comment that should be kept"

    url = reverse("stocking:upload-stocking-events")
    with open(xlsfile, "rb") as fp:
        payload = {"data_file": fp, "upload_comment":comment}
        response = client.post(url, payload, follow=True)
        assert response.status_code == 200
        assertTemplateUsed("stocking/upload_stocking_events.html")
        assertContains(response, message, html=True)
        assertContains(response, comment, html=False)


wrong_files = ["myfile.jpg", "myfile.txt", "myfile.doc"]


@pytest.mark.parametrize("fname", wrong_files)
def test_not_xls_or_xlsx_files(client, glsc, fname):
    """If the uploaded form is not an xlsx of xls file, the form will be
    re-rendered with a helpful error message.

    Arguments:
    - `self`:

    """

    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True

    #if a comment in included in the form, it should still be there
    # when the invalid form is returned:
    comment  = "Comment that should be kept"

    url = reverse("stocking:upload-stocking-events")
    # simulate a file with a bytes io object
    myfile = BytesIO(b"mybinarydata")
    myfile.name = fname
    payload = {"data_file": myfile, "upload_comment":comment}
    response = client.post(url, payload, follow=True)
    assert response.status_code == 200
    assertTemplateUsed("stocking/upload_stocking_events.html")
    msg = "Choosen file is not an Excel (*.xls or *.xlsx) file!"
    assertContains(response, msg)
    assertContains(response, comment, html=False)

xls_file_names = ["myfile.xls", "myfile.xlsx"]


@pytest.mark.parametrize("fname", xls_file_names)
def test_xls_or_xlsx_files(client, glsc, fname):
    """If the uploaded form is an xlsx of xls file, it should be validated.

    This test works today (during developemnt, but will break when we
    are actually able to process the file.)

    Arguments:
    - `self`:

    """

    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True

    #if a comment in included in the form, it should still be there
    # when the invalid form is returned:
    comment  = "Comment that should be kept"

    url = reverse("stocking:upload-stocking-events")
    # simulate a file with a bytes io object
    myfile = BytesIO(b"mybinarydata")
    myfile.name = fname

    payload = {"data_file": myfile, "upload_comment":comment}
    response = client.post(url, payload, follow=True)
    assert response.status_code == 200
    assertTemplateUsed("stocking/upload_stocking_events.html")
    assertContains(response, comment, html=False)

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
    assertTemplateUsed("registration/login.html")
    assertContains(response, "Login")
    assertContains(response, "Email address:")
    assertContains(response, "Password:")


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
    assertTemplateUsed("stocking/upload_stocking_events.html")

    assertContains(response, "<h1>Upload Stocking Events</h1>", html=True)
    assertContains(
        response, '<label for="upload_comment">Comment (optional):</label>', html=True
    )
    assertContains(response, '<label for="data_file">File: </label>', html=True)
    assertContains(
        response,
        (
            '<input type="file" name="data_file" accept=".xlsx, .xls"'
            + ' id="data_file" name="data_file" required>'
        ),
        html=True,
    )


def test_upload_form_contains_some_instructions(client, user):
    """If an authorized user accesses the upload url, they will be
     presented with a form that should include some basic instructions
     on the requirements of the uploaded data:

    + "To upload stocking events you must"

    + "Use the offial stocking event upload template"

    + "Ensure that any errors identified by the spreadsheet
    validation have been addressed before uploading the file"

    + "Limit your submission to a single agency and lake"

    + "Ensure that your upload contains few events than the event
    limit"

    """

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")
    response = client.get(url)
    assert response.status_code == 200
    assertTemplateUsed("stocking/upload_stocking_events.html")

    messages = [
        "To upload stocking events you must:",
        "Use the official stocking event upload template",
        """Ensure that any errors
                        identified by the spreadsheet validation have
                        been addressed before uploading the file""",
        """Limit your submission to a
                        single agency and lake and ensure that you are
                        affiliated with that lake and agency""",
        """Ensure that your upload contains fewer events than
                        the event limit """,
    ]

    for msg in messages:
        assertContains(response, msg)


@pytest.fixture()
def choices_setup():

    lake = LakeFactory(abbrev="HU", lake_name="Lake Huron")
    LakeFactory(abbrev="SU", lake_name="Superior")
    ManagementUnitFactory(label="NC2", lake=lake, primary=True)
    StateProvinceFactory(abbrev="ON")
    AgencyFactory(abbrev="MNRF")
    AgencyFactory(abbrev="MDNR")
    AgencyFactory(abbrev="USFWS")

    Grid10Factory(lake=lake, grid="214")
    SpeciesFactory(abbrev="LAT", common_name="Lake Trout")
    StrainFactory()
    LifeStageFactory(abbrev="y", description="yearling")
    StockingMortalityFactory(value=4)
    StockingMortalityFactory(value=99)

    StockingMethodFactory(stk_meth="b", description="boat")

    FinClipFactory(abbrev="LV", description="Left Ventral")
    FinClipFactory(abbrev="RP", description="Right Pectoral")
    FinClipFactory(abbrev="AD", description="Adipose")

    CompositeFinClipFactory(clip_code="AD", description="Adipose")
    CompositeFinClipFactory(
        clip_code="LVRP", description="Left Ventral, Right Pectoral"
    )


@pytest.mark.django_db
def test_get_xls_choices(choices_setup):
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
        "stocking_mortality",
        "stocking_method",
        "grids",
    ]
    assert list(xls_choices.keys()) == expected

    expected = [("HU", "HU"), ("SU", "SU")]
    assert set(xls_choices["lakes"]) == set(expected)

    expected = [("MNRF", "MNRF"), ("USFWS", "USFWS"), ("MDNR", "MDNR")]
    assert set(xls_choices["agencies"]) == set(expected)

    expected = [("ON", "ON")]
    assert xls_choices["state_prov"] == expected

    expected = [("LAT", "Lake Trout")]
    assert xls_choices["species"] == expected

    expected = [("y", "yearling")]
    assert xls_choices["lifestage"] == expected

    expected = [("b", "boat")]
    assert xls_choices["stocking_method"] == expected

    expected = [(4, 4), (99, 99)]
    assert xls_choices["stocking_mortality"] == expected

    # statdist and grids are dictionaries keyed by lake:
    expected = {"HU": [("NC2", "NC2")]}
    assert xls_choices["stat_dist"] == expected

    expected = {"HU": [("214", "214")]}
    assert xls_choices["grids"] == expected


@pytest.mark.django_db
def test_file_upload_good_data(choices_setup, client, glsc):
    """If the uploaded form is a valid stocking event template with all of
    the correct fields, a suitable number of rows, a single year
    and lake, then we it should be passed to the data xls_events_form

    """

    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")
    with open("fsdviz/tests/xls_files/good_one_record.xlsx", "rb") as fp:
        response = client.post(url, {"data_file": fp}, follow=True)
        assert response.status_code == 200
        assertTemplateUsed("stocking/xls_events_form.html")


@pytest.mark.django_db
def test_file_upload_unknown_lake(choices_setup, client, glsc):
    """If the uploaded file has an unknown_lake, the user is returned to
    the upload file form with a message that the uploaded file has an
    agency or lake that they are not currently affiliated with.

    """

    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")

    with open("fsdviz/tests/xls_files/unknown_lake.xlsx", "rb") as fp:
        response = client.post(url, {"data_file": fp}, follow=True)

        assert response.status_code == 200
        templates = [x.name for x in response.templates]
        assert "stocking/upload_stocking_events.html" in templates

        # the unknown value of Lake should be presented, but it
        # will be disabled.
        content = str(response.content)
        msg = "The uploaded file appears to contain events for an unknown Lake: Simcoe."

        assert msg in content


@pytest.mark.django_db
def test_gl_coordinator_not_limited_to_their_lake(
    choices_setup, client, superior, glsc
):
    """A great Lakes stocking coordinator should be able to upload
    stocking events for any lake and for any agency.

    """
    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")

    with open("fsdviz/tests/xls_files/mdnr_superior.xlsx", "rb") as fp:
        response = client.post(url, {"data_file": fp}, follow=True)
        assert response.status_code == 200
        assertTemplateUsed("stocking/xls_events_form.html")


@pytest.mark.django_db
def test_agency_and_lake_appear_in_upload_form_heading(choices_setup, client, glsc):
    """When the upload form renders, it should clearly indictate which
    lake and agency the events will be associated with.

    "MNRF stocking events in Lake Huron"

    """
    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")

    with open("fsdviz/tests/xls_files/mnrf_huron.xlsx", "rb") as fp:
        response = client.post(url, {"data_file": fp}, follow=True)
        assert response.status_code == 200

        assertTemplateUsed("stocking/xls_events_form.html")
        heading = "<h1>1 Uploaded MNRF Stocking Event for Lake Huron</h1>"
        assertContains(response, heading, html=True)


@pytest.mark.django_db
def test_gl_coordinator_not_limited_to_their_agency(choices_setup, client, glsc):
    """A great Lakes stocking coordinator should be able to upload
    stocking events for any lake and for any agency.

    """
    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")

    with open("fsdviz/tests/xls_files/usfws_huron.xlsx", "rb") as fp:
        response = client.post(url, {"data_file": fp}, follow=True)
        assert response.status_code == 200
        assertTemplateUsed("stocking/xls_events_form.html")


@pytest.mark.django_db
def test_agency_coordinator_can_upload_events_for_their_lake_and_agency(
    choices_setup, client, huron_mdnr_sc
):
    """An agency stocking coordinator should only be able to upload data
    associated with their agency and lake(s) they have permission to
    modify.

    """
    login = client.login(email=huron_mdnr_sc.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")

    with open("fsdviz/tests/xls_files/mdnr_huron.xlsx", "rb") as fp:
        response = client.post(url, {"data_file": fp}, follow=True)
        assert response.status_code == 200
        assertTemplateUsed("stocking/xls_events_form.html")


@pytest.mark.django_db
def test_agency_coordinator_cannot_upload_events_different_agency(
    choices_setup, client, huron_mdnr_sc
):
    """An agency stocking coordinator should not be able to upload events
    for another agency.

    our coordinator is currently associated with mdnr so if he tries to upload events
    by USFWS it should throw an error.

    """
    login = client.login(email=huron_mdnr_sc.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")

    with open("fsdviz/tests/xls_files/usfws_huron.xlsx", "rb") as fp:
        response = client.post(url, {"data_file": fp}, follow=True)
        assert response.status_code == 200
        assertTemplateUsed("stocking/upload_stocking_events.html")
        msg = (
            "The uploaded file appears to have data from a lake or agency"
            " that you are not currently affiliated with."
        )
        assertContains(response, msg)


@pytest.mark.django_db
def test_agency_coordinator_cannot_upload_events_different_lake(
    choices_setup, client, huron_mdnr_sc
):
    """An agency stocking coordinator should not be able to upload events
    on a lake that they are not associated with.

    our coordinator is currently associated with lake huron so events
    on lake superior should throw an error.

    """
    login = client.login(email=huron_mdnr_sc.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")

    with open("fsdviz/tests/xls_files/mdnr_superior.xlsx", "rb") as fp:
        response = client.post(url, {"data_file": fp}, follow=True)
        assert response.status_code == 200
        assertTemplateUsed("stocking/upload_stocking_events.html")
        msg = (
            "The uploaded file appears to have data from a lake or agency"
            " that you are not currently affiliated with."
        )
        assertContains(response, msg)

    expected = [(4, 4), (99, 99)]
    assert xls_choices["stocking_mortality"] == expected

    # statdist and grids are dictionaries keyed by lake:
    expected = {"HU": [("NC2", "NC2")]}
    assert xls_choices["stat_dist"] == expected

    expected = {"HU": [("214", "214")]}
    assert xls_choices["grids"] == expected


@pytest.mark.django_db
def test_file_upload_good_data(choices_setup, client, glsc):
    """If the uploaded form is a valid stocking event template with all of
    the correct fields, a suitable number of rows, a single year
    and lake, then we it should be passed to the data xls_events_form

    """

    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")
    with open("fsdviz/tests/xls_files/good_one_record.xlsx", "rb") as fp:
        response = client.post(url, {"data_file": fp}, follow=True)
        assert response.status_code == 200
        assertTemplateUsed("stocking/xls_events_form.html")


@pytest.mark.django_db
def test_file_upload_unknown_lake(choices_setup, client, glsc):
    """If the uploaded file has an unknown_lake, the user is returned to
    the upload file form with a message that the uploaded file has an
    agency or lake that they are not currently affiliated with.

    """

    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")

    with open("fsdviz/tests/xls_files/unknown_lake.xlsx", "rb") as fp:
        response = client.post(url, {"data_file": fp}, follow=True)

        assert response.status_code == 200
        templates = [x.name for x in response.templates]
        assert "stocking/upload_stocking_events.html" in templates

        # the unknown value of Lake should be presented, but it
        # will be disabled.
        content = str(response.content)
        msg = "The uploaded file appears to contain events for an unknown Lake: Simcoe."

        assert msg in content


@pytest.mark.django_db
def test_gl_coordinator_not_limited_to_their_lake(
    choices_setup, client, superior, glsc
):
    """A great Lakes stocking coordinator should be able to upload
    stocking events for any lake and for any agency.

    """
    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")

    with open("fsdviz/tests/xls_files/mdnr_superior.xlsx", "rb") as fp:
        response = client.post(url, {"data_file": fp}, follow=True)
        assert response.status_code == 200
        assertTemplateUsed("stocking/xls_events_form.html")


@pytest.mark.django_db
def test_agency_and_lake_appear_in_upload_form_heading(choices_setup, client, glsc):
    """When the upload form renders, it should clearly indictate which
    lake and agency the events will be associated with.

    "MNRF stocking events in Lake Huron"

    """
    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")

    with open("fsdviz/tests/xls_files/mnrf_huron.xlsx", "rb") as fp:
        response = client.post(url, {"data_file": fp}, follow=True)
        assert response.status_code == 200

        assertTemplateUsed("stocking/xls_events_form.html")
        heading = "<h1>1 Uploaded MNRF Stocking Event for Lake Huron</h1>"
        assertContains(response, heading, html=True)


@pytest.mark.django_db
def test_gl_coordinator_not_limited_to_their_agency(choices_setup, client, glsc):
    """A great Lakes stocking coordinator should be able to upload
    stocking events for any lake and for any agency.

    """
    login = client.login(email=glsc.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")

    with open("fsdviz/tests/xls_files/usfws_huron.xlsx", "rb") as fp:
        response = client.post(url, {"data_file": fp}, follow=True)
        assert response.status_code == 200
        assertTemplateUsed("stocking/xls_events_form.html")


@pytest.mark.django_db
def test_agency_coordinator_can_upload_events_for_their_lake_and_agency(
    choices_setup, client, huron_mdnr_sc
):
    """An agency stocking coordinator should only be able to upload data
    associated with their agency and lake(s) they have permission to
    modify.

    """
    login = client.login(email=huron_mdnr_sc.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")

    with open("fsdviz/tests/xls_files/mdnr_huron.xlsx", "rb") as fp:
        response = client.post(url, {"data_file": fp}, follow=True)
        assert response.status_code == 200
        assertTemplateUsed("stocking/xls_events_form.html")


@pytest.mark.django_db
def test_agency_coordinator_cannot_upload_events_different_agency(
    choices_setup, client, huron_mdnr_sc
):
    """An agency stocking coordinator should not be able to upload events
    for another agency.

    our coordinator is currently associated with mdnr so if he tries to upload events
    by USFWS it should throw an error.

    """
    login = client.login(email=huron_mdnr_sc.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")

    with open("fsdviz/tests/xls_files/usfws_huron.xlsx", "rb") as fp:
        response = client.post(url, {"data_file": fp}, follow=True)
        assert response.status_code == 200
        assertTemplateUsed("stocking/upload_stocking_events.html")
        msg = (
            "The uploaded file appears to have data from a lake or agency"
            " that you are not currently affiliated with."
        )
        assertContains(response, msg)


@pytest.mark.django_db
def test_agency_coordinator_cannot_upload_events_different_lake(
    choices_setup, client, huron_mdnr_sc
):
    """An agency stocking coordinator should not be able to upload events
    on a lake that they are not associated with.

    our coordinator is currently associated with lake huron so events
    on lake superior should throw an error.

    """
    login = client.login(email=huron_mdnr_sc.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:upload-stocking-events")

    with open("fsdviz/tests/xls_files/mdnr_superior.xlsx", "rb") as fp:
        response = client.post(url, {"data_file": fp}, follow=True)
        assert response.status_code == 200
        assertTemplateUsed("stocking/upload_stocking_events.html")
        msg = (
            "The uploaded file appears to have data from a lake or agency"
            " that you are not currently affiliated with."
        )
        assertContains(response, msg)
