from django import forms
from django.contrib.gis import admin, geos

from ..models import Grid10, ManagementUnit, Jurisdiction

from .utils import (
    fill_color_widget,
    geom_file_field,
    geom_from_file,
    grid_list_file_field,
    grids_from_file,
)

admin.site.empty_value_display = "(None)"


class ManagementUnitChangeForm(forms.ModelForm):
    geom_file = geom_file_field()
    grid_list = grid_list_file_field()

    class Meta:
        model = ManagementUnit
        fields = [
            "label",
            "description",
            "color",
            "geom",
            # "lake",
            "jurisdiction",
            "primary",
            "mu_type",
            "grid10s",
        ]

    def __init__(self, *args, **kwargs):
        super(ManagementUnitChangeForm, self).__init__(*args, **kwargs)
        my_model = self.instance
        self.fields["grid10s"].queryset = (
            Grid10.objects.filter(lake_id=my_model.lake.id)
            .select_related("lake")
            .defer(
                "geom",
                "lake__geom",
            )
        )

        self.fields["jurisdiction"].queryset = Jurisdiction.objects.select_related(
            "lake", "stateprov"
        ).defer(
            "geom",
            "lake__geom",
        )


class ManagementUnitCreationForm(forms.ModelForm):
    geom_file = geom_file_field()
    grid_list = grid_list_file_field()

    class Meta:
        model = ManagementUnit
        fields = [
            "label",
            "description",
            "color",
            "geom",
            # "lake",
            "jurisdiction",
            "primary",
            "mu_type",
            "grid10s",
        ]

    def save(self, commit=True):
        my_model = super(ManagementUnitCreationForm, self).save(commit=False)
        my_model.save()
        return my_model


@admin.register(ManagementUnit)
class ManagementUnitModelAdmin(admin.GeoModelAdmin):
    form = ManagementUnitChangeForm
    add_form = ManagementUnitCreationForm

    list_display = (
        "label",
        "lake",
        "mu_type",
        "description",
        "fill_color",
        "modified_timestamp",
    )
    list_filter = ("lake", "mu_type")
    search_fields = ("label",)

    readonly_fields = (
        "created_timestamp",
        "modified_timestamp",
    )

    def fill_color(self, obj):
        return fill_color_widget(obj.color)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)

        queryset = queryset.select_related(
            "lake",
            "jurisdiction",
            "jurisdiction__lake",
            "jurisdiction__stateprov",
        ).defer(
            "lake__geom",
            "grid10s__geom",
            "grid10s__lake__geom",
            "jurisdiction__geom",
            "jurisdiction__lake__geom",
        )
        return queryset

    def save_model(self, request, obj, form, change):
        """ """
        geom = None
        geom_file = request.FILES.get("geom_file")
        if geom_file:
            geom = geom_from_file(geom_file)
        if geom:
            if isinstance(geom, geos.Polygon):
                obj.geom = geos.MultiPolygon(geom)
            else:
                obj.geom = geom

        grids = None
        grid_list = request.FILES.get("grid_list")
        if grid_list:
            grids = grids_from_file(grid_list, obj.jurisdiction.lake.abbrev)
        if grids:
            form.cleaned_data["grid10s"] = [x.pk for x in grids]
        super(ManagementUnitModelAdmin, self).save_model(request, obj, form, change)
