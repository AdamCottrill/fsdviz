"""
=============================================================
~/fsdviz/fsdviz/tests/test_validators.py
 Created: 13 May 2020 17:48:38

 DESCRIPTION:

  This script ensure that the validator used by our forms work as expected.

 A. Cottrill
=============================================================
"""

import pytest
from django.core.exceptions import ValidationError
from ...common.validators import validate_cwt


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
    """These are all valid cwt patterns that should be considered valid and pass.
    """
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
    """These are invalid cwt patters that should raise and exception.
    """

    errmsg = (
        "[\"Each CWT must be 6 digits (including leading 0's)."
        + ' Multiple cwts must be separated by a comma"]'
    )

    with pytest.raises(ValidationError) as e:
        assert validate_cwt(value)

    print("errmsg={}".format(errmsg))
    print("str(e.value)={}".format(str(e.value)))

    assert str(e.value) == errmsg
