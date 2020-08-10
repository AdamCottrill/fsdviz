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

from .models import CWT

from .validators import validate_cwt


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

        tag_type = cleaned_data.get("tag_type")
        manufacturer = cleaned_data.get("manufacturer")
        sequence_start = cleaned_data.get("sequence_start")
        sequence_end = cleaned_data.get("sequence_end")

        if tag_type == "sequential":
            if manufacturer != "nmt":
                msg = "Sequential tags are only manufactured by NMT."
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

            if sequence_start is None and sequence_end is None:
                msg = "Sequence start and end must be provided for sequential tags."
                raise forms.ValidationError(msg)

            if sequence_start >= sequence_end:
                msg = "Sequence start must be less than sequence end."
                raise forms.ValidationError(msg)


class BaseCWTSequenceFormSet(forms.Form):
    def clean(self):
        """We need ensure that none of our CWTSequence objects are duplicated.
        """
        if any(self.errors):
            return
        # titles = []
        # for form in self.forms:
        #     if self.can_delete and self._should_delete_form(form):
        #         continue
        #     title = form.cleaned_data.get('title')
        #     if title in titles:
        #         raise forms.ValidationError("Articles in a set must have distinct titles.")
        #    titles.append(title)
