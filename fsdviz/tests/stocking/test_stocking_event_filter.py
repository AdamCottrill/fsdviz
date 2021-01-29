"""All of the tests in this file are intended to verify that the
filters setup for stocking events work as expected. These filters are
used extensively throughout the application, including both the
templage and api views.

The stocking events fixture sets up a series of stocking events with
known attributes.  The tests verify that expected records are returned
by each of the filters.


The order of the tests below closely reflects the order of the filter
attributes specified in ~/stocking/filters.py.

"""

import pytest

from django.contrib.gis.geos import GEOSGeometry


from ...common.models import Strain
from ...stocking.filters import StockingEventFilter
from ...stocking.models import StockingEvent

from .fixtures import stocking_events


@pytest.mark.usefixtures("stocking_events")
class TestStockingEventFilter:
    """"""

    # =====================================
    #       LAKE

    @pytest.mark.django_db
    def test_one_lake_filter(self):
        """If we filter for a single lake, we should get only those events
        associated with that lake"""
        events = StockingEvent.objects.select_related("jurisdiction__lake").all()
        filter = {"lake": "HU"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2
        lakes = list(set([x.lake.abbrev for x in qs]))
        assert lakes == ["HU"]

    @pytest.mark.django_db
    def test_multiple_lakes_filter(self):
        """If we filter for a several lakes, we should get all of the
        events associated with those lakes, but none that are not.
        """

        events = StockingEvent.objects.select_related("jurisdiction__lake").all()
        filter = {"lake": "HU,ER"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 4

        lakes = list(set([x.lake.abbrev for x in qs]))
        assert "HU" in lakes
        assert "ER" in lakes
        assert "SU" not in lakes

    # =====================================
    #       AGENCY

    @pytest.mark.django_db
    def test_one_agency_filter(self):
        """If we filter for a single agency, we should get only those events
        associated with that agency
        """
        events = StockingEvent.objects.select_related("agency").all()
        filter = {"agency": "MNRF"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.agency.abbrev for x in qs]))

        assert "MNRF" in values
        excludes = ["MDNR", "ODNR"]
        for val in excludes:
            assert val not in values

    @pytest.mark.django_db
    def test_multiple_agency_filter(self):
        """If we filter for a several agencies, we should get all of the
        events associated with those agencies, but none that are not.
        """

        events = StockingEvent.objects.select_related("agency").all()
        filter = {"agency": "ODNR,MDNR"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.agency.abbrev for x in qs]))
        expected = ["MDNR", "ODNR"]
        for val in expected:
            assert val in values

        assert "MNRF" not in values

    # =====================================
    #       STATE-PROVINCE

    @pytest.mark.django_db
    def test_one_stateprovince_filter(self):
        """If we filter for a single state_prov, we should get only those events
        associated with that stat_prov"""

        events = StockingEvent.objects.select_related("jurisdiction__stateprov").all()
        filter = {"stateprov": "ON"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.jurisdiction.stateprov.abbrev for x in qs]))
        assert "ON" in values
        assert "OH" not in values
        assert "MI" not in values

    @pytest.mark.django_db
    def test_multiple_stateprovince_filter(self):
        """If we filter for a several stateprovinces, we should get all of the
        events associated with those stateprovinces, but none that are not.
        """

        events = StockingEvent.objects.select_related("jurisdiction__stateprov").all()
        filter = {"stateprov": "MI,OH"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.jurisdiction.stateprov.abbrev for x in qs]))
        assert "OH" in values
        assert "MI" in values
        assert "ON" not in values

    # =====================================
    #       JURISDICTION

    @pytest.mark.django_db
    def test_one_jurisdiction_filter(self):
        """If we filter for a single lake-province (jurisdiction), we should
        get only those events associated with that jurisdiction.

        """

        events = StockingEvent.objects.select_related("jurisdiction").all()
        filter = {"jurisdiction": "hu_on"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 1

        values = list(set([x.jurisdiction.slug for x in qs]))

        assert "hu_on" in values
        excludes = ["hu_mi", "er_mi", "er_oh"]
        for val in excludes:
            assert val not in values

    @pytest.mark.django_db
    def test_multiple_jurisdiction_filter(self):
        """If we filter for a several jurisdictions, we should get all of the
        events associated with those jurisdictions, but none that are not.
        """

        events = StockingEvent.objects.select_related("jurisdiction").all()
        filter = {"jurisdiction": "hu_on, er_oh"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.jurisdiction.slug for x in qs]))

        for val in values:
            assert val in values

        excludes = ["hu_mi", "er_mi"]
        for val in excludes:
            assert val not in values

    # =====================================
    #       STOCKING YEAR

    @pytest.mark.django_db
    def test_stocking_year_exact_filter(self):
        """The stocking event filter accepts an exact year - if we filter for
        a single year, only events in that year should be returned."""
        events = StockingEvent.objects.all()
        filter = {"year": "2010"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.year for x in qs]))
        assert 2010 in values

        excludes = [2008, 2012]
        for val in excludes:
            assert val not in values

    @pytest.mark.django_db
    def test_stocking_first_year_filter(self):
        """The stocking event filter accepts a first year - if we filter for
        a first year, only events in and after that year should be returned."""

        events = StockingEvent.objects.all()
        filter = {"first_year": "2010"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 3

        values = list(set([x.year for x in qs]))
        expected = [2010, 2012]
        for val in expected:
            assert val in values

        assert 2008 not in values

    @pytest.mark.django_db
    def test_stocking_last_year_filter(self):
        """The stocking event filter accepts a last year - if we filter for
        a last year, only events in and before that year should be returned."""

        events = StockingEvent.objects.all()
        filter = {"last_year": "2010"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 3

        values = list(set([x.year for x in qs]))
        expected = [2008, 2010]
        for val in expected:
            assert val in values

        assert 2002 not in values

    @pytest.mark.django_db
    def test_stocking_first_and_last_year_filter(self):
        """The stocking event filter accepts both a first and last year - if
        we filter for both first and last year, only events between
        those years should be returned.

        """

        events = StockingEvent.objects.all()
        filter = {"first_year": "2009", "last_year": "2011"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.year for x in qs]))
        assert 2010 in values

        excludes = [2008, 2012]
        for val in excludes:
            assert val not in values

    # =====================================
    #       YEAR CLASS

    @pytest.mark.django_db
    def test_one_year_class_filter(self):
        """If we filter for a single year class, we should get only those events
        associated with that year_class.
        """

        expected = ["1111", "2222"]
        excludes = ["3333", "4444"]

        events = StockingEvent.objects.all()
        filter = {"year_class": "2009"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == len(expected)

        values = list(set([x.stock_id for x in qs]))
        for val in expected:
            assert val in values

        for val in excludes:
            assert val not in values

    @pytest.mark.django_db
    def test_multiple_year_class_filter(self):
        """If we filter for a more than one year class, we should get only those events
        associated with those year_classes.
        """

        expected = ["3333", "4444"]
        excludes = ["1111", "2222"]

        events = StockingEvent.objects.all()
        filter = {"year_class": "2008,2011"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == len(expected)

        values = list(set([x.stock_id for x in qs]))
        for val in expected:
            assert val in values

        for val in excludes:
            assert val not in values

    # =====================================
    #       STOCKING MONTH

    @pytest.mark.django_db
    def test_one_stocking_month_filter(self):
        """If we filter for a single month, we should get only those events
        associated with that month.
        """
        events = StockingEvent.objects.all()
        filter = {"stocking_month": "6"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 1

        values = list(set([x.month for x in qs]))
        assert 6 in values

        excludes = [4, 8]
        for val in excludes:
            assert val not in values

    @pytest.mark.django_db
    def test_null_stocking_month_filter(self):
        """99 is used to filter for stocking events that do not have a
        stocking month.

        """
        events = StockingEvent.objects.all()
        filter = {"stocking_month": "99"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 1

        assert qs[0].stock_id == "2222"

    @pytest.mark.django_db
    def test_stocking_month_or_null_filter(self):
        """99 is used to filter for stocking events that do not have a
        stocking month. It should work in combination with other
        months too. In this case month is June or unknown.

        """
        events = StockingEvent.objects.all()
        filter = {"stocking_month": "6,99"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.stock_id for x in qs]))

        expected = ["2222", "3333"]
        for val in expected:
            assert val in values

    @pytest.mark.django_db
    def test_multiple_stocking_month_filter(self):
        """If we filter for a several months, we should get all of the
        events associated with those months, but none that are not.

        """

        events = StockingEvent.objects.all()
        filter = {"stocking_month": "4,8"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.month for x in qs]))
        expected = [4, 8]
        for val in expected:
            assert val in values

        assert 6 not in values

    # =====================================
    #          SPECIES

    @pytest.mark.django_db
    def test_one_species_abbrev_filter(self):
        """If we filter for a single species abbreviation, we should get only
        those events associated with that species
        """

        events = StockingEvent.objects.select_related("species").all()
        filter = {"species": "LAT"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.species.abbrev for x in qs]))
        assert "LAT" in values

        excluded = ["RBT", "COS"]
        for val in excluded:
            assert val not in values

    @pytest.mark.django_db
    def test_multiple_species_abbrev_filter(self):
        """If we filter for a several species, we should get all of the
        events associated with those species, but none that are not.
        """

        events = StockingEvent.objects.select_related("species").all()
        filter = {"species": "RBT,COS"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.species.abbrev for x in qs]))

        expected = ["RBT", "COS"]
        for val in expected:
            assert val in values

        assert "LAT" not in values

    # =====================================
    #            STRAIN

    @pytest.mark.django_db
    def test_one_strain_name_filter(self):
        """If we filter for a single strain using the strain name, we should
        get only those events associated with that strain, none of the
        others.

        """
        events = StockingEvent.objects.select_related("species").all()
        filter = {"strain_name": "BS"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.species.abbrev for x in qs]))
        assert "LAT" in values

        excluded = ["RBT", "COS"]
        for val in excluded:
            assert val not in values

    @pytest.mark.django_db
    def test_multiple_strain_names_filter(self):
        """If we filter for a multiple strains using the strain names, we
        should get only those events associated with those strains,
        none of the others.
        """

        events = StockingEvent.objects.select_related("species").all()
        filter = {"strain_name": "GAN,WILD"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.species.abbrev for x in qs]))
        expected = ["RBT", "COS"]
        for val in expected:
            assert val in values

        assert "LAT" not in values

    @pytest.mark.django_db
    def test_one_strain_id_filter(self):
        """If we filter for a single strain using the strain id, we should
        get only those events associated with that strain, none of the
        others."""

        events = StockingEvent.objects.select_related("species").all()
        # get the current id of the lake trout strain
        id = (
            Strain.objects.filter(species__abbrev="LAT")
            .values_list("pk", flat=True)
            .first()
        )
        filter = {"strain": str(id)}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.species.abbrev for x in qs]))
        assert "LAT" in values

        excluded = ["RBT", "COS"]
        for val in excluded:
            assert val not in values

    @pytest.mark.django_db
    def test_multiple_strain_id_filter(self):
        """If we filter for a multiple strains using the strain ids, we
        should get only those events associated with those strains,
        none of the others."""

        events = StockingEvent.objects.select_related("species").all()
        # get the current id of the strain associated with RBT and COS
        ids = Strain.objects.filter(species__abbrev__in=["COS", "RBT"]).values_list(
            "pk", flat=True
        )
        filter = {"strain": ",".join([str(x) for x in ids])}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.species.abbrev for x in qs]))
        expected = ["RBT", "COS"]
        for val in expected:
            assert val in values

        assert "LAT" not in values

    # # =====================================
    # #            MARK and MARK_LIKE

    # @pytest.mark.xfail
    # @pytest.mark.django_db
    # def test_mark_filter(self):
    #     """If we filter for a single mark, we should get only those events
    #     associated with that mark, none of the others.

    #     Mark is now obsolete and has been replaced by finclips and physchem_mark

    #     """
    #     events = StockingEvent.objects.all()

    #     filter = {"mark": "LP"}
    #     qs = StockingEventFilter(filter, events).qs
    #     assert len(qs) == 1

    #     values = list(set([x.mark for x in qs]))
    #     assert "LP" in values

    #     excluded = ["RV", "RP", "LPRV"]
    #     for val in excluded:
    #         assert val not in values

    # @pytest.mark.xfail
    # @pytest.mark.django_db
    # def test_multiple_mark_filters(self):
    #     """If we filter for a multiple marks, we should get only those events
    #     associated with those marks, none of the others.

    #     Mark is now obsolete and has been replaced by finclips and physchem_mark

    #     """

    #     events = StockingEvent.objects.all()
    #     filter = {"mark": "LP,RP"}
    #     qs = StockingEventFilter(filter, events).qs
    #     assert len(qs) == 2

    #     values = list(set([x.mark for x in qs]))
    #     expected = ["LP", "RP"]
    #     for val in expected:
    #         assert val in values

    #     excluded = ["RV", "LPRV"]
    #     for val in excluded:
    #         assert val not in values

    # @pytest.mark.xfail
    # @pytest.mark.django_db
    # def test_mark_like_filter(self):
    #     """The mark filter also has a like function - if specifiy a pattern,
    #     we should get the stocking events that have marks that match the
    #     pattern, and none of those that do not.

    #     Mark is now obsolete and has been replaced by finclips and physchem_mark
    #     """

    #     events = StockingEvent.objects.all()
    #     filter = {"mark_like": "LP"}
    #     qs = StockingEventFilter(filter, events).qs
    #     assert len(qs) == 2

    #     values = list(set([x.mark for x in qs]))
    #     expected = ["LP", "LPRV"]
    #     for val in expected:
    #         assert val in values

    #     excluded = ["RV", "RP"]
    #     for val in excluded:
    #         assert val not in values

    # =====================================
    #        STOCKING METHOD
    @pytest.mark.django_db
    def test_stocking_method_filter(self):
        """If we filter for a stocking method, we should get only those events
        associated with that stocking method."""

        events = StockingEvent.objects.select_related("stocking_method").all()
        filter = {"stocking_method": "b"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.stocking_method.stk_meth for x in qs]))
        assert "b" in values
        excluded = ["p", "t"]
        for val in excluded:
            assert val not in values

    @pytest.mark.django_db
    def test_multiple_stocking_method_filters(self):
        """If we filter for a multiple stocking methods, we
        should get only those events associated with those stocking methods,
        none of the others."""

        events = StockingEvent.objects.select_related("stocking_method").all()
        filter = {"stocking_method": "t,p"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.stocking_method.stk_meth for x in qs]))
        expected = ["p", "t"]
        for val in expected:
            assert val in values

        assert "b" not in values

    # =====================================
    #            LIFESTAGE
    @pytest.mark.django_db
    def test_one_lifestage_filter(self):
        """If we filter for a lifestage, we should get only those events
        associated with that lifestage.

        """
        events = StockingEvent.objects.select_related("lifestage").all()
        filter = {"lifestage": "y"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.lifestage.abbrev for x in qs]))
        assert "y" in values
        excluded = ["f", "fry"]
        for val in excluded:
            assert val not in values

    @pytest.mark.django_db
    def test_multiple_lifestage_filters(self):
        """If we filter for a multiple lifestages, we
        should get only those events associated with those lifestages,
        none of the others."""

        events = StockingEvent.objects.select_related("lifestage").all()
        filter = {"lifestage": "f,fry"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.lifestage.abbrev for x in qs]))
        expected = ["f", "fry"]
        for val in expected:
            assert val in values

        assert "y" not in values

    # =====================================
    #            CLIP_CODE
    def test_one_clip_code_filter(self):
        """The code clip filter is for composite fin clips that represent the
        combination of fin clips applied to a lot of fish. Clip code
        could consist of a single fin clip (LP) or may be made up of
        several fin clips concatenated together (in ascii-sort order
        for consistency) 'AD', "LP", and ADLP" are all valid, distinct
        clip codes. If a single clip code is passed in, only those
        event that match that clip code should be returned.

        'LP' - returns only events with clipcode 'LP' - not ADLP or LPRV.

        """

        events = StockingEvent.objects.all()
        filter = {"clip_code": "LP"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 1

        values = list(set([x.stock_id for x in qs]))

        expected = ["1111"]
        for val in expected:
            assert val in values

        excludes = ["2222", "3333", "4444"]
        for val in excludes:
            assert val not in values

    def test_multiple_clip_codes_filter(self):
        """If multiple clipcodes are passed in, only those events with one of
        the exact clipcodes will be returned.  "LP, RV" will return
        events with either "LP" or "RV" clips, but not events with
        clips 'LPRV', "ADLP" or "ADRV"

        """

        events = StockingEvent.objects.all()
        filter = {"clip_code": "LP, LPRV"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.stock_id for x in qs]))

        expected = ["1111", "3333"]
        for val in expected:
            assert val in values

        excludes = ["2222", "4444"]
        for val in excludes:
            assert val not in values

            # =====================================

    #            FINCLIPS
    def test_one_finclip_filter(self):
        """The fin clip filter is for individual fin clips - LV or LP, not
        LVLP (which is a clip code).  If a single finclip is specified,
        all of the events that include that fin clip should be returned -
        LP should return LP, LPRV, and LPAD but NOT LVRP or AD.

        """

        events = StockingEvent.objects.all()
        filter = {"finclips": "LP"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.stock_id for x in qs]))

        expected = ["1111", "3333"]
        for val in expected:
            assert val in values

        excludes = ["2222", "4444"]
        for val in excludes:
            assert val not in values

    def test_multiple_finclips_filter(self):
        """ ""The fin clip filter is for individual fin clips - LV or LP, not
        LVLP (which is a clip code).  If a multiple finclips are provided
        all of the events that include those fin clip should be returned -
        LP,LV should return LP, LPRV, and LPAD but NOT RV, RPAD or AD."""

        events = StockingEvent.objects.all()
        filter = {"finclips": "LP,RV"}
        qs = StockingEventFilter(filter, events).qs.distinct()
        assert len(qs) == 3

        values = list(set([x.stock_id for x in qs]))

        expected = ["1111", "3333", "4444"]
        for val in expected:
            assert val in values

        # event 2222 has LV clipL
        excludes = ["2222"]
        for val in excludes:
            assert val not in values

    # =====================================
    #            PHYSICAL_CHEM_MARKS

    def test_one_physchem_mark_filter(self):
        """If one physical mark is specified, only those events asssoicated
        with that mark should be returned"""

        events = StockingEvent.objects.all()
        filter = {"physchem_marks": "OX"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.stock_id for x in qs]))

        expected = ["1111", "4444"]
        for val in expected:
            assert val in values

        excludes = ["2222", "3333"]
        for val in excludes:
            assert val not in values

    def test_physchem_multiple_marks_filter(self):
        """If more than one physical mark is specified, only those events asssoicated
        with one of the marks should be returned"""

        events = StockingEvent.objects.all()
        filter = {"physchem_marks": "OX,BR"}
        qs = StockingEventFilter(filter, events).qs.distinct()
        assert len(qs) == 3

        values = list(set([x.stock_id for x in qs]))

        expected = ["1111", "2222", "4444"]
        for val in expected:
            assert val in values

        excludes = ["3333"]
        for val in excludes:
            assert val not in values

        # =====================================
        #            FISHTAGS

    def test_one_fish_tag_filter(self):
        """if a single tag code is provided, only stocking events associated
        with that tag code should be returned"""

        events = StockingEvent.objects.all()
        filter = {"fishtags": "FTR"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 1

        values = list(set([x.stock_id for x in qs]))

        assert "2222" in values
        excludes = ["1111", "3333", "4444"]
        for val in excludes:
            assert val not in values

    def test_multiple_fish_tags_filter(self):
        """if a multiple tag codes are provided, only stocking events that
        have at least one of those tags shold be returned (tag codes are
        join with an 'OR').

        """

        events = StockingEvent.objects.all()
        filter = {"fishtags": "CWT,FTR"}
        qs = StockingEventFilter(filter, events).qs.distinct()
        assert len(qs) == 3

        values = list(set([x.stock_id for x in qs]))

        assert "1111" not in values
        expected = ["2222", "3333", "4444"]
        for val in expected:
            assert val in values

    # =====================================
    #            HATCHERY

    def test_one_hatchery_filter(self):
        """If a hatchery abbreviation is passed to the hatchery filter, only
        stocking events from that hatchery should be included."""

        events = StockingEvent.objects.select_related("hatchery").all()
        filter = {"hatchery": "mnrfA"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 1

        values = list(set([x.hatchery.abbrev for x in qs]))

        assert "mnrfA" in values
        excludes = ["mnrfB", "mdnrA", "odnrA"]
        for val in excludes:
            assert val not in values

    def test_multiple_hatcheries_filter(self):
        """If more than one hatchery abbreviation is passed to the hatchery
        filter, events from those hatcheries should be included.  Events
        from other hatcheries should not be included.

        """

        events = StockingEvent.objects.select_related("hatchery").all()
        filter = {"hatchery": "mdnrA,odnrA"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.hatchery.abbrev for x in qs]))

        expected = ["mdnrA", "odnrA"]
        for val in expected:
            assert val in values

        excludes = ["mnrfA", "mnrfB"]
        for val in excludes:
            assert val not in values

    # =====================================
    #            REGION OF INTEREST

    @pytest.mark.django_db
    def test_roi_filter(self):
        """The roi filter should only return stocking events that occured
        within the roi and not any that occured elsewhere

        """
        # create a polygon that encompasses our first point (but not the second)
        # "POINT(-82.0 44.0)"
        wkt = (
            "POLYGON((-81.5 43.5,"
            + "-82.5 43.5,"
            + "-82.5 44.5,"
            + "-81.5 44.5,"
            + "-81.5 43.5))"
        )

        roi = GEOSGeometry(wkt.replace("\n", ""), srid=4326)

        events = StockingEvent.objects.all()

        [print(x.stock_id, x.geom.wkt) for x in events]

        filter = {"roi": roi.wkt}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.stock_id for x in qs]))
        expected = ["1111", "2222"]
        for val in expected:
            assert val in values

        excluded = ["3333", "4444"]
        for val in excluded:
            assert val not in values
