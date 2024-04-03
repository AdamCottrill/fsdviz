"""=============================================================
 c:/1work/fsdviz/fsdviz/tests/common/test_cwt_reuse_sql_trigger.py
 Created: 01 Dec 2021 09:39:25

 DESCRIPTION:

  The postgres database behind fsdviz has a sql trigger that maintains
  the 'reused' flags on the cwt table.  Each time a stocking event is
  created, updated or deleted this trigger should fire to update each
  of the reused flags. The tests in this file ensure that the trigger
  is working as expected by re-using cwts in known ways and ensure
  that the flag is updated accordingly.

   Each test is structured following this pattern:

   + create a stocking event with cwt, assertand that the re-use
   flag(s) are false

   + create a second stocking event stocking event with the same cwt
   number, but different stocking event attribute - assert and that
   the correct re-use flag(s) are True

   + delete the tag from the stocking event, save it, and assert and
   that the correct re-use flag(s) are False again.


 A. Cottrill
=============================================================

"""


import pytest

from fsdviz.common.models import CWT

from ..factories.stocking_factories import StockingEventFactory

from ..factories.common_factories import (
    LakeFactory,
    AgencyFactory,
    StateProvinceFactory,
    JurisdictionFactory,
    SpeciesFactory,
    StrainFactory,
    StrainRawFactory,
    CWTFactory,
    CWTsequenceFactory,
)


@pytest.fixture()
def setup():
    """ """
    huron = LakeFactory(abbrev="HU", lake_name="Huron")

    mnrf = AgencyFactory(abbrev="MNRF")

    ontario = StateProvinceFactory(abbrev="ON", name="Ontario")
    on_hu = JurisdictionFactory(lake=huron, stateprov=ontario)

    lat = SpeciesFactory(abbrev="LAT", common_name="Lake Trout")

    lat_strain1 = StrainFactory(
        strain_code="BS", strain_label="Big Sound", strain_species=lat
    )

    raw_lat1 = StrainRawFactory(species=lat, strain=lat_strain1, raw_strain="BS-1")

    event1 = StockingEventFactory(
        jurisdiction=on_hu,
        agency=mnrf,
        year_class=2009,
        species=lat,
        strain_raw=raw_lat1,
    )

    return {
        "huron": huron,
        "mnrf": mnrf,
        "ontario": ontario,
        "on_hu": on_hu,
        "lat": lat,
        "lat_strain1": lat_strain1,
        "raw_lat1": raw_lat1,
        "event1": event1,
    }


@pytest.mark.django_db
def test_multiple_agencies(setup):
    """This tests verifies that the cwt reused and multiple agencies flags
    are toggled on and off it stocking events by different agencies are
    created (and deleted) using the same cwt number.
    """

    mdnr = AgencyFactory(abbrev="MDNR")

    event1 = setup["event1"]
    on_hu = setup["on_hu"]
    lat = setup["lat"]
    raw_lat1 = setup["raw_lat1"]

    cwt1 = CWTFactory(cwt_number="111111")
    cwtseq1 = CWTsequenceFactory(cwt=cwt1)

    cwtseq1.events.add(event1)
    cwtseq1.save()

    assert cwt1.tag_reused == False
    assert cwt1.multiple_agencies == False

    # create another stocking event with the same tag number
    # but by a different agency

    event2 = StockingEventFactory(
        jurisdiction=on_hu,
        agency=mdnr,
        year_class=2009,
        species=lat,
        strain_raw=raw_lat1,
    )

    cwtseq1.events.add(event2)
    cwtseq1.save()

    event2.notes = "this is a test."
    event2.save()

    assert event2.agency != event1.agency

    cwt1 = CWT.objects.get(pk=cwt1.id)

    # #the tag should now be flagged as re-used:
    assert cwt1.tag_reused == True
    assert cwt1.multiple_agencies == True

    # delete that cwt associated with event 2
    event2.cwt_series.clear()
    event2.save()
    # check the cwt flags again:
    cwt1 = CWT.objects.get(pk=cwt1.id)
    assert cwt1.tag_reused == False
    assert cwt1.multiple_agencies == False


@pytest.mark.django_db
def test_multiple_lakes(setup):
    """This tests verifies that the cwt reused and multiple lake flags
    are toggled on and off it stocking events in different lakes are
    created (and deleted) using the same cwt number.
    """

    event1 = setup["event1"]
    mnrf = setup["mnrf"]
    lat = setup["lat"]
    raw_lat1 = setup["raw_lat1"]

    superior = LakeFactory(abbrev="SU", lake_name="Superior")
    ontario = setup["ontario"]
    on_su = JurisdictionFactory(lake=superior, stateprov=ontario)

    cwt1 = CWTFactory(cwt_number="111111")
    cwtseq1 = CWTsequenceFactory(cwt=cwt1)

    cwtseq1.events.add(event1)
    cwtseq1.save()

    assert cwt1.tag_reused == False
    assert cwt1.multiple_lakes == False

    # create another stocking event with the same tag number
    # but in a different lake

    event2 = StockingEventFactory(
        jurisdiction=on_su,
        agency=mnrf,
        year_class=2009,
        species=lat,
        strain_raw=raw_lat1,
    )

    cwtseq1.events.add(event2)
    cwtseq1.save()

    event2.notes = "this is a test."
    event2.save()

    assert event2.jurisdiction.lake != event1.jurisdiction.lake

    # #the tag should now be flagged as re-used:
    cwt1 = CWT.objects.get(pk=cwt1.id)
    assert cwt1.tag_reused == True
    assert cwt1.multiple_lakes == True

    # delete that cwt associated with event 2
    event2.cwt_series.clear()
    event2.save()
    # check the cwt flags again:
    cwt1 = CWT.objects.get(pk=cwt1.id)
    assert cwt1.tag_reused == False
    assert cwt1.multiple_lakes == False


@pytest.mark.django_db
def test_multiple_species(setup):
    """This tests verifies that the cwt reused and multiple species flags
    are toggled on and off it stocking events of different species are
    created (and deleted) using the same cwt number.
    """

    event1 = setup["event1"]
    mnrf = setup["mnrf"]
    lat = setup["lat"]
    raw_lat1 = setup["raw_lat1"]
    on_hu = setup["on_hu"]

    cos = SpeciesFactory(abbrev="COS", common_name="Coho Salmon")

    cwt1 = CWTFactory(cwt_number="111111")
    cwtseq1 = CWTsequenceFactory(cwt=cwt1)

    cwtseq1.events.add(event1)
    cwtseq1.save()

    assert cwt1.tag_reused == False
    assert cwt1.multiple_strains == False

    # create another stocking event with the same tag number
    # but by a different agency

    event2 = StockingEventFactory(
        jurisdiction=on_hu,
        agency=mnrf,
        year_class=2009,
        species=cos,
        strain_raw=raw_lat1,
    )

    cwtseq1.events.add(event2)
    cwtseq1.save()

    event2.notes = "this is a test."
    event2.save()

    assert event2.species != event1.species

    # #the tag should now be flagged as re-used:
    cwt1 = CWT.objects.get(pk=cwt1.id)
    assert cwt1.tag_reused == True
    assert cwt1.multiple_species == True

    # delete that cwt associated with event 2
    event2.cwt_series.clear()
    event2.save()
    # check the cwt flags again:
    cwt1 = CWT.objects.get(pk=cwt1.id)
    assert cwt1.tag_reused == False
    assert cwt1.multiple_species == False


@pytest.mark.django_db
def test_multiple_strains(setup):
    """This tests verifies that the cwt reused and multiple strains flags
    are toggled on and off if stocking events with the same species
    but different strain are created (and deleted) using the same cwt
    number.

    """

    event1 = setup["event1"]
    mnrf = setup["mnrf"]
    lat = setup["lat"]

    on_hu = setup["on_hu"]

    lat_strain2 = StrainFactory(
        strain_code="SN", strain_label="Seneca Lake", strain_species=lat
    )
    raw_lat2 = StrainRawFactory(species=lat, strain=lat_strain2, raw_strain="SN-1")

    cwt1 = CWTFactory(cwt_number="111111")
    cwtseq1 = CWTsequenceFactory(cwt=cwt1)

    cwtseq1.events.add(event1)
    cwtseq1.save()

    assert cwt1.tag_reused == False
    assert cwt1.multiple_strains == False

    # create another stocking event with the same tag number
    # but with a different strain

    event2 = StockingEventFactory(
        jurisdiction=on_hu,
        agency=mnrf,
        year_class=2009,
        species=lat,
        strain_raw=raw_lat2,
    )

    cwtseq1.events.add(event2)
    cwtseq1.save()

    event2.notes = "this is a test."
    event2.save()

    assert event2.strain_raw != event1.strain_raw

    # #the tag should now be flagged as re-used:
    cwt1 = CWT.objects.get(pk=cwt1.id)
    assert cwt1.tag_reused == True
    assert cwt1.multiple_strains == True

    # delete that cwt associated with event 2
    event2.cwt_series.clear()
    event2.save()
    # check the cwt flags again:
    cwt1 = CWT.objects.get(pk=cwt1.id)
    assert cwt1.tag_reused == False
    assert cwt1.multiple_strains == False


@pytest.mark.django_db
def test_multiple_yearclass(setup):
    """This tests verifies that the cwt reused and multiple year class flags
    are toggled on and off if stocking events with the same species
    but different year class created (and deleted) using the same cwt
    number."""

    event1 = setup["event1"]
    mnrf = setup["mnrf"]
    lat = setup["lat"]
    raw_lat1 = setup["raw_lat1"]
    on_hu = setup["on_hu"]

    cwt1 = CWTFactory(cwt_number="111111")
    cwtseq1 = CWTsequenceFactory(cwt=cwt1)

    cwtseq1.events.add(event1)
    cwtseq1.save()

    assert cwt1.tag_reused == False
    assert cwt1.multiple_yearclasses == False

    # create another stocking event with the same tag number
    # but by a different year class

    event2 = StockingEventFactory(
        jurisdiction=on_hu,
        agency=mnrf,
        year_class=2012,
        species=lat,
        strain_raw=raw_lat1,
    )

    cwtseq1.events.add(event2)
    cwtseq1.save()

    event2.notes = "this is a test."
    event2.save()

    assert event2.year != event1.year_class

    # #the tag should now be flagged as re-used:
    cwt1 = CWT.objects.get(pk=cwt1.id)
    assert cwt1.tag_reused == True
    assert cwt1.multiple_yearclasses == True

    # delete that cwt associated with event 2
    event2.cwt_series.clear()
    event2.save()
    # check the cwt flags again:
    cwt1 = CWT.objects.get(pk=cwt1.id)
    assert cwt1.tag_reused == False
    assert cwt1.multiple_yearclasses == False


@pytest.mark.django_db
def test_multiple_makers(setup):
    """This tests verifies that the cwt reused and multiple makers flags
    are toggled on and off if stocking events that use cwts created by
    different manufacturers but the same number are created.
    """

    event1 = setup["event1"]
    mnrf = setup["mnrf"]
    lat = setup["lat"]
    raw_lat1 = setup["raw_lat1"]
    on_hu = setup["on_hu"]

    cwt1 = CWTFactory(cwt_number="111111")
    cwtseq1 = CWTsequenceFactory(cwt=cwt1)

    cwtseq1.events.add(event1)
    cwtseq1.save()

    assert cwt1.tag_reused == False
    assert cwt1.multiple_makers == False

    cwt2 = CWTFactory(cwt_number="111111", manufacturer="mm")
    cwtseq2 = CWTsequenceFactory(cwt=cwt2)

    # create another stocking event with the same tag number
    # but made by a differerent manufacturer

    event2 = StockingEventFactory(
        jurisdiction=on_hu,
        agency=mnrf,
        year_class=2012,
        species=lat,
        strain_raw=raw_lat1,
    )

    cwtseq2.events.add(event2)
    cwtseq2.save()

    event2.notes = "this is a test."
    event2.save()

    # #the tag should now be flagged as re-used:
    cwt1 = CWT.objects.get(pk=cwt1.id)
    assert cwt1.tag_reused == True
    assert cwt1.multiple_makers == True

    cwt2 = CWT.objects.get(pk=cwt2.id)
    assert cwt2.tag_reused == True
    assert cwt2.multiple_makers == True
