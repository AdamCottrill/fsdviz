Processing Stocking Submissions
===============================

Process and Validate
--------------------

Notes here on how to use the tools that check the data submitted to
the the GLFC.  How to produce (error) reports for each contributing
agency and what to do when things go wrong.




Data Migration
--------------
Steps required to replace the stocking data in the PostGIS/web
database with the data in the scrubbed GLFC database.  (and what to
do if something goes wrong).

The migration scripts use the Django ORM to create objects before they
are inserted into the database.  This makes the code much easier to
maintain and understand, but does require a little more setup.
Because the scripts use the Django ORM, they need to be run in and
environment (or even better a virtual environment) with all of the
necessary libraries installed. (See "Setting up your environment" for
more details).

Once the environment has been setup, you should be able to run the
scripts in order to rebuild the entire application. Typically, the
entire migraion takes less than 10 mintues.  The Django website will
contiue to operate, but results returned by some views may be
incomplete during the migratin phase. (TODO - add a flag to warn
people that a migration is currently underway and perhaps dissable API
requests).

After the stocking and recovery data has been scrubbed (ie - all of
the errors corrected or removed from the dataset), it is time to
update the data in the PostGIS database used to power the FSDViz
application.  It is highly recommended that a the migration be tested
on a copy of the database before appling them to the production
database.

To refshesh the data in the PostGIS database with teh data in the
scrubbed GLFC database, follow these steps (details below):

1. Activate the virtual environment and test your connection to the
    database:

    workon fsdviz
    python manage.py shell

    from fsdivz.common.models import *

    Lake.objects.all()
    exit()


2. Purge stocking data - complete or partial

3. utils/get_glfsdb_lookups.py

4. utls/get_stocking_events.py

5. utils/update_ontario_stocking.py

6. utils/update_ontario_huron_stocking.py

7. utils/get_cwt_recoveries.py
