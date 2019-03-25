"""urls for the api for our common models"""


from django.urls import path

from .views import (AgencyAPI, SpeciesAPI, JurisdictionAPI, CwtAPI,
                    StateProvinceAPI, LakeAPI, ManagementUnitAPI)

urlpatterns = [

    path('species/', SpeciesAPI.as_view()),
    path('agency/', AgencyAPI.as_view()),
    path('jurisdiction/', JurisdictionAPI.as_view()),
    path('lake/', LakeAPI.as_view()),
    path('state_province/', StateProvinceAPI.as_view()),
    path('cwt/', CwtAPI.as_view()),
    path('management_unit/', ManagementUnitAPI.as_view()),

]
