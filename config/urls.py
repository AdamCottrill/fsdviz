"""fsdviz URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('coregonusclupeaformis/doc/',
         include('django.contrib.admindocs.urls')),
    path('coregonusclupeaformis/', admin.site.urls),

    path('stocking/', include('fsdviz.stocking.urls', namespace='stocking')),
    #path('cwt/', include('cwt.urls')),

    #someday soon:

    path('api/1.0/common/', include('fsdviz.common.api.urls')),
    #path('api/1.0/stocking/', include('stocking.api.urls')),
    #path('api/1.0/cwt/', include('cwt.api.urls')),


]


if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),

        # For django versions before 2.0:
        # url(r'^__debug__/', include(debug_toolbar.urls)),

    ] + urlpatterns
