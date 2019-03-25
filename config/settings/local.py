from config.settings.base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

INTERNAL_IPS = ('127.0.0.1',)

MIDDLEWARE += [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]

INSTALLED_APPS += ['debug_toolbar',]

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


CORS_ORIGIN_WHITELIST += [
    'localhost:3000'
]
