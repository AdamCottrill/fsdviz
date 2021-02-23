# Generated by Django 2.2.17 on 2021-02-18 16:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stocking', '0010_auto_20201124_1646'),
    ]

    operations = [
        migrations.AlterField(
            model_name='hatchery',
            name='hatchery_type',
            field=models.CharField(blank=True, choices=[('private', 'Private'), ('state', 'State'), ('provincial', 'Provincial'), ('federal', 'Federal'), ('tribal', 'Tribal'), ('other', 'Other')], max_length=25, null=True),
        ),
        migrations.AlterField(
            model_name='stockingevent',
            name='agency_stock_id',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='stockingevent',
            name='dd_lat',
            field=models.FloatField(blank=True, null=True, verbose_name='Reported latitude in decimal degrees'),
        ),
        migrations.AlterField(
            model_name='stockingevent',
            name='dd_lon',
            field=models.FloatField(blank=True, null=True, verbose_name='Reported ongitude in decimal degrees'),
        ),
    ]
