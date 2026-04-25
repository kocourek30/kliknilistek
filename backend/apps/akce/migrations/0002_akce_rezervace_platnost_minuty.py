from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("akce", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="akce",
            name="rezervace_platnost_minuty",
            field=models.PositiveIntegerField(default=15),
        ),
    ]
