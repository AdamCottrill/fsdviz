'''=============================================================
~/src/update_cwt_flags.py
Created: 16 Dec 2016 14:13:47

DESCRIPTION:

This script updates the boolean fields in CWT table that indicate if a
cwt has been compromized for some reason.  The boolean fields are
updated according to sub-queries that return cwt numbers that meet the
specified criteria.

There are currently flags for:
  + multiple_species
  + multiple_strains
  + multiple_yearclasses
  + multiple_makers
  + multiple_agencies
  + multiple_lakes


Finally, there is a catch-all field [tag_reused] that is set to True
if any of the other fields for that record are True.  This field can
be used when perfect cwts are desired and simplifies subsequent data
analysis.

A. Cottrill
=============================================================

'''

import os
import psycopg2


# POSTGRES connection parameters - assumes that your connection
# parameters are available as environment variables:
con_pars = {'HOST': os.environ.get('PG_HOST', 'localhost'),
          'NAME': os.environ.get('PG_DB', 'fsdviz'),
          'USER': os.environ.get('PG_USER'),
          'PASSWORD': os.environ.get('PG_PASS')
            }

pg_constring = ("host='{HOST}' dbname='{NAME}' user='{USER}'" +
                  " password='{PASSWORD}'")
pg_constring = pg_constring.format(**con_pars)

pg_conn = psycopg2.connect(pg_constring)
cursor = pg_conn.cursor()


#================================================
#              MULTIPLE AGENCY

print("updating cwt.multiple_agencies....")

sql = """
UPDATE common_cwt
   SET multiple_agencies = True
WHERE common_cwt.cwt_number IN (SELECT cwt_number
                         --       ,COUNT(agency_id) AS Agencies
                         FROM (SELECT DISTINCT cwt_number,
                                      events.agency_id
                               FROM stocking_stockingevent AS events
                                 JOIN common_cwtsequence_events ON common_cwtsequence_events.stockingevent_id = events.id
                                 JOIN common_cwtsequence ON common_cwtsequence_events.cwtsequence_id = common_cwtsequence.id
                                 JOIN common_cwt AS cwt ON cwt.id = common_cwtsequence.cwt_id) AS tmp
                         GROUP BY cwt_number
                         HAVING COUNT(cwt_number) > 1);

"""
cursor.execute(sql)
print("\t{} cwt records updated.".format(cursor.rowcount))

#  #================================================
#  #            MULTIPLE GRID10
#
#  print("updating cwt.multiple_grid10s....")
#
#  sql = """UPDATE cwt
#     SET multiple_grid10s = 1
#   WHERE cwt.cwt_number IN (
#  SELECT tmp.cwt_number
#    FROM (
#             SELECT cwt.cwt_number,
#                    species.abbrev,
#                    stockingevent.grid_10
#               FROM (
#                        species
#                        INNER JOIN
#                        stockingevent ON species.id = stockingevent.species_id
#                    )
#                    INNER JOIN
#                    (
#                        (
#                            cwt
#                            INNER JOIN
#                            cwt_sequence ON cwt.id = cwt_sequence.cwt_id
#                        )
#                        INNER JOIN
#                        cwt2event ON cwt_sequence.id = cwt2event.cwtseq_id
#                    )
#                    ON stockingevent.id = cwt2event.stocking_event_id
#              GROUP BY cwt.cwt_number,
#                       cwt.tag_type,
#                       species.abbrev,
#                       stockingevent.grid_10
#             HAVING cwt.tag_type = "cwt"
#         )
#         AS tmp
#   GROUP BY tmp.cwt_number,
#            tmp.abbrev
#  HAVING ( ( (Count(tmp.cwt_number) ) > 1) )
#  );
#  """
#  cursor.execute(sql)
#  print("\t{} cwt records updated.".format(cursor.rowcount))


#================================================
#               MULTIPLE MAKERS

print("updating cwt.multiple_makers....")

sql = """
UPDATE common_cwt
   SET multiple_makers = TRUE
WHERE common_cwt.cwt_number IN (SELECT cwt_number
                         --, COUNT(cwt_number) AS N
                         FROM common_cwt
                         GROUP BY cwt_number
                         HAVING COUNT(cwt_number) > 1);

"""
cursor.execute(sql)
print("\t{} cwt records updated.".format(cursor.rowcount))

#================================================
#               MULTIPLE SPECIES

print("updating cwt.multiple_species....")

sql = """UPDATE common_cwt
   SET multiple_species = True
 WHERE common_cwt.cwt_number IN (
SELECT cwt_number
--, COUNT(species_id) AS Species
FROM (SELECT DISTINCT cwt_number,
             events.species_id
      FROM stocking_stockingevent AS events
        JOIN common_cwtsequence_events ON common_cwtsequence_events.stockingevent_id = events.id
        JOIN common_cwtsequence ON common_cwtsequence_events.cwtsequence_id = common_cwtsequence.id
        JOIN common_cwt AS cwt ON cwt.id = common_cwtsequence.cwt_id) AS tmp
GROUP BY cwt_number
HAVING COUNT(species_id) > 1

);
"""

cursor.execute(sql)
print("\t{} cwt records updated.".format(cursor.rowcount))


#================================================
#             MULTIPLE STRAINS

print("updating cwt.multiple_strains....")

sql = '''UPDATE common_cwt
   SET multiple_strains = True
 WHERE common_cwt.cwt_number IN (

SELECT cwt_number
--,      common_name,
--       COUNT(strain_label) AS strains
FROM (SELECT DISTINCT cwt_number,
             species.common_name,
             strain.strain_label
      FROM stocking_stockingevent AS event
        JOIN common_cwtsequence_events ON common_cwtsequence_events.stockingevent_id = event.id
        JOIN common_cwtsequence ON common_cwtsequence_events.cwtsequence_id = common_cwtsequence.id
        JOIN common_cwt AS cwt ON cwt.id = common_cwtsequence.cwt_id
        JOIN common_species AS species ON species.id = event.species_id
        JOIN common_strainraw AS strainraw ON strainraw.id = event.strain_raw_id
        JOIN common_strain AS strain ON strain.id = strainraw.strain_id) AS tmp
GROUP BY cwt_number,
         common_name
HAVING COUNT(cwt_number) > 1

);
'''

cursor.execute(sql)
print("\t{} cwt records updated.".format(cursor.rowcount))


#================================================
#             MULTIPLE YEAR CLASSES

print("updating cwt.multiple_yearclasses....")

sql = """UPDATE common_cwt
   SET multiple_yearclasses = True
 WHERE common_cwt.cwt_number IN (
SELECT cwt_number
--, COUNT(year_class) AS YearClasses
FROM (SELECT DISTINCT cwt_number,
             events.species_id,
             events.year_class
      FROM stocking_stockingevent AS events
        JOIN common_cwtsequence_events ON common_cwtsequence_events.stockingevent_id = events.id
        JOIN common_cwtsequence ON common_cwtsequence_events.cwtsequence_id = common_cwtsequence.id
        JOIN common_cwt AS cwt ON cwt.id = common_cwtsequence.cwt_id) AS tmp
GROUP BY cwt_number, species_id
HAVING COUNT(cwt_number) > 1


);
"""

cursor.execute(sql)
print("\t{} cwt records updated.".format(cursor.rowcount))


#================================================
#             MULTIPLE LAKES

print("updating cwt.multiple_lakes....")


sql = """UPDATE common_cwt
   SET multiple_lakes = True
 WHERE common_cwt.cwt_number IN (
SELECT cwt_number
-- ,       COUNT(lake_id) AS Lakes
FROM (SELECT DISTINCT cwt_number,
             species_id,
             events.lake_id
      FROM stocking_stockingevent AS events
        JOIN common_cwtsequence_events ON common_cwtsequence_events.stockingevent_id = events.id
        JOIN common_cwtsequence ON common_cwtsequence_events.cwtsequence_id = common_cwtsequence.id
        JOIN common_cwt AS cwt ON cwt.id = common_cwtsequence.cwt_id) AS tmp
GROUP BY cwt_number, species_id
HAVING COUNT(lake_id) > 1
);"""


cursor.execute(sql)
print("\t{} cwt records updated.".format(cursor.rowcount))




#================================================
#             Updating re-used flag:

print("updating cwt.tag_reused....")

sql = """
update common_cwt set tag_reused = True where cwt_number in (
select distinct cwt_number from common_cwt where
    multiple_species = True OR
    multiple_strains  = True OR
    multiple_yearclasses  = True OR
    multiple_makers  = True OR
    multiple_agencies  = True OR
    multiple_lakes  = True
-- OR   multiple_gridTrue0s  = True
);
"""

cursor.execute(sql)
print("\t{} cwt records updated.".format(cursor.rowcount))



pg_conn.commit()
cursor.close()
pg_conn.close()




#  #========================
#  # sanity checks:
#
#  #========================
#  #cwts stocked by multiple agencies:
#
#  cwts = CWT.objects.filter(multiple_agencies=True).order_by('cwt_number')
#
#  for cwt in cwts:
#      print(cwt)
#      events = StockingEvent.objects.filter(cwt_series__cwt=cwt)
#      for event in events:
#          print(event, event.agency.abbrev)
#
#  #========================
#  #cwts with the same number made by different makers:
#  cwts = CWT.objects.filter(multiple_makers=True).order_by('cwt_number')
#  for cwt in cwts:
#      print(cwt, cwt.manufacturer)
#      events = StockingEvent.objects.filter(cwt_series__cwt=cwt)
#      for event in events:
#          print(event, event.year, event.agency.abbrev)
#
#
#  #========================
#  #cwts with the same stocked in more than one lake
#  cwts = CWT.objects.filter(multiple_lakes=True).order_by('cwt_number')
#  for cwt in cwts:
#      print(cwt, cwt.manufacturer)
#      events = StockingEvent.objects.filter(
#          cwt_series__cwt=cwt).order_by('lake')
#      for event in events:
#          print(event.lake, event, event.year, event.agency.abbrev)
#
#
#
#  #========================
#  #cwts with the same stocked in more than one species
#  cwts = CWT.objects.filter(multiple_species=True).order_by('cwt_number')
#  for cwt in cwts:
#      print(cwt, cwt.manufacturer)
#      events = StockingEvent.objects.filter(
#          cwt_series__cwt=cwt).order_by('species')
#      for event in events:
#          print(event.species, event, event.year, event.agency.abbrev)
#
#
#
#  #========================
#  #cwts with the same stocked in more than one strain within the same species
#  cwts = CWT.objects.filter(multiple_strains=True).order_by('cwt_number')
#  for cwt in cwts:
#      print(cwt, cwt.manufacturer)
#      events = StockingEvent.objects.filter(
#          cwt_series__cwt=cwt).order_by('species',
#                                        'strain_raw__strain__strain_label')
#      for event in events:
#          print(event.species, event, event.year,
#                event.strain_raw.strain.strain_label)
#
#
#  #========================
#  #cwts with the same number stocked in more
#  #than one year class within the same species
#  cwts = CWT.objects.filter(multiple_yearclasses=True).order_by('cwt_number')
#  for cwt in cwts:
#      print(cwt, cwt.manufacturer, cwt.tag_type)
#      events = StockingEvent.objects.filter(
#          cwt_series__cwt=cwt).order_by('species',
#                                        'year_class')
#      for event in events:
#          print('\t', event.species, event, event.year, event.year_class)
