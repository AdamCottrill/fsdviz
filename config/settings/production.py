from config.settings.base import *

# set the environment variables for SECRET_KEY, PG_USER and PG_PASS
# before running in proudction:


# install gdal in virtualenv:
VIRTUAL_ENV = os.environ["VIRTUAL_ENV"]
OSGEO_VENV = os.path.join(VIRTUAL_ENV, "Lib/site-packages/osgeo")
GEOS_LIBRARY_PATH = os.path.join(OSGEO_VENV, "geos_c.dll")
GDAL_LIBRARY_PATH = os.path.join(OSGEO_VENV, "gdal302.dll")
# os.environ["GDAL_DATA"] = os.path.join(VIRTUAL_ENV, "Lib/site-packages/osgeo/data/gdal")


os.environ["PATH"] += os.pathsep + str(OSGEO_VENV)

print("using c:/1work/fsdviz/config/settings/local.py")

if not os.path.exists(OSGEO_VENV):
    print("Unable to find OSGEO_VENV at {}".format(OSGEO_VENV))

if not os.path.exists(GEOS_LIBRARY_PATH):
    print("Unable to find GEOS_LIBRARY_PATH at {}".format(GEOS_LIBRARY_PATH))

if not os.path.exists(GDAL_LIBRARY_PATH):
    print("Unable to find GDAL_LIBRARY_PATH at {}".format(GDAL_LIBRARY_PATH))

# export PG_USER=<your postgres username>
# export PG_PASS=<your postgres password>
# export SECRET_KEY=<somthing long and random>


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

SECRET_KEY = get_env_variable("SECRET_KEY")

DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": "fsdviz",
        "USER": get_env_variable("PG_USER"),
        "PASSWORD": get_env_variable("PG_PASS"),
        "HOST": "localhost",
    }
}

# not what we want. Replace with appropriate url:
ALLOWED_HOSTS = ["localhost:8000", "*"]

# see: https://github.com/ottoyiu/django-cors-headers/#configuration
# for full suite of options
CORS_ORIGIN_ALLOW_ALL = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["GET"]

# CORS_ORIGIN_WHITELIST += ['localhost:3000', 'localhost:8111']

# CORS_ORIGIN_REGEX_WHITELIST += [
#    'localhost:8111',
# ]
