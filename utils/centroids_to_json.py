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

jurisdictions = Jurisdiction.objects.all()
jurisdiction_centroids = {
    x.slug: [x.shoreline.centroid.x, x.shoreline.centroid.y]
    for x in jurisdictions
}

#
mus = ManagementUnit.objects.filter(lake__abbrev='HU')
mus_centroids = {x.slug: [x.geom.centroid.x, x.geom.centroid.y] for x in mus}

grids = Grid10.objects.filter(lake__abbrev='HU')
grid_centroids = {x.slug: [x.centroid.x, x.centroid.y] for x in grids}

# bundle them all up into a single dictionary:
centroids = {
    'lake': lake_centroids,
    'jurisdiction': jurisdiction_centroids,
    'mu': mus_centroids,
    'grid10': grid_centroids
}

fname = './fsdviz/static/data/centroids.json'
with open(fname, 'w') as fp:
    json.dump(centroids, fp)
