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

    stk_meth = models.CharField(max_length=25, unique=True)
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

    date = models.DateField(blank=True, null=True)

    day = models.IntegerField(blank=True, null=True)
    month = models.IntegerField(db_index=True, blank=True, null=True)
    year = models.IntegerField(db_index=True)

    site = models.CharField(max_length=100, blank=True, null=True)
    st_site = models.CharField(max_length=100, blank=True, null=True)

    dd_lat = models.FloatField(blank=True, null=True)
    dd_lon = models.FloatField(blank=True, null=True)

    geom = models.PointField(srid=4326, blank=True, null=True)

    latlong_flag = models.ForeignKey(LatLonFlag, on_delete=models.CASCADE,
                                     related_name='stocking_events')

    grid_5 = models.CharField(max_length=4, blank=True, null=True)

    no_stocked = models.IntegerField()
    year_class = models.IntegerField(db_index=True)
    agemonth = models.IntegerField(blank=True, null=True)
    length = models.IntegerField(blank=True, null=True)
    weight = models.IntegerField(blank=True, null=True)

    lotcode = models.CharField(max_length=100, blank=True, null=True)

    tag_no = models.CharField(max_length=100, blank=True, null=True,
                              db_index=True)

    clipa = models.CharField(max_length=10, blank=True, null=True,
                             db_index=True)

    mark = models.CharField(max_length=15, blank=True, null=True,
                            db_index=True)

    mark_eff = models.FloatField(blank=True, null=True)
    tag_ret = models.FloatField(blank=True, null=True)
    validation = models.IntegerField(blank=True, null=True)
    notes = models.CharField(max_length=500, blank=True, null=True)


    class Meta:
        ordering = ['-year', 'stock_id']

    def __str__(self):
        return 'id:{} ({}-{}-{})'.format(self.stock_id, self.site,
                                         self.agency.abbrev,
                                         self.species.abbrev)
