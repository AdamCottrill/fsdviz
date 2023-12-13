"""=============================================================
 c:/1work/fsdviz/fsdviz/tests/stocking/test_find_events_form.py
 Created: 18 Mar 2021 17:41:58

 DESCRIPTION:

  The find events and find cwt events forms are used to select
  stocking events that match criteria specified by the user. None of
  the inputs are required, and most of them are select widgets.

  - verify that the form returns a meaningful error message if the
    user somehow selects an option that is not in one of the dropdowns
    for each of the select fields.

  - for the first and last year - only numbers between 1950 and the
    current year are allowed.  If both the first and last year are
    provided, the last year must be greater than or equal to the first
    year.

  - that the list of cwts is not valid, a meaningful error message is
    returned.

  - if the cwt list is valid, the clean_cwt_number method of the form
    will remove any extraneous spaces, dashes, or semi-colons to
    return a string that ca be used as a url parameter.

 A. Cottrill
=============================================================

"""

from datetime import datetime

import pytest

from ...stocking.forms import FindCWTEventsForm, FindEventsForm

choice_fields = [
    # (field_id, choice_key),
    ("lake", "lakes"),
    ("stateprov", "state_provs"),
    ("jurisdiction", "jurisdictions"),
    ("agency", "agencies"),
    ("species", "species"),
    ("strain", "strains"),
    ("life_stage", "lifestages"),
    ("stocking_method", "stocking_methods"),
    ("stocking_month", "stocking_month"),
]


@pytest.mark.parametrize("field", choice_fields)
def test_find_events_invalid_choices(field):
    """This test verifies that the form returns a meaningful message if
    one of the choice fields contains an invalid choice. It takes a
    parameter that consists of a two element tuple containing the
    field_id, and the choice key.  The choice key is used get the real
    value and create a corrupt one that is sent to the form.

    """

    field_name = field[0]
    value = field[1]

    data = dict()
    data[field_name] = [
        value,
    ]
    form = FindEventsForm(data)
    form.fields[field_name].choices = [(1, "a placeholder"), (2, "another placeholder")]

    status = form.is_valid()
    assert status is False
    error_message = form.errors[field_name]
    expected = "Select a valid choice. {} is not one of the available choices."
    assert expected.format(value) in error_message


year_values = (
    # [field, value, message]
    ["first_year", 1925, "Ensure this value is greater than or equal to 1950."],
    ["last_year", 2050, "Ensure this value is less than or equal to {}."],
)


@pytest.mark.parametrize("field_name, value, message", year_values)
def test_find_events_years_out_of_range(field_name, value, message):
    """only numbers between 1950 and the
    current year are allowed.  If both the first and last year are
    provided, the last year must be greater than or equal to the first
    year.

    parameterized test that accepts first_year, last_year, and error message
    """

    data = {}
    data[field_name] = value
    form = FindEventsForm(data)

    status = form.is_valid()
    assert status is False
    error_message = form.errors[field_name]
    expected = message.format(datetime.now().year)
    assert expected in error_message


def test_find_events_first_year_after_last_year():
    """If the first year occurs after the last year, the form should not
    be valid and meaningful error message should be reported.

    """

    data = {}
    data["first_year"] = 2010
    data["last_year"] = 2001

    form = FindEventsForm(data)
    status = form.is_valid()
    assert status is False
    error_message = form.errors["__all__"]
    expected = "Earliest year occurs after latest year."
    assert expected in error_message


def test_find_events_with_first_and_last_year():
    """There was a bug identified where other parameters where dropped
    from the resulting url if both first and last year were
    provided. This test was written to catch that issue, and ensure
    that it doesn't happen again. It source of the bug was in the
    form.clean() method.

    """

    data = {}
    data["lake"] = [
        "MI",
    ]

    data["agency"] = [
        "LTBB",
    ]

    data["first_year"] = 2010
    data["last_year"] = 2012

    form = FindEventsForm(data)
    form.fields["lake"].choices = [("HU", "Lake Huron"), ("MI", "Lake Michigan")]
    form.fields["agency"].choices = [
        ("LTBB", "Little Traverse Bay Band"),
    ]

    status = form.is_valid()
    assert status is True

    assert form.cleaned_data["lake"] == ["MI"]
    assert form.cleaned_data["agency"] == ["LTBB"]
    assert form.cleaned_data["first_year"] == 2010
    assert form.cleaned_data["last_year"] == 2012


@pytest.mark.parametrize("field", choice_fields)
@pytest.mark.django_db
def test_find_cwt_events_invalid_choices(field):
    """This test verifies that the form returns a meaningful message if
    one of the choice fields contains an invalid choice. It takes a
    parameter that consists of a two element tuple containing the
    field_id, and the choice key.  The choice key is used get the real
    value and create a corrupt one that is sent to the form.

    """

    field_name = field[0]
    value = field[1]

    data = dict()
    data[field_name] = [
        value,
    ]

    form = FindCWTEventsForm(data)

    form.fields[field_name].choices = [(1, "a placeholder"), (2, "another placeholder")]

    status = form.is_valid()
    assert status is False
    error_message = form.errors[field_name]
    expected = "Select a valid choice. {} is not one of the available choices."
    assert expected.format(value) in error_message


bad_cwts = [
    "63015A",
    "63-0-157",
    "63015,630158",
    "6-01-57,63-01-58",
    "6310157;630158",
    "63-01-57;63-01-*",
]


@pytest.mark.parametrize("cwt_number", bad_cwts)
def test_find_cwt_events_invalid_cwt_list(cwt_number):
    """
    parameterized test that accepts a list of invalid cwts
    """

    data = {"cwt_number": cwt_number}
    form = FindCWTEventsForm(data)

    status = form.is_valid()
    assert status is False
    error_message = form.errors["cwt_number"]
    expected = (
        "Each CWT must be of the form 012345 or 01-23-45 and include any "
        + "leading 0's. Multiple cwts must be separated by a comma or semicolon"
    )

    assert expected in error_message


good_cwts = [
    ("630157", "630157"),
    ("63-01-57", "630157"),
    ("630157,630158", "630157,630158"),
    ("63-01-57,63-01-58", "630157,630158"),
    ("630157;630158", "630157,630158"),
    ("63-01-57;63-01-58", "630157,630158"),
    ("630157, 630158", "630157,630158"),
    ("63-01-57;  63-01-58", "630157,630158"),
    ("630157; 630158", "630157,630158"),
    ("63-01-57; 63-01-58", "630157,630158"),
]


@pytest.mark.parametrize("cwt_string, cleaned", good_cwts)
def test_find_cwt_events_invalid_cwt_list(cwt_string, cleaned):
    """
    parameterized test that accepts a list of invalid cwts
    """

    data = {"cwt_number": cwt_string}
    form = FindCWTEventsForm(data)

    status = form.is_valid()
    assert status is True
    assert form.cleaned_data["cwt_number"] == cleaned
