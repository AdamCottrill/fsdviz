from django.core.exceptions import ValidationError
from psycopg2.extras import NumericRange

import re

CWT_REGEX = r"[0-9]{6}((,|;)[0-9]{6})*"


def validate_cwt(value, errmsg=None):
    """A custom validator to ensure that cwts """

    if value is None or value == "":
        return value

    if re.fullmatch(CWT_REGEX, value) is None:
        if errmsg is None:
            errmsg = (
                "Each CWT must be 6 digits (including leading 0's)."
                + " Multiple cwts must be separated by a comma"
            )
        raise ValidationError(errmsg)
    else:
        return value


def validate_cwt_sequence_range(value):
    """In order for a sequential cwt range to be valid it must be a numeric range
    or tuple of length two, have two numeric values, both values must be
    postive and the second element must be equal to or greater than the
    first.

    Arguments:
    - `value`: a two element tuple representing a sequential cwt tag range.

    """

    def is_int_or_none(val):
        """"""
        if val is None:
            return True
        try:
            int(val)
        except ValueError:
            return False
        return True

    # if len(value) != 2:
    #     errmsg = "Invalid Range. A range must have a length of exactly 2."
    #     raise ValidationError(errmsg)
    if type(value) is NumericRange:
        lower = value.lower
        upper = value.upper
    else:
        lower = value[0]
        upper = value[1]

    # is numeric:
    # if is_int_or_none(lower) is False or is_int_or_none(upper) is False:
    if (type(lower) is int) is False or (type(upper) is int) is False:
        errmsg = "Invalid Range. Range values must integers"
        raise ValidationError(errmsg)

    errmsg = "Invalid Range. Values in range must be greater than or equal to zero."
    if lower is not None:
        if lower < 0:
            raise ValidationError(errmsg)

    if upper is not None:
        if upper < 0:
            raise ValidationError(errmsg)

    if lower and upper:
        if lower > upper:
            errmsg = "Invalid Range. The lower limit is greater than the upper limit."
            raise ValidationError(errmsg)

    return value
