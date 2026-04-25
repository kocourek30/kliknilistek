from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("akce", "0006_akce_typ_akce"),
    ]

    operations = [
        migrations.AddField(
            model_name="akce",
            name="hlavni_fotka",
            field=models.FileField(blank=True, upload_to="akce/"),
        ),
        migrations.AddField(
            model_name="mistokonani",
            name="hlavni_fotka",
            field=models.FileField(blank=True, upload_to="mista-konani/"),
        ),
    ]
