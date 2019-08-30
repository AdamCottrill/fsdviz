from django import forms
from django.db.models import Min, Max
from django.core.exceptions import ValidationError

from datetime import datetime

from ..stocking.models import StockingEvent, LifeStage, StockingMethod, Condition
from ..common.models import ManagementUnit, Lake, Agency, StateProvince, Species, Grid10


class FindEventsForm(forms.Form):

    year_range = StockingEvent.objects.aggregate(Min("year"), Max("year"))

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
#    #this might need to be deactivated until at least one species is selected
#    strain = forms.ModelMultipleChoiceField(
#        queryset=Strain.objects.all(), to_field_name='strain_code')
#
#    strain.widget.attrs['class'] = 'ui dropdown'

# validation: first year must be <= last year.


class XlsEventForm(forms.Form):
    """A form to capture stocking events in spreadsheet form, validate
    them, and convert them to stocking event model instances."""

    def __init__(self, *args, choices, **kwargs):
        self.choices = choices
        super().__init__(*args, **kwargs)

        # we can actally use use self.initial.get('lake') to modify our
        # lookup if we want:

        lake = self.initial.get("lake")

        self.fields["lake"].choices = choices.get("lakes")
        self.fields["state_prov"].choices = choices.get("state_prov")
        self.fields["stat_dist"].choices = choices.get("stat_dist").get(lake)
        self.fields["grid"].choices = choices.get("grids").get(lake)

        self.fields["agency"].choices = choices.get("agencies")
        self.fields["species"].choices = choices.get("species")
        self.fields["stock_meth"].choices = choices.get("stocking_method")
        self.fields["stage"].choices = choices.get("lifestage")
        self.fields["condition"].choices = choices.get("condition")

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

    # first_year = StockingEvent.objects.aggregate(Min("year"))
    # # our lookups are of the form ('value', 'display')

    # LAKES = Lake.objects.all().values_list("abbrev", "abbrev")
    # AGENCIES = Agency.objects.all().values_list("abbrev", "abbrev")
    # STATE_PROV = StateProvince.objects.all().values_list("abbrev", "abbrev")
    # STAT_DIST = ManagementUnit.objects.filter(primary=True).values_list(
    #     "label", "label"
    # )
    # SPECIES = Species.objects.all().values_list("abbrev", "common_name")

    # LIFESTAGE = LifeStage.objects.all().values_list("abbrev", "abbrev")
    # CONDITION = Condition.objects.all().values_list("condition", "condition")
    # STOCKINGMETHOD = StockingMethod.objects.all().values_list("stk_meth", "stk_meth")

    # GRIDS = Grid10.objects.all().values_list("grid", "grid")

    agency = forms.ChoiceField(choices=[], required=True)
    lake = forms.ChoiceField(choices=[], required=True)
    state_prov = forms.ChoiceField(choices=[], required=True)
    year = forms.IntegerField(
        min_value=1950, max_value=datetime.now().year, required=True
    )
    month = forms.ChoiceField(choices=MONTHS)
    day = forms.ChoiceField(choices=DAYS)
    stat_dist = forms.ChoiceField(choices=[], required=True)
    grid = forms.ChoiceField(choices=[], required=True)
    site = forms.CharField(required=True)
    st_site = forms.CharField(required=True)
    ##{'bbox': (-92.0940772277101, 41.3808069346309, -76.0591720893562, 49.0158109434947)}
    latitude = forms.FloatField(min_value=41.3, max_value=49.1)
    longitude = forms.FloatField(min_value=-92.0, max_value=-76.0)
    species = forms.ChoiceField(choices=[], required=True)
    strain = forms.CharField(required=True)
    stock_meth = forms.ChoiceField(choices=[], required=True)
    stage = forms.ChoiceField(choices=[], required=True)
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
    no_stocked = forms.IntegerField(required=True)
    condition = forms.ChoiceField(choices=[], required=False)
    lot_code = forms.CharField(required=False)
    validation = forms.IntegerField(min_value=0, max_value=10, required=False)
    notes = forms.CharField(required=False)

    #   LAKE
    # lake = forms.ChoiceField(label="Lake", widget=forms.Select, required=True)
    # lake.widget.attrs["class"] = "ui dropdown"

    # #   STATEPROV
    # state_prov = forms.ChoiceField(
    #     label="State/Province", widget=forms.Select, required=True
    # )
    # state_prov.widget.attrs["class"] = "ui dropdown"

    # year = forms.IntegerField(
    #     label="Year",
    #     min_value=first_year["year__min"],
    #     max_value=datetime.now().year,
    #     required=True,
    # )

    # month = forms.ChoiceField(label="Month", choices=MONTHS, required=False)

    # day = forms.ChoiceField(label="Day", choices=list(range(1, 32)), required=False)
    # day.widget.attrs["class"] = "ui dropdown"

    # #   AGENCY
    # agency = forms.ChoiceField(label="Agency", widget=forms.Select, required=True)
    # agency.widget.attrs["class"] = "ui dropdown"

    # #   MANGEMENT UNIT
    # stat_dist = forms.ModelMultipleChoiceField(
    #     queryset=ManagementUnit.objects.filter(primary=True),
    #     to_field_name="slug",
    #     required=False,
    # )

    # stat_dist.widget.attrs["class"] = "ui dropdown"

    # #   SPECIES
    # species = forms.ChoiceField(label="Species", widget=forms.Select, required=True)

    # species.widget.attrs["class"] = "ui dropdown"

    # strain = forms.ChoiceField(label="Strain", widget=forms.Select, required=True)

    # strain.widget.attrs["class"] = "ui dropdown"

    # stage = forms.ChoiceField(label="Life Stage", widget=forms.Select, required=True)

    # stage.widget.attrs["class"] = "ui dropdown"

    # stock_method = forms.ChoiceField(
    #     label="Stocking Method", widget=forms.Select, required=True
    # )

    # stock_method.widget.attrs["class"] = "ui dropdown"

    def clean(self):
        # check for:
        # valid dates
        # state - lake
        # statdist -lake
        # grid - lake
        pass
