from django import forms
from django.db.models import Min, Max
from django.core.exceptions import ValidationError

from ..stocking.models import StockingEvent

class FindEventsForm(forms.Form):

    year_range = StockingEvent.objects.aggregate(Min('year'), Max('year'))

    MONTHS = ((1, "Jan"), (2, "Feb"), (3, "Mar"), (4, "Apr"), (5, "May"),
              (6, "Jun"), (7, "Jul"), (8, "Aug"), (9, "Sep"), (10, "Oct"),
              (11, "Nov"), (12, "Dec"), (0, "Unk"))

    first_year = forms.IntegerField(
        label='Earliest Year',
        min_value=year_range['year__min'],
        max_value=year_range['year__max'],
        widget=forms.NumberInput(
            attrs={'placeholder': year_range['year__min']}),
        required=False)

    last_year = forms.IntegerField(
        label='Latest Year',
        min_value=year_range['year__min'],
        max_value=year_range['year__max'],
        widget=forms.NumberInput(
            attrs={'placeholder': year_range['year__max']}),
        required=False)

    months = forms.MultipleChoiceField(
        label="Stocking Month",
        widget=forms.SelectMultiple,
        choices=MONTHS,
        required=False)

    months.widget.attrs['class'] = 'ui dropdown'

    #   LAKE
    lake = forms.MultipleChoiceField(
        label="Lake", widget=forms.SelectMultiple, required=False)

    lake.widget.attrs['class'] = 'ui dropdown'

    #   STATEPROV
    stateprov = forms.MultipleChoiceField(
        label="State/Province", widget=forms.SelectMultiple, required=False)

    stateprov.widget.attrs['class'] = 'ui dropdown'

    #   AGENCY
    agency = forms.MultipleChoiceField(
        label="Agency", widget=forms.SelectMultiple, required=False)

    agency.widget.attrs['class'] = 'ui dropdown'

    #   JURISDICTIOn
    jurisdiction = forms.MultipleChoiceField(
        label="Jurisdiction", widget=forms.SelectMultiple, required=False)

    jurisdiction.widget.attrs['class'] = 'ui dropdown'

    #    #   MANGEMENT UNIT
    #    manUnit = forms.ModelMultipleChoiceField(
    #        queryset=ManagementUnit.objects.all(),
    #        to_field_name='slug',
    #        required=False)
    #
    #    manUnit.widget.attrs['class'] = 'ui dropdown'


    #   SPECIES
    species = forms.MultipleChoiceField(
        label="Species", widget=forms.SelectMultiple, required=False)

    species.widget.attrs['class'] = 'ui dropdown'

    strain = forms.MultipleChoiceField(
        label="Strain", widget=forms.SelectMultiple, required=False)

    strain.widget.attrs['class'] = 'ui dropdown'

    life_stage = forms.MultipleChoiceField(
        label="Life Stage", widget=forms.SelectMultiple, required=False)

    life_stage.widget.attrs['class'] = 'ui dropdown'

    stocking_method = forms.MultipleChoiceField(
        label="Stocking Method", widget=forms.SelectMultiple, required=False)

    stocking_method.widget.attrs['class'] = 'ui dropdown'

    def clean(self):

        first_year = self.cleaned_data.get('first_year')
        last_year = self.cleaned_data.get('last_year')

        if (first_year and last_year):
            if (first_year > last_year):
                raise ValidationError("Earliest year occurs after latest year.")
        return self.cleaned_data


#    #   STRAIN
#    #this might need to be deactivated until at least one species is selected
#    strain = forms.ModelMultipleChoiceField(
#        queryset=Strain.objects.all(), to_field_name='strain_code')
#
#    strain.widget.attrs['class'] = 'ui dropdown'

# validation: first year must be <= last year.
