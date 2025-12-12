"""=============================================================
~/src/check_stocking_data.py
Created: 28 Jan 2016 13:01:46

DESCRIPTION:

This script is a utility script that check the GLFC stocking data for
consistency with values in the lookup tables maintained as part of the
lakewide, Lake Huron cwt database.  Please see the associated
README.org file for information.

Any values that are returned by the queries in this script should be
added to the lookup-tables in the lakewide database or corrected in
the source data before the stocking data is appended. (It won't go if
you try it anyway).

The first queries check for referential integity (duplicates or
missing key fields).  There are then a series of queries that check
the values in fields with look-up tables against those lookup tables.

Finally, there are a series of queries that catch fields with illegal
or illogical values (dates that can't exists or pts outside of the
great lakes basin.)

You can either run this code by sourcing at the command line

> python check_stocking_data.py who='US'

or by cutting and pasting smaller chunks corresponding to each test.

NOTE - There is alot of refactoring that could be done here.  (the
basic pattern is virtually identical for each test - query the source
database, check against the lookup tables and print out any
discrepancies).  Get it to work, then make it pretty.


A. Cottrill
=============================================================

"""


# import pypyodbc as pyodbc
import pyodbc
import re

from datetime import datetime

import os

os.chdir("c:/1work/fsdviz/")

import django_settings

from django.contrib.gis.db.models import Extent

from fsdviz.common.models import (
    Agency,
    Lake,
    StateProvince,
    ManagementUnit,
    Species,
    Strain,
    StrainRaw,
    Grid10,
    PhysChemMark,
    FishTag,
    FinClip,
)

from fsdviz.stocking.models import LifeStage, StockingMortality, Mark, StockingMethod, Hatchery

from utils.lwdb_utils import recode_mark, get_mark_codes, check_null_records
from utils.common_lookups import MARK_SHOULDBE, CLIP2MARK


# ======================================================
#            CONSTANTS AND DB CONNECTIONS


# MS access is not case sensitive, but python is. This option makes
# column names returned by queries to all be lower case
# (Year==YEAR==year)
pyodbc.lowercase = True

REPORT_WIDTH = 80
# CWT_REGEX = "[0-9]{6}|999"  # ignores tags '999'
CWT_REGEX = "[0-9]{6}"  # flags tags '999' as being a problem


# MDB = ("C:/Users/COTTRILLAD/Documents/1work/LakeTrout/Stocking" +
#       "/GLFSD_Datavis/fsdviz/utils/PrepareGLFSDB.accdb")

# MDB = (
#    "C:/Users/COTTRILLAD/1work/LakeTrout/Stocking/GLFSD_Dataviz/fsdviz/"
#    + "utils/data/GLFSD for Adam July 22 2019.accdb"
# )
#
# MDB = (
#    "C:/Users/COTTRILLAD/1work/LakeTrout/Stocking/GLFSD_Datavis/fsdviz/"
#    + "utils/data/GLFSD for Adam July 22 2019.accdb"
# )
#
# MDB = (
#     "C:/Users/COTTRILLAD/1work/LakeTrout/Stocking/GLFSD_Datavis/"
#     + "fsdviz/utils/PrepareGLFSDB.accdb"
# )

# MDB = "F:/1work/LakeTrout/Stocking/GLFSD_Datavis/data/GLFSD_Jan2021.accdb"
MDB = "C:/1work/Scrapbook/fsdviz_April2022/GLFSD_April_2022.accdb"

TABLE_NAME = "GLFSD"

src_constr = r"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={}"

mdbcon = pyodbc.connect(src_constr.format(MDB))
mdbcur = mdbcon.cursor()

# the maximum number of problem records to show

RECORD_COUNT = 50


# ==============================================================
# trim whitespace

# this should be run first to elminate all of the leading and trailing
# spaces.  These cause all kinds of errors as the values look the same,
# but aren't.

# execute a query that will get all columns, but no rows:
mdbcur.execute("select * from [GLFSD] where year=234")
characterFields = [
    x[0]
    for x in mdbcur.description
    if str(x[1]) == "<class 'str'>" and not x[0].startswith("field")
]

sql = "update [{}] set [{}]=trim([{}]);"

for charfld in characterFields:
    mdbcur.execute(sql.format(TABLE_NAME, charfld, charfld))
    mdbcon.commit()
print("Done trimming character fields.")


# =============================================================
#                REQUIRED FIELDS

# verify that the required/expected fields are in our source data tables.
# print out any that aren't.

required_fields = [
    "stock_id",
    "year",
    "month",
    "day",
    "lake",
    "state_prov",
    "site",
    "st_site",
    "latitude",
    "longitude",
    "grid",
    "stat_dist",
    # "ls_mgmt",
    "species",
    "strain",
    "no_stocked",
    "year_class",
    "stage",
    "agemonth",
    "mark",
    "mark_eff",
    "tag_no",
    "tag_ret",
    "length",
    "weight",
    "stock_mortality",
    "lot_code",
    "stock_meth",
    "agency",
    "validation",
    "notes",
]

# run a query that should never return any records:
mdbcur.execute("select * from [GLFSD] where year=1234")

# get the field names from our empty query
fields = [x[0].lower() for x in mdbcur.description]

missing_fields = list(set(required_fields) - set(fields))
missing_fields.sort()

if missing_fields:
    msg = "Oh-oh! The following required field(s) are missing from [{}]:"
    print(msg.format(TABLE_NAME))
    for fld in missing_fields:
        print("\t" + fld)
else:
    msg = "Checking for missing fields in [{}]"
    msg = msg.format(TABLE_NAME)
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ======================================================
#                    STOCK_ID

# stock_ID should be a unique identifier for a stocking event.  If any
# duplicates are found print and appropriate message with a few
# examples.

sql = """select STOCK_ID, COUNT(STOCK_ID) as N from [{}]
         GROUP BY STOCK_ID HAVING COUNT(STOCK_ID)>1;"""
mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()

if rs:
    msg = "Oh-oh! {} duplicate stock_ids were found. For example: \n\t"
    print(msg.format(len(rs)))
    for record in rs[:RECORD_COUNT]:
        print(record)
else:
    msg = "Checking for duplicate stocking event ids"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ======================================================
#                    AGENCY

# agency is maintained in a look-up table. Make sure that all of the
# agencies in the source data have a corresponding value in our lookup
# table.

# first check for records missing agency:


check_null_records("agency", TABLE_NAME, mdbcur, RECORD_COUNT, REPORT_WIDTH)


sql = "select distinct agency from [{}] where agency is not null;".format(TABLE_NAME)
mdbcur.execute(sql)
rs = mdbcur.fetchall()
source = set([x[0] for x in rs])

agencies = Agency.objects.all()
lookup = set([x.abbrev for x in agencies])

missing = list(source - lookup)

missing = ["<empty>" if x == "" else x for x in missing]

if missing:
    msg = "Oh-oh! Found Agencies missing from lookup table(n={}):\n"
    msg = msg.format(len(missing)) + ",\n\t".join(missing)
    print(msg)
else:
    msg = "Checking Agency"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ======================================================
#                    LAKE

# Lake is maintained in a look-up table. Make sure that all of the
# lakes in the source data have a corresponding value in our lookup
# table.

check_null_records("lake", TABLE_NAME, mdbcur, RECORD_COUNT, REPORT_WIDTH)


sql = "select distinct lake from [{}] where lake is not null;".format(TABLE_NAME)
mdbcur.execute(sql)
rs = mdbcur.fetchall()
source = set([x[0] for x in rs])

lakes = Lake.objects.all()
lookup = set([x.abbrev for x in lakes])


missing = list(source - lookup)
missing = ["<empty>" if x == "" else x for x in missing]
if missing:
    msg = "Oh-oh! Found some Lakes missing from lookup table(n={}): "
    msg = msg.format(len(missing)) + ", ".join(missing)
    print(msg)
else:
    msg = "Checking Lakes"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ======================================================
#                    STATE_PROV

# States and Provinces are maintained in a look-up table. Make sure
# that all of the states/provinces in the source data have a
# corresponding value in our lookup tables.


check_null_records("State_prov", TABLE_NAME, mdbcur, RECORD_COUNT, REPORT_WIDTH)


sql = "select distinct STATE_PROV from [{}] where STATE_PROV is not null;"
mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()
source = set([x[0] for x in rs])


lookup = set([x.abbrev for x in StateProvince.objects.all()])


missing = list(source - lookup)
missing = ["<empty>" if x == "" else x for x in missing]
if missing:
    msg = "States/Provinces missing from lookup table (n={}): "
    msg = msg.format(len(missing)) + ", ".join(missing)
    print(msg)
else:
    msg = "Checking States and Provinces"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ======================================================
#                 MANAGEMENT UNITS

# Management Units/Statistical Districts are maintained in a look-up
# table. Make sure that all of the MUs/Stat_Dists in the source data
# have a corresponding value in our lookup tables.

# first check to make sure that each management unit is there:

check_null_records("STAT_DIST", TABLE_NAME, mdbcur, RECORD_COUNT, REPORT_WIDTH)


sql = "select distinct STAT_DIST from [{}] where STAT_DIST IS NOT NULL;"
mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()
source = set([x[0] for x in rs])


lookup = set([x.label for x in ManagementUnit.objects.all()])


missing = list(source - lookup)
missing = ["<empty>" if x == "" else x for x in missing]
missing = [x.strip() for x in missing]

missing.sort()

if missing:
    msg = "Oh-oh!. Stat Districts missing from lookup table(n={}):\n"
    msg = msg.format(len(missing)) + ",\n".join(missing)
    print(msg)
else:
    msg = "Checking Stat Districts"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# make sure that the management unit aggrees with the lake.
# this query returns all of teh lake-stat district combinations
# in the GLFSDB:
sql = """select distinct LAKE, STAT_DIST from [{}] where
STAT_DIST IS NOT NULL and
LAKE is not null and
LAKE<>'' and
STAT_DIST<>'';"""

mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()

# convert our recordset to a set of strings "LAKE-MU"
source = set(["-".join([x[0], x[1]]) for x in rs])

mus = ManagementUnit.objects.all()
target = set(["-".join([x.lake.abbrev, x.label]) for x in mus])


ohoh = list(source - target)

if ohoh:
    ohoh.sort()
    msg = "Oh-oh! Found unmatched Lake-Stat District combinations (n={}): "
    msg = msg.format(len(ohoh))
    print(msg)
    for x in ohoh[:RECORD_COUNT]:
        msg = '\t Lake = "{}"; Statistical District = "{}"'
        print(msg.format(*x.split("-")))
else:
    msg = "Checking Lake-Stat District combinations"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ====================================================
#                  CHECK SPECIES CODE

# Species are maintained in a look-up table. Make sure
# that all of the Species in the source data have a
# corresponding value in our lookup tables.


check_null_records("species", TABLE_NAME, mdbcur, RECORD_COUNT, REPORT_WIDTH)


sql = """select distinct SPECIES from [{}] where Species is not null;"""
mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()
source = set([x[0] for x in rs])
lookup = set([x.abbrev for x in Species.objects.exclude(abbrev="STN")])

missing = list(source - lookup)
missing = ["<empty>" if x == "" else x for x in missing]


if missing:
    msg = "Oh-oh! Found some species missing from lookup table(n={}): "
    msg = msg.format(len(missing)) + ", ".join(missing)
    print(msg)
else:
    msg = "Checking Species stocked"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ====================================================
#                  CHECK STRAINS
#
# Strains are handled by a 2 table system - one holds the raw strain
# as it appears in the source data, the other maps those raw strains
# to common stain names (or labels).  Strain names can repeat bewteen
# species - wild bass and wild pike would be represented as two
# distinct rows.

# get the distcinct combinations of species and strains
sql = """select distinct SPECIES, [glfsd_strain] as strain2 from [{}]
order by [SPECIES]
;"""
mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()

source = set(["-".join([x[0], x[1]]) for x in rs])

strains = StrainRaw.objects.all()
target = set(["-".join([x.species.abbrev, x.raw_strain]) for x in strains])

missing = list(source - target)


if missing:
    missing.sort()
    msg = "\nOh-oh! The following new strain codes were found:"
    print(msg)
    for item in missing:
        items = item.split("-")
        print("\tSpecies:{}, strain_code:{}".format(*items))
    msg = (
        "A record needs to be added to RAW_STRAINS for each "
        + "strain in this list \nor the source strain code needs to be "
        + "edited to exactly match the lookup table.\n"
    )
    print(msg)
else:
    msg = "Checking Raw Strains"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ====================================================
#                  LIFESTAGE

# Life Stages are maintained in a look-up table. Make sure that all of
# the lifestage codes in the source data have a corresponding value in
# our lookup tables.

sql = """select distinct stage from [{}] where stage is not null;"""
mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()
source = set([x[0] for x in rs])


lookup = set([x.abbrev for x in LifeStage.objects.all()])


missing = list(source - lookup)
missing = ["<empty>" if x == "" or x is None else x for x in missing]
if missing:
    msg = "Oh-oh! LifeStage missing from lookup table(n={}):\n"
    msg = msg.format(len(missing)) + ",\n\t".join(missing)
    print(msg)
else:
    msg = "Checking LifeStage"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ====================================================
#                  STOCKING METHOD

# Stocking Methods are maintained in a look-up table. Make sure that all of
# the stocking method values in the source data have a corresponding value in
# our lookup tables.

sql = """select distinct new_stock_meth from [{}] where new_stock_meth is not null;"""
mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()
source = set([x[0] for x in rs])


lookup = set([x.stk_meth for x in StockingMethod.objects.all()])


missing = list(source - lookup)
missing = ["<empty>" if x == "" or x is None else x for x in missing]
if missing:
    msg = "Oh-oh! StockingMethod missing from lookup table(n={}):\n"
    msg = msg.format(len(missing)) + ",\n\t".join(missing)
    print(msg)
else:
    msg = "Checking StockingMethod"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ====================================================
#                  CONDITION

# StockingMortality codes are maintained in a look-up table. Make sure that all of
# the condition codes in the source data have a corresponding value in
# our lookup tables.

sql = """select distinct stock_mortality from [{}] where stock_mortality is not null;"""
mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()
source = set([x[0] for x in rs])

lookup = set([x.stocking_mortality for x in StockingMortality.objects.all()])


missing = list(source - lookup)
missing = ["<empty>" if x == "" else x for x in missing]
missing = ["<empty>" if x is None else x for x in missing]
if missing:
    msg = "Oh-oh! StockingMortality missing from lookup table(n={}):\n"
    msg = msg.format(len(missing)) + ",\n\t".join([str(x) for x in missing])
    print(msg)
else:
    msg = "Checking StockingMortality"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# # ====================================================
# #                  MARKS

# #this no longer applies - it has been replaced by clip, physchem-mark and tagtype

# # if who=='Ontario':
# #     MARK_SHOULDBE.update(CLIP2MARK)
# #
# sql = """select distinct MARK from [{}] where MARK is not null;"""
# mdbcur.execute(sql.format(TABLE_NAME))
# rs = mdbcur.fetchall()

# valid_marks = [x.mark_code for x in Mark.objects.all()]

# tmp = []
# for record in rs:
#     mark = recode_mark(record[0], MARK_SHOULDBE)
#     markcodes = get_mark_codes(mark, valid_marks)
#     ohoh = markcodes.get("unmatched")
#     if ohoh:
#         tmp.append((record[0], ohoh))

# if len(tmp) > 0:
#     msg = "Oh-oh! Unrecognized marks found (n={}). For example:"
#     msg = msg.format(len(tmp))
#     print(msg)
#     print("\t#('<mark>', '<unmatched part>')")
#     for x in tmp[:RECORD_COUNT]:
#         print("\t" + str(x))
# else:
#     msg = "Checking MARKs"
#     print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ====================================================
#                  CLIP
#
sql = """select clip, count(stock_id) as N from [{}]
group by clip
having clip is not null and clip <> 'NONE' and clip <> 'Unknown';"""

mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()

valid_clips = [x.abbrev for x in FinClip.objects.all()]

unmatched = []
for record in rs:
    clipcodes = get_mark_codes(record[0], valid_clips)
    ohoh = clipcodes.get("unmatched")
    if ohoh:
        unmatched.append((record[0], ohoh, record[1]))

if len(unmatched) > 0:
    msg = "Oh-oh! Unrecognized clips found (n={}). For example:"
    msg = msg.format(len(unmatched))
    print(msg)
    print("\t#('<mark>', '<unmatched part>', N)")
    for x in unmatched[:RECORD_COUNT]:
        print("\t{}\t{}\t{}".format(*x))
else:
    msg = "Checking Clips"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ====================================================
#                  PhysChemMarks
#
sql = """select phys_chem_mark, count(stock_id) as N from [{}]
group by phys_chem_mark
having phys_chem_mark is not null and phys_chem_mark <> 'NONE';"""

mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()

valid_marks = [x.mark_code for x in PhysChemMark.objects.all()]

missing_values = []
for row in rs:
    values = row[0].replace(" ", "").split(";")
    if not all([x in valid_marks for x in values]):
        missing_values.append(row)

if len(missing_values) > 0:
    msg = "Oh-oh! Unrecognized phys-chem marks found (n={}). For example:"
    msg = msg.format(len(missing_values))
    print(msg)
    for x in missing_values[:RECORD_COUNT]:
        print("\t{} (n={})".format(*x))
else:
    msg = "Checking phys-chem marks"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ====================================================
#                  TAG_TYPE
#
sql = """select tag_type, count(stock_id) as N from [{}]
group by tag_type
having tag_type is not null and tag_type <> 'NONE';"""

mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()

valid_tags = [x.tag_code for x in FishTag.objects.all()]

# tmp = [x for x in rs if x[0] not in valid_tags]


missing_values = []
for row in rs:
    values = row[0].replace(" ", "").split(";")
    if not all([x in valid_tags for x in values]):
        missing_values.append(row)

if len(missing_values) > 0:
    msg = "Oh-oh! Unrecognized fish tags found (n={}). For example:"
    msg = msg.format(len(missing_values))
    print(msg)
    for x in missing_values[:RECORD_COUNT]:
        print("\t{} (n={})".format(*x))
else:
    msg = "Checking fish tags"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ====================================================
#                  STOCKING GRID

# 10 minute grids are maintained in a look-up table. Make sure that
# all of the grids in the source data have a corresponding value in
# our lookup tables given the lake were the event occured.  Please
# note that records returned by this query could have an incorrect
# grid OR an incorrect lake.

# if grid is populated, it must be a valid grid for the lake in which
# the stocking event occured.

sql = """select trim([{}].lake) as Lake, int([{}].grid) as grid, count(stock_id) as Events from [{}]
group by lake, grid having grid is not null order by lake, grid;"""
mdbcur.execute(sql.format(TABLE_NAME, TABLE_NAME, TABLE_NAME))
rs = mdbcur.fetchall()

# create a dictionary with list of grids for each lake (accounts for
# possiblity of having recoveries from multiple lakes).  The name of
# the lakes are the keys, the list of grids are the values:
grids = {}
for record in rs:
    msg = "{:.0f} (N={})".format(record[1], record[2])
    if grids.get(record[0]):
        grids[record[0]].append(msg)
    else:
        grids[record[0]] = [msg]

# connect to our lookup tables and get the list of known src_grids for each
# lake, convert that list to a set and see if there are any src_grids in
# our source data that do not exist in the lookup table.

for lake, src_grids in grids.items():
    grids = set([x.split()[0] for x in src_grids])
    # lookup_grids = session.query(Grid10).join(Lake).\
    #           filter(Lake.abbrev==lake).all()

    lookup_grids = Grid10.objects.filter(lake__abbrev=lake)
    lookup_grids = set([x.grid for x in lookup_grids])

    # check for any girds that are not in the lookup table:
    diff = list(grids - lookup_grids)
    unknown_grids = [x for x in src_grids if x.split()[0] in diff]

    if unknown_grids:
        msg = "Oh-oh. {} unknown grids where found for {}. For example:"
        print(msg.format(len(unknown_grids), lake))
        for grid in unknown_grids[:RECORD_COUNT]:
            print("\t" + grid)
    else:
        msg = "Checking grids {}.".format(lake)
        print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ====================================================
#                  CHECK CWTS

# valid cwts must be exactly 6 digits.  This block of code gets the
# tag_no field, replaces any semi-colons with commas, splits and strips
# them and then compares the resultant elements against a regular
# expression.  The regular expression (CWT_REGEX) matches either 6
# digits or '999'. If the tag does not match that pattern, it is added
# to the list of problems and a small number are printed out as
# examples.


sql = """select stock_id, replace(tag_no,'-','') as tags from [{}]
         where tag_no is not null and tag_no <> '';"""
mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()

problems = []
for record in rs:
    tags = record[1].replace(";", ",")
    tags = tags.split(",")
    tags = [x.strip() for x in tags]
    for tag in tags:
        if re.match(CWT_REGEX, tag) is None:
            problems.append((record[0], tag))

if problems:
    msg = "Oh-oh! There were {} problematic cwts found. For example: \n\t"
    msg = msg.format(len(problems))
    cwt_msg = ""
    tmp = "Stock_ID: {}  has tag: {}\n"
    for cwt in problems[:RECORD_COUNT]:
        cwt_msg += tmp.format(cwt[0], cwt[1])
    print(msg + cwt_msg)
else:
    msg = "Checking CWTs"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ====================================================
#                MONTHS between 1 and 12

sql = """select stock_id, [year], [month], [day] from [{}]
         where [month] < 1 or [month] > 12 ;"""

mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()

if rs:
    msg = "Oh-oh! {} records with month <1 or >12. For example: \n\t"
    print(msg.format(len(rs)))
    for record in rs[:RECORD_COUNT]:
        print(record)
else:
    msg = "Checking for months <1 or >12"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ====================================================
#                DAYS between 1 and 31

sql = """select stock_id, [year], [month], [day] from [{}]
         where [DAY] < 1 or [DAY] > 31 ;"""

mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()

if rs:
    msg = "Oh-oh! {} records with day of the month <1 or >31. For example: \n\t"
    print(msg.format(len(rs)))
    for record in rs[:RECORD_COUNT]:
        print(record)
else:
    msg = "Checking for Days of the month <1 or >31"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ====================================================
#                YEARS before 1950 or in the future

this_year = datetime.now().year

sql = """select stock_id, [year], [month], [day] from [{}]
         where [YEAR] < 1950 or [YEAR] > {} ;"""

mdbcur.execute(sql.format(TABLE_NAME, this_year))
rs = mdbcur.fetchall()

if rs:
    msg = "Oh-oh! {} records with year < 1950 or >{}. For example: \n\t"
    print(msg.format(len(rs), this_year))
    for record in rs[:RECORD_COUNT]:
        print(record)
else:
    msg = "Checking for year < 1950 or > {}".format(this_year)
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ====================================================
#                  STOCKING DATE

# Verify that the stocking dates are all actual dates, or at least can
# be converted to a date.  Please note that no attempt is made to
# verify that the event actually occured on the date, just that the
# day-month-year is and actual calendar date.

sql = """select stock_id, [year], [month], [day] from [{}]
         where [month] is not null and [day] is not null;"""

mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()
problems = []

for record in rs:
    try:
        tmp = datetime(int(record[1]), int(record[2]), int(record[3]))
    except (ValueError, TypeError):
        problems.append([x for x in record])
if problems:
    msg = "Oh-oh! {} invalid dates where found. For example: \n\t"
    msg += "[stock_id, year, month, day]\t"
    print(msg.format(len(problems)))
    for record in problems[:RECORD_COUNT]:
        print("\t" + str(record))
else:
    msg = "Checking Stocking Date"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ====================================================
#                  YEAR CLASS

# the year class of the stocked fish cannot be greater than the
# stocked year (with the possible exception of eyed eggs from fall
# spawners being planted on or before Dec.31).  If that ever happens,
# this query might have to be re-considered.

sql = """select stock_id, [year],
         [stage],
[year_class]
 from [GLFSD]
         where
          year_class <> 9999 and (
iif([stage]='e',
year_class>(int([year]) + 1),
year_class>int([year])
));
"""

mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()

if rs:
    msg = "Oh-oh! {} events were found where year class > stocked year: \n\t"
    msg += "(<stock_id>, <year>, <year_class>)"
    print(msg.format(len(rs)))
    for record in rs[:RECORD_COUNT]:
        print("\t" + str(record))
else:
    msg = "Checking Year Class against Stocking Date"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ====================================================
#                    LATITUDE-LONGITUDE

# return any records with a lat-long coordinate that falls outside of a
# Great Lakes bounding box. (does not verify that the
# point is over water or even in the great lakes basin - just close)

# TODO - UPDATE THIS TO US LAKE SPECIFIC EXTENTS - we can use
# POSTGIS to dynamically query these


##glbasin = Lake.objects.all().aggregate(bbox=Extent("geom"))
##bbox = glbasin["bbox"]

##{'bbox': (-92.0940772277101, 41.3808069346309, -76.0591720893562, 49.0158109434947)}

# emperical limits of data as of Jan. 2020 - includes events in
# St. Louis River and Salmon Rivers.
bbox = [-92.3085022, 41.380807, -75.980751, 49.015810]


sql = """select stock_id, Latitude, longitude from [{}]
         where Latitude not between {} and {}
         OR longitude not between {} and {};"""

# check for all lakes combined - this should get gross errors
mdbcur.execute(sql.format(TABLE_NAME, bbox[1], bbox[3], bbox[0], bbox[2]))
rs = mdbcur.fetchall()
if rs:
    msg = "Oh-oh! {} suspicous coordinates where found. For example: \n\t"
    msg += "\n\t(EventID, DD_Lat, DD_Lon)"
    print(msg.format(len(rs)))
    for record in rs[:RECORD_COUNT]:
        print("\t" + str(record))
else:
    msg = "Checking for obvious problems with lat-lon"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ====================================================
#                    HATCHERY

# hatchery are a bit of a mess right now.

# if this snippet of code returns any records, we need to add the the
# corresponding entries to the hatchery table -

# *NOTE* - this is bit of a hack because there is a hatchery lookup
# table in the GLFSD database too that joins on the free form hatchey
# name field!!
#

sql = """
SELECT DISTINCT HATCHERY FROM [{0}]
WHERE [{0}].HATCHERY Is Not Null And Not [{0}].HATCHERY='';
"""

mdbcur.execute(sql.format(TABLE_NAME))
rs = mdbcur.fetchall()


known_hatcheries = [x.abbrev for x in Hatchery.objects.all()]

missing = [x for x in rs if x[0] not in known_hatcheries]


if missing:
    msg = (
        "Oh-oh! there are {} hatcheries that do not appear to be documented "
        "in the hatcheries lookup table : \n\t"
        "GLFSD.HATCHERY, FSDVIZ.[HATCHERY_ABBREV"
    )
    print(msg.format(len(missing)))
    for record in missing[:RECORD_COUNT]:
        print("\t" + str(record))
else:
    msg = "Checking for undocumented hatcheries"
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# ====================================================
#                    NUMERIC FIELDS

# if numeric fields have information that cannot be converted to a
# number our data process will choke.  Pull the data in for those
# fields and make sure we can convert them before we start appending
# data - much easier now.

numeric_flds = [
    "year",
    "month",
    "day",
    "no_stocked",
    "latitude",
    "longitude",
    "grid",
    "year_class",
    "agemonth",
    "mark_eff",
    "tag_ret",
    "clip_efficiency",
    "weight",
    "length",
    "stock_mortality",
    "validation",
]

sql_base = """select stock_id, trim([{field_name}]) as fld from [{tablename}]
where [{field_name}] is not null"""

ohoh = []
for fld in numeric_flds:
    sql = sql_base.format(**{"field_name": fld, "tablename": TABLE_NAME})
    mdbcur.execute(sql)
    rs = mdbcur.fetchall()
    for rec in rs:
        if rec[1] != "":
            try:
                float(rec[1])
            except ValueError as err:
                ohoh.append({"stock_id": rec[0], "field": fld, "value": rec[1]})

if ohoh:
    msg = "Oh-oh! Non-numeric data found in numeric field! (n={}) For example: \n\t"
    print(msg.format(len(ohoh)))
    for x in ohoh[:RECORD_COUNT]:
        msg = "\t'stock_id': {stock_id}, {field}= '{value}'"
        print(msg.format(**x))
else:
    msg = "Checking for non-numeric data in numeric fields."
    print("{msg:.<{width}}OK".format(width=REPORT_WIDTH, msg=msg))


# Tidy-up
mdbcur.close()
mdbcon.close()


# get grid number for events without a grid from their lat-lon

# src_constr = r"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={}"

# mdbcon = pyodbc.connect(src_constr.format(MDB))
# mdbcur = mdbcon.cursor()

# sql = """
# SELECT STOCK_ID, GRID, LATITUDE, LONGITUDE
# FROM GLFSD
# WHERE GRID Is Null
# AND LATITUDE IS NOT Null
# AND LONGITUDE Is Not Null;
# """

# mdbcur.execute(sql)
# events = mdbcur.fetchall()

# ret = []
# for event in events:
#     pt = Point(event[3], event[2])
#     grid = Grid10.objects.filter(geom__contains=pt).first()
#     if grid:
#         ret.append([event[0], grid.grid])

# import csv
# csv_file = "c:/1work/fsdviz/utils/grid_from_geom.csv"

# with open(csv_file, 'w', newline='') as f:
#     writer = csv.writer(f)
#     writer.writerows(ret)

# mdbcur.close()
# mdbcon.close()


# src_constr = r"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={}"

# mdbcon = pyodbc.connect(src_constr.format(MDB))
# mdbcur = mdbcon.cursor()

# sql = """SELECT LAKE, STATE_PROV, SITE, ST_SITE, GRID
# FROM GLFSD
# GROUP BY LAKE, STATE_PROV, GRID, SITE, ST_SITE
# HAVING GRID Is Null;"""

# mdbcur.execute(sql)
# events = mdbcur.fetchall()


# ret = []
# for event in events:

#     qs = StockingEvent.objects.filter(
#         jurisdiction__lake__abbrev=event[0],
#         jurisdiction__stateprov__abbrev=event[1],
#         site=event[2],
#     )
#     if event[3]:
#         qs = qs.filter(st_site=event[3])
#     else:
#         qs = qs.filter(st_site__isnull=True)

#     if qs:
#         grid = qs.first().grid_10
#     else:
#         grid = None

#     if grid:
#         tmp = list(event)
#         tmp.append(grid.grid)
#         ret.append(tmp)


# import csv

# csv_file = "c:/1work/fsdviz/utils/grid_from_sitename.csv"

# with open(csv_file, "w", newline="") as f:
#     writer = csv.writer(f)
#     writer.writerow(["LAKE", "STATE_PROV", "SITE", "ST_SITE", "GRID", "GRID_SHOULD_BE"])
#     writer.writerows(ret)

# mdbcur.close()
# mdbcon.close()
