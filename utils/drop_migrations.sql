drop table common_strainraw;
drop table common_strain;
drop table common_species;
drop table common_readme;
drop table common_grid10;
drop table common_managementunit;
drop table common_stateprovince;
drop table common_agency;
drop table common_lake;
drop table common_builddate;
delete from django_migrations where app='common';
