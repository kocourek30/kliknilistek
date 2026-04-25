from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("organizace", "0003_organizace_smtp"),
    ]

    operations = [
        migrations.AddField(
            model_name="organizace",
            name="logo_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="organizace",
            name="nazev_verejny",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="organizace",
            name="slug_subdomeny",
            field=models.SlugField(blank=True, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="organizace",
            name="tenant_aktivni",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="organizace",
            name="verejny_popis",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="organizace",
            name="vlastni_domena",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
