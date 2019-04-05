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

from rest_framework.documentation import include_docs_urls
from rest_framework.schemas import get_schema_view
from rest_framework_swagger.views import get_swagger_view

#our homepage:
from fsdviz.stocking.views import StockingEventListLatestYear


API_TITLE = 'Fish Stocking DataViz API'
API_DESCRIPTION = 'A web API for Great Lakes Fish Stocking and Recovery Data'

schema_view = get_swagger_view(title=API_TITLE)

urlpatterns = [
    path('coregonusclupeaformis/doc/',
         include('django.contrib.admindocs.urls')),
    path('coregonusclupeaformis/', admin.site.urls)
    ,
    path('stocking/', include('fsdviz.stocking.urls', namespace='stocking')),
    #path('cwt/', include('cwt.urls')),

    #API's
    path('api-auth/', include('rest_framework.urls')),
    path('api/v1/rest-auth/', include('rest_auth.urls')),

    path('api/v1/common/', include('fsdviz.common.api.urls',
                                   namespace='common_api')),

    path('api/v1/stocking/', include('fsdviz.stocking.api.urls',
                                      namespace='stocking_api')),

    #path('api/1.0/cwt/', include('cwt.api.urls')),

    path('api/docs/',
         include_docs_urls(title=API_TITLE, description=API_DESCRIPTION)),
    path('api/schema/', schema_view),


    path('', StockingEventListLatestYear,
         name='home'),


]

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),

        # For django versions before 2.0:
        # url(r'^__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns
