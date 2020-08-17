"""
=============================================================
~/fsdviz/fsdviz/common/forms.py
 Created: 05 Aug 2020 08:52:19

 DESCRIPTION:

 Forms used in common application

 A. Cottrill
=============================================================
"""


from django import forms

from psycopg2.extras import NumericRange

from .models import CWT, CWTsequence

from .validators import validate_cwt
from .utils import check_ranges


class CWTSequenceForm(forms.Form):
    """
    """

    delete = forms.BooleanField(required=False)

    cwt_number = forms.CharField(
        required=True,
        label="CWT Number",
        help_text="CWT number with leading zeros but without dashes or spaces.",
        max_length=8,
        # validator=validate_cwt,
    )
    manufacturer = forms.ChoiceField(
        label="Manufacturer", choices=CWT._meta.get_field("manufacturer").choices
    )
    tag_type = forms.ChoiceField(
        label="CWT Type",
        choices=CWT._meta.get_field("tag_type").choices,
        # add a class to our tag type widget so we can select it with js:
        widget=forms.Select(attrs={"class": "cwt-tag-type"}),
    )
    sequence_start = forms.IntegerField(label="Seq. Start", required=False, min_value=0)
    sequence_end = forms.IntegerField(label="Seq. End", required=False, min_value=0)

    def __init__(self, *args, **kwargs):
        super(CWTSequenceForm, self).__init__(*args, **kwargs)
        # self.fields["sequence_start"].disabled = True
        # self.fields["sequence_end"].disabled = True
        self.fields["manufacturer"].initial = "nmt"
        self.fields["tag_type"].initial = "cwt"

        self.fields["cwt_number"].widget.attrs.update(
            {"class": "cwt-mask", "placeholder": "__-__-__"}
        )

    def clean_cwt_number(self):
        """cwt must be 6 characters long and be
        only numbers (we may need to add dashes to accomodate USGS agency tags)."""
        cwt = self.cleaned_data["cwt_number"]
        if cwt:
            cwt = cwt.replace("-", "")
        errmsg = "CWT Number must be 6 digits (including leading 0's)."
        return validate_cwt(cwt, errmsg)

    def clean(self):
        """
        + if manufacturer is mm, type must be cwt

        + if type is cwt, seq_start and seq_end must be 1

        + if type=seq, seq_start and seq_end must be populated and
        seq_must be larger than seq_start
        """

        cleaned_data = super().clean()

        if cleaned_data.get("delete"):
            return cleaned_data

        cwt_number = cleaned_data.get("cwt_number")
        tag_type = cleaned_data.get("tag_type")
        manufacturer = cleaned_data.get("manufacturer")
        sequence_start = cleaned_data.get("sequence_start")
        sequence_end = cleaned_data.get("sequence_end")

        if tag_type == "sequential":
            if manufacturer != "nmt":
                msg = "Sequential tags are only manufactured by NMT."
                raise forms.ValidationError(msg)

            if sequence_start is None and sequence_end is None:
                msg = "Sequence start and end must be provided for sequential tags."
                raise forms.ValidationError(msg)

            if sequence_start is not None:
                if sequence_start == 0:
                    msg = "Minimum starting value for sequential tags is 1."
                    raise forms.ValidationError(msg)
            else:
                msg = "Sequence start must be provided for sequential tags."
                raise forms.ValidationError(msg)

            if sequence_end is not None:
                if sequence_end < 2:
                    msg = "Minimum ending value for sequential tags is 2."
                    raise forms.ValidationError(msg)
            else:
                msg = "Sequence end must be provided for sequential tags."
                raise forms.ValidationError(msg)

            if sequence_start >= sequence_end:
                msg = "Sequence start must be less than sequence end."
                raise forms.ValidationError(msg)

            # make sure that there aren't any exisitng sequential tags that
            # overlap with this one:
            sequence = NumericRange(sequence_start, sequence_end)
            overlap = (
                CWTsequence.objects.filter(sequence__overlap=sequence)
                .filter(
                    cwt__cwt_number=cwt_number,
                    cwt__tag_type=tag_type,
                    cwt__manufacturer=manufacturer,
                )
                .exclude(sequence=sequence)
                .first()
            )
            if overlap:
                msg = 'Sequence Range overlaps with existing series "{}"'.format(
                    overlap
                )
                raise forms.ValidationError(msg)

        return cleaned_data


class BaseCWTSequenceFormSet(forms.BaseFormSet):
    def clean(self):
        """We need ensure that none of our CWTSequence objects in our formset
        are duplicated and do not overlap. There is already a database
        constraint on overlapping ranges, but that only catches errors
        if one of our series overlaps with and existing one. We need
        to catch new series that overlap before they exist in the databse.

        """
        if any(self.errors):
            return

        tag_ranges = {}
        slugs = []
        for form in self.forms:
            if form.cleaned_data.get("delete"):
                continue
            cwt_number = form.cleaned_data.get("cwt_number")
            tag_type = form.cleaned_data.get("tag_type")
            manufacturer = form.cleaned_data.get("manufacturer")
            sequence_start = form.cleaned_data.get("sequence_start", "")
            sequence_end = form.cleaned_data.get("sequence_end", "")

            slug = "{}_{}_{}_{}_{}".format(
                cwt_number, manufacturer, tag_type, sequence_start, sequence_end
            )
            if slug in slugs:
                raise forms.ValidationError(
                    "CWTs must have unique numbers, manufacturers, types and sequence ranges!"
                )
            slugs.append(slug)

            # create a dictionary of sequence ranges for each cwt - if
            # any of the ranges (for the same cwt) overlap, throw an error.
            seq_range = (sequence_start, sequence_end)
            if tag_type == "sequential":
                overlap, tag_ranges = check_ranges(tag_ranges, cwt_number, seq_range)
                if overlap:
                    errmsg = "Sequence ranges overlap."
                    raise forms.ValidationError(errmsg)
