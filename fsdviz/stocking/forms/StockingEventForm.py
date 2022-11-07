from datetime import datetime

from django import forms
from django.forms import ValidationError
from fsdviz.common.models import Jurisdiction
from fsdviz.common.utils import int_or_none
from fsdviz.common.validators import validate_cwt
from fsdviz.common.widgets import MySelect, SemanticDatePicker
from fsdviz.stocking.models import FinClip, FishTag, StockingEvent

from ..utils import get_or_create_cwt_sequence


class StockingEventForm(forms.Form):
    """A form to capture stocking events.  Given the custom logic required
    to populate related fields, a model form seemed too restrictive."""

    def __init__(self, *args, **kwargs):

        self.choices = kwargs.pop("choices", None)
        # has cwts reflects the current state in the database, formset
        # reflects currently submitted form.
        self.cwt_formset = kwargs.pop("cwt_formset", None)
        self.has_cwts = kwargs.pop("has_cwts", False)
        self.user = kwargs.pop("user", None)

        super(StockingEventForm, self).__init__(*args, **kwargs)

        self.fields["state_prov_id"].choices = self.choices.get("state_provs")
        self.fields["management_unit_id"].choices = self.choices.get("managementUnits")
        self.fields["grid_10_id"].choices = self.choices.get("grids")

        self.fields["species_id"].choices = self.choices.get("species")
        self.fields["strain_raw_id"].choices = self.choices.get("strains")
        self.fields["stocking_method_id"].choices = self.choices.get("stocking_methods")
        self.fields["lifestage_id"].choices = self.choices.get("lifestages")
        self.fields["condition_id"].choices = self.choices.get("conditions")

        # new spring 2020:
        self.fields["hatchery_id"].choices = [("", "-------")] + self.choices.get(
            "hatcheries"
        )
        self.fields["physchem_marks"].choices = [
            ("", "Select Mark(s)")
        ] + self.choices.get("physchem_marks")

        self.fields["fin_clips"].choices = [
            ("", "Select Fin Clip(s)")
        ] + self.choices.get("fin_clips")

        self.fields["fish_tags"].choices = [
            ("", "Select Tag Type(s)")
        ] + self.choices.get("fish_tags")

        # the choices for lake(s) and agency depend on the role of our user:

        if self.user.role == "glsc":
            self.fields["agency_id"].choices = self.choices.get("agencies")
            self.fields["lake_id"].choices = self.choices.get("lakes", [])
        else:

            self.fields["agency_id"].choices = [
                x
                for x in self.choices.get("agencies", [])
                if x[0] == self.user.agency.id
            ]
            self.fields["agency_id"].widget.attrs["readonly"] = True

            user_lakes = [x.id for x in self.user.lakes.all()]
            lake_choices = [
                x for x in self.choices.get("lakes", []) if x[0] in user_lakes
            ]
            self.fields["lake_id"].choices = lake_choices

        # if our intitial data contains values that are not in our list of choices
        # add it to front of each list with a "" as its id (that will automaticlly
        # disable it in html when it is rendered).

    # not sure if the the best approach:
    DAYS = [("", "Ukn")] + list(zip(range(1, 32), range(1, 32)))

    MONTH_CHOICES = [
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
    ]

    id = forms.CharField(widget=forms.HiddenInput(), required=False)

    #  ** WHO **
    agency_id = forms.ChoiceField(
        label="Agency", choices=[], required=True, widget=MySelect
    )

    hatchery_id = forms.ChoiceField(
        label="Hatchery", choices=[], required=False, widget=MySelect
    )

    #  ** WHAT **
    species_id = forms.ChoiceField(
        label="Species", choices=[], required=True, widget=MySelect
    )
    strain_raw_id = forms.ChoiceField(
        label="Strain", choices=[], required=True, widget=MySelect
    )
    # strain = forms.CharField(required=True)

    #  ** WHEN **
    year = forms.IntegerField(
        min_value=1950, max_value=datetime.now().year, required=True
    )
    month = forms.ChoiceField(choices=MONTH_CHOICES, required=False)
    day = forms.ChoiceField(choices=DAYS, required=False)
    date = forms.DateField(
        required=False,
        input_formats=["%B %d, %Y", "%Y-%m-%d"],
        widget=SemanticDatePicker(),
    )

    #  ** WHERE **
    lake_id = forms.ChoiceField(
        label="Lake", choices=[], required=True, widget=MySelect
    )
    state_prov_id = forms.ChoiceField(
        label="StateProvince", choices=[], required=True, widget=MySelect
    )
    # these spatial attributes are not required:
    # jurisdiction_id = forms.ChoiceField(choices=[], required=True, widget=MySelect)
    management_unit_id = forms.ChoiceField(
        label="Statistical District", choices=[], required=True, widget=MySelect
    )
    grid_10_id = forms.ChoiceField(
        label="10-Minute Grid", choices=[], required=True, widget=MySelect
    )
    dd_lat = forms.FloatField(
        label="Latitude (Decimal Degrees)",
        min_value=41.39,
        max_value=49.1,
        required=False,
        widget=forms.TextInput(),
    )
    dd_lon = forms.FloatField(
        label="Longitude (Decimal Degrees)",
        min_value=-92.3,
        max_value=-74.35,
        required=False,
        widget=forms.TextInput(),
    )

    latlong_flag_id = forms.CharField(widget=forms.HiddenInput(), required=False)

    site = forms.CharField(label="Site Name (General)", required=True)
    st_site = forms.CharField(label="Site Name (Specific)", required=False)

    no_stocked = forms.IntegerField(required=True, min_value=1)
    stocking_method_id = forms.ChoiceField(
        label="Stocking Method", choices=[], required=True, widget=MySelect
    )
    year_class = forms.IntegerField(
        label="Year Class",
        min_value=1950,
        max_value=(datetime.now().year + 1),
        required=True,
    )
    lifestage_id = forms.ChoiceField(
        label="Life Stage", choices=[], required=True, widget=MySelect
    )
    agemonth = forms.IntegerField(label="Age (months)", min_value=0, required=False)

    tag_no = forms.CharField(
        label="CWT Numbers",
        help_text="Comma separated list of 6-digit cwt numbers",
        required=False,
    )
    tag_ret = forms.FloatField(
        label="Tag Retention", min_value=0, max_value=100, required=False
    )
    length = forms.IntegerField(label="Avg. Length (mm)", min_value=1, required=False)
    weight = forms.FloatField(
        label="Total Weight (kg)",
        error_messages={
            "invalid": "Enter a number greater than or equal to 0.01.",
            "min_value": "Weight is optional, but must be greater than or equal to 0.01.",
        },
        min_value=0.01,
        required=False,
    )
    condition_id = forms.ChoiceField(
        label="General Condition", choices=[], required=False, widget=MySelect
    )
    # validation = forms.ChoiceField(
    #     label="Data Entry Validation",
    #     choices=StockingEvent.VALIDATION_CODE_CHOICES,
    #     required=False,
    # )

    lotcode = forms.CharField(label="Agency Lot Code", required=False)
    agency_stock_id = forms.CharField(label="Agency Stock ID", required=False)

    notes = forms.CharField(
        label="Additional Notes",
        required=False,
        widget=forms.Textarea(attrs={"rows": 4}),
    )

    fish_tags = forms.MultipleChoiceField(
        label="Tags", choices=[], required=False, widget=forms.SelectMultiple
    )
    fish_tags.widget.attrs["class"] = "ui fluid dropdown"

    fin_clips = forms.MultipleChoiceField(
        label="Fin Clips", choices=[], required=False, widget=forms.SelectMultiple
    )
    fin_clips.widget.attrs["class"] = "ui fluid dropdown"

    physchem_marks = forms.MultipleChoiceField(
        label="Physical/Chemical Marks",
        choices=[],
        required=False,
        widget=forms.SelectMultiple,
    )
    physchem_marks.widget.attrs["class"] = "ui fluid dropdown"
    # mark is going away soon - mark eff is staying.
    mark = forms.CharField(label="Marks Applied", required=False)
    mark_eff = forms.FloatField(
        label="Marking Efficiency", min_value=0, max_value=100, required=False
    )

    # finclip, tags and physchem marks are many to many that we have
    # explicitly added a 'None' value to.  - we will need to ensure
    # that it renders with None seelcted if those eleemnts are empty,
    # and returned as empty when the elements are cleaned.

    def clean_day(self):
        """make sure that the day value is an integer or None"""
        val = self.cleaned_data["day"]
        return int_or_none(val)

    def clean_month(self):
        """make sure that the month value is an integer or None"""
        val = self.cleaned_data["month"]
        return int_or_none(val)

    def clean(self):
        """Clean is our last chance to verify fields that depend on each other
        and remove or add any data elements that don't match between a
        stocking event and our stocking event form."""

        # temportal fields - day, month, year
        # spatial fields
        # lat-lon flag
        # clips
        # marks
        # cwts

        # jurisdiction

        super(StockingEventForm, self).clean()

        data = self.cleaned_data

        lake_id = data.pop("lake_id", 0)
        stateprov_id = data.pop("state_prov_id", 0)
        # data["stateProv"] = StateProvince.objects.get(id=state_prov_id)

        jurisdiction = Jurisdiction.objects.filter(
            stateprov_id=stateprov_id, lake_id=lake_id
        ).first()

        if jurisdiction:
            data["jurisdiction"] = jurisdiction
        else:
            msg = "The provided combination of lake and state/province is not valid."
            raise forms.ValidationError(msg, code="invalid_jurisdiction")

        # DATE
        year = data.get("year", "0")
        month = data.get("month")
        day = data.get("day")

        # if month and not day:
        #    msg = "Please provide a day to complete the event date"
        #    raise forms.ValidationError(msg, code="missing_day")
        if day and not month:
            msg = "Please provide a month to complete the event date."
            raise forms.ValidationError(msg, code="missing_month")

        event_date = None
        if month and day:
            try:
                event_date = datetime(int(year), int(month), int(day))
            except ValueError:
                msg = "Day, month, and year do not form a valid date."
                raise forms.ValidationError(msg, code="invalid_date")
        if event_date:
            self.cleaned_data["date"] = event_date

        # LAT-LON
        dd_lat = data.get("dd_lat")
        dd_lon = data.get("dd_lon")

        if dd_lat and not dd_lon:
            msg = "Longitude is required if Latitude is provided."
            raise forms.ValidationError(msg, code="missing_dd_lon")

        if dd_lon and not dd_lat:
            msg = "Latitude is required if Longitude is provided."
            raise forms.ValidationError(msg, code="missing_dd_lat")

        # ===============================================
        #  FISH TAGS, RETENTION AND CWT FORMSET

        fish_tags = data.get("fish_tags", [])
        tag_ret = data.get("tag_ret")

        if tag_ret and not fish_tags:
            msg = "At least one Fish Tag Type must be selected if Tag Retention is provided."
            raise forms.ValidationError(msg, code="missing_fish_tag")

        # # if cwt_number is populated - cwt must be one of the tag types.
        cwt_numbers = data.get("cwt_numbers")
        validate_cwt(cwt_numbers)

        cwts = False
        # cwt_formset = self.cwt_formset if self.cwt_formset else False

        if self.cwt_formset:
            if len(self.cwt_formset):
                # filter out any cwts we are going to delete and see if there are any left:
                cwts = (
                    all([True for x in self.cwt_formset if x.get("delete") is False])
                    if self.cwt_formset
                    else False
                )

        # there are some cwts listed, but cwt is not selected
        if cwts and "CWT" not in fish_tags:
            msg = "Tag type 'CWT' needs to be selected if cwts are associated with this event."
            raise forms.ValidationError(msg, code="invalid_missing_tagtype")

        # cwt is selected but there are not cwts
        if cwts is False and "CWT" in fish_tags:
            msg = "At least one CWT needs to be associated with this event if tag type 'CWT' is selected."
            raise forms.ValidationError(msg, code="invalid_missing_cwt")

        # FINCLIPS, MARKS and MARK EFFICIENCY

        physchem_marks = data.get("physchem_marks")
        fin_clips = data.get("fin_clips")
        mark_eff = data.get("mark_eff")

        if mark_eff and not (physchem_marks or fin_clips):
            msg = (
                "At least one Physical or Chemical Mark or Fin Clip must be selected if "
                + "Mark Efficiency is provided."
            )
            raise forms.ValidationError(msg, code="missing_physchem_mark")

        fin_clips = self.cleaned_data.get("fin_clips", [])

        if ("NO" in fin_clips or "UN" in fin_clips) and len(fin_clips) > 1:
            if "NO" in fin_clips:
                msg = '"No fin clip (NO)" cannot be combined with another fin clip.'
                raise forms.ValidationError(
                    msg, code="invalid_finclip_includes_no_clip"
                )

            if "UN" in fin_clips:
                msg = (
                    '"Unknown fin clip (UN)" cannot be combined with another fin clip.'
                )
                raise forms.ValidationError(
                    msg, code="invalid_finclip_includes_unknown"
                )

        # Year class cannot be in the future or super old.
        year_class = data.get("year_class", 0)

        if year_class > year:
            msg = "Year class cannot be greater than stocking year."
            raise forms.ValidationError(msg, code="future_year_class")

        # this is a warning - for the front end if possible:
        # if (year - year_class) > 20:
        #     msg = "Those fish were more than 20 year old!"
        #    raise forms.ValidationError(msg, code="past_year_class")

        return data

    def save(self, *args, **kwargs):
        # super().save(*args, **kwargs)

        data = self.cleaned_data
        id = data.pop("id")
        instance = StockingEvent.objects.get(id=id)

        # pop off our many-to-many fields and add them to our
        # instannce as required:
        fin_clips = data.pop("fin_clips")
        instance.fin_clips.clear()

        if fin_clips:
            items = FinClip.objects.filter(abbrev__in=fin_clips)
            instance.fin_clips.set(items)

        physchem_marks = data.pop("physchem_marks")
        instance.physchem_marks.set(physchem_marks)

        fish_tags = data.pop("fish_tags")
        if fish_tags:
            items = FishTag.objects.filter(tag_code__in=fish_tags)
            instance.fish_tags.set(items)

        # instance.cwt_series.clear()

        series_list = []
        for item in self.cwt_formset:
            cwt_number = item.get("cwt_number")
            delete = item.get("delete", False)
            if cwt_number and not delete:
                try:
                    cwt_series = get_or_create_cwt_sequence(
                        cwt_number=cwt_number,
                        tag_type=item.get("tag_type"),
                        manufacturer=item.get("manufacturer"),
                        sequence=(
                            item.get("sequence_start", 0),
                            item.get("sequence_end", 1),
                        ),
                    )
                except ValidationError as err:
                    cwt_series = None
                    raise err
                if cwt_series is not None:
                    series_list.append(cwt_series)
                # instance.cwt_series.add(cwt_series)

        instance.cwt_series.set(series_list)

        for attr, value in data.items():
            setattr(instance, attr, value)

        instance.save()

        return instance
