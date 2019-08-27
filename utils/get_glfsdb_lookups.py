"""=============================================================
~/FSDViz/utils/get_glfsdb_lookups.py
 Created: 12 Dec 2018 10:49:19

 DESCRIPTION:

  Imports the lookup tables from the GLFSDB to our django database.

some of the components are going to come from lookup tables - the
lakes and states are pretty well established and won't change over
time.  Some fields in the existing database will require some custom
logic to parse out required information that might break if the data
in the database is edited in the future.

This script is intended to run inside of a django shell and utilizes
the django orm.  Make sure that the root directory of the application
is in the PYTHONPATH of your virtualenv. After you import
django_settings, all of the django models should be available for use
in the script.


 A. Cottrill
=============================================================

"""

import datetime
import pyodbc
import re

from collections import OrderedDict

import django_settings

from django.contrib.gis.geos import Point

import utils.common_lookups as common
import utils.lookups_stocking as stocking

from fsdviz.common.models import (
    Agency,
    Lake,
    Grid10,
    Species,
    Strain,
    StrainRaw,
    StateProvince,
    Jurisdiction,
    ManagementUnit,
    Mark,
    LatLonFlag,
    CWT,
    CWTsequence,
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
)

START = datetime.datetime.now()

what = "Lakes"
my_list = []

for item in common.LAKE:
    obj = Lake(abbrev=item[0], lake_name=item[1])
    my_list.append(obj)
Lake.objects.bulk_create(my_list, batch_size=10000)
print("\tDone adding {} records (n={:,})".format(what, len(my_list)))

# Create a couple of dictionary lookups that will retrun the lake when
# given the short name or the abbreviation.  Used to find associated
# lake for future objects:
lake_map = {lake.short_name(): lake for lake in Lake.objects.all()}
lake_abbrev_map = {lake.abbrev: lake for lake in Lake.objects.all()}

what = "Agencies"
my_list = []

for item in common.AGENCIES:
    obj = Agency(abbrev=item[0], agency_name=item[1])
    my_list.append(obj)

Agency.objects.bulk_create(my_list, batch_size=10000)
print("\tDone adding {} records (n={:,})".format(what, len(my_list)))

what = "StateProvince"
my_list = []

for item in common.STATEPROV:
    obj = StateProvince(
        abbrev=item[0], name=item[1], country="CAN" if item[2] == "Canada" else "USA"
    )
    my_list.append(obj)

StateProvince.objects.bulk_create(my_list, batch_size=10000)
print("\tDone adding {} records (n={:,})".format(what, len(my_list)))


what = "Jurisdiction"

for item in common.JURISDICTIONS:
    # lake = Lake.objects.get(lake_name__contains=item[1].split("-")[0])
    lake = lake_map[item[1].split("-")[0]]
    stateprov = StateProvince.objects.get(name__contains=item[1].split("-")[1])

    jurisdiction = Jurisdiction(
        lake=lake, stateprov=stateprov, name=item[1], description=item[0]
    )
    # use save to create our slug:
    jurisdiction.save()

print("\tDone adding {} records (n={:,})".format(what, len(common.JURISDICTIONS)))

what = "Management Units"

for item in common.MANAGEMENT_UNITS:
    obj = ManagementUnit(
        label=item[0],
        mu_type=item[1],
        lake=Lake.objects.get(lake_name="Lake " + item[2]),
        description=item[3]
        # centroid=Point(item[4], item[5]),
    )
    obj.save()

    # my_list.append(obj)
# StateProvince.objects.bulk_create(my_list, batch_size=10000)
n = len(common.MANAGEMENT_UNITS)
print("\tDone adding {} records (n={:,})".format(what, n))


# =============================


what = "Grid10"
my_list = []

for lake_abbrev, grids in common.grid_centroids.items():
    # lake = Lake.objects.get(abbrev=lake_abbrev)
    lake = lake_abbrev_map[lake_abbrev]
    for grid, pt in grids.items():
        slug = "{}_{}".format(lake_abbrev.lower(), grid)
        obj = Grid10(
            grid=grid, centroid=Point(pt.ddlon, pt.ddlat), slug=slug, lake=lake
        )
        my_list.append(obj)

Grid10.objects.bulk_create(my_list, batch_size=10000)
print("\tDone adding {} records (n={:,})".format(what, len(my_list)))


what = "Species"
my_list = []

for item in common.SPECIES:
    obj = Species(
        species_code=item[0],
        abbrev=item[1],
        scientific_name=item[3],
        common_name=item[2],
        speciescommon=item[4],
    )
    my_list.append(obj)

Species.objects.bulk_create(my_list, batch_size=10000)
print("\tDone adding {} records (n={:,})".format(what, len(my_list)))

# Strains are our larger groups that collapse the noisy raw strain values into
# categories we can use - strains will be unique to species so that
# 'wild walleye' will be different than 'wild chinook'

what = "Strains"
my_list = []

for item in common.STRAINS:
    species = Species.objects.get(abbrev=item[0])
    obj = Strain(strain_species=species, strain_code=item[1], strain_label=item[2])
    my_list.append(obj)

Strain.objects.bulk_create(my_list, batch_size=10000)
print("\tDone adding {} records (n={:,})".format(what, len(my_list)))

what = "Raw Strains"
my_list = []

for item in common.RAW_STRAINS:
    species = Species.objects.get(abbrev=item[0])
    strain = Strain.objects.get(strain_code=item[1], strain_species=species)
    obj = StrainRaw(
        species=species, strain=strain, raw_strain=item[2], description=item[3]
    )
    my_list.append(obj)

StrainRaw.objects.bulk_create(my_list, batch_size=10000)
print("\tDone adding {} records (n={:,})".format(what, len(my_list)))


what = "LAT-LON FLAGS"
my_list = []

for item in common.LATLON_FLAG:
    obj = LatLonFlag(value=item[0], description=item[1])
    my_list.append(obj)

LatLonFlag.objects.bulk_create(my_list)
print("\tDone adding {} records (n={:,})".format(what, len(my_list)))

# CONDITION

what = "Condition"
for item in stocking.CONDITION:
    obj = Condition(condition=item[0], description=item[1])
    obj.save()
n = len(stocking.CONDITION)
print("\tDone adding {} records (n={:,})".format(what, n))

what = "StockingMethod"
for item in stocking.STOCKING_METHOD:
    obj = StockingMethod(stk_meth=item[0], description=item[1])
    obj.save()
n = len(stocking.STOCKING_METHOD)
print("\tDone adding {} records (n={:,})".format(what, n))

what = "LifeStage"
for item in stocking.LIFESTAGE:
    obj = LifeStage(abbrev=item[0], description=item[1])
    obj.save()
n = len(stocking.LIFESTAGE)
print("\tDone adding {} records (n={:,})".format(what, n))

what = "Marks"
for item in common.MARKS:
    obj = Mark(
        mark_code=item[0], clip_code=item[1], description=item[2], mark_type=item[3]
    )
    obj.save()
n = len(common.MARKS)
print("\tDone adding {} records (n={:,})".format(what, n))

DONE = datetime.datetime.now()
