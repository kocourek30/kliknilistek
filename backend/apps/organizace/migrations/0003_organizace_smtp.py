from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("organizace", "0002_organizace_fakturacni_udaje"),
    ]

    operations = [
        migrations.AddField(model_name="organizace", name="smtp_aktivni", field=models.BooleanField(default=False)),
        migrations.AddField(model_name="organizace", name="smtp_host", field=models.CharField(blank=True, max_length=255)),
        migrations.AddField(model_name="organizace", name="smtp_od_email", field=models.EmailField(blank=True, max_length=254)),
        migrations.AddField(model_name="organizace", name="smtp_od_jmeno", field=models.CharField(blank=True, max_length=255)),
        migrations.AddField(model_name="organizace", name="smtp_port", field=models.PositiveIntegerField(default=587)),
        migrations.AddField(model_name="organizace", name="smtp_timeout", field=models.PositiveIntegerField(default=20)),
        migrations.AddField(model_name="organizace", name="smtp_use_ssl", field=models.BooleanField(default=False)),
        migrations.AddField(model_name="organizace", name="smtp_use_tls", field=models.BooleanField(default=True)),
        migrations.AddField(model_name="organizace", name="smtp_uzivatel", field=models.CharField(blank=True, max_length=255)),
        migrations.AddField(model_name="organizace", name="smtp_heslo", field=models.CharField(blank=True, max_length=255)),
    ]
