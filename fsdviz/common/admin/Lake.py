from django import forms
from django.contrib.gis import admin, geos
from django.db.models import Count

from .utils import fill_color_widget
from ..models import Lake

from .utils import (
    geom_file_field,
    geom_from_file,
)


admin.site.empty_value_display = "(None)"


class LakeChangeForm(forms.ModelForm):
    geom_file = geom_file_field()

    class Meta:
        model = Lake
        fields = [
            "lake_name",
            "abbrev",
            "color",
            "max_lat",
            "min_lat",
            "max_lon",
            "min_lon",
            "geom",
        ]


class LakeCreationForm(forms.ModelForm):
    geom_file = geom_file_field()

    class Meta:
        model = Lake
        fields = [
            "lake_name",
            "abbrev",
            "color",
            "max_lat",
            "min_lat",
            "max_lon",
            "min_lon",
            "geom",
        ]

    def save(self, commit=True):
        my_model = super(LakeCreationForm, self).save(commit=False)
        my_model.save()
        return my_model


@admin.register(Lake)
class LakeModelAdmin(admin.GISModelAdmin):
    form = LakeChangeForm
    add_form = LakeCreationForm
    readonly_fields = (
        "created_timestamp",
        "modified_timestamp",
    )

    list_display = (
        "lake_name",
        "abbrev",
        "fill_color",
        "modified_timestamp",
        "event_count",
    )

    def fill_color(self, obj):
        return fill_color_widget(obj.color)

    def event_count(self, obj):
        return obj._event_count

    def get_queryset(self, request):
        queryset = super().get_queryset(request)

        queryset = queryset.defer(
            "geom",
        ).annotate(
            _event_count=Count("jurisdiction__stocking_events", distinct=True),
        )

        return queryset.distinct()

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
