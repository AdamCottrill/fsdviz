import pytest


from ..stocking.utils import xls2dicts


class MockFile(str):
    """a class that add an open method to a standard string."""

    def open(self):
        return self.__str__()


def test_xls2dicts():
    """the funciton takes a path to an xlsx file and returns a list of
    dictionaries - one for each row of data in the spreadsheet, the
    keys of the spreadsheet correspond to the values in the first row
    the spreadsheet.

    """
    fname = MockFile("fsdviz/tests/xls_files/simple.xlsx")

    expected = [
        {"A": "alpha", "B": "beta", "C": "gamma"},
        {"A": "delta", "B": "epsilon", "C": "zeta"},
    ]

    print("fname.open()={}".format(fname.open()))

    assert xls2dicts(fname) == expected
