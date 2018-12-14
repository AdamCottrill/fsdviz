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



from django.contrib.gis.geos import Point

import django_settings
import utils.common_lookups as common

from fsdviz.common.models import (Agency,
                                  Lake,
                                  Grid10,
                                  Species,
                                  Strain, StrainRaw,
                                  StateProvince,
                                  ManagementUnit)


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







#
# import pyodbc
#
# GLFSDB = ('C:/Users/COTTRILLAD/Documents/1work/ScrapBook/' +
#           'GLFSD_Sept2018/GLFSD_Sept2018.accdb')
#
#
# conString = "DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={}"
# #connect using pyodbc
# conn = pyodbc.connect(conString.format(GLFSDB))
# cursor = conn.cursor()
#
# cursor.execute("select lake as abbrev, lakeName as lake_name from [_lake];")
# colnames = [x[0].lower() for x in  cursor.description]
# rs = cursor.fetchall()
#
# vals = []
#
# for row in rs:
#     vals.append(dict(zip(colnames, row)))
#
#
#
# db2Model = [
#     {what: 'Lake',
#      sql: 'select lake as abbrev, lakeName as lake_name from [_lake];'},
#     {what: 'StateProvince',
#      sql: 'select lake as abbrev, lakeName as lake_name from [_lake];'},
#
# ]
#
