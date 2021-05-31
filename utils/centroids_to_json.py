"""Create a json file of centroids

Our main mapping widget will need a series of points corresponding to
different levels of spatial aggregation. This script creates a nested
dictionary of centroids for each lake, jurisdiction, management unit,
and grid. Each centroid is in the form of key:value pairs where the key
is the object slug and the value is a two element list containing the
corresponding longitude and latitude.

the json file created by this script is written out to the static
directory so that it can be served to our templates.

This file should be re-run periodically to ensure consistency be the
json file and our database.  Some day it could be replaced by an api
endpoint.


The easiest way regenerate the output from this file is to run it
within a Django shell:

> exec(open('./utils/centroids_to_json.py').read())

"""

import json
from fsdviz.common.models import Lake, Jurisdiction, ManagementUnit, Grid10

# we will also need a list dictionaries that include the centroids with
# keys for:
# lake (abbrev)
# jurisdiction (slug)
# management_unit (slug)
# grid_10 (slug)

lakes = Lake.objects.all()
lake_centroids = {x.abbrev: [x.geom.centroid.x, x.geom.centroid.y] for x in lakes}


# sometimes old school sql is easier:
# select stateProv.abbrev as abbrev, st_astext(st_centroid(st_union(geom))) as centroid
# from common_jurisdiction as jurisdiction
# join common_stateProvince stateProv on stateProv.id=jurisdiction.stateProv_id
# group by stateProv.abbrev;

stateProv_centroids = {
    "ON": [-82.223, 45.351],
    "PA": [-80.167, 42.250],
    "MN": [-90.606, 47.411],
    "WI": [-88.079, 44.664],
    "IL": [-87.422, 42.173],
    "OH": [-81.800, 41.817],
    "IN": [-87.223, 41.704],
    "NY": [-77.732, 43.401],
    "MI": [-86.163, 45.643],
}


jurisdictions = Jurisdiction.objects.all()
jurisdiction_centroids = {
    x.slug: [x.geom.centroid.x, x.geom.centroid.y] for x in jurisdictions
}

#
mus = ManagementUnit.objects.filter(primary=True)
mus_centroids = {x.slug: [x.geom.centroid.x, x.geom.centroid.y] for x in mus}

grids = Grid10.objects.all()
grid_centroids = {x.slug: [x.centroid.x, x.centroid.y] for x in grids}

# bundle them all up into a single dictionary:
centroids = {
    "lake": lake_centroids,
    "stateProv": stateProv_centroids,
    "jurisdiction": jurisdiction_centroids,
    "manUnit": mus_centroids,
    "grid10": grid_centroids,
}

fname = "./fsdviz/static/data/centroids.json"
with open(fname, "w") as fp:
    json.dump(centroids, fp)
print("Done!")
