"""Create a json file of centroids

Our main mapping widget will need a series of points corresponding to
different levels of spatial aggregation. This script creates a nested
dictionary of centroids for each lake, jurisdiction, management unit,
and grid. Each centroid is in the form of key:value pairs were the key
is the object slug and the value is a two element list containing the
corresponding longitude and latitude.

the json file created by this script is written out to the static
directory so that it can be served to our templates.

This file should be re-run periodically to ensure consistency be the
json file and our database.  Some day it could be replaced by an api
endpoint.

"""

import json
from fsdviz.common.models import (Lake,
                                  Jurisdiction,
                                  ManagementUnit,
                                  Grid10)

# we will also need a list dictionaries that include the centroids with
# keys for:
# lake (abbrev)
# jurisdiction (slug)
# management_unit (slug)
# grid_10 (slug)

lakes = Lake.objects.exclude(shoreline__isnull=True).all()
lake_centroids = {
    x.abbrev: [x.shoreline.centroid.x, x.shoreline.centroid.y]
    for x in lakes
}


# sometimes old school sql is easier:
# select stateProv.abbrev as abbrev, st_astext(st_centroid(st_union(shoreline))) as centroid
# from common_jurisdiction as jurisdiction
# join common_stateProvince stateProv on stateProv.id=jurisdiction.stateProv_id
# group by stateProv.abbrev;

stateProv_centroids = {
    "ON":[-82.9606550651988, 45.551894260147],
    "PA":[-80.1674417325768, 42.2504290507293],
    "MN":[-90.6065206592845, 47.4112705234505],
    "WI":[-88.0793594812394, 44.6647832673324],
    "IL":[-87.4225840531038, 42.1730338231603],
    "OH":[-81.8004228548325, 41.8173495381424],
    "IN":[-87.2235997953882, 41.7045942515556],
    "NY":[-77.7328778327672, 43.4016339592902],
    "MI":[-86.1636805592578, 45.6436132988473]
}


jurisdictions = Jurisdiction.objects.all()
jurisdiction_centroids = {
    x.slug: [x.shoreline.centroid.x, x.shoreline.centroid.y]
    for x in jurisdictions
}

#
mus = ManagementUnit.objects.filter(primary=True).exclude(geom__isnull=True)
mus_centroids = {x.slug: [x.geom.centroid.x, x.geom.centroid.y] for x in mus}

grids = Grid10.objects.all()
grid_centroids = {x.slug: [x.centroid.x, x.centroid.y] for x in grids}


# bundle them all up into a single dictionary:
centroids = {
    'lake': lake_centroids,
    'stateProv': stateProv_centroids,
    'jurisdiction': jurisdiction_centroids,
    'mu': mus_centroids,
    'grid10': grid_centroids
}

fname = './fsdviz/static/data/centroids.json'
with open(fname, 'w') as fp:
    json.dump(centroids, fp)
