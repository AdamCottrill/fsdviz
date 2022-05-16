from datetime import datetime

from django.contrib.gis.db import models
from django.contrib.gis.geos import Point
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db.models import F
from django.db.models.signals import post_save

from django.template.defaultfilters import slugify
from django.urls import reverse

from colorfield.fields import ColorField

from fsdviz.common.models import (
    Agency,
    CompositeFinClip,
    FinClip,
    FishTag,
    Grid10,
    Jurisdiction,
    Lake,
    LatLonFlag,
    ManagementUnit,
    Mark,
    PhysChemMark,
    Species,
    StateProvince,
    Strain,
    StrainRaw,
)
from fsdviz.common.utils import is_uuid4, unique_string
from fsdviz.myusers.models import CustomUser


class DataUploadEvent(models.Model):
    """
    A model to capture data upload events - who, when, which events...
    """

    uploaded_by = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="upload_events"
    )

    timestamp = models.DateTimeField(auto_now_add=True)

    agency = models.ForeignKey(
        Agency,
        on_delete=models.CASCADE,
        default="USFWS",
        to_field="abbrev",
        related_name="upload_events",
    )

    lake = models.ForeignKey(
        Lake,
        on_delete=models.CASCADE,
        default="HU",
        to_field="abbrev",
        related_name="upload_events",
    )

    comment = models.TextField(blank=True, null=True, help_text="Data Upload Comment.")
    slug = models.CharField(max_length=75, unique=True)

    def save(self, *args, **kwargs):
        """
        Populate slug when we save the object.
        """

        self.slug = self.generate_slug()

        super(DataUploadEvent, self).save(*args, **kwargs)

    def generate_slug(self):
        """Create the slug from the lake, agency, and timestamp."""
        lake = self.lake.abbrev
        agency = self.agency.abbrev
        if self.timestamp is None:
            upload_date = datetime.now()
        else:
            upload_date = self.timestamp

        date_string = upload_date.strftime("%b %d %Y %H:%M")

        return slugify("-".join([lake, agency, date_string]))

    def __str__(self):
        """A string representation of a data upload object"""

        lake = self.lake.abbrev
        agency = self.agency.abbrev
        if self.timestamp is None:
            upload_date = datetime.now()
        else:
            upload_date = self.timestamp

        date_string = upload_date.strftime("%b %d %Y %H:%M")

        return "{}-{} ({})".format(lake, agency, date_string)

    def get_absolute_url(self):

        return reverse("stocking:data-upload-event-detail", kwargs={"slug": self.slug})


class LifeStage(models.Model):
    """
    A model to capture the lifestage of the stocked fish.
    """

    abbrev = models.CharField(max_length=7, unique=True)
    description = models.CharField(max_length=100)
    color = ColorField(default="#FF0000")

    class Meta:
        ordering = ["abbrev"]

    def __str__(self):
        return "{} ({})".format(self.description, self.abbrev)


class YearlingEquivalent(models.Model):
    """A model to capture the species and lifestage specific factors used
    to convert the number of fish stocked to yearling equivalents

    """

    species = models.ForeignKey(
        Species, on_delete=models.CASCADE, related_name="yealing_equivalents"
    )

    lifestage = models.ForeignKey(
        LifeStage, on_delete=models.CASCADE, related_name="yealing_equivalents"
    )

    yreq_factor = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(1)],
    )

    comment = models.CharField(max_length=1000, blank=True, null=True)

    class Meta:
        unique_together = [["species", "lifestage"]]

    def __str__(self):
        return "{} [{}]: {:.3f}".format(self.species, self.lifestage, self.yreq_factor)


class Condition(models.Model):
    """
    A model to capture the condition of the stocked when they were
    stocked.
    """

    condition = models.IntegerField(unique=True)
    description = models.CharField(max_length=100)
    # colour field on this model causes all kinds of grief with migrations.
    # seems to be related to get_default_method??
    # color = ColorField(default="#FF0000")

    class Meta:
        ordering = ["condition"]

    def __str__(self):
        return "{} - {}".format(self.condition, self.description)


def get_default_condition():
    """a helper function to ensure that condition value is always
    populated, even if a value is not reported. 99 corresponds to 'Not
    Reported'."""
    condition, created = Condition.objects.get_or_create(condition=99)
    return condition.id


class StockingMethod(models.Model):
    """
    A model to capture the method used to the stock the fish.
    """

    stk_meth = models.CharField("Stocking Method", max_length=25, unique=True)
    description = models.CharField(max_length=100)
    color = ColorField(default="#FF0000")

    class Meta:
        ordering = ["stk_meth"]

    def __str__(self):
        return "{} ({})".format(self.description, self.stk_meth)


class Hatchery(models.Model):
    """
    A model to capture the last hatchery that reared the fish.
    """

    HATCHERY_TYPE_CHOICES = [
        ("private", "Private"),
        ("state", "State"),
        ("provincial", "Provincial"),
        ("federal", "Federal"),
        ("tribal", "Tribal"),
        ("other", "Other"),
    ]

    hatchery_name = models.CharField(max_length=250, unique=True)
    abbrev = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True, null=True)

    active = models.BooleanField(default=True, db_index=True)

    hatchery_type = models.CharField(
        max_length=25, choices=HATCHERY_TYPE_CHOICES, blank=True, null=True
    )

    agency = models.ForeignKey(
        Agency,
        on_delete=models.CASCADE,
        related_name="hatcheries",
        blank=True,
        null=True,
    )

    class Meta:
        verbose_name_plural = "Hatcheries"
        # this constraint is not necessary yet - abbrev is already unique
        # unique_together = ("abbrev", "hatchery_type", "agency")

    def __str__(self):
        if self.agency:
            return "{} ({} [{}])".format(
                self.hatchery_name, self.abbrev, self.agency.abbrev
            )
        else:
            return "{} ({})".format(self.hatchery_name, self.abbrev)

    def short_name(self):
        return str(self).replace("Fish Culture Station", "")


# TODO: Add table for known stocking sites - this may have to be a many-to-many
# to accomodate site aliases similar to strains-strainsRaw.
# class StockingSite(models.Model):


class StockingEvent(models.Model):
    """
    A model to capture actual stocking events - 'a pipe in the water'.
    """

    created_date = models.DateTimeField(auto_now_add=True)
    modified_date = models.DateTimeField(auto_now=True)

    VALIDATION_CODE_CHOICES = [
        (0, "level 0, entered at hatchery, unknown verification status"),
        (1, "level 1, entered at hatchery and not verified"),
        (2, "level 2, entered and verified at hatchery"),
        (3, "level 3, entered at hatchery and verified by GBFRO"),
        (4, "level 4, entered and verified at hatchery and verified at GBFRO"),
        (5, "level 5, entered and verified at GLFC"),
        (6, "level 6, entered and verified at GBFRO"),
        (7, "entered by Dept. FW, MSU., not avail. from GLFC"),
        (8, "entered by COTFMA"),
        (9, "assumed to be validated by state prior to receipt"),
        (10, "level 10, data entered and verified at OMNR"),
    ]

    species = models.ForeignKey(
        Species, on_delete=models.CASCADE, related_name="stocking_events"
    )

    # foreign key to strain_raw, strain will be made available through
    # a class method that will traverse the Strain-StrainRaw relationship.
    strain_raw = models.ForeignKey(
        StrainRaw, on_delete=models.CASCADE, related_name="stocking_events"
    )

    agency = models.ForeignKey(
        Agency, on_delete=models.CASCADE, related_name="stocking_events"
    )

    hatchery = models.ForeignKey(
        Hatchery,
        on_delete=models.CASCADE,
        related_name="stocking_events",
        blank=True,
        null=True,
    )

    # primary management unit for this event - other can be found with spatial queries.
    management_unit = models.ForeignKey(
        ManagementUnit, on_delete=models.CASCADE, related_name="stocking_events"
    )

    grid_10 = models.ForeignKey(
        Grid10, on_delete=models.CASCADE, related_name="stocking_events"
    )

    stocking_method = models.ForeignKey(
        StockingMethod, on_delete=models.CASCADE, related_name="stocking_events"
    )

    lifestage = models.ForeignKey(
        LifeStage, on_delete=models.CASCADE, related_name="stocking_events"
    )

    condition = models.ForeignKey(
        Condition,
        on_delete=models.CASCADE,
        related_name="stocking_events",
        default=get_default_condition,
    )

    # unique fish stocking event identifier
    stock_id = models.CharField(
        max_length=100,
        db_index=True,
        unique=True,
        default=unique_string,
    )

    # if there is an agency stock_id - it has to be unique
    agency_stock_id = models.CharField(max_length=100, blank=True, null=True)

    date = models.DateField("Stocking event date", blank=True, null=True)

    day = models.IntegerField("Day of the month", blank=True, null=True)
    month = models.IntegerField(
        "Month of stocking event as an integer", db_index=True, blank=True, null=True
    )
    year = models.IntegerField(
        "year of the stocking event as an integer >1900", db_index=True
    )

    #  Spatial Attributes
    site = models.CharField(max_length=100, blank=True, null=True)
    st_site = models.CharField(max_length=100, blank=True, null=True)

    jurisdiction = models.ForeignKey(
        Jurisdiction, on_delete=models.CASCADE, related_name="stocking_events"
    )

    dd_lat = models.FloatField(
        "Reported latitude in decimal degrees", blank=True, null=True
    )
    dd_lon = models.FloatField(
        "Reported longitude in decimal degrees", blank=True, null=True
    )

    geom = models.PointField(
        "GeoDjango spatial point field", srid=4326, blank=True, null=True
    )

    geom_lat = models.FloatField(
        "Latitude in decimal degrees derived from geom", editable=False, default=45.00
    )
    geom_lon = models.FloatField(
        "Longitude in decimal degrees derived from geom", editable=False, default=-81.00
    )

    latlong_flag = models.ForeignKey(
        LatLonFlag, on_delete=models.CASCADE, related_name="stocking_events"
    )

    grid_5 = models.CharField(max_length=4, blank=True, null=True)

    no_stocked = models.IntegerField("Number of fish stocked")
    yreq_stocked = models.IntegerField("Number of fish stocked as yearling equivalents")
    year_class = models.IntegerField("Year class of stocked fish", db_index=True)
    agemonth = models.IntegerField(
        "age of stocked fish in months", blank=True, null=True
    )
    length = models.IntegerField("length of stocked fish in mm", blank=True, null=True)
    weight = models.FloatField("weight of stocked fish in grams", blank=True, null=True)

    lotcode = models.CharField(
        "Hatchery Lot code indicating source of stocked fish",
        max_length=100,
        blank=True,
        null=True,
    )

    fish_tags = models.ManyToManyField(
        FishTag, related_name="stocking_events", blank=True
    )

    tag_no = models.CharField(
        "CWT numbers", max_length=150, blank=True, null=True, db_index=True
    )
    tag_ret = models.FloatField("CWT retention as a percentage", blank=True, null=True)

    # fin clips are the individual clips applied to the fish of a stocking event.
    # fish is an ADLP clip code would have an AD and and LP clip.
    fin_clips = models.ManyToManyField(FinClip, related_name="stocking_events")

    clip_code = models.ForeignKey(
        CompositeFinClip,
        on_delete=models.CASCADE,
        related_name="stocking_events",
        blank=True,
        null=True,
        help_text="Reported Composite Clip Code",
    )

    clip_efficiency = models.FloatField(
        "Clipping efficency as a percentage", blank=True, null=True
    )

    physchem_marks = models.ManyToManyField(
        PhysChemMark, related_name="stocking_events", blank=True
    )

    # mark, mark_eff and validation are going away shortly....
    # marks is going away shortly:
    marks = models.ManyToManyField(
        Mark,
        related_name="stocking_events",
        blank=True,
    )
    mark = models.CharField(
        "Chemical, tag, or finclip mark applied to fish",
        max_length=50,
        blank=True,
        null=True,
        db_index=True,
    )
    mark_eff = models.FloatField(
        "Marking efficency as a percentage", blank=True, null=True
    )

    validation = models.IntegerField(
        "Event Data Validation Code 0-10.",
        choices=VALIDATION_CODE_CHOICES,
        blank=True,
        null=True,
    )

    notes = models.CharField(max_length=500, blank=True, null=True)

    upload_event = models.ForeignKey(
        DataUploadEvent,
        on_delete=models.CASCADE,
        related_name="stocking_events",
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ["-year", "stock_id"]

    def __str__(self):
        return "id:{} ({}-{}-{})".format(
            self.stock_id, self.site, self.agency.abbrev, self.species.abbrev
        )

    def save(self, *args, **kwargs):
        """

        A custom save method that updates the mark, clipa and eventually
        tag_no fields when the instance is saved.  These fields are
        composistes of related fields and are stored in the database
        for convenience.

        Arguments:
        - `self`:
        - `*args`:
        - `**kwargs`:

        """

        flag_cache = {x.value: x for x in LatLonFlag.objects.all()}
        if self.dd_lon and self.dd_lat:
            self.geom = Point(self.dd_lon, self.dd_lat)
            self.latlong_flag = flag_cache[1]
        else:
            # grid 10 is a required field - if this changes, we may
            # need to additional elif statments here:
            self.geom = self.grid_10.centroid
            self.latlong_flag = flag_cache[4]

        self.geom_lat = self.geom.y
        self.geom_lon = self.geom.x

        try:
            self.date = datetime(self.year, self.month, self.day)
        except (ValueError, TypeError):
            self.date = None

        if self.id:

            self.mark = self.get_physchem_code()
            self.clip_code = self.get_composite_clip_code()

            # if the stock ID is null or looks like the default uuid4 value,
            # replace it with the year & self.id
            if not self.stock_id or is_uuid4(self.stock_id):
                current_year = datetime.now().year
                counter = str(self.id).zfill(5)[-5:]
                self.stock_id = "{}{}".format(current_year, counter)

        yreq = YearlingEquivalent.objects.filter(
            species=self.species, lifestage=self.lifestage
        ).first()

        if yreq:
            self.yreq_stocked = self.no_stocked * yreq.yreq_factor
        else:
            self.yreq_stocked = self.no_stocked

        super(StockingEvent, self).save(*args, **kwargs)

    def best_date_str(self):
        """return the the most precise date available for this event.  Return
        the complete date if it is available, the month and the year if the
        day is unknown, or just the year if the month and date are not
        known  Returns a string representing the date"""

        if self.date:
            return self.date.strftime("%B %d, %Y")
        elif self.month:
            tmpdate = datetime(self.year, self.month, 1)
            return tmpdate.strftime("%B %Y")
        else:
            return str(self.year)

    @property
    def lake(self):
        """A shortcut to return the lake associated with a
        stocking event as a property of the object.

        """
        return self.jurisdiction.lake

    @property
    def stateprov(self):
        """A shortcut to return the state or Province associated with a
        stocking event as a property of the object.

        """
        return self.jurisdiction.stateprov

    def get_absolute_url(self):
        """return the url for this stocking event"""
        return reverse(
            "stocking:stocking-event-detail", kwargs={"stock_id": self.stock_id}
        )

    def get_mark_code(self):
        """Return a string containing the Mark codes associated with this
        stocking event sorted in ascending order and then concatenated together.

        Arguments:
        - `self`:
        """
        tmp = []
        if self.id:
            for mark in self.marks.all():
                tmp.append(mark.mark_code)

        tmp.sort()
        if tmp:
            mark_code = "".join(tmp)
            return mark_code
        else:
            return None

    def get_physchem_code(self):
        """Return a string containing the physical/chemical mark codes
        associated with this stocking event sorted in ascending order
        and then concatenated together.

        Arguments:
        - `self`:

        """
        tmp = []
        if self.id:
            for x in self.physchem_marks.all():
                tmp.append(x.mark_code)
        tmp.sort()
        if tmp:
            code = "".join(tmp)
            return code
        else:
            return None

    def get_finclip_code(self):
        """Return a string containing the fin codes associated with this
        stocking event sorted in ascending order and then concatenated together.

        This method is now obsolete.  finclip codes can be queried
        from the composite clip code table.

        Arguments:
        - `self`:

        """
        tmp = []
        if self.id:
            for x in self.fin_clips.all():
                tmp.append(x.abbrev)
        tmp.sort()
        if tmp:
            code = "".join(tmp)
            return code
        else:
            return None

    def get_clipa(self):
        """Return a string containing the OMNR clip codes associated
        with this stocking event sorted in ascending order and then
        concatenated together.

        NOTE - THIS DOES NOT CURRENTLY WORK - OMNR Clip codes are not
        stored in the Fin CLip table.

        Arguments:
        - `self`:

        """

        tmp = []
        if self.id:
            for x in self.fin_clips.all():
                tmp.append(x.clip_code)
        tmp.sort()
        if tmp:
            clips = "".join(tmp)
            return clips
        else:
            return None

    def get_composite_clip_code(self):
        """Build the elements of the composite clip code, if one
        already exists associated it with the existing stocking event,
        otherwise created it.

        If the fin clip includes NO or UN return just those, unknown
        and no clip are exclusive of all other clip codes.

        Arguments: - `self`: a stocking event object

        """
        composite_clip_code = None
        fin_clips = self.fin_clips.values_list("abbrev", "description").order_by(
            "abbrev"
        )

        if len(fin_clips):

            if "NO" in [x[0] for x in fin_clips]:
                fin_clip, created = FinClip.objects.get_or_create(
                    abbrev="UN", defaults={"description": "No Clip"}
                )
                abbrev = "NO"
                description = fin_clip.description
            elif "UN" in [x[0] for x in fin_clips]:
                fin_clip, created = FinClip.objects.get_or_create(
                    abbrev="UN", defaults={"description": "Unknown Status"}
                )
                abbrev = "UN"
                description = fin_clip.description
            else:
                abbrev = "".join([x[0].upper() for x in fin_clips])
                description = ", ".join([x[1].title() for x in fin_clips])

            composite_clip_code, created = CompositeFinClip.objects.get_or_create(
                clip_code=abbrev, defaults={"description": description}
            )
        return composite_clip_code

    @property
    def has_sequential_cwts(self):
        """
        Return true if one of the of the tags associated with this stocking
        event is sequential. If so, we will need to account for start and
        sequence end in some views and templates.

        Arguments:
        - `self`:

        """

        has_sequential = self.cwt_series.filter(cwt__tag_type="sequential").count()

        if has_sequential:
            return True
        else:
            return False


def update_events_yreq(sender, **kwargs):
    """a post save event for yearling equivalent factors. When yearling
    equivalent factors are updated, the number of yearling equivalents
    for stocking events of the same species and life stage need to be
    updated to reflect the new values.

    """
    instance = kwargs["instance"]

    # update the yearling equivalent value for all of the events with
    # the same lifestage and species
    StockingEvent.objects.filter(
        species=instance.species, lifestage=instance.lifestage
    ).update(yreq_stocked=F("no_stocked") * instance.yreq_factor)


post_save.connect(update_events_yreq, sender=YearlingEquivalent)
