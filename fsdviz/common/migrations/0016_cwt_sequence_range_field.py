# Generated by Django 2.2 on 2020-08-06 19:02

import django.contrib.postgres.fields.ranges
import django.core.validators
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('common', '0015_cwt_unique_longer_slug'),
    ]

    operations = [
        migrations.AddField(
            model_name='cwtsequence',
            name='sequence',
            field=django.contrib.postgres.fields.ranges.IntegerRangeField(default=(0, 0), validators=[django.core.validators.MinValueValidator(0)]),
        ),
    ]
