"""
=============================================================
~/fsdviz/fsdviz/tests/stocking/test_utils.py
 Created: 17 May 2021 17:27:23

 DESCRIPTION:

  This script tests utility funtion from fsdviz/stocking/utils.py


 A. Cottrill
=============================================================
"""

import pytest

from fsdviz.stocking.utils import parseFinClip

args = [
    ("", []),
    ("AD", ["AD"]),
    ("ADAN", ["AD", "AN"]),
    ("ADDOLP", ["AD", "DO", "LP"]),
]


@pytest.mark.parametrize("finclip,expected", args)
def test_parseFinClip(finclip, expected):
    """

    Arguments:
    - `args`:
    """

    assert parseFinClip(finclip) == expected
