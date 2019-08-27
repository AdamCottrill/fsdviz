# Generated by Django 2.2 on 2019-08-12 13:54

import django.contrib.gis.db.models.fields
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('common', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Condition',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('condition', models.IntegerField(unique=True)),
                ('description', models.CharField(max_length=100)),
            ],
            options={
                'ordering': ['condition'],
            },
        ),
        migrations.CreateModel(
            name='LifeStage',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('abbrev', models.CharField(max_length=7, unique=True)),
                ('description', models.CharField(max_length=100)),
            ],
            options={
                'ordering': ['abbrev'],
            },
        ),
        migrations.CreateModel(
            name='StockingMethod',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('stk_meth', models.CharField(max_length=25, unique=True, verbose_name='Stocking Method')),
                ('description', models.CharField(max_length=100)),
            ],
            options={
                'ordering': ['stk_meth'],
            },
        ),
        migrations.CreateModel(
            name='StockingEvent',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('stock_id', models.CharField(max_length=100, unique=True, verbose_name='unique event identifier provided by agency')),
                ('date', models.DateField(blank=True, null=True, verbose_name='Stocking event date')),
                ('day', models.IntegerField(blank=True, null=True, verbose_name='Day of the month')),
                ('month', models.IntegerField(blank=True, db_index=True, null=True, verbose_name='Month of stocking event as an integer')),
                ('year', models.IntegerField(db_index=True, verbose_name='year of the stocking event as an integer >1900')),
                ('site', models.CharField(blank=True, max_length=100, null=True)),
                ('st_site', models.CharField(blank=True, max_length=100, null=True)),
                ('dd_lat', models.FloatField(blank=True, null=True, verbose_name='Latitude in decimal degrees')),
                ('dd_lon', models.FloatField(blank=True, null=True, verbose_name='Longitude in decimal degrees')),
                ('geom', django.contrib.gis.db.models.fields.PointField(blank=True, null=True, srid=4326, verbose_name='GeoDjango spatial point field')),
                ('grid_5', models.CharField(blank=True, max_length=4, null=True)),
                ('no_stocked', models.IntegerField(verbose_name='Number of fish stocked')),
                ('yreq_stocked', models.IntegerField(verbose_name='Number of fish stocked as yearling equivalents')),
                ('year_class', models.IntegerField(db_index=True, verbose_name='Year class of stocked fish')),
                ('agemonth', models.IntegerField(blank=True, null=True, verbose_name='age of stocked fish in months')),
                ('length', models.IntegerField(blank=True, null=True, verbose_name='length of stocked fish in mm')),
                ('weight', models.IntegerField(blank=True, null=True, verbose_name='weight of stocked fish in grams')),
                ('lotcode', models.CharField(blank=True, max_length=100, null=True, verbose_name='Hatchery Lot code indicating source of stocked fish')),
                ('tag_no', models.CharField(blank=True, db_index=True, max_length=100, null=True)),
                ('clipa', models.CharField(blank=True, db_index=True, max_length=10, null=True)),
                ('mark', models.CharField(blank=True, db_index=True, max_length=50, null=True, verbose_name='Chemical, tag, or finclip mark applied to fish')),
                ('mark_eff', models.FloatField(blank=True, null=True, verbose_name='Marking efficency as a percentage')),
                ('tag_ret', models.FloatField(blank=True, null=True, verbose_name='Tag retention as a percentage')),
                ('validation', models.IntegerField(blank=True, choices=[(0, 'level 0, entered at hatchery, unknown verification status'), (1, 'level 1, entered at hatchery and not verified'), (2, 'level 2, entered and verified at hatchery'), (3, 'level 3, entered at hatchery and verified by GBFRO'), (4, 'level 4, entered and verified at hatchery and verified at GBFRO'), (5, 'level 5, entered and verified at GLFC'), (6, 'level 6, entered and verified at GBFRO'), (7, 'entered by Dept. FW, MSU., not avail. from GLFC'), (8, 'entered by COTFMA'), (9, 'assumed to be validated by state prior to receipt'), (10, 'level 10, data entered and verified at OMNR')], null=True, verbose_name='Event Data Validation Code 0-10.')),
                ('notes', models.CharField(blank=True, max_length=500, null=True)),
                ('agency', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stocking_events', to='common.Agency')),
                ('condition', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stocking_events', to='stocking.Condition')),
                ('grid_10', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stocking_events', to='common.Grid10')),
                ('jurisdiction', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stocking_events', to='common.Jurisdiction')),
                ('latlong_flag', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stocking_events', to='common.LatLonFlag')),
                ('lifestage', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stocking_events', to='stocking.LifeStage')),
                ('management_unit', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stocking_events', to='common.ManagementUnit')),
                ('marks', models.ManyToManyField(to='common.Mark')),
                ('species', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stocking_events', to='common.Species')),
                ('stocking_method', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stocking_events', to='stocking.StockingMethod')),
                ('strain_raw', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stocking_events', to='common.StrainRaw')),
            ],
            options={
                'ordering': ['-year', 'stock_id'],
            },
        ),
    ]
