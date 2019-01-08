"""
Tests for the models in the common application - agency, lake,
species, ect.

"""

import pytest

from .stocking_factories import (LifeStageFactory, ConditionFactory,
                                StockingMethodFactory)


@pytest.mark.django_db
def test_lifestage_str():
    """
    Verify that the string representation of a life stage object is the
    life stage followed by the abbreviation in parentheses.

    Fall Fingerlings (ff)

    """


    abbrev = 'ff'
    description = 'Fall Fingerling'

    lifestage = LifeStageFactory(abbrev=abbrev,
                                 description=description)

    shouldbe = '{} ({})'.format(description, abbrev)
    assert str(lifestage) == shouldbe



@pytest.mark.django_db
def test_condition_str():
    """
    Verify that the string representation of a condition object is the
    value followed by the condition description:

    1 - <1% mortality observed, "excellent"

    """


    condition_code = 1
    description = '<1% mortality observed, "excellent"'

    condition = ConditionFactory(condition=condition_code,
                                 description=description)

    shouldbe = '{} - {}'.format(condition_code, description)
    assert str(condition) == shouldbe



@pytest.mark.django_db
def test_stockingmethod_str():
    """
    Verify that the string representation of a StockingMethod object is the
    method description followed by the abbreviation in parentheses:

    "inshore stocking, up tributaries (i)"

    """


    stk_meth = 'i'
    description = 'inshore stocking, up tributaries'

    stockingmethod = StockingMethodFactory(stk_meth=stk_meth,
                                           description=description)

    shouldbe = '{} ({})'.format(description, stk_meth)
    assert str(stockingmethod) == shouldbe
