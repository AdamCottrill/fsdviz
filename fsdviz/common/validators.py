from django.core.exceptions import ValidationError

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
