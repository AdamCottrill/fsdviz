from django import forms

from ..common.models import (Lake, Agency, Jurisdiction, ManagementUnit,
                             StateProvince, Species, Strain)
from ..stocking.models import LifeStage, StockingMethod

from ..common.widgets import SemanticDatePicker


class FindEventsForm(forms.Form):

    MONTHS = ((1, "Jan"), (2, "Feb"), (3, "Mar"), (4, "Apr"), (5, "May"),
              (6, "Jun"), (7, "Jul"), (8, "Aug"), (9, "Sep"), (10, "Oct"),
              (11, "Nov"), (12, "Dec"), (0, "Unk"))

    # lake(s)
    # species
    # strain(s)
    # agency(ies)

    first_year = forms.IntegerField(
        label='First Year', min_value=1960, max_value=2018, required=False)

    last_year = forms.IntegerField(
        label='Last Year', min_value=1960, max_value=2018, required=False)

    first_date = forms.DateField(
        label='First Date', widget=SemanticDatePicker, required=False)
    last_date = forms.DateField(
        label='Last Date', widget=SemanticDatePicker, required=False)

    months = forms.MultipleChoiceField(
        label="Stocking Month",
        widget=forms.SelectMultiple,
        choices=MONTHS, required=False)

    months.widget.attrs['class'] = 'ui dropdown'

    #   LAKE
    lake = forms.ModelMultipleChoiceField(
        queryset=Lake.objects.all(), to_field_name='abbrev', required=False)

    lake.widget.attrs['class'] = 'ui dropdown'

    #   STATEPROV
    stateprov = forms.ModelMultipleChoiceField(
        queryset=StateProvince.objects.all(),
        to_field_name='abbrev',
        required=False)

    stateprov.widget.attrs['class'] = 'ui dropdown'

    #   AGENCY
    agency = forms.ModelMultipleChoiceField(
        queryset=Agency.objects.all(), to_field_name='abbrev', required=False)

    agency.widget.attrs['class'] = 'ui dropdown'

    #   JURISDICTIOn
    jurisdiction = forms.ModelMultipleChoiceField(
        queryset=Jurisdiction.objects.all(),
        to_field_name='slug',
        required=False)

    jurisdiction.widget.attrs['class'] = 'ui dropdown'

    #   MANGEMENT UNIT
    manUnit = forms.ModelMultipleChoiceField(
        queryset=ManagementUnit.objects.all(),
        to_field_name='slug',
        required=False)

    manUnit.widget.attrs['class'] = 'ui dropdown'

    #   SPECIES
    species = forms.ModelMultipleChoiceField(
        queryset=Species.objects.all(), to_field_name='abbrev', required=False)

    species.widget.attrs['class'] = 'ui dropdown'

    strain = forms.ModelMultipleChoiceField(
        queryset=(Strain.objects.values('id', 'strain_code',
                                        'strain_label').distinct().order_by()),
        required=False)

    strain.widget.attrs['class'] = 'ui dropdown'

    life_stage = forms.ModelMultipleChoiceField(
        queryset=LifeStage.objects.all(),
        to_field_name='abbrev',
        required=False)

    life_stage.widget.attrs['class'] = 'ui dropdown'

    stocking_method = forms.ModelMultipleChoiceField(
        queryset=StockingMethod.objects.all(),
        to_field_name='stk_meth',
        required=False)

    stocking_method.widget.attrs['class'] = 'ui dropdown'


#    #   STRAIN
#    #this might need to be deactivated until at least one species is selected
#    strain = forms.ModelMultipleChoiceField(
#        queryset=Strain.objects.all(), to_field_name='strain_code')
#
#    strain.widget.attrs['class'] = 'ui dropdown'

# validation: first year must be <= last year.
