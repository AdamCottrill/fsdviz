"""
Django settings for fsdviz project.

Generated by 'django-admin startproject' using Django 2.1.4.

For more information on this file, see
https://docs.djangoproject.com/en/2.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/2.1/ref/settings/
"""

import os
from django.core.exceptions import ImproperlyConfigured
import sys


def get_env_variable(var_name):
    """Get the environment variable or return exception (from page 39 of
    2-scoops"""
    try:
        return os.environ[var_name]
    except KeyError:
        error_msg = "Set the %s environment variable" % var_name
        raise ImproperlyConfigured(error_msg)


# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
DJ_PROJECT_DIR = os.path.dirname(__file__)
BASE_DIR = os.path.dirname(DJ_PROJECT_DIR)
WSGI_DIR = os.path.dirname(BASE_DIR)
REPO_DIR = os.path.dirname(WSGI_DIR)

sys.path.append(os.path.join(REPO_DIR, "libs"))

DATA_DIR = BASE_DIR

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

print("Project Root:", PROJECT_ROOT)

# these are from Kennith Love's best practices
here = lambda *x: os.path.join(os.path.abspath(os.path.dirname(__file__)), *x)
root = lambda *x: os.path.join(os.path.abspath(PROJECT_ROOT), *x)

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
# BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/2.1/howto/deployment/checklist/

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = []

# Application definition
DJANGO_APPS = [
    "whitenoise.runserver_nostatic",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",
    "django.contrib.admindocs",
    "django.contrib.humanize",
]

THIRD_PARTY_APPS = [
    "django_filters",
    "rest_framework",
    "corsheaders",
    "rest_framework.authtoken",
    "rest_auth",
    "rest_framework_swagger",
    "leaflet",
    "crispy_forms",  # ticket tracker
    "taggit",
    "tickets",
    "bookmark_it",
]

MY_APPS = ["fsdviz.myusers", "fsdviz.common", "fsdviz.stocking", "fsdviz.recovery"]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + MY_APPS

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django.contrib.admindocs.middleware.XViewMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(PROJECT_ROOT, "fsdviz/templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

WSGI_APPLICATION = "config.wsgi.application"

# Password validation
# https://docs.djangoproject.com/en/2.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
# https://docs.djangoproject.com/en/2.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_L10N = True

USE_TZ = True

# the maximum number of records returned by our find_events view
# keep it small for performance and warn if the max is reached.
MAX_FILTERED_EVENT_COUNT = 10000


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.1/howto/static-files/

STATIC_URL = "/static/"

STATICFILES_DIRS = [os.path.join(PROJECT_ROOT, "fsdviz/static")]

STATIC_ROOT = os.path.join(PROJECT_ROOT, "static/")

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

AUTH_USER_MODEL = "myusers.CustomUser"

LOGIN_URL = "login"
LOGIN_REDIRECT_URL = "account-redirect"
LOGOUT_REDIRECT_URL = "home"

EMAIL_BACKEND = "django.core.mail.backends.filebased.EmailBackend"
EMAIL_FILE_PATH = os.path.join(BASE_DIR, "sent_mails")

# for xls upload
DATA_UPLOAD_MAX_NUMBER_FIELDS = 10240
MAX_UPLOAD_EVENT_COUNT = 100
UPLOAD_KEY_FIELD_ROW = 4
UPLOAD_FIRST_DATA_ROW = 10


## urls here as needed for cors:
CORS_ORIGIN_ALLOW_ALL = True
CORS_ALLOW_CREDENTIALS = True
CORS_ORIGIN_WHITELIST = []
# CORS_ORIGIN_REGEX_WHITELIST = []


REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
        "drf_renderer_xlsx.renderers.XLSXRenderer",
    ),
    "DEFAULT_SCHEMA_CLASS": "rest_framework.schemas.coreapi.AutoSchema",
}


# Swagger - used to document rest api endpoints.

SWAGGER_SETTINGS = {
    "LOGIN_URL": "rest_framework:login",
    "LOGOUT_URL": "rest_framework:logout",
}

# ticket tracker:
LINK_PATTERNS = [
    {"pattern": r"ticket:\s?(\d+)", "url": r'<a href="/ticket/\1">ticket \1</a>'}
]


LEAFLET_CONFIG = {
    # minx, miny, maxx,maxy
    "SPATIAL_EXTENT": (-92.09, 41.38, -76.05, 49.01),
    # "RESET_VIEW": True,
    "DEFAULT_PRECISION": 5,
}
