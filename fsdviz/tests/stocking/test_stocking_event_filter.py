"""All of the tests in this file are intended to verify that the
filters setup for stocking events work as expected. These filters are
used extensively throughout the application, including both the
templage and api views.

The stocking events fixture sets up a series of stocking events with
known attributes.  The tests verify that expected records are returned
by each of the filters.

"""

import pytest


from ..common_factories import (
    LakeFactory,
    AgencyFactory,
    JurisdictionFactory,
    StateProvinceFactory,
    SpeciesFactory,
    StrainFactory,
    StrainRawFactory,
)
from ..stocking_factories import (
    StockingEventFactory,
    LifeStageFactory,
    StockingMethodFactory,
)
from ...common.models import Strain
from ...stocking.filters import StockingEventFilter
from ...stocking.models import StockingEvent


@pytest.fixture()
def stocking_events(db):

    huron = LakeFactory(abbrev="HU", lake_name="Huron")
    superior = LakeFactory(abbrev="SU", lake_name="Superior")
    erie = LakeFactory(abbrev="ER", lake_name="Erie")

    mnrf = AgencyFactory(abbrev="MNRF")
    mdnr = AgencyFactory(abbrev="MDNR")
    odnr = AgencyFactory(abbrev="ODNR")

    ontario = StateProvinceFactory(abbrev="ON", name="Ontario")
    ohio = StateProvinceFactory(abbrev="OH", name="Ohio")
    michigan = StateProvinceFactory(abbrev="MI", name="Michigan")

    mi_hu = JurisdictionFactory(lake=huron, stateprov=michigan)
    on_hu = JurisdictionFactory(lake=huron, stateprov=ontario)

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

    StockingEventFactory(
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
        mark="LP",
    )
    StockingEventFactory(
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
        mark="RP",
    )
    StockingEventFactory(
        stock_id="3333",
        jurisdiction=on_er,
        agency=mnrf,
        year=2012,
        month=6,
        day=15,
        species=lat,
        strain_raw=raw_lat1,
        lifestage=yearlings,
        stocking_method=boat,
        mark="LPRV",
    )
    StockingEventFactory(
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
        mark="RV",
    )


@pytest.mark.usefixtures("stocking_events")
class TestStockingEventFilter:
    """
    """

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

    @pytest.mark.django_db
    def test_one_stocking_month_filter(self):
        """If we filter for a single month, we should get only those events
        associated with that month.
        """
        events = StockingEvent.objects.all()
        filter = {"months": "6"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.month for x in qs]))
        assert 6 in values

        excludes = [4, 8]
        for val in excludes:
            assert val not in values

    @pytest.mark.django_db
    def test_multiple_stocking_month_filter(self):
        """If we filter for a several months, we should get all of the
        events associated with those months, but none that are not.

        """

        events = StockingEvent.objects.all()
        filter = {"months": "4,8"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.month for x in qs]))
        expected = [4, 8]
        for val in expected:
            assert val in values

        assert 6 not in values

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

    @pytest.mark.django_db
    def test_mark_filter(self):
        """If we filter for a single mark, we should get only those events
        associated with that mark, none of the others.

        """
        events = StockingEvent.objects.all()
        filter = {"mark": "LP"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 1

        values = list(set([x.mark for x in qs]))
        assert "LP" in values

        excluded = ["RV", "RP", "LPRV"]
        for val in excluded:
            assert val not in values

    @pytest.mark.django_db
    def test_multiple_mark_filters(self):
        """If we filter for a multiple marks, we should get only those events
        associated with those marks, none of the others.

        """

        events = StockingEvent.objects.all()
        filter = {"mark": "LP,RP"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.mark for x in qs]))
        expected = ["LP", "RP"]
        for val in expected:
            assert val in values

        excluded = ["RV", "LPRV"]
        for val in excluded:
            assert val not in values

    @pytest.mark.django_db
    def test_mark_like_filter(self):
        """The mark filter also has a like function - if specifiy a pattern,
        we should get the stocking events that have marks that match the
        pattern, and none of those that do not.
        """

        events = StockingEvent.objects.all()
        filter = {"mark_like": "LP"}
        qs = StockingEventFilter(filter, events).qs
        assert len(qs) == 2

        values = list(set([x.mark for x in qs]))
        expected = ["LP", "LPRV"]
        for val in expected:
            assert val in values

        excluded = ["RV", "RP"]
        for val in excluded:
            assert val not in values
