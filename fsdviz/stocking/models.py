from datetime import datetime
from django.contrib.gis.db import models
from django.template.defaultfilters import slugify
from django.urls import reverse

from django.contrib.gis.geos import Point

from fsdviz.myusers.models import CustomUser
from fsdviz.common.models import (
    Species,
    Strain,
    StrainRaw,
    Agency,
    Lake,
    StateProvince,
    Jurisdiction,
    ManagementUnit,
    Grid10,
    LatLonFlag,
    Mark,
    FinClip,
    FishTag,
    PhysChemMark,
)


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

    slug = models.CharField(max_length=75, unique=True)

    def save(self, *args, **kwargs):
        """
        Populate slug when we save the object.
        """

        self.slug = self.generate_slug()

        super(DataUploadEvent, self).save(*args, **kwargs)

    def generate_slug(self):
        """ Create the slug from the lake, agency, and timestamp.
        """
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

    class Meta:
        ordering = ["abbrev"]

    def __str__(self):
        return "{} ({})".format(self.description, self.abbrev)


class Condition(models.Model):
    """
    A model to capture the condition of the stocked when they were
    stocked.
    """

    condition = models.IntegerField(unique=True)
    description = models.CharField(max_length=100)

    class Meta:
        ordering = ["condition"]

    def __str__(self):
        return "{} - {}".format(self.condition, self.description)


class StockingMethod(models.Model):
    """
    A model to capture the method used to the stock the fish.
    """

    stk_meth = models.CharField("Stocking Method", max_length=25, unique=True)
    description = models.CharField(max_length=100)

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
        ("other", "Other"),
    ]

    hatchery_name = models.CharField(max_length=250, unique=True)
    abbrev = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True, null=True)

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

    def __str__(self):
        if self.agency:
            return "{} ({} [{}])".format(
                self.hatchery_name, self.abbrev, self.agency.abbrev
            )
        else:
            return "{} ({})".format(self.hatchery_name, self.abbrev)


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

    # marks is going away shortly:
    marks = models.ManyToManyField(Mark)

    fish_tags = models.ManyToManyField(FishTag)
    physchem_marks = models.ManyToManyField(PhysChemMark)
    finclip = models.ForeignKey(
        FinClip,
        on_delete=models.CASCADE,
        related_name="stocking_events",
        blank=True,
        null=True,
    )

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

    # primary management unit for this event - other can be found with queries.
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
        Condition, on_delete=models.CASCADE, related_name="stocking_events"
    )

    # unique fish stocking event identifier
    stock_id = models.CharField(
        "unique event identifier provided by agency", max_length=100, unique=True
    )

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

    dd_lat = models.FloatField("Latitude in decimal degrees", blank=True, null=True)
    dd_lon = models.FloatField("Longitude in decimal degrees", blank=True, null=True)

    geom = models.PointField(
        "GeoDjango spatial point field", srid=4326, blank=True, null=True
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
    weight = models.IntegerField(
        "weight of stocked fish in grams", blank=True, null=True
    )

    lotcode = models.CharField(
        "Hatchery Lot code indicating source of stocked fish",
        max_length=100,
        blank=True,
        null=True,
    )

    tag_no = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    tag_ret = models.FloatField("Tag retention as a percentage", blank=True, null=True)

    clip_efficiency = models.FloatField(
        "Clipping efficency as a percentage", blank=True, null=True
    )

    # clipa = models.CharField(max_length=10, blank=True, null=True, db_index=True)
    # mark, mark_eff and validation are going away shortly....
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

    # if there is an agency stock_id - it has to be unique
    agency_stock_id = models.CharField(
        max_length=100, unique=True, blank=True, null=True
    )

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

        self.geom = Point(self.dd_lon, self.dd_lat)

        # figure out what juristiction this event occured in depending
        # on state/province and lake.

        if self.id:
            if self.marks.all():
                self.mark = self.get_mark_code()
                self.clipa = self.get_clipa()

        super(StockingEvent, self).save(*args, **kwargs)

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

    def get_clipa(self):
        """Return a string containing the OMNR clip codes associated
        with this stocking event sorted in ascending order and then
        concatenated together.

        Arguments:
        - `self`:

        """

        tmp = []
        if self.id:
            for mark in self.marks.filter(mark_type="finclip"):
                tmp.append(mark.clip_code)
        tmp.sort()
        if tmp:
            clips = "".join(tmp)
            return clips
        else:
            return None

    @property
    def has_sequential_cwts(self):
        """
        Return true if one of the of the tags associated with this stocking
        event is sequential. If so, we will need to account for start and
        sequence end in some views and templates.


        Arguments:
        - `self`:

        """

        has_sequential = self.cwt_series.filter(cwt__tag_type="sequential")

        if has_sequential:
            return True
        else:
            return False


#     def get_cwt_csv(self):
#         """return a string containing a comma seperated list of cwt numbers
#         associated with this stocking event.  Used to create views
#         that match the format of the GLFC data submission.  Not to be
#         used for any serious analysis!
#
#         Arguments:
#         - `self`:
#
#         """
#         tmp =[]
#         for tag in self.cwt_sequences:
#             tmp.append(tag.cwt.cwt_number)
#         tags = list(set(tmp))
#         tags.sort()
#         if tags:
#             cwt_csv = ','.join(tags)
#             return cwt_csv
#         else:
#             return None
#
