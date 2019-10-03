from django import forms
from django.db.models import Min, Max
from django.core.exceptions import ValidationError

from datetime import datetime

from ..stocking.models import (
    StockingEvent,
    LifeStage,
    StockingMethod,
    Condition,
    Strain,
)
from ..common.models import ManagementUnit, Lake, Agency, StateProvince, Species, Grid10


class FindEventsForm(forms.Form):

    # this is the right way, but causes pytest to complain....
    # year_range = StockingEvent.objects.aggregate(Min("year"), Max("year"))

    year_range = {"year__min": 1950, "year__max": 2020}

    MONTHS = (
        (1, "Jan"),
        (2, "Feb"),
        (3, "Mar"),
        (4, "Apr"),
        (5, "May"),
        (6, "Jun"),
        (7, "Jul"),
        (8, "Aug"),
        (9, "Sep"),
        (10, "Oct"),
        (11, "Nov"),
        (12, "Dec"),
        (0, "Unk"),
    )

    first_year = forms.IntegerField(
        label="Earliest Year",
        min_value=year_range["year__min"],
        max_value=year_range["year__max"],
        widget=forms.NumberInput(attrs={"placeholder": year_range["year__min"]}),
        required=False,
    )

    last_year = forms.IntegerField(
        label="Latest Year",
        min_value=year_range["year__min"],
        max_value=year_range["year__max"],
        widget=forms.NumberInput(attrs={"placeholder": year_range["year__max"]}),
        required=False,
    )

    months = forms.MultipleChoiceField(
        label="Stocking Month",
        widget=forms.SelectMultiple,
        choices=MONTHS,
        required=False,
    )

    months.widget.attrs["class"] = "ui dropdown"

    #   LAKE
    lake = forms.MultipleChoiceField(
        label="Lake", widget=forms.SelectMultiple, required=False
    )

    lake.widget.attrs["class"] = "ui dropdown"

    #   STATEPROV
    stateprov = forms.MultipleChoiceField(
        label="State/Province", widget=forms.SelectMultiple, required=False
    )

    stateprov.widget.attrs["class"] = "ui dropdown"

    #   AGENCY
    agency = forms.MultipleChoiceField(
        label="Agency", widget=forms.SelectMultiple, required=False
    )

    agency.widget.attrs["class"] = "ui dropdown"

    #   JURISDICTIOn
    jurisdiction = forms.MultipleChoiceField(
        label="Jurisdiction", widget=forms.SelectMultiple, required=False
    )

    jurisdiction.widget.attrs["class"] = "ui dropdown"

    #    #   MANGEMENT UNIT
    #    manUnit = forms.ModelMultipleChoiceField(
    #        queryset=ManagementUnit.objects.all(),
    #        to_field_name='slug',
    #        required=False)
    #
    #    manUnit.widget.attrs['class'] = 'ui dropdown'

    #   SPECIES
    species = forms.MultipleChoiceField(
        label="Species", widget=forms.SelectMultiple, required=False
    )

    species.widget.attrs["class"] = "ui dropdown"

    strain = forms.MultipleChoiceField(
        label="Strain", widget=forms.SelectMultiple, required=False
    )

    strain.widget.attrs["class"] = "ui dropdown"

    life_stage = forms.MultipleChoiceField(
        label="Life Stage", widget=forms.SelectMultiple, required=False
    )

    life_stage.widget.attrs["class"] = "ui dropdown"

    stocking_method = forms.MultipleChoiceField(
        label="Stocking Method", widget=forms.SelectMultiple, required=False
    )

    stocking_method.widget.attrs["class"] = "ui dropdown"

    def clean(self):

        first_year = self.cleaned_data.get("first_year")
        last_year = self.cleaned_data.get("last_year")

        if first_year and last_year:
            if first_year > last_year:
                raise ValidationError("Earliest year occurs after latest year.")
        return self.cleaned_data


#    #   STRAIN
#    # this might need to be deactivated until at least one species is selected
#    strain = forms.ModelMultipleChoiceField(
#        queryset=Strain.objects.all(), to_field_name="strain_code"
#    )
#
#    strain.widget.attrs["class"] = "ui dropdown"


# validation: first year must be <= last year.


class MySelect(forms.Select):
    """A custom widget that will add 'disalbed' attribute to any select
    options that don't have an id - mistakes passed in from Excel."""

    def create_option(self, *args, **kwargs):
        option = super().create_option(*args, **kwargs)
        if option.get("value") == "":
            option["attrs"]["selected"] = "selected"
            option["attrs"]["disabled"] = "disabled"
        return option


class XlsEventForm(forms.Form):
    """A form to capture stocking events in spreadsheet form, validate
    them, and convert them to stocking event model instances."""

    # def __init__(self, *args, choices, **kwargs):
    #     self.choices = choices
    #     super().__init__(*args, **kwargs)

    def __init__(self, *args, **kwargs):
        self.choices = kwargs.pop("choices", None)
        super(XlsEventForm, self).__init__(*args, **kwargs)

        # we can actally use use self.initial.get('lake') to modify our
        # lookup if we want:

        lake = self.initial.get("lake", "HU")

        self.fields["lake"].choices = self.choices.get("lakes", [])
        self.fields["state_prov"].choices = self.choices.get("state_prov")
        self.fields["stat_dist"].choices = self.choices.get("stat_dist", []).get(
            lake, []
        )
        self.fields["grid"].choices = self.choices.get("grids", []).get(lake, [])

        self.fields["agency"].choices = self.choices.get("agencies")
        self.fields["species"].choices = self.choices.get("species")
        self.fields["stock_meth"].choices = self.choices.get("stocking_method")
        self.fields["stage"].choices = self.choices.get("lifestage")
        self.fields["condition"].choices = self.choices.get("condition")

        # if our intitial data contains values that are not in our list of choices
        # add it to front of each list with a "" as its id (that will automaticlly
        # disable it in html when it is rendered).

        fields = [
            "lake",
            "state_prov",
            "stat_dist",
            "grid",
            "agency",
            "species",
            "stock_meth",
            "stage",
            "condition",
        ]

        if self.initial:
            for fld in fields:
                val = self.initial[fld]
                if val not in [x[0] for x in self.fields[fld].choices]:
                    self.fields[fld].choices.insert(0, ("", val))

    MONTHS = (
        (1, "Jan"),
        (2, "Feb"),
        (3, "Mar"),
        (4, "Apr"),
        (5, "May"),
        (6, "Jun"),
        (7, "Jul"),
        (8, "Aug"),
        (9, "Sep"),
        (10, "Oct"),
        (11, "Nov"),
        (12, "Dec"),
        ("", "Unk"),
    )

    # not sure if the the best approach:
    DAYS = [("", "Ukn")] + list(zip(range(1, 32), range(1, 32)))

    agency = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    lake = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    state_prov = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    year = forms.IntegerField(
        min_value=1950, max_value=datetime.now().year, required=True
    )
    month = forms.ChoiceField(choices=MONTHS)
    day = forms.ChoiceField(choices=DAYS)
    stat_dist = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    grid = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    site = forms.CharField(required=True)
    st_site = forms.CharField(required=False)
    ##{'bbox': (-92.0940772277101, 41.3808069346309, -76.0591720893562, 49.0158109434947)}
    latitude = forms.FloatField(min_value=41.3, max_value=49.1)
    longitude = forms.FloatField(min_value=-92.0, max_value=-76.0)
    species = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    strain = forms.CharField(required=True)
    stage = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    agemonth = forms.IntegerField(min_value=0, required=False)
    year_class = forms.IntegerField(
        min_value=1950, max_value=(datetime.now().year + 1), required=False
    )
    mark = forms.CharField(required=False)
    mark_eff = forms.FloatField(min_value=0, max_value=100, required=False)
    tag_no = forms.CharField(required=False)
    tag_ret = forms.FloatField(min_value=0, max_value=100, required=False)
    length = forms.FloatField(min_value=0, required=False)
    weight = forms.FloatField(min_value=0, required=False)
    condition = forms.ChoiceField(choices=[], required=False, widget=MySelect)
    stock_meth = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    no_stocked = forms.IntegerField(required=True)
    lot_code = forms.CharField(required=False)
    validation = forms.IntegerField(min_value=0, max_value=10, required=False)
    notes = forms.CharField(required=False)

    # flags for front end javascript validation for fields that are
    # related to one another
    year.widget.attrs["data-validate"] = "validate-year"
    month.widget.attrs["data-validate"] = "validate-month"
    day.widget.attrs["data-validate"] = "validate-day"
    grid.widget.attrs["data-validate"] = "validate-grid"
    stat_dist.widget.attrs["data-validate"] = "validate-stat_dist"

    agency.widget.attrs["data-validate"] = "validate-agency"
    lake.widget.attrs["data-validate"] = "validate-lake"
    state_prov.widget.attrs["data-validate"] = "validate-state_prov"
    site.widget.attrs["data-validate"] = "validate-site"
    latitude.widget.attrs["data-validate"] = "validate-latitude"
    longitude.widget.attrs["data-validate"] = "validate-longitude"
    species.widget.attrs["data-validate"] = "validate-species"
    strain.widget.attrs["data-validate"] = "validate-strain"
    stock_meth.widget.attrs["data-validate"] = "validate-stock_meth"
    stage.widget.attrs["data-validate"] = "validate-stage"
    agemonth.widget.attrs["data-validate"] = "validate-agemonth"
    year_class.widget.attrs["data-validate"] = "validate-year_class"
    mark.widget.attrs["data-validate"] = "validate-mark"
    mark_eff.widget.attrs["data-validate"] = "validate-mark_eff"
    tag_no.widget.attrs["data-validate"] = "validate-tag_no"
    tag_ret.widget.attrs["data-validate"] = "validate-tag_ret"
    length.widget.attrs["data-validate"] = "validate-length"
    weight.widget.attrs["data-validate"] = "validate-weight"
    no_stocked.widget.attrs["data-validate"] = "validate-no_stocked"
    condition.widget.attrs["data-validate"] = "validate-condition"
    lot_code.widget.attrs["data-validate"] = "validate-lot_code"
    validation.widget.attrs["data-validate"] = "validate-validation"
    notes.widget.attrs["data-validate"] = "validate-notes"

    def clean_grid(self):

        lake = self.cleaned_data.get("lake", "")
        grid = self.cleaned_data.get("grid", "")
        grids = self.choices.get("grids").get(lake)

        if grids is None:
            msg = "Unable to find any grids for lake '%(lake)s'"
            raise forms.ValidationError(msg, params={"lake": lake}, code="grid")

        if grid not in [x[0] for x in grids]:
            msg = "Grid %(grid)s is not valid for lake %(lake)s".format(grid, lake)
            raise forms.ValidationError(
                msg, params={"grid": grid, "lake": lake}, code="grid"
            )

        return grid

    def clean_stat_dist(self):

        lake = self.cleaned_data.get("lake", "")
        stat_dist = self.cleaned_data.get("stat_dist", "")
        stat_dists = self.choices.get("stat_dist").get(lake)

        if stat_dists is None:
            msg = "Unable to find any Statistical Districts for lake '%(lake)s'"
            raise forms.ValidationError(msg, params={"lake": lake}, code="stat_dist")

        if stat_dist not in [x[0] for x in stat_dists]:
            msg = "Stat_Dist %(stat_dist)s is not valid for lake %(lake)s"
            raise forms.ValidationError(
                msg, params={"stat_dist": stat_dist, "lake": lake}, code="stat_dist"
            )
        return stat_dist

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
                event_date = datetime(int(year), int(month), int(day))
            except ValueError:
                msg = "Day, month, and year do not form a valid date."
                raise forms.ValidationError(msg, code="invalid_date")

        # check for:
        # valid dates
        # state - lake
        # statdist -lake
        # grid - lake


class StockingEventForm(forms.Form):
    """A form to capture stocking events.  Given the custom logic required
    to populate related fields, a model form seemed too restrictive."""

    def __init__(self, *args, **kwargs):
        self.choices = kwargs.pop("choices", None)
        super(StockingEventForm, self).__init__(*args, **kwargs)

        self.fields["lake_id"].choices = self.choices.get("lakes", [])
        self.fields["state_prov_id"].choices = self.choices.get("state_provs")
        self.fields["management_unit_id"].choices = self.choices.get("managementUnits")
        self.fields["grid_10_id"].choices = self.choices.get("grids")
        self.fields["agency_id"].choices = self.choices.get("agencies")
        self.fields["species_id"].choices = self.choices.get("species")
        self.fields["strain_raw_id"].choices = self.choices.get("strains")
        self.fields["stocking_method_id"].choices = self.choices.get("stocking_methods")
        self.fields["lifestage_id"].choices = self.choices.get("lifestages")
        self.fields["condition_id"].choices = self.choices.get("conditions")

        # if our intitial data contains values that are not in our list of choices
        # add it to front of each list with a "" as its id (that will automaticlly
        # disable it in html when it is rendered).

    MONTHS = (
        (1, "Jan"),
        (2, "Feb"),
        (3, "Mar"),
        (4, "Apr"),
        (5, "May"),
        (6, "Jun"),
        (7, "Jul"),
        (8, "Aug"),
        (9, "Sep"),
        (10, "Oct"),
        (11, "Nov"),
        (12, "Dec"),
        ("", "Unk"),
    )

    # not sure if the the best approach:
    DAYS = [("", "Ukn")] + list(zip(range(1, 32), range(1, 32)))

    #  ** WHO **
    agency_id = forms.ChoiceField(choices=[], required=True, widget=MySelect)

    #  ** WHAT **
    species_id = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    strain_raw_id = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    # strain = forms.CharField(required=True)

    #  ** WHEN **
    year = forms.IntegerField(
        min_value=1950, max_value=datetime.now().year, required=True
    )
    month = forms.ChoiceField(choices=MONTHS)
    day = forms.ChoiceField(choices=DAYS)
    date = forms.DateField()

    #  ** WHERE **
    lake_id = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    state_prov_id = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    # jurisdiction_id = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    management_unit_id = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    grid_10_id = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    dd_lat = forms.FloatField(min_value=41.3, max_value=49.1)
    dd_lon = forms.FloatField(min_value=-92.0, max_value=-76.0)

    site = forms.CharField(required=True)
    st_site = forms.CharField(required=False)

    no_stocked = forms.IntegerField(required=True)
    stocking_method_id = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    year_class = forms.IntegerField(
        min_value=1950, max_value=(datetime.now().year + 1), required=False
    )
    lifestage_id = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    agemonth = forms.IntegerField(min_value=0, required=False)

    mark = forms.CharField(required=False)
    mark_eff = forms.FloatField(min_value=0, max_value=100, required=False)
    tag_no = forms.CharField(required=False)
    tag_ret = forms.FloatField(min_value=0, max_value=100, required=False)
    length = forms.FloatField(min_value=0, required=False)
    weight = forms.FloatField(min_value=0, required=False)
    condition_id = forms.ChoiceField(choices=[], required=False, widget=MySelect)
    validation = forms.IntegerField(min_value=0, max_value=10, required=False)
    lot_code = forms.CharField(required=False)
    notes = forms.CharField(required=False)
