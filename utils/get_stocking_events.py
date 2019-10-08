"""This script will connect to the **CLEANED** GLFS Database and migrate
the stocking events into the Django orm.

The script get_glfsdb_lookups.py must be run first to ensure that all
of the fields that rely on lookup-tables or foreign keys have
appropriate entries in those tables.

It can be run chunk by chunk (cut-and-paste) or run from the command
line:

> python get_stocking_events.py

"""

import datetime
import pyodbc
import re

from collections import namedtuple

import django_settings

import utils.common_lookups as common

from fsdviz.common.models import (
    Agency,
    Lake,
    ManagementUnit,
    Jurisdiction,
    Grid10,
    Species,
    Strain,
    StrainRaw,
    StateProvince,
    Mark,
    LatLonFlag,
)

from fsdviz.stocking.models import LifeStage, Condition, StockingEvent, StockingMethod

from utils.lwdb_utils import (
    int_or_None,
    float_or_None,
    get_stocking_method,
    get_condition,
    pprint_dict,
    clean_title,
    get_mark_codes,
    associate_cwt,
    get_latlon,
    get_or_create_rawStrain,
    build_years_array,
)


FIRST_YEAR = None
LAST_YEAR = 1998

MDB = (
    "C:/Users/COTTRILLAD/1work/LakeTrout/Stocking/GLFSD_Datavis/fsdviz/"
    + "utils/PrepareGLFSDB.accdb"
)


REPORT_WIDTH = 80


# set up our spatial lookups:

# \lake_centroids = {x[0]:x[2] for x in common.LAKE}

Centroid = namedtuple("Centroid", "ddlat, ddlon")
lakes = Lake.objects.all()
lake_centroids = {
    x.abbrev: Centroid(ddlat=x.geom.centroid.y, ddlon=x.geom.centroid.x)
    for x in Lake.objects.exclude(geom__isnull=True)
}

mus = ManagementUnit.objects.all()
mu_centroids = {
    x.label: Centroid(ddlat=x.geom.centroid.y, ddlon=x.geom.centroid.x) for x in mus
}

# grid centroids need the be nested within Lake

grid_centroids = {}

for lake in lakes:
    grids = Grid10.objects.filter(lake=lake)
    tmp = {x.grid: Centroid(ddlon=x.centroid.x, ddlat=x.centroid.y) for x in grids}
    grid_centroids[lake.abbrev] = tmp


# ==============================================
#              STOCKING DATA

# DEFAULT FORGIEN KEYS IF NULL
# uses current id number in database.
CONDITION = Condition.objects.get(condition=0)
STOCKING_METHOD = StockingMethod.objects.get(stk_meth="u")

VALID_MARKS = [x[0] for x in Mark.objects.all().values_list("mark_code")]


##lifestage lookup:
lifestage_lookup = {x.abbrev: x for x in LifeStage.objects.all()}
lifestage_default, created = LifeStage.objects.get_or_create(
    abbrev="u", description="unknown"
)

# lookup to minimize the number database queries:
lake_lookup = {x.abbrev: x for x in lakes}
mu_lookup = {x.label: x for x in mus}
agency_lookup = {x.abbrev: x for x in Agency.objects.all()}
stateprov_lookup = {x.abbrev: x for x in StateProvince.objects.all()}
species_lookup = {x.abbrev: x for x in Species.objects.all()}


# get the stocking data:
print("Fetching Stocking data...")

pyodbc.lowercase = True
constring = "DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=%s"
mdbcon = pyodbc.connect(constring % MDB)
mdbcur = mdbcon.cursor()

# sql = """
# SELECT Count(N) AS Records
# FROM (SELECT DISTINCT Stock_id as N
# FROM [{}]
# WHERE (((tag_no) Is Not Null And (tag_no)<>''))
# );
#
# """
# mdbcur.execute(sql.format(TABLE_NAME))
# rs = mdbcur.fetchone()
# print("Found {} stocking events with cwt data.".format(rs[0]))
#

mdbcur.execute("SELECT MIN([year]), MAX(YEAR) FROM [GLFSD]")
rs = mdbcur.fetchall()[0]
years = [int(x) for x in rs]

# subset our years array depend the provided first and last year parameters:
years = build_years_array(years, FIRST_YEAR, LAST_YEAR)
years.sort(reverse=True)

# clear out the associated records from the FSDVIZ datbase:
StockingEvent.objects.filter(year__in=years).delete()


for yr in years:

    sql = "exec [get_stocking_data] @yr={}".format(yr)
    mdbcur.execute(sql)
    rs = mdbcur.fetchall()

    colnames = [x[0].lower() for x in mdbcur.description]

    print("Getting records for {:d}: {:4d} records found".format(int(yr), len(rs)))

    for row in rs:

        # convert our row into a dictionary so we can access elements by
        # column name
        record = {k: v for k, v in zip(colnames, row)}

        # these objects are needed to find other objects with compund foreign keys
        # in source data - strains and grids
        species = species_lookup.get(record["species"].strip())

        strain_raw = get_or_create_rawStrain(species, raw_strain=record["strain"])

        lake = lake_lookup.get(record["lake"].strip())
        stateprov = stateprov_lookup.get(record["state_prov"].strip())

        jurisdiction = Jurisdiction.objects.get(stateprov=stateprov, lake=lake)

        managementUnit = mu_lookup.get(record["stat_dist"].upper())

        # spatial pre-processing:
        pt = get_latlon(record, grid_centroids, mu_centroids, lake_centroids)
        dd_lat = pt.get("ddlat")
        dd_lon = pt.get("ddlon")

        # temporal pre-processing:
        yr = int_or_None(record["year"])
        mo = int_or_None(record["month"])
        day = int_or_None(record["day"])
        try:
            event_date = datetime.datetime(yr, mo, day)
        except (TypeError, ValueError):
            event_date = None

        # this is total hack to ensure stocking id's are unique. Shouldn't be
        # necessary in final product

        # if who=='US':
        #    stock_id += 5000000
        # make our stocking event object:

        my_event = StockingEvent(
            # Required related objects:
            species=species,
            strain_raw=strain_raw,
            jurisdiction=jurisdiction,
            management_unit=managementUnit,
            grid_10=Grid10.objects.get(lake=lake, grid=int(record["grid"])),
            agency=agency_lookup.get(record["agency"]),
            lifestage=lifestage_lookup.get(record["stage"], lifestage_default),
            condition=get_condition(int_or_None(record["condition"]), CONDITION),
            stocking_method=get_stocking_method(record["stock_meth"], STOCKING_METHOD),
            day=day,
            month=mo,
            year=yr,
            date=event_date,
            dd_lat=pt.get("ddlat"),
            dd_lon=pt.get("ddlon"),
            latlong_flag=LatLonFlag.objects.get(value=pt.get("value")),
            site=clean_title(record["site"]),
            st_site=clean_title(record["st_site"]),
            stock_id=int(record["stock_id"]),
            no_stocked=int_or_None(record["no_stocked"]),
            yreq_stocked=int_or_None(record["no_stocked"]),
            year_class=int_or_None(record["year_class"]),
            agemonth=int_or_None(record["agemonth"]),
            length=int_or_None(record["length"]),
            weight=int_or_None(record["weight"]),
            lotcode=record["lot_code"],
            mark=record["mark"],
            mark_eff=float_or_None(record["mark_eff"]),
            tag_ret=float_or_None(record["tag_ret"]),
            validation=int_or_None(record["validation"]),
            notes=record["notes"],
        )

        my_event.save()

        mark_codes = get_mark_codes(record["mark"], VALID_MARKS)
        if mark_codes:
            my_marks = Mark.objects.filter(mark_code__in=mark_codes.get("codes"))
            my_event.marks.add(*my_marks)

        if record["tag_no"]:
            cwt_nums = re.split("[;,\W]+", record["tag_no"])
            for cwt_number in cwt_nums:
                associate_cwt(my_event, cwt_number)

        my_event.save()

    print("Done adding {}".format(yr))

print("Done adding all stocking events!")

# mdbcon.close()


years = StockingEvent.objects.order_by("-year").values_list("year").distinct()
years = [x[0] for x in years if x[0] <= 2014]
problems = []

for yr in years:
    events = StockingEvent.objects.filter(year=yr)
    print("Updating events from {}".format(yr))

    for event in events:
        mu = get_closest_ManagementUnit(event)
        if mu:
            event.management_unit = mu
            event.save()
        else:
            problems.push(event.stock_id)
print("Done!")
print("Found {} problems.".format(len(problems)))
