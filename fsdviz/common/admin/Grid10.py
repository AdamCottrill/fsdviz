from django import forms
from django.contrib.gis import admin, geos

from ..models import Grid10
from .utils import (
    geom_file_field,
    geom_from_file,
)

admin.site.empty_value_display = "(None)"


class Grid10ChangeForm(forms.ModelForm):
    geom_file = geom_file_field()

    class Meta:
        model = Grid10
        fields = [
            "grid",
            "lake",
            "geom",
        ]


class Grid10CreationForm(forms.ModelForm):
    geom_file = geom_file_field()

    class Meta:
        model = Grid10
        fields = [
            "grid",
            "lake",
            "geom",
        ]

    def save(self, commit=True):
        my_model = super(Grid10CreationForm, self).save(commit=False)
        my_model.save()
        return my_model


@admin.register(Grid10)
class Grid10Admin(admin.GeoModelAdmin):
    form = Grid10ChangeForm
    add_form = Grid10CreationForm

    list_display = (
        "grid",
        "lake",
        "slug",
        "modified_timestamp",
    )
    list_filter = ("lake",)
    search_fields = ("grid",)

    readonly_fields = (
        "created_timestamp",
        "modified_timestamp",
    )

    def get_queryset(self, request):
        queryset = super().get_queryset(request)

        queryset = queryset.select_related(
            "lake",
        ).defer(
            "geom",
            "lake__geom",
        )
        return queryset

    def save_model(self, request, obj, form, change):
        """When we save the admin object, check to see if there is a
        geom_file. If so, convert its geojson or WKT content to a geos
        multipolygon."""
        geom = None
        geom_file = request.FILES.get("geom_file")

        if geom_file:
            geom = geom_from_file(geom_file)

        if geom:
            if isinstance(geom, geos.Polygon):
                # convert it to Multipolygon if is just a polygon:
                obj.geom = geos.MultiPolygon(geom)
            else:
                obj.geom = geom
        obj.save()
        return obj
