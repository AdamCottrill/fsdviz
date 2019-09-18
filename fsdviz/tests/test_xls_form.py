# from django import forms
import pytest

from fsdviz.stocking.forms import XlsEventForm

from fsdviz.tests.pytest_fixtures import stocking_event_dict


@pytest.fixture(scope="module")
def xls_choices():
    """
    """
    choices = {
        "lakes": [("HU", "HU")],
        "agencies": [("MNRF", "MNRF")],
        "state_prov": [("ON", "ON")],
        "stat_dist": {"HU": [("NC2", "NC2")]},
        "species": [("LAT", "Lake Trout")],
        "lifestage": [("y", "yearling")],
        "condition": [(1, 1)],
        "stocking_method": [("b", "boat")],
        "grids": {"HU": [("214", "214")]},
    }

    return choices


@pytest.mark.django_db
def test_xlseventform_good_data(stocking_event_dict, xls_choices):
    """If we pass in a complete, valid dataset that matches all of our
    choices, our form will be valid.

    """

    data = stocking_event_dict
    form = XlsEventForm(data=data, choices=xls_choices)
    status = form.is_valid()
    assert status is True


choice_fields = [
    "lake",
    "agency",
    "state_prov",
    "stat_dist",
    "species",
    "stage",
    "condition",
    "stock_meth",
    "grid",
]


@pytest.mark.django_db
@pytest.mark.parametrize("field_name", choice_fields)
def test_xlseventform_invalid_select(stocking_event_dict, xls_choices, field_name):
    """If we pass in a data set that has a choice field that is not in the
    list fo valid choices, the form will not be valid, and an appropriate
    error should be created.

    This test is parameterized to accept a list of fields that use
    choices.  For each iteration, the data in the dictionary is
    updated to a invalid value ("fake") and then submitted to the
    form.

    """

    data = stocking_event_dict
    data[field_name] = "fake"
    form = XlsEventForm(data=data, choices=xls_choices)

    status = form.is_valid()
    assert status is False

    error_message = form.errors[field_name]
    expected = "Select a valid choice. fake is not one of the available choices."
    assert expected in error_message


required_fields = [
    "agency",
    "lake",
    "state_prov",
    "year",
    "stat_dist",
    "grid",
    "site",
    "species",
    "strain",
    "stage",
    "stock_meth",
    "no_stocked",
]


@pytest.mark.django_db
@pytest.mark.parametrize("field_name", required_fields)
def test_xlseventform_missing_required_field(
    stocking_event_dict, xls_choices, field_name
):
    """If we pass in a data set that is missing a required filed, the form
    will not be valid, and an appropriate error should be created.

    This test is parameterized to accept a list of fields that are
    flagged as required.  For each iteration, the data in the
    dictionary is updated to None and then submitted to the form,
    which should be invalid and return a meaningful error message.

    """

    data = stocking_event_dict
    data[field_name] = None
    form = XlsEventForm(data=data, choices=xls_choices)
    status = form.is_valid()
    assert status is False

    error_message = form.errors[field_name]
    expected = "This field is required."
    assert expected in error_message


invalid_dates = [
    (2017, 2, 29, False),  # not a leap year
    (2016, 2, 30, False),
    (2015, 2, 31, False),
    (2014, 4, 31, False),
    (2013, 6, 31, False),
    (2012, 9, 31, False),
    (2011, 11, 31, False),
    # valid dates
    (2016, 2, 29, True),  # a leap year
    (2016, 2, 28, True),
    (2015, 3, 30, True),
    (2014, 4, 30, True),
    (2013, 6, 30, True),
    (2012, 9, 30, True),
    (2011, 11, 30, True),
]


@pytest.mark.django_db
@pytest.mark.parametrize("year, month, day, valid", invalid_dates)
def test_xlseventform_valid_invalid_dates(
    stocking_event_dict, xls_choices, year, month, day, valid
):
    """If the stocking event data contains day, month and year, and forms
    a valid date (including leap years), the form should be valid, if
    day month and year do not form a valid data - either because the
    day is on the 31 of a month with 30 days, is Feb 29 on a non-leap
    year, or is our of range for days or months, the form should be
    invalid and return a meaningful error message.


    This test is parameterized to accept a list of day, month, year
    combinations and the expected status of the form. If the form is
    invalid, it should contain a meaningful error message.

    """

    data = stocking_event_dict
    data["year"] = year
    data["month"] = month
    data["day"] = day
    form = XlsEventForm(data=data, choices=xls_choices)
    status = form.is_valid()
    assert status is valid

    if status is False:
        expected = "Day, month, and year do not form a valid date."
        error_messages = [x[1][0] for x in form.errors.items()]
        assert expected in error_messages

    # todo: check error message


invalid_dates = [(2013, 6, 50), (2011, 11, -30), (2011, 11, 0)]


@pytest.mark.django_db
@pytest.mark.parametrize("year, month, day", invalid_dates)
def test_xlseventform_day_out_of_range(
    stocking_event_dict, xls_choices, year, month, day
):
    """If the stocking event data contains day that is >31 or less than 1,
    the form will not be valid and an error will be thrown.

    This test is parameterized to accept a list of day, month, year
    combinations If the form is invalid, it should contain a
    meaningful error message.

    """

    data = stocking_event_dict
    data["year"] = year
    data["month"] = month
    data["day"] = day
    form = XlsEventForm(data=data, choices=xls_choices)
    status = form.is_valid()
    assert status is False

    error_messages = [x[1][0] for x in form.errors.items()]
    expected = "Select a valid choice. {} is not one of the available choices."
    assert expected.format(day) in error_messages


invalid_dates = [(2013, 16, 15), (2011, -11, 30), (2011, 0, 15)]


@pytest.mark.django_db
@pytest.mark.parametrize("year, month, day", invalid_dates)
def test_xlseventform_month_out_of_range(
    stocking_event_dict, xls_choices, year, month, day
):
    """If the stocking event data contains month that is >12 or less than 1,
    the form will not be valid and an error will be thrown.

    This test is parameterized to accept a list of day, month, year
    combinations If the form is invalid, it should contain a
    meaningful error message.

    """

    data = stocking_event_dict
    data["year"] = year
    data["month"] = month
    data["day"] = day
    form = XlsEventForm(data=data, choices=xls_choices)
    status = form.is_valid()
    assert status is False

    error_messages = [x[1][0] for x in form.errors.items()]
    expected = "Select a valid choice. {} is not one of the available choices."
    assert expected.format(month) in error_messages


@pytest.mark.xfail
@pytest.mark.django_db
def test_xlseventform_wrong_grid(stocking_event_dict, xls_choices):
    """If the provided grid cannot be found in the lake, the form
    should be invalid, and a meaningful error message should be
    produced.
    """

    data = stocking_event_dict
    data["grid"] = 999
    lake = data.get("lake")
    form = XlsEventForm(data=data, choices=xls_choices)
    status = form.is_valid()
    assert status is False

    error_messages = [x[1][0] for x in form.errors.items()]
    expected = "Grid {} is not valid for lake {}".format(999, lake)
    assert expected in error_messages


@pytest.mark.django_db
def test_xlseventform_no_grid_invalid_lake(stocking_event_dict, xls_choices):
    """If the provided grid cannot be found in the lake because the lake
    does not exist, the form should be invalid, and a meaningful error
    message should be produced.

    """

    data = stocking_event_dict
    data["lake"] = "fake"
    form = XlsEventForm(data=data, choices=xls_choices)
    status = form.is_valid()
    assert status is False

    error_messages = [x[1][0] for x in form.errors.items()]
    expected = "Unable to find any grids for lake '{}'"
    assert expected.format("fake") in error_messages


@pytest.mark.xfail
@pytest.mark.django_db
def test_xlseventform_wrong_stat_dist(stocking_event_dict, xls_choices):
    """If the provided stat_dist cannot be found in the lake, the form
    should be invalid, and a meaningful error message should be
    produced.


    """

    data = stocking_event_dict
    data["stat_dist"] = "FAKE"
    lake = data.get("lake")
    form = XlsEventForm(data=data, choices=xls_choices)
    status = form.is_valid()
    assert status is False

    error_messages = [x[1][0] for x in form.errors.items()]
    expected = "Stat_Dist {} is not valid for lake {}".format("FAKE", lake)
    assert expected in error_messages


@pytest.mark.django_db
def test_xlseventform_no_stat_dist_invalid_lake(stocking_event_dict, xls_choices):
    """If the provided stat_dist cannot be found in the lake because the
    lake does noe exist, the form should be invalid, and a meaningful
    error message should be produced.

    """

    data = stocking_event_dict
    data["lake"] = "fake"
    form = XlsEventForm(data=data, choices=xls_choices)
    status = form.is_valid()
    assert status is False

    error_messages = [x[1][0] for x in form.errors.items()]
    expected = "Unable to find any Statistical Districts for lake '{}'"
    expected = expected.format("fake")
    assert expected in error_messages
