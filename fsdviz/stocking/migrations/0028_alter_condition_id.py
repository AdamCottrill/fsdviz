# Generated by Django 4.2.11 on 2024-04-03 19:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("stocking", "0027_add_autofield_primary_key"),
    ]

    operations = [
        migrations.AlterField(
            model_name="condition",
            name="id",
            field=models.AutoField(primary_key=True, serialize=False),
        ),
    ]