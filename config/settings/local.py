from config.settings.base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True


# SECURITY WARNING: keep the secret key used in production secret!
#SECRET_KEY = '6x%z++y!eh)@y^_mtwy&-pys5(gs0x7&w5s#rwr^b3b&kncu3k'

SECRET_KEY = os.environ.get('SECRET_KEY', 'secret')

# Database
# https://docs.djangoproject.com/en/2.1/ref/settings/#databases

#DATABASES = {
#    'default': {
#        'ENGINE': 'django.db.backends.sqlite3',
#        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
#    }
#}

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'fsdviz',
        'USER': 'cottrillad',
        'PASSWORD': get_env_variable('PGPASS'),
        'HOST': 'localhost',
    }
}
