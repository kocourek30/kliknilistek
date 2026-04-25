from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("organizace", "0002_organizace_fakturacni_udaje"),
        ("objednavky", "0004_objednavka_zpusob_uhrady"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProformaDoklad",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("vytvoreno", models.DateTimeField(auto_now_add=True)),
                ("upraveno", models.DateTimeField(auto_now=True)),
                ("cislo_dokladu", models.CharField(max_length=32, unique=True)),
                ("variabilni_symbol", models.CharField(max_length=20)),
                ("specificky_symbol", models.CharField(blank=True, max_length=20)),
                ("datum_vystaveni", models.DateField(default=django.utils.timezone.localdate)),
                ("datum_splatnosti", models.DateField()),
                ("castka", models.DecimalField(decimal_places=2, max_digits=10)),
                ("mena", models.CharField(default="CZK", max_length=3)),
                ("stav", models.CharField(choices=[("vystaveno", "Vystaveno"), ("zaplaceno", "Zaplaceno"), ("storno", "Storno")], default="vystaveno", max_length=24)),
                ("qr_platba_data", models.TextField(blank=True)),
                ("zprava_pro_prijemce", models.CharField(blank=True, max_length=255)),
                ("poznamka", models.TextField(blank=True)),
                ("uhrazeno_v", models.DateTimeField(blank=True, null=True)),
                ("objednavka", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="proforma_doklad", to="objednavky.objednavka")),
                ("organizace", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="organizace.organizace")),
                ("potvrzeno_uzivatelem", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="potvrzene_proformy", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-vytvoreno"]},
        ),
    ]

