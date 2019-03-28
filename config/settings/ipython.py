#same as settings.local - but with

from config.settings.base import *

DEBUG = True

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
