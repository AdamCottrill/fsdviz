'''This script will connect to the **CLEANED** GLFS Database and migrate
the stocking events into the Django orm.

The script get_glfsdb_lookups.py must be run first to ensure that all
of the fields that rely on lookup-tables or foreign keys have
appropriate entries in those tables.

It can be run chunk by chunk (cut-and-paste) or run from the command
line:

> python get_stocking_events.py

'''

import datetime
import pyodbc
import re

import django_settings



import utils.common_lookups as common

from fsdviz.common.models import (Agency,
                                  Lake,
                                  Grid10,
                                  Species,
                                  Strain, StrainRaw,
                                  StateProvince,
                                  Mark,
                                  LatLonFlag)

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

mdbcon.close()
