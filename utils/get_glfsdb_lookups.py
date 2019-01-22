'''
=============================================================
~/FSDViz/utils/get_glfsdb_lookups.py
 Created: 12 Dec 2018 10:49:19

 DESCRIPTION:

  Imports the lookup tables from the GLFSDB to our django database.

#some of the components are going to come from lookup tables - the
#lakes and states are pretty well established and won't change over
#time.  Some fields in the existing database will require some custom
#logic to parse out required information that might break if the data
#in the database is edited in the future.


 A. Cottrill
=============================================================
'''

import datetime
import pyodbc
import re

from collections import OrderedDict

import django_settings

from django.contrib.gis.geos import Point


import utils.common_lookups as common
import utils.lookups_stocking as stocking

from fsdviz.common.models import (Agency,
                                  Lake,
                                  Grid10,
                                  Species,
                                  Strain, StrainRaw,
                                  StateProvince,
                                  ManagementUnit,
                                  Mark,
                                  LatLonFlag,
                                  CWT, CWTsequence
)

from fsdviz.stocking.models import (LifeStage,
                                    Condition,
                                    StockingEvent,
                                    StockingMethod)

from utils.lwdb_utils import (int_or_None,
                              float_or_None,
                              get_stocking_method,
                              get_condition,
                              pprint_dict,
                              clean_title,
                              get_mark_codes,
                              associate_cwt,
                              get_latlon)










START = datetime.datetime.now()

what = 'Lakes'
my_list = []

for item in common.LAKE:
    obj = Lake(abbrev=item[0],
               lake_name=item[1],
               centroid = Point(item[2].ddlon, item[2].ddlat)
    )
    my_list.append(obj)

Lake.objects.bulk_create(my_list, batch_size=10000)
print('\tDone adding {} records (n={:,})'.format(what, len(my_list)))


what = 'Agencies'
my_list = []

for item in common.AGENCIES:
    obj = Agency(abbrev=item[0], agency_name=item[1])
    my_list.append(obj)

Agency.objects.bulk_create(my_list, batch_size=10000)
print('\tDone adding {} records (n={:,})'.format(what, len(my_list)))



what = 'StateProvince'
my_list = []

for item in common.STATEPROV:
    obj = StateProvince(
        abbrev = item[0],
        name = item[1],
        country = 'CAN' if item[2]=='Canada' else 'USA')
    my_list.append(obj)

StateProvince.objects.bulk_create(my_list, batch_size=10000)
print('\tDone adding {} records (n={:,})'.format(what, len(my_list)))


what = 'Management Units'

for item in common.MANAGEMENT_UNITS:
    obj = ManagementUnit(
        label = item[0],
        mu_type = item[1],
        lake = Lake.objects.get(lake_name='Lake ' + item[2]),
        description = item[3],
        centroid = Point(item[4], item[5])
        )
    obj.save()

    #my_list.append(obj)
#StateProvince.objects.bulk_create(my_list, batch_size=10000)
n = len(common.MANAGEMENT_UNITS)
print('\tDone adding {} records (n={:,})'.format(what,n))


what = 'Grid10'
my_list = []

for lake_abbrev, grids  in common.grid_centroids.items():
    lake = Lake.objects.get(abbrev=lake_abbrev)
    for grid, pt in grids.items():
        obj = Grid10(grid=grid,
                     centroid=Point(pt.ddlon, pt.ddlat),
                     lake=lake)
        my_list.append(obj)

Grid10.objects.bulk_create(my_list, batch_size=10000)
print('\tDone adding {} records (n={:,})'.format(what, len(my_list)))


what = 'Species'
my_list = []

for item in common.SPECIES:
    obj = Species(
        species_code = item[0],
        abbrev = item[1],
        scientific_name = item[3],
        common_name = item[2],
        speciescommon = item[4])
    my_list.append(obj)

Species.objects.bulk_create(my_list, batch_size=10000)
print('\tDone adding {} records (n={:,})'.format(what, len(my_list)))


# Strains are our larger groups that collapse the noisy raw strain values into
# categories we can use - strains will be unique to species so that
# 'wild walleye' will be different than 'wild chinook'

what = 'Strains'
my_list = []

for item in common.STRAINS:
    species = Species.objects.get(abbrev=item[0])
    obj = Strain(
        strain_species= species,
        strain_code = item[1],
        strain_label = item[2]
    )
    my_list.append(obj)

Strain.objects.bulk_create(my_list, batch_size=10000)
print('\tDone adding {} records (n={:,})'.format(what, len(my_list)))


what = 'Raw Strains'
my_list = []

for item in common.RAW_STRAINS:
    species = Species.objects.get(abbrev=item[0])
    strain = Strain.objects.get(strain_code=item[1],
                                strain_species=species)
    obj = StrainRaw(
        species = species,
        strain = strain,
        raw_strain = item[2],
        description = item[3]
    )
    my_list.append(obj)

StrainRaw.objects.bulk_create(my_list, batch_size=10000)
print('\tDone adding {} records (n={:,})'.format(what, len(my_list)))


what = 'LAT-LON FLAGS'
my_list = []

for item in common.LATLON_FLAG:
    obj = LatLonFlag(
        value=item[0],
        description=item[1],
    )
    my_list.append(obj)

LatLonFlag.objects.bulk_create(my_list)
print('\tDone adding {} records (n={:,})'.format(what, len(my_list)))





# CONDITION

what = 'Condition'
for item in stocking.CONDITION:
    obj = Condition(
        condition=item[0],
        description=item[1]
        )
    obj.save()
n = len(stocking.CONDITION)
print('\tDone adding {} records (n={:,})'.format(what,n))


what = 'StockingMethod'
for item in stocking.STOCKING_METHOD:
    obj = StockingMethod(
        stk_meth=item[0],
        description=item[1]
        )
    obj.save()
n = len(stocking.STOCKING_METHOD)
print('\tDone adding {} records (n={:,})'.format(what,n))


what = 'LifeStage'
for item in stocking.LIFESTAGE:
    obj = LifeStage(
        abbrev=item[0],
        description=item[1]
        )
    obj.save()
n = len(stocking.LIFESTAGE)
print('\tDone adding {} records (n={:,})'.format(what,n))


what = 'Marks'
for item in common.MARKS:
    obj = Mark(
        mark_code=item[0],
        clip_code=item[1],
        description=item[2],
        mark_type=item[3],
        )
    obj.save()
n = len(common.MARKS)
print('\tDone adding {} records (n={:,})'.format(what,n))


#from lookups import *
#from lwdb_utils import *


pyodbc.lowercase = True

REPORT_WIDTH = 80

MDB = ("C:/Users/COTTRILLAD/Documents/1work/LakeTrout/Stocking/CWTs" +
       "/lakewide_db/data/stocking/GLFSD_2018.mdb")
TABLE_NAME = 'All_CWT_data'

mdbcon = pyodbc.connect(r"DRIVER={Microsoft Access Driver (*.mdb)};DBQ=%s" %MDB)
mdbcur = mdbcon.cursor()

lake_centroids = {x[0]:x[2] for x in common.LAKE}



#==============================================
#              STOCKING DATA

#DEFAULT FORGIEN KEYS IF NULL
# uses current id number in database.
CONDITION = Condition.objects.get(condition=0)
STOCKING_METHOD = StockingMethod.objects.get(stk_meth='u')

VALID_MARKS = [x[0] for x in Mark.objects.all().values_list('mark_code')]


#get the stocking data:
print("Fetching Stocking data...")

sql = """
SELECT Count(N) AS Records
FROM (SELECT DISTINCT Stock_id as N
FROM [{}]
WHERE (((tag_no) Is Not Null And (tag_no)<>''))
);

"""
mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchone()
print("Found {} stocking events with cwt data.".format(rs[0]))

sql = """SELECT DISTINCT [year] FROM {}
WHERE (([tag_no]) Is Not Null And Not ([tag_no])='')"""

mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()
years = [int(x[0]) for x in rs]

sql = """select * from {} where [year]={}
         AND (([tag_no]) Is Not Null And Not ([tag_no])='')"""


for yr in years:

    mdbcur.execute(sql.format(TABLE_NAME, yr))
    rs = mdbcur.fetchall()
    colnames = [x[0] for x in mdbcur.description]


    print("Getting records for {:d}: {:4d} records found".format(int(yr),
                                                             len(rs)))

    for row in rs:

        # convert our row into a dictionary so we can access elements by
        # column name
        record = {k:v for k,v in zip(colnames, row)}

        #these objects are needed to find other objects with compund foreign keys
        # in source data - strains and grids
        species = Species.objects.get(abbrev=record['species'])
        lake = Lake.objects.get(abbrev = record['lake'])

        #spatial pre-processing:
        pt = get_latlon(record, common.grid_centroids,
                        common.mu_centroids,
                        lake_centroids)
        dd_lat = pt.get('ddlat')
        dd_lon = pt.get('ddlon')

        #temporal pre-processing:
        yr = int_or_None(record['year'])
        mo = int_or_None(record['month'])
        day = int_or_None(record['day'])
        try:
            event_date = datetime.datetime(yr,mo,day)
        except TypeError:
            event_date = None

        #this is total hack to ensure stocking id's are unique. Shouldn't be
        #necessary in final product

        #if who=='US':
        #    stock_id += 5000000
        #make our stocking event object:

        my_event = StockingEvent(
            #Required related objects:
            species = species,
            strain_raw = StrainRaw.objects.get(species=species,
                                               raw_strain=record['strain']),

            lake = lake,
            grid_10 = Grid10.objects.get(lake=lake, grid=int(record['grid'])),
            agency = Agency.objects.get(abbrev = record['agency']),
            stateprov = StateProvince.objects.get(abbrev=record['state_prov']),
            lifestage = LifeStage.objects.get(abbrev=record['stage'].lower()),
            condition = get_condition(int_or_None(record['condition']),
                                      CONDITION),
            stocking_method = get_stocking_method(record['stock_meth'],
                                                 STOCKING_METHOD),

            day = day,
            month = mo,
            year = yr,
            date = event_date,

            dd_lat = pt.get('ddlat'),
            dd_lon = pt.get('ddlon'),
            latlong_flag = LatLonFlag.objects.get(value=pt.get('value')),

            site = clean_title(record['site']),
            st_site = clean_title(record['st_site']),
            stock_id = int(record['stock_id']),
            no_stocked = int_or_None(record['no_stocked']),
            yreq_stocked = int_or_None(record['no_stocked']),
            year_class = int_or_None(record['year_class']),
            agemonth = int_or_None(record['agemonth']),
            length = int_or_None(record['length']),
            weight = int_or_None(record['weight']),

            lotcode = record['lot_code'],

            mark = record['mark'],
            mark_eff = float_or_None(record['mark_eff']),
            tag_ret = float_or_None(record['tag_ret']),
            validation = int_or_None(record['validation']),
            notes = record['notes']
        )

        my_event.save()

        mark_codes = get_mark_codes(record['mark'], VALID_MARKS)
        if mark_codes:
            my_marks = Mark.objects.filter(mark_code__in=
                                           mark_codes.get('codes'))
            my_event.marks.add(*my_marks)

        cwt_nums = re.split('[;,\W]+', record['tag_no'])
        for cwt_number in cwt_nums:
            associate_cwt(my_event, cwt_number)

        my_event.save()

    print("Done adding {}".format(yr))


print("Done adding all stocking events!")
