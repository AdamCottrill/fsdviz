from django.contrib.gis.db.models import Extent
from django.shortcuts import render
from fsdviz.stocking.models import (
    Hatchery,
    LifeStage,
    StockingMethod,
    YearlingEquivalent,
)

from .models import (
    Agency,
    CompositeFinClip,
    FishTag,
    Jurisdiction,
    Lake,
    PhysChemMark,
    Species,
    StrainRaw,
)


def spatial_lookup(request):
    """a simple view to load our spatial lookup interface.  Calculate
    the extent of the lake geometries and return it in a variable
    'map-bounds' that will be used by leaflet to center the map."""

    map_bounds = Lake.objects.aggregate(Extent("geom"))

    return render(
        request,
        "common/spatial_lookup.html",
        {"map_bounds": map_bounds["geom__extent"]},
    )


def lookup_tables(request):
    """A view to render tables with all of the lookup values."""

    # NOTE - defer spatial fields!

    # Management Units
    # Strains and Raw Strains

    agencies = Agency.objects.all()
    lakes = Lake.objects.all()
    jurisdictions = Jurisdiction.objects.all()
    species = Species.objects.all()
    strains = (
        StrainRaw.objects.select_related("species")
        .prefetch_related("strain", "strain__species")
        .all()
    )
    clips = CompositeFinClip.objects.all()
    fishtags = FishTag.objects.all()
    physchemmarks = PhysChemMark.objects.all()
    hatcheries = Hatchery.objects.all()
    lifestages = LifeStage.objects.all()
    yreq = (
        YearlingEquivalent.objects.select_related("species", "lifestage")
        .order_by("species__common_name", "yreq_factor")
        .all()
    )
    stocking_methods = StockingMethod.objects.all()

    return render(
        request,
        "common/lookup_tables.html",
        {
            "agencies": agencies,
            "lakes": lakes,
            "jurisdictions": jurisdictions,
            "species": species,
            "strains": strains,
            "clips": clips,
            "fishtags": fishtags,
            "physchemmarks": physchemmarks,
            "hatcheries": hatcheries,
            "lifestages": lifestages,
            "yreq": yreq,
            "stocking_methods": stocking_methods,
        },
    )
