'''~/utils/update_ontario_hruon_recoveries.py
Created: 28 Jan 2019 15:06:30


DESCRIPTION:
------------

This scripts updates recoveries from the ontario waters of Lake Huron
with additional information that is not currently included in the
lamprey submission to the GLFC.  Specificlly, it adds the sequential
tag number for those tags that have it and updates the small number of
MicroMark tags with the appropriate manufacturer. The default is 'nmt'
which is not correct for a some tags.

Required Data sources:

 ~/patches/MNRF_recovery_events_sequential_cwts.csv
 ~ pathces/MNRF_MicroMark_cwts.csv
 ~/pathces/MNRF_recovery_events_micromark_cwts.csv

MNRF_recovery_events_sequential_cwts.csv is a table that is produced
by the process that aggregates MNRF data for the GLFC lamprey request.
The table is included in the access database containing the lamprey
submission.

MNRF_MicroMark_cwts.csv is a list of cwt numbers that were generated
form MNFR Lake Huron cwt inventory.  It includes only cwt numbers
manufactured exclusively by Micro Mark, and as such can be safely
updated based on cwt number (cwt number and manufacturer is unique)


MNRF_recovery_events_micromark_cwts.csv this is a list of cwt recovery
objects where the cwt was not unique to one manufactuer.  Other
attributes were used to differentitate the asscociated stocking events
(normally species and/or fin clip).  This table is used to update the
manfacturer field for recoveries that satisfy those criteria.  Luckily
there arne't many of them.


63-59-01
--------

Micro mark tags were deployed in chinooks salmon stocked in 2000 by
SSA and in 200 extra brood stock lake trout released into Owen Sound
in 1996.  NMT tag number 63-59-01 was stocked in Lake Manitou lake
trout stocked in 1988.


63-43-04 and 63-41-04
---------------------

Micro mark tags 63-41-04 and 63-43-04 were used to mark chinook salmon
stocked by SSA in 2001. NMT tags with same numbers were used to tag
Slate Island lake trout stocked in Cape Rich in 1996.


63-56-03
--------

Micro mark 63-56-03 were stocked in Slate Island strain lake trout
stocked in 1998.  These fish had only adipose clips.  The NMT tag with
the same number was used to mark Michipicoten strain lake trout in
1994 stocked off of Tobermory. These fish has had clip 45.


A. Cottrill

'''


import csv

from django.core.exceptions import ObjectDoesNotExist

# Add Seq# to sequential tags:

fname = "utils/patches/MNRF_recovery_events_sequential_cwts.csv"
with open(fname) as csvfile:
    reader = csv.reader(csvfile)
    next(reader, None) #skip header
    seq_recoveries = [x for x in reader]

for tag in seq_recoveries:
    try:
        recovery = Recovery.objects.get(fish_identifier_key=tag[0])
        recovery.sequential_number=tag[2]
        recovery.save()
    except ObjectDoesNotExist:
        msg = "oops! unable to find fish_key = '{}'"
        print(msg.format(tag[0]))

print("Done adding sequence number to MNRF recoveries.")

# update manufacturer for unambiguous Micro mark tags

fname = "utils/patches/MNRF_MicroMark_cwts.csv"
with open(fname) as csvfile:
    reader = csv.reader(csvfile)
    next(reader, None) #skip header
    mm_cwts = [x[0] for x in reader]

print("Found {} MicroMark cwt numbers.".format(len(mm_cwts)))


mm_recoveries = Recovery.objects.filter(cwt_number__in=mm_cwts)

mm_recoveries.update(manufacturer='mm')


# update manufacturer for those tags with overlapping cwt number

# e.g -  recoveries of cwt numbers
# that were produced by both nmt and mm. These recoveries in our csv file
# need to be updated to'mm'

fname = "utils/patches/MNRF_recovery_events_micromark_cwts.csv"
with open(fname) as csvfile:
    reader = csv.reader(csvfile)
    next(reader, None) #skip header
    mm_recoveries = [x[0] for x in reader]

print("Found {} MicroMark cwt recoveries.".format(len(mm_recoveries)))

recoveries = Recovery.objects.filter(fish_identifier_key__in=mm_recoveries)
recoveries.update(manufacturer='mm')
