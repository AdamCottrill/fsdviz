# Generated by Django 2.2.24 on 2022-02-15 15:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stocking', '0021_set_hatchery_active_flag'),
    ]

    operations = [
        migrations.AddField(
            model_name='datauploadevent',
            name='comment',
            field=models.TextField(blank=True, help_text='Data Upload Comment.', null=True),
        ),
    ]
