"""=============================================================
~/fsdviz/tests/stocking/test_get_or_create_cwt_sequence.py
 Created: 06 Aug 2020 10:55:40

 DESCRIPTION:

 The get_or_create_cwt_sequence() utility function is designed to
 retrieve a single cwt sequence object - if one does not exist, it
 will create it first.  Similarly, if an associated cwt does not
 exist, it will create too.  This function is used by views that
 create stocking event with associated cwts - edit stocking events and
 xls_uploads.

 A. Cottrill
=============================================================

"""

import pytest

from ...common.models import CWT, CWTsequence

from ..factories.common_factories import CWTFactory, CWTsequenceFactory


from ...stocking.utils import get_or_create_cwt_sequence


@pytest.mark.django_db
def test_create_cwt():
    """If we specify a cwt number that does exist year, a new cwt and
    cwt_series should be created and should match the specifed arguments.

    """

    assert CWT.objects.count() == 0
    assert CWTsequence.objects.count() == 0

    cwt_number = "123456"
    cwt_series = get_or_create_cwt_sequence(cwt_number)

    assert cwt_series.cwt.cwt_number == cwt_number

    assert CWT.objects.count() == 1
    assert CWTsequence.objects.count() == 1


@pytest.mark.django_db
def test_create_cwt_sequence_existing_cwt():
    """If we speficy an existing cwt, that does not have an associated
    cwt_sequence, one should be created.

    """

    # create a cwt using oru factory:
    cwt_number = "123456"
    cwt = CWTFactory(cwt_number=cwt_number)

    assert cwt.cwt_number == cwt_number

    assert CWT.objects.count() == 1
    assert CWTsequence.objects.count() == 0

    cwt_series = get_or_create_cwt_sequence(cwt_number)

    assert cwt_series.cwt.cwt_number == cwt_number

    assert CWT.objects.count() == 1
    assert CWTsequence.objects.count() == 1


@pytest.mark.django_db
def test_retrieve_existing_cwt_sequence_cwt():
    """if we specify an exsiting cwt number for a cwt that already has an
    associated cwt_sequence, - we should get back the existing
    cwt_sequence

    """

    # create a cwt using oru factory:
    cwt_number = "123456"
    cwt = CWTFactory(cwt_number=cwt_number)
    cwt_sequence = CWTsequenceFactory(cwt=cwt)

    assert cwt.cwt_number == cwt_number

    assert CWT.objects.count() == 1
    assert CWTsequence.objects.count() == 1

    cwt_series = get_or_create_cwt_sequence(cwt_number)

    assert cwt_series == cwt_sequence

    assert cwt_series.cwt.cwt_number == cwt_number

    assert CWT.objects.count() == 1
    assert CWTsequence.objects.count() == 1


@pytest.mark.django_db
def test_sequential_tag_type():
    """If the speficied tag_type is cwt (rather than sequential), the
    sequence start and end arguments are ignored, and the defaul
    values (1) are used instead.

    """
    cwt_number = "123456"
    start = 100
    end = 1000

    cwt_series = get_or_create_cwt_sequence(
        cwt_number, tag_type="sequential", sequence=(start, end)
    )

    assert cwt_series.cwt.cwt_number == cwt_number
    assert cwt_series.sequence.lower == start
    assert cwt_series.sequence.upper == end


@pytest.mark.django_db
def test_seq_start_and_end_ignored_with_cwt_tag_type():
    """If the speficied tag_type is cwt (rather than sequential), the
    sequence start and end arguments are ignored, and the default
    values (0,0) e used instead.

    """
    cwt_number = "123456"

    cwt_series = get_or_create_cwt_sequence(
        cwt_number, tag_type="cwt", sequence=(100, 900)
    )

    assert cwt_series.cwt.cwt_number == cwt_number
    assert cwt_series.sequence.lower == 0
    assert cwt_series.sequence.upper == 1


@pytest.mark.django_db
def test_new_tag_maker_cwt():
    """If we specify a cwt number that matches an existing cwt, but using
    a differnt maker, we should get back a new cwt_sequence object
    that is associcated with a new cwt.
    """
    cwt_number = "123456"
    nmt_cwt = CWTFactory(cwt_number=cwt_number, manufacturer="nmt")

    cwt_series = get_or_create_cwt_sequence(cwt_number, manufacturer="mm")

    assert cwt_series.cwt.cwt_number == cwt_number
    assert cwt_series.cwt.manufacturer == "mm"
    assert cwt_series.cwt != nmt_cwt


@pytest.mark.django_db
def test_new_tag_type_cwt():
    """If we speficy a cwt number that matches an existing cwt, but using
    a differnt type of tag, we should get back a new cwt_sequence object
    that is associcated with a new cwt.

    """

    cwt_number = "123456"
    nmt_cwt = CWTFactory(cwt_number=cwt_number, tag_type="cwt")

    cwt_series = get_or_create_cwt_sequence(cwt_number, tag_type="sequential")

    assert cwt_series.cwt.cwt_number == cwt_number
    assert cwt_series.cwt.tag_type == "sequential"
    assert cwt_series.cwt != nmt_cwt


@pytest.mark.django_db
def test_new_sequence_range():
    """If we have an existing sequential cwt with an existing cwt_sequence
    and we specify a new sequence range - we should get a new cwt_sequence object.

    """
    cwt_number = "123456"
    start1 = 100
    end1 = 1000

    cwt = CWTFactory(cwt_number=cwt_number, tag_type="sequential")
    cwt_sequence0 = CWTsequenceFactory(cwt=cwt, sequence=(start1, end1))

    start2 = 1001
    end2 = 2000

    cwt_sequence = get_or_create_cwt_sequence(
        cwt_number, tag_type="sequential", sequence=(start2, end2)
    )

    # the cwt sequences have the same cwt:
    assert cwt_sequence.cwt == cwt
    # these are the attributes we passed in:
    assert cwt_sequence.sequence.lower == start2
    assert cwt_sequence.sequence.upper == end2

    # but are different cwt_sequence instances:
    assert cwt_sequence != cwt_sequence0


@pytest.mark.django_db
def test_overlapping_ranges():
    """If we try to create sequential cwts that have overlapping sequence
    ranges, the database will complain. We need to capture that error and
    handle it appropriately.

    """
    cwt_number = "123456"
    start1 = 100
    end1 = 1000

    cwt = CWTFactory(cwt_number=cwt_number, tag_type="sequential")
    cwt_sequence0 = CWTsequenceFactory(cwt=cwt, sequence=(start1, end1))

    start2 = 500
    end2 = 1500

    # this should throw and error and not create the cwt_series

    with pytest.raises(Exception) as execinfo:
        cwt_sequence = get_or_create_cwt_sequence(
            cwt_number, tag_type="sequential", sequence=(start2, end2)
        )

    errmsg = 'Sequence Range overlaps with "{}"'.format(str(cwt_sequence0))
    assert execinfo.value.args[0] == errmsg
    assert execinfo.typename == "ValidationError"

    assert cwt is not None
    assert cwt_sequence0 is not None
