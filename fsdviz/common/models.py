"""
This file contains all of the django orm models for entities that will
be shared across both the stocking and cwt recovery applications.

"""

from colorfield.fields import ColorField
from django.contrib.gis.db import models

from markdown import markdown

# consider add range field and constraint to CWTSequence when we upgrade to Django 3.0+
# from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import IntegerRangeField
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.template.defaultfilters import slugify
from django.utils.translation import gettext_lazy

from .validators import validate_cwt_sequence_range


class BaseModel(models.Model):
    """A simple abstract model that all of our other models will inherit
    from to captuture when the record was created, and when it was
    modified
    """

    id = models.AutoField(primary_key=True)
    created_timestamp = models.DateTimeField(auto_now_add=True)
    modified_timestamp = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class LookupDescription(BaseModel):
    """A model to hold the descriptions for each Lookup table.  The
    paragraphs contained in the description field will be displayed on
    the lookup tables html page and be editable in the django admin.
    The description field will support markdown, and will be converted
    to html when the model is saved."""

    slug = models.CharField(
        max_length=255,
        unique=True,
        editable=False,
        help_text="This is the string referenced in the template for this model.",
    )
    model_name = models.CharField(
        max_length=255,
        unique=True,
        help_text=(
            "Plural Name of Model Instances (e.g. - Lakes). This usually "
            "matches the heading in the Lookup Tables html template."
        ),
    )
    description = models.TextField(
        default="Coming Soon....", help_text="Lookup Table Description (markdown)."
    )
    description_html = models.TextField(
        editable=False, help_text="Lookup Table Description (html)."
    )

    class Meta:
        ordering = ["model_name"]

    def __str__(self):
        """"""

        "String representation for a LookupDescription." ""
        return self.model_name

    def save(self, *args, **kwargs):
        """Update the slug and html when we save the model. The slug
        uses underscores rather than dashes so we can access them as
        dict keys in the template."""

        self.slug = slugify(self.model_name).replace("-", "_")
        self.description_html = markdown(self.description)

        super(LookupDescription, self).save(*args, **kwargs)


class Image(models.Model):
    """A model to hold images uploaded by our super-users to that they can
    be referenced in our documentation (data dictionary ect)."""

    id = models.AutoField(primary_key=True)
    created_date = models.DateTimeField(auto_now_add=True)
    modified_date = models.DateTimeField(auto_now=True)
    title = models.CharField(max_length=255, unique=True)
    file = models.ImageField(upload_to="uploaded_images")

    def __str__(self):
        """String representation for an image object."""
        return f"{self.title}({self.file.url})"

    def get_absolute_url(self):
        return (self.file and self.file.url) or ""


class Agency(BaseModel):
    """
    A lookup table for agencies that either stock fish or recovery cwts.

    This table should probably be extended to include office/hatchery
    so that we can differentiate offices for agencies that have more
    than one. Keeping it simple for now.

    """

    abbrev = models.CharField(max_length=15, unique=True)
    agency_name = models.CharField(max_length=100, unique=True)
    color = ColorField(default="#FF0000")

    class Meta:
        verbose_name_plural = "Agencies"
        ordering = ["abbrev"]

    def get_by_natural_key(self, abbrev):
        """a helper method that will allow us to get agencies
        using abbrev as the key."""
        return self.get(abbrev=abbrev)

    def __str__(self):
        """String representation for a agency."""
        return "{} ({})".format(self.agency_name, self.abbrev)


class Lake(BaseModel):
    """
    A lookup table for lakes where fish were stocked, cwts either
    deployed or recovered, or where management/spatial units are located.

    """

    abbrev = models.CharField(max_length=2, unique=True)
    lake_name = models.CharField(max_length=30, unique=True)
    geom = models.MultiPolygonField(srid=4326, blank=True, null=True)
    color = ColorField(default="#FF0000")
    # geom including associated watersheds
    # geom_plus = models.MultiPolygonField(srid=4326, blank=True, null=True)

    max_lat = models.FloatField(
        "Northern-most latitude for events in this lake",
        blank=True,
        null=True,
        validators=[MinValueValidator(41.3), MaxValueValidator(49.1)],
    )

    min_lat = models.FloatField(
        "Southern-most latitude for events in this lake",
        blank=True,
        null=True,
        validators=[MinValueValidator(41.3), MaxValueValidator(49.1)],
    )

    max_lon = models.FloatField(
        "Eastern-most longitude for events in this lake",
        blank=True,
        null=True,
        validators=[MinValueValidator(-92.4), MaxValueValidator(-74.3)],
    )

    min_lon = models.FloatField(
        "Western-most longitude for events in this lake",
        blank=True,
        null=True,
        validators=[MinValueValidator(-92.4), MaxValueValidator(-74.3)],
    )

    class Meta:
        ordering = ["abbrev"]

    def __str__(self):
        """String representation for a lake."""
        return "{} ({})".format(self.lake_name, self.abbrev)

    def save(self, *args, **kwargs):
        """ """

        self.full_clean()
        super(Lake, self).save(*args, **kwargs)

    def clean(self):
        """Make sure that if the min and max lat and lon are
        populated, that they represent plausible values."""

        if self.min_lat and self.max_lat:
            if self.min_lat >= self.max_lat:
                msg = "Maximum Latitude must be greater than minimum Latitude."
                raise ValidationError(gettext_lazy(msg))

        if self.min_lon and self.max_lon:
            if self.min_lon >= self.max_lon:
                msg = "Maximum Longitude must be greater than minimum Longitude."
                raise ValidationError(gettext_lazy(msg))

    def coordinate_limits(self):
        """Return the min and max, lat and lon in the format expected
        by our template.  The same format is returned from extents -
        but it is calculated from the polygon geometry.  These are the
        hard-coded values that include events in tributaries that
        might be outside of a bounding box around the lake.

        """
        return [self.min_lon, self.min_lat, self.max_lon, self.max_lat]

    def short_name(self):
        """The name of the lake without 'Lake ..'.

        A shorter verson of the lake name to save spave when
        needed. THis may need to be turned into a property at some
        point.

        """

        return self.lake_name.replace("Lake ", "")


class StateProvince(BaseModel):
    """
    A lookup table for states or provinces where fish were stocked,
    cwts either deployed or recovered, or where management/spatial
    units are located.

    """

    COUNTRIES = (("USA", "U.S.A."), ("CAN", "Canada"))

    abbrev = models.CharField(max_length=5, unique=True)
    name = models.CharField(max_length=30, unique=True)
    description = models.CharField(max_length=300)
    country = models.CharField(max_length=3, choices=COUNTRIES)
    color = ColorField(default="#FF0000")

    class Meta:
        ordering = ["abbrev"]

    def __str__(self):
        """String representation for a State."""
        return "{} ({})".format(self.name, self.abbrev)


class Jurisdiction(BaseModel):
    """A lookup table for geographic extents of a state or province
    within a lake.  This will be important for managers to find the
    waters that they are responsible for.

    For many states, there will only be a single juristiction
    (e.g. the Illinois waters of Lake Michigan), Michigan and Ontaio
    will have multiple juristictions (one for each lake they have in
    their pervue(??))

    A geom will be used to capture the outline of the juristiction
    within the great lake shoreline, but extends will be updated to
    include stocking events in tributatries so that map widgets can be
    appropriately zoomed so that events aren't clipped.

    """

    lake = models.ForeignKey(Lake, default=1, on_delete=models.CASCADE)
    stateprov = models.ForeignKey(StateProvince, default=1, on_delete=models.CASCADE)

    slug = models.CharField(max_length=5, unique=True)
    name = models.CharField(max_length=30, unique=True)
    description = models.CharField(max_length=300)
    color = ColorField(default="#FF0000")
    # complete geometry of shoreline and state/province boundaries
    geom = models.MultiPolygonField(srid=4326, blank=True, null=True)
    # juristiction including associated watersheds
    # geom_plus = models.MultiPolygonField(srid=4326, blank=True, null=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        """String representation for a State."""
        return "{} - {} waters".format(self.lake.lake_name, self.stateprov.name)

    def save(self, *args, **kwargs):
        """
        Populate slug when we save the object.
        """
        # if not self.slug:
        self.slug = slugify("_".join([self.lake.abbrev, self.stateprov.abbrev]))

        super(Jurisdiction, self).save(*args, **kwargs)

    @property
    def centroid():
        """Return the centroid for this grid - used by the serializer."""
        if self.geom:
            return self.geom.centroid
        else:
            return None


class ManagementUnit(BaseModel):
    """
    a class to hold geometries associated with arbirary ManagementUnits
    that can be represented as polygons.  Examples include quota
    management units and lake trout rehabilitation zones.  Used to find
    stocking events, cwts, and cwt recoveries occurred in (or
    potentially near) specific management Units.

    """

    label = models.CharField(max_length=25)
    slug = models.SlugField(blank=True, unique=True, editable=False)
    description = models.CharField(max_length=300)
    color = ColorField(default="#FF0000")
    geom = models.MultiPolygonField(srid=4326, blank=True, null=True)
    # geom including associated watersheds
    # geom_plus = models.MultiPolygonField(srid=4326, blank=True, null=True)

    # centroid = models.PointField(srid=4326, blank=True, null=True)
    lake = models.ForeignKey(Lake, default=1, on_delete=models.CASCADE)
    jurisdiction = models.ForeignKey(
        Jurisdiction, blank=True, null=True, on_delete=models.CASCADE
    )

    primary = models.BooleanField(
        "Primary management unit type for this jurisdiciton.",
        default=False,
        db_index=True,
    )

    MU_TYPE_CHOICES = (
        ("mu", "Management Unit"),
        ("ltrz", "Lake Trout Rehabilitation Zone"),
        ("qma", "Quota Management Area"),
        ("aa", "Assessment Area"),
        ("stat_dist", "Statistical District"),
    )

    mu_type = models.CharField(max_length=10, choices=MU_TYPE_CHOICES, default="mu")

    grid10s = models.ManyToManyField("Grid10")

    class Meta:
        ordering = ["lake__abbrev", "mu_type", "label"]

    def get_slug(self):
        """
        the name is a concatenation of lake abbreviation, the managemnet unit
        type and and the management unit label.
        """

        lake = str(self.lake.abbrev)

        return slugify("_".join([lake, self.mu_type, self.label]))

    def name(self):
        """
        returns the name of the managment unit including the lake it
        is associated with, the management unit type and the label

        """
        return " ".join([str(self.lake), self.mu_type.upper(), self.label])

    def __str__(self):
        return self.name()

    def save(self, *args, **kwargs):
        """
        Populate slug when we save the object.
        """
        # if not self.slug:
        self.slug = self.get_slug()
        super(ManagementUnit, self).save(*args, **kwargs)


class Grid10(BaseModel):
    """'
    A lookup table for 10-minute grids within lakes.  Used to verify
    stocking and recovery data before being inserted.

    """

    lake = models.ForeignKey(Lake, default=1, on_delete=models.CASCADE)
    grid = models.CharField(max_length=4)
    slug = models.SlugField(blank=False, unique=True, editable=False)
    geom = models.MultiPolygonField(srid=4326, blank=True, null=True)
    centroid = models.PointField(srid=4326, blank=True, null=True)

    class Meta:
        ordering = ["lake__abbrev", "grid"]

    def __str__(self):
        """String representation for a State."""
        return "{} ({})".format(self.grid, self.lake.abbrev)

    def get_slug(self):
        """
        the name is a concatenation of lake abbreviation, the managemnet unit
        type and and the management unit label.
        """
        lake = str(self.lake.abbrev)

        return slugify("_".join([lake, self.grid]))

    def save(self, *args, **kwargs):
        """Populate slug and centroid when we save the object.  Grid10
        centroids are used in dynamic maps so it makes sense to
        pre-caclulate them when they are created or updated.
        """
        # update out centroid if there is a geom
        if self.geom:
            self.centroid = self.geom.centroid

        # if not self.slug:
        self.slug = self.get_slug()
        super(Grid10, self).save(*args, **kwargs)


class Species(BaseModel):
    """
    A lookup table for species.  Note that both backcross and splake
    are considered species and not lake trout strains.

    """

    abbrev = models.CharField(max_length=5, unique=True)
    common_name = models.CharField(max_length=50, unique=True)
    speciescommon = models.CharField(max_length=50, unique=True, blank=True, null=True)
    scientific_name = models.CharField(max_length=50, blank=True, null=True)
    # family = models.CharField(max_length=50)
    species_code = models.IntegerField(unique=True)
    color = ColorField(default="#FF0000")

    strains = models.ManyToManyField(
        "Strain", through="StrainAlias", related_name="species"
    )

    active = models.BooleanField(default=True, db_index=True)

    class Meta:
        verbose_name_plural = "Species"
        ordering = ["abbrev"]

    def __str__(self):
        """String representation for a Species."""
        return "{} ({})".format(self.common_name.title(), self.abbrev)


class Strain(BaseModel):
    """
    This table contains the 'nominal' names for each strain.  Allows
    "SEN(86)", "SEN(87)", "SEN(88)", "SEN(89)", "SEND", "SN", "SNHW",
    "SNNM", "SLD", "SLDSLW", "SLW" to all be referred to as Seneca (SN)
    lake trout.

    TODO: create a slug field that uses the species abbrev and the strain code:

    "{}-{}".format( x.strain_code, x.strain_species.abbrev)

    """

    strain_code = models.CharField(
        "Nominal Strain Code for groups of raw strain values", max_length=10
    )
    strain_label = models.CharField(max_length=100)
    description = models.CharField(max_length=500, blank=True, null=True)
    color = ColorField(default="#FF0000")

    strain_species = models.ForeignKey("Species", on_delete=models.CASCADE)

    slug = models.CharField(max_length=20, unique=True, null=True)

    active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["species__abbrev", "strain_code"]
        unique_together = ("strain_species", "strain_code")

    def save(self, *args, **kwargs):
        """
        Populate slug when we save the object.
        """
        # if not self.slug:
        self.slug = slugify(
            "{}-{}".format(self.strain_species.abbrev, self.strain_code)
        )
        super(Strain, self).save(*args, **kwargs)

    def __str__(self):
        species_name = self.strain_species.common_name.title()
        return "{} Strain {} ({})".format(
            self.strain_label, species_name, self.strain_code
        )


class StrainAlias(BaseModel):
    """
    The raw strain codes will represent the information returned in the
    GLFC look-up table where strain has too much information - eg -
    origins and rearing hatchery.  Essentially, this is an association
    table between the :model:`common.Species` and
    the :model:`common.Strain` tables. This table is rarely used
    directly. Generally :model:`common.Strain` is the table you want.

    """

    species = models.ForeignKey(
        Species, on_delete=models.CASCADE, related_name="rawstrain"
    )
    strain = models.ForeignKey(
        Strain, on_delete=models.CASCADE, related_name="rawstrain"
    )

    strain_alias = models.CharField("Submitted (raw) strain code", max_length=100)
    description = models.CharField(max_length=500)
    color = ColorField(default="#FF0000")

    active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["species__abbrev", "strain_alias"]
        unique_together = ("species", "strain", "strain_alias")
        verbose_name_plural = "Strain Aliases"

    def __str__(self):
        return "{} ({})".format(self.description, self.strain_alias)

    def full_clean(self, *args, **kwargs):
        """make sure that the species and strain are consistent."""

        if hasattr(self, "species") is False or self.species is None:
            self.species = self.strain.strain_species

        super(StrainAlias, self).full_clean(*args, **kwargs)

        if self.species != self.strain.strain_species:
            raise ValidationError(
                ("Selected Strain is not consistent with selected Species.")
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super(StrainAlias, self).save()


class Mark(BaseModel):
    """
    Stores a single mark applied to fish when they are stocked and
    reported when they are recaptured.  Includes fin clips, the
    presence of a cwt, and chemical marks.  Multiple marks can
    be applied to a single fish.  Combinations of marks most often
    serve to indicate year-class.

    (this model is obsolete and will be removed shortly.)

    """

    MARK_TYPE_CHOICES = [
        ("chemical", "Chemical"),
        ("finclip", "Fin Clip"),
        ("tag", "Tag"),
        ("unknown", "Unknown"),
    ]

    clip_code = models.CharField(max_length=2)
    mark_code = models.CharField(max_length=4, unique=True)
    mark_type = models.CharField(
        max_length=8, choices=MARK_TYPE_CHOICES, default="finclip"
    )

    description = models.CharField(max_length=100)

    class Meta:
        ordering = ["mark_type", "mark_code"]

    def __str__(self):
        return "{} ({})".format(self.description, self.mark_code)


class FinClip(BaseModel):
    """Stores a type of Fin clip - These are associated to Stocking Events
    through a many-to-many relationship. The reported clip codes are
    composites of these values. With the exception of NC (no clips) and
    UN (unknown clip status) - these are mutually exclusive of each
    other and all other fin clips.

    """

    abbrev = models.CharField(max_length=2, unique=True)
    description = models.CharField(max_length=100)
    color = ColorField(default="#FF0000")

    class Meta:
        ordering = ["abbrev"]

    def __str__(self):
        return "{} ({})".format(self.description, self.abbrev)


class CompositeFinClip(BaseModel):
    """Stores the attributes of fin clip, or combination of finclips that
    could be applied to stocked fish.

    (I'm not convinced that this is the best way to handle this data,
    but it is consistent with the data submission process and will
    work for today.  It might be best to split the clip codes into
    several tables.)

    """

    clip_code = models.CharField(max_length=10, unique=True)
    description = models.CharField(max_length=100)
    color = ColorField(default="#FF0000")

    class Meta:
        ordering = ["clip_code"]

    # def clean(self):
    #     """make sure that we don't have any empty string in our clip_code
    #     field. It cannot be null, and should not be an empty string either."""
    #     if self.clip_code == "":
    #         msg = "Database should not contain an empty string clip_code!"
    #         raise ValidationError(msg)

    # def save(self):
    #     self.full_clean()
    #     super(CompositeFinClip, self).save(*args, **kwargs)

    def __str__(self):
        return "{} ({})".format(self.description, self.clip_code)


class PhysChemMark(BaseModel):
    """Stores a single physical or chemical mark applied to fish when they
    are stocked and reported when they are recaptured.  It does NOT
    include fin clips, or the presence of a cwt.
    Multiple marks can be applied to a single fish.
    """

    MARK_TYPE_CHOICES = [
        ("thermal", "Thermal"),
        ("chemcial", "Chemical"),
        ("dye", "Dye"),
        ("physical", "physical"),
        ("unknown", "Unknown"),
    ]

    mark_code = models.CharField(max_length=10, unique=True)
    mark_type = models.CharField(max_length=10, choices=MARK_TYPE_CHOICES)
    description = models.CharField(max_length=100)
    color = ColorField(default="#FF0000")

    class Meta:
        ordering = ["mark_code"]

    def __str__(self):
        return "{} ({})".format(self.description, self.mark_code)


class FishTag(BaseModel):
    """Stores the attributes of tag that could be applied to stocked fish.
    Joined to stocking recovery events through a many-to-many
    relationship as fish could have more than one tag type (e.g. - cwt
    and floy tag).
    """

    TAG_TYPE_CHOICES = [
        ("floy", "Floy"),
        ("carlin", "Carlin"),
        ("jaw", "Jaw"),
        ("cwt", "CWT"),
        ("dart", "Dart"),
        ("pit", "PIT"),
        ("unknown", "Unknown"),
    ]

    TAG_COLOUR_CHOICES = [
        ("unknown", "Unknown"),
        ("white", "White"),
        ("red", "Red"),
        ("orange", "Orange"),
        ("purple", "Purple"),
        ("yellow", "Yellow"),
        ("green", "Green"),
        ("blue", "Blue"),
    ]

    tag_code = models.CharField(max_length=10, unique=True)
    tag_type = models.CharField(max_length=10, choices=TAG_TYPE_CHOICES)
    tag_colour = models.CharField(max_length=10, choices=TAG_COLOUR_CHOICES)
    description = models.CharField(max_length=100)
    color = ColorField(default="#FF0000")

    class Meta:
        ordering = ["tag_code"]
        unique_together = ("tag_colour", "tag_type")
        # unique together - colour and type

    def __str__(self):
        return "{} ({})".format(self.description, self.tag_code)


class LatLonFlag(BaseModel):
    """
    Indicates the level of spatial precision associated with a stocking
    event or recovery effort.  Lower numbers indicate higher precision.
    """

    value = models.IntegerField(unique=True)
    description = models.CharField(max_length=100)

    class Meta:
        ordering = ["value"]

    def __str__(self):
        return "{} - {}".format(self.value, self.description)


class CWT(BaseModel):
    """
    A model representing a single CWT object.  CWT has a foreign key back to
    :model:`common.Agency` and current a single cwt_number and cwt manufacturer
    must be unique.  Several boolean fields indicate if a cwt has been
    compromised in some way.
    """

    TAG_TYPE_CHOICES = [
        ("cwt", "Coded Wire Tag"),
        ("sequential", "Sequential Coded Wire Tag"),
    ]

    TAG_MANUFACTURER_CHOICES = [
        ("mm", "Micro Mark"),
        ("nmt", "Northwest Marine Technology"),
    ]

    cwt_number = models.CharField(max_length=6)
    tag_type = models.CharField(max_length=10, choices=TAG_TYPE_CHOICES, default="cwt")

    manufacturer = models.CharField(
        max_length=10, choices=TAG_MANUFACTURER_CHOICES, default="nmt"
    )

    slug = models.CharField(max_length=30, unique=True)

    tag_count = models.IntegerField()
    tag_reused = models.BooleanField(
        "True if this cwt has been stocked by more than one species, strain, or yearclass",
        default=False,
        db_index=True,
    )

    multiple_species = models.BooleanField(
        "True if this cwt has been stocked in more than one species",
        default=False,
        db_index=True,
    )
    multiple_strains = models.BooleanField(
        "True if this cwt has been stocked in more than one strain",
        default=False,
        db_index=True,
    )
    multiple_yearclasses = models.BooleanField(
        "True if this cwt has been stocked in more than one year class",
        default=False,
        db_index=True,
    )
    multiple_makers = models.BooleanField(
        "True if this cwt has been made by more than one tag manufacturer",
        default=False,
        db_index=True,
    )
    multiple_agencies = models.BooleanField(
        "True if this cwt has been stocked by more than one agency",
        default=False,
        db_index=True,
    )
    multiple_lakes = models.BooleanField(
        "True if this cwt has been stocked in more than one lake",
        default=False,
        db_index=True,
    )
    multiple_grid10s = models.BooleanField(
        "True if this cwt has been stocked by more than one 10-minute grid",
        default=False,
        db_index=True,
    )

    class Meta:
        ordering = ["cwt_number"]
        unique_together = ("cwt_number", "manufacturer", "tag_type")

    def save(self, *args, **kwargs):
        """
        Populate slug when we save the object.
        """
        # if not self.slug:
        self.slug = slugify(
            "{}_{}_{}".format(self.cwt_number, self.manufacturer, self.tag_type)
        )
        super(CWT, self).save(*args, **kwargs)

    def __str__(self):
        cwt_number = self.cwt_number
        cwt_string = "{}-{}-{} ({} {})".format(
            cwt_number[:2],
            cwt_number[2:4],
            cwt_number[4:],
            self.manufacturer,
            self.tag_type,
        )
        return cwt_string


class CWTsequence(BaseModel):
    """
    A model representing a sequence for a CWT object. Most CWTs are not
    sequential and will have a single record in this table with
    seq_start and seq_end both set to 1.  For truly sequential tags,
    seq_start and seq_end will reflect the start and end of the
    series deployed in the associated stocking event(s).
    """

    cwt = models.ForeignKey("CWT", on_delete=models.CASCADE, related_name="cwt_series")

    events = models.ManyToManyField("stocking.StockingEvent", related_name="cwt_series")

    # TODO: consider changing the sequence start and end to a rangefield
    # https://docs.djangoproject.com/en/2.2/ref/contrib/postgres/fields/#integerrangefield
    # NOTE: the range includes the lower bound and excludes the upper bound; that is [)
    sequence = IntegerRangeField(
        default=(0, 1), validators=[validate_cwt_sequence_range]
    )

    seq_lower = models.PositiveIntegerField(default=0, editable=False)
    seq_upper = models.PositiveIntegerField(default=1, editable=False)

    class Meta:
        ordering = ["cwt__cwt_number", "sequence"]

        # only available in Django >= 3.0
        # constraints = [
        #     ExclusionConstraint(
        #         name="exclude_overlapping_cwt_series",
        #         expressions=[
        #             ("sequence", RangeOperators.OVERLAPS),
        #             ("cwt", RangeOperators.EQUAL),
        #         ],
        #     )
        # ]

    def __str__(self):
        return "{} [{}-{}]".format(
            str(self.cwt), self.sequence.lower, self.sequence.upper
        )

    def full_clean(self, *args, **kwargs):
        """This method implements an overlap exclusion constrain on the model
        - we can't save cwt series on the same cwt that overlap each other.
        Eg 1-100 and 50-150 would not be allowed, 1-100 and 101-200 are OK.
        This method will not be required when we upgrade to Django 3.0+ (see
        meta option above).

        modified from: https://stackoverflow.com/questions/45833855/

        """

        super(CWTsequence, self).full_clean(*args, **kwargs)

        o = (
            CWTsequence.objects.filter(sequence__overlap=self.sequence)
            .exclude(pk=self.pk)
            .filter(cwt=self.cwt)
            .first()
        )
        if o:
            raise ValidationError('Sequence Range overlaps with "%s"' % o)

    def save(self, *args, **kwargs):
        self.full_clean()
        self.seq_lower = self.sequence.lower
        self.seq_upper = self.sequence.upper
        super(CWTsequence, self).save()
