from django.contrib.gis.db import models

from fsdviz.common.models import (Species, Strain, StrainRaw, Agency,
                                  Lake, StateProvince,
                                  Grid10, LatLonFlag, Mark)


class LifeStage(models.Model):
    '''
    A model to capture the lifestage of the stocked fish.
    '''

    abbrev = models.CharField(max_length=7, unique=True)
    description = models.CharField(max_length=100)

    class Meta:
        ordering = ['abbrev']

    def __str__(self):
        return "{} ({})".format(self.description, self.abbrev)


class Condition(models.Model):
    '''
    A model to capture the condition of the stocked when they were
    stocked.
    '''

    condition = models.IntegerField(unique=True)
    description = models.CharField(max_length=100)

    class Meta:
        ordering = ['condition']

    def __str__(self):
        return "{} - {}".format(self.condition, self.description)


class StockingMethod(models.Model):
    '''
    A model to capture the method used to the stock the fish.
    '''

    stk_meth = models.CharField("Stocking Method", max_length=25, unique=True)
    description = models.CharField(max_length=100)

    class Meta:
        ordering = ['stk_meth']

    def __str__(self):
        return "{} ({})".format(self.description, self.stk_meth)


# TODO: Add table for known stocking sites - this may have to be a many-to-many
# to accomodate site aliases similar to strains-strainsRaw.
# class StockingSite(models.Model):


class StockingEvent(models.Model):
    '''
    A model to capture actual stocking events - 'a pipe in the water'.
    '''


    VALIDATION_CODE_CHOICES = [
        (0, 'level 0, entered at hatchery, unknown verification status'),
        (1, 'level 1, entered at hatchery and not verified'),
        (2, 'level 2, entered and verified at hatchery'),
        (3, 'level 3, entered at hatchery and verified by GBFRO'),
        (4, 'level 4, entered and verified at hatchery and verified at GBFRO'),
        (5, 'level 5, entered and verified at GLFC'),
        (6, 'level 6, entered and verified at GBFRO'),
        (7, 'entered by Dept. FW, MSU., not avail. from GLFC'),
        (8, 'entered by COTFMA'),
        (9, 'assumed to be validated by state prior to receipt'),
        (10, 'level 10, data entered and verified at OMNR'),
    ]

    species = models.ForeignKey(Species, on_delete=models.CASCADE,
                                related_name='stocking_events')

    #foreign key to strain_raw, strain will be made available through
    # a class method that will traverse the Strain-StrainRaw relationship.
    strain_raw = models.ForeignKey(StrainRaw, on_delete=models.CASCADE,
                                   related_name='stocking_events')

    ## Marks ??
    marks = models.ManyToManyField(Mark)

    agency = models.ForeignKey(Agency, on_delete=models.CASCADE,
                               related_name='stocking_events')

    lake = models.ForeignKey(Lake, on_delete=models.CASCADE,
                             related_name='stocking_events')

    stateprov = models.ForeignKey(StateProvince, on_delete=models.CASCADE,
                                  related_name='stocking_events')

    # stat_dist = models.ForeignKey(StatDistrict, on_delete=models.CASCADE,
    #                               related_name='stocking_events')

    grid_10 = models.ForeignKey(Grid10, on_delete=models.CASCADE,
                                related_name='stocking_events')

    stocking_method = models.ForeignKey(StockingMethod,
                                        on_delete=models.CASCADE,
                                        related_name='stocking_events')

    lifestage = models.ForeignKey(LifeStage, on_delete=models.CASCADE,
                                  related_name='stocking_events')

    condition = models.ForeignKey(Condition, on_delete=models.CASCADE,
                                  related_name='stocking_events')

    #unique fish stocking event identifier
    stock_id = models.CharField('unique event identifier provided by agency',
                                max_length=100, unique=True)

    date = models.DateField('Stocking event date', blank=True, null=True)

    day = models.IntegerField('Day of the month', blank=True, null=True)
    month = models.IntegerField('Month of stokcing event as an integer',
                                db_index=True, blank=True, null=True)
    year = models.IntegerField('year of the stocking event as an integer >1900',
                               db_index=True)

    site = models.CharField(max_length=100, blank=True, null=True)
    st_site = models.CharField(max_length=100, blank=True, null=True)

    dd_lat = models.FloatField('Latitude in decimal degrees',
                               blank=True, null=True)
    dd_lon = models.FloatField('Longitude in decimal degrees',
                               blank=True, null=True)

    geom = models.PointField('GeoDjango spatial point field',
                             srid=4326, blank=True, null=True)

    latlong_flag = models.ForeignKey(LatLonFlag, on_delete=models.CASCADE,
                                     related_name='stocking_events')

    grid_5 = models.CharField(max_length=4, blank=True, null=True)

    no_stocked = models.IntegerField('Number of fish stocked')
    yreq_stocked = models.IntegerField(
        'Number of fish stocked as yearling equivalents')
    year_class = models.IntegerField('Year class of stocked fish',
                                     db_index=True)
    agemonth = models.IntegerField('age of stocked fish in months',
                                   blank=True, null=True)
    length = models.IntegerField('length of stocked fish in mm',
                                 blank=True, null=True)
    weight = models.IntegerField('weight of stocked fish in grams',
                                 blank=True, null=True)

    lotcode = models.CharField(
        'Hatchery Lot code indicating source of stocked fish',
        max_length=100, blank=True, null=True)

    tag_no = models.CharField(max_length=100, blank=True, null=True,
                              db_index=True)

    clipa = models.CharField(max_length=10, blank=True, null=True,
                             db_index=True)

    mark = models.CharField('Chemical, tag, or finclip mark applied to fish',
                            max_length=15, blank=True, null=True,
                            db_index=True)

    mark_eff = models.FloatField('Marking efficency as a percentage',
                                 blank=True, null=True)
    tag_ret = models.FloatField('Tag retention as a percentage',
                                blank=True, null=True)
    validation = models.IntegerField('Event Data Validation Code 0-10.',
                                     choices=VALIDATION_CODE_CHOICES,
                                     blank=True, null=True)
    notes = models.CharField(max_length=500, blank=True, null=True)

    class Meta:
        ordering = ['-year', 'stock_id']

    def __str__(self):
        return 'id:{} ({}-{}-{})'.format(self.stock_id, self.site,
                                         self.agency.abbrev,
                                         self.species.abbrev)

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

        if self.id:
            if self.marks.all():
                self.mark = self.get_mark_code()
                self.clipa = self.get_clipa()

        super(StockingEvent, self).save(*args, **kwargs)



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


    def get_clipa(self):
        """Return a string containing the OMNR clip codes associated
        with this stocking event sorted in ascending order and then
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
