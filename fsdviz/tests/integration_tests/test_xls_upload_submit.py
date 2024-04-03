"""=============================================================
 ~fsdviz/fsdviz/tests/integration_tests/test_xls_upload_submit.py
 Created: 19 May 2021 14:37:05

 DESCRIPTION:

  This file tests that xls_data submitted from the stocking event
  upload form are saved appropriately as actual stocking events, or if
  errors exist, the form is returned and includes appropriate error
  messages.

  There is another set of tests that verify that the xls spreadsheet
  is valid and can be parsed into a django form. These tests verify
  that the submission of that form works as expected and that all of
  the stocking events and assocaited relationships are created.

 A. Cottrill
=============================================================

"""

import pytest
from django.db.models.fields import PositiveIntegerRelDbTypeMixin
from django.test import TestCase
from django.urls import reverse
from fsdviz.common.models import CWT, FinClip, FishTag, Jurisdiction, PhysChemMark
from fsdviz.myusers.tests.factories import UserFactory
from fsdviz.stocking.models import Condition, StockingEvent
from fsdviz.tests.factories.common_factories import (
    AgencyFactory,
    CompositeFinClipFactory,
    CWTFactory,
    CWTsequenceFactory,
    FinClipFactory,
    FishTagFactory,
    Grid10Factory,
    JurisdictionFactory,
    LakeFactory,
    LatLonFlagFactory,
    ManagementUnitFactory,
    PhysChemMarkFactory,
    SpeciesFactory,
    StateProvinceFactory,
    StrainFactory,
    StrainRawFactory,

)
from fsdviz.tests.factories.stocking_factories import (
    ConditionFactory,
    HatcheryFactory,
    LifeStageFactory,
    StockingMethodFactory,
    YearlingEquivalentFactory,
)


class XLS_Submission(TestCase):
    """"""

    @pytest.mark.django_db(transaction=True)
    def setUp(self):
        """ "The xls_submittsion process requires a lot of state setup to
        emulate the real database - many of the values in the simple
        flat table submission template is essentially a label to a
        related object (or objects).  These objects need to exists to
        valedate the data (and ensure that errors are thrown if they
        don't)

        """

        LakeFactory(abbrev="SU", lake_name="Superior")
        lake = LakeFactory(abbrev="HU", lake_name="Lake Huron")
        lake_ont = LakeFactory(abbrev="ON", lake_name="Lake Ontario")
        ont = StateProvinceFactory(abbrev="ON", name="Ontario")
        mich = StateProvinceFactory(abbrev="MI", name="Michigan")

        JurisdictionFactory(lake=lake, stateprov=mich)
        JurisdictionFactory(lake=lake_ont, stateprov=ont)

        jurisdiction = JurisdictionFactory(lake=lake, stateprov=ont, slug="on_hu")
        gb4 = ManagementUnitFactory(
            label="GB4",
            lake=lake,
            jurisdiction=jurisdiction,
            primary=True,
            mu_type="stat_dist",
        )
        AgencyFactory.create(abbrev="MNRF")
        AgencyFactory.create(abbrev="MDNR")
        AgencyFactory.create(abbrev="USFWS")

        HatcheryFactory.create(abbrev="CWC")

        grid1128 = Grid10Factory.create(lake=lake, grid="1128")

        gb4.grid10s.add(grid1128)
        gb4.save()

        lat = SpeciesFactory(abbrev="LAT", common_name="Lake Trout")

        sen = StrainFactory.create(
            strain_code="SN", strain_label="Seneca", strain_species=lat
        )
        bs = StrainFactory.create(
            strain_code="BS", strain_label="BigSound", strain_species=lat
        )

        StrainRawFactory.create(raw_strain="SN", species=lat, strain=sen)
        StrainRawFactory.create(raw_strain="BS", species=lat, strain=bs)

        LifeStageFactory(abbrev="y", description="yearling")
        fall_fingerling = LifeStageFactory(abbrev="ff", description="fall fingerling")

        YearlingEquivalentFactory(
            species=lat, lifestage=fall_fingerling, yreq_factor=0.9
        )

        ConditionFactory(condition=0, description="Reported as something")

        StockingMethodFactory(stk_meth="b", description="boat")

        FinClipFactory(abbrev="LV", description="Left Ventral")
        FinClipFactory(abbrev="RP", description="Right Pectoral")
        FinClipFactory(abbrev="AD", description="Adipose")

        CompositeFinClipFactory(clip_code="AD", description="Adipose")
        CompositeFinClipFactory(
            clip_code="LVRP", description="Left Ventral, Right Pectoral"
        )

        LatLonFlagFactory(value=1, description="Reported")
        LatLonFlagFactory(value=4, description="Derived from 10-minute Grid")

        PhysChemMarkFactory(mark_code="OX")
        PhysChemMarkFactory(mark_code="CA")

        # fish tags:
        FishTagFactory(tag_code="CWT", tag_type="CWT", description="Coded Wire Tag")
        FishTagFactory(tag_code="JAW", tag_type="Jaw", description="Jaw Tag")

        cwt = CWTFactory(cwt_number="111111")
        CWTsequenceFactory(cwt=cwt)

        self.user = UserFactory(
            username="hsimpson",
            first_name="Homer",
            last_name="Simpson",
            email="homer.simpson@simpsons.com",
            password="Abcd1234",
            role="glsc",
        )
        self.user.save()

        self.payload = {
            # management_form data
            "form-INITIAL_FORMS": "0",
            "form-TOTAL_FORMS": "2",
            "form-MAX_NUM_FORMS": "",
            "form-0-year": "2019",
            "form-0-month": "5",
            "form-0-day": "16",
            "form-0-state_prov": "ON",
            "form-0-stat_dist": "GB4",
            "form-0-grid": "1128",
            "form-0-latitude": "44.5664",
            "form-0-longitude": "-81.85",
            "form-0-site": "Mary Ward",
            "form-0-st_site": "Mary Ward Ledges",
            "form-0-species": "LAT",
            "form-0-strain": "SN",
            "form-0-stage": "y",
            "form-0-agemonth": "16",
            "form-0-year_class": "2018",
            "form-0-tag_no": "222222",
            "form-0-tag_ret": "",
            "form-0-length": "",
            "form-0-weight": "840.0081",
            "form-0-condition": "0",
            "form-0-stock_meth": "b",
            "form-0-no_stocked": "30747",
            "form-0-lot_code": "380",
            "form-0-notes": "",
            "form-0-finclip": "LVRP",
            "form-0-clip_efficiency": "96.5",
            "form-0-physchem_mark": "",
            "form-0-tag_type": "CWT",
            "form-0-hatchery": "CWC",
            "form-0-agency_stock_id": "42701",
            "form-1-year": "2019",
            "form-1-month": "5",
            "form-1-day": "16",
            "form-1-state_prov": "ON",
            "form-1-stat_dist": "GB4",
            "form-1-grid": "1128",
            "form-1-latitude": "",
            "form-1-longitude": "",
            "form-1-site": "Mary Ward",
            "form-1-st_site": "Mary Ward East",
            "form-1-species": "LAT",
            "form-1-strain": "BS",
            "form-1-stage": "ff",
            "form-1-agemonth": "16",
            "form-1-year_class": "2018",
            "form-1-tag_no": "111111",
            "form-1-tag_ret": "",
            "form-1-length": "",
            "form-1-weight": "280.0127",
            "form-1-condition": "0",
            "form-1-stock_meth": "b",
            "form-1-no_stocked": "10849",
            "form-1-lot_code": "374s",
            "form-1-notes": "",
            "form-1-finclip": "LVRP",
            "form-1-clip_efficiency": "82.6",
            "form-1-physchem_mark": "OX",
            "form-1-tag_type": "CWT",
            "form-1-hatchery": "CWC",
            "form-1-agency_stock_id": "42703",
        }

        self.session_data = [
            {
                # management_form data
                "lake": "HU",
                "agency": "MNRF",
                "state_prov": "ON",
                "stat_dist": "GB4",
                "grid": "1128",
                "latitude": 44.5664,
                "longitude": -81.85,
                "site": "Mary Ward",
                "st_site": "Mary Ward Ledges",
                "species": "LAT",
                "strain": "SN",
                "stage": "y",
                "agemonth": "16",
                "year_class": "2018",
                "tag_no": "",
                "tag_ret": "",
                "length": "",
                "weight": "840.0081",
                "condition": "0",
                "stock_meth": "b",
                "no_stocked": "30747",
                "lot_code": "380",
                "notes": "",
                "finclip": "LVRP",
                "clip_efficiency": "96.5",
                "physchem_mark": "",
                "tag_type": "",
                "hatchery": "CWC",
                "agency_stock_id": "42701",
            },
            {
                "lake": "HU",
                "agency": "MNRF",
                "state_prov": "ON",
                "stat_dist": "GB4",
                "grid": "1128",
                "latitude": 44.56751,
                "longitude": -81.85,
                "site": "Mary Ward",
                "st_site": "Mary Ward East",
                "species": "LAT",
                "strain": "BS",
                "stage": "ff",
                "agemonth": "16",
                "year_class": "2018",
                "tag_no": "",
                "tag_ret": "",
                "length": "",
                "weight": "280.0127",
                "condition": "",
                "stock_meth": "b",
                "no_stocked": "10849",
                "lot_code": "374s",
                "notes": "",
                "finclip": "LVRP",
                "clip_efficiency": "82.6",
                "physchem_mark": "",
                "tag_type": "",
                "hatchery": "CWC",
                "agency_stock_id": "42703",
            },
        ]

    @pytest.mark.django_db(transaction=True)
    def test_xls_submit_good_data(self):
        """If we submit good data with all of the fields populated with
        appripriately, the stocking events should be created and have the
        specified attributes. This test just verifies the basic inputs. Inputs
        that require foreign realtionship and/or parsing logic are handled
        elsewhere.

        Arguments:
        - `clent`:
        - `user`:
        - `events`:

        """

        user = self.user
        payload = self.payload

        login = self.client.login(email=user.email, password="Abcd1234")
        assert login is True
        url = reverse("stocking:xls-events-form")

        session = self.client.session
        session["data"] = self.session_data
        session.save()

        response = self.client.post(url, data=payload, follow=True)
        assert response.status_code == 200

        # make some assertions about the stocking events to make sure
        # the basic info is going in as expected;

        event = StockingEvent.objects.select_related(
            "jurisdiction__lake",
            "jurisdiction__stateprov",
            "agency",
            "lifestage",
            "hatchery",
            "stocking_method",
        ).get(agency_stock_id="42701")

        # these values are based on foreign keys:
        assert event.jurisdiction.lake.abbrev == "HU"
        assert event.agency.abbrev == "MNRF"
        assert event.jurisdiction.stateprov.abbrev == "ON"
        assert event.stocking_method.stk_meth == "b"
        assert event.lifestage.abbrev == "y"
        assert event.grid_10.grid == "1128"
        assert event.species.abbrev == "LAT"
        assert event.hatchery.abbrev == "CWC"
        # assert event.condition ==  "0"
        # assert event.strain ==  "SN"

        # these attributes are straight from the uploaded data
        assert event.dd_lat == 44.5664
        assert event.dd_lon == -81.85
        assert event.site == "Mary Ward"
        assert event.st_site == "Mary Ward Ledges"
        assert event.agemonth == 16
        assert event.year_class == 2018
        assert event.tag_ret == None
        assert event.length == None
        assert event.weight == 840.0081
        assert event.no_stocked == 30747
        assert event.lotcode == "380"
        assert event.notes == ""
        assert event.clip_efficiency == 96.5

        # these ones are more complicated and will be tested elsewhere
        # assert event.tag_no == ""
        # assert event.finclip ==  "LVRP"
        # assert event.physchem_mark ==  ""
        # assert event.tag_type ==  ""

    @pytest.mark.django_db(transaction=True)
    def test_xls_submit_event_upload_object(self):
        """When events are uploaded by spreadsheet a stocking event
        upload record is created. Verify that event_upload object is created,
        that it contains the information about the upload events, and is
        associated with the correct stocking events."""

        user = self.user
        payload = self.payload

        login = self.client.login(email=user.email, password="Abcd1234")
        assert login is True
        url = reverse("stocking:xls-events-form")

        session = self.client.session
        session["data"] = self.session_data
        session.save()

        response = self.client.post(url, data=payload, follow=True)
        assert response.status_code == 200

        event = StockingEvent.objects.get(agency_stock_id="42701")

        upload_event = event.upload_event

        assert upload_event.lake.abbrev == "HU"
        assert upload_event.agency.abbrev == "MNRF"
        assert upload_event.uploaded_by.username == "hsimpson"
        assert len(upload_event.stocking_events.all()) == 2

    @pytest.mark.django_db(transaction=True)
    def test_xls_submit_unknown_values(self):
        """Verify that all of the fields that are choice fields raise an error
        if the data is not one of the available choices."""

        user = self.user
        payload = self.payload

        login = self.client.login(email=user.email, password="Abcd1234")
        assert login is True
        url = reverse("stocking:xls-events-form")

        session = self.client.session
        session["data"] = self.session_data
        session.save()

        field_list = [
            "grid",
            "strain",
            "stage",
            "condition",
            "stock_meth",
            "finclip",
            "physchem_mark",
            "tag_type",
            "hatchery",
        ]

        for field in field_list:

            payload2 = payload.copy()
            key = "form-0-{}".format(field)
            payload2[key] = "foo"

            response = self.client.post(url, data=payload2, follow=True)
            assert response.status_code == 200

            msg = '{{"id_form-0-{}": ["Select a valid choice. foo is not one of the available choices."]}}'

            content = str(response.content)
            assert msg.format(field) in content

    @pytest.mark.django_db(transaction=True)
    def test_xls_submit_jurisdiction(self):
        """Jurisdiction isn't sumbitted directly in the xls form, but
        is calculated based on the lake and province associated with the
        uploaded data.  Verify that it is calculated correclty."""

        ontario_huron = Jurisdiction.objects.get(
            lake__abbrev="HU", stateprov__abbrev="ON"
        )

        user = self.user
        payload = self.payload

        login = self.client.login(email=user.email, password="Abcd1234")
        assert login is True
        url = reverse("stocking:xls-events-form")

        session = self.client.session
        session["data"] = self.session_data
        session.save()

        response = self.client.post(url, data=payload, follow=True)
        assert response.status_code == 200

        event = StockingEvent.objects.select_related(
            "jurisdiction__stateprov",
        ).get(agency_stock_id="42701")

        assert event.jurisdiction == ontario_huron

    @pytest.mark.django_db(transaction=True)
    def test_xls_submit_finclips(self):
        """Fin clips come in a composite fin clip string - these need to be
        parsed and associated with fin clip objects. Composite fin
        clip should be saved with the event as an ascii sorted string
        composed of the fin clip clip codes..
        """

        user = self.user
        payload = self.payload

        login = self.client.login(email=user.email, password="Abcd1234")
        assert login is True
        url = reverse("stocking:xls-events-form")

        session = self.client.session
        session["data"] = self.session_data
        session.save()

        response = self.client.post(url, data=payload, follow=True)
        assert response.status_code == 200

        event = StockingEvent.objects.get(agency_stock_id="42701")
        assert event.clip_code.clip_code == "LVRP"

        clips = [x for x in FinClip.objects.filter(abbrev__in=["LV", "RP"])]

        for clip in event.fin_clips.all():
            assert clip in clips

    @pytest.mark.django_db(transaction=True)
    def test_xls_submit_fishtags(self):
        """Fin tags come in a composite string - these need to be
        parsed and associated with fish tag objects."""

        tag = FishTag.objects.get(tag_code="CWT")

        user = self.user
        payload = self.payload

        login = self.client.login(email=user.email, password="Abcd1234")
        assert login is True
        url = reverse("stocking:xls-events-form")

        session = self.client.session
        session["data"] = self.session_data
        session.save()

        response = self.client.post(url, data=payload, follow=True)
        assert response.status_code == 200

        event = StockingEvent.objects.get(agency_stock_id="42701")

        tags = event.fish_tags.all()
        assert len(tags) == 1
        assert tags[0] == tag

    @pytest.mark.django_db(transaction=True)
    def test_xls_submit_physchem_mark(self):
        """Marks are passed in as a string - these need to
        be parsed and assocaited with their respective mark entities."""

        mark = PhysChemMark.objects.get(mark_code="OX")

        user = self.user
        payload = self.payload

        login = self.client.login(email=user.email, password="Abcd1234")
        assert login is True
        url = reverse("stocking:xls-events-form")

        session = self.client.session
        session["data"] = self.session_data
        session.save()

        response = self.client.post(url, data=payload, follow=True)
        assert response.status_code == 200

        event = StockingEvent.objects.get(agency_stock_id="42703")

        marks = event.physchem_marks.all()
        assert len(marks) == 1
        assert marks[0] == mark

    @pytest.mark.django_db(transaction=True)
    def test_xls_submit_existing_cwts(self):
        """If the stocking event includes cwts that already exist, the new
        stocking events should be associated with the existing cwt
        (new cwt events should not be created.).
        """

        assert len(CWT.objects.filter(cwt_number="111111")) == 1

        user = self.user
        payload = self.payload

        login = self.client.login(email=user.email, password="Abcd1234")
        assert login is True
        url = reverse("stocking:xls-events-form")

        session = self.client.session
        session["data"] = self.session_data
        session.save()

        response = self.client.post(url, data=payload, follow=True)
        assert response.status_code == 200

        event = StockingEvent.objects.get(agency_stock_id="42703")
        obs = [x.cwt.cwt_number for x in event.cwt_series.all()]
        assert len(obs) == 1
        assert obs == ["111111"]

    @pytest.mark.django_db(transaction=True)
    def test_xls_submit_new_cwts(self):
        """If the stocking event includes cwts that do not exist, they should
        be created and asscoiated with the events."""

        assert len(CWT.objects.filter(cwt_number="222222")) == 0
        user = self.user
        payload = self.payload

        login = self.client.login(email=user.email, password="Abcd1234")
        assert login is True
        url = reverse("stocking:xls-events-form")

        session = self.client.session
        session["data"] = self.session_data
        session.save()

        response = self.client.post(url, data=payload, follow=True)
        assert response.status_code == 200

        event = StockingEvent.objects.get(agency_stock_id="42701")
        obs = [x.cwt.cwt_number for x in event.cwt_series.all()]
        assert len(obs) == 1
        assert obs == ["222222"]

        assert len(CWT.objects.filter(cwt_number="222222")) == 1

    @pytest.mark.django_db(transaction=True)
    def test_xls_submit_multiple_cwts(self):
        """cwts can be separated by either comma's or semi colons - make sure
        that we can parse them correctly either way. Existing cwt
        should be used, if new cwts are needed they should be
        created.
        """

        user = self.user

        payload = self.payload
        payload["form-0-tag_no"] = "111111,222222"
        payload["form-1-tag_no"] = "111111;222222"

        expected = ["111111", "222222"]

        login = self.client.login(email=user.email, password="Abcd1234")
        assert login is True
        url = reverse("stocking:xls-events-form")

        session = self.client.session
        session["data"] = self.session_data
        session.save()

        response = self.client.post(url, data=payload, follow=True)
        assert response.status_code == 200

        stock_ids = ["42701", "42703"]
        for stock_id in stock_ids:
            event = StockingEvent.objects.get(agency_stock_id=stock_id)
            obs = [x.cwt.cwt_number for x in event.cwt_series.all()]
            assert len(obs) == 2
            assert set(expected) == set(obs)

    @pytest.mark.django_db(transaction=True)
    def test_xls_submit_grid_flag_if_latlon_null(self):
        """Grid flag should be set appropriate for each event depending on
        whether or not it has dd-lat and dd-lon populated.
        """

        user = self.user
        payload = self.payload

        login = self.client.login(email=user.email, password="Abcd1234")
        assert login is True
        url = reverse("stocking:xls-events-form")

        session = self.client.session
        session["data"] = self.session_data
        session.save()

        response = self.client.post(url, data=payload, follow=True)
        assert response.status_code == 200

        # lat-long was reported.
        event = StockingEvent.objects.get(agency_stock_id="42701")
        assert event.latlong_flag.value == 1

        # latlong was not reported but is derived from grid:
        event = StockingEvent.objects.get(agency_stock_id="42703")
        assert event.latlong_flag.value == 4

    @pytest.mark.django_db(transaction=True)
    def test_xls_submit_yearling_equivalents(self):
        """When events are successfully uploaded, the yearling equivalent
        field should be correctly caclulated for each event based on
        it's species and lifestage.  Yearling don't need to be
        changed, but fingerlings need to be discounted.

        """
        user = self.user
        payload = self.payload

        login = self.client.login(email=user.email, password="Abcd1234")
        assert login is True
        url = reverse("stocking:xls-events-form")

        session = self.client.session
        session["data"] = self.session_data
        session.save()

        response = self.client.post(url, data=payload, follow=True)
        assert response.status_code == 200

        # the first event was a yearling - number stocked and yreq
        # should be the same
        event = StockingEvent.objects.get(agency_stock_id="42701")
        assert event.yreq_stocked == event.no_stocked

        # the second event was ff and yreq should be adjusted lower:
        event = StockingEvent.objects.get(agency_stock_id="42703")
        assert event.yreq_stocked == int(event.no_stocked * 0.90)

    @pytest.mark.django_db(transaction=True)
    def test_xls_submit_missing_condition(self):
        """Condition is not a required field in our xls form but has default
        value '99' if it is not repored.  Verify that condition is
        populated as expected if the submitted data is null or an
        empty string

        """

        not_reported, created = Condition.objects.get_or_create(condition=99)

        user = self.user
        payload = self.payload

        payload = self.payload
        payload["form-0-condition"] = ""
        payload["form-1-condition"] = ""

        login = self.client.login(email=user.email, password="Abcd1234")
        assert login is True
        url = reverse("stocking:xls-events-form")

        session = self.client.session
        session["data"] = self.session_data
        session.save()

        response = self.client.post(url, data=payload, follow=True)
        assert response.status_code == 200

        events = StockingEvent.objects.all()
        for event in events:
            assert event.condition == not_reported
