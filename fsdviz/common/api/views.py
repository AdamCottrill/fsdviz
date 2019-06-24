"""Views for the api for our common models

The veiws in this file should all be publicly available as readonly.

"""

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from fsdviz.common.models import (Agency, Species, Lake, CWT, Jurisdiction,
                                  StateProvince, ManagementUnit, Strain,
                                  StrainRaw, Grid10, LatLonFlag, Mark)

from fsdviz.common.filters import (ManagementUnitFilter, StateProvinceFilter,
                                   JurisdictionFilter, StrainFilter,
                                   StrainRawFilter, MarkFilter)

from .serializers import (
    AgencySerializer, SpeciesSerializer, LakeSerializer,
    StateProvinceSerializer, JurisdictionSerializer, CWTSerializer,
    ManagementUnitSerializer, StrainSerializer, StrainRawSerializer,
    Grid10Serializer, LatLonFlagSerializer, MarkSerializer)


class AgencyViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly, )
    queryset = Agency.objects.all()
    serializer_class = AgencySerializer


class LakeViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly, )
    queryset = Lake.objects.all()
    serializer_class = LakeSerializer


class JurisdictionViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly, )
    queryset = Jurisdiction.objects.all()
    serializer_class = JurisdictionSerializer
    filterset_class = JurisdictionFilter

    def get_queryset(self):
        """from: http://ses4j.github.io/2015/11/23/
           optimizing-slow-django-rest-framework-performance/
        """
        queryset = Jurisdiction.objects.all()
        queryset = self.get_serializer_class().setup_eager_loading(queryset)
        return queryset


class StateProvinceViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly, )
    queryset = StateProvince.objects.all()
    serializer_class = StateProvinceSerializer
    filterset_class = StateProvinceFilter


class ManagementUnitViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly, )
    queryset = ManagementUnit.objects.all()
    serializer_class = ManagementUnitSerializer
    filterset_class = ManagementUnitFilter


class SpeciesViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly, )
    queryset = Species.objects.all()
    serializer_class = SpeciesSerializer
    lookup_field = 'abbrev'


class StrainViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly, )
    queryset = Strain.objects.prefetch_related('species')\
                             .distinct()
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

    queryset = Grid10.objects.all()
    serializer_class = Grid10Serializer


class LatLonFlagViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = LatLonFlag.objects.all()
    serializer_class = LatLonFlagSerializer


class MarkViewSet(viewsets.ReadOnlyModelViewSet):

    permission_classes = (IsAuthenticatedOrReadOnly, )
    queryset = Mark.objects.all()
    serializer_class = MarkSerializer
    filterset_class = MarkFilter
