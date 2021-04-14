from django import forms

from datetime import datetime

from fsdviz.common.widgets import MySelect
from fsdviz.common.validators import validate_cwt
from fsdviz.common.utils import int_or_none
from fsdviz.common.constants import MONTHS


class XlsEventForm(forms.Form):
    """A form to capture stocking events in spreadsheet form, validate
    them, and convert them to stocking event model instances."""

    def __init__(self, *args, **kwargs):
        self.choices = kwargs.pop("choices", None)
        self.bbox = kwargs.pop("bbox", None)
        super(XlsEventForm, self).__init__(*args, **kwargs)

        self.fields["state_prov"].choices = self.choices.get("state_prov")
        self.fields["stat_dist"].choices = self.choices.get("stat_dist")
        self.fields["grid"].choices = self.choices.get("grids")

        self.fields["species"].choices = self.choices.get("species")
        self.fields["strain"].choices = self.choices.get("strain")

        self.fields["stock_meth"].choices = self.choices.get("stocking_method")
        self.fields["stage"].choices = self.choices.get("lifestage")
        self.fields["condition"].choices = self.choices.get("condition")
        self.fields["finclip"].choices = self.choices.get("finclips")

        # if our intitial data contains values that are not in our list of choices
        # add it to front of each list with a "" as its id (that will automaticlly
        # disable it in html when it is rendered).

        fields = [
            "state_prov",
            "stat_dist",
            "grid",
            "species",
            "strain",
            "stock_meth",
            "stage",
            "condition",
            "finclip",
        ]

        if self.initial:
            for fld in fields:
                val = self.initial[fld]
                if val not in [x[0] for x in self.fields[fld].choices]:
                    self.fields[fld].choices.insert(0, ("", val))

    # not sure if the the best approach:
    DAYS = [(None, "Unk")] + list(zip(range(1, 32), range(1, 32)))

    # agency = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    # lake = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    agency = forms.CharField(widget=forms.HiddenInput())
    lake = forms.CharField(widget=forms.HiddenInput())

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
    longitude = forms.FloatField(required=False, min_value=-92.0, max_value=-76.0)
    site = forms.CharField(required=True)
    st_site = forms.CharField(required=False)

    species = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    strain = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    # strain = forms.CharField(required=True)
    stage = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    agemonth = forms.IntegerField(min_value=0, required=False)
    year_class = forms.IntegerField(
        min_value=1950, max_value=(datetime.now().year + 1), required=False
    )

    tag_no = forms.CharField(required=False, validators=[validate_cwt])
    tag_ret = forms.FloatField(min_value=0, max_value=100, required=False)
    length = forms.FloatField(min_value=1, required=False, widget=forms.TextInput)
    weight = forms.FloatField(min_value=1, required=False, widget=forms.TextInput)

    condition = forms.ChoiceField(choices=[], required=False, widget=MySelect)
    stock_meth = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    no_stocked = forms.IntegerField(required=True, min_value=1)
    lot_code = forms.CharField(required=False)
    # validation = forms.IntegerField(min_value=0, max_value=10, required=False)
    notes = forms.CharField(required=False)

    # new Spring 2020
    finclip = forms.ChoiceField(choices=[], required=False, widget=MySelect)
    clip_efficiency = forms.FloatField(min_value=0, max_value=100, required=False)
    physchem_mark = forms.CharField(required=False)  # choice field some day
    tag_type = forms.ChoiceField(choices=[], required=False, widget=MySelect)
    hatchery = forms.CharField(required=False)  # choice field some day too
    agency_stock_id = forms.CharField(required=False)

    def clean_stateprov(self):
        """The jurisdiction must be limited to those that exist in the
        lake for this event. If lat-lon are provided and return a
        jurisdiction, it must be consistent with the reported
        jurisdiction.

        """
        pass

    def clean_stat_dist(self):
        """The statistiscal districut must be limited to one of the
        stat_districts found in the jurisdiction. If lat-lon are
        provided and return a stat_dist, it must be consistent with the
        reported stat_dist."""
        lake = self.cleaned_data.get("lake", "")
        stat_dist = self.cleaned_data.get("stat_dist", "")
        stat_dists = self.choices.get("stat_dist")

        if stat_dists is None:
            msg = "Unable to find any Statistical Districts for lake '%(lake)s'"
            raise forms.ValidationError(msg, params={"lake": lake}, code="stat_dist")

        if stat_dist not in [x[0] for x in stat_dists]:
            msg = "Stat_Dist %(stat_dist)s is not valid for lake %(lake)s"
            raise forms.ValidationError(
                msg, params={"stat_dist": stat_dist, "lake": lake}, code="stat_dist"
            )
        return stat_dist

    def clean_grid(self):
        """grid must be one of the grids in the provided lake that are
        associated with the seelcted management unit.  If lat-lon are
        provided and return a grid, it must be consistent with the
        reported grid."""
        lake = self.cleaned_data.get("lake", "")
        grid = self.cleaned_data.get("grid", "")
        grids = self.choices.get("grids")

        if grids is None:
            msg = "Unable to find any grids for lake '%(lake)s'"
            raise forms.ValidationError(msg, params={"lake": lake}, code="grid")

        if grid not in [x[0] for x in grids]:
            msg = "Grid {grid} is not valid for lake '{lake}'".format(grid, lake)
            raise forms.ValidationError(
                msg, params={"grid": grid, "lake": lake}, code="grid"
            )

        return grid

    def clean_strain(self):
        """The strain values passed in the xls form will be 'raw' strain
        values. They must be one of the raw strains associated with the
        species, and must be mapped to an existing strain object.

        Arguments:
        - `self`:

        """
        pass

    def clean_latitude(self):
        """If latitude is populated, it must be
        within the bounds of the associated lake (plus a small
        buffer set in the form and passed to the form).
        """
        ddlat = self.cleaned_data.get("latitude")
        bbox = self.bbox

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
        bbox = self.bbox

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

    def clean_tags(self):
        """The tags string must be six digits, or a series of 6-digit strins
        separated by a comma or semicolon

        """
        # # if cwt_number is populated - cwt must be one of the tag types.

        pass

    def clean_clips(self):
        """The value submitted for clips must be one of precompliled compoiste
        clip codes.  Specifically, BV and BP are not allow.  VLRV and
        LPRP must be used instead.

        """
        pass

    def clean_day(self):
        """make sure that the day value is an integer or None"""
        val = self.cleaned_data["day"]
        return int_or_none(val)

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
