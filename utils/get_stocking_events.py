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
import logging
import pyodbc
import re

# from collections import namedtuple

import django_settings

from django.contrib.gis.geos import Point
from django.db import transaction, connection

# import utils.common_lookups as common

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
    PhysChemMark,
    FishTag,
    FinClip,
)

from fsdviz.stocking.models import (
    LifeStage,
    Condition,
    StockingEvent,
    StockingMethod,
    Hatchery,
)

from utils.lwdb_utils import (
    int_or_None,
    float_or_None,
    #    get_stocking_method,
    #    get_condition,
    #    print_info_dict,
    clean_title,
    get_mark_codes,
    associate_cwt,
    #    get_latlon,
    #    get_or_create_rawStrain,
    get_closest_ManagementUnit,
    build_years_array,
    GridCache,
    RawStrainCache,
)


logging.basicConfig(filename="utils/GLFSD_insert.log", level=logging.DEBUG)
console = logging.StreamHandler()
console.setLevel(logging.DEBUG)
logging.getLogger().addHandler(console)


MDB = "C:/1work/Scrapbook/fsdviz_April2022/GLFSD_April_2022.accdb"


# ==============================================
#          LOOK UP Dictinaries

# DEFAULT FORGIEN KEYS IF NULL
# uses current id number in database.
CONDITION = Condition.objects.get(condition=99)
STOCKING_METHOD = StockingMethod.objects.get(stk_meth="u")

clips = {x.abbrev: x for x in FinClip.objects.all()}
marks = {x.mark_code: x for x in PhysChemMark.objects.all()}
fishtags = {x.tag_code: x for x in FishTag.objects.all()}

latlon_flags = {x.value: x for x in LatLonFlag.objects.all()}

condition_lookup = {x.condition: x for x in Condition.objects.all()}
stk_meth_lookup = {x.stk_meth: x for x in StockingMethod.objects.all()}
hatchery_lookup = {x.abbrev: x for x in Hatchery.objects.all()}
lifestage_lookup = {x.abbrev: x for x in LifeStage.objects.all()}
lifestage_default, created = LifeStage.objects.get_or_create(
    abbrev="u", description="unknown"
)

# lookup to minimize the number database queries:
lake_lookup = {x.abbrev: x for x in Lake.objects.all()}
mu_lookup = {x.label: x for x in ManagementUnit.objects.all()}
agency_lookup = {x.abbrev: x for x in Agency.objects.all()}
stateprov_lookup = {x.abbrev: x for x in StateProvince.objects.all()}
species_lookup = {x.abbrev: x for x in Species.objects.all()}

grid_lookup = GridCache()
grids = Grid10.objects.all()
for grid in grids:
    grid_lookup.add_grid(grid)

strain_alias_lookup = RawStrainCache()
strain_aliases = StrainAlias.objects.all()
for strain in strain_aliases:
    strain_alias_lookup.add_strain(strain)

# ==============================================
# get the stocking data:
print("Fetching Stocking data...")

pyodbc.lowercase = True
constring = "DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=%s"
mdbcon = pyodbc.connect(constring % MDB)
mdbcur = mdbcon.cursor()

FIRST_YEAR = 1950
LAST_YEAR = 2022


mdbcur.execute("SELECT MIN([year]), MAX(YEAR) FROM [GLFSD]")
rs = mdbcur.fetchall()[0]
years = [int(x) for x in rs]


# subset our years array depend the provided first and last year parameters:
years = build_years_array(years, FIRST_YEAR, LAST_YEAR)
years.sort()

# clear out the associated records from the FSDVIZ datbase:


disable_trigger = """ALTER TABLE stocking_stockingevent
            DISABLE TRIGGER update_reused_cwt_flags_trigger"""

# ========================================  YEAR LOOP

for yr in years:

    with connection.cursor() as cursor:
        with transaction.atomic():

            def restore_trigger():
                """A function to be called after the transaction is complete.  Cannot
                take arguments and must use the same cursor as our transaction"""

                enable_trigger = """ALTER TABLE stocking_stockingevent
                ENABLE TRIGGER update_reused_cwt_flags_trigger"""
                cursor.execute(enable_trigger)

            transaction.on_commit(restore_trigger)

            cursor.execute(disable_trigger)

            StockingEvent.objects.filter(year=yr).delete()

            sql = "exec [get_GLFSD_for_django] @yr={}".format(yr)
            mdbcur.execute(sql)
            rs = mdbcur.fetchall()

            colnames = [x[0].lower() for x in mdbcur.description]

            print(
                "Getting records for {:d}: {:4d} records found".format(int(yr), len(rs))
            )

            for row in rs:

                # convert our row into a dictionary so we can access elements by
                # column name
                record = {k: v for k, v in zip(colnames, row)}

                # these objects are needed to find other objects with compund foreign keys
                # in source data - strains and grids
                species = species_lookup.get(record["species"].strip())

                # strain_alias = get_or_create_rawStrain(species, strain_alias=record["strain"])

                strain_alias = strain_alias_lookup.get_strain(
                    species.abbrev, record["strain"]
                )

                if strain_alias is None:
                    logging.warning(
                        "Unknown Strain: {stock_id} - {species} ({strain})".format(
                            **record
                        )
                    )
                    continue

                lake = lake_lookup.get(record["lake"].strip())
                stateprov = stateprov_lookup.get(record["state_prov"].strip())

                jurisdiction = Jurisdiction.objects.get(stateprov=stateprov, lake=lake)

                managementUnit = mu_lookup.get(record["stat_dist"].upper())

                # temporal pre-processing:
                yr = int_or_None(record["year"])
                mo = int_or_None(record["month"])
                day = int_or_None(record["day"])
                try:
                    event_date = datetime.datetime(yr, mo, day)
                except (TypeError, ValueError):
                    event_date = None

                grid_number = str(int(record["grid"]))
                grid10 = grid_lookup.get_grid(record["lake"], grid_number)

                if grid10 is None:
                    logging.warning(
                        "Unknown Grid10: {} - {} ({})".format(
                            record["stock_id"], grid_number, record["lake"]
                        )
                    )
                    continue

                event = StockingEvent(
                    # Required related objects:
                    species=species,
                    strain_alias=strain_alias,
                    jurisdiction=jurisdiction,
                    management_unit=managementUnit,
                    grid_10=grid10,
                    agency=agency_lookup.get(record["agency"]),
                    day=day,
                    month=mo,
                    year=yr,
                    date=event_date,
                    dd_lat=record["latitude"],
                    dd_lon=record["longitude"],
                    geom=Point(float(record["_dd_lon"]), float(record["_dd_lat"])),
                    latlong_flag=latlon_flags.get(record["latlong_flag"]),
                    site=clean_title(record["site"]),
                    st_site=clean_title(record["st_site"]),
                    stock_id=str(record["stock_id"]),
                    lifestage=lifestage_lookup.get(record["stage"], lifestage_default),
                    stocking_method=stk_meth_lookup.get(
                        record["stock_meth"], STOCKING_METHOD
                    ),
                    no_stocked=int_or_None(record["no_stocked"]),
                    yreq_stocked=int_or_None(record["no_stocked"]),
                    year_class=int_or_None(record["year_class"]),
                    agemonth=int_or_None(record["agemonth"]),
                    length=int_or_None(record["length"]),
                    weight=int_or_None(record["weight"]),
                    lotcode=record["lot_code"],
                    tag_ret=float_or_None(record["tag_ret"]),
                    validation=int_or_None(record["validation"]),
                    hatchery=hatchery_lookup.get(record["hatchery"]),
                    # stocking mortality
                    condition=condition_lookup.get(
                        int_or_None(record["stock_mortality"]), CONDITION
                    ),
                    notes=record["notes"],
                    agency_stock_id=record["agency_stock_id"],
                )

                event.save()
                # many to many things here
                # clips, marks and tag types

                event_tags = get_mark_codes(record["tag_type"], list(fishtags.keys()))
                if event_tags.get("codes"):
                    for code in event_tags.get("codes"):
                        event.fish_tags.add(fishtags[code])

                event_clips = get_mark_codes(record["clip"], list(clips.keys()))
                if event_clips.get("codes"):
                    for code in event_clips.get("codes"):
                        event.fin_clips.add(clips[code])

                event_marks = get_mark_codes(
                    record["phys_chem_mark"], list(marks.keys())
                )
                if event_marks.get("codes"):
                    for code in event_marks.get("codes"):
                        event.physchem_marks.add(marks[code])

                event.save()

                if record["cwt_number"]:
                    cwt_nums = re.split("[;,\W]+", record["cwt_number"])
                    for cwt_number in cwt_nums:
                        associate_cwt(event, cwt_number)

                event.save()

            logging.info("Done adding {}".format(yr))


# # ========================================  YEAR LOOP

# save the last event to run the cwt trigger
event.save()

logging.info("Done adding all stocking events!")

# now update the Ontario Lake Huron cwts.
# /update_ontario_stocking.py


# # mdbcon.close(


# years = StockingEvent.objects.order_by("-year").values_list("year").distinct()
# years = [x[0] for x in years if x[0] <= 2015]
# problems = []

# for yr in years:
#     events = StockingEvent.objects.filter(year=yr)
#     print("Updating events from {}".format(yr))

#     for event in events:
#         if event.grid_10.geom is None:
#             logging.warning("No geometry found for {}".format(event.grid_10))
#         else:
#             mu = get_closest_ManagementUnit(event)
#             if mu:
#                 event.management_unit = mu
#                 event.save()
#             else:
#                 problems.push(event.stock_id)

print("Done!")
# print("Found {} problems.".format(len(problems)))
