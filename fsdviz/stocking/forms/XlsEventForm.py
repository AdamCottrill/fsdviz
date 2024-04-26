from datetime import datetime

from django import forms

from fsdviz.common.constants import MONTHS
from fsdviz.common.models import StrainRaw
from fsdviz.common.utils import int_or_none
from fsdviz.common.validators import validate_cwt
from fsdviz.common.widgets import MySelect


class XlsEventForm(forms.Form):
    """A form to capture stocking events in spreadsheet form, validate
    them, and convert them to stocking event model instances.  The"""

    def __init__(self, *args, **kwargs):
        OPTIONAL_CHOICE = [
            ("", "---"),
        ]
        self.choices = kwargs.pop("choices", None)
        # self.bbox = kwargs.pop("bbox", None)
        self.cache = kwargs.pop("cache", dict())
        super(XlsEventForm, self).__init__(*args, **kwargs)

        self.fields["state_prov"].choices = self.choices.get("state_prov")
        self.fields["stat_dist"].choices = self.choices.get("stat_dist")
        self.fields["grid"].choices = self.choices.get("grids")

        self.fields["species"].choices = self.choices.get("species")
        self.fields["strain"].choices = self.choices.get("strain")

        self.fields["stock_meth"].choices = self.choices.get("stocking_method")
        self.fields["stage"].choices = self.choices.get("lifestage")

        stocking_mortality_choices = OPTIONAL_CHOICE + self.choices.get("stocking_mortality", [])
        self.fields["stocking_mortality"].choices = stocking_mortality_choices

        finclips_choices = OPTIONAL_CHOICE + self.choices.get("finclips", [])
        self.fields["finclip"].choices = finclips_choices

        physchem_mark_choices = OPTIONAL_CHOICE + self.choices.get("physchem_marks", [])
        self.fields["physchem_mark"].choices = physchem_mark_choices

        tag_type_choices = OPTIONAL_CHOICE + self.choices.get("tag_types", [])
        self.fields["tag_type"].choices = tag_type_choices

        hatchery_choices = OPTIONAL_CHOICE + self.choices.get("hatcheries", [])
        self.fields["hatchery"].choices = hatchery_choices

        choice_fields = [
            "state_prov",
            "stat_dist",
            "grid",
            "species",
            "strain",
            "stock_meth",
            "stage",
            "stocking_mortality",
            "finclip",
            "physchem_mark",
            "tag_type",
            "hatchery",
        ]

        # - if there are values passed in from excel - add them to the
        # choices with an invalid value. For optional fields, don't
        # forget to add an empty placeholder:
        if self.initial:
            for fld in choice_fields:
                # some of our fields form excel need to be identified
                # by their label: if the value is in our list of
                # labels, reset the intial value to the corresponding
                # slug/id
                initial = self.initial[fld]

                if isinstance(initial, str) and fld in ("stage", "stock_meth"):
                    initial = initial.lower()

                if initial in [x[1] for x in self.fields[fld].choices]:
                    val = [x[0] for x in self.fields[fld].choices if x[1] == initial][0]
                    self.initial[fld] = val
                elif initial in [x[0] for x in self.fields[fld].choices]:
                    val = [x[0] for x in self.fields[fld].choices if x[0] == initial][0]
                    self.initial[fld] = val
                else:
                    val = initial
                if val not in [x[0] for x in self.fields[fld].choices]:
                    self.fields[fld].choices.insert(0, ("-999", val))

    DAYS = [(None, "Unk")] + list(zip(range(1, 32), range(1, 32)))

    # agency = forms.CharField(widget=forms.HiddenInput())
    # lake = forms.CharField(widget=forms.HiddenInput())

    year = forms.IntegerField(
        min_value=1950, max_value=datetime.now().year, required=True
    )
    month = forms.ChoiceField(choices=MONTHS, required=False)
    day = forms.ChoiceField(choices=DAYS, required=False)

    state_prov = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    stat_dist = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    grid = forms.ChoiceField(choices=[], required=True, widget=MySelect)

    ## {'bbox': (-92.094077, 41.38080, -76.059172, 49.0158109)}
    latitude = forms.FloatField(required=False, min_value=41.3, max_value=49.1)
    longitude = forms.FloatField(required=False, min_value=-92.4, max_value=-76.0)
    site = forms.CharField(required=True)
    st_site = forms.CharField(required=False)

    species = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    strain = forms.ChoiceField(choices=[], required=True, widget=MySelect)

    stage = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    agemonth = forms.IntegerField(min_value=0, required=False)
    year_class = forms.IntegerField(
        min_value=1950, max_value=(datetime.now().year + 1), required=False
    )

    tag_no = forms.CharField(required=False, validators=[validate_cwt])
    tag_ret = forms.FloatField(min_value=0, max_value=100, required=False)
    length = forms.FloatField(min_value=1, required=False, widget=forms.TextInput)
    weight = forms.FloatField(min_value=0.1, required=False, widget=forms.TextInput)

    stocking_mortality = forms.ChoiceField(choices=[], required=False, widget=MySelect)
    stock_meth = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    no_stocked = forms.IntegerField(required=True, min_value=1)
    lot_code = forms.CharField(required=False)
    # validation = forms.IntegerField(min_value=0, max_value=10, required=False)
    notes = forms.CharField(required=False)

    # new Spring 2020
    finclip = forms.ChoiceField(choices=[], required=False, widget=MySelect)
    clip_efficiency = forms.FloatField(min_value=0, max_value=100, required=False)
    physchem_mark = forms.ChoiceField(choices=[], required=False, widget=MySelect)
    tag_type = forms.ChoiceField(choices=[], required=False, widget=MySelect)
    hatchery = forms.ChoiceField(
        choices=[],
        required=False,
        widget=MySelect(attrs={"class": "ui search"}),
    )
    # hatchery = forms.CharField(required=False)  # choice field some day too
    stock_id = forms.CharField(required=False)
    agency_stock_id = forms.CharField(required=False)

    def clean_latitude(self):
        """If latitude is populated, it must be
        within the bounds of the associated lake (plus a small
        buffer set in the form and passed to the form).
        """
        ddlat = self.cleaned_data.get("latitude")
        bbox = self.cache.get("bbox")

        if ddlat == "" or ddlat is None:
            return None
        else:
            if bbox:
                if ddlat < bbox[1]:
                    msg = "Latitude must be greater than {:.3f} degrees".format(bbox[1])
                    raise forms.ValidationError(msg, code="latitude_too_small")
                if ddlat > bbox[3]:
                    msg = "Latitude must be less than {:.3f} degrees".format(bbox[3])
                    raise forms.ValidationError(msg, code="latitude_too_large")
            return ddlat

    def clean_longitude(self):
        """If longitude is populated, it must be
        within the bounds of the associated lake (plus a small
        buffer set in the view and passed to the form).
        """

        ddlon = self.cleaned_data.get("longitude")
        bbox = self.cache.get("bbox")

        if ddlon == "" or ddlon is None:
            return None
        else:
            if bbox:
                if ddlon < bbox[0]:
                    msg = "Longitude must be negative and greater than {:.3f} degrees".format(
                        bbox[0]
                    )
                    raise forms.ValidationError(msg, code="longitude_too_small")
                if ddlon > bbox[2]:
                    msg = "Longitude must be negative and less than {:.3f} degrees".format(
                        bbox[2]
                    )
                    raise forms.ValidationError(msg, code="longitude_too_large")
            return ddlon

    def clean_stateprov(self):
        """The jurisdiction must be limited to those that exist in the
        lake for this event. If lat-lon are provided and return a
        jurisdiction, it must be consistent with the reported
        jurisdiction.

        """
        lake = self.cache.get("lake", "")
        stateprov = self.cleaned_data.get("state_prov", "")
        stateprov_choices = self.choices.get("stateprov")

        if stateprov not in stateprov_choices:
            msg = "%(stateprov)s is not a valid State or Province for  for lake '%(lake)s'"
            raise forms.ValidationError(msg, params={"lake": lake}, code="stateprov")

        ddlat = self.cleaned_data.get("latitude")
        ddlon = self.cleaned_data.get("longitude")
        if ddlat and ddlon:
            point_polygons = self.cache.get("point_polygons")
            jurisdiction = point_polygons.get_jurisdiction([ddlat, ddlon])
            if jurisdiction != "":
                pred_stateprov = jurisdiction.get("stateprov_abbrev")
                if pred_stateprov != stateprov:
                    msg = "Lat-long suggests {}".format(pred_stateprov)
                    raise forms.ValidationError(msg, code="pred-stateprov")
        return stateprov

    def clean_stat_dist(self):
        """The statistiscal districut must be limited to one of the
        stat_districts found in the jurisdiction. If lat-lon are
        provided and return a stat_dist, it must be consistent with the
        reported stat_dist."""

        lake = self.cache.get("lake", "")
        stateprov = self.cleaned_data.get("state_prov", "")
        stat_dist = self.cleaned_data.get("stat_dist", "")
        stat_dist_choices = self.cache.get("mus", {}).get(stateprov, [])

        if stat_dist not in stat_dist_choices:
            msg = "Stat_Dist {} is not valid for {} waters of Lake {}"
            raise forms.ValidationError(
                msg.format(stat_dist, stateprov, lake), code="invalid_stat_dist"
            )

        ddlat = self.cleaned_data.get("latitude")
        ddlon = self.cleaned_data.get("longitude")
        if ddlat and ddlon:
            point_polygons = self.cache.get("point_polygons")
            manUnit = point_polygons.get_manUnit([ddlat, ddlon])
            if manUnit != "":
                if manUnit["label"] != stat_dist:
                    msg = "Lat-long suggests {}".format(manUnit["label"])
                    raise forms.ValidationError(msg, code="pred-statdist")
        return stat_dist

    def clean_grid(self):
        """grid must be one of the grids in the provided lake that are
        associated with the seelcted management unit.  If lat-lon are
        provided and return a grid, it must be consistent with the
        reported grid."""

        grid = self.cleaned_data.get("grid", "")
        stat_dist = self.cleaned_data.get("stat_dist", "")
        grid_choices = self.cache.get("mu_grids", {}).get(stat_dist, [])

        if grid not in grid_choices:
            msg = "Grid {} is not valid for Statistical District '{}'"
            raise forms.ValidationError(
                msg.format(grid, stat_dist), code="grid_stat_dist"
            )

        ddlat = self.cleaned_data.get("latitude")
        ddlon = self.cleaned_data.get("longitude")
        if ddlat and ddlon:
            point_polygons = self.cache.get("point_polygons")
            grid10 = point_polygons.get_grid10([ddlat, ddlon])
            if grid10 != "":
                if grid10["grid"] != stat_dist:
                    msg = "Lat-long suggests {}".format(grid10["grid"])
                    raise forms.ValidationError(msg, code="pred-grid10")
        return grid

    def clean_strain(self):
        """The strain values passed in the xls form will be 'raw' strain
        values. They must be one of the raw strains associated with the
        species, and must be mapped to an existing strain object.

        Arguments:
        - `self`:

        """
        strain_cache = self.cache.get("strains")

        species = self.cleaned_data.get("species", "")
        strain_code = self.cleaned_data.get("strain", "")

        strain = strain_cache.get(species, dict()).get(strain_code)

        if strain is None:
            msg = "Unknown strain code '{}' for species '{}'"
            raise forms.ValidationError(
                msg.format(strain_code, species), code="unknown_strain"
            )
        return strain

    def clean_tags(self):
        """The tags string must be six digits, or a series of 6-digit strins
        separated by a comma or semicolon

        """
        # # if cwt_number is populated - cwt must be one of the tag types.

        pass

    def clean_finclip(self):
        """The value submitted for clips must be one of precompliled compoiste
        clip codes.  Specifically, BV and BP are not allow.  VLRV and
        LPRP must be used instead.

        """
        finclip = self.cleaned_data["finclip"]
        if finclip.find("BV") >= 0:
            msg = "'BV' is not a valid composite clip.  Did you mean 'LVRV'?"
            raise forms.ValidationError(msg, code="invalid_clip_BV")
        if finclip.find("BP") >= 0:
            msg = "'BP' is not a valid composite clip.  Did you mean 'LPRP'?"
            raise forms.ValidationError(msg, code="invalid_clip_BP")
        return finclip

    def clean_day(self):
        """make sure that the day value is an integer or None"""
        val = self.cleaned_data["day"]
        return int_or_none(val)

    def clean_site(self):
        """make sure the site name is title case, not all caps"""
        val = self.cleaned_data["site"]

        if val:
            return val.title()
        else:
            return val

    def clean_st_site(self):
        """make sure the st_site name is title case, not all caps"""
        val = self.cleaned_data["st_site"]

        if val:
            return val.title()
        else:
            return val

    def clean_month(self):
        """make sure that the month value is an integer or None"""
        val = self.cleaned_data["month"]
        return int_or_none(val)

    def clean(self):
        year = self.cleaned_data.get("year", "0")
        month = self.cleaned_data.get("month")
        day = self.cleaned_data.get("day")

        if month and not day:
            msg = "Please provide a day to complete the event date"
            raise forms.ValidationError(msg, code="missing_day")
        elif day and not month:
            msg = "Please provide a month to complete the event date"
            raise forms.ValidationError(msg, code="missing_month")

        if month and day:
            try:
                datetime(int(year), int(month), int(day))
            except ValueError:
                msg = "Day, month, and year do not form a valid date."
                raise forms.ValidationError(msg, code="invalid_date")

        year_class = self.cleaned_data.get("year_class", 0)

        if year_class > year:
            msg = "Year class cannot be greater than stocking year."
            raise forms.ValidationError(msg, code="future_year_class")

        ddlat = self.cleaned_data.get("latitude")
        ddlon = self.cleaned_data.get("longitude")

        if ddlon is not None and ddlat is None:
            msg = "Latitude is required if Longitude is populated"
            raise forms.ValidationError(
                msg,
                params={"latituded": ddlat, "longitude": ddlon},
                code="missing_lat",
            )

        if ddlat is not None and ddlon is None:
            msg = "Longitude is required if Latitude is populated"
            raise forms.ValidationError(
                msg,
                params={"latituded": ddlat, "longitude": ddlon},
                code="missing_lon",
            )

        # if either lat or lon in populated, the other needs to be populated too.

        # check for:
        # valid dates
        # state - lake
        # statdist -lake
        # grid - lake
