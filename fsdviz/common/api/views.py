"""Views for the api for our common models

The veiws in this file should all be publicly available as readonly.

"""


from django.contrib.gis.db.models.functions import Distance
from django.db.models import F
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from fsdviz.common.utils import parse_geom, get_polygons

from fsdviz.common.models import (
    Agency,
    Species,
    Lake,
    CWT,
    Jurisdiction,
    StateProvince,
    ManagementUnit,
    Strain,
    StrainRaw,
    Grid10,
    LatLonFlag,
    Mark,
    CompositeFinClip,
)

from fsdviz.common.filters import (
    ManagementUnitFilter,
    StateProvinceFilter,
    JurisdictionFilter,
    StrainFilter,
    StrainRawFilter,
    MarkFilter,
    Grid10Filter,
)

from .serializers import (
    AgencySerializer,
    SpeciesSerializer,
    LakeSerializer,
    StateProvinceSerializer,
    JurisdictionSerializer,
    CWTSerializer,
    ManagementUnitSerializer,
    StrainSpeciesSerializer,
    StrainRawSerializer,
    Grid10Serializer,
    LatLonFlagSerializer,
    MarkSerializer,
)


class AgencyViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = Agency.objects.all()
    serializer_class = AgencySerializer
    lookup_field = "abbrev"


@api_view(["POST"])
@permission_classes([AllowAny])
def roi_spatial_attrs(request):
    """This function accepts post requests that contain a geojson
    representation of a polygon and returns a dictionary containing
    the basic elements needed to validate the find-events forms and
    limit the choices in the drop-downs for spatial fields to the
    enties that overlap with the roi.  (if the region of interest in
    entirely within lake michigan - there is no point in including the
    aother lakes, or their children in the select widget).

    Given a valid polygon geometry, return a dictionary with the following elements:

    + lakes - list of lakes with id, lake name, lake abbrev

    + juristictions - list of jurisdictions with id, stateprov name, stateprov abbrev

    + manUnits - list of management units including the slug,
      management unit type, and wether or not it should be considered to
      be a primary management unit.

    post data should contain a json string of the form:

    {"roi":
    "POLYGON ((-80.98 45.03, -81.15 44.90, -81.02 44.42, -80.38 44.45, -80.33 44.85, -80.98 45.03))"
    }

    """

    roi = parse_geom(request.data.get("roi"))

    if roi is None:
        return Response({}, status=status.HTTP_400_BAD_REQUEST)

    ret = dict()

    lakes = Lake.objects.filter(geom__intersects=roi).values(
        "id", "abbrev", "lake_name"
    )

    if lakes:
        ret["lakes"] = list(lakes)
    else:
        ret["lakes"] = ""

    jurisdictions = (
        Jurisdiction.objects.select_related("lake", "stateprov")
        .filter(geom__intersects=roi)
        .values(
            # jurisdiction attributes
            "id",
            "lake_id",
            "stateprov_id",
            jurisd=F("slug"),
            jurisdiction_name=F("name"),
            # centroid=F("geom__centroid__wkt"),
            # lake attributes:
            lake_abbrev=F("lake__abbrev"),
            lake_name=F("lake__lake_name"),
            # state prov__ attributes:
            stateprov_abbrev=F("stateprov__abbrev"),
            stateprov_name=F("stateprov__name"),
        )
    )

    if jurisdictions:
        ret["jurisdictions"] = list(jurisdictions)

    else:
        ret["jurisdictions"] = ""

    # get our stat disctricts too. for now just return the slugs
    man_units = (
        ManagementUnit.objects.filter(geom__intersects=roi)
        .filter(primary=True)
        .values("slug", "mu_type", "primary")
    )

    if man_units:
        ret["manUnits"] = list(man_units)
    else:
        ret["manUnits"] = ""

    return Response(ret, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def pt_spatial_attrs(request):
    """This function accepts post requests that contain a geojson
    representation of a point and returns a dictionary containing the
    basic elements needed to validate the spatial widgets in the
    stocking event and stocking upload forms.  Given a lat-lon, return
    a dictionary with the following elements:

    + lake - with id, lake name, lake abbrev
    + juristiction - with id, stateprov name, stateprov abbrev
    + manUnit - id, label
    + grid10 - id, label, lake abbrev.

    post data should contain a json string of the form:

    {"point": "POINT(-81.5 44.5)"}


    """

    pt = parse_geom(request.data.get("point"))
    if pt is None:
        return Response({}, status=status.HTTP_400_BAD_REQUEST)

    polygons = get_polygons(pt)

    return Response(polygons, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def get_lake_from_pt(request):
    """This function accepts post requests that contain a geojson
    representation of a point.  The view returns a dictionary contianing
    the id, abbreviation, name, centroid and bounds (extent) of the lake
    containing the point, or an empty dictionary if the dat is not geojson
    or falls outside of any lake.

    TODO: add options for 'pure' and 'plus' geometries

    """

    geom = request.query_params.get("geom")
    pt = parse_geom(request.data.get("point"))
    if pt is None:
        return Response({}, status=status.HTTP_400_BAD_REQUEST)

    lake = Lake.objects.filter(geom__contains=pt).first()

    if lake:
        ret = dict(
            id=lake.id,
            abbrev=lake.abbrev,
            lake_name=lake.lake_name,
            centroid=lake.geom.centroid.wkt,
            extent=lake.geom.extent,
        )

        if geom == "geom":
            ret["geom"] = lake.geom.geojson

        return Response(ret, status=status.HTTP_200_OK)
    else:
        # no lake object could be associated with that point.
        # 400
        return Response({}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@permission_classes([AllowAny])
def get_jurisdiction_from_pt(request):
    """This function accepts post requests that contain a geojson
    representation of a point.  The view returns a dictionary contianing
    the id, abbreviation, name, centroid and bounds (extent) of the jurisdiction
    containing the point, or an empty dictionary if the dat is not geojson
    or falls outside of any jurisdiction.

    TODO: add options for 'pure' and 'plus' geometries

    """

    geom = request.query_params.get("geom")
    pt = parse_geom(request.data.get("point"))
    if pt is None:
        return Response({}, status=status.HTTP_400_BAD_REQUEST)

    jurisdiction = (
        Jurisdiction.objects.select_related("lake", "stateprov")
        .filter(geom__contains=pt)
        .first()
    )

    if jurisdiction:
        ret = dict(
            id=jurisdiction.id,
            # lake attributes:
            lake_id=jurisdiction.lake.id,
            lake_abbrev=jurisdiction.lake.abbrev,
            lake_name=jurisdiction.lake.lake_name,
            # state prov. attributes:
            stateprov_id=jurisdiction.stateprov.id,
            stateprov_abbrev=jurisdiction.stateprov.abbrev,
            stateprov_name=jurisdiction.stateprov.name,
            # jurisdiction attributes
            jurisdiction_name=jurisdiction.name,
            centroid=jurisdiction.geom.centroid.wkt,
            extent=jurisdiction.geom.extent,
        )

        if geom == "geom":
            ret["geom"] = jurisdiction.geom.geojson

        return Response(ret, status=status.HTTP_200_OK)
    else:
        # no jurisdiction object could be associated with that point.
        # 400
        return Response({}, status=status.HTTP_404_NOT_FOUND)


def manUnit_dict(obj, geom=None):
    """Serialize a management unit to a python dictionary

    Arguments:
    - `obj`: a ManagementUnit instance
    """

    item = dict(
        id=obj.id,
        slug=obj.slug,
        label=obj.label,
        mu_type=obj.mu_type,
        centroid=obj.geom.centroid.wkt,
        extent=obj.geom.extent,
    )

    if geom == "geom":
        item["geom"] = obj.geom.geojson

    return item


@api_view(["POST"])
@permission_classes([AllowAny])
def get_management_unit_from_pt(request):
    """This function accepts post requests that contains a geojson
    representation of a point.  The view returns a dictionary contianing
    the id, label, mu_type, centroid and bounds (extent) of the management_unit
    containing the point, or an empty dictionary if the data is not geojson
    or falls outside of any management_unit.

    This function takes an additional argument (mu_type) as a query
    parameter that controls what type of managemnet unit is returned -
    current options are stat_dist, mu, qma, ltrz.  Others could be
    added in the future.  If the mu_type argument is not included in
    the request, the management_unit with primary=True is returned by
    default.

    TODO: add options for 'pure' and 'plus' geometries

    """
    geom = request.query_params.get("geom")
    mu_type = request.query_params.get("mu_type")
    all_mus = request.query_params.get("all")

    pt = parse_geom(request.data.get("point"))
    if pt is None:
        return Response({}, status=status.HTTP_400_BAD_REQUEST)

    qs = ManagementUnit.objects.filter(geom__contains=pt)

    if all_mus and all_mus in ["T", "t", "TRUE", "True", "true"]:
        qs = qs.all()
    elif mu_type:
        qs = qs.filter(mu_type=mu_type).first()
    else:
        qs = qs.filter(primary=True).first()

    if qs:
        if all_mus:
            ret = [manUnit_dict(x, geom) for x in qs]
        else:
            ret = manUnit_dict(qs, geom)

        return Response(ret, status=status.HTTP_200_OK)
    else:
        # no qs object could be associated with that point.
        # 400
        return Response({}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@permission_classes([AllowAny])
def get_grid10_from_pt(request):
    """This function accepts post requests that contain a geojson
    representation of a point.  The view returns a dictionary contianing
    the id, abbreviation, name, centroid and bounds (extent) of the grid10
    containing the point, or an empty dictionary if the dat is not geojson
    or falls outside of any grid10.

    TODO: Add polygon field for grid10 objects so that we can find out
    which grid the point falls in. This function finds the closest
    centroid which is slower and likely to have lots of failing edge
    cases.

    post request should be of the form:

    {"point": "POINT(-81.5 44.5)"}

    """

    pt = parse_geom(request.data.get("point"))
    if pt is None:
        return Response({}, status=status.HTTP_400_BAD_REQUEST)

    grid10 = Grid10.objects.select_related("lake").filter(geom__contains=pt).first()

    geom = request.query_params.get("geom")

    if grid10:
        ret = dict(
            id=grid10.id,
            grid=grid10.grid,
            slug=grid10.slug,
            centroid=grid10.geom.centroid.wkt,
            extent=grid10.geom.extent,
            # lake attributes:
            lake_id=grid10.lake.id,
            lake_abbrev=grid10.lake.abbrev,
            lake_name=grid10.lake.lake_name,
        )
        if geom == "geom":
            ret["geom"] = grid10.geom.geojson

        return Response(ret, status=status.HTTP_200_OK)
    else:
        # no grid10 object could be associated with that point.
        # 400
        return Response({}, status=status.HTTP_404_NOT_FOUND)


class LakeViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = Lake.objects.all()
    serializer_class = LakeSerializer
    lookup_field = "abbrev"


class JurisdictionViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = Jurisdiction.objects.all()
    serializer_class = JurisdictionSerializer
    filterset_class = JurisdictionFilter
    lookup_field = "slug"

    def get_queryset(self):
        """from: http://ses4j.github.io/2015/11/23/
        optimizing-slow-django-rest-framework-performance/
        """
        queryset = Jurisdiction.objects.all()
        queryset = self.get_serializer_class().setup_eager_loading(queryset)
        return queryset


class StateProvinceViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = StateProvince.objects.all()
    serializer_class = StateProvinceSerializer
    filterset_class = StateProvinceFilter
    lookup_field = "abbrev"


class ManagementUnitViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = ManagementUnit.objects.all()
    serializer_class = ManagementUnitSerializer
    filterset_class = ManagementUnitFilter
    lookup_field = "slug"


class SpeciesViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = Species.objects.all()
    serializer_class = SpeciesSerializer
    lookup_field = "abbrev"


class StrainSpeciesViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = Strain.objects.prefetch_related("species").distinct()
    serializer_class = StrainSpeciesSerializer
    filterset_class = StrainFilter

    def get_queryset(self):
        """from: http://ses4j.github.io/2015/11/23/
        optimizing-slow-django-rest-framework-performance/
        """
        queryset = Strain.objects.distinct()
        queryset = self.get_serializer_class().setup_eager_loading(queryset)
        return queryset


class StrainRawViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = StrainRaw.objects.prefetch_related("species", "strain").all().distinct()
    serializer_class = StrainRawSerializer
    filterset_class = StrainRawFilter


class CwtViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = CWT.objects.all()
    serializer_class = CWTSerializer
    lookup_field = "slug"


class Grid10ViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = Grid10.objects.prefetch_related("lake").all()
    serializer_class = Grid10Serializer
    filterset_class = Grid10Filter
    # pagination_class = StandardResultsSetPagination
    lookup_field = "slug"


class LatLonFlagViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = LatLonFlag.objects.all()
    serializer_class = LatLonFlagSerializer


class MarkViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = Mark.objects.all()
    serializer_class = MarkSerializer
    filterset_class = MarkFilter
    lookup_field = "mark_code"


class CommonLookUpsAPIView(APIView):
    """This api endpoint will return a json object that contains lookups
     for the stocking model objects needed to label stocking events.
     The api endpoint that returns the stocking events contains only
     id's or slugs form most fields to that the payload is compact and
     the JavaScript processing on the front end is as efficient as
     possible.  This endpoint provides the lookup values so that the
     stocking method 'LAT' can be displayed as "Lake Trout".
     Originally, this information was collected through separate api
     calls for each attribute.

    TODOs:

    - Add management unit to this list of lookup values.
    - remove slug from strain when it is added as field on model.

    """

    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):

        lakes = Lake.objects.values("abbrev", "lake_name")
        lakes_dict = {x["abbrev"]: x for x in lakes}

        stateprov = StateProvince.objects.values(
            "abbrev", "name", "country", "description"
        )
        stateprov_dict = {x["abbrev"]: x for x in stateprov}

        jurisdictions = list(
            Jurisdiction.objects.prefetch_related("lake", "stateprov").values(
                "slug", "name", "lake__abbrev", "stateprov__abbrev", "description"
            )
        )
        for jur in jurisdictions:
            jur["lake"] = lakes_dict.get(jur.get("lake__abbrev"))
            jur["stateprov"] = stateprov_dict.get(jur.get("stateprov__abbrev"))
            jur.pop("lake__abbrev", None)
            jur.pop("stateprov__abbrev", None)

        jurisdiction_dict = {x["slug"]: x for x in jurisdictions}
        # managementUnits = list(ManagementUnit.objects.filter(primary=True))

        manUnits = list(
            ManagementUnit.objects.filter(primary=True)
            .prefetch_related("jurisdiction")
            .values("slug", "label", "jurisdiction__slug", "description")
        )
        for mu in manUnits:
            mu["jurisdiction"] = jurisdiction_dict.get(mu.get("jurisdiction__slug"))
            mu.pop("jurisdiction__slug", None)

        agencies = Agency.objects.values("abbrev", "agency_name")

        species = Species.objects.values(
            "abbrev", "common_name", "scientific_name", "species_code", "speciescommon"
        )
        species_dict = {x["abbrev"]: x for x in species}

        strains = list(
            Strain.objects.prefetch_related("strain_species")
            .values(
                "id", "strain_code", "strain_label", "slug", "strain_species__abbrev"
            )
            .distinct()
        )

        clipcodes = CompositeFinClip.objects.order_by("clip_code").values(
            "clip_code", "description"
        )

        # now update the strains with the nested species dicts and add a slug
        # while we are at it.
        for strain in strains:
            spc = strain.pop("strain_species__abbrev")
            strain["strain_species"] = species_dict.get(spc)

        lookups = {
            "lakes": list(lakes),
            "agencies": list(agencies),
            "jurisdictions": jurisdictions,
            "manUnits": manUnits,
            "stateprov": list(stateprov),
            "species": list(species),
            "strains": strains,
            "clipcodes": list(clipcodes),
        }

        return Response(lookups)
