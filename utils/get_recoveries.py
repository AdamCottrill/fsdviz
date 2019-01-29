'''
=============================================================
~/utils/append_recoveries.py
Created: 25 Jan 2019 14:44:02

DESCRIPTION:

This script appends the recovery data from GLFC Lamprey submission
into the glfc stocking dataviz database.

More....

A. Cottrill
=============================================================

'''

import datetime
import pyodbc
#import sys

import django_settings

from collections import OrderedDict

from fsdviz.common.models import (Lake, Mark, Agency, LatLonFlag, Grid10,
                                  StateProvince, Species)

from fsdviz.recovery.models import RecoveryEvent, Recovery


from utils.lwdb_utils import (int_or_None,
                              float_or_None,
                              clean_title,
                              pprint_dict,
                              get_mark_codes,
                              get_latlon,
                              grid_or_None)

import utils.common_lookups as common

#==============================================
#                 GLOBALS

#this is a total hack for now.  Allows us to associated each recovery
# (which inclues MU) - with a province or state
stateProv_dict = {
    '': 'MI',
    '4-1': 'ON',
    '4-2': 'ON',
    '4-3': 'ON',
    '4-5': 'ON',
    '5-1': 'ON',
    '5-2': 'ON',
    '5-3N': 'ON',
    '5-5': 'ON',
    '5-6E': 'ON',
    '5-7': 'ON',
    '5-9': 'ON',
    '6-1': 'ON',
    '6-3': 'ON',
    'ILL': 'IL',
    'IND': 'IN',
    'MH1': 'MI',
    'MH2': 'MI',
    'MH3': 'MI',
    'MH4': 'MI',
    'MH5': 'MI',
    'MM1': 'MI',
    'MM2': 'MI',
    'MM3': 'MI',
    'MM4': 'MI',
    'MM5': 'MI',
    'MM6': 'MI',
    'MM7': 'MI',
    'MM8': 'MI',
    'WM': 'WI',
    'WM1': 'WI',
    'WM2': 'WI',
    'WM3': 'WI',
    'WM4': 'WI',
    'WM5': 'WI',
    'Zone1': 'ON',
    'Zone2': 'ON',
    'Zone3': 'ON'
}






START = datetime.datetime.now()

#MS access is not case sensitive, but python is. This option makes
#column names returned by queries to all be lower case
#(Year==YEAR==year)
pyodbc.lowercase = True


SOURCE_DB = ('C:/Users/COTTRILLAD/Documents/1work/LakeTrout/Stocking' +
             '/CWTs/lakewide_db/data/recoveries/Cottrill CWT Spr 2018.accdb')

TABLE_NAMES = {'gear': 'Gear',
                   'fish': 'Biodata'}

SPECIES_FIELD = 'SpeciesCommon'


VALID_MARKS = [x[0] for x in Mark.objects.all().values_list('mark_code')]

lake_centroids = {x[0]:x[2] for x in common.LAKE}
net_material_dict = {x[1]:x[0] for x in RecoveryEvent.NET_MATERIAL_CHOICES}

#these dictionaries will return pre-fetched lake and agency objects using
# their abbreviations or shortened names:
lake_dict = {x.lake_name.replace('Lake ',''):x for x in Lake.objects.all()}
agency_dict = {x.abbrev:x for x in Agency.objects.all()}

#we can't always be sure what field will be used to refer to species
#so we will have a two step process get all the values for species
#field, and their associated id from the postgres database:

species_id = Species.objects.all().values_list(SPECIES_FIELD.lower(), 'id')\
                                  .distinct()
species_dict = {}
for spc in species_id:
    species_dict[spc[0]] = Species.objects.get(id=spc[1])





#MS ACCESS CURSOR
mdb_constr = r"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={}"
mdbcon = pyodbc.connect(mdb_constr.format(SOURCE_DB))
mdbcur = mdbcon.cursor()


print('Fetching gear/effort data....')

# long form query allows us to remove units (e.g. '(mm)')
# [{gear}]. is not strictly necessary, but avoids circular alias errors
# that can occur if field name is same as alias ("[LIFTID] as liftid")
# we use formatnumber() to explicity cast exp. notation to number.
sql = """
SELECT DISTINCT
 [{gear}].[liftid],
 trim([{gear}].[lake]) as lake,
 [{gear}].[agency],
 [{gear}].[location],
 [{gear}].[latitude],
 [{gear}].[longitude],
 [{gear}].[mu] as stat_dist,
 [{gear}].[grid],
 [{gear}].[year],
 [{gear}].[month],
 [{gear}].[day],
 [{gear}].[surveytype],
 [{gear}].[surveydescription],
 [{gear}].[gear],
 [{gear}].[nights],
 FormatNumber([{gear}].[NetLength(km)],4) as netlength,
 [{gear}].[depth1(m)] as depth1,
 [{gear}].[depth2(m)] as depth2,
 [{gear}].[avgdepth(m)] as avgdepth,
 [{gear}].[netmaterial],
 [{gear}].[minmesh(mm)] as minmesh,
 [{gear}].[maxmesh(mm)] as maxmesh,
 [{gear}].[comments]
 from [{gear}]
 LEFT OUTER JOIN [{fish}] ON [{gear}].LiftID = [{fish}].LiftID
 WHERE ((([{fish}].CWT) Is Not Null And ([{fish}].CWT)<>''));
"""

mdbcur.execute(sql.format(**TABLE_NAMES))
rs = mdbcur.fetchall()
print('{} records found'.format(len(rs)))
colnames = [x[0] for x in mdbcur.description]


for row in rs:
    record = {k:v for k,v in zip(colnames, row)}

    #spatial pre-processing:
    pt = get_latlon(record, common.grid_centroids,
                common.mu_centroids,
                lake_centroids)

    #temporal pre-processing:
    yr = int_or_None(record['year'])
    mo = int_or_None(record['month'])
    day = int_or_None(record['day'])
    try:
        event_date = datetime.datetime(yr,mo,day)
    except TypeError:
        event_date = None


    lake=lake_dict[record['lake']]

    state_abbrev = stateProv_dict[record['stat_dist']]

    event = RecoveryEvent(

        lift_identifier=record['liftid'],

        #fk from maps:
        lake=lake,
        agency=agency_dict[record['agency']],
        stateprov=StateProvince.objects.get(abbrev=state_abbrev),

        #stat_district_id = statdist_map.get(record['stat_dist']),

        day = day,
        month = mo,
        year = yr,
        date = event_date,

        grid_10 = grid_or_None(lake, record['grid']),
        location = clean_title(record['location']),
        dd_lat = pt.get('ddlat'),
        dd_lon = pt.get('ddlon'),
        latlong_flag = LatLonFlag.objects.get(value=pt.get('value')),

        program_type = record['surveytype'],
        program_description = record['surveydescription'],
        gear = record['gear'],
        nights = record['nights'],
        net_length = int_or_None(record['netlength']),
        depth_min = float_or_None(record['depth1']),
        depth_max = float_or_None(record['depth2']),
        depth_avg = record['avgdepth'],
        #surface_temp =
        #bottom_temp = Column(Float)
        #NOTE - this is wrong
        #net_material = net_material_dict.get(record['netmaterial'],''),
        net_material = 'N',
        mesh_min = record['minmesh'],
        mesh_max = record['maxmesh'],
        comments = record['comments']
    )
    event.save()

print('Done adding recovery events.')


#==============================================
#              FISH DATA

print('Fetching fish/cwt recovery data....')

# long form query allows us to remove units (e.g. '(mm)').
# [{fish}]. is not strictly necessary, but avoids circular alias errors
# that can occur if field name is same as alias ("[fishid] as fishid")
sql = """
SELECT
 [{fish}].[LiftID] as liftid,
 [{fish}].[Lake],
 [{fish}].[Agency],
 [{fish}].[FishID],
 [{fish}].[MeshSize(mm)] as meshsize,
 [{fish}].[SpeciesNumber],
 [{fish}].[SpeciesName],
 [{fish}].[SpeciesAbbrev],
 [{fish}].[SpeciesCommon],
 [{fish}].[Length(mm)] as length,
 [{fish}].[Weight(g)] as weight,
 [{fish}].[R/D] as round_dressed,
 [{fish}].[CWT],
 [{fish}].[Age],
 [{fish}].[AgeStructure],
 [{fish}].[Sex],
 [{fish}].[Maturity],
 [{fish}].[FinClip],
 [{fish}].[A1-A3] as a1a2a3,
 [{fish}].[A1],
 [{fish}].[A2],
 [{fish}].[A3],
 [{fish}].[A4],
 [{fish}].[B1],
 [{fish}].[B2],
 [{fish}].[B3],
 [{fish}].[B4],
 [{fish}].[Comments]
from [{fish}]
where  [{fish}].[CWT] is not null and [{fish}].[CWT]<>'';
"""

mdbcur.execute(sql.format(**TABLE_NAMES), )
rs = mdbcur.fetchall()
colnames = [x[0] for x in mdbcur.description]
print('{} records found with cwt data'.format(len(rs)))

#now that all of the efforts have been added, we can create a map for
#them too:
events = RecoveryEvent.objects.all()
events_dict = {x.lift_identifier:x for x in events}

#Finally create all of our recovery objects
for row in rs:
    #for row in rs:
    record = {k:v for k,v in zip(colnames, row)}

    recovery = Recovery(
        #related objects:
        species = species_dict[record[SPECIES_FIELD.lower()]],
        #effort_id = effort.id,
        recovery_event =events_dict[record['liftid']],

        manufacturer = 'nmt',
        cwt_number = record['cwt'].replace('-',''),
        fish_identifier_key = record['fishid'],
        mesh_size = record['meshsize'],
        length = int_or_None(record['length']),
        weight = int_or_None(record['weight']),
        weight_form = (record.get('round_dressed') if
                       record.get('round_dressed') else 'U'),
        sex = record.get('sex') if record.get('sex') else 'U',
        maturity = record.get('maturity') if record.get('maturity') else 'U',
        clipc = record['finclip'],
        A1 = record['a1'],
        A2 = record['a2'],
        A3 = record['a3'],
        A4 = record['a4'],
        B1 = record['b1'],
        B2 = record['b2'],
        B3 = record['b3'],
        B4 = record['b4'],
        A1A2A3 = record['a1a2a3'],
        age = int_or_None(record['age']),
        agestructure = record['agestructure'],
        comment = record['comments'],
    )

    recovery.save()

    mark_codes = get_mark_codes(record['finclip'], VALID_MARKS)
    if mark_codes:
        my_marks = Mark.objects.filter(mark_code__in=
                                       mark_codes.get('codes'))
        recovery.marks.add(*my_marks)
        recovery.save()

print("Done adding recoveries.")


delta_time = datetime.datetime.now() - START
print("Done Adding Recoveries and Recovery Events ({})".format(delta_time))
