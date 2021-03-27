import pytest
import re

from ..stocking.utils import xls2dicts, validate_upload
from fsdviz.tests.pytest_fixtures import invalid_xlsfiles, glsc, huron, mnrf


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


@pytest.mark.parametrize("xlsfile, message", invalid_xlsfiles)
def test_validate_upload(glsc, huron, mnrf, xlsfile, message):
    """Before the data in the spreadsheet can be validated on a row-by-row
    basis, the basic assumptions and shape of the data must be
    confirmed.  If any of the basic tests fail, we need to return to
    upload form and provide a meaningful message. This test is
    parameterized and takes a list of two element tuples covering the
    cases verifying that the uploaded data has between 1 and the max
    number of rows, that all of the required fields are included, but
    no more, and that the upload is limited to a single, year, agency
    and lake.  If any of these criteria fail, the events are
    considered invalid.  validate_upload returns a two element tuple,
    the first is a boolean indicating the validation status of the
    uploaded file, the second is a message decribing the problem.

    """

    fname = MockFile(xlsfile)
    data = xls2dicts(fname)
    status, msg = validate_upload(data, glsc)

    assert status is False
    assert msg == message
