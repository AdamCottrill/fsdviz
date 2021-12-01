-- This file was used to build the python script that updates the cwt flags
-- it contains a number of sub-queries that select cwt that have been
-- 'compromised' in some way.  It is not intended to be used directly, but
-- may be useful in the future if we choose to add more flags or need
-- to change the criteria associated with each (e.g. - by species or not)


-- select * from common_cwt limit 10;
-- select * from common_cwtsequence limit 10;
-- select * from common_cwtsequence_events limit 10;
-- select * from stocking_stockingevent limit 10;
-- select * from common_strainraw limit 10;
-- select * from common_strain limit 10;



CREATE FUNCTION update_reused_cwt_flags_trigger_fct()
   RETURNS TRIGGER
   LANGUAGE PLPGSQL
AS $$
BEGIN

-- find cwt numbers that have been stocked by more than one agency
update common_cwt set multiple_agencies=false;
update common_cwt set multiple_agencies=true where cwt_number in (

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

);
--commit;
-- find cwt numbers that have been stocked in more than one species
update common_cwt set multiple_agencies=false;
update common_cwt set multiple_species=true where cwt_number in (
SELECT cwt_number
       --,COUNT(species_id) AS Species
FROM (
SELECT DISTINCT cwt_number,
             events.species_id
      FROM stocking_stockingevent AS events
        JOIN common_cwtsequence_events ON common_cwtsequence_events.stockingevent_id = events.id
        JOIN common_cwtsequence ON common_cwtsequence_events.cwtsequence_id = common_cwtsequence.id
        JOIN common_cwt AS cwt ON cwt.id = common_cwtsequence.cwt_id

) AS tmp
GROUP BY cwt_number
HAVING COUNT(species_id) > 1
);
--commit;

-- find cwt numbers that have the same number but have been stocked in more than one lake
-- regardless of what species they were stocked in (a tag that was used in chinook in
-- Huron and lake trout in michigan will be flagged).
update common_cwt set multiple_lakes=false;
update common_cwt set multiple_lakes=true where cwt_number in (
SELECT cwt_number
       --,COUNT(lake_id) AS Lakesb
FROM (
SELECT DISTINCT cwt_number,
             jurisdiction.lake_id
      FROM stocking_stockingevent AS events
      join common_jurisdiction as jurisdiction on jurisdiction.id=events.jurisdiction_id
        JOIN common_cwtsequence_events ON common_cwtsequence_events.stockingevent_id = events.id
        JOIN common_cwtsequence ON common_cwtsequence_events.cwtsequence_id = common_cwtsequence.id
        JOIN common_cwt AS cwt ON cwt.id = common_cwtsequence.cwt_id

) AS tmp
GROUP BY cwt_number
HAVING COUNT(lake_id) > 1
);
--commit;

-- find cwt numbers that have the same number but have been stocked in more than one lake and species
-- lake trout stocked in both huron and Michigan will be flagged
-- lake trout in michigan, salmon in huron will not.
-- update common_cwt set multiple_lakes=true where cwt_number in (
-- SELECT cwt_number
--        --COUNT(lake_id) AS Lakes
-- FROM (SELECT DISTINCT cwt_number,
--              events.species_id,
--              jurisdiction.lake_id
--       FROM stocking_stockingevent AS events
--         join common_jurisdiction as jurisdiction on jurisdiction.id=events.jurisdiction_id
--         JOIN common_cwtsequence_events ON common_cwtsequence_events.stockingevent_id = events.id
--         JOIN common_cwtsequence ON common_cwtsequence_events.cwtsequence_id = common_cwtsequence.id
--         JOIN common_cwt AS cwt ON cwt.id = common_cwtsequence.cwt_id) AS tmp
-- GROUP BY cwt_number, species_id
-- HAVING COUNT(lake_id) > 1
-- );


-- find cwt numbers that have been stocked in more than one year-class within a species
update common_cwt set multiple_yearclasses=false;
update common_cwt set multiple_yearclasses=true where cwt_number in (
SELECT cwt_number
--       ,COUNT(year_class) AS YearClasses
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
)
--commit;

-- find cwt numbers that have been stocked in more than one lifestage - within the same species!!

-- SELECT cwt_number
--        --COUNT(lifestage_id) AS lifestages
-- FROM (SELECT DISTINCT cwt_number,
--              events.species_id,
--              events.lifestage_id
--       FROM stocking_stockingevent AS events
--         JOIN common_cwtsequence_events ON common_cwtsequence_events.stockingevent_id = events.id
--         JOIN common_cwtsequence ON common_cwtsequence_events.cwtsequence_id = common_cwtsequence.id
--         JOIN common_cwt AS cwt ON cwt.id = common_cwtsequence.cwt_id) AS tmp
-- GROUP BY cwt_number,
--          species_id
-- HAVING COUNT(cwt_number) > 1


-- find cwt numbers that have been stocked in more than one strain - within the same species!!
update common_cwt set multiple_strains=false;
update common_cwt set multiple_strains=true where cwt_number in (
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
--commit;


-- need the OMNR Patch completed to update those records where micro-mark tags were used.
--select cwt_number from (
--select cwt_number, manufacturer from common_cwt as cwt group by cwt_number, manufacturer
--) as x
--group by x.cwt_number having count(x.cwt_number)>1;
--
-- finally, trip the tag_reused flag to exclude all
UPDATE common_cwt
   SET tag_reused = false;
UPDATE common_cwt
   SET tag_reused = TRUE
WHERE cwt_number IN (SELECT cwt_number
                     FROM common_cwt
                     WHERE multiple_species = TRUE
                     OR    multiple_strains = TRUE
                     OR    multiple_yearclasses = TRUE
--                     OR    multiple_makers = TRUE
                     OR    multiple_agencies = TRUE
                     OR    multiple_lakes = TRUE);



commit;

-- trigger logic
END;
$$

CREATE TRIGGER update_reused_cwt_flags_insert_trigger()
   AFTER INSERT
   ON stocking_stockingevent
   FOR EACH STATEMENT
       EXECUTE PROCEDURE update_reused_cwt_flags_trigger_fct()

CREATE TRIGGER update_reused_cwt_flags_update_trigger()
   AFTER UPDATE
   ON stocking_stockingevent
   FOR EACH STATEMENT
       EXECUTE PROCEDURE update_reused_cwt_flags_trigger_fct()

CREATE TRIGGER update_reused_cwt_flags_delete_trigger()
   AFTER DELETE
   ON stocking_stockingevent
   FOR EACH STATEMENT
       EXECUTE PROCEDURE update_reused_cwt_flags_trigger_fct()

-- reverse:

-- DROP TRIGGER update_reused_cwt_flags_insert_trigger;
-- DROP TRIGGER update_reused_cwt_flags_update_trigger;
-- DROP TRIGGER update_reused_cwt_flags_delete_trigger;
-- DROP FUNCTION update_reused_cwt_flags_trigger_fct;
