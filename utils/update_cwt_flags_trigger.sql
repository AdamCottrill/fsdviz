-- This file was used to build the python script that updates the cwt flags
-- it contains a number of sub-queries that select cwt that have been
-- 'compromised' in some way.  It is not intended to be used directly, but
-- may be useful in the future if we choose to add more flags or need
-- to change the criteria associated with each (e.g. - by species or not)
CREATE FUNCTION update_reused_cwt_flags_trigger_fct () RETURNS TRIGGER LANGUAGE PLPGSQL
AS
' BEGIN


UPDATE common_cwt
   SET multiple_makers = CASE
                           WHEN cwt_number IN (SELECT DISTINCT mm.cwt_number
                                               FROM (SELECT DISTINCT cwt_number,
                                                            manufacturer
                                                     FROM common_cwt
                                                     WHERE manufacturer = ''mm'') AS mm
                                                 JOIN common_cwt AS cwt ON cwt.cwt_number = mm.cwt_number
                                               WHERE cwt.manufacturer = ''nmt'') THEN TRUE
                           ELSE FALSE
                         END,
       multiple_strains = CASE
                            WHEN cwt_number IN (SELECT cwt_number
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
                                                HAVING COUNT(cwt_number) > 1) THEN TRUE
                            ELSE FALSE
                          END,
       multiple_agencies = CASE
                             WHEN cwt_number IN (SELECT cwt_number
                                                 --       ,COUNT(agency_id) AS Agencies
                                                 FROM (SELECT DISTINCT cwt_number,
                                                              events.agency_id
                                                       FROM stocking_stockingevent AS events
                                                         JOIN common_cwtsequence_events ON common_cwtsequence_events.stockingevent_id = events.id
                                                         JOIN common_cwtsequence ON common_cwtsequence_events.cwtsequence_id = common_cwtsequence.id
                                                         JOIN common_cwt AS cwt ON cwt.id = common_cwtsequence.cwt_id) AS tmp
                                                 GROUP BY cwt_number
                                                 HAVING COUNT(cwt_number) > 1) THEN TRUE
                             ELSE FALSE
                           END,
       multiple_species = CASE
                            WHEN cwt_number IN (SELECT cwt_number
                                                --,COUNT(species_id) AS Species
                                                FROM (SELECT DISTINCT cwt_number,
                                                             events.species_id
                                                      FROM stocking_stockingevent AS events
                                                        JOIN common_cwtsequence_events ON common_cwtsequence_events.stockingevent_id = events.id
                                                        JOIN common_cwtsequence ON common_cwtsequence_events.cwtsequence_id = common_cwtsequence.id
                                                        JOIN common_cwt AS cwt ON cwt.id = common_cwtsequence.cwt_id) AS tmp
                                                GROUP BY cwt_number
                                                HAVING COUNT(species_id) > 1) THEN TRUE
                            ELSE FALSE
                          END,
       multiple_lakes = CASE
                          WHEN cwt_number IN (SELECT cwt_number
                                              --,COUNT(lake_id) AS Lakesb
                                              FROM (SELECT DISTINCT cwt_number,
                                                           jurisdiction.lake_id
                                                    FROM stocking_stockingevent AS events
                                                      JOIN common_jurisdiction AS jurisdiction ON jurisdiction.id = events.jurisdiction_id
                                                      JOIN common_cwtsequence_events ON common_cwtsequence_events.stockingevent_id = events.id
                                                      JOIN common_cwtsequence ON common_cwtsequence_events.cwtsequence_id = common_cwtsequence.id
                                                      JOIN common_cwt AS cwt ON cwt.id = common_cwtsequence.cwt_id) AS tmp
                                              GROUP BY cwt_number
                                              HAVING COUNT(lake_id) > 1) THEN TRUE
                          ELSE FALSE
                        END,
       multiple_yearclasses = CASE
                                WHEN cwt_number IN (SELECT cwt_number
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
                                                    HAVING COUNT(cwt_number) > 1) THEN TRUE
                                ELSE FALSE
                              END;

UPDATE common_cwt
   SET tag_reused = case when
   cwt_number IN (SELECT distinct cwt_number
                     FROM common_cwt
                     WHERE multiple_species = TRUE
                     OR    multiple_strains = TRUE
                     OR    multiple_yearclasses = TRUE
                     OR    multiple_makers = TRUE
                     OR    multiple_agencies = TRUE
                     OR    multiple_lakes = TRUE)
                     THEN TRUE
                           ELSE FALSE
                         END;

return NEW;

END;

';


CREATE TRIGGER update_reused_cwt_flags_trigger 
AFTER INSERT OR UPDATE OR DELETE ON stocking_stockingevent
FOR EACH STATEMENT 
EXECUTE PROCEDURE update_reused_cwt_flags_trigger_fct();

-- -- reverse:
--DROP TRIGGER update_reused_cwt_flags_trigger on stocking_stockingevent;
--DROP FUNCTION update_reused_cwt_flags_trigger_fct;


select notes from stocking_stockingevent where stock_id='202195287';
update stocking_stockingevent set notes = notes || ' foobar.' where stock_id='202195287';
commit;


select * from common_cwt where multiple_strains=True limit 10;



select * from pjtk2_projecttype limit 10;


select slug, st_asgeojson(geom) from spatial_mus_managementunit;



select slug from common_managementunit where geom is null ;


select slug from man_units order by slug;
select slug from common_managementunit order by slug;
