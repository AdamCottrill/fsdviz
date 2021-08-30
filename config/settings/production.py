from config.settings.base import *

# set the environment variables for SECRET_KEY, PG_USER and PG_PASS
# before running in proudction:

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
ALLOWED_HOSTS = ["127.0.0.1:8000", "localhost:8000", "*"]

# see: https://github.com/ottoyiu/django-cors-headers/#configuration
# for full suite of options
CORS_ORIGIN_ALLOW_ALL = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["GET", "POST"]
