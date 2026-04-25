from django.db import migrations, models


def dopln_demo_fakturaci(apps, schema_editor):
    Organizace = apps.get_model("organizace", "Organizace")
    organizace = Organizace.objects.filter(slug="dolni-kralovice").first()
    if not organizace:
        return
    if not organizace.kontaktni_email:
        organizace.kontaktni_email = "kultura@dolni-kralovice.cz"
    organizace.fakturacni_nazev = organizace.fakturacni_nazev or "Obec Dolní Kralovice"
    organizace.ico = organizace.ico or "00231868"
    organizace.fakturacni_ulice = organizace.fakturacni_ulice or "Dolní Kralovice 1"
    organizace.fakturacni_mesto = organizace.fakturacni_mesto or "Dolní Kralovice"
    organizace.fakturacni_psc = organizace.fakturacni_psc or "25768"
    organizace.cislo_uctu = organizace.cislo_uctu or "1265098001"
    organizace.kod_banky = organizace.kod_banky or "5500"
    organizace.save()


class Migration(migrations.Migration):
    dependencies = [
        ("organizace", "0001_initial"),
    ]

    operations = [
        migrations.AddField(model_name="organizace", name="cislo_uctu", field=models.CharField(blank=True, max_length=34)),
        migrations.AddField(model_name="organizace", name="dic", field=models.CharField(blank=True, max_length=16)),
        migrations.AddField(model_name="organizace", name="fakturacni_mesto", field=models.CharField(blank=True, max_length=128)),
        migrations.AddField(model_name="organizace", name="fakturacni_nazev", field=models.CharField(blank=True, max_length=255)),
        migrations.AddField(model_name="organizace", name="fakturacni_psc", field=models.CharField(blank=True, max_length=16)),
        migrations.AddField(model_name="organizace", name="fakturacni_ulice", field=models.CharField(blank=True, max_length=255)),
        migrations.AddField(model_name="organizace", name="iban", field=models.CharField(blank=True, max_length=34)),
        migrations.AddField(model_name="organizace", name="ico", field=models.CharField(blank=True, max_length=16)),
        migrations.AddField(model_name="organizace", name="kod_banky", field=models.CharField(blank=True, max_length=8)),
        migrations.AddField(model_name="organizace", name="swift", field=models.CharField(blank=True, max_length=16)),
        migrations.RunPython(dopln_demo_fakturaci, migrations.RunPython.noop),
    ]

