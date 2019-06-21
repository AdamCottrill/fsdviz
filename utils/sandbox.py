import os

import django_settings

from django.db.models import Count, F, Sum, Min, Max

from fsdviz.common.models import *
from fsdviz.stocking.models import *

from django.conf import settings
settings.DEBUG = True
from django.db import connection

#we need a query that returns:

#year
#lake
#management_unit
#grid_10
#geom
#species
#strain
#lifestage
#agency
#clip
#stockingMethod
#event count
#sum no_stocked
#sum yreq

print(len(connection.queries))

# count our events and sum the yreq_stocked
metrics = {
    'stateprov': F('jurisdiction__stateprov__abbrev'),
    'lake': F('jurisdiction__lake__abbrev'),
    'jurisdiction_slug': F('jurisdiction__slug'),
    'man_unit': F('management_unit__slug'),
    'grid10': F('grid_10__slug'),
    'stk_method': F('stocking_method__description'),
    'life_stage': F('lifestage__description'),
    'agency_abbrev': F('agency__abbrev'),
    'species_name': F('species__common_name'),
    'strain': F('strain_raw__strain__strain_label'),
    'events': Count('id'),
    'yreq': Sum('yreq_stocked'),
    'total_stocked': Sum('no_stocked')
}

#grid_10 should be slug
# need to add primary management_unit to each event
foo = StockingEvent.objects.\
    annotate(**metrics).\
    values(           'geom',
                      'lake',
                      'jurisdiction_slug',
                      'man_unit',
                      'stateprov',
                      'grid10',
                      'life_stage',
                      'stk_method',
                      'agency_abbrev',
                      'species_name',
                      'strain',
                      'year_class',
                      'mark',
                      'events',
                      'total_stocked',
                      'yreq_stocked'

    )

foo = foo.filter(year=2015).filter(jurisdiction__lake__abbrev='HU')

print(len(foo), len(connection.queries))









sql = """SELECT polys.*
FROM common_managementunit as polys, stocking_stockingevent as points
WHERE ST_DWithin(polys.geom, points.geom, 100)
AND points.stock_id='20170001'
and polys.primary=true
ORDER BY ST_Distance(polys.geom, points.geom) LIMIT 1;"""

#to get the primary management unit assocaited with a stocking event,
# for grids with centroids outside of MU geometry (grids up rivers)


# here are sql commands that were used to update the yearling equivalents
# for now.  These will refined in the future.
sql = """update stocking_stockingevent as event
set  yreq_stocked=no_stocked * 0.0001
from stocking_lifestage lifestage
where lifestage.id=event.lifestage_id
and lifestage.abbrev = 'e'"""

sql = """update stocking_stockingevent as event
set yreq_stocked=no_stocked * 0.02
from stocking_lifestage lifestage
where lifestage.id=event.lifestage_id
and lifestage.abbrev = 'fry';"""

sql = """update stocking_stockingevent as event
set yreq_stocked=no_stocked * 0.4
from stocking_lifestage lifestage
where lifestage.id=event.lifestage_id
and lifestage.abbrev in ('f','ff','fs','suf');"""




#disctinct values:
values = StockingEvent.objects.values(
    'year', 'date', 'month', 'agency__abbrev', 'species__abbrev',
    'strain_raw__strain', 'mark', 'lifestage__abbrev',
    'stocking_method__stk_meth', 'jurisdiction__slug',
    'jurisdiction__lake__abbrev',
    'jurisdiction__stateprov__abbrev').distinct().order_by()




field_aliases = {
    "agency_code" : F('agency__abbrev'),
    "species_code" : F('species__abbrev'),
    "strain" : F('strain_raw__strain'),
    "lifestage_code" : F('lifestage__abbrev'),
    "stockingMethod" : F('stocking_method__stk_meth'),
    "jurisdiction_code" : F('jurisdiction__slug'),
    "lake" : F('jurisdiction__lake__abbrev'),
    "stateProv" : F('jurisdiction__stateprov__abbrev'),
}



fields = [
    'year',
    #'event_date',
    'month',
    'mark',
    "agency_code",
    "species_code",
    "strain",
    "lifestage_code",
    "stockingMethod",
    "jurisdiction_code",
    "lake",
    "stateProv"
]

counts = {"events": Count('id')}


values = StockingEvent.objects\
                      .select_related('jurisdiction', 'agency', 'species', 'strain', 'lifestage',
                                      'stocking_method', 'jurisdition__lake', 'jurisdiction__stateprov')\
                      .annotate(**field_aliases)\
                      .values(*fields).order_by().annotate(**counts)


#distinct().order_by()

print(len(values))
print(values[8])




# lakes, agencies, juristictions, states/provinces, species, strains, lifestages,
# stockingmethods

#lookups - to provide nice labels for dropdown menues

lakes = Lake.objects.values_list('abbrev', 'lake_name')
stateProv = StateProvince.objects.values_list('abbrev', 'name')
jurisdictions = Jurisdiction.objects.values_list('slug', 'name')
agencies = Agency.objects.all().values('abbrev', 'agency_name')

#manunits
managementUnit = ManagementUnit.objects.values_list('slug', 'label',
                                                    'description')

species = Species.objects.values_list('common_name', 'abbrev')

#Strain????

strains = list(Strain.objects.prefetch_related('species')\
                    .annotate(**{'spc_name': F('species__common_name')})\
                    .values('id', 'spc_name', 'strain_code', 'strain_label')
                   .distinct().order_by())


stocking_methods = StockingMethod.objects.values_list('stk_meth',
                                                      'description')
lifestages = LifeStage.objects.values_list('id', 'abbrev', 'description')


flds = {"common_name": F('species__common_name'),
       'abbrev': F('species__abbrev')}

species = StockingEvent.objects.prefetch_related('species')\
                               .annotate(**flds)\
                               .values_list('common_name', 'abbrev')\
                               .distinct().order_by()



lifestages = list(LifeStage.objects.values('id', 'abbrev', 'description'))

 [(x['id'], '{description} ({abbrev})'.format(**x)) for x in lifestages]


[(x['id'], '{spc_name} - {strain_label} ({strain_code})'.format(**x)) for x in strains]






data = StockingEvent.objects.filter(year=2014,
                                    jurisdiction__lake__abbrev='HU',
                                    species__abbrev='LAT')\
                            .values('dd_lat', 'dd_lon', 'month',
                                    'life_stage',
                                    'stk_method',
                                    'agency_abbrev',
                                    'species_name',
                                    'strain',
                                    'year_class',
                                    'mark'
                            )





field_aliases = {
    "agency_code" : F('agency__abbrev'),
    "species_code" : F('species__abbrev'),
    "strain" : F('strain_raw__strain__id'),
    "lifestage_code" : F('lifestage__abbrev'),
    "stockingMethod" : F('stocking_method__stk_meth'),
    "jurisdiction_code" : F('jurisdiction__slug'),
    "lake" : F('jurisdiction__lake__abbrev'),
    "stateProv" : F('jurisdiction__stateprov__abbrev'),
}



fields = [
    'year',
    'stock_id',
    #'event_date',
    'month',
    'mark',
    "agency_code",
    "species_code",
    "strain",
    "lifestage_code",
    "stockingMethod",
    "jurisdiction_code",
    "lake",
    "stateProv",
    "no_stocked",
    "yreq_stocked"
]



values = StockingEvent.objects\
                      .select_related('jurisdiction', 'agency',
                                      'species', 'strain', 'lifestage',
                                      'stocking_method',
                                      'jurisdition__lake',
                                      'jurisdiction__stateprov')\
                      .annotate(**field_aliases)\
                      .values(*fields)\
                      .filter(stock_id='2725');


                      .filter(year=2014,
                              jurisdiction__lake__abbrev='HU',
                              species__abbrev='LAT')




formdata = {
    'first_year': 2000,
    'months': [3,5,8],
    'species': ['ATS','RBT','LAT','CHS'],
    'lake':['MI','HU'],
    'agency': []

}
