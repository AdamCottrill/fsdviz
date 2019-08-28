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
