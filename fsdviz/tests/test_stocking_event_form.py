"""=============================================================
~/fsdviz/fsdviz/tests/test_stocking_event_form.py
 Created: 20 Jan 2020 15:03:19

 DESCRIPTION:

This file contains a large number of tests to verify that the stocking
event form works as expected. The tests are layed out in this file, is
an order that closely emulates the order that the field appear on the
html page.  A global 'event' dictionary contains a complete, valid
data submission that is then changed to verify that the change is
captured and handled appropriately.

 A. Cottrill
=============================================================

"""

import pytest
from datetime import datetime

from ..stocking.utils import get_event_model_form_choices
from ..stocking.forms import StockingEventForm

from .stocking_factories import StockingEventFactory

SCOPE = "function"


def create_event_dict(event):
    """

    Arguments:
    - `event`:
    """
    event_dict = event.__dict__

    omit = [
        "jurisdiction_id",
        "geom",
        "created_date",
        "modified_date",
        "yreq_stocked",
        "grid_5",
        "clipa",
        "upload_event_id",
    ]
    for fld in omit:
        event_dict.pop(fld)

    event_dict["lake_id"] = event.jurisdiction.lake.id
    event_dict["state_prov_id"] = event.jurisdiction.stateprov.id
    return event_dict


@pytest.fixture(scope=SCOPE, name="event")
def stocking_event(db):
    """return a basic stocking event that will be used by all of our tests.
    """
    event = StockingEventFactory()

    return event


@pytest.mark.django_db
def test_complete_valid_data(event):
    """If we pass a dictionary with complete data, the form should be valid.
    """

    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)
    form = StockingEventForm(event_dict, choices=choices)

    assert form.is_valid() is True


choice_fields = [
    # (field_id, choice_key),
    ("agency_id", "agencies"),
    ("lake_id", "lakes"),
    ("state_prov_id", "state_provs"),
    ("species_id", "species"),
    ("lifestage_id", "lifestages"),
    ("condition_id", "conditions"),
    ("stocking_method_id", "stocking_methods"),
    ("grid_10_id", "grids"),
    ("strain_raw_id", "strains"),
    ("management_unit_id", "managementUnits"),
]


@pytest.mark.parametrize("field", choice_fields)
@pytest.mark.django_db
def test_invalid_choices(event, field):
    """This test verifies that the form returns a meaningful message if
    one of the choice fields contains an invalid choice. It takes a
    parameter that consists of a two element tuple containing the
    field_id, and the choice key.  The choice key is used get the real
    value and create a corrupt one that is sent to the form.

    """

    field_name = field[0]
    choice_key = field[1]

    choices = get_event_model_form_choices(event)

    event_dict = create_event_dict(event)

    # get the first element of the first list in agencies
    new_choice = choices[choice_key][0][0] + 10
    event_dict[field_name] = new_choice

    form = StockingEventForm(event_dict, choices=choices)

    status = form.is_valid()
    assert status is False
    error_message = form.errors[field_name]
    expected = "Select a valid choice. {} is not one of the available choices."

    assert expected.format(new_choice) in error_message


required_fields = [
    "agency_id",
    "species_id",
    "strain_raw_id",
    "year",
    "lake_id",
    "state_prov_id",
    "management_unit_id",
    "grid_10_id",
    # "dd_lat",
    # "dd_lon",
    # "latlong_flag_id",
    "site",
    # "st_site",
    # "site_type",
    "no_stocked",
    "stocking_method_id",
    "year_class",
    "lifestage_id",
    # "agemonth",
    # "mark",
    # "mark_eff",
    # "tag_no",
    # "tag_ret",
    # "length",
    # "weight",
    # "condition_id",
    # "validation",
    # "lotcode",
    # "notes",
]


@pytest.mark.parametrize("field_name", required_fields)
@pytest.mark.django_db
def test_missing_required_field(event, field_name):
    """This test verifies that the form returns a meaningful message if
    one of the required fields is not populated. It is parameterized
    to take a list of requried field names, then submit the form with
    each field missing.  For each field, it asserts that an
    appropriate error message is returned.

    """

    choices = get_event_model_form_choices(event)

    event_dict = create_event_dict(event)

    # get the first element of the first list in agencies

    event_dict[field_name] = None

    form = StockingEventForm(event_dict, choices=choices)

    status = form.is_valid()
    assert status is False
    error_message = form.errors[field_name]

    expected = "This field is required."
    assert expected in error_message


invalid_values = [("year", [-10, 1900, 2032, "foo"])]


# ==========================================
#         TEMPORAL FIELDs

thisyear = datetime.now().year
numeric_fields = [
    (
        "year",
        [-10, 1900, 2032, "foo"],
        [
            "Ensure this value is greater than or equal to 1950.",
            "Ensure this value is greater than or equal to 1950.",
            "Ensure this value is less than or equal to {}.".format(thisyear),
            "Enter a whole number.",
        ],
    ),
    (
        "month",
        [-10, 0, 13, "foo"],
        [
            "Select a valid choice. -10 is not one of the available choices.",
            "Select a valid choice. 0 is not one of the available choices.",
            "Select a valid choice. 13 is not one of the available choices.",
            "Select a valid choice. foo is not one of the available choices.",
        ],
    ),
    (
        "day",
        [-10, 0, 32, "foo"],
        [
            "Select a valid choice. -10 is not one of the available choices.",
            "Select a valid choice. 0 is not one of the available choices.",
            "Select a valid choice. 32 is not one of the available choices.",
            "Select a valid choice. foo is not one of the available choices.",
        ],
    ),
]


@pytest.mark.parametrize("field", numeric_fields)
@pytest.mark.django_db
def test_invalid_year(event, field):
    """If we pass a dictionary with an year value that is outside of the valid range,
    we should get a meaningful error message.

    invalid values include: -10, 1900, 2032, foo

    """
    field_name = field[0]
    values = field[1]
    messages = field[2]

    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    # get the first element of the first list in agencies

    for val, msg in zip(values, messages):
        event_dict[field_name] = val

        form = StockingEventForm(event_dict, choices=choices)

        status = form.is_valid()
        assert status is False
        error_message = form.errors[field_name]

        assert msg in error_message


@pytest.mark.django_db
def test_missing_month_no_day(event):
    """If we pass a dictionary that has an empty month id, an missing day value,
    the record should be created without issue.

    OK

    """

    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    event_dict["month"] = None
    event_dict["day"] = None

    form = StockingEventForm(event_dict, choices=choices)

    status = form.is_valid()
    assert status is True


@pytest.mark.django_db
def test_missing_month_with_day(event):
    """If we pass a dictionary that has an empty month id, but a day value
    has been provided should get a meaningful error message.

    ERROR

    """

    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    event_dict["month"] = None

    form = StockingEventForm(event_dict, choices=choices)

    status = form.is_valid()
    assert status is False
    # assert error messages
    # month is required if day id provided:
    msg = "Please provide a month to complete the event date."
    assert msg in form.errors["__all__"]


@pytest.mark.django_db
def test_missing_day(event):
    """If we pass a dictionary that has an empty day id,
    should get a meaningful error message.

    OK

    """

    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    event_dict["day"] = None

    form = StockingEventForm(event_dict, choices=choices)

    status = form.is_valid()
    assert status is True


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
def test_invalid_date(event, year, month, day, valid):
    """If we pass a dictionary with day, month and year values that form
    an invalid date,  should get a meaningful error message.

    invalid values include: 1900-10-10, 2000-04-31, 2050-10-10.

    """

    choices = get_event_model_form_choices(event)
    event_dict = create_event_dict(event)

    event_dict["year"] = year
    event_dict["month"] = month
    event_dict["day"] = day

    form = StockingEventForm(event_dict, choices=choices)

    status = form.is_valid()
    assert status is valid

    if status is False:
        expected = "Day, month, and year do not form a valid date."
        error_messages = [x[1][0] for x in form.errors.items()]
        assert expected in error_messages


# # ==========================================
# #         SPATIAL FIELDs


# # test
# # lat long flag


# @pytest.mark.django_db
# def test_invalid_lake(event):
#     """If we pass a dictionary with an lake id that does not exist, we
#     should get a meaningful error message.

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_lake(event):
#     """If we pass a dictionary that has an empty lake id,
#     should get a meaningful error message.

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_invalid_state_province(event):
#     """If we pass a dictionary with an state_province id that does not exist, we
#     should get a meaningful error message.

#     ERROR

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_state_province(event):
#     """If we pass a dictionary that has an empty state_province id,
#     should get a meaningful error message.

#     ERROR

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_invalid_stat_district(event):
#     """If we pass a dictionary with an stat_district id that does not exist, we
#     should get a meaningful error message.

#     ERROR

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_stat_district_no_grid10(event):
#     """If we pass a dictionary that has an empty stat_district id, and
#     grid10, and lat-lon are null too, the form should be valid, and
#     the latlong flag should be set accordingly.

#     OK.

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_stat_district_with_grid10(event):
#     """If we pass a dictionary that has an empty stat_district id,
#     but a grid10 value as provided, we should get a meaningful error message.

#     ERROR.

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_invalid_grid10(event):
#     """If we pass a dictionary with an grid10 id that does not exist, we
#     should get a meaningful error message.

#     ERROR

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_grid10_no_latlon(event):
#     """If we pass a dictionary that has an empty grid10 id, and null
#    lat-lon, the record should be created without issue, but the latlon
#    flag should be set.

#     OK

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_grid10_with_latlon(event):
#     """If we pass a dictionary that has an empty grid10 id, and latlong
#     was also provided, grid is a required field and should be
#     consistent with the supplied coordinates.

#     ERROR

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_lat_but_no_lon(event):
#     """If we pass a dictionary that has a latitude, but no longitude, we
#     should be presented with a meaningful error message.

#     ERROR

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_lon_but_no_lat(event):
#     """If we pass a dictionary that has a longitude, but no latitude, we
#     should be presented with a meaningful error message.

#     ERROR

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_longitude_out_of_bounds(event):
#     """If we pass a dictionary that has longitude out of bounds, we should
#     get a meaningful error message

#     ERROR

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_latitude_out_of_bounds(event):
#     """If we pass a dictionary that has latitude out of bounds, we should
#     get a meaningful error message

#     ERROR

#     """
#     assert 0 == 1


# # site name - this field is required
# @pytest.mark.django_db
# def test_missing_site_name(event):
#     """If we pass a dictionary that is missing a general site name, we should
#     get a meaningful error message

#     ERROR

#     """
#     assert 0 == 1


# # =============================================================
# #          EVENT ATTRIBUTES

# # number stocked (required, positive integer)
# @pytest.mark.django_db
# def test_invalid_no_stocked(event):
#     """If we pass a dictionary with an no_stocked id that does not exist, we
#     should get a meaningful error message.

#     invalid numbers would include: -10, 0, foo

#     ERROR

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_no_stocked(event):
#     """If we pass a dictionary that does not have the number_stocked, a
#     meaningful should be presented.

#     ERROR

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_invalid_year_class(event):
#     """If we pass a dictionary with an year_class id that does not exist, we
#     should get a meaningful error message.

#     invalid numbers would include: -10, 200, 2111

#     ERROR

#     """
#     assert 0 == 1


# # year class (required, positive integer)
# @pytest.mark.django_db
# def test_invalid_year_class_after_stocking_year(event):
#     """If we pass a dictionary with an year_class that occurs after stocking date, we
#     should get a meaningful error message.

#     ERROR

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_year_class(event):
#     """If we pass a dictionary that does not have the number_stocked, a
#     meaningful should be presented.

#     ERROR

#     """
#     assert 0 == 1


# # stocking method - required
# @pytest.mark.django_db
# def test_invalid_stocking_method(event):
#     """If we pass a dictionary with an stocking_method that does not exist, we
#     should get a meaningful error message.

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_stocking_method(event):
#     """If we pass a dictionary that has an empty stocking_method,
#     should get a meaningful error message.

#     """
#     assert 0 == 1


# # life stage - required
# @pytest.mark.django_db
# def test_invalid_life_stage(event):
#     """If we pass a dictionary with an life_stage that does not exist, we
#     should get a meaningful error message.

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_life_stage(event):
#     """If we pass a dictionary that has an empty life_stage,
#     should get a meaningful error message.

#     """
#     assert 0 == 1


# # age in months - required
# @pytest.mark.django_db
# def test_invalid_age_months(event):
#     """If we pass a dictionary with an age_months that does not exist, we
#     should get a meaningful error message.

#     invalid values include: -10, foo, "8,3"

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_age_months(event):
#     """If we pass a dictionary that has an empty age_months, the record
#     should still be created.

#     OK.

#     """
#     assert 0 == 1


# # clip - optional (required if clip efficency is populated). Must be valid string
# @pytest.mark.django_db
# def test_invalid_clip(event):
#     """If we pass a dictionary with an clip that does not exist, we
#     should get a meaningful error message.

#      NOTE: CLIP has not been added to our form or database yet!

#     invalid values include: -10, foo, "8,3", ????

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_clip(event):
#     """If we pass a dictionary that has an empty clip, the record
#     should still be created.

#      NOTE: CLIP has not been added to our form or database yet!

#     OK.

#     """
#     assert 0 == 1


# # mark - optional (required if mark efficency is populated). Must be valid string
# @pytest.mark.django_db
# def test_invalid_mark(event):
#     """If we pass a dictionary with an mark that does not exist, we
#     should get a meaningful error message.

#     invalid values include: -10, foo, "8,3", ????

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_mark(event):
#     """If we pass a dictionary that has an empty mark, the record
#     should still be created.

#     OK.

#     """
#     assert 0 == 1


# # mark_eff - optional, but must be bewteen 0 and 100 if provided.
# @pytest.mark.django_db
# def test_invalid_mark_eff(event):
#     """If we pass a dictionary with an mark_eff that does not exist, we
#     should get a meaningful error message.

#     invalid values include: -10, foo, 101"

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_mark_eff(event):
#     """If we pass a dictionary that has an empty mark_eff, the record
#     should still be created.

#     OK.

#     """
#     assert 0 == 1


# # tag_no = optional, but must be a valid string if provided.
# @pytest.mark.django_db
# def test_invalid_tag_no(event):
#     """If we pass a dictionary with an tag_no that does not exist, we
#     should get a meaningful error message.

#     invalid values include: -10, foo, "8,3"

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_tag_no(event):
#     """If we pass a dictionary that has an empty tag_no, the record
#     should still be created.

#     OK.

#     """
#     assert 0 == 1


# # tag_ret - optional, but must be bewteen 0 and 100 of provided.
# @pytest.mark.django_db
# def test_invalid_tag_ret(event):
#     """If we pass a dictionary with an tag_ret that does not exist, we
#     should get a meaningful error message.

#     invalid values include: -10, foo, "8,3"

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_tag_ret(event):
#     """If we pass a dictionary that has an empty tag_ret, the record
#     should still be created.

#     OK.

#     """
#     assert 0 == 1


# # length - optional but must be positive if provided
# @pytest.mark.django_db
# def test_invalid_avg_length(event):
#     """If we pass a dictionary with an avg_length that does not exist, we
#     should get a meaningful error message.

#     invalid values include: -10, foo, "8,3"

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_avg_length(event):
#     """If we pass a dictionary that has an empty avg_length, the record
#     should still be created.

#     OK.

#     """
#     assert 0 == 1


# # aaverage length - optional, but positive if provided.
# @pytest.mark.django_db
# def test_invalid_avg_weight(event):
#     """If we pass a dictionary with an avg_weight that does not exist, we
#     should get a meaningful error message.

#     invalid values include: -10, foo, "8,3"

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_avg_weight(event):
#     """If we pass a dictionary that has an empty avg_weight, the record
#     should still be created.

#     OK.

#     """
#     assert 0 == 1


# # condition - optional, but must be one of the selected values if provided.
# @pytest.mark.django_db
# def test_invalid_condition(event):
#     """If we pass a dictionary with an condition that does not exist, we
#     should get a meaningful error message.

#     invalid values include: -10, foo, "8,3"

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_condition(event):
#     """If we pass a dictionary that has an empty condition, the record
#     should still be created.

#     OK.

#     """
#     assert 0 == 1


# # validation - optional, but must be one of the selected values if provided.


# @pytest.mark.django_db
# def test_invalid_validation(event):
#     """If we pass a dictionary with an validation that does not exist, we
#     should get a meaningful error message.

#     invalid values include: -10, foo, "8,3"

#     """
#     assert 0 == 1


# @pytest.mark.django_db
# def test_missing_validation(event):
#     """If we pass a dictionary that has an empty validation, the record
#     should still be created.

#     OK.

#     """
#     assert 0 == 1


# # test parse marks, clips and cwts
