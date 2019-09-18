"""
=============================================================
~/fsdviz/fsdviz/tests/pytest_fixtures.py
 Created: 28 Aug 2019 11:09:58

 DESCRIPTION:



 A. Cottrill
=============================================================
"""


import pytest
from .user_factory import UserFactory

SCOPE = "function"


@pytest.fixture(scope=SCOPE)
def user(db):
    """return a normal user named homer
    """
    password = "Abcd1234"
    homer = UserFactory.create(
        username="hsimpson", first_name="Homer", last_name="Simpson", password=password
    )
    homer.save()
    return homer


# our list of invalid spreadsheets and their associated messages
invalid_xlsfiles = [
    (
        "fsdviz/tests/xls_files/two_agencies.xlsx",
        (
            "The uploaded file has more than one agency. "
            + " Data submissions are limited to a single year, species, and agency. "
        ),
    ),
    (
        "fsdviz/tests/xls_files/two_lakes.xlsx",
        (
            "The uploaded file has more than one lake. "
            + " Data submissions are limited to a single year, species, and agency. "
        ),
    ),
    (
        "fsdviz/tests/xls_files/two_years.xlsx",
        (
            "The uploaded file has more than one year. "
            + " Data submissions are limited to a single year, species, and agency. "
        ),
    ),
    (
        "fsdviz/tests/xls_files/too_many_records.xlsx",
        "Uploaded file has too many records. Please split it into"
        + "smaller packets (e.g by species).",
    ),
    (
        "fsdviz/tests/xls_files/empty_template.xlsx",
        "The uploaded file does not appear to contain any stocking records!",
    ),
    (
        "fsdviz/tests/xls_files/missing_one_field.xlsx",
        (
            "The uploaded file appears to be missing the field: mark. "
            + "This field is required in a valid data upload template."
        ),
    ),
    (
        "fsdviz/tests/xls_files/missing_two_fields.xlsx",
        (
            "The uploaded file appears to be missing the fields: agemonth, mark. "
            + "These fields are required in a valid data upload template."
        ),
    ),
    (
        "fsdviz/tests/xls_files/one_extra_field.xlsx",
        (
            "The uploaded file appears to have an additional field: extraA. "
            + "This field was ignored."
        ),
    ),
    (
        "fsdviz/tests/xls_files/two_extra_fields.xlsx",
        (
            "The uploaded file appears to have 2 additional field(s): extraA, extraB. "
            + "These fields were ignored."
        ),
    ),
]
