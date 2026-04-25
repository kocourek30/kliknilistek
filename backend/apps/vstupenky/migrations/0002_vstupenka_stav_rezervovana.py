from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("vstupenky", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="vstupenka",
            name="stav",
            field=models.CharField(
                choices=[
                    ("rezervovana", "Rezervovana"),
                    ("platna", "Platna"),
                    ("odbavena", "Odbavena"),
                    ("zrusena", "Zrusena"),
                    ("vracena", "Vracena"),
                ],
                default="rezervovana",
                max_length=24,
            ),
        ),
    ]
