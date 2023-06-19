from django.contrib import admin
from ..models import Image


@admin.register(Image)
class ImageModelAdmin(admin.ModelAdmin):
    change_list_template = "admin/image_changelist.html"
    list_display = ["title", "url", "created_date"]
    search_fields = ["title"]

    def url(self, instance):
        return instance.file.url
