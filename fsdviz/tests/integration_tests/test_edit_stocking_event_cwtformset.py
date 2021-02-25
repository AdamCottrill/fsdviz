"""=============================================================
~/fsdviz/tests/stocking/test_stocking_event_cwtformset.py
 Created: 11 Aug 2020 09:08:08

 DESCRIPTION:

  The stocking event form has a formset that deals with cwts - the
  logic associated with it is sufficiently complicated to warrant its
  own test file.

  This file contains a number of integration tests that submit GET or
  POST requests to the edit stocking event url with various cwt
  configurations and make assertions about the expected response.

  + if formset contains anything, the form should constain 'cwt' one of
  it's tag types

  + we can create new cwts
      + standard cwts
      + sequential cwt

  + cwt can assocaite an exsiting cwt with and event

  + we can delete an association bewteen a cwt and an event

  + cwt attributes must be unique within a form submission

  + sequential cwts cannot overlap on the same submission

  + sequential cwts cannot overlap with existing cwts


 A. Cottrill
=============================================================

"""
import pytest


from django.urls import reverse
from django.utils.html import escape

from pytest_django.asserts import assertTemplateUsed, assertContains

from fsdviz.stocking.utils import get_cwt_sequence_dict
from fsdviz.common.models import CWT

# use our glsc super user for these tests:
from fsdviz.tests.pytest_fixtures import glsc as user

from fsdviz.tests.stocking_factories import StockingEventFactory
from fsdviz.tests.common_factories import (
    FishTagFactory,
    CWTFactory,
    CWTsequenceFactory,
    LakeFactory,
    StateProvinceFactory,
    JurisdictionFactory,
    LatLonFlagFactory,
)


# In order to test the form sumbision process we need to convert
# our event data to a dictionary, add data for each cwt form in the
# formset, and then add the correct elements for the managemet
# formdata
#    # management_form data
#       'cwtseries-INITIAL_FORMS': '0',
#       'cwtseries-TOTAL_FORMS': '2',
#       'cwtseries-MAX_NUM_FORMS': '',


@pytest.fixture
def cwt_event():
    """A stocking event with an associated cwt series."""
    cwt_tag = FishTagFactory(
        tag_code="CWT", tag_type="CWT", description="coded wire tag"
    )
    event = StockingEventFactory()
    cwt = CWTFactory(cwt_number="111111")
    cwt_series = CWTsequenceFactory(cwt=cwt)

    event.cwt_series.add(cwt_series)
    event.fish_tags.add(cwt_tag)

    return event


@pytest.fixture
def event():
    """A stocking event *without* an associated cwt series."""
    FishTagFactory(tag_code="CWT", tag_type="CWT", description="coded wire tag")
    lake = LakeFactory()
    prov = StateProvinceFactory()
    jurisdiction = JurisdictionFactory(lake=lake, stateprov=prov)

    latlong_flag = LatLonFlagFactory(value=1, description="Reported")
    latlong_flag.save()

    event = StockingEventFactory(jurisdiction=jurisdiction)

    return event


def event2dict(event):
    """convert out event object to a dictionary that we can submit as POST
    data."""

    event_dict = event.__dict__.copy()

    pop_fields = [
        "_state",
        # "id",
        "created_date",
        "modified_date",
        "geom",
        "latlong_flag_id",
        "grid_5",
        "tag_no",
        "tag_ret",
        "clip_code_id",
        "date",
    ]
    for fld in pop_fields:
        event_dict.pop(fld)

    event_dict["lake_id"] = event.lake.id
    event_dict["state_prov_id"] = event.stateprov.id

    event_dict["fish_tags"] = [x.tag_code for x in event.fish_tags.all()]

    # django forms don't like None, replace with empty strings
    for k, v in event_dict.items():
        if v is None:
            event_dict[k] = ""

    cwts = get_cwt_sequence_dict(event)
    for i, cwt in enumerate(cwts):
        for key, val in cwt.items():
            new_key = "cwtseries-{}-{}".format(i, key)
            if val:
                event_dict[new_key] = val

    event_dict["cwtseries-INITIAL_FORMS"] = len(cwts)
    event_dict["cwtseries-TOTAL_FORMS"] = len(cwts)
    event_dict["cwtseries-MIN_NUM_FORMS"] = "0"
    event_dict["cwtseries-MAX_NUM_FORMS"] = "50"

    return event_dict


# need a stocking event with a cwt and one without (cwt_event and event)
# existing cwt object - associated with an event, one without

# client and user.

# ======================
#   Form Elements:


def test_form_contains_cwt_number(client, user, cwt_event):
    """If the event has cwts associated with it , the form should contain
    a populated formset containing the attributes of the cwt and the
    cwt button should read "Add Another CWT"

    GET request

    """

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True

    url = reverse(
        "stocking:edit-stocking-event", kwargs={"stock_id": cwt_event.stock_id}
    )

    response = client.get(url)
    assert response.status_code == 200

    content = str(response.content)
    assert "11-11-11" in content
    assert "id_cwtseries-0" in content
    assert "Add Another CWT" in content


def test_form_does_not_contain_cwt_number(client, user, event):
    """If the event does not have cwts associated with it , the form
    should not contain a populated formset containing the attributes
    of the cwt and the cwt button should read "Add a CWT"

    GET request

    """

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True

    url = reverse("stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id})

    response = client.get(url)
    assert response.status_code == 200

    content = str(response.content)
    assert "11-11-11" not in content
    assert "id_cwtseries-0" not in content
    assert "Add a CWT" in content


def test_post_good_data(client, user, cwt_event):
    """Verify that if we post data without any changes, the form and
    formsets are valid and we are re-directed to the event detail
    page.

    """
    event_dict = event2dict(cwt_event)

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True
    url = reverse(
        "stocking:edit-stocking-event", kwargs={"stock_id": cwt_event.stock_id}
    )

    response = client.post(url, data=event_dict, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "stocking/stocking_detail.html")

    content = str(response.content)
    assert "This field is required" not in content


def test_malformed_cwt(client, user, cwt_event):
    """CWT number must be a 6 digit string.  An appropriate message should
    be included in the response if a malformed cwt number is submitted.

    """

    event_dict = event2dict(cwt_event)

    event_dict["cwtseries-0-cwt_number"] = "6395"

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True
    url = reverse(
        "stocking:edit-stocking-event", kwargs={"stock_id": cwt_event.stock_id}
    )

    response = client.post(url, data=event_dict)

    assert response.status_code == 200
    assertTemplateUsed(response, "stocking/stocking_event_form.html")

    errmsg = "CWT Number must be 6 digits (including leading 0's)."
    assertContains(response, escape(errmsg))


def test_sequential_must_be_nmt(client, user, cwt_event):
    """If the tag_type is listed as sequential, it must be manufactured by
    nmt - as far as I know, mm never made a sequential tags."""

    event_dict = event2dict(cwt_event)

    event_dict["cwtseries-0-manufacturer"] = "mm"
    event_dict["cwtseries-0-tag_type"] = "sequential"

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True
    url = reverse(
        "stocking:edit-stocking-event", kwargs={"stock_id": cwt_event.stock_id}
    )
    response = client.post(url, data=event_dict)

    assert response.status_code == 200
    assertTemplateUsed(response, "stocking/stocking_event_form.html")

    errmsg = "Sequential tags are only manufactured by NMT."
    assertContains(response, escape(errmsg))


arg_list = (
    {
        "seq_start": None,
        "seq_end": 100,
        "msg": "Sequence start must be provided for sequential tags.",
    },
    {
        "seq_start": 1,
        "seq_end": None,
        "msg": "Sequence end must be provided for sequential tags.",
    },
    {
        "seq_start": None,
        "seq_end": None,
        "msg": "Sequence start and end must be provided for sequential tags.",
    },
)


@pytest.mark.parametrize("args", arg_list)
def test_sequential_sequence_range(client, user, cwt_event, args):
    """Sequence start and end are required if the tag type is sequential.
    If there is an issued with the range, an appropriate error message
    should be included in the response.

    """

    event_dict = event2dict(cwt_event)

    event_dict["cwtseries-0-tag_type"] = "sequential"

    seq_start = args.get("seq_start")
    if seq_start:
        event_dict["cwtseries-0-sequence_start"] = seq_start

    seq_end = args.get("seq_end")
    if seq_end:
        event_dict["cwtseries-0-sequence_end"] = seq_end

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True
    url = reverse(
        "stocking:edit-stocking-event", kwargs={"stock_id": cwt_event.stock_id}
    )
    response = client.post(url, data=event_dict)

    assert response.status_code == 200
    assertTemplateUsed(response, "stocking/stocking_event_form.html")

    errmsg = args["msg"]
    assertContains(response, escape(errmsg))


@pytest.mark.skip
def test_duplicate_cwt_attributes(client, user, cwt_event):
    """If we try to submit the form with two cwt tags with
    identical attributes, an error should be included in the response.


    """

    event_dict = event2dict(cwt_event)

    # duplicate the attributes of the first cwt:
    event_dict["cwtseries-1-tag_type"] = "cwt"
    event_dict["cwtseries-1-manufacturer"] = "nmt"
    event_dict["cwtseries-1-cwt_number"] = "11-11-11"

    # don't forget to increment the management form to reflect the number of cwts:
    event_dict["cwtseries-INITIAL_FORMS"] = 2
    event_dict["cwtseries-TOTAL_FORMS"] = 2

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True
    url = reverse(
        "stocking:edit-stocking-event", kwargs={"stock_id": cwt_event.stock_id}
    )
    response = client.post(url, data=event_dict, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "stocking/stocking_event_form.html")

    errmsg = "CWTs must have unique numbers, manufacturers, types and sequence ranges!"
    assertContains(response, escape(errmsg))


def test_overlapping_ranges(client, user, cwt_event):
    """If we try to submit the form with two NEW sequential tags with
    overlapping ranges, an error should be included in the response.
    """

    event_dict = event2dict(cwt_event)

    # update the attributes of the first cwt
    event_dict["cwtseries-0-cwt_number"] = "11-11-11"
    event_dict["cwtseries-0-manufacturer"] = "nmt"
    event_dict["cwtseries-0-tag_type"] = "sequential"
    event_dict["cwtseries-0-sequence_start"] = 1
    event_dict["cwtseries-0-sequence_end"] = 500

    # create the second, overlapping cwt:
    event_dict["cwtseries-1-cwt_number"] = "11-11-11"
    event_dict["cwtseries-1-manufacturer"] = "nmt"
    event_dict["cwtseries-1-tag_type"] = "sequential"
    event_dict["cwtseries-1-sequence_start"] = 400
    event_dict["cwtseries-1-sequence_end"] = 900

    # don't forget to increment the management form to reflect the number of cwts:
    event_dict["cwtseries-INITIAL_FORMS"] = 2
    event_dict["cwtseries-TOTAL_FORMS"] = 2

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True
    url = reverse(
        "stocking:edit-stocking-event", kwargs={"stock_id": cwt_event.stock_id}
    )
    response = client.post(url, data=event_dict)

    assert response.status_code == 200
    assertTemplateUsed(response, "stocking/stocking_event_form.html")

    errmsg = "Sequence ranges overlap."
    assertContains(response, escape(errmsg))


def test_tag_type_is_cwt_if_cwt(client, user, cwt_event):
    """If there are records in the formset, cwt should be listed as a tag
    type for the associated stocking event.

    """

    event_dict = event2dict(cwt_event)

    # remove the fish tag attribute so that field is empty even
    # thought event has a cwt
    event_dict.pop("fish_tags")

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True
    url = reverse(
        "stocking:edit-stocking-event", kwargs={"stock_id": cwt_event.stock_id}
    )
    response = client.post(url, data=event_dict, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "stocking/stocking_event_form.html")

    errmsg = (
        "Tag type 'CWT' needs to be selected if cwts are associated with this event."
    )
    assertContains(response, escape(errmsg))


def test_tag_type_not_cwt_if_formset_is_empty(client, user, event):
    """If the formset is empty, cwt should not be listed as one of the tag
    types.  This might not work - as there are some stocking events
    where they know cwts were deployed, but don't know what the cwts
    were (they were just a easy way to mark fish).

    """

    event_dict = event2dict(event)

    # make sure the fish stags attribute is empty
    event_dict["fish_tags"] = "CWT"

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True
    url = reverse("stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id})
    response = client.post(url, data=event_dict, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "stocking/stocking_event_form.html")

    errmsg = "At least one CWT needs to be associated with this event if tag type 'CWT' is selected."
    assertContains(response, escape(errmsg))


# ======================
#      CWT CRUD


def test_can_create_new_tag(client, user, event):
    """We should be able to create a brand new cwt and associate it with
    our stocking event by providing arguments for cwt_number,
    manufacturer, and tag type.

    """

    assert len(event.cwt_series.all()) == 0

    event_dict = event2dict(event)

    # update the attributes of the first cwt
    event_dict["cwtseries-0-cwt_number"] = "22-22-22"
    event_dict["cwtseries-0-manufacturer"] = "nmt"
    event_dict["cwtseries-0-tag_type"] = "cwt"

    # make sure we update the tags attr too (tested elsewhere)
    event_dict["fish_tags"] = "CWT"

    # don't forget to increment the management form to reflect the number of cwts:
    event_dict["cwtseries-INITIAL_FORMS"] = 1
    event_dict["cwtseries-TOTAL_FORMS"] = 1

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True
    url = reverse("stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id})
    response = client.post(url, data=event_dict, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "stocking/stocking_detail.html")

    assert len(event.cwt_series.all()) == 1


def test_can_create_multiple_new_tags(client, user, event):
    """We should be able to create several new cwts and have them
    associated with our stocking event.

    """

    assert len(event.cwt_series.all()) == 0

    event_dict = event2dict(event)

    # update the attributes of the first cwt
    event_dict["cwtseries-0-cwt_number"] = "22-22-22"
    event_dict["cwtseries-0-manufacturer"] = "nmt"
    event_dict["cwtseries-0-tag_type"] = "cwt"

    event_dict["cwtseries-1-cwt_number"] = "33-33-33"
    event_dict["cwtseries-1-manufacturer"] = "nmt"
    event_dict["cwtseries-1-tag_type"] = "cwt"

    # make sure we update the tags attr too (tested elsewhere)
    event_dict["fish_tags"] = "CWT"

    # don't forget to increment the management form to reflect the number of cwts:
    event_dict["cwtseries-INITIAL_FORMS"] = 2
    event_dict["cwtseries-TOTAL_FORMS"] = 2

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True
    url = reverse("stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id})
    response = client.post(url, data=event_dict, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "stocking/stocking_detail.html")

    assert len(event.cwt_series.all()) == 2


def test_can_associate_existing_cwt(client, user, event):
    """We should be able to create an assoication between an existing cwt
    and our stocking event.

    """
    new_cwt = CWTFactory(cwt_number=123456)

    assert len(event.cwt_series.all()) == 0

    event_dict = event2dict(event)

    # update the attributes of the first cwt
    event_dict["cwtseries-0-cwt_number"] = "12-34-56"
    event_dict["cwtseries-0-manufacturer"] = "nmt"
    event_dict["cwtseries-0-tag_type"] = "cwt"

    # make sure we update the tags attr too (tested elsewhere)
    event_dict["fish_tags"] = "CWT"

    # don't forget to increment the management form to reflect the number of cwts:
    event_dict["cwtseries-INITIAL_FORMS"] = 1
    event_dict["cwtseries-TOTAL_FORMS"] = 1

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True
    url = reverse("stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id})
    response = client.post(url, data=event_dict, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "stocking/stocking_detail.html")

    event_series = event.cwt_series.all()
    assert len(event_series) == 1
    assert event_series[0].cwt == new_cwt


def test_can_create_new_seq_tag(client, user, event):
    """We should be able to create a new sequential cwt"""

    assert CWT.objects.count() == 0
    assert len(event.cwt_series.all()) == 0

    seq_start = 1
    seq_end = 500

    event_dict = event2dict(event)

    # update the attributes of the first cwt
    event_dict["cwtseries-0-cwt_number"] = "12-34-56"
    event_dict["cwtseries-0-manufacturer"] = "nmt"
    event_dict["cwtseries-0-tag_type"] = "sequential"
    event_dict["cwtseries-0-sequence_start"] = seq_start
    event_dict["cwtseries-0-sequence_end"] = seq_end

    # make sure we update the tags attr too (tested elsewhere)
    event_dict["fish_tags"] = "CWT"

    # don't forget to increment the management form to reflect the number of cwts:
    event_dict["cwtseries-INITIAL_FORMS"] = 1
    event_dict["cwtseries-TOTAL_FORMS"] = 1

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True
    url = reverse("stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id})
    response = client.post(url, data=event_dict, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "stocking/stocking_detail.html")

    event_series = event.cwt_series.all()
    assert len(event_series) == 1
    assert event_series[0].sequence.lower == seq_start
    assert event_series[0].sequence.upper == seq_end


def test_can_create_multiple_new_seq_tags(client, user, event):
    """We should be able to create more than one sequential cwt numbers
    differ. 63-01-57 [1-500] and 63-59-68 [1-500]

    """

    seq_start = 1
    seq_end = 500

    assert len(event.cwt_series.all()) == 0

    event_dict = event2dict(event)

    # update the attributes of the first cwt
    event_dict["cwtseries-0-cwt_number"] = "22-22-22"
    event_dict["cwtseries-0-manufacturer"] = "nmt"
    event_dict["cwtseries-0-tag_type"] = "sequential"
    event_dict["cwtseries-0-sequence_start"] = seq_start
    event_dict["cwtseries-0-sequence_end"] = seq_end

    event_dict["cwtseries-1-cwt_number"] = "33-33-33"
    event_dict["cwtseries-1-manufacturer"] = "nmt"
    event_dict["cwtseries-1-tag_type"] = "sequential"
    event_dict["cwtseries-1-sequence_start"] = seq_start
    event_dict["cwtseries-1-sequence_end"] = seq_end

    # make sure we update the tags attr too (tested elsewhere)
    event_dict["fish_tags"] = "CWT"

    # don't forget to increment the management form to reflect the number of cwts:
    event_dict["cwtseries-INITIAL_FORMS"] = 2
    event_dict["cwtseries-TOTAL_FORMS"] = 2

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True
    url = reverse("stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id})
    response = client.post(url, data=event_dict, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "stocking/stocking_detail.html")

    event_series = event.cwt_series.all()
    assert len(event_series) == 2
    assert event_series[0].sequence.lower == seq_start
    assert event_series[0].sequence.upper == seq_end

    assert event_series[1].sequence.lower == seq_start
    assert event_series[1].sequence.upper == seq_end


def test_can_create_multiple_new_seq_tags_distinct_ranges(client, user, event):
    """We should be able to create more than one sequential tag with the
    same cwt number if their sequence ranges are distinct.

    """

    seq_startA = 1
    seq_endA = 500

    seq_startB = 501
    seq_endB = 1500

    assert len(event.cwt_series.all()) == 0

    event_dict = event2dict(event)

    # update the attributes of the first cwt
    event_dict["cwtseries-0-cwt_number"] = "22-22-22"
    event_dict["cwtseries-0-manufacturer"] = "nmt"
    event_dict["cwtseries-0-tag_type"] = "sequential"
    event_dict["cwtseries-0-sequence_start"] = seq_startA
    event_dict["cwtseries-0-sequence_end"] = seq_endA

    event_dict["cwtseries-1-cwt_number"] = "22-22-22"
    event_dict["cwtseries-1-manufacturer"] = "nmt"
    event_dict["cwtseries-1-tag_type"] = "sequential"
    event_dict["cwtseries-1-sequence_start"] = seq_startB
    event_dict["cwtseries-1-sequence_end"] = seq_endB

    # make sure we update the tags attr too (tested elsewhere)
    event_dict["fish_tags"] = "CWT"

    # don't forget to increment the management form to reflect the number of cwts:
    event_dict["cwtseries-INITIAL_FORMS"] = 2
    event_dict["cwtseries-TOTAL_FORMS"] = 2

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True
    url = reverse("stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id})
    response = client.post(url, data=event_dict, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "stocking/stocking_detail.html")

    event_series = event.cwt_series.all()
    assert len(event_series) == 2
    assert event_series[0].sequence.lower == seq_startA
    assert event_series[0].sequence.upper == seq_endA

    assert event_series[1].sequence.lower == seq_startB
    assert event_series[1].sequence.upper == seq_endB

    # they share the same cwt:
    assert event_series[1].cwt == event_series[0].cwt


def test_can_associate_existing_seq_cwt(client, user, event):
    """If all of the tag attributes, including the sequence ranges exactly
    match and exsiting cwt, that cwt should be associated with this
    stocking event.

    """

    # create a cwt series and verify that it is not asscociated with
    # our event before we post the data.

    seq_start = 1
    seq_end = 500
    cwt = CWTFactory(cwt_number="123456")

    (CWTsequenceFactory(cwt=cwt, sequence=[seq_start, seq_end]))

    assert CWT.objects.count() == 1
    assert len(event.cwt_series.all()) == 0

    event_dict = event2dict(event)

    # update the attributes of the first cwt
    event_dict["cwtseries-0-cwt_number"] = "12-34-56"
    event_dict["cwtseries-0-manufacturer"] = "nmt"
    event_dict["cwtseries-0-tag_type"] = "sequential"
    event_dict["cwtseries-0-sequence_start"] = seq_start
    event_dict["cwtseries-0-sequence_end"] = seq_end

    # make sure we update the tags attr too (tested elsewhere)
    event_dict["fish_tags"] = "CWT"

    # don't forget to increment the management form to reflect the number of cwts:
    event_dict["cwtseries-INITIAL_FORMS"] = 1
    event_dict["cwtseries-TOTAL_FORMS"] = 1

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True
    url = reverse("stocking:edit-stocking-event", kwargs={"stock_id": event.stock_id})
    response = client.post(url, data=event_dict, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "stocking/stocking_detail.html")

    event_series = event.cwt_series.all()
    assert len(event_series) == 1
    assert event_series[0].sequence.lower == seq_start
    assert event_series[0].sequence.upper == seq_end


def test_delete_cwt_checkmark(client, user, cwt_event):
    """The cwtformset contains a delete field - if it is checked, the
    association with the cwt will be deleted, if not the assocaition should remain.

    This is a parameterized test, that accepts the two different
    states of the check mark and adjusts the assertions accordingly.

    """

    event_dict = event2dict(cwt_event)

    # fill in the attributes of the cwt - with the 'delete' option on:
    event_dict["cwtseries-0-tag_type"] = "cwt"
    event_dict["cwtseries-0-manufacturer"] = "nmt"
    event_dict["cwtseries-0-cwt_number"] = "11-11-11"
    event_dict["cwtseries-0-delete"] = "on"

    # don't forget to remove the fish tag:
    event_dict.pop("fish_tags")

    login = client.login(email=user.email, password="Abcd1234")
    assert login is True
    url = reverse(
        "stocking:edit-stocking-event", kwargs={"stock_id": cwt_event.stock_id}
    )
    response = client.post(url, data=event_dict, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "stocking/stocking_detail.html")

    assert cwt_event.cwt_series.count() == 0
