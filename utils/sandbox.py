import os

import django_settings

from django.db.models import Count, F, Sum

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
