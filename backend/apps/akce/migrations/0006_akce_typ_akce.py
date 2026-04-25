from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("akce", "0005_akce_schema_override_manualni_stavy_kategorie_povolene_zony"),
    ]

    operations = [
        migrations.AddField(
            model_name="akce",
            name="typ_akce",
            field=models.CharField(
                choices=[
                    ("koncert", "Koncert"),
                    ("divadlo", "Divadlo"),
                    ("kino", "Kino"),
                    ("prednaska", "Přednáška"),
                    ("ples", "Ples"),
                    ("detske", "Pro děti"),
                    ("komunitni", "Komunitní"),
                ],
                default="koncert",
                max_length=24,
            ),
        ),
    ]
