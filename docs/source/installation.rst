Technical Setup
===============

Setup
-----

This file will outline the steps needed to clone the Great Lakes Fish
Stocking repository and setup a local version.


Intro to Git
------------

How we are using git for collaboration


Virtual Environment
-------------------

something here about working with virtualenironments.  Creating,
installing application, activating and creation of environment
variables (including activation hooks).

+ consider using pipenv to manage our virtual environments.

Database Creation
-----------------



Database Migrations
-------------------


Manage.py options


+ runserver

+ shell


Running Tests
-------------

This section will discuss how the testing directory is structured, how
to run the tests to ensure that everything continues to work as it
should.  It will included common command line arguments to run all
test, just failing tests, and tests in a single file.

+ pytest

  + options


Creating Documentation
----------------------

+ the tools

+ standards and conventions

+ refreshing this report

+ further reading


Setup the database and Virtual Environment
------------------------------------------

First, navigate to the directory where you placed the file
``fsis2_dump.sql``. Then create the postgres database and activate the
gis functionality:

.. code-block:: bash

    > createdb fsis2
    > psql fsis2
    $ create extension postgis;
    $ create extension postgis_topology;
    $ create user cottrillad;
    $ create user adam;
    $ \i fsis2_dump.sql
    $ \q;

The ``>`` and ``$`` represent the ``dos/shell`` and ``psql`` prompts
respectively.  I'm not sure if you will need the users 'cottrillad' or
'adam'. Those are users on my work and home computers, and I don't
know if they will be associated with any of the records in the
download I have provided.  You may also need to provide those users
with read-write access on this database to get the data to append.

You might also have some issues with PostGIS as it requires some
additional, open source spatial libraries. This is much easier than it
use to be, especially on a linux machine but can still lead to some
headaches. There are some excellent guides on the net that will help
with this. Specifically, here is the official PostGIS documentation:
http://postgis.net/install/, and here is the coles notes version for
working with Django (Geodjango):
https://docs.djangoproject.com/en/1.11/ref/contrib/gis/install/.

Once the database is up and running, we can unzip and then clone the
fsis2 git repository to someplace convenient. It should include all of
the necessary files to get things running, with the exception of the
static files which are some javascript and css files that I didn't
write and don't appear to be available through a CDN. Unzip the
staticfiles.zip and copy the two directories to the project root
(``~/fsis2/static`` and ``~/fsis2/staticfiles``).

Now we can create a virtual environment that will allow you to install
the required packages on an isolated python instance without
installing them globally. I believe that python 3 ships with virtual
environment so that should make things easier. To keep things simple,
we will create it in the root directory of your project (but someday
you might want to consider creating all of your virtual envs in a
common directory rather than within each project). You can create a
virtual environment by issuing the commands within the root project
directory (``~/fsis2``):

.. code-block:: bash

    > mkdir venv
    > python -m venv ./venv

These will create your virtual environment within the directory 'venv'
using the default python version on your system (I use 3.4), but new
versions of python should work without issue. Older versions (i.e. - 2.7
may or may not work).

The Django application has been configured to retrieve sensitive
information from environment variables that need be set in the virtual
environment that it is running in. Specifically, the application
requires the variables ``PG_USER``, ``PG_PASS``.  The variables
``PG_HOST``, and ``SECRET_KEY`` need to be set in production, but the
values 'localhost' and 'secret' are used for these variables during
development if they aren't set to something else. It is possible to
set these variables from the command prompt with command like this:

.. code-block:: bash

    > set PG_PASS=<YOURPASSWORD>

But those settings are only temporary, and must be re-submitted each
time a command prompt is opened.  A better alternative, it to set (and
unset) them each time the virtual environment is activated and
deactivated.  To do this, ``~\venv\Scripts\activate.bat`` with a text
editor and add the following lines to bottom of the script:

.. code-block:: bash

    set DJANGO_SETTINGS_MODULE=main.settings.local
    set PG_USER=<DJANGOAPP_USERNAME>
    set PG_PASS=<DATABASE_PASSWORD>
    set PG_HOST=<YOUR_DATABASE_HOST_IP>
    set SECRET_KEY=<SOMETHING_COMPLEX_AND_RANDOM>

Do not put quotes around the values and do not put any spaces around
the equal signs (this: "=" not this: " = " ). The first variable tells
python where to find the default setting file and may need to be
modified depending on your project structure (in this case, the
default settings file is located at ``~/main/settings/local.py``, but
it could be anywhere in your project.  ``~/config`` is often used many
projects). If this variable is omited, you will to add a
``--settings=`` argument each time you run the development server or
Django shell.  The next three variables are associated with Postgres
credentials, while the fifth is used by Django to ensure that web
forms are not tampered with.


Then in ``~\venv\Scripts\deactivate.bat``:

.. code-block:: bash

    set DJANGO_SETTINGS_MODULE=
    set PG_USER=
    set PG_PASS=
    set PG_HOST=
    set SECRET_KEY=

Save and close both ``activate.bat`` and ``deactivate.bat``.

Next activate your environment:

.. code-block:: bash

    > .\venv\Scripts\activate

and check that your environment variables have been set correctly by
issuing this command at the command prompt:

.. code-block:: bash

    (venv)> echo %PG_USER%

You should see the value that you specified in the ``activate.bat`` file
above. the ``(venv)`` at the begining of the line indicates that the
virtual environment is active.  You can deactivate a virutal
environment by issuing this command:

    (env)> .\venv\Scripts\deactivate
    >

With your virtual environment reactivated, you can install the
required packages. This is accomplished using pip (python's package
installer). The packages are specified in the requirements files which
includes version numbers and all of the dependencies for each one.

With your virtual environment activated, and from within ``~/fsis2``, you
can install all of the packages using:

.. code-block:: bash

    (venv)> pip install -r requirements.txt

This should go out to the python package index (pypi), download and
install of the required packages and their dependencies. The only
exception might be ``psycopg2`` (the library for connecting to postgres).
On windows, the easiest way to install this, is to download the
installer that matches your version of python and postgres from here:
https://www.lfd.uci.edu/~gohlke/pythonlibs/

Then install it using:

.. code-block:: bash

    (venv)> easy_install <path-to-psycopg2-installer>

Re-run the pip install command from above just to be sure everything
installed as expected.


Finally, we need to make sure that the database tables and columns
match those expected by our application or some of the installed
packages.  This step is only necessary when packages are install or
upgraded, or we make changes to our database (which shouldn't be
often).

.. code-block:: bash

    (venv)> python manage.py makemigrations
    (venv)> python manage.py migrate

The first command should report 'No Changes detected.', while the
second will list several actions as they are executed.

Now that everything is installed, you can run the tests simply
issuing:

.. code-block:: bash

    > py.test

The tests should all run (and pass) without issue. There are currently 173
passing tests for this application and a coverage report should be
available in ~/htmlcov/index.html


Alternatively, you can fire-up the development server by issuing the
following command:

.. code-block:: bash

    > python manage.py runserver

The application should be available at ``127.0.0.1:8000`` in your
webrowser.

That's it - you should be up and running.
