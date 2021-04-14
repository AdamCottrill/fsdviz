from django import forms

from django.forms import ValidationError
from django.contrib.gis.forms.fields import PolygonField
from leaflet.forms.widgets import LeafletWidget
from datetime import datetime

from fsdviz.common.validators import cwt_list_validator
from fsdviz.common.constants import MONTHS


class FindEventsForm(forms.Form):
    """this form is used to find stocking events that match the criteria
    provided by the user, inlucding an arbitrary region of interest.  The
    choices are populated via javascript when the form is loaded so the
    they can be dynamically filtered to include only those choices that
    are available given the exsiting filters.

    """

    roi = PolygonField(
        widget=LeafletWidget(),
        required=False,
    )

    # this is the right way, but causes pytest to complain....
    # year_range = StockingEvent.objects.aggregate(Min("year"), Max("year"))
    year_range = {"year__min": 1950, "year__max": datetime.now().year}

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
        label="Lake",
        widget=forms.SelectMultiple,
        required=False,
        error_messages={"errorlist": "Please limit your choices to the list."},
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


class FindCWTEventsForm(FindEventsForm):
    """The FindCWTEvetns form is exactly the same as the FindEventsForm,
    with an additional field and associated clean method for cwts."""

    cwt_number = forms.CharField(
        label="CWT Number(s)",
        required=False,
        validators=[
            cwt_list_validator,
        ],
    )

    def clean_cwt_number(self):
        """strip out any spaces and repace any semi-colons with commas"""
        cwt_numbers = self.cleaned_data.get("cwt_number")
        if cwt_numbers:
            cwt_numbers = (
                cwt_numbers.replace(" ", "").replace(";", ",").replace("-", "")
            )
            return cwt_numbers.strip()
        else:
            return None
