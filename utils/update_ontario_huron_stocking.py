'''

~/utils/update_ontario_stocking.py
Created: 23 Jan 2019 15:29:22

DESCRIPTION:

This script updates the ontario data in the lake wide cwt database.
Updates include tag type, and sequence number for sequential cwts, cwt
manufacturer (where it should have been Micro Mark (MM))

Updates are preformed on both stocking (below) and recovery (NOT YET)
tables.

This script should be run after the lakewide database has been
built and populated with both US and ontario data.


A. Cottrill
=============================================================

'''

import csv
import re

from collections import namedtuple

from fsdviz.common.models import CWT, CWTsequence
from fsdviz.stocking.models import StockingEvent


#======================================================
#           FSIS_ID to ID

#to update the OMNR stocking data, we need a dictionary that maps
#the ontario id values (fs_event) to the StockingEvent.Id in the
#current database

#get the id numbers and notes for each lake huron ontario stocking event

ont_events = StockingEvent.objects.\
             filter(agency__abbrev='OMNR',
                    lake__abbrev='HU').values('notes','id')

# ontario fs_event numbers are in the notes field as 'fs_event:
# <fsis_id>' this code extracts the fsis_id from the notes and pairs
# it with its corresponding id in the current lakewide database.
# returns a list of tuples of the form: (<fsis_id>, <id>)
id_pairs = [(int(re.match('fs_event: (\d+)',x['notes']).groups()[0]), x['id'])
            for x in ont_events]

#create a dictionary with the fsis_id as key - makes it easy to get
#associated id for the lakewide db:
fsis2lwdb = {k:v for k,v in id_pairs}



#======================================================
#           STOCKED SEQUENTIAL CWTS

print("Updating Ontario's Sequential tags...")

# the csv file "MNRF_stocking_events_sequential_cwts.csv" contains a
# list of stocking events associated with sequential csv and the start
# and end the range associated with that event.


#create a named tuple that will hold our stocking event info:
seqCWT = namedtuple('seqCWT', 'fsis_event, cwt_number, seq_start, seq_end')

fname = "utils/patches/MNRF_stocking_events_sequential_cwts.csv"
with open(fname) as csvfile:
    reader = csv.reader(csvfile)
    next(reader, None) #skip header
    seqcwt_events = [seqCWT(*x) for x in reader]

for x in seqcwt_events[:3]:
    print(x)

#now loop over the sequential cwt events and find the associated cwt
#and cwt_sequences in our database.  Update the cwt start, end and tag
#type for each one.  Keep a list of errors and print them out if
#anything goes wrong.
oops = []
for event in seqcwt_events:
    try:
        cwt = CWT.objects.get(cwt_number=event.cwt_number)
        lwdb_id = fsis2lwdb[int(event.fsis_event)]
        stocking_event = StockingEvent.objects.get(id=lwdb_id)

        cwt_seq, created = CWTsequence.objects.get_or_create(
            cwt=cwt,
            seq_start=int(event.seq_start),
            seq_end=int(event.seq_end))

        cwt_seq.events.add(stocking_event)
        cwt.tag_type='sequential'
        cwt.save()

    except KeyError as err:
        oops.append(event)

if oops:
    print("There were problems with the following sequential tag records:")
    for x in oops:
        print(x)


# make sure that there aren't any stocking events associated with
# sequential cwts series that end with 1 - they should have all been
# fixed in the last step.
oops = StockingEvent.objects.filter(cwt_series__seq_end=1,
                                    cwt_series__cwt__tag_type='sequental')
assert(len(oops)==0)

# delete all of cwt series associated with seqential tags that start
# and end with 1 - these were created when the cwt was added but no
# longer point to any stocking events
childless_cwts = CWTsequence.objects.filter(cwt__tag_type='sequential',
                                            seq_start=1, seq_end=1)

childless_cwts.delete()



#


#======================================================
#                  CWT MANUFACTURER

print("Updating MicroMark tags...")

# this query returs a list of cwt numbers (without dashes) that we
# know were manufactured by Micro Mark.  Only cwt numbers that are
# unique were to micro mark are included (63-59-01, 63-41-04,
# 63-43-04, 63-56-03 were manufactured by both MM and NMT and must be
# handled seperately (below))

fname = "utils/patches/MNRF_MicroMark_cwts.csv"

with open(fname) as csvfile:
    reader = csv.reader(csvfile)
    next(reader, None) #skip header
    mm_cwts = [x[0] for x in reader]



omnr = Agency.objects.get(abbrev='OMNR')

for cwt_num in mm_cwts:

    qs = CWT.objects.filter(cwt_number=cwt_num,
                          cwt_series__events__agency=omnr).distinct()
    assert(len(qs)==1)
    cwt = qs[0]
    cwt.manufacturer = 'mm'
    cwt.save()


#these are the cwt number that have been purchased from two
#vendors. The event numbers are the stocking event IDs that used the
#Micro Mark tags.
micromark_events = {
    #chinook stocked by ssa in 2001 - Not in FSIS Yet!
    '634104':[],
    #chinook stocked by ssa in 2001 - Not in FSIS Yet!
    '634304':[],
    '635603':[2650],
    '635901':[2379, 2928],
}

# now loop over cwt numbers that have been purchased from 2
# manufacturers and get the events associated with each one create a
# new CWT object and new cwt_sequence.  FInally, get the original
# stocking event and assign it to the sequence object created above.


for cwt_num, event_nums in micromark_events.items():
    print("Applying updates for both {} tags...".format(cwt_num))

    cwt_obj, created = CWT.objects.get_or_create(
        cwt_number=cwt_num,
        tag_type='cwt',
        tag_count=0,
        manufacturer='mm'
    )

    cwt_seq, created = CWTsequence.objects.get_or_create(cwt=cwt_obj,
                                                         seq_start=1,
                                                         seq_end=1)
    if event_nums:
        for fsis_id in event_nums:
            lwdb_id = fsis2lwdb.get(fsis_id)
            if lwdb_id:
                event = StockingEvent.objects.get(id=lwdb_id)
                event.cwt_series.clear()
                cwt_seq.events.add(event)
            else:
                print('/t unable for find FSIS event: {}'.format(fsis_id))

print('Done updating Ontario-Huron tags.')
