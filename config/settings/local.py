from config.settings.base import *

#GEOS_LIBRARY_PATH = '/usr/local/lib/libgeos_c.so'
#GDAL_LIBRARY_PATH = '/usr/local/lib/libgdal.so'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

INTERNAL_IPS = ('127.0.0.1', )

MIDDLEWARE += [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]

ALLOWED_HOSTS = ['142.143.160.65', 'localhost', '127.0.0.1']

#ALLOWED_HOSTS = ['*']

INSTALLED_APPS += [
    'debug_toolbar',
    'django_extensions',
]

SECRET_KEY = os.environ.get('SECRET_KEY', 'secret')

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'fsdviz',
        'USER': get_env_variable('PG_USER'),
        'PASSWORD': get_env_variable('PG_PASS'),
        'HOST': 'localhost',
    }
}

CORS_ORIGIN_WHITELIST += ['localhost:3000', '142.143.160.65:3000']
