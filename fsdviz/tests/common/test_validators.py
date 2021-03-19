"""=============================================================
~/fsdviz/fsdviz/tests/test_validators.py
 Created: 13 May 2020 17:48:38

 DESCRIPTION:

  This script ensure that the validators used by our forms work as
  expected.

 A. Cottrill
=============================================================

"""

import pytest
from django.core.exceptions import ValidationError
from ...common.validators import validate_cwt, cwt_list_validator


valid = [
    "631234",
    "631512,635978",
    "631512,635978,639845",
    "631512;635978",
    "631512;635978;639845",
    "631512;635978,639845",
]


@pytest.mark.parametrize("value", valid)
def test_valid_cwt_patterns(value):
    """These are all valid cwt patterns that should be considered valid and pass."""
    assert validate_cwt(value) == value


invalid = [
    "31234",
    "51234",
    "6312AB",
    "6051234",
    "63-12-34",
    "63-12-",
    "6631234",
    "631512,35978",
    "631512,6635978,639845",
    "631512;63978",
    "631512;6359978;639845",
    "631512;6359798,639845",
    "631512;63597,639845",
    "631512;63597,639",
]


@pytest.mark.parametrize("value", invalid)
def test_invalid_cwt_patterns(value):
    """These are invalid cwt patters that should raise and exception."""

    errmsg = (
        "[\"Each CWT must be 6 digits (including leading 0's)."
        + ' Multiple cwts must be separated by a comma"]'
    )

    with pytest.raises(ValidationError) as e:
        assert validate_cwt(value)

    assert str(e.value) == errmsg


def test_cwt_list_validator_good_cwts():
    """This test verifies that the regular expresssion used to validate
    lists of cwts works as expected.  Essentailly, a list of cwt must
    consist of 6 digits that can be separated by an optoinal
    dash. Additional cwts can be added by separating individual cwts
    with a comma or a semi-colon followed by an optional space.  If
    any cwt has anything other than six digits, it is considered to be
    invalid.

    """

    good_cwts = [
        "630157",
        "63-01-57",
        "630157,630158",
        "63-01-57,63-01-58",
        "630157;630158",
        "63-01-57;63-01-58",
        "630157, 630158",
        "63-01-57;  63-01-58",
        "630157; 630158",
        "63-01-57; 63-01-58",
    ]

    for value in good_cwts:
        assert cwt_list_validator(value) == value


def test_cwt_list_validator_bad_cwts():
    """This test verifies that the regular expresssion used to validate
        lists of cwts works as expected.  These cwts have something wrong
        with them that should raise an error.
    b
    """

    bad_cwts = [
        "63015A",
        "63-0-157",
        "63015,630158",
        "6-01-57,63-01-58",
        "6310157;630158",
        "63-01-57;63-01-*",
    ]

    errmsg = (
        '["Each CWT must be of the form 012345 or 01-23-45 and include any '
        + "leading 0's. Multiple cwts must be separated by a comma or semicolon\"]"
    )

    for value in bad_cwts:
        with pytest.raises(ValidationError) as e:
            assert cwt_list_validator(value)

        assert str(e.value) == errmsg
