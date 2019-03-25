"""Views for the api for our common models

The veiws in this file should all be publicly available as readonly.

"""

from rest_framework import viewsets
from fsdviz.common.models import (Agency, Species, Lake, CWT, Jurisdiction,
                                  StateProvince, ManagementUnit)
from .serializers import (AgencySerializer, SpeciesSerializer, LakeSerializer,
                          StateProvinceSerializer, JurisdictionSerializer,
                          CWTSerializer, ManagementUnitSerializer)


class AgencyViewSet(viewsets.ModelViewSet):

    queryset = Agency.objects.all()
    serializer_class = AgencySerializer


class LakeViewSet(viewsets.ModelViewSet):

    queryset = Lake.objects.all()
    serializer_class = LakeSerializer


class JurisdictionViewSet(viewsets.ModelViewSet):

    queryset = Jurisdiction.objects.all()
    serializer_class = JurisdictionSerializer


class StateProvinceViewSet(viewsets.ModelViewSet):

    queryset = StateProvince.objects.all()
    serializer_class = StateProvinceSerializer


class ManagementUnitViewSet(viewsets.ModelViewSet):

    queryset = ManagementUnit.objects.all()
    serializer_class = ManagementUnitSerializer


class SpeciesViewSet(viewsets.ModelViewSet):

    queryset = Species.objects.all()
    serializer_class = SpeciesSerializer


class CwtViewSet(viewsets.ModelViewSet):

    queryset = CWT.objects.all()
    serializer_class = CWTSerializer
