'''
Models associated with cwt recovery events - this data is
submitted as part of the lamprey wounding submission.

'''

from django.contrib.gis.db import models

from django.contrib.gis.geos import Point

from fsdviz.common.models import (Species, Strain, StrainRaw, Agency,
                                  Lake, StateProvince,
                                  Grid10, LatLonFlag, Mark)


class RecoveryEvent(models.Model):
    '''
    A model to hold all of the information assocaited with the
    events/fishing efforts that lead to the recovery of one or more
    tags.  Derived directly from the GLFC table [GEAR]

    '''

    NET_MATERIAL_CHOICES = [
        ('M', 'Monofilament'),
        ('N', 'Nylon'),
        ('O', 'Other'),
        ('U', 'Unknown'),

    ]

    lift_identifier = models.CharField(max_length=100, unique=True)

    agency = models.ForeignKey(Agency, on_delete=models.CASCADE,
                               related_name='recovery_events')

    lake = models.ForeignKey(Lake, on_delete=models.CASCADE,
                             related_name='recovery_events')

    stateprov = models.ForeignKey(StateProvince, on_delete=models.CASCADE,
                                  related_name='recovery_events')

    grid_10 = models.ForeignKey(Grid10, on_delete=models.CASCADE,
                                blank=True, null=True,
                                related_name='recovery_events')

    date = models.DateField('Stocking event date', blank=True, null=True)

    day = models.IntegerField('Day of the month', blank=True, null=True)
    month = models.IntegerField('Month of recovery event as an integer',
                                db_index=True, blank=True, null=True)
    year = models.IntegerField('year of the recovery event as an integer >1900',
                               db_index=True)

    location = models.CharField(max_length=100, blank=True, null=True)


    dd_lat = models.FloatField('Latitude in decimal degrees',
                               blank=True, null=True)
    dd_lon = models.FloatField('Longitude in decimal degrees',
                               blank=True, null=True)

    geom = models.PointField('GeoDjango spatial point field',
                             srid=4326, blank=True, null=True)

    latlong_flag = models.ForeignKey(LatLonFlag, on_delete=models.CASCADE,
                                     related_name='recovery_events')

    grid_5 = models.CharField(max_length=4, blank=True, null=True)

    program_type = models.CharField(max_length=100,
                                    blank=True, null=True)
    program_description = models.CharField(max_length=100,
                                           blank=True, null=True)
    gear = models.CharField(max_length=100, blank=True, null=True)
    nights = models.IntegerField(blank=True, null=True)
    net_length = models.FloatField(blank=True, null=True)
    depth_min = models.FloatField(blank=True, null=True)
    depth_max = models.FloatField(blank=True, null=True)
    depth_avg = models.FloatField(blank=True, null=True)
    surface_temp = models.FloatField(blank=True, null=True)
    bottom_temp = models.FloatField(blank=True, null=True)

    net_material = models.CharField(max_length=2,
                                    choices=NET_MATERIAL_CHOICES,
                                    blank=True, null=True)

    mesh_min = models.FloatField(blank=True, null=True)
    mesh_max = models.FloatField(blank=True, null=True)
    comments = models.CharField(max_length=500, blank=True, null=True)


    class Meta:
        ordering = ['-year', 'agency', 'lift_identifier']


    def __str__(self):
        return "{} ({}-{})".format(self.lift_identifier,
                                     self.agency.abbrev,
                                     self.lake.abbrev)


    def save(self, *args, **kwargs):
        """

        A custom save method that updates the geom field from lat-long

        Arguments:
        - `self`:
        - `*args`:
        - `**kwargs`:

        """

        self.geom = Point(self.dd_lon, self.dd_lat)

        super(RecoveryEvent, self).save(*args, **kwargs)



class Recovery(models.Model):
    '''
    A model to hold all of the information associated with a cwt
    recovery event including attributes of the fish associated with
    the it.
    '''

    #this is shared across models and should be put somewhere else
    TAG_MANUFACTURER_CHOICES = [
        ('mm', 'Micro Mark'),
        ('nmt', 'Northwest Marine Technology'),]

    SEX_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('U', 'Unknown')
    ]

    WEIGHT_FORM_CHOICES = [
        ('R', 'Round'),
        ('D', 'Dressed'),
        ('U', 'Unknown')
    ]

    MATURITY_CHOICES = [
        ('I', 'Immature'),
        ('M', 'Mature'),
        ('U', 'Unknown'),
        ('G', 'Gravid'),
        ('S', 'Spent'),
        ('R', 'Ripe'),
    ]

    recovery_event = models.ForeignKey(RecoveryEvent, on_delete=models.CASCADE,
                                       related_name='recovered_tags')
    species = models.ForeignKey(Species, on_delete=models.CASCADE,
                                related_name='recovered_tag')

    marks = models.ManyToManyField(Mark)

    cwt_number = models.CharField(max_length=6, db_index=True)

    manufacturer = models.CharField(max_length=3,
                                    choices=TAG_MANUFACTURER_CHOICES,
                                    default='nmt')

    sequential_number =  models.IntegerField(default=1)
    fish_identifier_key = models.CharField(max_length=80)
    mesh_size = models.FloatField(blank=True, null=True)
    length = models.IntegerField(blank=True, null=True)
    weight = models.IntegerField(blank=True, null=True)
    weight_form = models.CharField(max_length=1,
                           blank=True, null=True,
                           choices=WEIGHT_FORM_CHOICES,
                           default='U')

    age = models.IntegerField(blank=True, null=True)
    agestructure = models.CharField(max_length=20, blank=True, null=True)

    sex = models.CharField(max_length=1,
                           blank=True, null=True,
                           choices=SEX_CHOICES,
                           default='U')

    maturity = models.CharField(max_length=1,
                                blank=True, null=True,
                                choices=MATURITY_CHOICES,
                                default='U')

    clipc = models.CharField(max_length=15, blank=True, null=True,
                             db_index=True)
    mark = models.CharField(max_length=15, blank=True, null=True,
                            db_index=True)

    A1A2A3 = models.IntegerField(blank=True, null=True)
    A1 = models.IntegerField(blank=True, null=True)
    A2 = models.IntegerField(blank=True, null=True)
    A3 = models.IntegerField(blank=True, null=True)
    A4 = models.IntegerField(blank=True, null=True)
    B1 = models.IntegerField(blank=True, null=True)
    B2 = models.IntegerField(blank=True, null=True)
    B3 = models.IntegerField(blank=True, null=True)
    B4 = models.IntegerField(blank=True, null=True)

    comment = models.CharField(max_length=500, blank=True, null=True)

    tagid = models.CharField(max_length=20, blank=True, null=True)
    tagdoc = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        ordering = ['-recovery_event__year',
                    'recovery_event__agency__abbrev',
                    'fish_identifier_key']

        unique_together = ['recovery_event', 'fish_identifier_key']

    def __str__(self):

        formatted_cwt = "{}-{}-{}".format(self.cwt_number[:2],
                                          self.cwt_number[2:4],
                                          self.cwt_number[4:])
        return "{} - {}".format(formatted_cwt, self.fish_identifier_key)


    def save(self, *args, **kwargs):
        """
        A custom save method that updates the mark and clipc fields
        when the instance is saved.  These fields are composistes of
        related fields and are stored in the database for convenience.

        Arguments:
        - `self`:
        - `*args`:
        - `**kwargs`:

        """

        if self.id:
            if self.marks.all():
                self.mark = self.get_mark_code()
                self.clipc = self.get_clipc()

        super(Recovery, self).save(*args, **kwargs)



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
            mark_code = ''.join(tmp)
            return mark_code
        else:
            return None


    def get_clipc(self):
        """Return a string containing the OMNR clip codes associated
        with this recovery event sorted in ascending order and then
        concatenated together.

        Arguments:
        - `self`:

        """

        tmp = []
        if self.id:
            for mark in self.marks.filter(mark_type='finclip'):
                tmp.append(mark.clip_code)
                tmp.sort()
        if tmp:
            clips = ''.join(tmp)
            return clips
        else:
            return None
