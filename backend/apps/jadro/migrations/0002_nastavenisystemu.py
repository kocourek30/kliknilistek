from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("jadro", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="NastaveniSystemu",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("vytvoreno", models.DateTimeField(auto_now_add=True)),
                ("upraveno", models.DateTimeField(auto_now=True)),
                ("smtp_aktivni", models.BooleanField(default=False)),
                ("smtp_host", models.CharField(blank=True, max_length=255)),
                ("smtp_port", models.PositiveIntegerField(default=587)),
                ("smtp_uzivatel", models.CharField(blank=True, max_length=255)),
                ("smtp_heslo", models.CharField(blank=True, max_length=255)),
                ("smtp_use_tls", models.BooleanField(default=True)),
                ("smtp_use_ssl", models.BooleanField(default=False)),
                ("smtp_od_email", models.EmailField(blank=True, max_length=254)),
                ("smtp_od_jmeno", models.CharField(blank=True, max_length=255)),
                ("smtp_timeout", models.PositiveIntegerField(default=20)),
            ],
            options={
                "verbose_name": "Nastavení systému",
                "verbose_name_plural": "Nastavení systému",
            },
        ),
    ]
