from django.urls import path

from .views import spatial_lookup

app_name = "common"

urlpatterns = [path("spatial_lookup/", spatial_lookup, name="spatial-lookup")]
