"""All of the tests in this file are intended to verify that the
filters setup for cwts (cwt sequences actually) work as
expected. These filters are used extensively throughout the
application, including both the templage and api views.

The stocking items fixture sets up a series of stocking items with
known attributes, which are then assocaited with cwts.  The tests
verify that expected records are returned by each of the filters.

Tests are presented here is the same order as they are defined in
~/common/filters.py which closely follow the order associated with the
stocking event filter.

"""

import pytest


from django.contrib.gis.geos import GEOSGeometry

from ...common.filters import CWTSequenceFilter
from ...common.models import Strain, CWTsequence

from ..pytest_fixtures import cwt_parameters as parameters
from ..pytest_fixtures import cwt_stocking_events


@pytest.mark.usefixtures("cwt_stocking_events")
class TestCWTSequenceFilter:
    """"""

    @pytest.mark.django_db
    @pytest.mark.parametrize("filter, expected, excluded, prefetch", parameters)
    def test_cwt_sequence_filter(self, filter, expected, excluded, prefetch):
        """Verify that the the cwt sequence filters behave as expected. This
        test is parmeterized to accept a series of four element tuples - the
        filter to be applied, the excepted list of cwts numbers, a list of cwt
        numbers that should not be returned, and an optional string specifying
        a prefetch_related to pass to the queryset.

        """

        items = CWTsequence.objects.select_related("cwt")

        if prefetch:
            items = items.prefetch_related(prefetch)

        qs = CWTSequenceFilter(filter, items).qs
        values = list(set([x.cwt.cwt_number for x in qs]))

        assert len(qs) == len(expected)
        for val in expected:
            assert val in values
        for val in excluded:
            assert val not in values

    @pytest.mark.django_db
    def test_one_strain_id_filter(self):
        """If we filter for a single strain using the strain id, we should
        get only those items associated with that strain, none of the
        others."""

        expected = ["111111", "333333", "551111"]
        excluded = ["222222", "444444", "111166"]

        items = CWTsequence.objects.select_related("cwt").all()
        # get the current id of the lake trout strain
        id = (
            Strain.objects.filter(species__abbrev="LAT", strain_code="BS")
            .values_list("pk", flat=True)
            .first()
        )
        filter = {"strain": str(id)}
        qs = CWTSequenceFilter(filter, items).qs
        assert len(qs) == len(expected)

        values = list(set([x.cwt.cwt_number for x in qs]))

        assert len(qs) == len(expected)
        for val in expected:
            assert val in values
        for val in excluded:
            assert val not in values

    @pytest.mark.django_db
    def test_multiple_strain_id_filter(self):
        """If we filter for a multiple strains using the strain ids, we
        should get only those items associated with those strains,
        none of the others."""

        expected = ["222222", "444444", "111166"]
        excluded = ["111111", "333333", "551111"]

        items = CWTsequence.objects.all()
        # get the current id of the strain associated with RBT and COS
        ids = Strain.objects.filter(species__abbrev__in=["COS", "RBT"]).values_list(
            "pk", flat=True
        )
        filter = {"strain": ",".join([str(x) for x in ids])}
        qs = CWTSequenceFilter(filter, items).qs
        assert len(qs) == len(expected)

        values = list(set([x.cwt.cwt_number for x in qs]))

        assert len(qs) == len(expected)
        for val in expected:
            assert val in values
        for val in excluded:
            assert val not in values

    @pytest.mark.django_db
    def test_roi_filter(self):
        """The roi filter should only return cwts that are associated wth
        stocking events that occured within the roi and not any that
        occured elsewhere.

        """
        # create a polygon that encompasses our first point (but not the second)
        # "POINT(-82.0 44.0)"

        expected = ["111111", "222222", "333333"]
        excluded = ["444444", "551111", "111166"]

        wkt = (
            "POLYGON((-81.5 43.5,"
            + "-82.5 43.5,"
            + "-82.5 44.5,"
            + "-81.5 44.5,"
            + "-81.5 43.5))"
        )

        roi = GEOSGeometry(wkt.replace("\n", ""), srid=4326)

        filter = {"roi": roi.wkt}

        items = CWTsequence.objects.select_related("cwt")

        qs = CWTSequenceFilter(filter, items).qs
        values = list(set([x.cwt.cwt_number for x in qs]))

        assert len(values) == len(expected)

        assert len(qs) == len(expected)
        for val in expected:
            assert val in values
        for val in excluded:
            assert val not in values
