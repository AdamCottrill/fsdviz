"""This file contains a python script that executes the shell
commands required to refresh the fsdvis topojson file required by the
leaflet maps.

The script should be run any time the attribute for lakes,
jurisdictions, or management units change in the database.
Specifically, if the slug, label, geometry, or primary status of
management units change, this script shold be re-run and the output
file copied to ~/fsdviz/static/data, followed by:

> python manage.py collectstatic

This script assumes that you have a working installation of OSGEO, a
copy of the fsdviz database (with current values for lakes,
jurisdictions, and management units), as well as node installations of
topojson-server and topojson-simplify.

Usage:

> python refresh_fsdviz_geojson.py

"""


import os

pg_user = os.environ["PGUSER"]
pg_password = os.environ["PGPASSWORD"]
OGR2OGR = "C:/OSGeo4W/bin/ogr2ogr.exe"

constring = f"PG:host=localhost dbname=fsdviz user={pg_user} password={pg_password}"

smts = [
    {
        "what": "lakes",
        "sql": (
            "select abbrev as slug, lake_name as label, geom from common_lake"
            " where geom is not null"
        ),
    },
    {
        "what": "jurisdictions",
        "sql": (
            "select lake.abbrev as lake, slug, name as label, j.geom from "
            "common_jurisdiction as j join common_lake as lake on "
            "lake.id=j.lake_id where j.geom is not null"
        ),
    },
    {
        "what": "mus",
        "sql": (
            "select j.slug as jurisdiction, mu.slug, label, mu.geom from "
            "common_managementunit as mu join common_jurisdiction as "
            "j on j.id=mu.jurisdiction_id where mu.primary=true "
            "and mu.geom is not null"
        ),
    },
]


curdir = os.getcwd()
filelist = [
    f for f in os.listdir(curdir) if f.endswith(".json") or f.endswith(".geojson")
]
for f in filelist:
    os.remove(os.path.join(curdir, f))

sys_cmd = (
    '{OGR2OGR} -f GeoJSON {what}.json  -t_srs EPSG:4326 "{constring}" -sql "{sql}"'
)

# execute our sql statements for each entity and pass it to ogr2ogr to
# turn into geojson:
for item in smts:
    item["constring"] = constring
    item["OGR2OGR"] = OGR2OGR
    print("exporting geojson for {}".format(item["what"]))
    os.system(sys_cmd.format(**item))

# use geo2topo (from topojson-server) to merge our geojson into a single file
print("createing topology...")
sys_cmd2 = "geo2topo -o fsdviz_full.geojson lakes.json jurisdictions.json mus.json"
os.system(sys_cmd2)

# use toposimplify (from topojson-simplify) reduce our file size. the p
# parameter was adjusted to get a reasonable file size. (smaller p==
# more detail and larger file)
print("simplifying topology...")
sys_cmd2 = "toposimplify -p 0.000001 -o fsdviz.geojson fsdviz_full.geojson"
os.system(sys_cmd2)
print(
    "Done! Copy fsdviz.geojson to ~/fsdviz/fsdviz/static/data/ and run: python manage.py collectstatic"
)
