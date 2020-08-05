import pytest


from ..common.forms import CWTSequenceForm


@pytest.fixture()
def valid_data():
    data = {
        "cwt_number": "631234",
        "manufacturer": "nmt",
        "tag_type": "cwt",
        "sequence_start": 1,
        "sequence_end": 1,
    }
    return data


def test_valid_data(valid_data):
    """If we pass good data to our form, it should be valid.
    """

    myform = CWTSequenceForm(valid_data)
    assert myform.is_valid() is True


cwt_list = [
    ("631234", True),
    ("051234", True),
    ("51234", False),
    ("6312AB", False),
    ("6051234", False),
    ("63-12-34", False),
    ("63-12-", False),
]


@pytest.mark.parametrize("cwt_number, form_is_valid", cwt_list)
def test_valid_cwt_number(valid_data, cwt_number, form_is_valid):
    """The cwt field must be exactly 6 digits (we may need to allow dashes
    for agency tags stocked by USGS in Lake Erie.)

    """
    valid_data["cwt_number"] = cwt_number
    myform = CWTSequenceForm(valid_data)
    is_valid = myform.is_valid()
    assert is_valid is form_is_valid
    if is_valid is False:
        error_message = myform.errors["cwt_number"]
        if len(cwt_number) <= 6:
            expected = "CWT Number must be 6 digits (including leading 0's)."
        else:
            expected = "Ensure this value has at most 6 characters (it has {}).".format(
                len(cwt_number)
            )
        assert expected in error_message


type_list = [("cwt", 1, True), ("sequential", 2, True), ("floy", 2, False)]


@pytest.mark.parametrize("tag_type, seq_end, form_is_valid", type_list)
def test_valid_tag_type(valid_data, tag_type, seq_end, form_is_valid):
    """Tag type must one of cwt or sequential. """

    valid_data["tag_type"] = tag_type
    valid_data["sequence_end"] = seq_end
    myform = CWTSequenceForm(valid_data)
    is_valid = myform.is_valid()

    print(myform.errors)

    assert is_valid is form_is_valid
    if is_valid is False:
        error_message = myform.errors.get("tag_type")
        expected = "Select a valid choice. floy is not one of the available choices."
        assert expected in error_message


manufacturer_list = [("nmt", True), ("mm", True), ("acme", False)]


@pytest.mark.parametrize("manufacturer, form_is_valid", manufacturer_list)
def test_valid_manufacturer(valid_data, manufacturer, form_is_valid):
    """manufacturer must be 'nmt' or 'mm'

    """
    valid_data["manufacturer"] = manufacturer
    myform = CWTSequenceForm(valid_data)
    is_valid = myform.is_valid()
    assert is_valid is form_is_valid
    if is_valid is False:
        error_message = myform.errors["manufacturer"]
        expected = "Select a valid choice. acme is not one of the available choices."
        assert expected in error_message


invalid_integers = [
    (-10, "Ensure this value is greater than or equal to 1."),
    (0, "Ensure this value is greater than or equal to 1."),
    ("1.5", "Enter a whole number."),
    ("A", "Enter a whole number."),
    ("", "This field is required."),
    (None, "This field is required."),
]


@pytest.mark.parametrize("value, msg", invalid_integers)
def test_sequence_start_is_integer(valid_data, value, msg):
    """Sequence_start must be a positive initeger and will be one by default
    and can only be a number other than one if tag type is sequential.
    """

    valid_data["sequence_start"] = value
    myform = CWTSequenceForm(valid_data)
    assert myform.is_valid() is False
    error_message = myform.errors["sequence_start"]
    expected = msg
    assert expected in error_message


@pytest.mark.parametrize("value, msg", invalid_integers)
def test_sequence_end_is_integer(valid_data, value, msg):
    """Sequence_end must be a positive initeger and will be one by default
    and can only be a number other than one if tag type is sequential.
    """

    valid_data["sequence_end"] = value
    myform = CWTSequenceForm(valid_data)
    assert myform.is_valid() is False
    error_message = myform.errors["sequence_end"]
    expected = msg
    assert expected in error_message


def test_sequence_start_is_1_for_cwt(valid_data):
    """The sequence start value will always be 1 if the tag type is 'cwt'
    """

    valid_data["sequence_start"] = 100
    myform = CWTSequenceForm(valid_data)
    assert myform.is_valid() is False
    error_message = myform.errors["__all__"]
    expected = (
        "Sequence Start and Sequence End must both be 1 if tag type is not sequential."
    )
    assert expected in error_message


def test_sequence_end_is_1_for_cwt(valid_data):
    """The sequence end value will always be 1 if the tag type is 'cwt'
    """
    valid_data["sequence_end"] = 100
    myform = CWTSequenceForm(valid_data)
    assert myform.is_valid() is False

    error_message = myform.errors["__all__"]
    expected = (
        "Sequence Start and Sequence End must both be 1 if tag type is not sequential."
    )
    assert expected in error_message


def test_sequencal_tag_from_micromark(valid_data):
    """As far as i know, only NMT makes sequential tags this ensures that
    only seuqential tags manufactured by NMT are allowed.

    """
    valid_data["tag_type"] = "sequential"
    valid_data["manufacturer"] = "mm"
    myform = CWTSequenceForm(valid_data)
    assert myform.is_valid() is False

    error_message = myform.errors["__all__"]
    expected = "Sequential tags are only manufactured by NMT."
    assert expected in error_message


start_end = [(10, 10), (100, 10)]


@pytest.mark.parametrize("seq_start, seq_end", start_end)
def test_sequence_end_greater_than_start(valid_data, seq_start, seq_end):
    """It tag type is sequential, then sequence_end must be greater than
    sequence_start.  This test verifies that values that are equal or
    where start is larger than max both throw an error.
    """

    valid_data["tag_type"] = "sequential"
    valid_data["sequence_start"] = seq_start
    valid_data["sequence_end"] = seq_end
    myform = CWTSequenceForm(valid_data)
    assert myform.is_valid() is False

    error_message = myform.errors["__all__"]
    expected = "Sequence Start must be less than Sequence End."
    assert expected in error_message
