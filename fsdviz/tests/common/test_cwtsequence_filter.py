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

from ..common_factories import (
    LakeFactory,
    AgencyFactory,
    JurisdictionFactory,
    StateProvinceFactory,
    SpeciesFactory,
    StrainFactory,
    StrainRawFactory,
    CWTFactory,
    CWTsequenceFactory,
    PhysChemMarkFactory,
    FinClipFactory,
    FishTagFactory,
)
from ..stocking_factories import (
    LifeStageFactory,
    StockingMethodFactory,
    StockingEventFactory,
    HatcheryFactory,
)


from ...common.filters import CWTSequenceFilter
from ...common.models import Strain, CWTsequence


@pytest.fixture()
def stocking_events(db):

    huron = LakeFactory(abbrev="HU", lake_name="Huron")
    superior = LakeFactory(abbrev="SU", lake_name="Superior")
    erie = LakeFactory(abbrev="ER", lake_name="Erie")

    mnrf = AgencyFactory(abbrev="MNRF")
    mdnr = AgencyFactory(abbrev="MDNR")
    odnr = AgencyFactory(abbrev="ODNR")

    mnrf_hatcheryA = HatcheryFactory(
        abbrev="mnrfA", hatchery_name="Ontario A", agency=mnrf
    )
    mnrf_hatcheryB = HatcheryFactory(
        abbrev="mnrfB", hatchery_name="Ontario B", agency=mnrf
    )
    mdnr_hatchery = HatcheryFactory(
        abbrev="mdnrA", hatchery_name="Michigan Hatchery", agency=mdnr
    )
    odnr_hatchery = HatcheryFactory(
        abbrev="odnrA", hatchery_name="Ohio Hatchery", agency=odnr
    )

    ontario = StateProvinceFactory(abbrev="ON", name="Ontario")
    ohio = StateProvinceFactory(abbrev="OH", name="Ohio")
    michigan = StateProvinceFactory(abbrev="MI", name="Michigan")

    mi_hu = JurisdictionFactory(lake=huron, stateprov=michigan)
    on_hu = JurisdictionFactory(lake=huron, stateprov=ontario)
    on_su = JurisdictionFactory(lake=superior, stateprov=ontario)

    oh_er = JurisdictionFactory(lake=erie, stateprov=ohio)
    on_er = JurisdictionFactory(lake=erie, stateprov=ontario)

    lat = SpeciesFactory(abbrev="LAT", common_name="Lake Trout")
    cos = SpeciesFactory(abbrev="COS", common_name="Coho Salmon")
    rbt = SpeciesFactory(abbrev="RBT", common_name="Rainbow Trout")

    lat_strain1 = StrainFactory(
        strain_code="BS", strain_label="Big Sound", strain_species=lat
    )

    rbt_strain = StrainFactory(
        strain_code="GAN", strain_label="Ganaraska", strain_species=rbt
    )

    cos_strain = StrainFactory(
        strain_code="WILD", strain_label="Wild", strain_species=cos
    )

    raw_cos = StrainRawFactory(species=cos, strain=cos_strain, raw_strain="COS-1")
    raw_rbt = StrainRawFactory(species=rbt, strain=rbt_strain, raw_strain="RBT-1")

    raw_lat1 = StrainRawFactory(species=lat, strain=lat_strain1, raw_strain="BS-1")

    fry = LifeStageFactory(abbrev="fry", description="fry")
    fingerlings = LifeStageFactory(abbrev="f", description="fingerlings")
    yearlings = LifeStageFactory(abbrev="y", description="yearlings")

    boat = StockingMethodFactory(stk_meth="b", description="boat")
    truck = StockingMethodFactory(stk_meth="t", description="truck")
    plane = StockingMethodFactory(stk_meth="p", description="plane")

    ox_mark = PhysChemMarkFactory(mark_code="OX")
    ca_mark = PhysChemMarkFactory(mark_code="CA")

    floy_tag = FishTagFactory(
        tag_code="FTR", tag_type="Floy", description="Red Floy Tag"
    )

    jaw_tag = FishTagFactory(tag_code="JAW", tag_type="Jaw", description="Jaw Tag")

    rp_clip = FinClipFactory.create(abbrev="RP", description="right pect")
    lp_clip = FinClipFactory.create(abbrev="LP", description="left pect")
    rv_clip = FinClipFactory.create(abbrev="RV", description="right ventral")

    # pt1 is in our ROI, pt2 is outside
    pt1 = GEOSGeometry("POINT(-82.0 44.0)", srid=4326)
    pt2 = GEOSGeometry("POINT(-81.0 46.0)", srid=4326)

    cwt1 = CWTFactory(cwt_number="111111")
    cwtseq1 = CWTsequenceFactory(cwt=cwt1)

    event1 = StockingEventFactory(
        stock_id="1111",
        jurisdiction=on_hu,
        agency=mnrf,
        year=2010,
        month=4,
        day=15,
        species=lat,
        strain_raw=raw_lat1,
        lifestage=yearlings,
        stocking_method=plane,
        hatchery=mnrf_hatcheryA,
        dd_lon=pt1.x,
        dd_lat=pt1.y,
    )
    cwtseq1.events.add(event1)
    cwtseq1.save()

    event1.fish_tags.add(floy_tag)
    event1.physchem_marks.add(ox_mark)
    event1.fin_clips.add(rp_clip)
    event1.save()

    cwt2 = CWTFactory(cwt_number="222222")
    cwtseq2 = CWTsequenceFactory(cwt=cwt2)

    event2 = StockingEventFactory(
        stock_id="2222",
        jurisdiction=mi_hu,
        agency=mdnr,
        year=2010,
        month=6,
        day=15,
        species=cos,
        strain_raw=raw_cos,
        lifestage=fingerlings,
        stocking_method=boat,
        hatchery=mdnr_hatchery,
        dd_lon=pt1.x,
        dd_lat=pt1.y,
    )

    cwtseq2.events.add(event2)
    cwtseq2.save()

    event2.fish_tags.add(floy_tag)
    event2.physchem_marks.add(ox_mark)
    event2.fin_clips.add(rp_clip)
    event2.save()

    cwt3 = CWTFactory(cwt_number="333333")
    cwtseq3 = CWTsequenceFactory(cwt=cwt3)

    event3 = StockingEventFactory(
        stock_id="3333",
        jurisdiction=on_er,
        agency=mnrf,
        year=2012,
        month=None,
        day=None,
        species=lat,
        strain_raw=raw_lat1,
        lifestage=yearlings,
        stocking_method=boat,
        hatchery=mnrf_hatcheryB,
        dd_lon=pt1.x,
        dd_lat=pt1.y,
    )

    cwtseq3.events.add(event3)
    cwtseq3.save()

    event3.fish_tags.add(floy_tag)
    event3.physchem_marks.add(ca_mark)
    event3.fin_clips.add(lp_clip, rp_clip)
    event3.save()

    cwt4 = CWTFactory(cwt_number="444444")
    cwtseq4 = CWTsequenceFactory(cwt=cwt4)

    event4 = StockingEventFactory(
        stock_id="4444",
        jurisdiction=oh_er,
        agency=odnr,
        year=2008,
        month=8,
        day=15,
        species=rbt,
        strain_raw=raw_rbt,
        lifestage=fry,
        stocking_method=truck,
        hatchery=odnr_hatchery,
        dd_lon=pt2.x,
        dd_lat=pt2.y,
    )

    cwtseq4.events.add(event4)
    cwtseq4.save()

    event4.fish_tags.add(jaw_tag)
    event4.physchem_marks.add(ca_mark)
    event4.fin_clips.add(lp_clip, rv_clip)
    event4.save()

    # lake trout stocked in Lake Superior
    cwt5 = CWTFactory(cwt_number="551111", manufacturer="mm")
    cwtseq5 = CWTsequenceFactory(cwt=cwt5)

    event5 = StockingEventFactory(
        stock_id="5555",
        jurisdiction=on_su,
        agency=mnrf,
        year=2050,
        month=6,
        day=15,
        species=lat,
        strain_raw=raw_lat1,
        lifestage=yearlings,
        stocking_method=plane,
        hatchery=mnrf_hatcheryB,
        dd_lon=pt2.x,
        dd_lat=pt2.y,
    )
    cwtseq5.events.add(event5)
    cwtseq5.save()

    # no marks, clips only.
    event5.fin_clips.add(rp_clip, rv_clip)
    event5.save()

    # rainbow trout stocked in Lake Superior
    cwt6 = CWTFactory(cwt_number="111166", tag_type="sequential")
    cwtseq6 = CWTsequenceFactory(cwt=cwt6)

    # no marks or clips
    event6 = StockingEventFactory(
        stock_id="6666",
        jurisdiction=on_su,
        agency=mnrf,
        year=2008,
        month=8,
        day=15,
        species=rbt,
        strain_raw=raw_rbt,
        lifestage=fry,
        stocking_method=truck,
        hatchery=mnrf_hatcheryB,
        dd_lon=pt2.x,
        dd_lat=pt2.y,
    )

    cwtseq6.events.add(event6)
    cwtseq6.save()


@pytest.mark.usefixtures("stocking_events")
class TestCWTSequenceFilter:
    """"""

    # here is the list of parameter sets we will pass to our test. The
    # filter to be applied, the expected cwt numbers, cwt numbers that
    # should not be included, and optionally, a prefetch_related string.

    parameters = [
        (
            {"cwt_number_like": "1111"},
            ["111111", "551111", "111166"],
            ["222222", "333333", "444444"],
            None,
        ),
        (
            {"cwt_number": "551111"},
            [
                "551111",
            ],
            ["111111", "222222", "333333", "444444", "111166"],
            None,
        ),
        (
            {"cwt_number": "551111,111166"},
            ["551111", "111166"],
            ["111111", "222222", "333333", "444444"],
            None,
        ),
        (
            {"tag_type": "sequential"},
            ["111166"],
            ["111111", "551111", "222222", "333333", "444444"],
            None,
        ),
        (
            {"manufacturer": "mm"},
            ["551111"],
            ["111111", "111166", "222222", "333333", "444444"],
            None,
        ),
        (
            {"lake": "HU"},
            ["111111", "222222"],
            ["333333", "4444444", "551111", "111166"],
            "events__jurisdiction__lake",
        ),
        (
            {"lake": "HU,ER"},
            ["111111", "222222", "333333", "444444"],
            ["551111", "111166"],
            "events__jurisdiction__lake",
        ),
        (
            {"agency": "MNRF"},
            ["111111", "333333", "551111", "111166"],
            ["444444", "222222"],
            "events__agency",
        ),
        (
            {"agency": "ODNR,MDNR"},
            ["444444", "222222"],
            ["111111", "333333", "551111", "111166"],
            "events__agency",
        ),
        (
            {"stateprov": "ON"},
            ["111111", "333333", "551111", "111166"],
            ["222222", "444444"],
            "events__jurisdiction__stateprov",
        ),
        (
            {"stateprov": "MI,OH"},
            ["222222", "444444"],
            ["111111", "333333", "551111", "111166"],
            "events__jurisdiction__stateprov",
        ),
        (
            {"jurisdiction": "su_on"},
            ["551111", "111166"],
            ["111111", "333333", "222222", "444444"],
            "events__jurisdiction",
        ),
        (
            {"jurisdiction": "hu_on, er_oh"},
            ["111111", "444444"],
            ["551111", "333333", "222222", "111166"],
            "events__jurisdiction",
        ),
        (
            {"first_year": "2010"},
            ["111111", "222222", "333333", "551111"],
            ["444444", "111166"],
            "events",
        ),
        (
            {"last_year": "2010"},
            ["111111", "222222", "444444", "111166"],
            ["333333", "551111"],
            "events",
        ),
        (
            {"first_year": "2009", "last_year": "2011"},
            ["111111", "222222"],
            ["333333", "551111", "444444", "111166"],
            "events",
        ),
        (
            {"year": "2010"},
            ["111111", "222222"],
            ["333333", "444444", "551111", "111166"],
            "events",
        ),
        (
            {"stocking_month": "4"},
            [
                "111111",
            ],
            ["222222", "333333", "444444", "551111", "111166"],
            "events",
        ),
        (
            {"stocking_month": "99"},
            [
                "333333",
            ],
            ["111111", "222222", "444444", "551111", "111166"],
            "events",
        ),
        (
            {"stocking_month": "4,99"},
            ["111111", "333333"],
            ["222222", "444444", "551111", "111166"],
            "events",
        ),
        (
            {"stocking_month": "4,6"},
            ["111111", "222222", "551111"],
            ["333333", "444444", "111166"],
            "events",
        ),
        (
            {"species": "LAT"},
            ["111111", "333333", "551111"],
            ["222222", "444444", "111166"],
            "events__species",
        ),
        (
            {"species": "RBT,COS"},
            ["222222", "444444", "111166"],
            ["111111", "333333", "551111"],
            "events__species",
        ),
        (
            {"strain_name": "BS"},
            ["111111", "333333", "551111"],
            ["222222", "444444", "111166"],
            "events__species",
        ),
        (
            {"strain_name": "GAN,WILD"},
            ["222222", "444444", "111166"],
            ["111111", "333333", "551111"],
            "events__species",
        ),
        # strain_id
        (
            {"stocking_method": "b"},
            ["222222", "333333"],
            ["111111", "444444", "111166", "551111"],
            "events__stocking_method",
        ),
        (
            {"stocking_method": "p,t"},
            ["111111", "444444", "111166", "551111"],
            ["222222", "333333"],
            "events__stocking_method",
        ),
        (
            {"lifestage": "y"},
            ["111111", "333333", "551111"],
            ["222222", "444444", "111166"],
            "events__lifestage",
        ),
        (
            {"lifestage": "fry,f"},
            ["222222", "444444", "111166"],
            ["111111", "333333", "551111"],
            "events__lifestage",
        ),
        (
            {"fin_clips": "RP"},
            ["111111", "222222", "333333", "551111"],
            ["111166", "444444"],
            "events__fin_clips",
        ),
        (
            {"fin_clips": "RP,XX"},
            ["111111", "222222", "333333", "551111"],
            ["111166", "444444"],
            "events__fin_clips",
        ),
        (
            {"physchem_marks": "CA"},
            ["333333", "444444"],
            ["111111", "222222", "111166", "551111"],
            "events__physchem_marks",
        ),
        (
            {"physchem_marks": "CA,OX"},
            ["111111", "222222", "333333", "444444"],
            ["111166", "551111"],
            "events__physchem_marks",
        ),
        (
            {"clip_code": "RP"},
            ["111111", "222222"],
            ["333333", "444444", "111166", "551111"],
            "events",
        ),
        (
            {"clip_code": "RP,LPRV"},
            [
                "111111",
                "222222",
                "444444",
            ],
            ["333333", "111166", "551111"],
            "events",
        ),
        (
            {"fishtags": "FTR"},
            ["111111", "222222", "333333"],
            ["444444", "111166", "551111"],
            "events__fish_tags",
        ),
        (
            {"fishtags": "FTR,JAW"},
            ["111111", "222222", "333333", "444444"],
            ["111166", "551111"],
            "events__fish_tags",
        ),
        (
            {"hatchery": "mnrfB"},
            ["333333", "111166", "551111"],
            [
                "111111",
                "222222",
                "444444",
            ],
            "events__hatchery",
        ),
        (
            {"hatchery": "mnrfA,odnrA"},
            ["111111", "444444"],
            ["222222", "333333", "111166", "551111"],
            "events__hatchery",
        ),
        # roi
    ]

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
