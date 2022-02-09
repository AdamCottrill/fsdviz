# usage: python manage.py test pjtk2 --settings=main.test_settings
# flake8: noqa
"""Settings to be used for running tests."""

from config.settings.base import *

# install gdal in virtualenv:
VIRTUAL_ENV = os.environ["VIRTUAL_ENV"]
OSGEO_VENV = os.path.join(VIRTUAL_ENV, "Lib/site-packages/osgeo")
GEOS_LIBRARY_PATH = os.path.join(OSGEO_VENV, "geos_c.dll")
GDAL_LIBRARY_PATH = os.path.join(OSGEO_VENV, "gdal302.dll")
os.environ["PATH"] += os.pathsep + str(OSGEO_VENV)

SECRET_KEY = "testing"

DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": "fsdviz",
        "USER": get_env_variable("PGUSER"),
        "PASSWORD": get_env_variable("PGPASSWORD"),
        "HOST": "localhost",
    }
}


PASSWORD_HASHERS = ("django.contrib.auth.hashers.MD5PasswordHasher",)


COVERAGE_MODULE_EXCLUDES = ["migrations", "fixtures", "admin$", "utils", "config"]
COVERAGE_MODULE_EXCLUDES += THIRD_PARTY_APPS + DJANGO_APPS
# COVERAGE_REPORT_HTML_OUTPUT_DIR = os.path.join(__file__, '../../../coverage')
#

# simple spreadsheet attributes for tests:
MAX_UPLOAD_EVENT_COUNT = 15
DATA_WORKSHEET_NAME = "DATA_TEMPLATE"
UPLOAD_KEY_FIELD_ROW = 4
UPLOAD_FIRST_DATA_ROW = 10


# use the default static file storage for tests:
STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"
