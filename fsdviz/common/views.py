from django.contrib.gis.db.models import Extent
from django.shortcuts import render

from .models import Lake


def spatial_lookup(request):
    """a simple view to load our spatial lookup interface."""

    map_bounds = Lake.objects.aggregate(Extent("geom"))

    return render(
        request,
        "common/spatial_lookup.html",
        {"map_bounds": map_bounds["geom__extent"]},
    )
