from config.settings.base import *

# install gdal in virtualenv:
VIRTUAL_ENV = os.environ["VIRTUAL_ENV"]
OSGEO_VENV = os.path.join(VIRTUAL_ENV, "Lib/site-packages/osgeo")
GEOS_LIBRARY_PATH = os.path.join(OSGEO_VENV, "geos_c.dll")
GDAL_LIBRARY_PATH = os.path.join(OSGEO_VENV, "gdal300.dll")
os.environ["PATH"] += os.pathsep + str(OSGEO_VENV)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

INTERNAL_IPS = ("127.0.0.1",)

MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]

ALLOWED_HOSTS = ["142.143.160.65", "142.143.160.81", "localhost", "127.0.0.1"]

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

CORS_ORIGIN_WHITELIST += ["localhost:3000", "142.143.160.65:3000"]
