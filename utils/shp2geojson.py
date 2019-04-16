"""This script is used to populate the spatial geometries for the
Great Lakes Fish stocking dataviz application.

Management units are currently read in from several shapefiles from
the great GIS.  Split appart into seperate files, reprojected to
lat-lon and then imported into postgis. Once in post gis, the
managementunits, jurisdictions and lakes are rebuilt.

This script assumes that you have postgis correctly installed on your
computer as well as the associated command-line utility shp2pgsql

"""

import os
import psycopg2
import shapefile

#the location of our source shapefiles and associated output



SHP_DIR = "C:/Users/COTTRILLAD/Documents/1work/Python/geopy"

SHP_SRC = os.path.join(SHP_DIR, 'shapefiles')
SHP_TRG = os.path.join(SHP_DIR, 'output')

#pg connections parameters
con_pars = {
    'HOST': 'localhost',
    'NAME': 'fsdviz',
    'USER': 'cottrillad',
    'PASSWORD': os.getenv('PGPASS', 'password')
}

pg_constring = """host='{HOST}' dbname='{NAME}' user='{USER}'
                  password='{PASSWORD}'"""
pg_constring = pg_constring.format(**con_pars)

# The shapefiles that hold the polygons that represent our management
# units: the label index indicates the field that will be used to name
# the output files. It must match the label of the corresponding
# management unit in the common_managementunit table.

shapefiles = [
    # Lake Michigan
    dict(shpfile="stat_dist.shp", srid='26916', labelIndex=0),

    # Lake Huron
    dict(shpfile="lh_stat_dist_poly_IFR.shp", srid='4269', labelIndex=3),
    dict(shpfile="qmas.shp", srid='26917', labelIndex=0),

    # Lake Ontario
    dict(shpfile="lo_stat_dist_poly_IFR.shp", srid='4269', labelIndex=3),

    # Lake Superior
    dict(shpfile="ls_stat_dist_poly_IFR.shp", srid='4269', labelIndex=3),

    # Lake Erie
    dict(shpfile="le_stat_dist_poly_IFR.shp", srid='4269', labelIndex=3)
]

# check for our output directory:
if not os.path.isdir(SHP_TRG):
    print("Target Directory (SHP_TRG={}) Does not exist!".format(SHP_TRG))

# create a sql sub-directory if one does not exist.
if not os.path.isdir(os.path.join(SHP_TRG, 'sql')):
    os.mkdir(os.path.join(SHP_TRG, 'sql'))

# an empyt list to hold our mangement unit labels
manUnits = []

for lake in shapefiles:

    # shpfile = os.path.join(ROOT_DIR, 'shapefiles', lake.get('shpfile'))
    shpfile = os.path.join(SHP_SRC, lake.get('shpfile'))
    labelIndex = lake.get('labelIndex')
    spatialRef = lake.get('srid')

    sf = shapefile.Reader(shpfile)

    # output our files with names that match our management unit labels
    # (currently uppercase without hyphens or periods, but this might change)
    for i, record in enumerate(sf.records()):
        manUnit = record[labelIndex]
        # this is a work-around (only qmas.shp has names with dashes
        # and lower case letters!)
        if lake.get('shpfile') is not 'qmas.shp':
            manUnit = manUnit.upper().replace('-', '').replace('.', '')
        manUnits.append(manUnit)
        shpname = os.path.join(SHP_TRG, '{}.shp'.format(manUnit))
        thisShape = sf.shapeRecord(i)
        with shapefile.Writer(
                shpname, shapeType=thisShape.shape.shapeType) as shpwtr:
            shpwtr.fields = sf.fields
            shpwtr.shape(thisShape.shape)
            shpwtr.record(*thisShape.record)

    sf.close()

    # now loop through our management units, using shp2pgsql to
    # re-project them to WGS-84 (SRID=4623) in a field called
    # geom. The sql will be written into a file called {MU}.sql That
    # file is then executed by postgis to create a temporary table
    # that will be used to update the geom feild of the associated
    # record in common_managementunit table.  The names of the
    # mangement in the postgis table must match the names of the
    # sql_file!

    cmd = ('shp2pgsql -s {SRID}:4326 -g "geom" "{source}" > "{target}"')

    for mu in manUnits:
        src_file = os.path.join(SHP_TRG, '{}.shp'.format(mu))
        trg_file = os.path.join(SHP_TRG, 'sql/{}.sql'.format(mu))
        vals = dict(SRID=spatialRef, source=src_file, target=trg_file)
        os.system(cmd.format(**vals))
    print("Done creating sql for mu polygons.")

    # now connect to our database, import the geometries we just created,
    # update the geom field of the associated managementunit record and
    # deleted the temporary table.

    pg_conn = psycopg2.connect(pg_constring)
    pg_cur = pg_conn.cursor()

    for mu in manUnits:
        fname = os.path.join(SHP_TRG, 'sql/{}.sql'.format(mu))

        with open(fname, 'r') as sql_file:
            pg_cur.execute(sql_file.read())
        pg_conn.commit()

        # the update query:
        sql = '''update common_managementunit set geom =(select geom from "{}")
        where label=%s;'''
        pg_cur.execute(sql.format(mu.lower()), (mu, ))

        # clean up our temporary table:
        sql = 'drop table "{}";'.format(mu.lower())
        pg_cur.execute(sql)
        pg_conn.commit()
    pg_conn.close()

print('Done updating mu geoms for;')

# The sql script "Create_JurisdictionLake_Geometries.sql" constains a
# series sql statements that are exectuted by PostGis to:
#
# - create all of the jurisdictions from their memeber management
# units
#
# - create all of the lakes from thier member juristictions.
#
# - update all of the fields that contain centroids or bounding boxes
#  of other spatial fields.

pg_conn = psycopg2.connect(pg_constring)
pg_cur = pg_conn.cursor()

fname = "Create_JurisdictionLake_Geometries.sql"
with open(fname, 'r') as sql_file:
    pg_cur.execute(sql_file.read())
pg_conn.commit()
pg_conn.close()
print("Done updating all spatial geometries.")
