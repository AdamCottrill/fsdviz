# Generated by Django 2.1.4 on 2019-01-23 19:06

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('common', '0009_auto_20190123_1403'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='cwt',
            name='agency',
        ),
    ]
