-- ==========================================================
--                  AGGREGEATE MANAGEMENT UNITS
-- these are management units in the GLFSDB that are amalgamations of
-- other management units:
--update common_managementunit set label = 'IL' where label='ILL';
--update common_managementunit set label = 'IN' where label='IND';
-- make MM123
UPDATE common_managementunit
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
               FROM common_managementunit AS mu2
               WHERE mu2.label IN ('MM1','MM2','MM3'))
WHERE label = 'MM123';

-- make Wisconsin waters of Lake Michigan - it is currently both a
-- mangement unit and a juristiction. This is the mangament unit:
UPDATE common_managementunit
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
               FROM common_managementunit AS mu2
               WHERE mu2.label LIKE 'WM%')
WHERE label = 'WM';

-- --update the centroid fo each management unit:
-- UPDATE common_managementunit
--    SET centroid = st_centroid(geom)
-- WHERE geom IS NOT NULL;

-- ==========================================================
--                  JURISDICTIONS


UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label = 'SC_ON')
WHERE slug = 'sc_on';

UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label = 'SC_MI')
WHERE slug = 'sc_mi';


-- LAKE Ontario - ontario waters:
UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label LIKE 'OO%')
WHERE name = 'Ontario-Ontario';

-- LAKE Ontario - New York waters:
UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label LIKE 'NO%')
WHERE name = 'Ontario-New York';

COMMIT;

-- LAKE Erie - ontario waters:
UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label LIKE 'OE%')
WHERE name = 'Erie-Ontario';

UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label IN ('O1','O2','O3'))
WHERE name = 'Erie-Ohio';

UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label = 'MICH')
WHERE name = 'Erie-Michigan';

UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label = 'NY')
WHERE name = 'Erie-New York';

UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label = 'PENN')
WHERE name = 'Erie-Pennsylvania';

COMMIT;

-- LAKE Superior - ontario waters:
UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label LIKE 'OS%')
WHERE name = 'Superior-Ontario';

-- LAKE Superior - Michigan waters:
UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label LIKE 'MS%')
WHERE name = 'Superior-Michigan';

-- LAKE Superior - Minnesota waters:
UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label IN ('M1','M2','M3'))
WHERE name = 'Superior-Minnesota';

-- LAKE Superior - Wisconsin waters:
UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label = 'WISC')
WHERE name = 'Superior-Wisconsin';

COMMIT;

-- LAKE HURON - michigan waters
UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label LIKE 'MH%')
WHERE name = 'Huron-Michigan';

-- LAKE HURON - ontario waters:
UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label LIKE 'OH%'
                    OR    mu2.label LIKE 'NC%'
                    OR    mu2.label LIKE 'GB%')
WHERE name = 'Huron-Ontario';

COMMIT;

-- LAKE MICHIGAN
UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label LIKE 'WM%')
WHERE name = 'Michigan-Wisconsin';

UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label LIKE 'MM%')
WHERE name = 'Michigan-Michigan';

UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label LIKE 'IL%')
WHERE name = 'Michigan-Illinois';

UPDATE common_jurisdiction
   SET geom = (SELECT st_multi(st_union (geom)) AS geom
                    FROM common_managementunit AS mu2
                    WHERE mu2.label LIKE 'IN%')
WHERE name = 'Michigan-Indiana';

-- -- update the extents of each juristiction with its bountding box:
-- UPDATE common_jurisdiction
--    SET extents = st_multi(st_envelope (geom));
 
COMMIT;

---===============================
--         LAKES
-- update the geoms for each lake by merging all of the juristictions in each lake
UPDATE common_lake
   SET geom = geom.geom
FROM (SELECT lake.abbrev,
             st_multi(st_union (jur.geom)) AS geom
      FROM common_jurisdiction AS jur
        JOIN common_lake AS lake ON lake.id = jur.lake_id
      GROUP BY abbrev) AS geom
WHERE common_lake.abbrev = geom.abbrev;

-- -- update our lake centroid too:
-- UPDATE common_lake
--    SET centroid = st_centroid(geom)
-- WHERE geom IS NOT NULL;

COMMIT;
