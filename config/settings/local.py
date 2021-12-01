from config.settings.base import *

# install gdal in virtualenv:
VIRTUAL_ENV = os.environ["VIRTUAL_ENV"]
OSGEO_VENV = os.path.join(VIRTUAL_ENV, "Lib/site-packages/osgeo")
GEOS_LIBRARY_PATH = os.path.join(OSGEO_VENV, "geos_c.dll")
GDAL_LIBRARY_PATH = os.path.join(OSGEO_VENV, "gdal302.dll")
PROJ_LIB = os.path.join(VIRTUAL_ENV, "Lib/site-packages/osgeo/data/proj")

os.environ["GDAL_DATA"] = os.path.join(VIRTUAL_ENV, "Lib/site-packages/osgeo/data/gdal")
os.environ["PROJ_LIB"] = PROJ_LIB

os.environ["PATH"] += os.pathsep + str(OSGEO_VENV)


if not os.path.exists(OSGEO_VENV):
    print("Unable to find OSGEO_VENV at {}".format(OSGEO_VENV))

if not os.path.exists(GEOS_LIBRARY_PATH):
    print("Unable to find GEOS_LIBRARY_PATH at {}".format(GEOS_LIBRARY_PATH))

if not os.path.exists(GDAL_LIBRARY_PATH):
    print("Unable to find GDAL_LIBRARY_PATH at {}".format(GDAL_LIBRARY_PATH))

if not os.path.exists(PROJ_LIB):
    print("Unable to find PROJ_LIB at {}".format(PROJ_LIB))

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

INTERNAL_IPS = ("127.0.0.1",)

MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "192.168.1.167"]

# ALLOWED_HOSTS = ['*']

INSTALLED_APPS += ["debug_toolbar", "django_extensions"]

SECRET_KEY = os.environ.get("SECRET_KEY", "secret")

DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": "fsdviz",
        "USER": get_env_variable("PGUSER"),
        "PASSWORD": get_env_variable("PGPASSWORD"),
        "HOST": "localhost",
    }
}

# CORS_ORIGIN_WHITELIST += [
#     "localhost:3000",
# ]
