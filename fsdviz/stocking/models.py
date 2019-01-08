from django.db import models




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



# cwt2event
# Stocking_Event (m2m to marks)
