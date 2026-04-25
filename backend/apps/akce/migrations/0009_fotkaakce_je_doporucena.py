from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("akce", "0008_fotkaakce"),
    ]

    operations = [
        migrations.AddField(
            model_name="fotkaakce",
            name="je_doporucena",
            field=models.BooleanField(default=False),
        ),
    ]
