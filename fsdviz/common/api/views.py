"""Views for the api for our common models

The veiws in this file should all be publicly available as readonly.

"""

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

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
    StrainSerializer,
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


class StrainViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = Strain.objects.prefetch_related("species").distinct()
    serializer_class = StrainSerializer
    filterset_class = StrainFilter

    def get_queryset(self):
        """from: http://ses4j.github.io/2015/11/23/
           optimizing-slow-django-rest-framework-performance/
        """
        queryset = Strain.objects.distinct()
        queryset = self.get_serializer_class().setup_eager_loading(queryset)
        return queryset


class StrainRawViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = StrainRaw.objects.all().distinct()
    serializer_class = StrainRawSerializer
    filterset_class = StrainRawFilter


class CwtViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = CWT.objects.all()
    serializer_class = CWTSerializer


class Grid10ViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly,)
    queryset = Grid10.objects.all()
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

        agencies = Agency.objects.values("abbrev", "agency_name")

        species = Species.objects.values(
            "abbrev", "common_name", "scientific_name", "species_code", "speciescommon"
        )
        species_dict = {x["abbrev"]: x for x in species}

        strains = list(
            Strain.objects.prefetch_related("strain_species")
            .values("id", "strain_code", "strain_label", "strain_species__abbrev")
            .distinct()
        )

        # now update the strains with the nested species dicts and add a slug
        # while we are at it.
        for strain in strains:
            strain["strain_species"] = species_dict.get(
                strain["strain_species__abbrev"]
            )
            strain["slug"] = "{strain_species__abbrev}-{strain_code}".format(**strain)
            strain.pop("strain_species__abbrev", None)

        lookups = {
            "lakes": list(lakes),
            "agencies": list(agencies),
            "jurisdictions": jurisdictions,
            "stateprov": list(stateprov),
            "species": list(species),
            "strains": strains,
        }

        return Response(lookups)
