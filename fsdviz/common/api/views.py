"""Views for the api for our common models

"""

from rest_framework import generics
from fsdviz.common.models import (Agency, Species, Lake, CWT, Jurisdiction,
                                  StateProvince, ManagementUnit)
from .serializers import (AgencySerializer, SpeciesSerializer, LakeSerializer,
                          StateProvinceSerializer, JurisdictionSerializer,
                          CWTSerializer, ManagementUnitSerializer)


class AgencyAPI(generics.ListAPIView):
    queryset = Agency.objects.all()
    serializer_class = AgencySerializer


class LakeAPI(generics.ListAPIView):
    queryset = Lake.objects.all()
    serializer_class = LakeSerializer


class JurisdictionAPI(generics.ListAPIView):
    queryset = Jurisdiction.objects.all()
    serializer_class = JurisdictionSerializer


class StateProvinceAPI(generics.ListAPIView):
    queryset = StateProvince.objects.all()
    serializer_class = StateProvinceSerializer


class ManagementUnitAPI(generics.ListAPIView):
    queryset = ManagementUnit.objects.all()
    serializer_class = ManagementUnitSerializer


class SpeciesAPI(generics.ListAPIView):
    queryset = Species.objects.all()
    serializer_class = SpeciesSerializer


class CwtAPI(generics.ListAPIView):
    queryset = CWT.objects.all()
    serializer_class = CWTSerializer
