from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("akce", "0007_mista_a_akce_fotky"),
    ]

    operations = [
        migrations.CreateModel(
            name="FotkaAkce",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("vytvoreno", models.DateTimeField(auto_now_add=True)),
                ("upraveno", models.DateTimeField(auto_now=True)),
                ("soubor", models.FileField(upload_to="akce-galerie/")),
                ("popis", models.CharField(blank=True, max_length=255)),
                ("poradi", models.PositiveIntegerField(default=0)),
                (
                    "akce",
                    models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="fotky_galerie", to="akce.akce"),
                ),
                (
                    "organizace",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="akce_fotkaakce_set",
                        to="organizace.organizace",
                    ),
                ),
            ],
            options={
                "ordering": ["poradi", "id"],
            },
        ),
    ]
