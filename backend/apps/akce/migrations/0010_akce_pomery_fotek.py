from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("akce", "0009_fotkaakce_je_doporucena"),
    ]

    operations = [
        migrations.AddField(
            model_name="akce",
            name="galerie_fotka_pomer",
            field=models.CharField(
                choices=[("kino", "Kino"), ("siroky", "Široký"), ("ctverec", "Čtverec")],
                default="siroky",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="akce",
            name="hlavni_fotka_pomer",
            field=models.CharField(
                choices=[("kino", "Kino"), ("siroky", "Široký"), ("ctverec", "Čtverec")],
                default="kino",
                max_length=16,
            ),
        ),
    ]
