"""A fixture that sets up our database with a number of stocking
events with different attributes.

Used by tests associated with stocking_event_filter to ensure that
they are returning the expected results.

"""


import pytest

from django.contrib.gis.geos import GEOSGeometry

from ..factories.common_factories import (
    LakeFactory,
    AgencyFactory,
    JurisdictionFactory,
    StateProvinceFactory,
    SpeciesFactory,
    StrainFactory,
    StrainAliasFactory,
    FishTagFactory,
    FinClipFactory,
    PhysChemMarkFactory,
)
from ..factories.stocking_factories import (
    StockingEventFactory,
    LifeStageFactory,
    StockingMethodFactory,
    HatcheryFactory,
)


@pytest.fixture()
def stocking_events(db):

    huron = LakeFactory(abbrev="HU", lake_name="Huron")
    LakeFactory(abbrev="SU", lake_name="Superior")
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

    cos_alias = StrainAliasFactory(species=cos, strain=cos_strain, strain_alias="COS-1")
    rbt_alias = StrainAliasFactory(species=rbt, strain=rbt_strain, strain_alias="RBT-1")

    lat1_alias = StrainAliasFactory(species=lat, strain=lat_strain1, strain_alias="BS-1")

    fry = LifeStageFactory(abbrev="fry", description="fry")
    fingerlings = LifeStageFactory(abbrev="f", description="fingerlings")
    yearlings = LifeStageFactory(abbrev="y", description="yearlings")

    boat = StockingMethodFactory(stk_meth="b", description="boat")
    truck = StockingMethodFactory(stk_meth="t", description="truck")
    plane = StockingMethodFactory(stk_meth="p", description="plane")

    pt1 = GEOSGeometry("POINT(-82.0 44.0)", srid=4326)
    pt2 = GEOSGeometry("POINT(-81.0 46.0)", srid=4326)

    cwt = FishTagFactory(tag_code="CWT", tag_type="CWT", description="coded wire tag")

    floy_tag = FishTagFactory(
        tag_code="FTR", tag_type="Floy", description="Red Floy Tag"
    )

    # Fin Clips
    rp = FinClipFactory.create(abbrev="RP", description="right pect.")
    lp = FinClipFactory.create(abbrev="LP", description="left pect.")
    rv = FinClipFactory.create(abbrev="RV", description="right ventral")

    # physchem_marks

    otc = PhysChemMarkFactory(
        mark_code="OX", mark_type="chemcial", description="oxytetracycline"
    )

    brand = PhysChemMarkFactory(
        mark_code="BR", mark_type="physical", description="branding general"
    )

    event1111 = StockingEventFactory(
        stock_id="1111",
        jurisdiction=on_hu,
        agency=mnrf,
        year=2010,
        month=4,
        day=15,
        year_class=2009,
        species=lat,
        strain_alias=lat1_alias,
        lifestage=yearlings,
        stocking_method=plane,
        mark="LP",
        dd_lon=pt1.x,
        dd_lat=pt1.y,
        geom=pt1,
        agency_stock_id='foo-bar-baz',
        hatchery=mnrf_hatcheryA,
    )
    event1111.fin_clips.add(lp)
    event1111.physchem_marks.add(otc)
    event1111.save()

    event2222 = StockingEventFactory(
        stock_id="2222",
        jurisdiction=mi_hu,
        agency=mdnr,
        year=2010,
        month=None,
        day=None,
        year_class=2009,
        species=cos,
        strain_alias=cos_alias,
        lifestage=fingerlings,
        stocking_method=boat,
        mark="RP",
        dd_lon=pt1.x,
        dd_lat=pt1.y,
        geom=pt1,
        agency_stock_id='foo-bar',
        hatchery=mdnr_hatchery,
    )

    event2222.fish_tags.add(cwt, floy_tag)
    event2222.fin_clips.add(rp)
    event2222.physchem_marks.add(brand)
    event2222.save()

    event3333 = StockingEventFactory(
        stock_id="3333",
        jurisdiction=on_er,
        agency=mnrf,
        year=2012,
        year_class=2011,
        month=6,
        day=15,
        species=lat,
        strain_alias=lat1_alias,
        lifestage=yearlings,
        stocking_method=boat,
        mark="LPRV",
        dd_lon=pt2.x,
        dd_lat=pt2.y,
        geom=pt2,
        hatchery=mnrf_hatcheryB,
    )

    event3333.fish_tags.add(cwt)
    event3333.fin_clips.add(lp, rv)
    event3333.save()

    event4444 = StockingEventFactory(
        stock_id="4444",
        jurisdiction=oh_er,
        agency=odnr,
        year=2008,
        year_class=2008,
        month=8,
        day=15,
        species=rbt,
        strain_alias=rbt_alias,
        lifestage=fry,
        stocking_method=truck,
        mark="RV",
        dd_lon=pt2.x,
        dd_lat=pt2.y,
        geom=pt2,
        hatchery=odnr_hatchery,
    )

    event4444.fish_tags.add(cwt)
    event4444.fin_clips.add(rv)
    event4444.physchem_marks.add(otc, brand)
    event4444.save()
