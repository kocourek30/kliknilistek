from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("objednavky", "0003_polozkaobjednavky_vybrana_mista"),
    ]

    operations = [
        migrations.AddField(
            model_name="objednavka",
            name="zpusob_uhrady",
            field=models.CharField(
                choices=[("online", "Online platba"), ("bankovni_prevod", "Bankovni prevod s QR")],
                default="online",
                max_length=32,
            ),
        ),
    ]

