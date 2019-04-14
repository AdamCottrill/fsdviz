"""Unit tests to verify that methods associated with our models are
working as they should."""

from ..models import CustomUser


def test_custom_user_str():
    """the str method of our custom user should return the user's email.

    Arguments:
    - `self`:
    """

    email = 'homer@simpson.com'
    homer = CustomUser(
        first_name="homer",
        last_name="simpson",
        password="password123", email=email)

    assert str(homer) == email



def test_custom_fullname():
    """the full name method of our custom user should return the users
    first name followed by their last name.

    """

    email = 'homer@simpson.com'

    homer = CustomUser(
        first_name="homer",
        last_name="simpson",
        password="password123", email=email)

    assert homer.fullname() == "Homer Simpson"


def test_custom_shortname():
    """the short name method of our custom user should return the users
    first initial followed by their last name.

    """

    email = 'homer@simpson.com'

    homer = CustomUser(
        first_name="homer",
        last_name="simpson",
        password="password123", email=email)

    assert homer.shortname() == "H. Simpson"
