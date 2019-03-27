
"""urls for the api for our common models"""

from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (LifeStageViewSet, ConditionViewSet,
                    StockingMethodViewSet,
                    StockingEventViewSet)

app_name = "stocking"

router = SimpleRouter()

router.register('lifestage', LifeStageViewSet)
router.register('condition', ConditionViewSet)
router.register('stocking_method', StockingMethodViewSet)
router.register('stocking_event', StockingEventViewSet)

urlpatterns = router.urls

# urlpatterns = [

#     path('species/', SpeciesAPI.as_view()),
#     path('agency/', AgencyAPI.as_view()),
#     path('jurisdiction/', JurisdictionAPI.as_view()),
#     path('lake/', LakeAPI.as_view()),
#     path('state_province/', StateProvinceAPI.as_view()),
#     path('cwt/', CwtAPI.as_view()),
#     path('management_unit/', ManagementUnitAPI.as_view()),

# ]
