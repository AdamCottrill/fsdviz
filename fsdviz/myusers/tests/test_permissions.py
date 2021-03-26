"""=============================================================
~/fsdviz/myusers/tests/test_permissions.py
 Created: 17 Nov 2020 09:24:07

 DESCRIPTION:

  This test file ensures that permissions/authorizations operate as
  expected.  There are currently 4 types of authenticated user (plus
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
stocking.upload_events
stocking.xls_events

    TODO

    - create a tempalte tag and verify that buttons and links are
      conditionally rendered in templates

    - create integration tests and verify that users premissions are
      implemented correctly with GET and POST requests



- there are two levels of stocking event permissions:
  + model level - can CRUD
  + object level - can CRUD events from their agency and lake(s)



 A. Cottrill
=============================================================

"""

import pytest

from fsdviz.myusers.permissions import user_can_create_edit_delete
from .factories import UserFactory
from fsdviz.tests.common_factories import (
    LakeFactory,
    AgencyFactory,
    StateProvinceFactory,
    JurisdictionFactory,
)

from fsdviz.tests.stocking_factories import StockingEventFactory, DataUploadEventFactory


@pytest.fixture
def superior():
    """a fixture for lake superior"""
    superior = LakeFactory(lake_name="Lake Superior", abbrev="SU")
    return superior


@pytest.fixture
def huron():
    """a fixture for lake superior"""
    huron = LakeFactory(lake_name="Lake Huron", abbrev="HU")
    return huron


@pytest.fixture
def mdnr():
    """a fixture for Michigan Department of Natural Resources"""
    mdnr = AgencyFactory(
        abbrev="MDNR", agency_name="Michigan Department of Natural Resources"
    )
    return mdnr


@pytest.fixture
def usfws():
    """a fixture for the US Fish and Wildlife Servce"""
    usfws = AgencyFactory(abbrev="USWFS", agency_name="U.S. Fish and Wildlife Servce")
    return usfws


@pytest.fixture
def glsc():
    """A user who is a great lakes stocking coordinator"""
    glsc = UserFactory(
        username="hsimpson",
        first_name="Homer",
        last_name="Simpson",
        email="homer.simpson@simpsons",
        role="glsc",
    )
    return glsc


@pytest.fixture
def huron_mdnr_sc(mdnr, huron):
    """A user who is an agency stocking coordinator"""

    huron_mdnr_sc = UserFactory.create(
        username="bsimpson",
        first_name="bart",
        last_name="Simpson",
        email="bart.simpson@simpsons",
        role="asc",
        agency=mdnr,
        lakes=[huron],
    )

    return huron_mdnr_sc


@pytest.fixture
def huron_mdnr_user(mdnr, huron):
    """A user who is an agency user"""

    huron_mdnr_user = UserFactory.create(
        username="lsimpson",
        first_name="lisa",
        last_name="Simpson",
        email="lisa.simpson@simpsons",
        role="au",
        agency=mdnr,
        lakes=[huron],
    )

    return huron_mdnr_user


@pytest.fixture
def stocking_events(usfws, mdnr, superior, huron):
    """A user who is an agency user"""

    mich = StateProvinceFactory(
        abbrev="MI",
        name="Michigan",
        description="The State of Michigan",
        country="US",
    )
    su_mi = JurisdictionFactory(stateprov=mich, lake=superior, slug="su_mi")
    hu_mi = JurisdictionFactory(stateprov=mich, lake=huron, slug="hu_mi")

    event1 = StockingEventFactory(agency=mdnr, jurisdiction=hu_mi)
    event2 = StockingEventFactory(agency=usfws, jurisdiction=hu_mi)
    event3 = StockingEventFactory(agency=mdnr, jurisdiction=su_mi)
    event4 = StockingEventFactory(agency=usfws, jurisdiction=su_mi)

    return [event1, event2, event3, event4]


@pytest.fixture
def data_uploads(usfws, mdnr, superior, huron):
    """A user who is an agency user"""

    upload1 = DataUploadEventFactory(agency=mdnr, lake=huron)
    upload2 = DataUploadEventFactory(agency=usfws, lake=huron)
    upload3 = DataUploadEventFactory(agency=mdnr, lake=superior)
    upload4 = DataUploadEventFactory(agency=usfws, lake=superior)

    return [upload1, upload2, upload3, upload4]


# ==========================
#        THE TESTS


@pytest.mark.django_db
def test_glsc_can_edit_event(glsc, stocking_events):
    """the great lakes stocking coordinator should be able edit all
    stocking events in all lakes by all agencies.

    """

    for event in stocking_events:
        assert user_can_create_edit_delete(glsc, event) is True


@pytest.mark.django_db
def test_asc_can_edit_their_event(huron_mdnr_sc, stocking_events):
    """our agency stocking coordinator works for MDNR on Lake Huron so she
    should be able to edit event 1, but not events 2-4 which are in
    another lake, by another agency, or both.

    """

    shouldbe = [True, False, False, False]
    for expected, event in zip(shouldbe, stocking_events):
        assert user_can_create_edit_delete(huron_mdnr_sc, event) is expected


@pytest.mark.django_db
def test_agency_user_can_not_edit_any_events(huron_mdnr_user, stocking_events):
    """our agency user should not be able to edit any of the stocking events"""

    for event in stocking_events:
        assert user_can_create_edit_delete(huron_mdnr_user, event) is False


@pytest.mark.django_db
def test_glsc_can_edit_uploads(glsc, data_uploads):
    """the great lakes stocking coordinator should be able edit all
    data upload events that are associated with all lakes by all agencies.

    """

    for upload in data_uploads:
        assert user_can_create_edit_delete(glsc, upload) is True


@pytest.mark.django_db
def test_asc_can_edit_their_uploads(huron_mdnr_sc, data_uploads):
    """our agency stocking coordinator works for MDNR on Lake Huron so she
    should be able to edit upload 1, but not uploads 2-4 which are in
    another lake, by another agency, or both.

    """

    shouldbe = [True, False, False, False]
    for expected, upload in zip(shouldbe, data_uploads):
        assert user_can_create_edit_delete(huron_mdnr_sc, upload) is expected


@pytest.mark.django_db
def test_agency_user_can_not_edit_any_uploads(huron_mdnr_user, data_uploads):
    """our agency user should not be able to edit any of the data upload events"""

    for upload in data_uploads:
        assert user_can_create_edit_delete(huron_mdnr_user, upload) is False


@pytest.mark.django_db
def test_glsc_can_edit_dict(glsc, superior, mdnr):
    """The function user_can_create_edit_delete can accept an object
    (event) or a dictionary with the keys, 'lake' and 'agency'.  Verfy
    that they function returns true for great lakes stocking coordinator:

    """
    args = {"lake": superior, "agency": mdnr}
    assert user_can_create_edit_delete(glsc, args) is True


@pytest.mark.django_db
def test_huron_sc_user_can_edit_dict(huron_mdnr_sc, huron, mdnr):
    """The function user_can_create_edit_delete can accept an object
    (event) or a dictionary with the keys, 'lake' and 'agency'.  Verfy
    that they function returns true for an agency stocking coordinator
    if the lake and agency match their attributes.

    """
    args = {"lake": huron, "agency": mdnr}
    assert user_can_create_edit_delete(huron_mdnr_sc, args) is True


@pytest.mark.django_db
def test_huron_sc_user_can_edit_dict_wrong_lake(huron_mdnr_sc, superior, mdnr):
    """The function user_can_create_edit_delete can accept an object
    (event) or a dictionary with the keys, 'lake' and 'agency'.  Verfy
    that they function returns FALSE because lake does not match.

    """
    args = {"lake": superior, "agency": mdnr}
    assert user_can_create_edit_delete(huron_mdnr_sc, args) is False


@pytest.mark.django_db
def test_huron_sc_user_can_edit_dict_wrong_agency(huron_mdnr_sc, huron, usfws):
    """The function user_can_create_edit_delete can accept an object
    (event) or a dictionary with the keys, 'lake' and 'agency'.  Verfy
    that they function returns FALSE because agency does not match.

    """
    args = {"lake": huron, "agency": usfws}
    assert user_can_create_edit_delete(huron_mdnr_sc, args) is False


@pytest.mark.django_db
def test_huron_user_user_can_edit_dict(huron_mdnr_user, huron, mdnr):
    """The function user_can_create_edit_delete can accept an object
    (event) or a dictionary with the keys, 'lake' and 'agency'.  Verfy
    that they function returns false for an agency user even
    if the lake and agency match their attributes.

    """
    args = {"lake": huron, "agency": mdnr}
    assert user_can_create_edit_delete(huron_mdnr_user, args) is False


@pytest.mark.django_db
def test_huron_user_user_can_edit_dict_wrong_lake(huron_mdnr_user, superior, mdnr):
    """The function user_can_create_edit_delete can accept an object
    (event) or a dictionary with the keys, 'lake' and 'agency'.  Verfy
    that they function returns FALSE when the lake is different.

    """
    args = {"lake": superior, "agency": mdnr}
    assert user_can_create_edit_delete(huron_mdnr_user, args) is False


@pytest.mark.django_db
def test_huron_user_user_can_edit_dict_wrong_agency(huron_mdnr_user, huron, usfws):
    """The function user_can_create_edit_delete can accept an object
    (event) or a dictionary with the keys, 'lake' and 'agency'.  Verfy
    that they function returns FALSE when the agency.

    """
    args = {"lake": huron, "agency": usfws}
    assert user_can_create_edit_delete(huron_mdnr_user, args) is False
