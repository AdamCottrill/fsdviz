-- This file was used to build the python script that updates the cwt flags
-- it contains a number of sub-queries that select cwt that have been
-- 'compromised' in some way.  It is not intended to be used directly, but
-- may be useful in the future if we choose to add more flags or need
-- to change the criteria associated with each (e.g. - by species or not)


select * from common_cwt limit 10;
select * from common_cwtsequence limit 10;
select * from common_cwtsequence_events limit 10;
select * from stocking_stockingevent limit 10;
select * from common_strainraw limit 10;
select * from common_strain limit 10;


-- find cwt numbers that have been stocked by more than one agency
SELECT cwt_number
--       ,COUNT(agency_id) AS Agencies
FROM (SELECT DISTINCT cwt_number,
             events.agency_id
      FROM stocking_stockingevent AS events
        JOIN common_cwtsequence_events ON common_cwtsequence_events.stockingevent_id = events.id
        JOIN common_cwtsequence ON common_cwtsequence_events.cwtsequence_id = common_cwtsequence.id
        JOIN common_cwt AS cwt ON cwt.id = common_cwtsequence.cwt_id) AS tmp
GROUP BY cwt_number
HAVING COUNT(cwt_number) > 1



-- find cwt numbers that have been stocked in more than one species
SELECT cwt_number,
       COUNT(species_id) AS Species
FROM (SELECT DISTINCT cwt_number,
             events.species_id
      FROM stocking_stockingevent AS events
        JOIN common_cwtsequence_events ON common_cwtsequence_events.stockingevent_id = events.id
        JOIN common_cwtsequence ON common_cwtsequence_events.cwtsequence_id = common_cwtsequence.id
        JOIN common_cwt AS cwt ON cwt.id = common_cwtsequence.cwt_id) AS tmp
GROUP BY cwt_number
HAVING COUNT(species_id) > 1


-- find cwt numbers that have the same number but have been stocked in more than one lake
-- regardless of what species they were stocked in (a tag that was used in chinook in
-- Huron and lake trout in michigan will be flagged).

SELECT cwt_number,
       COUNT(lake_id) AS Lakes
FROM (SELECT DISTINCT cwt_number,
             events.lake_id
      FROM stocking_stockingevent AS events
        JOIN common_cwtsequence_events ON common_cwtsequence_events.stockingevent_id = events.id
        JOIN common_cwtsequence ON common_cwtsequence_events.cwtsequence_id = common_cwtsequence.id
        JOIN common_cwt AS cwt ON cwt.id = common_cwtsequence.cwt_id) AS tmp
GROUP BY cwt_number
HAVING COUNT(lake_id) > 1



-- find cwt numbers that have the same number but have been stocked in more than one lake and species
-- lake trout stocked in both huron and Michigan will be flagged
-- lake trout in michigan, salmon in huron will not.
SELECT cwt_number,
       COUNT(lake_id) AS Lakes
FROM (SELECT DISTINCT cwt_number,
             events.species_id,
             events.lake_id
      FROM stocking_stockingevent AS events
        JOIN common_cwtsequence_events ON common_cwtsequence_events.stockingevent_id = events.id
        JOIN common_cwtsequence ON common_cwtsequence_events.cwtsequence_id = common_cwtsequence.id
        JOIN common_cwt AS cwt ON cwt.id = common_cwtsequence.cwt_id) AS tmp
GROUP BY cwt_number, species_id
HAVING COUNT(lake_id) > 1



-- find cwt numbers that have been stocked in more than one year class within a species
SELECT cwt_number,
       COUNT(year_class) AS YearClasses
FROM (SELECT DISTINCT cwt_number,
             events.species_id,
             events.year_class
      FROM stocking_stockingevent AS events
        JOIN common_cwtsequence_events ON common_cwtsequence_events.stockingevent_id = events.id
        JOIN common_cwtsequence ON common_cwtsequence_events.cwtsequence_id = common_cwtsequence.id
        JOIN common_cwt AS cwt ON cwt.id = common_cwtsequence.cwt_id) AS tmp
GROUP BY cwt_number,
         species_id
HAVING COUNT(cwt_number) > 1

-- find cwt numbers that have been stocked in more than one lifestage - within the same species!!
SELECT cwt_number,
       COUNT(lifestage_id) AS lifestages
FROM (SELECT DISTINCT cwt_number,
             events.species_id,
             events.lifestage_id
      FROM stocking_stockingevent AS events
        JOIN common_cwtsequence_events ON common_cwtsequence_events.stockingevent_id = events.id
        JOIN common_cwtsequence ON common_cwtsequence_events.cwtsequence_id = common_cwtsequence.id
        JOIN common_cwt AS cwt ON cwt.id = common_cwtsequence.cwt_id) AS tmp
GROUP BY cwt_number,
         species_id
HAVING COUNT(cwt_number) > 1


-- find cwt numbers that have been stocked in more than one strain - within the same species!!
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
HAVING COUNT(cwt_number) > 1;
