# Generated by Django 2.2 on 2019-10-04 19:40

import django.contrib.gis.db.models.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('common', '0007_auto_20190924_1633'),
    ]

    operations = [
        migrations.RenameField(
            model_name='jurisdiction',
            old_name='shoreline',
            new_name='geom',
        ),
        migrations.RenameField(
            model_name='lake',
            old_name='shoreline',
            new_name='geom',
        ),
        migrations.AddField(
            model_name='grid10',
            name='geom',
            field=django.contrib.gis.db.models.fields.MultiPolygonField(blank=True, null=True, srid=4326),
        ),
        migrations.AlterField(
            model_name='strain',
            name='slug',
            field=models.CharField(max_length=20, null=True, unique=True),
        ),
    ]
