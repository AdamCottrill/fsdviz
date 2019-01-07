'''
This file contains all of the django orm models for entities that will
be shared across both the stocking and cwt recovery applications.

'''

from django.contrib.gis.db import models
from django.template.defaultfilters import slugify


class BuildDate(models.Model):
    '''
    A database to hold the date that the database was last refreshed.
    '''
    build_date = models.DateField(editable=False)

    def __str__(self):
        return self.build_date.strftime("%d-%b-%Y")


class Readme(models.Model):
    '''
    a table to hold all of the information regarding last FSIS
    download and FS_Master rebuild (it appear as a footer on every
    page)
    '''
    date = models.DateField(editable=False)
    comment = models.TextField()
    initials = models.CharField(max_length=4)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return self.comment


class Agency(models.Model):
    '''
    A lookup table for agencies that either stock fish or recovery cwts.

    This table should probably be extended to include office/hatchery
    so that we can differentiate offices for agencies that have more
    than one. Keeping it simple for now.

    '''

    abbrev = models.CharField(max_length=15, unique=True)
    agency_name = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name_plural = "Agencies"
        ordering = ['abbrev']

    def __str__(self):
        """ String representation for a agency."""
        return '{} ({})'.format(self.agency_name, self.abbrev)


class Lake(models.Model):
    '''
    A lookup table for lakes where fish were stocked, cwts either
    deployed or recovered, or where management/spatial units are located.

    We could add a geometry here for the shoreline some day.

    '''

    abbrev = models.CharField(max_length=2, unique=True)
    lake_name = models.CharField(max_length=30, unique=True)
    shoreline = models.MultiPolygonField(srid=4326, blank=True, null=True)
    centroid = models.PointField(srid=4326)

    class Meta:
        ordering = ['abbrev']

    def __str__(self):
        """ String representation for a lake."""
        return '{} ({})'.format(self.lake_name, self.abbrev)


class StateProvince(models.Model):
    '''
    A lookup table for states or provinces where fish were stocked,
    cwts either deployed or recovered, or where management/spatial
    units are located.

    '''

    COUNTRIES = (
        ('USA', 'U.S.A.'),
        ('CAN', 'Canada'),

    )

    abbrev = models.CharField(max_length=5, unique=True)
    name = models.CharField(max_length=30, unique=True)
    description = models.CharField(max_length=300)
    country = models.CharField(max_length=3, choices=COUNTRIES)

    class Meta:
        ordering = ['abbrev']

    def __str__(self):
        """ String representation for a State."""
        return '{} ({})'.format(self.name, self.abbrev)


class ManagementUnit(models.Model):
    '''
    a class to hold geometries associated with arbirary ManagementUnits
    that can be represented as polygons.  Examples include quota
    management units and lake trout rehabilitation zones.  Used to find
    stocking events, cwts, and cwt recoveries occurred in (or
    potentially near) specific management Units.

    '''

    label = models.CharField(max_length=25)
    slug = models.SlugField(blank=True, unique=True, editable=False)
    description = models.CharField(max_length=300)
    geom = models.MultiPolygonField(srid=4326, blank=True, null=True)
    centroid = models.PointField(srid=4326)
    lake = models.ForeignKey(Lake, default=1, on_delete=models.CASCADE)

    MU_TYPE_CHOICES = (
        ('mu', 'Management Unit'),
        ('ltrz', 'Lake Trout Rehabilitation Zone'),
        ('qma', 'Quota Management Area'),
        ('aa', 'Assessment Area'),
        ('stat_dist', 'Statistical District'),
    )

    mu_type = models.CharField(max_length=10,
                               choices=MU_TYPE_CHOICES,
                               default='mu')

    class Meta:
        ordering = ['lake__abbrev', 'mu_type', 'label']

    def get_slug(self):
        '''
        the name is a concatenation of lake abbreviation, the managemnet unit
        type and and the management unit label.
        '''

        lake = str(self.lake.abbrev)

        return slugify('_'.join([lake, self.mu_type, self.label]))

    def name(self):
        '''
        returns the name of the managment unit including the lake it
        is associated with, the management unit type and the label

        '''
        return ' '.join([str(self.lake), self.mu_type.upper(), self.label])

    def __str__(self):
        return self.name()

    def save(self, *args, **kwargs):
        """
        Populate slug when we save the object.
        """
        #if not self.slug:
        self.slug = self.get_slug()
        super(ManagementUnit, self).save(*args, **kwargs)


class Grid10(models.Model):
    ''''
    A lookup table for 10-minute grids within lakes.  Used to verify
    stocking and recovery data before being inserted.

    '''

    grid = models.CharField(max_length=4)
    centroid = models.PointField(srid=4326)
    lake = models.ForeignKey(Lake, default=1, on_delete=models.CASCADE)

    class Meta:
        ordering = ['lake__abbrev', 'grid']

    def __str__(self):
        """ String representation for a State."""
        return '{} ({})'.format(self.grid, self.lake.abbrev)


class Species(models.Model):
    '''
    A lookup table for species.  Note that both backcross and splake
    are considered species and not lake trout strains.

    '''

    abbrev = models.CharField(max_length=5, unique=True)
    common_name = models.CharField(max_length=50, unique=True)
    speciescommon = models.CharField(max_length=50, unique=True, blank=True,
                                     null=True)
    scientific_name = models.CharField(max_length=50, blank=True, null=True)
    #family = models.CharField(max_length=50)
    species_code = models.IntegerField(unique=True)

    strains = models.ManyToManyField('Strain', through='StrainRaw',
                                     related_name='species')

    class Meta:
        verbose_name_plural = "Species"
        ordering = ['abbrev']

    def __str__(self):
        """ String representation for a Species."""
        return '{} ({})'.format(self.common_name, self.abbrev)


#STRAINS
#RAW_STRAINS
#MARKS


class Strain(models.Model):
    '''
    This table contains the 'nominal' names for each strain.  Allows
    "SEN(86)", "SEN(87)", "SEN(88)", "SEN(89)", "SEND", "SN", "SNHW",
    "SNNM", "SLD", "SLDSLW", "SLW" to all be referred to as Seneca (SN)
    lake trout.
    '''

    strain_code = models.CharField(max_length=10)
    strain_label = models.CharField(max_length=100)
    description = models.CharField(max_length=500, blank=True, null=True)

    strain_species = models.ForeignKey('Species', on_delete=models.CASCADE)

    class Meta:
        ordering = ['species__abbrev', 'strain_code']
        unique_together = ('strain_species', 'strain_code')

    def __str__(self):
        species_name = self.strain_species.common_name.title()
        return "{} Strain {} ({})".format(self.strain_label,
                                          species_name,
                                          self.strain_code)
#                                     self.species.common_name.title())


class StrainRaw(models.Model):
    '''

    The raw strain codes will represent the information returned in the
    GLFC look-up table where strain has too much information - eg -
    origins and rearing hatchery.  Essentially, this is an association
    table between the :model:`common.Species` and
    the :model:`common.Strain` tables. This table is rarely used
    directly. Generally :model:`common.Strain` is the table you want.

    '''

    species = models.ForeignKey('Species', on_delete=models.CASCADE,
                                related_name='rawstrain')
    strain = models.ForeignKey('Strain', on_delete=models.CASCADE,
                               related_name='rawstrain')

    #raw_strain_code = models.CharField(max_length=10)
    raw_strain = models.CharField(max_length=100)
    description = models.CharField(max_length=500)

    class Meta:
        ordering = ['species__abbrev', 'raw_strain']
        unique_together = ('species', 'strain', 'raw_strain')

    def __str__(self):
        return "{} ({})".format(self.description,
                                self.raw_strain)
    #                              self.species.common_name.title())
