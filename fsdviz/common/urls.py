from django.urls import path

from .views import lookup_tables, spatial_lookup

app_name = "common"

urlpatterns = [
    path("spatial_lookup/", spatial_lookup, name="spatial-lookup"),
    path("lookup_tables/", lookup_tables, name="lookup-tables"),
]
