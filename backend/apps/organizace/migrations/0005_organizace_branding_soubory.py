from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("organizace", "0004_organizace_tenant_kontext"),
    ]

    operations = [
        migrations.AddField(
            model_name="organizace",
            name="banner_popis",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="organizace",
            name="banner_soubor",
            field=models.FileField(blank=True, upload_to="organizace/banner/"),
        ),
        migrations.AddField(
            model_name="organizace",
            name="logo_soubor",
            field=models.FileField(blank=True, upload_to="organizace/logo/"),
        ),
    ]
